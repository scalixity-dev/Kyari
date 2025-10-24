import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { OrderTrackingController } from './order-tracking.controller';
import { cacheService } from '../../services/cache.service';
import {
  validateOrderTrackingQuery,
  validateOrderStatusUpdate,
  validateOrderIdParam
} from './order-tracking.validators';

const router = Router();

// Cache middleware for GET routes
const cacheResponse = (keyBuilder: (req: any) => string, ttlSeconds = 60) => {
  return async (req: any, res: any, next: any) => {
    try {
      const key = keyBuilder(req);
      const cached = await cacheService.get<any>(key);
      if (cached) {
        return res.json(cached);
      }
      const originalJson = res.json.bind(res);
      res.json = (body: any) => {
        cacheService.set(key, body, ttlSeconds).catch(() => {});
        return originalJson(body);
      };
      next();
    } catch (_e) {
      next();
    }
  };
};

// Invalidate cache helper for POST/PUT routes
const invalidatePatterns = (patternsBuilder: (req: any) => string[]) => {
  return async (req: any, res: any, next: any) => {
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      const patterns = patternsBuilder(req);
      patterns.forEach(pattern => {
        cacheService.delPattern(pattern).catch(() => {});
      });
      return originalJson(body);
    };
    next();
  };
};

/**
 * @route GET /api/order-tracking
 * @desc Get order tracking data with filters and pagination
 * @access Private (requires authentication)
 * @query { page?: number, limit?: number, sortBy?: string, sortOrder?: string, filters?: object }
 */
router.get(
  '/',
  authenticate,
  validateOrderTrackingQuery,
  cacheResponse(
    (req) => `order-tracking:${req.user?.userId}:${JSON.stringify(req.query)}`,
    300 // 5 minutes cache
  ),
  OrderTrackingController.getOrderTracking
);

/**
 * @route GET /api/order-tracking/summary
 * @desc Get order tracking summary with status counts
 * @access Private (requires authentication)
 */
router.get(
  '/summary',
  authenticate,
  cacheResponse(
    (req) => `order-tracking-summary:${req.user?.userId}`,
    180 // 3 minutes cache
  ),
  OrderTrackingController.getOrderTrackingSummary
);

/**
 * @route GET /api/order-tracking/:id
 * @desc Get specific order tracking details
 * @access Private (requires authentication)
 * @param { string } id - Order item ID
 */
router.get(
  '/:id',
  authenticate,
  validateOrderIdParam,
  cacheResponse(
    (req) => `order-tracking-detail:${req.params.id}:${req.user?.userId}`,
    60 // 1 minute cache
  ),
  OrderTrackingController.getOrderById
);

/**
 * @route PUT /api/order-tracking/:id/status
 * @desc Update order status (for drag and drop functionality)
 * @access Private (requires authentication)
 * @param { string } id - Order item ID
 * @body { orderItemId: string, newStatus: string, remarks?: string }
 */
router.put(
  '/:id/status',
  authenticate,
  validateOrderIdParam,
  validateOrderStatusUpdate,
  invalidatePatterns((req) => [
    `order-tracking:*:${req.user?.userId}`,
    `order-tracking-summary:${req.user?.userId}`,
    `order-tracking-detail:${req.params.id}:*`
  ]),
  OrderTrackingController.updateOrderStatus
);

/**
 * @route GET /api/order-tracking/export/csv
 * @desc Export order tracking data as CSV
 * @access Private (requires authentication)
 * @query { filters?: object } - Same filters as main endpoint
 */
router.get(
  '/export/csv',
  authenticate,
  validateOrderTrackingQuery,
  OrderTrackingController.exportToCSV
);

/**
 * @route GET /api/order-tracking/export/pdf
 * @desc Export order tracking data as PDF (text format)
 * @access Private (requires authentication)
 * @query { filters?: object } - Same filters as main endpoint
 */
router.get(
  '/export/pdf',
  authenticate,
  validateOrderTrackingQuery,
  OrderTrackingController.exportToPDF
);

export default router;
