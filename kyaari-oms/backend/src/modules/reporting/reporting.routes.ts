import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { reportingController } from './reporting.controller';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * @route GET /api/reporting/invoice-status
 * @desc Get invoice status report with breakdown by status, monthly trends, and vendor analysis
 * @access Private
 * @query {string} [startDate] - Start date for filtering (ISO format)
 * @query {string} [endDate] - End date for filtering (ISO format) 
 * @query {string} [vendorId] - Filter by specific vendor ID
 */
router.get('/invoice-status', reportingController.getInvoiceStatusReport.bind(reportingController));

/**
 * @route GET /api/reporting/payment-tracking
 * @desc Get payment tracking report with aging analysis and vendor breakdown
 * @access Private
 * @query {string} [startDate] - Start date for filtering (ISO format)
 * @query {string} [endDate] - End date for filtering (ISO format)
 * @query {string} [status] - Filter by payment status (PENDING, COMPLETED, FAILED)
 */
router.get('/payment-tracking', reportingController.getPaymentTrackingReport.bind(reportingController));

/**
 * @route GET /api/reporting/financial-analytics
 * @desc Get comprehensive financial analytics with KPIs and cash flow analysis
 * @access Private
 * @query {string} [period] - Time period (1m, 3m, 6m, 12m) - defaults to 12m
 * @query {string} [vendorId] - Filter by specific vendor ID
 */
router.get('/financial-analytics', reportingController.getFinancialAnalytics.bind(reportingController));

/**
 * @route GET /api/reporting/order-fulfillment
 * @desc Get order fulfillment report with completion rates and vendor performance
 * @access Private
 * @query {string} [startDate] - Start date for filtering (ISO format)
 * @query {string} [endDate] - End date for filtering (ISO format)
 * @query {string} [status] - Filter by order status
 */
router.get('/order-fulfillment', reportingController.getOrderFulfillmentReport.bind(reportingController));

/**
 * @route GET /api/reporting/grn-quality
 * @desc Get GRN quality report with discrepancy analysis and vendor quality metrics
 * @access Private
 * @query {string} [startDate] - Start date for filtering (ISO format)
 * @query {string} [endDate] - End date for filtering (ISO format)
 * @query {string} [vendorId] - Filter by specific vendor ID
 */
router.get('/grn-quality', reportingController.getGRNQualityReport.bind(reportingController));

/**
 * @route GET /api/reporting/export
 * @desc Export report data in various formats
 * @access Private
 * @query {string} reportType - Type of report to export (invoice-status, payment-tracking, financial-analytics, order-fulfillment, grn-quality)
 * @query {string} [format] - Export format (json, csv) - defaults to json
 * @query {string} [startDate] - Start date for filtering (ISO format)
 * @query {string} [endDate] - End date for filtering (ISO format)
 * @query {string} [vendorId] - Filter by specific vendor ID
 */
router.get('/export', reportingController.exportReport.bind(reportingController));

export { router as reportingRoutes };