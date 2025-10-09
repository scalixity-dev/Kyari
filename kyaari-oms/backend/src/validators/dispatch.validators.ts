import { z } from 'zod';
import { DispatchStatus } from '../types/dispatch.dto';

// Create Dispatch Validation
export const createDispatchSchema = z.object({
  assignmentIds: z
    .array(z.string().min(1, 'Assignment ID cannot be empty'))
    .min(1, 'At least one assignment ID is required')
    .max(50, 'Cannot dispatch more than 50 assignments at once'),
  
  awbNumber: z
    .string()
    .min(3, 'AWB number must be at least 3 characters')
    .max(50, 'AWB number cannot exceed 50 characters')
    .regex(/^[A-Z0-9\-_]+$/i, 'AWB number can only contain letters, numbers, hyphens, and underscores'),
  
  logisticsPartner: z
    .string()
    .min(2, 'Logistics partner name must be at least 2 characters')
    .max(100, 'Logistics partner name cannot exceed 100 characters'),
  
  estimatedDeliveryDate: z
    .string()
    .datetime('Invalid delivery date format')
    .optional()
    .refine(
      (date) => !date || new Date(date) > new Date(),
      'Estimated delivery date must be in the future'
    ),
  
  vendorRemarks: z
    .string()
    .max(500, 'Vendor remarks cannot exceed 500 characters')
    .optional()
});

// Update Dispatch Status Validation
export const updateDispatchStatusSchema = z.object({
  status: z.nativeEnum(DispatchStatus, {
    errorMap: () => ({ message: 'Invalid dispatch status' })
  }),
  remarks: z
    .string()
    .max(500, 'Remarks cannot exceed 500 characters')
    .optional()
});

// Query Parameters for Dispatch List
export const dispatchListQuerySchema = z.object({
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
    .nativeEnum(DispatchStatus)
    .optional(),
  
  startDate: z
    .string()
    .datetime('Invalid start date format')
    .optional(),
  
  endDate: z
    .string()
    .datetime('Invalid end date format')
    .optional()
}).refine(
  (data) => !data.startDate || !data.endDate || new Date(data.startDate) <= new Date(data.endDate),
  'Start date must be before or equal to end date'
);

// File Upload Validation
export const fileUploadSchema = z.object({
  fieldname: z.string(),
  originalname: z.string().min(1, 'File name is required'),
  encoding: z.string(),
  mimetype: z
    .string()
    .refine(
      (type) => [
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'application/pdf'
      ].includes(type),
      'Only JPEG, PNG, and PDF files are allowed'
    ),
  size: z
    .number()
    .max(10 * 1024 * 1024, 'File size cannot exceed 10MB'),
  buffer: z.instanceof(Buffer)
});

// Dispatch ID Parameter Validation
export const dispatchIdParamSchema = z.object({
  id: z
    .string()
    .min(1, 'Dispatch ID is required')
    .regex(/^[a-zA-Z0-9]+$/, 'Invalid dispatch ID format')
});

// AWB Number Validation (for tracking)
export const awbTrackingSchema = z.object({
  awbNumber: z
    .string()
    .min(3, 'AWB number must be at least 3 characters')
    .max(50, 'AWB number cannot exceed 50 characters')
});

// Bulk Dispatch Status Update
export const bulkDispatchUpdateSchema = z.object({
  dispatchIds: z
    .array(z.string().min(1, 'Dispatch ID cannot be empty'))
    .min(1, 'At least one dispatch ID is required')
    .max(20, 'Cannot update more than 20 dispatches at once'),
  
  status: z.nativeEnum(DispatchStatus, {
    errorMap: () => ({ message: 'Invalid dispatch status' })
  }),
  
  remarks: z
    .string()
    .max(500, 'Remarks cannot exceed 500 characters')
    .optional()
});

// Type exports for use in controllers
export type CreateDispatchInput = z.infer<typeof createDispatchSchema>;
export type UpdateDispatchStatusInput = z.infer<typeof updateDispatchStatusSchema>;
export type DispatchListQueryInput = z.infer<typeof dispatchListQuerySchema>;
export type FileUploadInput = z.infer<typeof fileUploadSchema>;
export type DispatchIdParamInput = z.infer<typeof dispatchIdParamSchema>;
export type AWBTrackingInput = z.infer<typeof awbTrackingSchema>;
export type BulkDispatchUpdateInput = z.infer<typeof bulkDispatchUpdateSchema>;