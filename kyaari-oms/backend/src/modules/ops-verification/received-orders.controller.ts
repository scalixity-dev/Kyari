import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { ResponseHelper } from '../../utils/response';
import { logger } from '../../utils/logger';
import { z } from 'zod';
import { GRNAutoTicketingService } from '../../services/grn-auto-ticketing.service';
import { APP_CONSTANTS } from '../../config/constants';

// Validation schemas
const verifyOrderSchema = z.object({
  verificationNotes: z.string().optional(),
});

const raiseTicketSchema = z.object({
  issueType: z.enum(['qty-mismatch', 'damaged', 'missing-item']),
  comments: z.string().min(1, 'Comments are required'),
  mismatches: z.array(
    z.object({
      grnItemId: z.string(),
      assignedOrderItemId: z.string(),
      assignedQuantity: z.number(),
      confirmedQuantity: z.number(),
      receivedQuantity: z.number(),
      discrepancyQuantity: z.number(),
      status: z.enum(['QUANTITY_MISMATCH', 'DAMAGE_REPORTED', 'SHORTAGE_REPORTED']),
      itemRemarks: z.string().optional(),
      damageReported: z.boolean().default(false),
      damageDescription: z.string().optional(),
    })
  ),
  operatorRemarks: z.string().optional(),
});

export class ReceivedOrdersController {
  /**
   * Get all received orders (Dispatches that are ready for verification)
   * GET /api/ops/received-orders
   */
  async getReceivedOrders(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const vendor = req.query.vendor as string;
      const status = req.query.status as string;
      const orderNumber = req.query.orderNumber as string;
      const dateFrom = req.query.dateFrom as string;
      const dateTo = req.query.dateTo as string;

      const skip = (page - 1) * limit;

      // Build where clause for dispatches
      const where: any = {
        status: { in: ['DISPATCHED', 'IN_TRANSIT', 'DELIVERED'] }
      };

      // Filter by vendor
      if (vendor) {
        where.vendor = {
          OR: [
            { companyName: { contains: vendor, mode: 'insensitive' } },
            { user: { name: { contains: vendor, mode: 'insensitive' } } },
          ],
        };
      }

      // Filter by order number
      if (orderNumber) {
        where.items = {
          some: {
            assignedOrderItem: {
              orderItem: {
                order: {
                  OR: [
                    { orderNumber: { contains: orderNumber, mode: 'insensitive' } },
                    { clientOrderId: { contains: orderNumber, mode: 'insensitive' } },
                  ],
                },
              },
            },
          },
        };
      }

      // Filter by date range
      if (dateFrom || dateTo) {
        where.dispatchDate = {};
        if (dateFrom) {
          where.dispatchDate.gte = new Date(dateFrom);
        }
        if (dateTo) {
          where.dispatchDate.lte = new Date(dateTo);
        }
      }

      const [dispatches, totalCount] = await Promise.all([
        prisma.dispatch.findMany({
          where,
          include: {
            vendor: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
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
            goodsReceiptNote: {
              include: {
                verifiedBy: {
                  select: {
                    name: true,
                  },
                },
                ticket: {
                  select: {
                    id: true,
                    ticketNumber: true,
                  },
                },
                items: {
                  select: {
                    receivedQuantity: true,
                  },
                },
              },
            },
          },
          skip,
          take: limit,
          orderBy: {
            dispatchDate: 'desc',
          },
        }),
        prisma.dispatch.count({ where }),
      ]);

      // Transform to match frontend interface
      const receivedOrders = dispatches.map((dispatch) => {
        // Get unique order numbers
        const orderNumbers = Array.from(
          new Set(
            dispatch.items.map(
              (item) =>
                item.assignedOrderItem.orderItem.order.clientOrderId ||
                item.assignedOrderItem.orderItem.order.orderNumber
            )
          )
        );

        // Calculate quantities
        const quantityInvoiced = dispatch.items.reduce(
          (sum, item) => sum + (item.assignedOrderItem.confirmedQuantity ?? 0),
          0
        );
        
        // Calculate received quantity from GRN if it exists, otherwise use dispatched quantity
        let quantityReceived = 0;
        if (dispatch.goodsReceiptNote && dispatch.goodsReceiptNote.items) {
          // Use actual received quantities from GRN items
          quantityReceived = dispatch.goodsReceiptNote.items.reduce(
            (sum, item) => sum + item.receivedQuantity, 
            0
          );
        } else {
          // No GRN yet, use dispatched quantity
          quantityReceived = dispatch.items.reduce(
            (sum, item) => sum + item.dispatchedQuantity,
            0
          );
        }

        // Determine status based on GRN
        let mappedStatus: 'pending' | 'verified' | 'mismatch' = 'pending';
        if (dispatch.goodsReceiptNote) {
          if (dispatch.goodsReceiptNote.status === 'VERIFIED_OK') {
            mappedStatus = 'verified';
          } else if (
            dispatch.goodsReceiptNote.status === 'VERIFIED_MISMATCH' ||
            dispatch.goodsReceiptNote.status === 'PARTIALLY_VERIFIED'
          ) {
            mappedStatus = 'mismatch';
          }
        }

        // Apply status filter
        if (status && status !== 'all') {
          if (status === 'pending' && mappedStatus !== 'pending') return null;
          if (status === 'verified' && mappedStatus !== 'verified') return null;
          if (status === 'mismatch' && mappedStatus !== 'mismatch') return null;
        }

        // Prepare item details
        const itemDetails = dispatch.items.map((item) => ({
          id: item.id,
          assignedOrderItemId: item.assignedOrderItem.id,
          productName: item.assignedOrderItem.orderItem.productName,
          sku: item.assignedOrderItem.orderItem.sku || '',
          quantityInvoiced: item.assignedOrderItem.confirmedQuantity ?? 0,
          quantityDispatched: item.dispatchedQuantity,
          orderNumber: item.assignedOrderItem.orderItem.order.clientOrderId || 
                       item.assignedOrderItem.orderItem.order.orderNumber,
        }));

        return {
          id: dispatch.goodsReceiptNote?.id || dispatch.id, // Use GRN ID if exists, otherwise dispatch ID
          orderNumber: orderNumbers.join(', ') || 'N/A',
          vendor: {
            name: dispatch.vendor.companyName,
            id: dispatch.vendor.id,
            email: dispatch.vendor.user.email || '',
          },
          submittedAt: dispatch.dispatchDate.toISOString(),
          items: dispatch.items.length,
          quantityInvoiced: quantityInvoiced || 0,
          quantityReceived: quantityReceived,
          status: mappedStatus,
          dispatchId: dispatch.id,
          grnNumber: dispatch.goodsReceiptNote?.grnNumber,
          ticketId: dispatch.goodsReceiptNote?.ticket?.id,
          ticketNumber: dispatch.goodsReceiptNote?.ticket?.ticketNumber,
          verifiedBy: dispatch.goodsReceiptNote?.verifiedBy?.name,
          verifiedAt: dispatch.goodsReceiptNote?.verifiedAt?.toISOString(),
          itemDetails: itemDetails,
        };
      }).filter(Boolean);

      return res.json({
        success: true,
        data: {
          orders: receivedOrders,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            totalItems: totalCount,
            itemsPerPage: limit,
          },
        },
      });
    } catch (error) {
      logger.error('Error getting received orders', { error });
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch received orders',
      });
    }
  }

  /**
   * Get received order details
   * GET /api/ops/received-orders/:id
   */
  async getReceivedOrderDetails(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const grn = await prisma.goodsReceiptNote.findUnique({
        where: { id },
        include: {
          dispatch: {
            include: {
              vendor: {
                include: {
                  user: true,
                },
              },
            },
          },
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
          ticket: {
            include: {
              comments: {
                include: {
                  user: true,
                },
                orderBy: { createdAt: 'desc' },
              },
            },
          },
          verifiedBy: true,
        },
      });

      if (!grn) {
        return ResponseHelper.notFound(res, 'Received order not found');
      }

      return res.json({
        success: true,
        data: grn,
      });
    } catch (error) {
      logger.error('Error getting received order details', {
        error,
        orderId: req.params.id,
      });
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch received order details',
      });
    }
  }

  /**
   * Verify received order as OK
   * POST /api/ops/received-orders/:id/verify
   */
  async verifyOrder(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User authentication required',
        });
      }

      const validation = verifyOrderSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid input',
          details: validation.error.errors,
        });
      }

      const { verificationNotes } = validation.data;

      // First check if this is a dispatch ID or GRN ID
      let grn = await prisma.goodsReceiptNote.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              assignedOrderItem: true,
            },
          },
          dispatch: true,
        },
      });

      // If not found, check if it's a dispatch ID
      if (!grn) {
        const dispatch = await prisma.dispatch.findUnique({
          where: { id },
          include: {
            items: {
              include: {
                assignedOrderItem: true,
              },
            },
            goodsReceiptNote: true,
          },
        });

        if (!dispatch) {
          return ResponseHelper.notFound(res, 'Received order not found');
        }

        // If dispatch has a GRN, use it; otherwise create one
        if (dispatch.goodsReceiptNote) {
          grn = await prisma.goodsReceiptNote.findUnique({
            where: { id: dispatch.goodsReceiptNote.id },
            include: {
              items: {
                include: {
                  assignedOrderItem: true,
                },
              },
              dispatch: true,
            },
          });
        } else {
          // Create GRN from dispatch items
          grn = await prisma.goodsReceiptNote.create({
            data: {
              dispatchId: dispatch.id,
              grnNumber: `GRN-${Date.now()}`,
              receivedAt: new Date(),
              status: 'PENDING_VERIFICATION',
              verifiedById: userId,
              items: {
                create: dispatch.items.map((item) => ({
                  assignedOrderItem: {
                    connect: { id: item.assignedOrderItem.id },
                  },
                  dispatchItem: {
                    connect: { id: item.id },
                  },
                  receivedQuantity: item.dispatchedQuantity,
                  assignedQuantity: item.assignedOrderItem.assignedQuantity,
                  confirmedQuantity: item.assignedOrderItem.confirmedQuantity || item.assignedOrderItem.assignedQuantity,
                  status: 'VERIFIED_OK',
                })),
              },
            },
            include: {
              items: {
                include: {
                  assignedOrderItem: true,
                },
              },
              dispatch: true,
            },
          });
        }
      }

      if (!grn || grn.status !== 'PENDING_VERIFICATION') {
        return res.status(400).json({
          success: false,
          error: `Order cannot be verified. Current status: ${grn?.status || 'unknown'}`,
        });
      }

      // Update GRN and related items with retry logic
      let updatedGRN;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          updatedGRN = await prisma.$transaction(async (tx) => {
            // Update GRN status
            const updated = await tx.goodsReceiptNote.update({
              where: { id },
              data: {
                status: 'VERIFIED_OK',
                verifiedById: userId,
                verifiedAt: new Date(),
                operatorRemarks: verificationNotes,
              },
            });

            // Update all GRN items to VERIFIED_OK
            await tx.goodsReceiptItem.updateMany({
              where: { goodsReceiptNoteId: id },
              data: {
                status: 'VERIFIED_OK',
              },
            });

            // Update assignment status to VERIFIED_OK
            const assignmentIds = grn.items.map((item) => item.assignedOrderItemId);

            if (assignmentIds.length > 0) {
              await tx.assignedOrderItem.updateMany({
                where: { id: { in: assignmentIds } },
                data: {
                  status: 'VERIFIED_OK',
                },
              });
            }

            // Create audit log
            await tx.auditLog.create({
              data: {
                actorUserId: userId,
                action: APP_CONSTANTS.AUDIT_ACTIONS.GRN_VERIFIED_OK,
                entityType: 'GoodsReceiptNote',
                entityId: id,
                metadata: {
                  grnNumber: grn.grnNumber,
                  dispatchId: grn.dispatchId,
                  itemCount: grn.items.length,
                  verificationNotes,
                },
              },
            });

            return updated;
          }, {
            timeout: 30000, // 30 seconds timeout
            isolationLevel: 'ReadCommitted'
          });
          break; // Success, exit retry loop
        } catch (error: any) {
          retryCount++;
          logger.warn(`Transaction attempt ${retryCount} failed for GRN verification`, {
            error: error.message,
            grnId: id,
            retryCount
          });

          if (retryCount >= maxRetries) {
            throw error; // Re-throw if max retries reached
          }

          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }

      logger.info('Received order verified successfully', {
        grnId: id,
        grnNumber: grn.grnNumber,
        userId,
      });

      return res.json({
        success: true,
        data: updatedGRN,
        message: 'Order verified successfully',
      });
    } catch (error: any) {
      logger.error('Error verifying received order', {
        error: error.message,
        code: error.code,
        orderId: req.params.id,
      });
      
      // Provide more specific error messages
      let errorMessage = 'Failed to verify order';
      if (error.code === 'P2028') {
        errorMessage = 'Database transaction timeout. Please try again.';
      } else if (error.code === 'P2002') {
        errorMessage = 'Duplicate entry detected. Please refresh and try again.';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Request timeout. Please try again.';
      }
      
      return res.status(500).json({
        success: false,
        error: errorMessage,
      });
    }
  }

  /**
   * Raise ticket for mismatch
   * POST /api/ops/received-orders/:id/raise-ticket
   */
  async raiseTicket(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User authentication required',
        });
      }

      const validation = raiseTicketSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid input',
          details: validation.error.errors,
        });
      }

      const { issueType, comments, mismatches, operatorRemarks } = validation.data;

      // First check if this is a dispatch ID or GRN ID
      let grn = await prisma.goodsReceiptNote.findUnique({
        where: { id },
        include: {
          dispatch: {
            include: {
              vendor: true,
            },
          },
          items: true,
        },
      });

      // If not found, check if it's a dispatch ID
      if (!grn) {
        const dispatch = await prisma.dispatch.findUnique({
          where: { id },
          include: {
            vendor: true,
            items: {
              include: {
                assignedOrderItem: true,
              },
            },
            goodsReceiptNote: true,
          },
        });

        if (!dispatch) {
          return ResponseHelper.notFound(res, 'Received order not found');
        }

        // If dispatch has a GRN, use it; otherwise create one
        if (dispatch.goodsReceiptNote) {
          grn = await prisma.goodsReceiptNote.findUnique({
            where: { id: dispatch.goodsReceiptNote.id },
            include: {
              dispatch: {
                include: {
                  vendor: true,
                },
              },
              items: {
                include: {
                  assignedOrderItem: true,
                },
              },
            },
          });
        } else {
          // Create GRN from dispatch items
          grn = await prisma.goodsReceiptNote.create({
            data: {
              dispatchId: dispatch.id,
              grnNumber: `GRN-${Date.now()}`,
              receivedAt: new Date(),
              status: 'PENDING_VERIFICATION',
              verifiedById: userId,
              items: {
                create: dispatch.items.map((item) => ({
                  assignedOrderItem: {
                    connect: { id: item.assignedOrderItem.id },
                  },
                  dispatchItem: {
                    connect: { id: item.id },
                  },
                  receivedQuantity: item.dispatchedQuantity,
                  assignedQuantity: item.assignedOrderItem.assignedQuantity,
                  confirmedQuantity: item.assignedOrderItem.confirmedQuantity || item.assignedOrderItem.assignedQuantity,
                  status: 'QUANTITY_MISMATCH',
                })),
              },
            },
            include: {
              dispatch: {
                include: {
                  vendor: true,
                },
              },
              items: {
                include: {
                  assignedOrderItem: true,
                },
              },
            },
          });
        }
      }

      if (!grn || grn.status !== 'PENDING_VERIFICATION') {
        return res.status(400).json({
          success: false,
          error: `Ticket cannot be raised. GRN status: ${grn?.status || 'unknown'}`,
        });
      }

      // Map frontend IDs to GRN item IDs (support both dispatchItemId and assignedOrderItemId)
      const grnItemsByDispatch = new Map(
        grn.items.map((grnItem) => [grnItem.dispatchItemId, grnItem.id])
      );
      const grnItemsByAssignment = new Map(
        grn.items.map((grnItem) => [grnItem.assignedOrderItemId, grnItem.id])
      );

      // Update mismatches with correct GRN item IDs
      const correctedMismatches = mismatches.map((mismatch) => {
        // Prefer mapping via dispatch item id, fallback to assigned order item id
        const mappedGrnItemId =
          grnItemsByDispatch.get(mismatch.grnItemId) ||
          grnItemsByAssignment.get(mismatch.assignedOrderItemId) ||
          mismatch.grnItemId;

        return {
          ...mismatch,
          grnItemId: mappedGrnItemId,
        };
      });

      // Process verification with mismatches using existing GRN service
      const result = await GRNAutoTicketingService.processGRNVerification({
        goodsReceiptNoteId: grn.id,
        grnNumber: grn.grnNumber,
        dispatchId: grn.dispatchId,
        operatorRemarks: operatorRemarks || comments,
        mismatches: correctedMismatches,
        verifiedById: userId,
      });

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.message,
        });
      }

      logger.info('Ticket raised for received order', {
        grnId: grn.id,
        grnNumber: grn.grnNumber,
        ticketId: result.ticket?.id,
        userId,
      });

      return res.json({
        success: true,
        data: {
          grn: result.grn,
          ticket: result.ticket,
          message: result.message,
        },
        message: 'Ticket raised successfully',
      });
    } catch (error: any) {
      logger.error('Error raising ticket for received order', {
        error: error.message,
        code: error.code,
        orderId: req.params.id,
      });
      
      // Provide more specific error messages
      let errorMessage = 'Failed to raise ticket';
      if (error.code === 'P2028') {
        errorMessage = 'Database transaction timeout. Please try again.';
      } else if (error.code === 'P2002') {
        errorMessage = 'Duplicate entry detected. Please refresh and try again.';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Request timeout. Please try again.';
      }
      
      return res.status(500).json({
        success: false,
        error: errorMessage,
      });
    }
  }

  /**
   * Get received orders summary/metrics
   * GET /api/ops/received-orders/metrics
   */
  async getMetrics(req: Request, res: Response) {
    try {
      const metrics = await prisma.$transaction(async (tx) => {
        // Count dispatches with different GRN statuses
        const [allDispatches, dispatchesWithGRN] = await Promise.all([
          tx.dispatch.count({
            where: { status: { in: ['DISPATCHED', 'IN_TRANSIT', 'DELIVERED'] } },
          }),
          tx.dispatch.findMany({
            where: { 
              status: { in: ['DISPATCHED', 'IN_TRANSIT', 'DELIVERED'] },
            },
            include: {
              goodsReceiptNote: {
                select: {
                  status: true,
                  ticket: { select: { id: true, status: true } },
                },
              },
            },
          }),
        ]);

        // Calculate metrics based on GRN status
        let pending = 0;
        let verified = 0;
        let mismatch = 0;

        dispatchesWithGRN.forEach((dispatch) => {
          if (!dispatch.goodsReceiptNote) {
            pending++;
            return;
          }

          // Treat GRNs with an active ticket as mismatch (current mismatches)
          if (
            dispatch.goodsReceiptNote.ticket &&
            (dispatch.goodsReceiptNote.ticket.status === 'OPEN' || dispatch.goodsReceiptNote.ticket.status === 'IN_PROGRESS')
          ) {
            mismatch++;
            return;
          }

          // Verified OK
          if (dispatch.goodsReceiptNote.status === 'VERIFIED_OK') {
            verified++;
            return;
          }

          // Historic/explicit mismatch statuses
          if (
            dispatch.goodsReceiptNote.status === 'VERIFIED_MISMATCH' ||
            dispatch.goodsReceiptNote.status === 'PARTIALLY_VERIFIED'
          ) {
            mismatch++;
            return;
          }

          // Default to pending
          pending++;
        });

        return {
          pending,
          verified,
          mismatch,
          total: allDispatches,
        };
      });

      return res.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      logger.error('Error getting received orders metrics', { error });
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch metrics',
      });
    }
  }

  /**
   * Get vendor-wise mismatch analysis
   * GET /api/ops/received-orders/vendor-mismatch
   */
  async getVendorMismatchAnalysis(req: Request, res: Response) {
    try {
      // Optional date filters for dispatchDate
      const dateFrom = req.query.dateFrom as string | undefined;
      const dateTo = req.query.dateTo as string | undefined;

      const baseWhere: Record<string, unknown> = {
        status: { in: ['DISPATCHED', 'IN_TRANSIT', 'DELIVERED'] },
      };

      if (dateFrom || dateTo) {
        (baseWhere as { dispatchDate?: Record<string, Date> }).dispatchDate = {};
        if (dateFrom) {
          (baseWhere as { dispatchDate: Record<string, Date> }).dispatchDate.gte = new Date(dateFrom);
        }
        if (dateTo) {
          (baseWhere as { dispatchDate: Record<string, Date> }).dispatchDate.lte = new Date(dateTo);
        }
      }

      // Total orders per vendor (eligible dispatches)
      const totals = await prisma.dispatch.groupBy({
        by: ['vendorId'],
        where: baseWhere,
        _count: { _all: true },
      });

      // Mismatch orders per vendor: count dispatches whose GRN has an active ticket (current mismatches)
      const mismatches = await prisma.dispatch.groupBy({
        by: ['vendorId'],
        where: {
          ...baseWhere,
          goodsReceiptNote: {
            is: {
              ticket: {
                is: {
                  status: { in: ['OPEN', 'IN_PROGRESS'] },
                },
              },
            },
          },
        },
        _count: { _all: true },
      });

      const vendorIds = Array.from(new Set(totals.map(t => t.vendorId)));

      if (vendorIds.length === 0) {
        return res.json({ success: true, data: [] });
      }

      // Fetch vendor details
      const vendors = await prisma.vendorProfile.findMany({
        where: { id: { in: vendorIds } },
        include: { user: true },
      });

      const mismatchMap = new Map<string, number>();
      mismatches.forEach((m: { vendorId: string; _count: { _all: number } }) => mismatchMap.set(m.vendorId, m._count._all));

      const getPerformanceLabel = (percentage: number): 'Excellent' | 'Good' | 'Needs Attention' => {
        if (percentage <= 2) return 'Excellent';
        if (percentage <= 5) return 'Good';
        return 'Needs Attention';
      };

      const rows = totals.map((t: { vendorId: string; _count: { _all: number } }) => {
        const vendor = vendors.find((v: { id: string }) => v.id === t.vendorId);
        const totalOrders = t._count._all;
        const mismatchOrders = mismatchMap.get(t.vendorId) ?? 0;
        const mismatchPercentage = totalOrders > 0 ? Math.round((mismatchOrders / totalOrders) * 1000) / 10 : 0; // one decimal
        const performance = getPerformanceLabel(mismatchPercentage);
        return {
          vendorName: vendor?.companyName ?? 'Unknown Vendor',
          vendorId: vendor?.id ?? t.vendorId,
          totalOrders: totalOrders,
          mismatchOrders: mismatchOrders,
          mismatchPercentage: mismatchPercentage,
          performance,
          contactEmail: vendor?.user?.email ?? null,
        };
      });

      // Sort by mismatch percentage desc
      rows.sort((a, b) => b.mismatchPercentage - a.mismatchPercentage);

      return res.json({ success: true, data: rows });
    } catch (error) {
      logger.error('Error getting vendor-wise mismatch analysis', { error });
      return res.status(500).json({ success: false, error: 'Failed to fetch vendor mismatch analysis' });
    }
  }
}

export const receivedOrdersController = new ReceivedOrdersController();

