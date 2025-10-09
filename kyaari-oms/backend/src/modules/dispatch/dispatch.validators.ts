import { z } from 'zod';

// Dispatch item validation
export const dispatchItemSchema = z.object({
  assignmentId: z.string().min(1, 'Assignment ID is required'),
  dispatchedQuantity: z.number().int().positive('Dispatched quantity must be positive'),
});

// Create dispatch validation
export const createDispatchSchema = z.object({
  items: z.array(dispatchItemSchema).min(1, 'At least one item is required'),
  awbNumber: z.string().min(1, 'AWB number is required').max(100),
  logisticsPartner: z.string().min(1, 'Logistics partner is required').max(255),
  dispatchDate: z.string().datetime().optional(),
  estimatedDeliveryDate: z.string().datetime().optional(),
  remarks: z.string().max(1000).optional(),
});

// Get dispatches query validation
export const getDispatchesQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 10)),
  status: z.enum(['PENDING', 'PROCESSING', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED', 'FAILED']).optional(),
  awbNumber: z.string().optional(),
});

export type CreateDispatchInput = z.infer<typeof createDispatchSchema>;
export type GetDispatchesQuery = z.infer<typeof getDispatchesQuerySchema>;
