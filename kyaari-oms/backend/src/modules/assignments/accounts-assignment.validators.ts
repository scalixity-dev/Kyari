import { z } from 'zod'

// Accounts team vendor order query validation schema
export const accountsVendorOrderQuerySchema = z.object({
  page: z.string()
    .optional()
    .transform(val => {
      if (!val || val === '') return undefined
      const parsed = parseInt(val, 10)
      if (isNaN(parsed) || parsed < 1) throw new Error('Page must be a positive number')
      return parsed
    }),
  limit: z.string()
    .optional()
    .transform(val => {
      if (!val || val === '') return undefined
      const parsed = parseInt(val, 10)
      if (isNaN(parsed) || parsed < 1 || parsed > 100) throw new Error('Limit must be between 1 and 100')
      return parsed
    }),
  vendorId: z.string().optional(),
  vendorName: z.string().optional(),
  orderStatus: z.enum(['Confirmed', 'Awaiting PO', 'PO Generated', 'Delivered', 'Closed']).optional(),
  poStatus: z.enum(['Pending', 'Generated']).optional(),
  invoiceStatus: z.enum(['Not Created', 'Awaiting Validation', 'Approved']).optional(),
  startDate: z.string()
    .optional()
    .transform(val => {
      if (!val || val === '') return undefined
      const date = new Date(val)
      if (isNaN(date.getTime())) throw new Error('Invalid start date')
      return date
    }),
  endDate: z.string()
    .optional()
    .transform(val => {
      if (!val || val === '') return undefined
      const date = new Date(val)
      if (isNaN(date.getTime())) throw new Error('Invalid end date')
      return date
    }),
  orderNumber: z.string().optional()
})

// Validation helper function
export const validateSchema = <T>(schema: z.ZodType<T, any, any>, data: unknown): { success: true; data: T } | { success: false; errors: Record<string, string[]> } => {
  const result = schema.safeParse(data)
  
  if (result.success) {
    return { success: true, data: result.data }
  }
  
  const errors: Record<string, string[]> = {}
  result.error.issues.forEach((issue) => {
    const path = issue.path.join('.')
    if (!errors[path]) errors[path] = []
    errors[path].push(issue.message)
  })
  
  return { success: false, errors }
}

