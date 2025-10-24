import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';
import { 
  OrderTrackingItemDto, 
  OrderTrackingQueryDto, 
  OrderTrackingResponseDto,
  OrderTrackingSummaryDto,
  OrderTrackingFiltersDto,
  OrderStatusUpdateDto,
  OrderTrackingStatus,
  ORDER_TRACKING_STATUS_MAP
} from './order-tracking.dto';
import { OrderStatus, AssignmentStatus, Prisma } from '@prisma/client';

export class OrderTrackingService {
  
  /**
   * Get order tracking data with filters and pagination
   */
  async getOrderTracking(query: OrderTrackingQueryDto): Promise<OrderTrackingResponseDto> {
    try {
      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', filters = {} } = query;
      const skip = (page - 1) * limit;

      // Build where clause based on filters
      const whereClause = this.buildWhereClause(filters);
      
      logger.info('Order tracking query debug', {
        query,
        filters,
        whereClause,
        skip,
        limit
      });

      // Get total count for pagination
      const total = await prisma.orderItem.count({
        where: whereClause
      });
      
      logger.info('Order tracking total count', { total });

      // Get order items with related data - simplified query similar to summary
      const orderItems = await prisma.orderItem.findMany({
        where: whereClause,
        include: {
          order: {
            include: {
              primaryVendor: {
                select: {
                  id: true,
                  companyName: true,
                  contactPersonName: true,
                  contactPhone: true
                }
              }
            }
          },
          assignedItems: {
            include: {
              vendor: {
                select: {
                  id: true,
                  companyName: true,
                  contactPersonName: true,
                  contactPhone: true
                }
              }
            },
            orderBy: {
              assignedAt: 'desc'
            }
          }
        },
        orderBy: { order: { createdAt: sortOrder } }, // Simplified ordering
        skip,
        take: limit
      });

      logger.info('Order tracking query result', { 
        orderItemsCount: orderItems.length,
        orderItemsIds: orderItems.map(item => item.id)
      });

      // Transform to DTOs
      const orders = [];
      for (const item of orderItems) {
        try {
          const transformedItem = this.transformToOrderTrackingDto(item);
          orders.push(transformedItem);
        } catch (error) {
          logger.error('Failed to transform order item to DTO', { 
            error: error instanceof Error ? error.message : error, 
            orderItemId: item.id,
            hasOrder: !!item.order 
          });
          // Continue with other items instead of throwing
          continue;
        }
      }
      
      logger.info('Order tracking transformation result', { 
        originalCount: orderItems.length,
        transformedCount: orders.length,
        transformedIds: orders.map(o => o.id)
      });

      // Get summary data
      const summary = await this.getOrderTrackingSummary();

      const totalPages = Math.ceil(total / limit);

      const response = {
        success: true,
        data: {
          orders,
          total,
          page,
          limit,
          totalPages,
          summary
        },
        message: `Found ${total} orders`
      };
      
      logger.info('Order tracking final response', { 
        ordersCount: orders.length,
        total,
        page,
        limit,
        totalPages
      });
      
      return response;

    } catch (error) {
      logger.error('Failed to get order tracking data', { error, query });
      throw error;
    }
  }

  /**
   * Get order tracking summary with status counts
   */
  async getOrderTrackingSummary(): Promise<OrderTrackingSummaryDto> {
    try {
      // Get all order items with their latest assignment status
      const orderItems = await prisma.orderItem.findMany({
        include: {
          order: {
            include: {
              primaryVendor: {
                select: {
                  id: true,
                  companyName: true,
                  contactPersonName: true,
                  contactPhone: true
                }
              }
            }
          },
          assignedItems: {
            orderBy: {
              assignedAt: 'desc'
            },
            take: 1
          }
        }
      });

      // Transform to tracking status and count
      const statusCounts: Record<OrderTrackingStatus, number> = {
        'Received': 0,
        'Assigned': 0,
        'Confirmed': 0,
        'Invoiced': 0,
        'Dispatched': 0,
        'Verified': 0,
        'Paid': 0
      };

      const recentOrders: OrderTrackingItemDto[] = [];

      for (const item of orderItems) {
        try {
          const trackingStatus = this.determineTrackingStatus(item);
          statusCounts[trackingStatus]++;

          // Add to recent orders (limit to 10)
          if (recentOrders.length < 10) {
            const dto = this.transformToOrderTrackingDto(item);
            recentOrders.push(dto);
          }
        } catch (error) {
          logger.error('Failed to process order item in summary', { 
            error: error instanceof Error ? error.message : error, 
            orderItemId: item.id,
            hasOrder: !!item.order 
          });
          // Skip this item and continue with others
          continue;
        }
      }

      return {
        totalOrders: orderItems.length,
        statusCounts,
        recentOrders
      };

    } catch (error) {
      logger.error('Failed to get order tracking summary', { error });
      throw error;
    }
  }

  /**
   * Update order status (for drag and drop functionality)
   */
  async updateOrderStatus(updateData: OrderStatusUpdateDto, userId: string): Promise<OrderTrackingItemDto> {
    try {
      const { orderItemId, newStatus, remarks } = updateData;

      // Find the order item
      const orderItem = await prisma.orderItem.findUnique({
        where: { id: orderItemId },
        include: {
          order: {
            include: {
              primaryVendor: {
                select: {
                  id: true,
                  companyName: true,
                  contactPersonName: true,
                  contactPhone: true
                }
              }
            }
          },
          assignedItems: {
            include: {
              vendor: {
                select: {
                  id: true,
                  companyName: true,
                  contactPersonName: true,
                  contactPhone: true
                }
              }
            },
            orderBy: {
              assignedAt: 'desc'
            }
          }
        }
      });

      if (!orderItem) {
        throw new Error('Order item not found');
      }

      // Update based on the new status
      await this.updateOrderItemStatus(orderItem, newStatus, remarks, userId);

      // Get updated order item
      const updatedOrderItem = await prisma.orderItem.findUnique({
        where: { id: orderItemId },
        include: {
          order: {
            include: {
              primaryVendor: {
                select: {
                  id: true,
                  companyName: true,
                  contactPersonName: true,
                  contactPhone: true
                }
              }
            }
          },
          assignedItems: {
            include: {
              vendor: {
                select: {
                  id: true,
                  companyName: true,
                  contactPersonName: true,
                  contactPhone: true
                }
              }
            },
            orderBy: {
              assignedAt: 'desc'
            }
          }
        }
      });

      if (!updatedOrderItem) {
        throw new Error('Failed to retrieve updated order item');
      }

      return this.transformToOrderTrackingDto(updatedOrderItem);

    } catch (error) {
      logger.error('Failed to update order status', { error, updateData, userId });
      throw error;
    }
  }

  /**
   * Get order details by ID
   */
  async getOrderById(orderId: string): Promise<OrderTrackingItemDto | null> {
    try {
      const orderItem = await prisma.orderItem.findUnique({
        where: { id: orderId },
        include: {
          order: {
            include: {
              primaryVendor: {
                select: {
                  id: true,
                  companyName: true,
                  contactPersonName: true,
                  contactPhone: true
                }
              }
            }
          },
          assignedItems: {
            include: {
              vendor: {
                select: {
                  id: true,
                  companyName: true,
                  contactPersonName: true,
                  contactPhone: true
                }
              }
            },
            orderBy: {
              assignedAt: 'desc'
            }
          }
        }
      });

      if (!orderItem) {
        return null;
      }

      return this.transformToOrderTrackingDto(orderItem);

    } catch (error) {
      logger.error('Failed to get order by ID', { error, orderId });
      throw error;
    }
  }

  /**
   * Build where clause for filtering
   */
  private buildWhereClause(filters: OrderTrackingFiltersDto): Prisma.OrderItemWhereInput {
    const where: Prisma.OrderItemWhereInput = {};

    // Vendor filter
    if (filters.vendor) {
      where.order = {
        primaryVendor: {
          companyName: {
            contains: filters.vendor,
            mode: 'insensitive'
          }
        }
      };
    }

    // Quantity range filter
    if (filters.qtyMin !== undefined || filters.qtyMax !== undefined) {
      where.quantity = {};
      if (filters.qtyMin !== undefined) {
        where.quantity.gte = filters.qtyMin;
      }
      if (filters.qtyMax !== undefined) {
        where.quantity.lte = filters.qtyMax;
      }
    }

    // Date range filter
    if (filters.dateFrom || filters.dateTo) {
      const orderFilter: any = {};
      if (filters.dateFrom) {
        orderFilter.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        orderFilter.lte = filters.dateTo;
      }
      where.order = {
        ...where.order,
        createdAt: orderFilter
      };
    }

    // Search filter
    if (filters.search) {
      where.OR = [
        {
          productName: {
            contains: filters.search,
            mode: 'insensitive'
          }
        },
        {
          sku: {
            contains: filters.search,
            mode: 'insensitive'
          }
        },
        {
          order: {
            orderNumber: {
              contains: filters.search,
              mode: 'insensitive'
            }
          }
        }
      ];
    }

    // Status filter - this is complex as we need to check assignment status
    if (filters.status) {
      const assignmentStatus = this.mapTrackingStatusToAssignmentStatus(filters.status);
      if (assignmentStatus) {
        where.assignedItems = {
          some: {
            status: assignmentStatus
          }
        };
      } else if (filters.status === 'Received') {
        // For 'Received' status, check if no assignments exist
        where.assignedItems = {
          none: {}
        };
      }
    }

    return where;
  }

  /**
   * Build order by clause
   */
  private buildOrderBy(sortBy: string, sortOrder: 'asc' | 'desc'): Prisma.OrderItemOrderByWithRelationInput {
    switch (sortBy) {
      case 'quantity':
        return { quantity: sortOrder };
      case 'updatedAt':
        return { order: { updatedAt: sortOrder } };
      case 'status':
        // For status sorting, we'll sort by the latest assignment
        return { assignedItems: { _count: sortOrder } };
      default:
        return { order: { createdAt: sortOrder } };
    }
  }

  /**
   * Transform order item to tracking DTO
   */
  private transformToOrderTrackingDto(orderItem: any): OrderTrackingItemDto {
    const latestAssignment = orderItem.assignedItems?.[0];
    const trackingStatus = this.determineTrackingStatus(orderItem);

    // Check if order exists
    if (!orderItem.order) {
      logger.error('Order relation missing for order item', { 
        orderItemId: orderItem.id, 
        orderId: orderItem.orderId 
      });
      throw new Error(`Order not found for order item ${orderItem.id}`);
    }

    return {
      id: orderItem.id,
      orderId: orderItem.order.id,
      orderNumber: orderItem.order.orderNumber || 'N/A',
      clientOrderId: orderItem.order.clientOrderId || 'N/A',
      productName: orderItem.productName || 'N/A',
      sku: orderItem.sku,
      quantity: orderItem.quantity || 0,
      pricePerUnit: orderItem.pricePerUnit ? Number(orderItem.pricePerUnit) : undefined,
      totalPrice: orderItem.totalPrice ? Number(orderItem.totalPrice) : undefined,
      vendor: orderItem.order.primaryVendor ? {
        id: orderItem.order.primaryVendor.id,
        companyName: orderItem.order.primaryVendor.companyName,
        contactPersonName: orderItem.order.primaryVendor.contactPersonName,
        contactPhone: orderItem.order.primaryVendor.contactPhone
      } : {
        id: '',
        companyName: 'No Vendor',
        contactPersonName: '',
        contactPhone: ''
      },
      status: trackingStatus,
      assignedQuantity: latestAssignment?.assignedQuantity,
      confirmedQuantity: latestAssignment?.confirmedQuantity,
      vendorRemarks: latestAssignment?.vendorRemarks,
      assignedAt: latestAssignment?.assignedAt?.toISOString(),
      vendorActionAt: latestAssignment?.vendorActionAt?.toISOString(),
      createdAt: orderItem.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: orderItem.updatedAt?.toISOString() || new Date().toISOString()
    };
  }

  /**
   * Determine tracking status from order item and assignments
   */
  private determineTrackingStatus(orderItem: any): OrderTrackingStatus {
    // If no assignments, it's 'Received'
    if (!orderItem.assignedItems || orderItem.assignedItems.length === 0) {
      return 'Received';
    }

    const latestAssignment = orderItem.assignedItems[0];
    const assignmentStatus = latestAssignment.status;

    // Map assignment status to tracking status
    switch (assignmentStatus) {
      case AssignmentStatus.PENDING_CONFIRMATION:
        return 'Assigned';
      case AssignmentStatus.VENDOR_CONFIRMED_FULL:
      case AssignmentStatus.VENDOR_CONFIRMED_PARTIAL:
        return 'Confirmed';
      case AssignmentStatus.INVOICED:
        return 'Invoiced';
      case AssignmentStatus.DISPATCHED:
        return 'Dispatched';
      case AssignmentStatus.VERIFIED_OK:
        return 'Verified';
      case AssignmentStatus.COMPLETED:
        return 'Paid';
      default:
        return 'Received';
    }
  }

  /**
   * Map tracking status to assignment status
   */
  private mapTrackingStatusToAssignmentStatus(status: OrderTrackingStatus): AssignmentStatus | null {
    switch (status) {
      case 'Assigned':
        return AssignmentStatus.PENDING_CONFIRMATION;
      case 'Confirmed':
        return AssignmentStatus.VENDOR_CONFIRMED_FULL;
      case 'Invoiced':
        return AssignmentStatus.INVOICED;
      case 'Dispatched':
        return AssignmentStatus.DISPATCHED;
      case 'Verified':
        return AssignmentStatus.VERIFIED_OK;
      case 'Paid':
        return AssignmentStatus.COMPLETED;
      default:
        return null;
    }
  }

  /**
   * Update order item status based on tracking status
   */
  private async updateOrderItemStatus(
    orderItem: any, 
    newStatus: OrderTrackingStatus, 
    remarks: string | undefined, 
    userId: string
  ): Promise<void> {
    const latestAssignment = orderItem.assignedItems?.[0];

    switch (newStatus) {
      case 'Received':
        // Reset to received - remove assignments
        if (latestAssignment) {
          await prisma.assignedOrderItem.delete({
            where: { id: latestAssignment.id }
          });
        }
        break;

      case 'Assigned':
        // Create new assignment if none exists
        if (!latestAssignment) {
          await prisma.assignedOrderItem.create({
            data: {
              orderItemId: orderItem.id,
              vendorId: orderItem.order.primaryVendorId || '',
              assignedQuantity: orderItem.quantity,
              status: AssignmentStatus.PENDING_CONFIRMATION,
              assignedById: userId,
              vendorRemarks: remarks
            }
          });
        }
        break;

      case 'Confirmed':
        if (latestAssignment) {
          await prisma.assignedOrderItem.update({
            where: { id: latestAssignment.id },
            data: {
              status: AssignmentStatus.VENDOR_CONFIRMED_FULL,
              confirmedQuantity: orderItem.quantity,
              vendorActionAt: new Date(),
              vendorRemarks: remarks
            }
          });
        }
        break;

      case 'Invoiced':
        if (latestAssignment) {
          await prisma.assignedOrderItem.update({
            where: { id: latestAssignment.id },
            data: {
              status: AssignmentStatus.INVOICED,
              vendorRemarks: remarks
            }
          });
        }
        break;

      case 'Dispatched':
        if (latestAssignment) {
          await prisma.assignedOrderItem.update({
            where: { id: latestAssignment.id },
            data: {
              status: AssignmentStatus.DISPATCHED,
              vendorRemarks: remarks
            }
          });
        }
        break;

      case 'Verified':
        if (latestAssignment) {
          await prisma.assignedOrderItem.update({
            where: { id: latestAssignment.id },
            data: {
              status: AssignmentStatus.VERIFIED_OK,
              vendorRemarks: remarks
            }
          });
        }
        break;

      case 'Paid':
        if (latestAssignment) {
          await prisma.assignedOrderItem.update({
            where: { id: latestAssignment.id },
            data: {
              status: AssignmentStatus.COMPLETED,
              vendorRemarks: remarks
            }
          });
        }
        break;
    }
  }
}

export const orderTrackingService = new OrderTrackingService();
