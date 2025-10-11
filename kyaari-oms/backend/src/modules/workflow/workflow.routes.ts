import { Router } from 'express';
import { workflowController } from './workflow.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

// Apply authentication to all workflow routes
router.use(authenticate);

/**
 * @route POST /api/workflow/orders/:orderId/create-po
 * @desc Initiate order to purchase order workflow
 * @access Private - Admin/Accounts
 */
router.post('/orders/:orderId/create-po', workflowController.initiateOrderToPO);

/**
 * @route POST /api/workflow/invoices/:invoiceId/approve-payment
 * @desc Initiate invoice to payment workflow
 * @access Private - Admin/Accounts
 */
router.post('/invoices/:invoiceId/approve-payment', workflowController.initiateInvoiceToPayment);

/**
 * @route POST /api/workflow/dispatches/:dispatchId/create-grn
 * @desc Initiate dispatch to GRN workflow
 * @access Private - Operations
 */
router.post('/dispatches/:dispatchId/create-grn', workflowController.initiateDispatchToGRN);

/**
 * @route POST /api/workflow/orders/:orderId/complete
 * @desc Complete order workflow
 * @access Private - Admin/Operations
 */
router.post('/orders/:orderId/complete', workflowController.completeOrder);

/**
 * @route GET /api/workflow/orders/:orderId/status
 * @desc Get order workflow status
 * @access Private
 */
router.get('/orders/:orderId/status', workflowController.getOrderWorkflowStatus);

/**
 * @route GET /api/workflow/summary
 * @desc Get workflow summary for dashboard
 * @access Private
 */
router.get('/summary', workflowController.getWorkflowSummary);

export { router as workflowRoutes };