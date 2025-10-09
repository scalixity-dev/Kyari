import { z } from 'zod';

// Vendor assignment query validation schema
export const vendorAssignmentQuerySchema = z.object({
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
  status: z.enum([
    'PENDING_CONFIRMATION',
    'VENDOR_CONFIRMED_FULL',
    'VENDOR_CONFIRMED_PARTIAL',
    'VENDOR_DECLINED',
    'INVOICED',
    'DISPATCHED',
    'STORE_RECEIVED',
    'VERIFIED_OK',
    'VERIFIED_MISMATCH',
    'COMPLETED'
  ]).optional(),
  orderId: z.string()
    .min(1)
    .optional(),
  orderNumber: z.string()
    .max(100)
    .optional(),
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

// Assignment status update validation schema
export const updateAssignmentStatusSchema = z.object({
  status: z.enum(['VENDOR_CONFIRMED_FULL', 'VENDOR_CONFIRMED_PARTIAL', 'VENDOR_DECLINED'], {
    required_error: 'Status is required',
    invalid_type_error: 'Invalid status value'
  }),
  confirmedQuantity: z.number()
    .int('Confirmed quantity must be an integer')
    .min(0, 'Confirmed quantity cannot be negative')
    .max(999999, 'Confirmed quantity cannot exceed 999,999')
    .optional(),
  vendorRemarks: z.string()
    .max(1000, 'Vendor remarks must be less than 1000 characters')
    .optional()
}).refine((data) => {
  // If status is VENDOR_CONFIRMED_PARTIAL, confirmedQuantity is required
  if (data.status === 'VENDOR_CONFIRMED_PARTIAL' && (data.confirmedQuantity === undefined || data.confirmedQuantity === null)) {
    return false;
  }
  return true;
}, {
  message: 'Confirmed quantity is required for partial confirmations',
  path: ['confirmedQuantity']
});

// Assignment ID validation schema
export const assignmentIdSchema = z.object({
  id: z.string().min(1, 'Assignment ID is required')
});

// Validation helper function
export const validateSchema = <T>(schema: z.ZodType<T, any, any>, data: unknown): { success: true; data: T } | { success: false; errors: Record<string, string[]> } => {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors: Record<string, string[]> = {};
  result.error.issues.forEach((issue) => {
    const path = issue.path.join('.');
    if (!errors[path]) errors[path] = [];
    errors[path].push(issue.message);
  });
  
  return { success: false, errors };
};