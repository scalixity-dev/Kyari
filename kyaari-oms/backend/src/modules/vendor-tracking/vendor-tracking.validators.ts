import { z } from 'zod';
import { AssignmentStatus } from '@prisma/client';

// Vendor tracking query validation schema
export const vendorTrackingQuerySchema = z.object({
  vendorId: z.string().cuid().optional(),
  status: z.nativeEnum(AssignmentStatus).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional()
}).superRefine((data, ctx) => {
  // Validate date range
  if (data.startDate && data.endDate && data.startDate > data.endDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Start date cannot be after end date',
      path: ['startDate']
    });
  }
});

// Vendor ID validation schema
export const vendorIdSchema = z.object({
  vendorId: z.string().cuid('Invalid vendor ID format')
});

// Update fill rate validation schema
export const updateFillRateSchema = z.object({
  fillRate: z.number()
    .min(0, 'Fill rate cannot be negative')
    .max(100, 'Fill rate cannot exceed 100%')
    .multipleOf(0.01, 'Fill rate must have at most 2 decimal places')
});

// Bulk update fill rates validation schema
export const bulkUpdateFillRatesSchema = z.object({
  force: z.boolean().optional().default(false)
});

// Date range validation schema
export const dateRangeSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional()
}).superRefine((data, ctx) => {
  // Validate date range
  if (data.startDate && data.endDate && data.startDate > data.endDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Start date cannot be after end date',
      path: ['startDate']
    });
  }
});

// SLA query validation schema
export const vendorSlaQuerySchema = z.object({
  bufferPercentage: z.number()
    .min(0, 'Buffer percentage cannot be negative')
    .max(100, 'Buffer percentage cannot exceed 100%')
    .optional()
    .default(15),
  lookbackDays: z.number()
    .int('Lookback days must be an integer')
    .min(1, 'Lookback days must be at least 1')
    .max(365, 'Lookback days cannot exceed 365')
    .optional()
    .default(30)
});
