import { z } from 'zod';
import { GRNStatus, GRNItemStatus } from '../types/grn.dto';

// Create GRN Validation
export const createGRNSchema = z.object({
  dispatchId: z
    .string()
    .min(1, 'Dispatch ID is required')
    .regex(/^[a-zA-Z0-9]+$/, 'Invalid dispatch ID format'),
  
  receivedDate: z
    .string()
    .datetime('Invalid received date format')
    .optional()
    .refine(
      (date) => !date || new Date(date) <= new Date(),
      'Received date cannot be in the future'
    ),
  
  operatorRemarks: z
    .string()
    .max(1000, 'Operator remarks cannot exceed 1000 characters')
    .optional(),
  
  items: z
    .array(z.object({
      dispatchItemId: z
        .string()
        .min(1, 'Dispatch item ID is required')
        .regex(/^[a-zA-Z0-9]+$/, 'Invalid dispatch item ID format'),
      
      receivedQuantity: z
        .number()
        .int('Received quantity must be an integer')
        .min(0, 'Received quantity cannot be negative')
        .max(100000, 'Received quantity cannot exceed 100,000'),
      
      itemRemarks: z
        .string()
        .max(500, 'Item remarks cannot exceed 500 characters')
        .optional(),
      
      damageReported: z
        .boolean()
        .default(false),
      
      damageDescription: z
        .string()
        .max(1000, 'Damage description cannot exceed 1000 characters')
        .optional()
    }))
    .min(1, 'At least one item must be provided')
    .max(100, 'Cannot process more than 100 items at once')
}).refine(
  (data) => {
    // If any item reports damage, damage description should be provided
    const damagedItems = data.items.filter(item => item.damageReported);
    return damagedItems.every(item => item.damageDescription && item.damageDescription.trim().length > 0);
  },
  'Damage description is required when damage is reported'
);

// Update GRN Status Validation
export const updateGRNStatusSchema = z.object({
  status: z.nativeEnum(GRNStatus, {
    errorMap: () => ({ message: 'Invalid GRN status' })
  }),
  operatorRemarks: z
    .string()
    .max(1000, 'Operator remarks cannot exceed 1000 characters')
    .optional()
});

// GRN Item Update Validation
export const updateGRNItemSchema = z.object({
  receivedQuantity: z
    .number()
    .int('Received quantity must be an integer')
    .min(0, 'Received quantity cannot be negative')
    .max(100000, 'Received quantity cannot exceed 100,000'),
  
  itemRemarks: z
    .string()
    .max(500, 'Item remarks cannot exceed 500 characters')
    .optional(),
  
  damageReported: z
    .boolean()
    .default(false),
  
  damageDescription: z
    .string()
    .max(1000, 'Damage description cannot exceed 1000 characters')
    .optional()
}).refine(
  (data) => !data.damageReported || (data.damageDescription && data.damageDescription.trim().length > 0),
  'Damage description is required when damage is reported'
);

// Query Parameters for GRN List
export const grnListQuerySchema = z.object({
  page: z
    .string()
    .transform(Number)
    .refine(n => Number.isInteger(n) && n > 0, 'Page must be a positive integer')
    .default('1'),
  
  limit: z
    .string()
    .transform(Number)
    .refine(n => Number.isInteger(n) && n > 0 && n <= 100, 'Limit must be between 1 and 100')
    .default('10'),
  
  status: z
    .nativeEnum(GRNStatus)
    .optional(),
  
  startDate: z
    .string()
    .datetime('Invalid start date format')
    .optional(),
  
  endDate: z
    .string()
    .datetime('Invalid end date format')
    .optional(),
  
  vendorId: z
    .string()
    .regex(/^[a-zA-Z0-9]+$/, 'Invalid vendor ID format')
    .optional(),
  
  operatorId: z
    .string()
    .regex(/^[a-zA-Z0-9]+$/, 'Invalid operator ID format')
    .optional()
}).refine(
  (data) => !data.startDate || !data.endDate || new Date(data.startDate) <= new Date(data.endDate),
  'Start date must be before or equal to end date'
);

// GRN ID Parameter Validation
export const grnIdParamSchema = z.object({
  id: z
    .string()
    .min(1, 'GRN ID is required')
    .regex(/^[a-zA-Z0-9]+$/, 'Invalid GRN ID format')
});

// GRN Item ID Parameter Validation
export const grnItemIdParamSchema = z.object({
  id: z
    .string()
    .min(1, 'GRN ID is required')
    .regex(/^[a-zA-Z0-9]+$/, 'Invalid GRN ID format'),
  itemId: z
    .string()
    .min(1, 'GRN item ID is required')
    .regex(/^[a-zA-Z0-9]+$/, 'Invalid GRN item ID format')
});

// Bulk GRN Operations
export const bulkGRNUpdateSchema = z.object({
  grnIds: z
    .array(z.string().min(1, 'GRN ID cannot be empty'))
    .min(1, 'At least one GRN ID is required')
    .max(20, 'Cannot update more than 20 GRNs at once'),
  
  status: z.nativeEnum(GRNStatus, {
    errorMap: () => ({ message: 'Invalid GRN status' })
  }),
  
  operatorRemarks: z
    .string()
    .max(1000, 'Operator remarks cannot exceed 1000 characters')
    .optional()
});

// Discrepancy Report Filters
export const discrepancyReportQuerySchema = z.object({
  page: z
    .string()
    .transform(Number)
    .refine(n => Number.isInteger(n) && n > 0, 'Page must be a positive integer')
    .default('1'),
  
  limit: z
    .string()
    .transform(Number)
    .refine(n => Number.isInteger(n) && n > 0 && n <= 100, 'Limit must be between 1 and 100')
    .default('10'),
  
  startDate: z
    .string()
    .datetime('Invalid start date format')
    .optional(),
  
  endDate: z
    .string()
    .datetime('Invalid end date format')
    .optional(),
  
  vendorId: z
    .string()
    .regex(/^[a-zA-Z0-9]+$/, 'Invalid vendor ID format')
    .optional(),
  
  discrepancyType: z
    .enum(['SHORTAGE', 'EXCESS', 'DAMAGE'])
    .optional(),
  
  minDiscrepancyPercentage: z
    .string()
    .transform(Number)
    .refine(n => Number.isFinite(n) && n >= 0 && n <= 100, 'Discrepancy percentage must be between 0 and 100')
    .optional()
});

// Type exports for use in controllers
export type CreateGRNInput = z.infer<typeof createGRNSchema>;
export type UpdateGRNStatusInput = z.infer<typeof updateGRNStatusSchema>;
export type UpdateGRNItemInput = z.infer<typeof updateGRNItemSchema>;
export type GRNListQueryInput = z.infer<typeof grnListQuerySchema>;
export type GRNIdParamInput = z.infer<typeof grnIdParamSchema>;
export type GRNItemIdParamInput = z.infer<typeof grnItemIdParamSchema>;
export type BulkGRNUpdateInput = z.infer<typeof bulkGRNUpdateSchema>;
export type DiscrepancyReportQueryInput = z.infer<typeof discrepancyReportQuerySchema>;