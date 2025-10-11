import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { EnhancedValidationService } from './validation.service';
import { logger } from '../../utils/logger';
import { z } from 'zod';

const prisma = new PrismaClient();
const validationService = new EnhancedValidationService(prisma);

// Validation schemas
const validateInvoiceAmountSchema = z.object({
  invoiceId: z.string(),
  proposedAmount: z.number().positive()
});

const validateVendorAuthSchema = z.object({
  vendorId: z.string(),
  orderId: z.string()
});

const validateBusinessRulesSchema = z.object({
  entityType: z.enum(['order', 'purchaseOrder', 'invoice', 'dispatch', 'grn']),
  entityId: z.string(),
  operation: z.string()
});

export class ValidationController {

  /**
   * Validate invoice amount against purchase order
   */
  async validateInvoiceAmount(req: Request, res: Response) {
    try {
      const validation = validateInvoiceAmountSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid input',
          details: validation.error.errors
        });
      }

      const { invoiceId, proposedAmount } = validation.data;
      const result = await validationService.validateInvoiceAmount(invoiceId, proposedAmount);

      return res.json({
        success: result.isValid,
        data: result,
        message: result.isValid ? 'Invoice amount is valid' : 'Invoice amount validation failed'
      });

    } catch (error) {
      logger.error('Error in validateInvoiceAmount', { error });
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Validate vendor authorization
   */
  async validateVendorAuthorization(req: Request, res: Response) {
    try {
      const validation = validateVendorAuthSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid input',
          details: validation.error.errors
        });
      }

      const { vendorId, orderId } = validation.data;
      const result = await validationService.validateVendorAuthorization(vendorId, orderId);

      return res.json({
        success: result.isValid,
        data: result,
        message: result.isValid ? 'Vendor authorization is valid' : 'Vendor authorization failed'
      });

    } catch (error) {
      logger.error('Error in validateVendorAuthorization', { error });
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Validate data consistency
   */
  async validateDataConsistency(req: Request, res: Response) {
    try {
      const { orderId } = req.params;

      if (!orderId) {
        return res.status(400).json({
          success: false,
          error: 'Order ID is required'
        });
      }

      const result = await validationService.validateDataConsistency(orderId);

      return res.json({
        success: result.isValid,
        data: result,
        message: result.isValid ? 'Data consistency is valid' : 'Data consistency issues found'
      });

    } catch (error) {
      logger.error('Error in validateDataConsistency', { error });
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Validate business rules
   */
  async validateBusinessRules(req: Request, res: Response) {
    try {
      const validation = validateBusinessRulesSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid input',
          details: validation.error.errors
        });
      }

      const { entityType, entityId, operation } = validation.data;
      const result = await validationService.validateBusinessRules(entityType, entityId, operation);

      return res.json({
        success: result.isValid,
        data: result,
        message: result.isValid ? 'Business rules validation passed' : 'Business rules validation failed'
      });

    } catch (error) {
      logger.error('Error in validateBusinessRules', { error });
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Comprehensive workflow validation
   */
  async validateFullWorkflow(req: Request, res: Response) {
    try {
      const { orderId } = req.params;

      if (!orderId) {
        return res.status(400).json({
          success: false,
          error: 'Order ID is required'
        });
      }

      const result = await validationService.validateFullWorkflow(orderId);

      return res.json({
        success: result.isValid,
        data: result,
        message: result.isValid ? 'Full workflow validation passed' : 'Workflow validation issues found'
      });

    } catch (error) {
      logger.error('Error in validateFullWorkflow', { error });
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get validation summary for dashboard
   */
  async getValidationSummary(req: Request, res: Response) {
    try {
      const summary = await prisma.$transaction(async (tx) => {
        // Get counts of various validation concerns
        const [
          ordersWithoutPricing,
          unapprovedInvoices,
          pendingValidations,
          inconsistentOrders
        ] = await Promise.all([
          // Orders with items missing pricing
          tx.order.count({
            where: {
              items: {
                some: {
                  pricePerUnit: null
                }
              }
            }
          }),

          // Invoices pending verification
          tx.vendorInvoice.count({
            where: { status: 'PENDING_VERIFICATION' }
          }),

          // Orders in processing state (might need validation)
          tx.order.count({
            where: { status: 'PROCESSING' }
          }),

          // Orders with potential quantity mismatches
          tx.order.count({
            where: {
              items: {
                some: {
                  assignedItems: {
                    some: {
                      goodsReceiptItems: {
                        some: {
                          status: {
                            in: ['QUANTITY_MISMATCH', 'DAMAGE_REPORTED', 'SHORTAGE_REPORTED']
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          })
        ]);

        return {
          pricing: {
            ordersWithoutPricing
          },
          invoices: {
            pendingVerification: unapprovedInvoices
          },
          workflow: {
            pendingValidations
          },
          consistency: {
            ordersWithIssues: inconsistentOrders
          }
        };
      });

      return res.json({
        success: true,
        data: summary
      });

    } catch (error) {
      logger.error('Error in getValidationSummary', { error });
      return res.status(500).json({
        success: false,
        error: 'Failed to get validation summary'
      });
    }
  }

  /**
   * Batch validation for multiple entities
   */
  async batchValidation(req: Request, res: Response) {
    try {
      const { validations } = req.body;

      if (!Array.isArray(validations)) {
        return res.status(400).json({
          success: false,
          error: 'Validations must be an array'
        });
      }

      const results = [];

      for (const validation of validations) {
        try {
          const { type, data } = validation;
          let result;

          switch (type) {
            case 'invoiceAmount':
              result = await validationService.validateInvoiceAmount(data.invoiceId, data.proposedAmount);
              break;
            case 'vendorAuth':
              result = await validationService.validateVendorAuthorization(data.vendorId, data.orderId);
              break;
            case 'dataConsistency':
              result = await validationService.validateDataConsistency(data.orderId);
              break;
            case 'businessRules':
              result = await validationService.validateBusinessRules(data.entityType, data.entityId, data.operation);
              break;
            default:
              result = { isValid: false, errors: [`Unknown validation type: ${type}`] };
          }

          results.push({
            validation,
            result
          });

        } catch (error) {
          results.push({
            validation,
            result: { isValid: false, errors: ['Validation error'] }
          });
        }
      }

      const allValid = results.every(r => r.result.isValid);

      return res.json({
        success: allValid,
        data: {
          results,
          summary: {
            total: results.length,
            passed: results.filter(r => r.result.isValid).length,
            failed: results.filter(r => !r.result.isValid).length
          }
        },
        message: allValid ? 'All validations passed' : 'Some validations failed'
      });

    } catch (error) {
      logger.error('Error in batchValidation', { error });
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}

export const validationController = new ValidationController();