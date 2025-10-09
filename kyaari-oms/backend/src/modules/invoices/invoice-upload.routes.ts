import { Router } from 'express';
import { InvoiceUploadController } from './invoice-upload.controller';
import { authenticate } from '../../middlewares/auth.middleware';

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
  InvoiceUploadController.uploadInvoiceFile
);

/**
 * @route POST /api/invoices/upload-and-link
 * @desc Upload invoice file and create new invoice record linked to purchase order
 * @access Vendor, Accounts
 */
router.post(
  '/upload-and-link',
  InvoiceUploadController.uploadAndLinkInvoice
);

/**
 * @route GET /api/invoices/uploads
 * @desc Get uploaded invoices for authenticated user (role-based filtering)
 * @access Vendor, Accounts, Ops
 */
router.get(
  '/uploads',
  InvoiceUploadController.getUploadedInvoices
);

export default router;