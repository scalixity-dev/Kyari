import { z } from 'zod';

// Common validation schemas
export const emailSchema = z.string().email('Invalid email format');
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9])/, 
    'Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character');

export const nameSchema = z.string()
  .min(1, 'Name is required')
  .max(255, 'Name must be less than 255 characters');

export const phoneSchema = z.string()
  .regex(/^\+?[\d\s\-\(\)]{10,20}$/, 'Invalid phone number format');

// Auth validation schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const vendorRegistrationSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  warehouseLocation: z.string().min(1, 'Warehouse location is required'),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  companyName: z.string().optional(),
  gstNumber: z.string().optional(),
  panNumber: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().optional(), // Will come from cookies
});

// Admin schemas
export const createUserSchema = z.object({
  role: z.enum(['ADMIN', 'OPS', 'ACCOUNTS'], { 
    required_error: 'Role is required',
    invalid_type_error: 'Invalid role'
  }),
  name: nameSchema,
  email: emailSchema.optional(),
  password: passwordSchema,
});

export const approveVendorSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

// Validation helper
export const validateSchema = <T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: Record<string, string[]> } => {
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