import { z } from 'zod';

// GRN item validation
export const grnItemSchema = z.object({
  dispatchItemId: z.string().min(1, 'Dispatch item ID is required'),
  receivedQuantity: z.number().int().min(0, 'Received quantity cannot be negative'),
  itemRemarks: z.string().max(1000).optional(),
  damageReported: z.boolean().optional(),
  damageDescription: z.string().max(1000).optional(),
});

// Create GRN validation
export const createGRNSchema = z.object({
  dispatchId: z.string().min(1, 'Dispatch ID is required'),
  items: z.array(grnItemSchema).min(1, 'At least one item is required'),
  operatorRemarks: z.string().max(1000).optional(),
  receivedAt: z.string().datetime().optional(),
});

// Get GRNs query validation
export const getGRNsQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 10)),
  status: z.enum(['PENDING_VERIFICATION', 'VERIFIED_OK', 'VERIFIED_MISMATCH', 'PARTIALLY_VERIFIED']).optional(),
  dispatchId: z.string().optional(),
});

export type CreateGRNInput = z.infer<typeof createGRNSchema>;
export type GetGRNsQuery = z.infer<typeof getGRNsQuerySchema>;
