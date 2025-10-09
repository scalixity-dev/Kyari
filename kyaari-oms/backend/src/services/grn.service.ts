import { prisma } from '../config/database';
import { CreateGRNRequest, GRNResponse } from '../modules/grn/grn.dto';
import { APP_CONSTANTS } from '../config/constants';
import { GRNStatus, GRNItemStatus, AssignmentStatus } from '@prisma/client';

class GRNService {
  /**
   * Create a new GRN (Goods Receipt Note)
   */
  async createGRN(
    data: CreateGRNRequest,
    userId: string,
    userEmail: string
  ): Promise<GRNResponse> {
    // Get dispatch with all items
    const dispatch = await prisma.dispatch.findUnique({
      where: { id: data.dispatchId },
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
              },
            },
          },
        },
        vendor: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!dispatch) {
      throw new Error('Dispatch not found');
    }

    // Check if GRN already exists for this dispatch
    const existingGRN = await prisma.goodsReceiptNote.findUnique({
      where: { dispatchId: data.dispatchId },
    });

    if (existingGRN) {
      throw new Error('GRN already exists for this dispatch');
    }

    // Validate all dispatch items are included
    const dispatchItemIds = dispatch.items.map((item) => item.id);
    const requestItemIds = data.items.map((item) => item.dispatchItemId);
    const missingItems = dispatchItemIds.filter((id) => !requestItemIds.includes(id));

    if (missingItems.length > 0) {
      throw new Error('All dispatch items must be included in the GRN');
    }

    // Generate GRN number
    const grnNumber = `GRN-${Date.now()}`;

    // Create GRN with automatic discrepancy detection
    const grn = await prisma.$transaction(async (tx) => {
      // Determine overall GRN status based on items
      let hasDiscrepancy = false;
      const grnItems = [];

      for (const reqItem of data.items) {
        const dispatchItem = dispatch.items.find((di) => di.id === reqItem.dispatchItemId);
        if (!dispatchItem) {
          throw new Error(`Dispatch item ${reqItem.dispatchItemId} not found`);
        }

        const assignment = dispatchItem.assignedOrderItem;
        const confirmedQty = assignment.confirmedQuantity || assignment.assignedQuantity;
        const discrepancy = reqItem.receivedQuantity - confirmedQty;

        // Determine item status
        let itemStatus: GRNItemStatus = GRNItemStatus.VERIFIED_OK;
        if (reqItem.damageReported) {
          itemStatus = GRNItemStatus.DAMAGE_REPORTED;
          hasDiscrepancy = true;
        } else if (discrepancy < 0) {
          itemStatus = GRNItemStatus.SHORTAGE_REPORTED;
          hasDiscrepancy = true;
        } else if (discrepancy > 0) {
          itemStatus = GRNItemStatus.EXCESS_RECEIVED;
          hasDiscrepancy = true;
        } else if (reqItem.receivedQuantity !== confirmedQty) {
          itemStatus = GRNItemStatus.QUANTITY_MISMATCH;
          hasDiscrepancy = true;
        }

        grnItems.push({
          dispatchItemId: reqItem.dispatchItemId,
          assignedOrderItemId: assignment.id,
          assignedQuantity: assignment.assignedQuantity,
          confirmedQuantity: confirmedQty,
          receivedQuantity: reqItem.receivedQuantity,
          discrepancyQuantity: discrepancy,
          status: itemStatus,
          itemRemarks: reqItem.itemRemarks,
          damageReported: reqItem.damageReported || false,
          damageDescription: reqItem.damageDescription,
        });
      }

      // Create GRN
      const newGRN = await tx.goodsReceiptNote.create({
        data: {
          grnNumber,
          dispatch: { connect: { id: data.dispatchId } },
          status: hasDiscrepancy ? GRNStatus.VERIFIED_MISMATCH : GRNStatus.VERIFIED_OK,
          operatorRemarks: data.operatorRemarks,
          verifiedBy: { connect: { id: userId } },
          receivedAt: data.receivedAt ? new Date(data.receivedAt) : new Date(),
          verifiedAt: new Date(),
          items: {
            create: grnItems,
          },
        },
        include: {
          items: {
            include: {
              assignedOrderItem: {
                include: {
                  orderItem: true,
                },
              },
              dispatchItem: true,
            },
          },
          dispatch: {
            include: {
              vendor: {
                include: {
                  user: true,
                },
              },
            },
          },
          verifiedBy: {
            select: {
              email: true,
            },
          },
        },
      });

      // Update assignment statuses based on verification
      for (const grnItem of grnItems) {
        let newAssignmentStatus: AssignmentStatus = AssignmentStatus.VERIFIED_OK;
        if (grnItem.status !== GRNItemStatus.VERIFIED_OK) {
          newAssignmentStatus = AssignmentStatus.VERIFIED_MISMATCH;
        }

        await tx.assignedOrderItem.update({
          where: { id: grnItem.assignedOrderItemId },
          data: { status: newAssignmentStatus },
        });
      }

      // Create audit log
      const auditAction = hasDiscrepancy
        ? APP_CONSTANTS.AUDIT_ACTIONS.GRN_VERIFIED_MISMATCH
        : APP_CONSTANTS.AUDIT_ACTIONS.GRN_VERIFIED_OK;

      await tx.auditLog.create({
        data: {
          action: auditAction,
          actorUserId: userId,
          entityType: 'GoodsReceiptNote',
          entityId: newGRN.id,
          metadata: {
            grnNumber,
            dispatchId: data.dispatchId,
            itemCount: data.items.length,
            hasDiscrepancy,
          },
        },
      });

      return newGRN;
    });

    return this.formatGRNResponse(grn, userEmail);
  }

  /**
   * Get GRN by ID
   */
  async getGRNById(grnId: string): Promise<GRNResponse> {
    const grn = await prisma.goodsReceiptNote.findUnique({
      where: { id: grnId },
      include: {
        items: {
          include: {
            assignedOrderItem: {
              include: {
                orderItem: true,
              },
            },
            dispatchItem: true,
          },
        },
        dispatch: {
          include: {
            vendor: {
              include: {
                user: true,
              },
            },
          },
        },
        verifiedBy: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!grn) {
      throw new Error('GRN not found');
    }

    return this.formatGRNResponse(grn, grn.verifiedBy.email || '');
  }

  /**
   * Get GRNs with filters
   */
  async getGRNs(filters: {
    page?: number;
    limit?: number;
    status?: GRNStatus;
    dispatchId?: string;
  }) {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 10, 100);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.dispatchId) {
      where.dispatchId = filters.dispatchId;
    }

    const [grns, total] = await Promise.all([
      prisma.goodsReceiptNote.findMany({
        where,
        include: {
          items: {
            include: {
              assignedOrderItem: {
                include: {
                  orderItem: true,
                },
              },
              dispatchItem: true,
            },
          },
          dispatch: {
            include: {
              vendor: {
                include: {
                  user: true,
                },
              },
            },
          },
          verifiedBy: {
            select: {
              email: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.goodsReceiptNote.count({ where }),
    ]);

    return {
      grns: grns.map((g) => this.formatGRNResponse(g, g.verifiedBy.email || '')),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Format GRN response
   */
  private formatGRNResponse(grn: any, verifiedByEmail: string): GRNResponse {
    return {
      id: grn.id,
      grnNumber: grn.grnNumber,
      dispatchId: grn.dispatchId,
      awbNumber: grn.dispatch.awbNumber,
      vendorName: grn.dispatch.vendor.user.name,
      status: grn.status,
      operatorRemarks: grn.operatorRemarks,
      verifiedById: grn.verifiedById,
      verifiedByEmail,
      receivedAt: grn.receivedAt.toISOString(),
      verifiedAt: grn.verifiedAt?.toISOString(),
      items: grn.items.map((item: any) => ({
        id: item.id,
        dispatchItemId: item.dispatchItemId,
        assignmentId: item.assignedOrderItemId,
        productName: item.assignedOrderItem.orderItem.productName,
        sku: item.assignedOrderItem.orderItem.sku || '',
        assignedQuantity: item.assignedQuantity,
        confirmedQuantity: item.confirmedQuantity,
        receivedQuantity: item.receivedQuantity,
        discrepancyQuantity: item.discrepancyQuantity,
        status: item.status,
        itemRemarks: item.itemRemarks,
        damageReported: item.damageReported,
        damageDescription: item.damageDescription,
      })),
      orderStatusUpdated: grn.status === GRNStatus.VERIFIED_OK,
      createdAt: grn.createdAt.toISOString(),
      updatedAt: grn.updatedAt.toISOString(),
    };
  }
}

export default new GRNService();
