import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { EnhancedValidationService } from '../validation/validation.service';
import { logger } from '../../utils/logger';
import { z } from 'zod';

const prisma = new PrismaClient();
const validationService = new EnhancedValidationService(prisma);

// Validation schemas
const verifyInvoiceSchema = z.object({
  action: z.enum(['approve', 'reject', 'request_changes']),
  remarks: z.string().optional(),
  verificationNotes: z.string().optional(),
  rejectionReason: z.string().optional()
});

const bulkVerificationSchema = z.object({
  invoiceIds: z.array(z.string()),
  action: z.enum(['approve', 'reject']),
  remarks: z.string().optional()
});

export class OpsVerificationController {

  /**
   * Get pending invoices for verification
   */
  async getPendingInvoices(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const vendor = req.query.vendor as string;
      const amountRange = req.query.amountRange as string;
      const dateRange = req.query.dateRange as string;

      const skip = (page - 1) * limit;
      
      // Build where clause
      const where: any = {
        status: 'PENDING_VERIFICATION'
      };

      if (vendor) {
        where.purchaseOrder = {
          vendor: {
            companyName: {
              contains: vendor,
              mode: 'insensitive'
            }
          }
        };
      }

      if (amountRange) {
        const [min, max] = amountRange.split('-').map(Number);
        if (min && max) {
          where.invoiceAmount = {
            gte: min,
            lte: max
          };
        }
      }

      if (dateRange) {
        const [startDate, endDate] = dateRange.split(',');
        if (startDate && endDate) {
          where.invoiceDate = {
            gte: new Date(startDate),
            lte: new Date(endDate)
          };
        }
      }

      const [invoices, totalCount] = await Promise.all([
        prisma.vendorInvoice.findMany({
          where,
          include: {
            purchaseOrder: {
              include: {
                vendor: {
                  include: {
                    user: true
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
              }
            },
            attachment: true
          },
          skip,
          take: limit,
          orderBy: {
            invoiceDate: 'desc'
          }
        }),
        prisma.vendorInvoice.count({ where })
      ]);

      // Add validation results for each invoice
      const invoicesWithValidation = await Promise.all(
        invoices.map(async (invoice) => {
          const validation = await validationService.validateInvoiceAmount(
            invoice.id,
            Number(invoice.invoiceAmount)
          );

          return {
            ...invoice,
            validation: {
              isValid: validation.isValid,
              errors: validation.errors,
              warnings: validation.warnings
            }
          };
        })
      );

      return res.json({
        success: true,
        data: {
          invoices: invoicesWithValidation,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            totalItems: totalCount,
            itemsPerPage: limit
          }
        }
      });

    } catch (error) {
      logger.error('Error getting pending invoices', { error });
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch pending invoices'
      });
    }
  }

  /**
   * Get detailed invoice for verification
   */
  async getInvoiceDetails(req: Request, res: Response) {
    try {
      const { invoiceId } = req.params;

      const invoice = await prisma.vendorInvoice.findUnique({
        where: { id: invoiceId },
        include: {
          purchaseOrder: {
            include: {
              vendor: {
                include: {
                  user: true
                }
              },
              items: {
                include: {
                  assignedOrderItem: {
                    include: {
                      orderItem: true,
                      dispatchItems: {
                        include: {
                          dispatch: true
                        }
                      },
                      goodsReceiptItems: {
                        include: {
                          goodsReceiptNote: true
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          attachment: true
        }
      });

      if (!invoice) {
        return res.status(404).json({
          success: false,
          error: 'Invoice not found'
        });
      }

      // Run comprehensive validation
      const validation = await validationService.validateInvoiceAmount(
        invoice.id,
        Number(invoice.invoiceAmount)
      );

      // Check vendor authorization
      const vendorAuth = await validationService.validateVendorAuthorization(
        invoice.purchaseOrder.vendorId,
        invoice.purchaseOrder.items[0]?.assignedOrderItem.orderItem.orderId || ''
      );

      // Calculate summary metrics
      const summary = {
        totalPOAmount: Number(invoice.purchaseOrder.totalAmount),
        invoiceAmount: Number(invoice.invoiceAmount),
        variance: Number(invoice.invoiceAmount) - Number(invoice.purchaseOrder.totalAmount),
        variancePercentage: ((Number(invoice.invoiceAmount) - Number(invoice.purchaseOrder.totalAmount)) / Number(invoice.purchaseOrder.totalAmount)) * 100,
        itemCount: invoice.purchaseOrder.items.length,
        vendorRating: invoice.purchaseOrder.vendor.fillRate || 0
      };

      return res.json({
        success: true,
        data: {
          invoice,
          validation,
          vendorAuth,
          summary
        }
      });

    } catch (error) {
      logger.error('Error getting invoice details', { error, invoiceId: req.params.invoiceId });
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch invoice details'
      });
    }
  }

  /**
   * Verify (approve/reject) invoice
   */
  async verifyInvoice(req: Request, res: Response) {
    try {
      const { invoiceId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User authentication required'
        });
      }

      const validation = verifyInvoiceSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid input',
          details: validation.error.errors
        });
      }

      const { action, remarks, verificationNotes, rejectionReason } = validation.data;

      // Check if invoice exists and is pending
      const invoice = await prisma.vendorInvoice.findUnique({
        where: { id: invoiceId },
        include: {
          purchaseOrder: {
            include: {
              vendor: { include: { user: true } }
            }
          }
        }
      });

      if (!invoice) {
        return res.status(404).json({
          success: false,
          error: 'Invoice not found'
        });
      }

      if (invoice.status !== 'PENDING_VERIFICATION') {
        return res.status(400).json({
          success: false,
          error: `Invoice cannot be verified. Current status: ${invoice.status}`
        });
      }

      // Validate business rules
      const businessRulesValidation = await validationService.validateBusinessRules(
        'invoice',
        invoiceId,
        action
      );

      if (!businessRulesValidation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Business rules validation failed',
          details: businessRulesValidation.errors
        });
      }

      let updatedInvoice;

      await prisma.$transaction(async (tx) => {
        // Update invoice status
        const newStatus =
          action === 'approve'
            ? 'APPROVED'
            : action === 'request_changes'
              ? 'NEEDS_REVISION'
              : 'REJECTED';
        
        updatedInvoice = await tx.vendorInvoice.update({
          where: { id: invoiceId },
          data: {
            status: newStatus,
            ...(remarks && { metadata: { verificationRemarks: remarks } }),
            updatedAt: new Date()
          }
        });
        // Create audit log
        await tx.auditLog.create({
          data: {
            actorUserId: userId,
            action: `INVOICE_${action.toUpperCase()}`,
            entityType: 'VendorInvoice',
            entityId: invoiceId,
            metadata: {
              action,
              remarks,
              verificationNotes,
              rejectionReason,
              invoiceAmount: Number(invoice.invoiceAmount),
              vendorId: invoice.purchaseOrder.vendorId
            }
          }
        });

        // If approved, initiate payment workflow
        if (action === 'approve') {
          await tx.payment.create({
            data: {
              purchaseOrderId: invoice.purchaseOrderId,
              amount: invoice.invoiceAmount,
              status: 'PENDING',
              processedById: userId
            }
          });

          // Update PO status
          await tx.purchaseOrder.update({
            where: { id: invoice.purchaseOrderId },
            data: { status: 'PARTIALLY_PAID' }
          });
        }
      });

      logger.info(`Invoice ${action}d by operations team`, {
        invoiceId,
        action,
        userId,
        vendorId: invoice.purchaseOrder.vendorId
      });

      return res.json({
        success: true,
        data: updatedInvoice,
        message: `Invoice ${action}d successfully`
      });

    } catch (error) {
      logger.error('Error verifying invoice', { error, invoiceId: req.params.invoiceId });
      return res.status(500).json({
        success: false,
        error: 'Failed to verify invoice'
      });
    }
  }

  /**
   * Bulk verification of multiple invoices
   */
  async bulkVerifyInvoices(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User authentication required'
        });
      }

      const validation = bulkVerificationSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid input',
          details: validation.error.errors
        });
      }

      const { invoiceIds, action, remarks } = validation.data;

      if (invoiceIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No invoice IDs provided'
        });
      }

      const results = [];

      for (const invoiceId of invoiceIds) {
        try {
          const invoice = await prisma.vendorInvoice.findUnique({
            where: { id: invoiceId },
            include: { purchaseOrder: true }
          });

          if (!invoice || invoice.status !== 'PENDING_VERIFICATION') {
            results.push({
              invoiceId,
              success: false,
              error: 'Invoice not found or not pending verification'
            });
            continue;
          }

          // Validate business rules
          const businessRulesValidation = await validationService.validateBusinessRules(
            'invoice',
            invoiceId,
            action
          );

          if (!businessRulesValidation.isValid) {
            results.push({
              invoiceId,
              success: false,
              error: 'Business rules validation failed'
            });
            continue;
          }

          await prisma.$transaction(async (tx) => {
            const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';
            
            await tx.vendorInvoice.update({
              where: { id: invoiceId },
              data: {
                status: newStatus,
                ...(remarks && { metadata: { bulkVerificationRemarks: remarks } }),
                updatedAt: new Date()
              }
            });

            // Create audit log
            await tx.auditLog.create({
              data: {
                actorUserId: userId,
                action: `BULK_INVOICE_${action.toUpperCase()}`,
                entityType: 'VendorInvoice',
                entityId: invoiceId,
                metadata: {
                  action,
                  remarks,
                  invoiceAmount: Number(invoice.invoiceAmount),
                  bulkOperation: true
                }
              }
            });

            // If approved, initiate payment workflow
            if (action === 'approve') {
              await tx.payment.create({
                data: {
                  purchaseOrderId: invoice.purchaseOrderId,
                  amount: invoice.invoiceAmount,
                  status: 'PENDING',
                  processedById: userId
                }
              });

              // Update PO status
              await tx.purchaseOrder.update({
                where: { id: invoice.purchaseOrderId },
                data: { status: 'PARTIALLY_PAID' }
              });
            }
          });

          results.push({
            invoiceId,
            success: true,
            message: `Invoice ${action}d successfully`
          });

        } catch (error) {
          logger.error('Error in bulk verification', { error, invoiceId });
          results.push({
            invoiceId,
            success: false,
            error: 'Processing error'
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      return res.json({
        success: failCount === 0,
        data: {
          results,
          summary: {
            total: invoiceIds.length,
            successful: successCount,
            failed: failCount
          }
        },
        message: `Bulk verification completed: ${successCount} successful, ${failCount} failed`
      });

    } catch (error) {
      logger.error('Error in bulk verification', { error });
      return res.status(500).json({
        success: false,
        error: 'Failed to perform bulk verification'
      });
    }
  }

  /**
   * Get verification history
   */
  async getVerificationHistory(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const action = req.query.action as string;
      const verifiedBy = req.query.verifiedBy as string;

      const skip = (page - 1) * limit;

      const where: any = {
        action: {
          in: ['INVOICE_APPROVE', 'INVOICE_REJECT', 'BULK_INVOICE_APPROVE', 'BULK_INVOICE_REJECT']
        }
      };

      if (action) {
        where.action = action;
      }

      if (verifiedBy) {
        where.actorUserId = verifiedBy;
      }

      const [logs, totalCount] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          include: {
            actorUser: {
              select: {
                name: true,
                email: true
              }
            }
          },
          skip,
          take: limit,
          orderBy: {
            createdAt: 'desc'
          }
        }),
        prisma.auditLog.count({ where })
      ]);

      return res.json({
        success: true,
        data: {
          history: logs,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            totalItems: totalCount,
            itemsPerPage: limit
          }
        }
      });

    } catch (error) {
      logger.error('Error getting verification history', { error });
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch verification history'
      });
    }
  }

  /**
   * Get verification dashboard metrics
   */
  async getVerificationMetrics(req: Request, res: Response) {
    try {
      const timeframe = req.query.timeframe as string || '30d';
      
      let dateFilter: Date;
      switch (timeframe) {
        case '7d':
          dateFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          dateFilter = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      }

      const metrics = await prisma.$transaction(async (tx) => {
        const [
          pendingCount,
          approvedCount,
          rejectedCount,
          totalProcessed,
          avgProcessingTime,
          highValuePending
        ] = await Promise.all([
          // Pending invoices
          tx.vendorInvoice.count({
            where: { status: 'PENDING_VERIFICATION' }
          }),

          // Approved in timeframe
          tx.vendorInvoice.count({
            where: {
              status: 'APPROVED',
              updatedAt: { gte: dateFilter }
            }
          }),

          // Rejected in timeframe
          tx.vendorInvoice.count({
            where: {
              status: 'REJECTED',
              updatedAt: { gte: dateFilter }
            }
          }),

          // Total processed in timeframe
          tx.vendorInvoice.count({
            where: {
              status: { in: ['APPROVED', 'REJECTED'] },
              updatedAt: { gte: dateFilter }
            }
          }),

          // Average processing time (placeholder - would need verification timestamps)
          tx.vendorInvoice.aggregate({
            where: {
              status: { in: ['APPROVED', 'REJECTED'] },
              updatedAt: { gte: dateFilter }
            },
            _avg: {
              invoiceAmount: true
            }
          }),

          // High value pending (>50k)
          tx.vendorInvoice.count({
            where: {
              status: 'PENDING_VERIFICATION',
              invoiceAmount: { gte: 50000 }
            }
          })
        ]);

        return {
          pending: {
            total: pendingCount,
            highValue: highValuePending
          },
          processed: {
            approved: approvedCount,
            rejected: rejectedCount,
            total: totalProcessed,
            approvalRate: totalProcessed > 0 ? (approvedCount / totalProcessed) * 100 : 0
          },
          averages: {
            invoiceValue: Number(avgProcessingTime._avg.invoiceAmount || 0),
            processingTimeHours: 24 // Placeholder
          }
        };
      });

      return res.json({
        success: true,
        data: {
          timeframe,
          metrics
        }
      });

    } catch (error) {
      logger.error('Error getting verification metrics', { error });
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch verification metrics'
      });
    }
  }
}

export const opsVerificationController = new OpsVerificationController();