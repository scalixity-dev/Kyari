import { z } from 'zod';
import { OrderStatus, AssignmentStatus } from '@prisma/client';

// Order tracking status mapping from frontend to backend
export const ORDER_TRACKING_STATUS_MAP = {
  'Received': OrderStatus.RECEIVED,
  'Assigned': AssignmentStatus.PENDING_CONFIRMATION,
  'Confirmed': AssignmentStatus.VENDOR_CONFIRMED_FULL,
  'Invoiced': AssignmentStatus.INVOICED,
  'Dispatched': AssignmentStatus.DISPATCHED,
  'Verified': AssignmentStatus.VERIFIED_OK,
  'Paid': AssignmentStatus.COMPLETED
} as const;

export type OrderTrackingStatus = keyof typeof ORDER_TRACKING_STATUS_MAP;

// DTOs for order tracking
export interface OrderTrackingItemDto {
  id: string;
  orderId: string;
  orderNumber: string;
  clientOrderId: string;
  productName: string;
  sku?: string;
  quantity: number;
  pricePerUnit?: number;
  totalPrice?: number;
  vendor: {
    id: string;
    companyName: string;
    contactPersonName: string;
    contactPhone: string;
  };
  status: OrderTrackingStatus;
  assignedQuantity?: number;
  confirmedQuantity?: number;
  vendorRemarks?: string;
  assignedAt?: string;
  vendorActionAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderTrackingSummaryDto {
  totalOrders: number;
  statusCounts: Record<OrderTrackingStatus, number>;
  recentOrders: OrderTrackingItemDto[];
}

export interface OrderTrackingFiltersDto {
  vendor?: string;
  status?: OrderTrackingStatus;
  qtyMin?: number;
  qtyMax?: number;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

export interface OrderTrackingQueryDto {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'quantity' | 'status';
  sortOrder?: 'asc' | 'desc';
  filters?: OrderTrackingFiltersDto;
}

export interface OrderTrackingResponseDto {
  success: boolean;
  data: {
    orders: OrderTrackingItemDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    summary: OrderTrackingSummaryDto;
  };
  message: string;
}

export interface OrderStatusUpdateDto {
  orderItemId: string;
  newStatus: OrderTrackingStatus;
  remarks?: string;
}

// Validation schemas
export const orderTrackingQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  sortBy: z.enum(['createdAt', 'updatedAt', 'quantity', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  filters: z.object({
    vendor: z.string().optional(),
    status: z.enum(['Received', 'Assigned', 'Confirmed', 'Invoiced', 'Dispatched', 'Verified', 'Paid']).optional(),
    qtyMin: z.coerce.number().min(0).optional(),
    qtyMax: z.coerce.number().min(0).optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    search: z.string().optional()
  }).optional()
});

export const orderStatusUpdateSchema = z.object({
  orderItemId: z.string().min(1),
  newStatus: z.enum(['Received', 'Assigned', 'Confirmed', 'Invoiced', 'Dispatched', 'Verified', 'Paid']),
  remarks: z.string().optional()
});

export type OrderTrackingQueryRequest = z.infer<typeof orderTrackingQuerySchema>;
export type OrderStatusUpdateRequest = z.infer<typeof orderStatusUpdateSchema>;
