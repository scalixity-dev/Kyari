import { VendorInvoice, PurchaseOrder, Prisma, VendorProfile } from '@prisma/client';
import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';
import { APP_CONSTANTS } from '../../config/constants';
import { InvoiceDto, CreateInvoiceDto, InvoiceTemplateData } from './invoice.dto';
import s3Service from '../../services/s3.service';
import { notificationService } from '../notifications/notification.service';

type PurchaseOrderWithDetails = PurchaseOrder & {
  vendor: VendorProfile;
  items: Array<{
    id: string;
    assignedOrderItem: {
      id: string;
      assignedQuantity: number;
      confirmedQuantity: number | null;
      orderItem: {
        id: string;
        productName: string;
        sku: string | null;
        quantity: number;
        pricePerUnit: number;
        totalPrice: number;
      };
    };
    quantity: number;
    pricePerUnit: number;
    totalPrice: number;
  }>;
};

export class InvoiceService {
  
  /**
   * Generate automated invoice for a purchase order
   * If purchase order doesn't exist, create it from confirmed assignments
   */
  async generateInvoice(orderId: string, vendorId: string): Promise<InvoiceDto & { jsonContent?: Record<string, unknown>; alreadyExists?: boolean }> {
    try {
      // Try to find existing PO by orderId and vendorId
      let purchaseOrder = await this.findPurchaseOrderByOrderAndVendor(orderId, vendorId);
      
      if (!purchaseOrder) {
        // Not found, try to create from confirmed assignments
        purchaseOrder = await this.createPurchaseOrderFromAssignments(orderId, vendorId);
        if (!purchaseOrder) {
          throw new Error('Purchase order not found and could not be created');
        }
      }

      // Check if invoice already exists
      const existingInvoice = await prisma.vendorInvoice.findUnique({
        where: { purchaseOrderId: purchaseOrder.id },
        include: {
          purchaseOrder: {
            include: {
              vendor: true
            }
          },
          accountsAttachment: true,
          vendorAttachment: true
        }
      });

      if (existingInvoice) {
        // Invoice exists, return it with JSON content instead of throwing error
        logger.info('Invoice already exists, returning existing invoice', {
          invoiceId: existingInvoice.id,
          purchaseOrderId: purchaseOrder.id
        });

        // Regenerate JSON content from purchase order data
        const invoiceData = this.prepareInvoiceTemplateData(purchaseOrder);
        const jsonContent = await this.generateJsonInvoice(invoiceData, existingInvoice.invoiceNumber);

        const existingDto = this.mapToInvoiceDto(existingInvoice);
        return {
          ...existingDto,
          jsonContent,
          alreadyExists: true // Flag to indicate this is an existing invoice
        };
      }

      // Generate invoice data
      const invoiceData = this.prepareInvoiceTemplateData(purchaseOrder);
      
      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber(purchaseOrder.vendor.id);
      
      // Calculate total amount
      const totalAmount = purchaseOrder.items.reduce((sum, item) => sum + item.totalPrice, 0);

      // Create invoice in database (without attachment for now)
      const invoice = await prisma.vendorInvoice.create({
        data: {
          purchaseOrderId: purchaseOrder.id,
          invoiceNumber,
          invoiceDate: new Date(),
          invoiceAmount: totalAmount,
          status: 'PENDING_VERIFICATION'
        },
        include: {
          purchaseOrder: {
            include: {
              vendor: true
            }
          }
        }
      });

      // Generate JSON invoice content (to be downloaded by frontend)
      const jsonContent = await this.generateJsonInvoice(invoiceData, invoiceNumber);
      
      // Note: We're NOT uploading to S3 here
      // The JSON will be downloaded by the frontend
      // Later, accounts team will upload the actual invoice file which will then go to S3

      // Log invoice generation
      logger.info('Invoice generated successfully', {
        invoiceId: invoice.id,
        invoiceNumber,
        purchaseOrderId: purchaseOrder.id,
        amount: totalAmount
      });

      // Send notification to vendor about PO creation
      try {
        await notificationService.sendNotificationToUser(
          purchaseOrder.vendor.userId,
          {
            title: 'New Purchase Order Ready',
            body: `Purchase Order ${invoiceNumber} has been generated. Amount: ₹${totalAmount.toLocaleString('en-IN')}`,
            priority: 'NORMAL' as const,
            data: {
              type: 'PO_CREATED',
              purchaseOrderId: purchaseOrder.id,
              invoiceId: invoice.id,
              invoiceNumber,
              amount: totalAmount.toString(),
              vendorName: purchaseOrder.vendor.companyName,
              deepLink: `/vendor/orders/${purchaseOrder.id}/invoice`
            }
          }
        );
      } catch (notificationError) {
        // Don't fail the invoice generation if notification fails
        logger.warn('Failed to send PO creation notification', { 
          notificationError, 
          purchaseOrderId: purchaseOrder.id, 
          vendorId: purchaseOrder.vendor.id 
        });
      }

      // Return invoice DTO with JSON content for download
      const invoiceDto = this.mapToInvoiceDto(invoice);
      return {
        ...invoiceDto,
        jsonContent // Include the JSON content for frontend download
      };
    } catch (error) {
      logger.error('Invoice generation failed', { 
        error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
        orderId,
        vendorId 
      });
      throw error;
    }
  }

  /**
   * Get invoice by ID
   */
  async getInvoiceById(id: string): Promise<InvoiceDto & { jsonContent?: Record<string, unknown> }> {
    const invoice = await prisma.vendorInvoice.findUnique({
      where: { id },
      include: {
        purchaseOrder: {
          include: {
            vendor: true,
            items: {
              include: {
                assignedOrderItem: {
                  include: {
                    orderItem: true
                  }
                }
              }
            }
          }
        },
        accountsAttachment: true,
        vendorAttachment: true
      }
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Generate JSON content from purchase order data
    const invoiceData = this.prepareInvoiceTemplateData(invoice.purchaseOrder as any);
    const jsonContent = await this.generateJsonInvoice(invoiceData, invoice.invoiceNumber);

    const dto = this.mapToInvoiceDto(invoice);
    return {
      ...dto,
      jsonContent
    };
  }

  /**
   * List invoices with pagination and filters
   */
  async listInvoices(query: {
    page?: number;
    limit?: number;
    status?: string;
    vendorId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{ invoices: InvoiceDto[]; total: number }> {
    const { page = 1, limit = 10, status, vendorId, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.VendorInvoiceWhereInput = {};

    if (status) {
      where.status = status as any;
    }

    if (vendorId) {
      where.purchaseOrder = { vendorId };
    }

    if (startDate || endDate) {
      where.invoiceDate = {};
      if (startDate) where.invoiceDate.gte = startDate;
      if (endDate) where.invoiceDate.lte = endDate;
    }

    const [invoices, total] = await Promise.all([
      prisma.vendorInvoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          purchaseOrder: {
            include: {
              vendor: true
            }
          },
          accountsAttachment: true,
          vendorAttachment: true
        }
      }),
      prisma.vendorInvoice.count({ where })
    ]);

    return {
      invoices: invoices.map(invoice => this.mapToInvoiceDto(invoice)),
      total
    };
  }

  /**
   * Find existing purchase order by orderId and vendorId
   */
  private async findPurchaseOrderByOrderAndVendor(orderId: string, vendorId: string): Promise<PurchaseOrderWithDetails | null> {
    try {
      // Get the order to find its order number
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { orderNumber: true }
      });

      if (!order) {
        return null;
      }

      // Find PO by vendorId and order number
      const po = await prisma.purchaseOrder.findFirst({
        where: {
          vendorId,
          poNumber: {
            contains: order.orderNumber
          }
        },
        include: {
          vendor: true,
          items: {
            include: {
              assignedOrderItem: {
                include: {
                  orderItem: true
                }
              }
            }
          }
        }
      });

      return po as PurchaseOrderWithDetails | null;
    } catch (error) {
      logger.error('Failed to find PO by order and vendor', { 
        error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
        orderId,
        vendorId 
      });
      return null;
    }
  }

  /**
   * Create purchase order from confirmed assignments
   * This bridges the gap when PO doesn't exist but assignments are confirmed
   */
  private async createPurchaseOrderFromAssignments(orderId: string, vendorId: string): Promise<PurchaseOrderWithDetails | null> {
    try {
      logger.info('Creating PO from assignments', { orderId, vendorId });

      // Get the order to find its order number
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { orderNumber: true }
      });

      if (!order) {
        logger.warn('Order not found', { orderId });
        return null;
      }

      const orderNumber = order.orderNumber;

      // Get confirmed assignments for this order and vendor
      const assignments = await prisma.assignedOrderItem.findMany({
        where: {
          vendorId,
          status: { in: ['VENDOR_CONFIRMED_FULL', 'VENDOR_CONFIRMED_PARTIAL'] },
          orderItem: {
            orderId
          }
        },
        include: {
          orderItem: {
            include: {
              order: true
            }
          }
        }
      });

      logger.info('Found assignments for PO creation', { 
        orderId,
        vendorId, 
        assignmentsCount: assignments.length 
      });

      if (assignments.length === 0) {
        logger.warn('No confirmed assignments found', { orderId, vendorId });
        return null;
      }
      const vendor = await prisma.vendorProfile.findUnique({
        where: { id: vendorId },
        include: { user: true }
      });

      if (!vendor) {
        return null;
      }
      
      // Generate PO number
      const poNumber = `PO-${orderNumber}-${vendorId.substring(0, 6).toUpperCase()}`;
      
      // Calculate total amount and prepare items
      let totalAmount = 0;
      const items = assignments.map(a => {
        const pricePerUnit = a.orderItem.pricePerUnit ? Number(a.orderItem.pricePerUnit) : 0;
        const quantity = a.confirmedQuantity || a.assignedQuantity;
        totalAmount += pricePerUnit * quantity;
        return {
          assignedOrderItemId: a.id,
          quantity,
          pricePerUnit,
          totalPrice: pricePerUnit * quantity,
          sku: a.orderItem.sku || 'N/A',
          productName: a.orderItem.productName
        };
      });

      // Prepare PO JSON data
      const poJson = {
        poNumber,
        vendor: {
          id: vendor.id,
          companyName: vendor.companyName,
          contactPersonName: vendor.contactPersonName,
          contactPhone: vendor.contactPhone
        },
        items: items.map(item => ({
          sku: item.sku,
          productName: item.productName,
          quantity: item.quantity,
          pricePerUnit: item.pricePerUnit,
          totalPrice: item.totalPrice
        })),
        totalAmount,
        issuedAt: new Date().toISOString()
      };

      // Get system/accounts user for creation (TODO: Pass from auth context)
      const accountsUser = await prisma.user.findFirst({
        where: { 
          roles: {
            some: {
              role: {
                name: 'ACCOUNTS'
              }
            }
          }
        }
      });

      if (!accountsUser) {
        throw new Error('No accounts user found to create PO');
      }

      // Create purchase order
      const purchaseOrder = await prisma.purchaseOrder.create({
        data: {
          poNumber,
          vendorId,
          totalAmount,
          status: 'ISSUED',
          issuedAt: new Date(),
          poJson,
          createdById: accountsUser.id,
          items: {
            create: items.map(item => ({
              assignedOrderItemId: item.assignedOrderItemId,
              quantity: item.quantity,
              pricePerUnit: item.pricePerUnit,
              totalPrice: item.totalPrice
            }))
          }
        }
      });

      // Fetch with full details
      return await this.getPurchaseOrderWithDetails(purchaseOrder.id);
    } catch (error) {
      logger.error('Failed to create PO from assignments', { 
        error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
        orderId,
        vendorId 
      });
      return null;
    }
  }

  /**
   * Get purchase order with all details needed for invoice generation
   */
  private async getPurchaseOrderWithDetails(purchaseOrderId: string): Promise<PurchaseOrderWithDetails | null> {
    return await prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: {
        vendor: true,
        items: {
          include: {
            assignedOrderItem: {
              include: {
                orderItem: true
              }
            }
          }
        }
      }
    }) as PurchaseOrderWithDetails | null;
  }

  /**
   * Prepare template data for invoice generation
   */
  private prepareInvoiceTemplateData(purchaseOrder: PurchaseOrderWithDetails): InvoiceTemplateData {
    return {
      vendor: {
        id: purchaseOrder.vendor.id,
        companyName: purchaseOrder.vendor.companyName || 'N/A',
        contactPersonName: purchaseOrder.vendor.contactPersonName,
        contactPhone: purchaseOrder.vendor.contactPhone,
        warehouseLocation: purchaseOrder.vendor.warehouseLocation,
        gstNumber: purchaseOrder.vendor.gstNumber,
        panNumber: purchaseOrder.vendor.panNumber
      },
      purchaseOrder: {
        id: purchaseOrder.id,
        poNumber: purchaseOrder.poNumber,
        status: purchaseOrder.status,
        totalAmount: parseFloat(purchaseOrder.totalAmount.toString()),
        issuedAt: purchaseOrder.issuedAt
      },
      items: purchaseOrder.items.map(item => ({
        id: item.id,
        productName: item.assignedOrderItem.orderItem.productName,
        sku: item.assignedOrderItem.orderItem.sku,
        orderedQuantity: item.assignedOrderItem.assignedQuantity,
        confirmedQuantity: item.assignedOrderItem.confirmedQuantity || item.assignedOrderItem.assignedQuantity,
        unitPrice: parseFloat(item.pricePerUnit.toString()),
        totalPrice: parseFloat(item.totalPrice.toString())
      })),
      totals: {
        subtotal: parseFloat(purchaseOrder.totalAmount.toString()),
        totalAmount: parseFloat(purchaseOrder.totalAmount.toString())
      }
    };
  }

  /**
   * Generate unique invoice number
   */
  private async generateInvoiceNumber(vendorId: string): Promise<string> {
    const vendor = await prisma.vendorProfile.findUnique({
      where: { id: vendorId }
    });

    if (!vendor) {
      throw new Error('Vendor not found');
    }

    // Get vendor prefix (first 3 letters of company name or 'VEN')
    const companyPrefix = vendor.companyName 
      ? vendor.companyName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X')
      : 'VEN';

    // Get current date for invoice numbering
    const now = new Date();
    const year = now.getFullYear().toString().substring(2); // Last 2 digits of year
    const month = (now.getMonth() + 1).toString().padStart(2, '0');

    // Get next sequence number for this vendor and month
    const lastInvoice = await prisma.vendorInvoice.findFirst({
      where: {
        invoiceNumber: {
          startsWith: `INV-${companyPrefix}-${year}${month}`
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    let sequence = 1;
    if (lastInvoice) {
      const lastSequence = parseInt(lastInvoice.invoiceNumber.split('-').pop() || '0');
      sequence = lastSequence + 1;
    }

    return `INV-${companyPrefix}-${year}${month}-${sequence.toString().padStart(4, '0')}`;
  }

  /**
   * Generate JSON invoice content
   */
  private async generateJsonInvoice(data: InvoiceTemplateData, invoiceNumber: string): Promise<any> {
    return {
      invoice: {
        number: invoiceNumber,
        date: new Date().toISOString(),
        type: 'VENDOR_INVOICE',
        status: 'PENDING_VERIFICATION'
      },
      vendor: data.vendor,
      purchaseOrder: data.purchaseOrder,
      items: data.items,
      totals: data.totals,
      metadata: {
        generatedAt: new Date().toISOString(),
        generatedBy: 'system',
        version: '1.0'
      }
    };
  }

  /**
   * Map database record to DTO
   */
  private mapToInvoiceDto(invoice: any): InvoiceDto {
    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate,
      invoiceAmount: parseFloat(invoice.invoiceAmount.toString()),
      status: invoice.status,
      purchaseOrder: {
        id: invoice.purchaseOrder.id,
        poNumber: invoice.purchaseOrder.poNumber,
        vendor: {
          id: invoice.purchaseOrder.vendor.id,
          companyName: invoice.purchaseOrder.vendor.companyName || 'N/A',
          contactPersonName: invoice.purchaseOrder.vendor.contactPersonName
        }
      },
      attachment: invoice.attachment ? {
        id: invoice.attachment.id,
        fileName: invoice.attachment.fileName,
        s3Url: invoice.attachment.s3Url
      } : null,
      accountsAttachment: invoice.accountsAttachment ? {
        id: invoice.accountsAttachment.id,
        fileName: invoice.accountsAttachment.fileName,
        s3Url: invoice.accountsAttachment.s3Url
      } : null,
      vendorAttachment: invoice.vendorAttachment ? {
        id: invoice.vendorAttachment.id,
        fileName: invoice.vendorAttachment.fileName,
        s3Url: invoice.vendorAttachment.s3Url
      } : null,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt
    };
  }
}

export const invoiceService = new InvoiceService();