import { z } from 'zod';
import { DispatchStatus } from '@prisma/client';

// Dispatch item validation
export const dispatchItemSchema = z.object({
  assignmentId: z.string().min(1, 'Assignment ID is required'),
  dispatchedQuantity: z.number().int().positive('Dispatched quantity must be positive'),
});

// Create dispatch validation
export const createDispatchSchema = z.object({
  items: z.array(dispatchItemSchema).min(1, 'At least one item is required'),
  awbNumber: z.string().max(100).optional().default('LOCAL-PORTER'),
  logisticsPartner: z.string().max(255).optional().default('Local Porter'),
  dispatchDate: z.string().datetime().optional(),
  estimatedDeliveryDate: z.string().datetime().optional(),
  remarks: z.string().max(1000).optional(),
});

// Get dispatches query validation
export const getDispatchesQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 10)),
  status: z.nativeEnum(DispatchStatus).optional(),
  awbNumber: z.string().optional(),
});

export type CreateDispatchInput = z.infer<typeof createDispatchSchema>;
export type GetDispatchesQuery = z.infer<typeof getDispatchesQuerySchema>;
