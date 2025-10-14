import { Router } from 'express';
import { receivedOrdersController } from './received-orders.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/ops/received-orders
 * @desc    Get all received orders with filters
 * @access  Private (Operations team)
 */
router.get('/', (req, res) => receivedOrdersController.getReceivedOrders(req, res));

/**
 * @route   GET /api/ops/received-orders/metrics
 * @desc    Get received orders summary metrics
 * @access  Private (Operations team)
 */
router.get('/metrics', (req, res) => receivedOrdersController.getMetrics(req, res));

/**
 * @route   GET /api/ops/received-orders/:id
 * @desc    Get received order details by ID
 * @access  Private (Operations team)
 */
router.get('/:id', (req, res) => receivedOrdersController.getReceivedOrderDetails(req, res));

/**
 * @route   POST /api/ops/received-orders/:id/verify
 * @desc    Verify received order as OK
 * @access  Private (Operations team)
 */
router.post('/:id/verify', (req, res) => receivedOrdersController.verifyOrder(req, res));

/**
 * @route   POST /api/ops/received-orders/:id/raise-ticket
 * @desc    Raise ticket for mismatch
 * @access  Private (Operations team)
 */
router.post('/:id/raise-ticket', (req, res) => receivedOrdersController.raiseTicket(req, res));

export default router;

