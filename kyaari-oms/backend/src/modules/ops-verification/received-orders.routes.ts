import { Router } from 'express';
import { receivedOrdersController } from './received-orders.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { userCache, invalidateCache } from '../../middlewares/cache.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/ops/received-orders
 * @desc    Get all received orders with filters (cached for 2 minutes)
 * @access  Private (Operations team)
 */
router.get('/', 
  userCache(120),
  (req, res) => receivedOrdersController.getReceivedOrders(req, res)
);

/**
 * @route   GET /api/ops/received-orders/metrics
 * @desc    Get received orders summary metrics (cached for 1 minute)
 * @access  Private (Operations team)
 */
router.get('/metrics', 
  userCache(60),
  (req, res) => receivedOrdersController.getMetrics(req, res)
);

/**
 * @route   GET /api/ops/received-orders/:id
 * @desc    Get received order details by ID (cached for 5 minutes)
 * @access  Private (Operations team)
 */
router.get('/:id', 
  userCache(300),
  (req, res) => receivedOrdersController.getReceivedOrderDetails(req, res)
);

/**
 * @route   POST /api/ops/received-orders/:id/verify
 * @desc    Verify received order as OK
 * @access  Private (Operations team)
 */
router.post('/:id/verify', 
  invalidateCache([
    'api:*:/api/ops/received-orders*', 
    'user:*:/api/dispatches/*',
    'user:*:/api/invoices/uploads*'  // Invalidate vendor invoice cache
  ]),
  (req, res) => receivedOrdersController.verifyOrder(req, res)
);

/**
 * @route   POST /api/ops/received-orders/:id/raise-ticket
 * @desc    Raise ticket for mismatch
 * @access  Private (Operations team)
 */
router.post('/:id/raise-ticket', 
  invalidateCache([
    'api:*:/api/ops/received-orders*', 
    'user:*:/api/dispatches/*',
    'user:*:/api/invoices/uploads*'  // Invalidate vendor invoice cache
  ]),
  (req, res) => receivedOrdersController.raiseTicket(req, res)
);

export default router;

