import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { MoneyFlowController } from './money-flow.controller';
import { cacheService } from '../../services/cache.service';

const router = Router();

// Cache middleware for GET routes
const cacheResponse = <T>(keyBuilder: (req: Request) => string, ttlSeconds = 60) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = keyBuilder(req);
      const cached = await cacheService.get<T>(key);
      if (cached) {
        return res.json(cached);
      }
      const originalJson = res.json.bind(res);
      res.json = (body: T) => {
        // Only cache successful responses (2xx status codes)
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cacheService.set(key, body, ttlSeconds).catch(() => {});
        }
        return originalJson(body);
      };
      next();
    } catch (_e) {
      next();
    }
  };
};

// Cache invalidation middleware for POST routes
const invalidatePatterns = (patternsBuilder: (req: Request) => string[]) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const patterns = patternsBuilder(req);
      await Promise.all(patterns.map((p) => cacheService.invalidate(p)));
    } catch (_e) {}
    next();
  };
};

/**
 * @route GET /api/money-flow/kpis
 * @desc Get money flow KPIs
 * @access Private (requires authentication)
 */
router.get(
  '/kpis',
  authenticate,
  cacheResponse((req) => `user:${req.user?.userId}:/api/money-flow/kpis`, 300), // 5 minutes cache
  MoneyFlowController.getKPIs
);

/**
 * @route GET /api/money-flow/transactions
 * @desc Get money flow transactions with filtering and pagination
 * @access Private (requires authentication)
 * @query { status?: string, searchQuery?: string, sortOrder?: string, page?: number, limit?: number }
 */
router.get(
  '/transactions',
  authenticate,
  cacheResponse((req) => `user:${req.user?.userId}:/api/money-flow/transactions?${new URLSearchParams(req.query as any).toString()}`, 60), // 1 minute cache
  MoneyFlowController.getTransactions
);

/**
 * @route GET /api/money-flow/trend
 * @desc Get money flow trend data for charts
 * @access Private (requires authentication)
 * @query { range: 'Weekly' | 'Monthly' | 'Yearly' }
 */
router.get(
  '/trend',
  authenticate,
  cacheResponse((req) => `user:${req.user?.userId}:/api/money-flow/trend?${new URLSearchParams(req.query as any).toString()}`, 300), // 5 minutes cache
  MoneyFlowController.getTrendData
);

/**
 * @route GET /api/money-flow/pie-chart
 * @desc Get money flow pie chart data
 * @access Private (requires authentication)
 */
router.get(
  '/pie-chart',
  authenticate,
  cacheResponse((req) => `user:${req.user?.userId}:/api/money-flow/pie-chart`, 300), // 5 minutes cache
  MoneyFlowController.getPieChartData
);

/**
 * @route GET /api/money-flow/complete
 * @desc Get complete money flow data (all components)
 * @access Private (requires authentication)
 * @query { status?: string, searchQuery?: string, sortOrder?: string, page?: number, limit?: number, range?: string }
 */
router.get(
  '/complete',
  authenticate,
  cacheResponse((req) => `user:${req.user?.userId}:/api/money-flow/complete?${new URLSearchParams(req.query as any).toString()}`, 60), // 1 minute cache
  MoneyFlowController.getCompleteData
);

/**
 * @route POST /api/money-flow/export/csv
 * @desc Export money flow transactions to CSV
 * @access Private (requires authentication)
 * @body { status?: string, searchQuery?: string, sortOrder?: string }
 */
router.post(
  '/export/csv',
  authenticate,
  invalidatePatterns((req) => [
    `user:${req.user?.userId}:/api/money-flow*`,
  ]),
  MoneyFlowController.exportCSV
);

/**
 * @route POST /api/money-flow/export/pdf
 * @desc Export money flow transactions to PDF
 * @access Private (requires authentication)
 * @body { status?: string, searchQuery?: string, sortOrder?: string }
 */
router.post(
  '/export/pdf',
  authenticate,
  invalidatePatterns((req) => [
    `user:${req.user?.userId}:/api/money-flow*`,
  ]),
  MoneyFlowController.exportPDF
);

export default router;
