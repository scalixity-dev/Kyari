import { z } from 'zod';

// Order Item validation schema (with mandatory pricing)
export const createOrderItemSchema = z.object({
  productName: z.string()
    .min(1, 'Product name is required')
    .max(255, 'Product name must be less than 255 characters'),
  sku: z.string()
    .max(100, 'SKU must be less than 100 characters')
    .optional(),
  quantity: z.number()
    .int('Quantity must be an integer')
    .positive('Quantity must be positive')
    .max(999999, 'Quantity cannot exceed 999,999'),
  pricePerUnit: z.number()
    .positive('Price per unit must be positive')
    .max(999999.99, 'Price per unit cannot exceed 999,999.99')
    .refine((val) => {
      // Ensure price has at most 2 decimal places
      return Number(val.toFixed(2)) === val;
    }, 'Price per unit can have at most 2 decimal places')
});

// Order creation validation schema
export const createOrderSchema = z.object({
  orderNumber: z.string()
    .min(1, 'Order number is required')
    .max(100, 'Order number must be less than 100 characters')
    .regex(/^[A-Za-z0-9\-_]+$/, 'Order number can only contain letters, numbers, hyphens, and underscores'),
  primaryVendorId: z.string()
    .min(1, 'Primary vendor ID is required')
    .optional(),
  items: z.array(createOrderItemSchema)
    .min(1, 'At least one item is required')
    .max(1000, 'Cannot exceed 1000 items per order')
});

// Order query validation schema
export const orderQuerySchema = z.object({
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
  status: z.enum(['RECEIVED', 'ASSIGNED', 'PROCESSING', 'FULFILLED', 'PARTIALLY_FULFILLED', 'CLOSED', 'CANCELLED'])
    .optional(),
  vendorId: z.string()
    .min(1)
    .optional(),
  search: z.string()
    .max(255)
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

// Order ID validation schema
export const orderIdSchema = z.object({
  id: z.string().min(1, 'Order ID is required')
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