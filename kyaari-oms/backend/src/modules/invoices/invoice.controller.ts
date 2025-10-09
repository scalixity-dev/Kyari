import { Request, Response } from 'express';
import { invoiceService } from './invoice.service';
import { ResponseHelper } from '../../utils/response';
import { logger } from '../../utils/logger';
import { z } from 'zod';

// Validation helper function
export const validateSchema = <T>(schema: z.ZodType<T, any, any>, data: unknown): { success: true; data: T } | { success: false; errors: Record<string, string[]> } => {
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

// Validation schemas
export const generateInvoiceSchema = z.object({
  purchaseOrderId: z.string().min(1, 'Purchase order ID is required')
});

export const invoiceQuerySchema = z.object({
  page: z.string()
    .optional()
    .transform(val => {
      if (!val || val === '') return undefined;
      const parsed = parseInt(val, 10);
      if (isNaN(parsed) || parsed < 1) throw new Error('Page must be a positive number');
      return parsed;
    }),
  limit: z.string()
    .optional()
    .transform(val => {
      if (!val || val === '') return undefined;
      const parsed = parseInt(val, 10);
      if (isNaN(parsed) || parsed < 1 || parsed > 100) throw new Error('Limit must be between 1 and 100');
      return parsed;
    }),
  status: z.string().optional(),
  vendorId: z.string().optional(),
  startDate: z.string()
    .optional()
    .transform(val => {
      if (!val || val === '') return undefined;
      const date = new Date(val);
      if (isNaN(date.getTime())) throw new Error('Invalid start date');
      return date;
    }),
  endDate: z.string()
    .optional()
    .transform(val => {
      if (!val || val === '') return undefined;
      const date = new Date(val);
      if (isNaN(date.getTime())) throw new Error('Invalid end date');
      return date;
    })
});

export const invoiceIdSchema = z.object({
  id: z.string().min(1, 'Invoice ID is required')
});

export class InvoiceController {

  /**
   * Generate invoice for a purchase order
   */
  async generateInvoice(req: Request, res: Response): Promise<void> {
    try {
      const validation = validateSchema(generateInvoiceSchema, req.body);
      if (!validation.success) {
        ResponseHelper.validationError(res, validation.errors);
        return;
      }

      const { purchaseOrderId } = validation.data;

      const invoice = await invoiceService.generateInvoice(purchaseOrderId);

      ResponseHelper.success(res, invoice, 'Invoice generated successfully', 201);
    } catch (error) {
      logger.error('Invoice generation controller error', { error, body: req.body });
      ResponseHelper.error(res, error instanceof Error ? error.message : 'Failed to generate invoice');
    }
  }

  /**
   * Get invoice by ID
   */
  async getInvoiceById(req: Request, res: Response): Promise<void> {
    try {
      const validation = validateSchema(invoiceIdSchema, { id: req.params.id });
      if (!validation.success) {
        ResponseHelper.validationError(res, validation.errors);
        return;
      }

      const { id } = validation.data;

      const invoice = await invoiceService.getInvoiceById(id);

      ResponseHelper.success(res, invoice, 'Invoice retrieved successfully');
    } catch (error) {
      logger.error('Get invoice controller error', { error, invoiceId: req.params.id });
      ResponseHelper.error(res, error instanceof Error ? error.message : 'Failed to retrieve invoice');
    }
  }

  /**
   * List invoices with pagination and filters
   */
  async listInvoices(req: Request, res: Response): Promise<void> {
    try {
      const validation = validateSchema(invoiceQuerySchema, req.query);
      if (!validation.success) {
        ResponseHelper.validationError(res, validation.errors);
        return;
      }

      const query = validation.data;

      const result = await invoiceService.listInvoices(query);

      const response = {
        invoices: result.invoices,
        pagination: {
          page: query.page || 1,
          limit: query.limit || 10,
          total: result.total,
          pages: Math.ceil(result.total / (query.limit || 10))
        }
      };

      ResponseHelper.success(res, response, 'Invoices retrieved successfully');
    } catch (error) {
      logger.error('List invoices controller error', { error, query: req.query });
      ResponseHelper.error(res, error instanceof Error ? error.message : 'Failed to retrieve invoices');
    }
  }

  /**
   * Download invoice JSON file
   */
  async downloadInvoice(req: Request, res: Response): Promise<void> {
    try {
      const validation = validateSchema(invoiceIdSchema, { id: req.params.id });
      if (!validation.success) {
        ResponseHelper.validationError(res, validation.errors);
        return;
      }

      const { id } = validation.data;

      const invoice = await invoiceService.getInvoiceById(id);

      if (!invoice.attachment) {
        ResponseHelper.error(res, 'Invoice file not found');
        return;
      }

      // Redirect to presigned URL
      res.redirect(invoice.attachment.s3Url);
    } catch (error) {
      logger.error('Download invoice controller error', { error, invoiceId: req.params.id });
      ResponseHelper.error(res, error instanceof Error ? error.message : 'Failed to download invoice');
    }
  }
}

export const invoiceController = new InvoiceController();