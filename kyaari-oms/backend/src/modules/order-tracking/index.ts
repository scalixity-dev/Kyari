// Order Tracking Module
// This module provides comprehensive order tracking functionality for the admin dashboard

export { OrderTrackingController } from './order-tracking.controller';
export { orderTrackingService } from './order-tracking.service';
export {
  validateOrderTrackingQuery,
  validateOrderStatusUpdate,
  validateOrderIdParam
} from './order-tracking.validators';
export type {
  OrderTrackingItemDto,
  OrderTrackingQueryDto,
  OrderTrackingResponseDto,
  OrderTrackingSummaryDto,
  OrderTrackingFiltersDto,
  OrderStatusUpdateDto,
  OrderTrackingStatus
} from './order-tracking.dto';

export { ORDER_TRACKING_STATUS_MAP } from './order-tracking.dto';

export { default as orderTrackingRoutes } from './order-tracking.routes';
