import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ResponseHelper } from '../../utils/response';
import { logger } from '../../utils/logger';

// Validation schemas
const orderTrackingQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  sortBy: z.enum(['createdAt', 'updatedAt', 'quantity', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  filters: z.object({
    vendor: z.string().optional(),
    status: z.enum(['Received', 'Assigned', 'Confirmed', 'Invoiced', 'Dispatched', 'Verified', 'Paid']).optional(),
    qtyMin: z.coerce.number().min(0).optional(),
    qtyMax: z.coerce.number().min(0).optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    search: z.string().optional()
  }).optional()
});

const orderStatusUpdateSchema = z.object({
  orderItemId: z.string().min(1, 'Order item ID is required'),
  newStatus: z.enum(['Received', 'Assigned', 'Confirmed', 'Invoiced', 'Dispatched', 'Verified', 'Paid'], {
    errorMap: () => ({ message: 'Invalid status. Must be one of: Received, Assigned, Confirmed, Invoiced, Dispatched, Verified, Paid' })
  }),
  remarks: z.string().max(500, 'Remarks must be less than 500 characters').optional()
});

const orderIdParamSchema = z.object({
  id: z.string().min(1, 'Order ID is required')
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

// Middleware functions
export const validateOrderTrackingQuery = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const validation = validateSchema(orderTrackingQuerySchema, req.query);
    
    if (!validation.success) {
      logger.warn('Order tracking query validation failed', {
        errors: validation.errors,
        query: req.query,
        userId: req.user?.userId
      });
      
      ResponseHelper.error(res, 'Invalid query parameters', 400);
      return;
    }

    // Attach validated data to request
    (req as any).validatedQuery = validation.data;
    next();
  } catch (error) {
    logger.error('Order tracking query validation error', {
      error: error instanceof Error ? error.message : error,
      query: req.query,
      userId: req.user?.userId
    });
    
    ResponseHelper.error(res, 'Validation error', 500);
  }
};

export const validateOrderStatusUpdate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const validation = validateSchema(orderStatusUpdateSchema, req.body);
    
    if (!validation.success) {
      logger.warn('Order status update validation failed', {
        errors: validation.errors,
        body: req.body,
        userId: req.user?.userId
      });
      
      ResponseHelper.error(res, 'Invalid request body', 400);
      return;
    }

    // Attach validated data to request
    (req as any).validatedBody = validation.data;
    next();
  } catch (error) {
    logger.error('Order status update validation error', {
      error: error instanceof Error ? error.message : error,
      body: req.body,
      userId: req.user?.userId
    });
    
    ResponseHelper.error(res, 'Validation error', 500);
  }
};

export const validateOrderIdParam = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const validation = validateSchema(orderIdParamSchema, req.params);
    
    if (!validation.success) {
      logger.warn('Order ID parameter validation failed', {
        errors: validation.errors,
        params: req.params,
        userId: req.user?.userId
      });
      
      ResponseHelper.error(res, 'Invalid order ID parameter', 400);
      return;
    }

    // Attach validated data to request
    (req as any).validatedParams = validation.data;
    next();
  } catch (error) {
    logger.error('Order ID parameter validation error', {
      error: error instanceof Error ? error.message : error,
      params: req.params,
      userId: req.user?.userId
    });
    
    ResponseHelper.error(res, 'Validation error', 500);
  }
};

// Export validation schemas for use in other modules
export {
  orderTrackingQuerySchema,
  orderStatusUpdateSchema,
  orderIdParamSchema
};
