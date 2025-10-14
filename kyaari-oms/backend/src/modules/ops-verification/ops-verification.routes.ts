import { Router } from 'express';
import { opsVerificationController } from './ops-verification.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { userCache, invalidateCache } from '../../middlewares/cache.middleware';

const router = Router();

// Apply authentication to all ops verification routes
router.use(authenticate);

/**
 * @route GET /api/ops-verification/pending-invoices
 * @desc Get pending invoices for verification (cached for 2 minutes)
 * @access Private - Operations/Admin
 */
router.get('/pending-invoices', 
  userCache(120),
  opsVerificationController.getPendingInvoices
);

/**
 * @route GET /api/ops-verification/invoices/:invoiceId
 * @desc Get detailed invoice for verification (cached for 5 minutes)
 * @access Private - Operations/Admin
 */
router.get('/invoices/:invoiceId', 
  userCache(300),
  opsVerificationController.getInvoiceDetails
);

/**
 * @route POST /api/ops-verification/invoices/:invoiceId/verify
 * @desc Verify (approve/reject) invoice
 * @access Private - Operations/Admin
 */
router.post('/invoices/:invoiceId/verify', 
  invalidateCache(['api:*:/api/ops-verification/*', 'api:*:/api/invoices/*']),
  opsVerificationController.verifyInvoice
);

/**
 * @route POST /api/ops-verification/bulk-verify
 * @desc Bulk verification of multiple invoices
 * @access Private - Operations/Admin
 */
router.post('/bulk-verify', 
  invalidateCache(['api:*:/api/ops-verification/*', 'api:*:/api/invoices/*']),
  opsVerificationController.bulkVerifyInvoices
);

/**
 * @route GET /api/ops-verification/history
 * @desc Get verification history and audit logs (cached for 5 minutes)
 * @access Private - Operations/Admin
 */
router.get('/history', 
  userCache(300),
  opsVerificationController.getVerificationHistory
);

/**
 * @route GET /api/ops-verification/metrics
 * @desc Get verification dashboard metrics (cached for 1 minute)
 * @access Private - Operations/Admin
 */
router.get('/metrics', 
  userCache(60),
  opsVerificationController.getVerificationMetrics
);

export { router as opsVerificationRoutes };