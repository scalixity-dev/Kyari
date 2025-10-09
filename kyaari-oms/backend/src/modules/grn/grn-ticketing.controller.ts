import { Request, Response } from 'express';
import { ResponseHelper } from '../../utils/response';
import { logger } from '../../utils/logger';
import { GRNAutoTicketingService, GRNMismatchData } from '../../services/grn-auto-ticketing.service';
import { prisma } from '../../config/database';
import { z } from 'zod';

// Validation schemas
const grnItemMismatchSchema = z.object({
  grnItemId: z.string().min(1, 'GRN item ID is required'),
  assignedOrderItemId: z.string().min(1, 'Assigned order item ID is required'),
  assignedQuantity: z.number().min(0, 'Assigned quantity must be non-negative'),
  confirmedQuantity: z.number().min(0, 'Confirmed quantity must be non-negative'),
  receivedQuantity: z.number().min(0, 'Received quantity must be non-negative'),
  discrepancyQuantity: z.number(),
  status: z.enum(['VERIFIED_OK', 'QUANTITY_MISMATCH', 'DAMAGE_REPORTED', 'SHORTAGE_REPORTED', 'EXCESS_RECEIVED']),
  itemRemarks: z.string().optional(),
  damageReported: z.boolean().default(false),
  damageDescription: z.string().optional(),
});

const processGRNVerificationSchema = z.object({
  goodsReceiptNoteId: z.string().min(1, 'GRN ID is required'),
  grnNumber: z.string().min(1, 'GRN number is required'),
  dispatchId: z.string().min(1, 'Dispatch ID is required'),
  operatorRemarks: z.string().optional(),
  mismatches: z.array(grnItemMismatchSchema).min(1, 'At least one mismatch item is required'),
});

const updateTicketStatusSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
  comment: z.string().optional(),
});

// Validation helper function
const validateSchema = <T>(schema: z.ZodType<T, any, any>, data: unknown): { success: true; data: T } | { success: false; errors: Record<string, string[]> } => {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string[]> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(err.message);
      });
      return { success: false, errors };
    }
    throw error;
  }
};

export class GRNTicketingController {
  /**
   * Process GRN verification and auto-create tickets for mismatches
   * POST /api/grn/verify
   */
  static processGRNVerification = async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validation = validateSchema(processGRNVerificationSchema, req.body);
      if (!validation.success) {
        return ResponseHelper.validationError(res, validation.errors);
      }

      const grnData: GRNMismatchData = {
        ...validation.data,
        verifiedById: req.user!.userId
      };

      // Verify GRN exists and is pending verification
      const existingGRN = await prisma.goodsReceiptNote.findUnique({
        where: { id: grnData.goodsReceiptNoteId },
        include: {
          dispatch: {
            include: {
              vendor: true
            }
          }
        }
      });

      if (!existingGRN) {
        return ResponseHelper.notFound(res, 'Goods Receipt Note not found');
      }

      if (existingGRN.status !== 'PENDING_VERIFICATION') {
        return ResponseHelper.error(res, 'GRN has already been verified', 400);
      }

      // Process the verification
      const result = await GRNAutoTicketingService.processGRNVerification(grnData);

      if (!result.success) {
        return ResponseHelper.internalError(res, result.message);
      }

      logger.info('GRN verification processed successfully', {
        grnId: grnData.goodsReceiptNoteId,
        grnNumber: grnData.grnNumber,
        hasTicket: !!result.ticket,
        userId: req.user?.userId
      });

      return ResponseHelper.success(res, {
        grn: {
          id: result.grn.id,
          grnNumber: result.grn.grnNumber,
          status: result.grn.status,
          verifiedAt: result.grn.verifiedAt
        },
        ticket: result.ticket ? {
          id: result.ticket.id,
          ticketNumber: result.ticket.ticketNumber,
          title: result.ticket.title,
          priority: result.ticket.priority,
          status: result.ticket.status
        } : null,
        mismatches: grnData.mismatches.length,
        message: result.message
      }, result.message);

    } catch (error) {
      logger.error('Failed to process GRN verification', { error, body: req.body });
      return ResponseHelper.internalError(res, 'Failed to process GRN verification');
    }
  };

  /**
   * Get ticket by GRN ID
   * GET /api/grn/:grnId/ticket
   */
  static getTicketByGRN = async (req: Request, res: Response) => {
    try {
      const { grnId } = req.params;

      const ticket = await GRNAutoTicketingService.getTicketByGRNId(grnId);

      if (!ticket) {
        return ResponseHelper.notFound(res, 'No ticket found for this GRN');
      }

      return ResponseHelper.success(res, ticket, 'Ticket retrieved successfully');

    } catch (error) {
      logger.error('Failed to get ticket by GRN ID', { error, grnId: req.params.grnId });
      return ResponseHelper.internalError(res, 'Failed to retrieve ticket');
    }
  };

  /**
   * Update ticket status
   * PATCH /api/tickets/:ticketId/status
   */
  static updateTicketStatus = async (req: Request, res: Response) => {
    try {
      const { ticketId } = req.params;

      // Validate request body
      const validation = validateSchema(updateTicketStatusSchema, req.body);
      if (!validation.success) {
        return ResponseHelper.validationError(res, validation.errors);
      }

      const { status, comment } = validation.data;

      // Verify ticket exists
      const existingTicket = await prisma.ticket.findUnique({
        where: { id: ticketId }
      });

      if (!existingTicket) {
        return ResponseHelper.notFound(res, 'Ticket not found');
      }

      // Update ticket status
      const result = await GRNAutoTicketingService.updateTicketStatus(
        ticketId,
        status,
        req.user!.userId,
        comment
      );

      if (!result.success) {
        return ResponseHelper.internalError(res, result.message);
      }

      logger.info('Ticket status updated', {
        ticketId,
        status,
        userId: req.user?.userId
      });

      return ResponseHelper.success(res, {
        ticket: {
          id: result.ticket?.id,
          ticketNumber: result.ticket?.ticketNumber,
          status: result.ticket?.status,
          resolvedAt: result.ticket?.resolvedAt
        }
      }, result.message);

    } catch (error) {
      logger.error('Failed to update ticket status', { error, ticketId: req.params.ticketId });
      return ResponseHelper.internalError(res, 'Failed to update ticket status');
    }
  };

  /**
   * Get GRN details with verification status
   * GET /api/grn/:grnId
   */
  static getGRNDetails = async (req: Request, res: Response) => {
    try {
      const { grnId } = req.params;

      const grn = await prisma.goodsReceiptNote.findUnique({
        where: { id: grnId },
        include: {
          dispatch: {
            include: {
              vendor: {
                include: {
                  user: true
                }
              }
            }
          },
          items: {
            include: {
              assignedOrderItem: {
                include: {
                  orderItem: true,
                  purchaseOrderItem: {
                    include: {
                      purchaseOrder: true
                    }
                  }
                }
              }
            }
          },
          ticket: {
            include: {
              comments: {
                include: {
                  user: true
                },
                orderBy: { createdAt: 'desc' }
              }
            }
          },
          verifiedBy: true
        }
      });

      if (!grn) {
        return ResponseHelper.notFound(res, 'Goods Receipt Note not found');
      }

      return ResponseHelper.success(res, grn, 'GRN details retrieved successfully');

    } catch (error) {
      logger.error('Failed to get GRN details', { error, grnId: req.params.grnId });
      return ResponseHelper.internalError(res, 'Failed to retrieve GRN details');
    }
  };

  /**
   * Get all pending GRNs for verification
   * GET /api/grn/pending
   */
  static getPendingGRNs = async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 20 } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      const [grns, total] = await Promise.all([
        prisma.goodsReceiptNote.findMany({
          where: { status: 'PENDING_VERIFICATION' },
          include: {
            dispatch: {
              include: {
                vendor: {
                  include: {
                    user: true
                  }
                }
              }
            },
            items: {
              include: {
                assignedOrderItem: {
                  include: {
                    orderItem: true
                  }
                }
              }
            }
          },
          orderBy: { receivedAt: 'desc' },
          skip: offset,
          take: limitNum
        }),
        prisma.goodsReceiptNote.count({
          where: { status: 'PENDING_VERIFICATION' }
        })
      ]);

      return ResponseHelper.success(res, {
        grns,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalItems: total,
          itemsPerPage: limitNum
        }
      }, 'Pending GRNs retrieved successfully');

    } catch (error) {
      logger.error('Failed to get pending GRNs', { error, userId: req.user?.userId });
      return ResponseHelper.internalError(res, 'Failed to retrieve pending GRNs');
    }
  };
}