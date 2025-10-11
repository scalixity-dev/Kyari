import { Router } from 'express';
import { opsVerificationController } from './ops-verification.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

// Apply authentication to all ops verification routes
router.use(authenticate);

/**
 * @route GET /api/ops-verification/pending-invoices
 * @desc Get pending invoices for verification
 * @access Private - Operations/Admin
 */
router.get('/pending-invoices', opsVerificationController.getPendingInvoices);

/**
 * @route GET /api/ops-verification/invoices/:invoiceId
 * @desc Get detailed invoice for verification
 * @access Private - Operations/Admin
 */
router.get('/invoices/:invoiceId', opsVerificationController.getInvoiceDetails);

/**
 * @route POST /api/ops-verification/invoices/:invoiceId/verify
 * @desc Verify (approve/reject) invoice
 * @access Private - Operations/Admin
 */
router.post('/invoices/:invoiceId/verify', opsVerificationController.verifyInvoice);

/**
 * @route POST /api/ops-verification/bulk-verify
 * @desc Bulk verification of multiple invoices
 * @access Private - Operations/Admin
 */
router.post('/bulk-verify', opsVerificationController.bulkVerifyInvoices);

/**
 * @route GET /api/ops-verification/history
 * @desc Get verification history and audit logs
 * @access Private - Operations/Admin
 */
router.get('/history', opsVerificationController.getVerificationHistory);

/**
 * @route GET /api/ops-verification/metrics
 * @desc Get verification dashboard metrics
 * @access Private - Operations/Admin
 */
router.get('/metrics', opsVerificationController.getVerificationMetrics);

export { router as opsVerificationRoutes };