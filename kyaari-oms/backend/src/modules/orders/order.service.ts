import { Order, OrderItem, VendorProfile, Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';
import { APP_CONSTANTS } from '../../config/constants';
import { notificationService } from '../notifications/notification.service';
import { NotificationPriority } from '@prisma/client';
import { 
  CreateOrderDto, 
  OrderDto, 
  OrderListDto, 
  OrderQueryDto,
  VendorSummaryDto,
  OrderItemDto,
  AssignedOrderItemDto
} from './order.dto';
import type { ParsedOrderData } from '../../services/excel.service';

type OrderWithDetails = Order & {
  primaryVendor: VendorProfile;
  items: Array<OrderItem & {
    assignedItems: Array<{
      id: string;
      vendorId: string;
      vendor: VendorProfile;
      assignedQuantity: number;
      confirmedQuantity: number | null;
      status: string;
      assignedAt: Date;
      vendorActionAt: Date | null;
    }>;
  }>;
  createdBy?: {
    id: string;
    name: string;
  } | null;
};

export class OrderService {
  
  async createOrder(data: CreateOrderDto, createdById: string): Promise<OrderDto> {
    try {
      await this.validateOrderData(data);
      
      const order = await this.createOrderWithTransaction(data, createdById);
      
      logger.info('Order created successfully', { 
        orderId: order.id, 
        orderNumber: data.orderNumber,
        itemCount: data.items.length,
        createdById 
      });

      // Send notification to primary vendor about new order assignment (URGENT priority)
      await this.sendOrderAssignmentNotification(order, data);
      
      // Send confirmation notification to admin who created the order
      await this.sendOrderCreationNotification(order, data, createdById);
      
      return await this.getOrderById(order.id);
    } catch (error) {
      logger.error('Failed to create order', { 
        error, 
        orderNumber: data.orderNumber,
        createdById 
      });
      throw error;
    }
  }

  async getOrderById(id: string): Promise<OrderDto> {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        primaryVendor: true,
        items: {
          include: {
            assignedItems: {
              include: {
                vendor: true
              }
            }
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Handle case where primaryVendor might be null
    if (!order.primaryVendor) {
      // If no primary vendor, we need to handle the DTO mapping differently
      const orderWithoutVendor = order as any;
      return this.mapToOrderDtoWithoutVendor(orderWithoutVendor);
    }

    return this.mapToOrderDto(order as OrderWithDetails);
  }

  async listOrders(query: OrderQueryDto): Promise<{ orders: OrderListDto[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      status,
      vendorId,
      search,
      startDate,
      endDate
    } = query;

    const offset = (page - 1) * limit;

    // Build where clause
    const where: Prisma.OrderWhereInput = {};

    if (status) {
      where.status = status as any;
    }

    if (vendorId) {
      where.primaryVendorId = vendorId;
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { primaryVendor: { companyName: { contains: search, mode: 'insensitive' } } }
      ];
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    // Get orders with count
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          primaryVendor: {
            select: {
              companyName: true
            }
          },
          items: {
            select: {
              id: true,
              pricePerUnit: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      }),
      prisma.order.count({ where })
    ]);

    const orderListDtos = orders.map(order => this.mapToOrderListDto(order));

    return { orders: orderListDtos, total };
  }

  private async validateOrderData(data: CreateOrderDto, excludeOrderId?: string): Promise<void> {
    // Check for duplicate order number (exclude current order when updating)
    const existingOrder = await prisma.order.findFirst({
      where: { 
        orderNumber: data.orderNumber,
        ...(excludeOrderId && { id: { not: excludeOrderId } })
      }
    });

    if (existingOrder) {
      throw new Error(`Order number ${data.orderNumber} already exists`);
    }

    // Validate all items have complete pricing
    for (const item of data.items) {
      if (!item.pricePerUnit || item.pricePerUnit <= 0) {
        throw new Error(`Item "${item.productName}" must have a valid price per unit`);
      }
      // Ensure calculated total is reasonable
      const calculatedTotal = item.pricePerUnit * item.quantity;
      if (calculatedTotal <= 0) {
        throw new Error(`Item "${item.productName}" has invalid total price calculation`);
      }
    }

    // Validate primary vendor exists and is active (only if vendorId is provided)
    if (data.primaryVendorId) {
      const vendor = await prisma.vendorProfile.findUnique({
        where: { id: data.primaryVendorId },
        include: { user: true }
      });

      if (!vendor) {
        throw new Error('Primary vendor not found');
      }

      if (vendor.user.status !== 'ACTIVE') {
        throw new Error('Primary vendor is not active');
      }

      if (!vendor.verified) {
        throw new Error('Primary vendor is not verified');
      }
    }
  }

  private async createOrderWithTransaction(data: CreateOrderDto, createdById: string): Promise<Order> {
    return await prisma.$transaction(async (tx) => {
      // Calculate total order value from items
      const totalOrderValue = data.items.reduce((sum, item) => {
        return sum + (item.pricePerUnit * item.quantity);
      }, 0);

      // Create order record
      const order = await tx.order.create({
        data: {
          clientOrderId: data.orderNumber,
          orderNumber: data.orderNumber,
          ...(data.primaryVendorId && { primaryVendorId: data.primaryVendorId }),
          status: 'RECEIVED',
          source: 'MANUAL_ENTRY',
          totalValue: totalOrderValue,
          createdById
        }
      });

      // Create order items with mandatory pricing
      for (const itemData of data.items) {
        const totalItemPrice = itemData.pricePerUnit * itemData.quantity;
        
        const orderItem = await tx.orderItem.create({
          data: {
            orderId: order.id,
            productName: itemData.productName,
            sku: itemData.sku,
            quantity: itemData.quantity,
            pricePerUnit: itemData.pricePerUnit, // Mandatory pricing
            totalPrice: totalItemPrice           // Calculated total
          }
        });

        // Auto-create assigned order item for primary vendor (only if vendorId is provided)
        if (data.primaryVendorId) {
          await tx.assignedOrderItem.create({
            data: {
              orderItemId: orderItem.id,
              vendorId: data.primaryVendorId,
              assignedQuantity: itemData.quantity,
              status: 'PENDING_CONFIRMATION',
              assignedById: createdById
            }
          });
        }
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          actorUserId: createdById,
          action: APP_CONSTANTS.AUDIT_ACTIONS.ORDER_CREATE,
          entityType: 'Order',
          entityId: order.id,
          metadata: {
            orderNumber: data.orderNumber,
            primaryVendorId: data.primaryVendorId || undefined,
            itemCount: data.items.length
          }
        }
      });

      return order;
    });
  }

  private mapToOrderDto(order: OrderWithDetails): OrderDto {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      source: order.source,
      primaryVendor: this.mapToVendorSummaryDto(order.primaryVendor),
      items: order.items.map(item => this.mapToOrderItemDto(item)),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      createdBy: order.createdBy ? {
        id: order.createdBy.id,
        name: order.createdBy.name
      } : undefined
    };
  }

  private mapToOrderDtoWithoutVendor(order: any): OrderDto {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      source: order.source,
      primaryVendor: {
        id: 'N/A',
        companyName: 'Not Assigned',
        contactPersonName: 'N/A',
        contactPhone: 'N/A'
      },
      items: order.items.map((item: any) => this.mapToOrderItemDto(item)),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      createdBy: order.createdBy ? {
        id: order.createdBy.id,
        name: order.createdBy.name
      } : undefined
    };
  }

  private mapToOrderItemDto(item: any): OrderItemDto {
    // Since pricing is now mandatory, we can ensure these values exist
    if (!item.pricePerUnit || !item.totalPrice) {
      throw new Error('Order item missing required pricing information');
    }
    
    return {
      id: item.id,
      productName: item.productName,
      sku: item.sku,
      quantity: item.quantity,
      pricePerUnit: parseFloat(item.pricePerUnit.toString()),
      totalPrice: parseFloat(item.totalPrice.toString()),
      pricingStatus: 'complete', // Always complete since pricing is mandatory
      assignedItems: item.assignedItems.map((assigned: any) => this.mapToAssignedOrderItemDto(assigned))
    };
  }

  private mapToAssignedOrderItemDto(assigned: any): AssignedOrderItemDto {
    return {
      id: assigned.id,
      vendorId: assigned.vendorId,
      vendor: this.mapToVendorSummaryDto(assigned.vendor),
      assignedQuantity: assigned.assignedQuantity,
      confirmedQuantity: assigned.confirmedQuantity,
      status: assigned.status,
      assignedAt: assigned.assignedAt,
      vendorActionAt: assigned.vendorActionAt
    };
  }

  private mapToVendorSummaryDto(vendor: VendorProfile): VendorSummaryDto {
    return {
      id: vendor.id,
      companyName: vendor.companyName,
      contactPersonName: vendor.contactPersonName,
      contactPhone: vendor.contactPhone
    };
  }

  private mapToOrderListDto(order: any): OrderListDto {
    // Since pricing is now mandatory, pricingStatus is always complete
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      itemCount: order.items.length,
      primaryVendor: {
        companyName: order.primaryVendor?.companyName || 'Not Assigned'
      },
      createdAt: order.createdAt,
      pricingStatus: 'complete' // Always complete since pricing is mandatory
    };
  }

  async updateOrder(orderId: string, data: CreateOrderDto, updatedById: string): Promise<OrderDto> {
    try {
      // Check if order exists
      const existingOrder = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              assignedItems: true
            }
          }
        }
      });

      if (!existingOrder) {
        throw new Error('Order not found');
      }

      // Only allow updates if order is in RECEIVED status
      if (existingOrder.status !== 'RECEIVED') {
        throw new Error(`Order with status ${existingOrder.status} cannot be updated. Only orders with RECEIVED status can be edited.`);
      }

      // Check if any items have been confirmed by vendor
      const hasConfirmedAssignments = existingOrder.items.some(item =>
        item.assignedItems.some(assigned => assigned.confirmedQuantity !== null)
      );

      if (hasConfirmedAssignments) {
        throw new Error('Order cannot be updated as vendor has already confirmed some items');
      }

      // Validate new order data (exclude current order from duplicate check)
      await this.validateOrderData(data, orderId);

      // Update order in transaction
      await prisma.$transaction(async (tx) => {
        // Delete existing assigned items
        for (const item of existingOrder.items) {
          await tx.assignedOrderItem.deleteMany({
            where: { orderItemId: item.id }
          });
        }

        // Delete existing order items
        await tx.orderItem.deleteMany({
          where: { orderId }
        });

        // Calculate total order value from new items
        const totalOrderValue = data.items.reduce((sum, item) => {
          return sum + (item.pricePerUnit * item.quantity);
        }, 0);

        // Update order
        await tx.order.update({
          where: { id: orderId },
          data: {
            orderNumber: data.orderNumber,
            ...(data.primaryVendorId && { primaryVendorId: data.primaryVendorId }),
            totalValue: totalOrderValue,
            updatedAt: new Date()
          }
        });

        // Create new order items
        for (const itemData of data.items) {
          const totalItemPrice = itemData.pricePerUnit * itemData.quantity;
          
          const orderItem = await tx.orderItem.create({
            data: {
              orderId,
              productName: itemData.productName,
              sku: itemData.sku,
              quantity: itemData.quantity,
              pricePerUnit: itemData.pricePerUnit,
              totalPrice: totalItemPrice
            }
          });

          // Auto-create assigned order item for vendor (only if vendorId is provided)
          if (data.primaryVendorId) {
            await tx.assignedOrderItem.create({
              data: {
                orderItemId: orderItem.id,
                vendorId: data.primaryVendorId,
                assignedQuantity: itemData.quantity,
                status: 'PENDING_CONFIRMATION',
                assignedById: updatedById
              }
            });
          }
        }

        // Create audit log
        await tx.auditLog.create({
          data: {
            actorUserId: updatedById,
            action: APP_CONSTANTS.AUDIT_ACTIONS.ORDER_UPDATE || 'ORDER_UPDATE',
            entityType: 'Order',
            entityId: orderId,
            metadata: {
              orderNumber: data.orderNumber,
              primaryVendorId: data.primaryVendorId || undefined,
              itemCount: data.items.length
            }
          }
        });
      });

      logger.info('Order updated successfully', { 
        orderId, 
        orderNumber: data.orderNumber,
        updatedById 
      });

      return await this.getOrderById(orderId);
    } catch (error) {
      logger.error('Failed to update order', { error, orderId });
      throw error;
    }
  }

  async deleteOrder(orderId: string, deletedById: string): Promise<void> {
    try {
      const orderMetadata = await prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
          where: { id: orderId },
          include: {
            items: {
              include: {
                assignedItems: true
              }
            }
          }
        });

        if (!order) {
          throw new Error('Order not found');
        }

        if (order.status !== 'RECEIVED') {
          throw new Error(`Order with status ${order.status} cannot be deleted. Only orders with RECEIVED status can be deleted.`);
        }

        const hasConfirmedAssignments = order.items.some(item =>
          item.assignedItems.some(assigned => assigned.confirmedQuantity !== null)
        );

        if (hasConfirmedAssignments) {
          throw new Error('Order cannot be deleted as it has confirmed vendor assignments');
        }

        // Delete assigned order items first
        for (const item of order.items) {
          await tx.assignedOrderItem.deleteMany({
            where: { orderItemId: item.id }
          });
        }

        // Delete order items
        await tx.orderItem.deleteMany({
          where: { orderId }
        });

        // Delete the order
        await tx.order.delete({
          where: { id: orderId }
        });

        // Create audit log
        await tx.auditLog.create({
          data: {
            actorUserId: deletedById,
            action: APP_CONSTANTS.AUDIT_ACTIONS.ORDER_DELETE,
            entityType: 'Order',
            entityId: orderId,
            metadata: {
              orderNumber: order.orderNumber,
              status: order.status
            }
          }
        });

        return { orderNumber: order.orderNumber };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

      logger.info('Order deleted successfully', {
        orderId,
        orderNumber: orderMetadata.orderNumber,
        deletedById
      });
    } catch (error) {
      // ... existing error handling ...
      logger.error('Failed to delete order', { error, orderId, deletedById });
      throw error;
    }
  }

  async assignVendorToOrder(orderId: string, vendorId: string, assignedById: string): Promise<OrderDto> {
    try {
      // Validate vendor exists and is active
      const vendor = await prisma.vendorProfile.findUnique({
        where: { id: vendorId },
        include: { user: true }
      });

      if (!vendor) {
        throw new Error('Vendor not found');
      }

      if (vendor.user.status !== 'ACTIVE') {
        throw new Error('Vendor is not active');
      }

      if (!vendor.verified) {
        throw new Error('Vendor is not verified');
      }

      // Get order with items
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              assignedItems: true
            }
          }
        }
      });

      if (!order) {
        throw new Error('Order not found');
      }

      // Update order in transaction
      await prisma.$transaction(async (tx) => {
        // Update primary vendor
        await tx.order.update({
          where: { id: orderId },
          data: {
            primaryVendorId: vendorId,
            status: 'ASSIGNED' // Update status to ASSIGNED
          }
        });

        // Delete existing assigned items for primary vendor and create new ones
        for (const item of order.items) {
          // Delete old assignments
          await tx.assignedOrderItem.deleteMany({
            where: { orderItemId: item.id }
          });

          // Create new assignment for the new vendor
          await tx.assignedOrderItem.create({
            data: {
              orderItemId: item.id,
              vendorId: vendorId,
              assignedQuantity: item.quantity,
              status: 'PENDING_CONFIRMATION',
              assignedById: assignedById
            }
          });
        }

        // Create audit log
        await tx.auditLog.create({
          data: {
            actorUserId: assignedById,
            action: 'ORDER_VENDOR_ASSIGN',
            entityType: 'Order',
            entityId: orderId,
            metadata: {
              orderNumber: order.orderNumber,
              vendorId: vendorId,
              vendorName: vendor.companyName
            }
          }
        });
      });

      logger.info('Vendor assigned to order successfully', { 
        orderId, 
        vendorId,
        assignedById 
      });

      // Return updated order
      return await this.getOrderById(orderId);
    } catch (error) {
      logger.error('Failed to assign vendor to order', { error, orderId, vendorId });
      throw error;
    }
  }

  private async sendOrderAssignmentNotification(order: Order, data: CreateOrderDto): Promise<void> {
    if (!data.primaryVendorId) {
      return; // Skip notification if no vendor assigned
    }

    try {
      const vendor = await prisma.vendorProfile.findUnique({
        where: { id: data.primaryVendorId }
      });

      if (!vendor) {
        return;
      }

      await notificationService.sendNotificationToUser(
        vendor.userId,
        {
          title: 'New Order Assigned',
          body: `You have been assigned a new order: ${data.orderNumber}`,
          priority: NotificationPriority.URGENT,
          data: {
            type: 'ORDER_ASSIGNMENT',
            orderId: order.id,
            orderNumber: data.orderNumber
          }
        }
      );
    } catch (error) {
      logger.error('Failed to send order assignment notification', { 
        orderId: order.id, 
        vendorId: data.primaryVendorId,
        error 
      });
      // Don't throw - notification failure shouldn't block order creation
    }
  }

  private async sendOrderCreationNotification(order: Order, data: CreateOrderDto, createdById: string): Promise<void> {
    try {
      await notificationService.sendNotificationToUser(
        createdById,
        {
          title: 'Order Created Successfully',
          body: `Order ${data.orderNumber} has been created and assigned to vendor. You will be notified when the vendor responds.`,
          priority: NotificationPriority.NORMAL,
          data: {
            type: 'ORDER_CREATED',
            orderId: order.id,
            orderNumber: data.orderNumber
          }
        }
      );
    } catch (error) {
      logger.error('Failed to send order creation notification', { 
        orderId: order.id, 
        createdById,
        error 
      });
      // Don't throw error as notification failure shouldn't fail order creation
    }
  }

  async createOrdersFromExcel(
    parsedOrders: ParsedOrderData[], 
    createdById: string
  ): Promise<{
    successCount: number;
    failedCount: number;
    errors: { orderNumber: string; error: string }[];
    createdOrders: OrderDto[];
  }> {
    const results = {
      successCount: 0,
      failedCount: 0,
      errors: [] as { orderNumber: string; error: string }[],
      createdOrders: [] as OrderDto[]
    };

    for (const orderData of parsedOrders) {
      try {
        // Convert to CreateOrderDto format
        const createOrderDto: CreateOrderDto = {
          orderNumber: orderData.orderNumber,
          primaryVendorId: orderData.vendorId || undefined,
          items: orderData.items
        };

        // Create the order
        const createdOrder = await this.createOrder(createOrderDto, createdById);
        
        results.successCount++;
        results.createdOrders.push(createdOrder);
        
        logger.info('Order created from Excel', { 
          orderNumber: orderData.orderNumber,
          itemCount: orderData.items.length,
          hasVendor: !!orderData.vendorId
        });
      } catch (error) {
        results.failedCount++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push({
          orderNumber: orderData.orderNumber,
          error: errorMessage
        });
        
        logger.error('Failed to create order from Excel', { 
          orderNumber: orderData.orderNumber,
          error: errorMessage 
        });
      }
    }

    logger.info('Excel upload completed', {
      total: parsedOrders.length,
      success: results.successCount,
      failed: results.failedCount
    });

    return results;
  }
}

export const orderService = new OrderService();