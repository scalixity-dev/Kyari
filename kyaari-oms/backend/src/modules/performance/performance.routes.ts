import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { performanceController } from './performance.controller';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * @route GET /api/performance/kpi-cards
 * @desc Get KPI cards data for vendor performance dashboard
 * @access Private
 * @query {string} [startDate] - Start date for filtering (ISO format)
 * @query {string} [endDate] - End date for filtering (ISO format)
 */
router.get('/kpi-cards', performanceController.getKPICards.bind(performanceController));

/**
 * @route GET /api/performance/insights
 * @desc Get performance insights and recommendations for vendor
 * @access Private
 * @query {string} [startDate] - Start date for filtering (ISO format)
 * @query {string} [endDate] - End date for filtering (ISO format)
 */
router.get('/insights', performanceController.getPerformanceInsights.bind(performanceController));

/**
 * @route GET /api/performance/goals
 * @desc Get performance goals and targets for vendor
 * @access Private
 * @query {string} [startDate] - Start date for filtering (ISO format)
 * @query {string} [endDate] - End date for filtering (ISO format)
 */
router.get('/goals', performanceController.getPerformanceGoals.bind(performanceController));

/**
 * @route GET /api/performance/trends
 * @desc Get performance trends data for charts
 * @access Private
 * @query {string} [timeRange] - Time range (1W, 1M, 3M, 6M, 1Y) - defaults to 3M
 * @query {string} [startDate] - Start date for filtering (ISO format)
 * @query {string} [endDate] - End date for filtering (ISO format)
 */
router.get('/trends', performanceController.getPerformanceTrends.bind(performanceController));

/**
 * @route GET /api/performance/rejection-reasons
 * @desc Get rejection reasons analysis for vendor
 * @access Private
 * @query {string} [startDate] - Start date for filtering (ISO format)
 * @query {string} [endDate] - End date for filtering (ISO format)
 */
router.get('/rejection-reasons', performanceController.getRejectionReasons.bind(performanceController));

/**
 * @route GET /api/performance/weekly-fulfillment
 * @desc Get weekly order fulfillment data for vendor (last 4 weeks)
 * @access Private
 */
router.get('/weekly-fulfillment', performanceController.getWeeklyOrderFulfillment.bind(performanceController));

/**
 * @route GET /api/performance/sla-breach-analysis
 * @desc Get SLA breach analysis for vendor
 * @access Private
 * @query {string} [startDate] - Start date for filtering (ISO format)
 * @query {string} [endDate] - End date for filtering (ISO format)
 */
router.get('/sla-breach-analysis', performanceController.getSLABreachAnalysis.bind(performanceController));

export { router as performanceRoutes };
