import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';
import { APP_CONSTANTS } from '../../config/constants';
import { notificationService } from '../notifications/notification.service';
import { NotificationPriority } from '@prisma/client';
import type {
  VendorAssignmentDto,
  VendorAssignmentListDto,
  VendorAssignmentListResponseDto,
  VendorAssignmentQueryDto,
  UpdateAssignmentStatusDto,
  AssignmentStatusUpdateResponseDto
} from './assignment.dto';

export class AssignmentService {

  /**
   * Create audit log for assignment actions
   */
  private async createAuditLog(
    actorUserId: string | null,
    action: string,
    entityType: string,
    entityId: string,
    metadata: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await prisma.auditLog.create({
      data: {
        actorUserId,
        action,
        entityType,
        entityId,
        metadata,
        ipAddress,
        userAgent
      }
    });
  }
  
  /**
   * Get vendor assignments with pagination and filtering
   */
  async getVendorAssignments(
    vendorId: string,
    query: VendorAssignmentQueryDto
  ): Promise<VendorAssignmentListResponseDto> {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        orderId,
        orderNumber,
        startDate,
        endDate
      } = query;

      const offset = (page - 1) * limit;

      // Build where clause
      const where: any = {
        vendorId
      };

      if (status) {
        where.status = status;
      }

      if (orderId) {
        where.orderItem = {
          orderId
        };
      }

      if (orderNumber) {
        where.orderItem = {
          ...where.orderItem,
          order: {
            orderNumber: {
              contains: orderNumber,
              mode: 'insensitive'
            }
          }
        };
      }

      if (startDate || endDate) {
        where.assignedAt = {};
        if (startDate) {
          where.assignedAt.gte = startDate;
        }
        if (endDate) {
          where.assignedAt.lte = endDate;
        }
      }

      // Get total count
      const total = await prisma.assignedOrderItem.count({ where });

      // Get assignments with related data
      const assignments = await prisma.assignedOrderItem.findMany({
        where,
        include: {
          orderItem: {
            include: {
              order: {
                select: {
                  id: true,
                  orderNumber: true,
                  status: true,
                  createdAt: true
                }
              }
            }
          }
        },
        orderBy: [
          { assignedAt: 'desc' }
        ],
        skip: offset,
        take: limit
      });

      // Transform to DTOs
      const assignmentDtos: VendorAssignmentListDto[] = assignments.map(assignment => ({
        id: assignment.id,
        assignedQuantity: assignment.assignedQuantity,
        confirmedQuantity: assignment.confirmedQuantity || undefined,
        status: assignment.status,
        assignedAt: assignment.assignedAt,
        vendorActionAt: assignment.vendorActionAt || undefined,
        productName: assignment.orderItem.productName,
        sku: assignment.orderItem.sku || undefined,
        orderNumber: assignment.orderItem.order.orderNumber,
        orderStatus: assignment.orderItem.order.status,
        orderCreatedAt: assignment.orderItem.order.createdAt
      }));

      return {
        assignments: assignmentDtos,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };

    } catch (error) {
      logger.error('Failed to get vendor assignments', { error, vendorId, query });
      throw new Error('Failed to retrieve assignments');
    }
  }

  /**
   * Get single assignment details for vendor
   */
  async getVendorAssignmentById(
    assignmentId: string,
    vendorId: string
  ): Promise<VendorAssignmentDto | null> {
    try {
      const assignment = await prisma.assignedOrderItem.findFirst({
        where: {
          id: assignmentId,
          vendorId
        },
        include: {
          orderItem: {
            include: {
              order: {
                select: {
                  id: true,
                  orderNumber: true,
                  status: true,
                  createdAt: true
                }
              }
            }
          }
        }
      });

      if (!assignment) {
        return null;
      }

      return {
        id: assignment.id,
        assignedQuantity: assignment.assignedQuantity,
        confirmedQuantity: assignment.confirmedQuantity || undefined,
        status: assignment.status,
        vendorRemarks: assignment.vendorRemarks || undefined,
        assignedAt: assignment.assignedAt,
        vendorActionAt: assignment.vendorActionAt || undefined,
        orderItem: {
          id: assignment.orderItem.id,
          productName: assignment.orderItem.productName,
          sku: assignment.orderItem.sku || undefined,
          quantity: assignment.orderItem.quantity,
          order: {
            id: assignment.orderItem.order.id,
            orderNumber: assignment.orderItem.order.orderNumber,
            status: assignment.orderItem.order.status,
            createdAt: assignment.orderItem.order.createdAt
          }
        }
      };

    } catch (error) {
      logger.error('Failed to get vendor assignment by ID', { error, assignmentId, vendorId });
      throw new Error('Failed to retrieve assignment details');
    }
  }

  /**
   * Update assignment status with business logic
   */
  async updateAssignmentStatus(
    assignmentId: string,
    vendorId: string,
    updateData: UpdateAssignmentStatusDto,
    userId: string
  ): Promise<AssignmentStatusUpdateResponseDto> {
    const transaction = await prisma.$transaction(async (prisma) => {
      try {
        // First, get the assignment with minimal data needed for validation
        const existingAssignment = await prisma.assignedOrderItem.findFirst({
          where: {
            id: assignmentId,
            vendorId
          },
          select: {
            id: true,
            status: true,
            assignedQuantity: true,
            confirmedQuantity: true,
            vendorRemarks: true,
            assignedAt: true,
            orderItem: {
              select: {
                id: true,
                productName: true,
                sku: true,
                quantity: true,
                order: {
                  select: {
                    id: true,
                    orderNumber: true,
                    status: true,
                    createdAt: true
                  }
                }
              }
            }
          }
        });

        if (!existingAssignment) {
          throw new Error('Assignment not found or access denied');
        }

        // Validate status transition
        if (existingAssignment.status !== 'PENDING_CONFIRMATION') {
          throw new Error('Assignment has already been processed');
        }

        // Validate confirmed quantity for partial confirmations
        if (updateData.status === 'VENDOR_CONFIRMED_PARTIAL') {
          if (!updateData.confirmedQuantity || updateData.confirmedQuantity <= 0) {
            throw new Error('Confirmed quantity is required for partial confirmations');
          }
          if (updateData.confirmedQuantity > existingAssignment.assignedQuantity) {
            throw new Error('Confirmed quantity cannot exceed assigned quantity');
          }
        }

        // Update the assignment - no includes needed, we have the data
        await prisma.assignedOrderItem.update({
          where: { id: assignmentId },
          data: {
            status: updateData.status,
            confirmedQuantity: updateData.status === 'VENDOR_CONFIRMED_PARTIAL' 
              ? updateData.confirmedQuantity 
              : updateData.status === 'VENDOR_CONFIRMED_FULL' 
                ? existingAssignment.assignedQuantity 
                : null,
            vendorRemarks: updateData.vendorRemarks,
            vendorActionAt: new Date()
          }
        });

        // Calculate the new confirmed quantity
        const finalConfirmedQuantity = updateData.status === 'VENDOR_CONFIRMED_PARTIAL' 
          ? updateData.confirmedQuantity 
          : updateData.status === 'VENDOR_CONFIRMED_FULL' 
            ? existingAssignment.assignedQuantity 
            : null;

        // Check if we need to update the parent order status
        let orderStatusUpdated = false;
        let newOrderStatus: string | undefined;

        // If this is the first confirmation and order is still RECEIVED, update to PROCESSING
        if ((updateData.status === 'VENDOR_CONFIRMED_FULL' || updateData.status === 'VENDOR_CONFIRMED_PARTIAL') 
            && existingAssignment.orderItem.order.status === 'RECEIVED') {
          
          await prisma.order.update({
            where: { id: existingAssignment.orderItem.order.id },
            data: { status: 'PROCESSING' }
          });
          
          orderStatusUpdated = true;
          newOrderStatus = 'PROCESSING';
        }

        // Create audit log
        const auditAction = updateData.status === 'VENDOR_CONFIRMED_FULL' 
          ? APP_CONSTANTS.AUDIT_ACTIONS.ASSIGNMENT_CONFIRMED
          : updateData.status === 'VENDOR_CONFIRMED_PARTIAL'
            ? APP_CONSTANTS.AUDIT_ACTIONS.ASSIGNMENT_PARTIAL_CONFIRMED
            : APP_CONSTANTS.AUDIT_ACTIONS.ASSIGNMENT_DECLINED;

        await this.createAuditLog(
          userId,
          auditAction,
          'AssignedOrderItem',
          assignmentId,
          {
            previousStatus: existingAssignment.status,
            newStatus: updateData.status,
            confirmedQuantity: finalConfirmedQuantity,
            vendorRemarks: updateData.vendorRemarks,
            orderNumber: existingAssignment.orderItem.order.orderNumber,
            orderStatusUpdated,
            newOrderStatus
          }
        );

        // Transform to DTO using existing data
        const assignmentDto: VendorAssignmentDto = {
          id: existingAssignment.id,
          assignedQuantity: existingAssignment.assignedQuantity,
          confirmedQuantity: finalConfirmedQuantity || undefined,
          status: updateData.status,
          vendorRemarks: updateData.vendorRemarks || existingAssignment.vendorRemarks || undefined,
          assignedAt: existingAssignment.assignedAt,
          vendorActionAt: new Date(),
          orderItem: {
            id: existingAssignment.orderItem.id,
            productName: existingAssignment.orderItem.productName,
            sku: existingAssignment.orderItem.sku || undefined,
            quantity: existingAssignment.orderItem.quantity,
            order: {
              id: existingAssignment.orderItem.order.id,
              orderNumber: existingAssignment.orderItem.order.orderNumber,
              status: newOrderStatus || existingAssignment.orderItem.order.status,
              createdAt: existingAssignment.orderItem.order.createdAt
            }
          }
        };

        return {
          assignment: assignmentDto,
          orderStatusUpdated,
          newOrderStatus
        };

      } catch (error) {
        logger.error('Assignment status update failed', { error, assignmentId, vendorId, updateData });
        throw error;
      }
    }, {
      maxWait: 10000, // Maximum time to wait for transaction to start (10 seconds)
      timeout: 15000, // Maximum time for transaction to complete (15 seconds)
    });

    // Send notification to ADMIN and ACCOUNTS roles after successful confirmation
    if (transaction.assignment.status === 'VENDOR_CONFIRMED_FULL' || 
        transaction.assignment.status === 'VENDOR_CONFIRMED_PARTIAL') {
      await this.sendVendorConfirmationNotification(transaction.assignment, vendorId);
    }

    return transaction;
  }

  /**
   * Send notification to ADMIN and ACCOUNTS roles about vendor confirmation
   */
  private async sendVendorConfirmationNotification(
    assignment: VendorAssignmentDto, 
    vendorId: string
  ): Promise<void> {
    try {
      // Get vendor information
      const vendor = await prisma.vendorProfile.findUnique({
        where: { id: vendorId },
        select: {
          id: true,
          companyName: true,
          contactPersonName: true
        }
      });

      if (!vendor) {
        logger.warn('Cannot send confirmation notification - vendor not found', { vendorId });
        return;
      }

      const isPartialConfirmation = assignment.status === 'VENDOR_CONFIRMED_PARTIAL';
      const confirmedQuantity = assignment.confirmedQuantity || assignment.assignedQuantity;
      
      // Prepare notification payload
      const notificationPayload = {
        title: `Order Confirmed: ${assignment.orderItem.order.orderNumber}`,
        body: `${vendor.companyName} has ${isPartialConfirmation ? 'partially ' : ''}confirmed ${confirmedQuantity} units of ${assignment.orderItem.productName}${isPartialConfirmation ? ` (${assignment.assignedQuantity} requested)` : ''}.`,
        priority: NotificationPriority.NORMAL,
        data: {
          type: 'vendor_confirmation',
          assignmentId: assignment.id,
          orderId: assignment.orderItem.order.id,
          orderNumber: assignment.orderItem.order.orderNumber,
          vendorId: vendor.id,
          vendorName: vendor.companyName,
          productName: assignment.orderItem.productName,
          confirmedQuantity: confirmedQuantity.toString(),
          assignedQuantity: assignment.assignedQuantity.toString(),
          confirmationType: isPartialConfirmation ? 'partial' : 'full',
          action: 'view_order'
        },
        clickAction: `/orders/${assignment.orderItem.order.id}`, // Deep link to order details
        badge: 1
      };

      // Send to ADMIN and ACCOUNTS roles
      const result = await notificationService.sendNotificationToRole(
        ['ADMIN', 'ACCOUNTS'],
        notificationPayload
      );

      if (result.success) {
        logger.info('Vendor confirmation notification sent successfully', {
          assignmentId: assignment.id,
          orderNumber: assignment.orderItem.order.orderNumber,
          vendorId: vendor.id,
          vendorName: vendor.companyName,
          confirmationType: isPartialConfirmation ? 'partial' : 'full',
          totalUsers: result.totalUsers,
          totalNotifications: result.totalNotifications
        });
      } else {
        logger.error('Failed to send vendor confirmation notification', {
          assignmentId: assignment.id,
          vendorId: vendor.id,
          errors: result.results.filter(r => !r.result.success).map(r => r.result.errors).flat()
        });
      }

    } catch (error) {
      logger.error('Error sending vendor confirmation notification', {
        assignmentId: assignment.id,
        vendorId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Check if vendor has access to assignment
   */
  async validateVendorAccess(assignmentId: string, vendorId: string): Promise<boolean> {
    try {
      const assignment = await prisma.assignedOrderItem.findFirst({
        where: {
          id: assignmentId,
          vendorId
        },
        select: { id: true }
      });

      return !!assignment;
    } catch (error) {
      logger.error('Failed to validate vendor access', { error, assignmentId, vendorId });
      return false;
    }
  }
}

export const assignmentService = new AssignmentService();