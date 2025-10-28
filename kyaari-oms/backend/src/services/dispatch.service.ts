import { prisma } from '../config/database';
import { CreateDispatchRequest, DispatchResponse } from '../modules/dispatch/dispatch.dto';
import { APP_CONSTANTS } from '../config/constants';
import s3Service, { MulterFile } from './s3.service';
import { DispatchStatus, AssignmentStatus, NotificationPriority } from '@prisma/client';
import { notificationService } from '../modules/notifications/notification.service';
import { logger } from '../utils/logger';

class DispatchService {
  /**
   * Create a new dispatch
   */
  async createDispatch(
    vendorId: string,
    data: CreateDispatchRequest,
    userId: string
  ): Promise<DispatchResponse> {
    // Validate that all items are confirmed and belong to the vendor
    const assignments = await prisma.assignedOrderItem.findMany({
      where: {
        id: { in: data.items.map((item) => item.assignmentId) },
        vendorId,
      },
      include: {
        orderItem: {
          include: {
            order: true,
          },
        },
      },
    });

    if (assignments.length !== data.items.length) {
      throw new Error('Some assignments not found or do not belong to this vendor');
    }

    // Validate that all assignments are confirmed
    const unconfirmedAssignments = assignments.filter(
      (a) =>
        a.status !== AssignmentStatus.VENDOR_CONFIRMED_FULL &&
        a.status !== AssignmentStatus.VENDOR_CONFIRMED_PARTIAL
    );

    if (unconfirmedAssignments.length > 0) {
      throw new Error(
        'Cannot dispatch unconfirmed assignments. All items must be confirmed first.'
      );
    }

    // Check if any assignments are already dispatched
    const alreadyDispatched = assignments.filter(
      (a) => a.status === AssignmentStatus.DISPATCHED
    );

    if (alreadyDispatched.length > 0) {
      throw new Error('Some assignments are already dispatched');
    }

    // Create dispatch with items in a transaction (with increased timeout)
    const dispatch = await prisma.$transaction(async (tx) => {
      // Create dispatch
      const newDispatch = await tx.dispatch.create({
        data: {
          vendor: { connect: { id: vendorId } },
          awbNumber: data.awbNumber,
          logisticsPartner: data.logisticsPartner,
          dispatchDate: data.dispatchDate ? new Date(data.dispatchDate) : new Date(),
          estimatedDeliveryDate: data.estimatedDeliveryDate
            ? new Date(data.estimatedDeliveryDate)
            : undefined,
          status: DispatchStatus.DISPATCHED,
          remarks: data.remarks,
          items: {
            create: data.items.map((item) => {
              const assignment = assignments.find((a) => a.id === item.assignmentId)!;
              return {
                assignmentId: item.assignmentId,
                orderItemId: assignment.orderItemId,
                dispatchedQuantity: item.dispatchedQuantity,
              };
            }),
          },
        },
      include: {
        items: {
          include: {
            assignedOrderItem: {
              include: {
                orderItem: {
                  include: {
                    order: true,
                  },
                },
                purchaseOrderItem: {
                  include: {
                    purchaseOrder: true,
                  },
                },
              },
            },
          },
        },
        vendor: {
          include: {
            user: {
              select: {
                email: true,
              },
            },
          },
        },
      },
      });

      // Update assignment statuses to DISPATCHED
      await tx.assignedOrderItem.updateMany({
        where: {
          id: { in: data.items.map((item) => item.assignmentId) },
        },
        data: {
          status: AssignmentStatus.DISPATCHED,
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          action: APP_CONSTANTS.AUDIT_ACTIONS.DISPATCH_CREATED,
          actorUserId: userId,
          entityType: 'Dispatch',
          entityId: newDispatch.id,
          metadata: {
            awbNumber: data.awbNumber,
            logisticsPartner: data.logisticsPartner,
            itemCount: data.items.length,
          },
        },
      });

      return newDispatch;
    }, {
      maxWait: 10000, // Maximum time to wait for transaction to start (10 seconds)
      timeout: 15000, // Maximum time for transaction to complete (15 seconds)
    });

    // Send notification about dispatch creation
    try {
      await this.sendDispatchCreatedNotification(dispatch);
    } catch (notificationError) {
      // Don't fail the dispatch creation if notification fails
      logger.warn('Failed to send dispatch creation notification', {
        dispatchId: dispatch.id,
        error: notificationError instanceof Error ? notificationError.message : 'Unknown error'
      });
    }

    return this.formatDispatchResponse(dispatch);
  }

  /**
   * Get dispatch by ID
   */
  async getDispatchById(dispatchId: string, vendorId?: string): Promise<DispatchResponse> {
    const whereClause: any = { id: dispatchId };
    if (vendorId) {
      whereClause.vendorId = vendorId;
    }

    const dispatch = await prisma.dispatch.findFirst({
      where: whereClause,
      include: {
        items: {
          include: {
            assignedOrderItem: {
              include: {
                orderItem: {
                  include: {
                    order: true,
                  },
                },
                purchaseOrderItem: {
                  include: {
                    purchaseOrder: true,
                  },
                },
              },
            },
          },
        },
        vendor: {
          include: {
            user: {
              select: {
                email: true,
              },
            },
          },
        },
        attachments: true,
        goodsReceiptNote: {
          include: {
            ticket: {
              select: {
                id: true,
                ticketNumber: true,
                status: true,
              },
            },
            items: {
              select: {
                id: true,
                status: true,
                receivedQuantity: true,
                discrepancyQuantity: true,
                damageReported: true,
              },
            },
          },
        },
      },
    });

    if (!dispatch) {
      throw new Error('Dispatch not found');
    }

    return this.formatDispatchResponse(dispatch);
  }

  /**
   * Get vendor dispatches with filters
   */
  async getVendorDispatches(
    vendorId: string,
    filters: {
      page?: number;
      limit?: number;
      status?: DispatchStatus;
      awbNumber?: string;
    }
  ) {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 10, 100);
    const skip = (page - 1) * limit;

    const where: any = { vendorId };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.awbNumber) {
      where.awbNumber = { contains: filters.awbNumber, mode: 'insensitive' };
    }

    const [dispatches, total] = await Promise.all([
      prisma.dispatch.findMany({
        where,
        include: {
          items: {
            include: {
              assignedOrderItem: {
                include: {
                  orderItem: {
                    include: {
                      order: true,
                    },
                  },
                  purchaseOrderItem: {
                    include: {
                      purchaseOrder: true,
                    },
                  },
                },
              },
            },
          },
          vendor: {
            include: {
              user: {
                select: {
                  email: true,
                },
              },
            },
          },
          attachments: true,
          goodsReceiptNote: {
            include: {
              ticket: {
                select: {
                  id: true,
                  ticketNumber: true,
                  status: true,
                },
              },
              items: {
                select: {
                  id: true,
                  status: true,
                  receivedQuantity: true,
                  discrepancyQuantity: true,
                  damageReported: true,
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.dispatch.count({ where }),
    ]);

    // Generate presigned URLs for attachments
    const dispatchesWithPresignedUrls = await Promise.all(
      dispatches.map(async (dispatch) => {
        if (!dispatch.attachments || dispatch.attachments.length === 0) {
          return dispatch;
        }

        const attachmentsWithUrls = await Promise.all(
          dispatch.attachments.map(async (att) => {
            if (att.s3Key) {
              try {
                const presignedUrl = await s3Service.getPresignedUrl(att.s3Key);
                return {
                  ...att,
                  s3Url: presignedUrl
                };
              } catch (error) {
                console.error('Failed to generate presigned URL for attachment', { error, s3Key: att.s3Key });
                return att;
              }
            }
            return att;
          })
        );

        return {
          ...dispatch,
          attachments: attachmentsWithUrls
        };
      })
    );

    return {
      dispatches: dispatchesWithPresignedUrls.map((d) => this.formatDispatchResponse(d)),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Upload dispatch proof
   */
  async uploadDispatchProof(
    dispatchId: string,
    vendorId: string,
    file: MulterFile,
    userId: string
  ) {
    // Validate file
    const validation = s3Service.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Check if dispatch exists and belongs to vendor
    const dispatch = await prisma.dispatch.findFirst({
      where: { id: dispatchId, vendorId },
    });

    if (!dispatch) {
      throw new Error('Dispatch not found');
    }

    // Upload file to S3
    const uploadResult = await s3Service.uploadFile(file, 'dispatch-proofs');

    // Create attachment record
    const attachment = await prisma.$transaction(async (tx) => {
      const newAttachment = await tx.attachment.create({
        data: {
          fileName: uploadResult.fileName,
          originalName: uploadResult.fileName,
          fileType: uploadResult.mimeType.split('/')[0],
          mimeType: uploadResult.mimeType,
          s3Key: uploadResult.key,
          s3Url: uploadResult.url,
          fileSize: uploadResult.fileSize,
          uploadedBy: userId,
          dispatch: {
            connect: { id: dispatchId },
          },
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          action: APP_CONSTANTS.AUDIT_ACTIONS.DISPATCH_PROOF_UPLOADED,
          actorUserId: userId,
          entityType: 'Dispatch',
          entityId: dispatchId,
          metadata: {
            fileName: uploadResult.fileName,
            fileSize: uploadResult.fileSize,
            attachmentId: newAttachment.id,
          },
        },
      });

      return newAttachment;
    });

    return {
      attachment: {
        id: attachment.id,
        fileName: attachment.fileName,
        s3Url: attachment.s3Url,
        presignedUrl: uploadResult.presignedUrl,
        fileSize: attachment.fileSize,
        mimeType: attachment.mimeType,
        uploadedAt: attachment.createdAt,
      },
    };
  }

  /**
   * Format dispatch response
   */
  private formatDispatchResponse(dispatch: any): DispatchResponse {
    // Extract PO number from the first item (all items should have the same PO)
    const poNumber = dispatch.items?.[0]?.assignedOrderItem?.purchaseOrderItem?.purchaseOrder?.poNumber || null;

    return {
      id: dispatch.id,
      vendorId: dispatch.vendorId,
      vendorEmail: dispatch.vendor?.user?.email || 'N/A',
      awbNumber: dispatch.awbNumber,
      logisticsPartner: dispatch.logisticsPartner,
      dispatchDate: dispatch.dispatchDate.toISOString(),
      estimatedDeliveryDate: dispatch.estimatedDeliveryDate?.toISOString(),
      status: dispatch.status,
      remarks: dispatch.remarks,
      poNumber: poNumber,
      items: dispatch.items.map((item: any) => ({
        id: item.id,
        assignmentId: item.assignmentId,
        orderItemId: item.orderItemId,
        productName: item.assignedOrderItem.orderItem.productName,
        sku: item.assignedOrderItem.orderItem.sku || '',
        dispatchedQuantity: item.dispatchedQuantity,
        orderNumber: item.assignedOrderItem.orderItem.order.orderNumber,
      })),
      attachments: dispatch.attachments?.map((att: any) => ({
        id: att.id,
        fileName: att.fileName,
        s3Url: att.s3Url,
        fileSize: att.fileSize,
        mimeType: att.mimeType,
        uploadedAt: att.createdAt.toISOString(),
      })),
      goodsReceiptNote: dispatch.goodsReceiptNote ? {
        id: dispatch.goodsReceiptNote.id,
        grnNumber: dispatch.goodsReceiptNote.grnNumber,
        status: dispatch.goodsReceiptNote.status,
        verifiedAt: dispatch.goodsReceiptNote.verifiedAt?.toISOString(),
        operatorRemarks: dispatch.goodsReceiptNote.operatorRemarks,
        ticket: dispatch.goodsReceiptNote.ticket || null,
        items: dispatch.goodsReceiptNote.items || []
      } : null,
      createdAt: dispatch.createdAt.toISOString(),
      updatedAt: dispatch.updatedAt.toISOString(),
    };
  }

  /**
   * Send notification about dispatch creation
   */
  private async sendDispatchCreatedNotification(dispatch: any) {
    try {
      // Get order numbers for the dispatch
      const orderNumbers = Array.from(new Set(
        dispatch.items.map((item: any) => item.assignedOrderItem.orderItem.order.orderNumber)
      ));

      // Get vendor information
      const vendorName = dispatch.vendor?.user?.companyName || 'Unknown Vendor';

      // Send notification to OPERATIONS role about new dispatch
      await notificationService.sendNotificationToRole(
        ['OPERATIONS'],
        {
          title: 'New Dispatch Created',
          body: `${vendorName} has dispatched orders: ${orderNumbers.join(', ')}. AWB: ${dispatch.awbNumber}`,
          priority: NotificationPriority.NORMAL,
          data: {
            dispatchId: dispatch.id,
            awbNumber: dispatch.awbNumber,
            vendorId: dispatch.vendorId,
            orderNumbers: orderNumbers.join(','),
            logisticsPartner: dispatch.logisticsPartner
          }
        }
      );

      logger.info('Dispatch creation notification sent successfully', {
        dispatchId: dispatch.id,
        awbNumber: dispatch.awbNumber,
        orderNumbers,
        vendorName
      });

    } catch (error) {
      logger.error('Error sending dispatch creation notification', {
        dispatchId: dispatch.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
}

export default new DispatchService();
