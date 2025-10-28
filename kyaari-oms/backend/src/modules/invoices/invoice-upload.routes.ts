import { Router } from 'express';
import { InvoiceUploadController } from './invoice-upload.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { userCache, invalidateCache } from '../../middlewares/cache.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route POST /api/invoices/:invoiceId/upload
 * @desc Upload file to existing invoice record
 * @access Vendor, Accounts
 */
router.post(
  '/:invoiceId/upload',
  invalidateCache([
    'api:*:/api/invoices/*', 
    'user:*:/api/invoices/*',
    'user:*:/api/assignments/accounts/vendor-orders*'  // Invalidate accounts invoice page cache
  ]),
  InvoiceUploadController.uploadInvoiceFile
);

/**
 * @route POST /api/invoices/upload-and-link
 * @desc Upload invoice file and create new invoice record linked to purchase order
 * @access Vendor, Accounts
 */
router.post(
  '/upload-and-link',
  invalidateCache([
    'api:*:/api/invoices/*', 
    'user:*:/api/invoices/*', 
    'api:*:/api/ops-verification/*',
    'user:*:/api/assignments/accounts/vendor-orders*'  // Invalidate accounts invoice page cache
  ]),
  InvoiceUploadController.uploadAndLinkInvoice
);

/**
 * @route GET /api/invoices/uploads
 * @desc Get uploaded invoices for authenticated user (cached for 3 minutes)
 * @access Vendor, Accounts, Ops
 */
router.get(
  '/uploads',
  userCache(180),
  InvoiceUploadController.getUploadedInvoices
);

export default router;