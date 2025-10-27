import { z } from 'zod';

// Schema for performance query parameters
export const performanceQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  timeRange: z.enum(['1W', '1M', '3M', '6M', '1Y']).optional()
});

// Schema for performance date range validation
export const performanceDateRangeSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime()
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return start <= end;
}, {
  message: "Start date must be before or equal to end date",
  path: ["endDate"]
});

// Type exports
export type PerformanceQuery = z.infer<typeof performanceQuerySchema>;
export type PerformanceDateRange = z.infer<typeof performanceDateRangeSchema>;
