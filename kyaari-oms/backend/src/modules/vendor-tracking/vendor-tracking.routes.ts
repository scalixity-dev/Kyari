import { Router } from 'express';
import { vendorTrackingController } from './vendor-tracking.controller';
import { authenticate, requireRole } from '../../middlewares/auth.middleware';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * @route GET /api/vendor-tracking/dashboard
 * @desc Get comprehensive vendor tracking dashboard data
 * @access Admin, Operations
 */
router.get(
  '/dashboard',
  requireRole(['ADMIN', 'OPERATIONS']),
  vendorTrackingController.getVendorTrackingDashboard.bind(vendorTrackingController)
);

/**
 * @route GET /api/vendor-tracking
 * @desc Get vendor tracking data with fill rate calculations
 * @access Admin, Operations
 */
router.get(
  '/',
  requireRole(['ADMIN', 'OPERATIONS']),
  vendorTrackingController.getVendorTracking.bind(vendorTrackingController)
);

/**
 * @route GET /api/vendor-tracking/fill-rates
 * @desc Get fill rates for all vendors
 * @access Admin, Operations
 */
router.get(
  '/fill-rates',
  requireRole(['ADMIN', 'OPERATIONS']),
  vendorTrackingController.getVendorFillRates.bind(vendorTrackingController)
);

/**
 * @route GET /api/vendor-tracking/performance-comparison
 * @desc Get vendor performance comparison
 * @access Admin, Operations
 */
router.get(
  '/performance-comparison',
  requireRole(['ADMIN', 'OPERATIONS']),
  vendorTrackingController.getVendorPerformanceComparison.bind(vendorTrackingController)
);

/**
 * @route GET /api/vendor-tracking/:vendorId/metrics
 * @desc Get detailed performance metrics for a specific vendor
 * @access Admin, Operations
 */
router.get(
  '/:vendorId/metrics',
  requireRole(['ADMIN', 'OPERATIONS']),
  vendorTrackingController.getVendorPerformanceMetrics.bind(vendorTrackingController)
);

/**
 * @route GET /api/vendor-tracking/:vendorId/fill-rate-history
 * @desc Get vendor fill rate history
 * @access Admin, Operations
 */
router.get(
  '/:vendorId/fill-rate-history',
  requireRole(['ADMIN', 'OPERATIONS']),
  vendorTrackingController.getVendorFillRateHistory.bind(vendorTrackingController)
);

/**
 * @route PUT /api/vendor-tracking/:vendorId/fill-rate
 * @desc Update fill rate for a specific vendor
 * @access Admin only
 */
router.put(
  '/:vendorId/fill-rate',
  requireRole(['ADMIN']),
  vendorTrackingController.updateVendorFillRate.bind(vendorTrackingController)
);

/**
 * @route POST /api/vendor-tracking/bulk-update-fill-rates
 * @desc Bulk update fill rates for all vendors
 * @access Admin only
 */
router.post(
  '/bulk-update-fill-rates',
  requireRole(['ADMIN']),
  vendorTrackingController.bulkUpdateFillRates.bind(vendorTrackingController)
);

/**
 * @route GET /api/vendor-tracking/sla
 * @desc Get SLA compliance for all vendors
 * @access Admin, Operations
 */
router.get(
  '/sla',
  requireRole(['ADMIN', 'OPERATIONS']),
  vendorTrackingController.getVendorSla.bind(vendorTrackingController)
);

/**
 * @route GET /api/vendor-tracking/:vendorId/performance-trends
 * @desc Get performance trends for a specific vendor
 * @access Admin, Operations
 */
router.get(
  '/:vendorId/performance-trends',
  requireRole(['ADMIN', 'OPERATIONS']),
  vendorTrackingController.getVendorPerformanceTrends.bind(vendorTrackingController)
);

/**
 * @route GET /api/vendor-tracking/:vendorId/sla
 * @desc Get detailed SLA metrics for a specific vendor
 * @access Admin, Operations
 */
router.get(
  '/:vendorId/sla',
  requireRole(['ADMIN', 'OPERATIONS']),
  vendorTrackingController.getVendorSlaMetrics.bind(vendorTrackingController)
);

export default router;
