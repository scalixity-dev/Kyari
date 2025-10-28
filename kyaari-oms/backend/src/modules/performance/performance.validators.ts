import { z } from 'zod';

// Schema for performance query parameters
export const performanceQuerySchema = z.object({
  startDate: z.string()
    .optional()
    .refine((val) => {
      if (!val) return true; // Optional field
      const date = new Date(val);
      return !isNaN(date.getTime()) && val === date.toISOString();
    }, {
      message: "startDate must be a valid ISO datetime string"
    }),
  endDate: z.string()
    .optional()
    .refine((val) => {
      if (!val) return true; // Optional field
      const date = new Date(val);
      return !isNaN(date.getTime()) && val === date.toISOString();
    }, {
      message: "endDate must be a valid ISO datetime string"
    }),
  timeRange: z.enum(['1W', '1M', '3M', '6M', '1Y']).optional()
}).superRefine((data, ctx) => {
  const hasTimeRange = !!data.timeRange;
  const hasStartDate = !!data.startDate;
  const hasEndDate = !!data.endDate;
  const hasBothDates = hasStartDate && hasEndDate;
  const hasSingleDate = (hasStartDate && !hasEndDate) || (!hasStartDate && hasEndDate);

  // Require either timeRange OR both startDate and endDate (not both, not single date)
  if (!hasTimeRange && !hasBothDates) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Either timeRange or both startDate and endDate must be provided",
      path: ["timeRange"]
    });
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Either timeRange or both startDate and endDate must be provided",
      path: ["startDate"]
    });
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Either timeRange or both startDate and endDate must be provided",
      path: ["endDate"]
    });
  }

  if (hasTimeRange && hasBothDates) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Cannot provide both timeRange and date range (startDate/endDate)",
      path: ["timeRange"]
    });
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Cannot provide both timeRange and date range (startDate/endDate)",
      path: ["startDate"]
    });
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Cannot provide both timeRange and date range (startDate/endDate)",
      path: ["endDate"]
    });
  }

  if (hasSingleDate) {
    if (hasStartDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "startDate requires endDate to be provided as well",
        path: ["endDate"]
      });
    } else {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "endDate requires startDate to be provided as well",
        path: ["startDate"]
      });
    }
  }

  // Validate date range when both dates are present
  if (hasBothDates) {
    const start = new Date(data.startDate!);
    const end = new Date(data.endDate!);
    
    if (start > end) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "startDate must be before or equal to endDate",
        path: ["endDate"]
      });
    }
  }
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
