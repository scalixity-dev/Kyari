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
   */
  async generateInvoice(purchaseOrderId: string): Promise<InvoiceDto> {
    try {
      // Get purchase order with all related data
      const purchaseOrder = await this.getPurchaseOrderWithDetails(purchaseOrderId);
      
      if (!purchaseOrder) {
        throw new Error('Purchase order not found');
      }

      // Check if invoice already exists
      const existingInvoice = await prisma.vendorInvoice.findUnique({
        where: { purchaseOrderId }
      });

      if (existingInvoice) {
        throw new Error('Invoice already exists for this purchase order');
      }

      // Generate invoice data
      const invoiceData = this.prepareInvoiceTemplateData(purchaseOrder);
      
      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber(purchaseOrder.vendor.id);
      
      // Calculate total amount
      const totalAmount = purchaseOrder.items.reduce((sum, item) => sum + item.totalPrice, 0);

      // Create invoice in database
      const invoice = await prisma.vendorInvoice.create({
        data: {
          purchaseOrderId,
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

      // Generate JSON invoice file
      const jsonContent = await this.generateJsonInvoice(invoiceData, invoiceNumber);
      
      // Upload to S3
      const fileName = `invoices/${invoiceNumber}.json`;
      const fileResult = await s3Service.uploadBuffer(
        Buffer.from(JSON.stringify(jsonContent, null, 2)),
        `${invoiceNumber}.json`,
        'application/json',
        'invoices'
      );

      // Create attachment record
      const attachment = await prisma.attachment.create({
        data: {
          fileName: `${invoiceNumber}.json`,
          originalName: `${invoiceNumber}.json`,
          fileType: 'json',
          mimeType: 'application/json',
          fileSize: Buffer.byteLength(JSON.stringify(jsonContent)),
          s3Key: fileResult.key,
          s3Url: fileResult.url,
          uploadedBy: 'system' // System-generated
        }
      });

      // Link attachment to invoice
      await prisma.vendorInvoice.update({
        where: { id: invoice.id },
        data: { attachmentId: attachment.id }
      });

      // Log invoice generation
      logger.info('Invoice generated successfully', {
        invoiceId: invoice.id,
        invoiceNumber,
        purchaseOrderId,
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
              purchaseOrderId,
              invoiceId: invoice.id,
              invoiceNumber,
              amount: totalAmount.toString(),
              vendorName: purchaseOrder.vendor.companyName,
              deepLink: `/vendor/orders/${purchaseOrderId}/invoice`
            }
          }
        );
      } catch (notificationError) {
        // Don't fail the invoice generation if notification fails
        logger.warn('Failed to send PO creation notification', { 
          notificationError, 
          purchaseOrderId, 
          vendorId: purchaseOrder.vendor.id 
        });
      }

      return this.mapToInvoiceDto(invoice);
    } catch (error) {
      logger.error('Invoice generation failed', { error, purchaseOrderId });
      throw error;
    }
  }

  /**
   * Get invoice by ID
   */
  async getInvoiceById(id: string): Promise<InvoiceDto> {
    const invoice = await prisma.vendorInvoice.findUnique({
      where: { id },
      include: {
        purchaseOrder: {
          include: {
            vendor: true
          }
        },
        attachment: true
      }
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    return this.mapToInvoiceDto(invoice);
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
          attachment: true
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
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt
    };
  }
}

export const invoiceService = new InvoiceService();