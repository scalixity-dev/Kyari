import { Order, OrderItem, VendorProfile, Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';
import { APP_CONSTANTS } from '../../config/constants';
import { 
  CreateOrderDto, 
  OrderDto, 
  OrderListDto, 
  OrderQueryDto,
  VendorSummaryDto,
  OrderItemDto,
  AssignedOrderItemDto
} from './order.dto';

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

  private async validateOrderData(data: CreateOrderDto): Promise<void> {
    // Check if order number already exists
    const existingOrder = await prisma.order.findUnique({
      where: { orderNumber: data.orderNumber }
    });

    if (existingOrder) {
      throw new Error(`Order number ${data.orderNumber} already exists`);
    }

    // Validate primary vendor exists and is active
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

  private async createOrderWithTransaction(data: CreateOrderDto, createdById: string): Promise<Order> {
    return await prisma.$transaction(async (tx) => {
      // Create order record
      const order = await tx.order.create({
        data: {
          clientOrderId: data.orderNumber, // Use orderNumber as clientOrderId
          orderNumber: data.orderNumber,
          primaryVendorId: data.primaryVendorId,
          status: 'RECEIVED',
          source: 'MANUAL_ENTRY',
          totalValue: null, // No pricing initially
          createdById
        }
      });

      // Create order items
      for (const itemData of data.items) {
        const orderItem = await tx.orderItem.create({
          data: {
            orderId: order.id,
            productName: itemData.productName,
            sku: itemData.sku,
            quantity: itemData.quantity,
            pricePerUnit: null, // No pricing initially
            totalPrice: null    // No pricing initially
          }
        });

        // Auto-create assigned order item for primary vendor
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

      // Create audit log
      await tx.auditLog.create({
        data: {
          actorUserId: createdById,
          action: APP_CONSTANTS.AUDIT_ACTIONS.ORDER_CREATE,
          entityType: 'Order',
          entityId: order.id,
          metadata: {
            orderNumber: data.orderNumber,
            primaryVendorId: data.primaryVendorId,
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

  private mapToOrderItemDto(item: any): OrderItemDto {
    const pricingStatus = this.determinePricingStatus(item.pricePerUnit, item.totalPrice);
    
    return {
      id: item.id,
      productName: item.productName,
      sku: item.sku,
      quantity: item.quantity,
      pricingStatus,
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
    const pricingStatus = this.determineOrderPricingStatus(order.items);
    
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      itemCount: order.items.length,
      primaryVendor: {
        companyName: order.primaryVendor.companyName
      },
      createdAt: order.createdAt,
      pricingStatus
    };
  }

  private determinePricingStatus(pricePerUnit: number | null, totalPrice: number | null): 'not_set' | 'partial' | 'complete' {
    if (!pricePerUnit && !totalPrice) return 'not_set';
    if (pricePerUnit && totalPrice) return 'complete';
    return 'partial';
  }

  private determineOrderPricingStatus(items: any[]): 'pending' | 'partial' | 'complete' {
    if (items.length === 0) return 'pending';
    
    const itemsWithPricing = items.filter(item => item.pricePerUnit !== null);
    
    if (itemsWithPricing.length === 0) return 'pending';
    if (itemsWithPricing.length === items.length) return 'complete';
    return 'partial';
  }
}

export const orderService = new OrderService();