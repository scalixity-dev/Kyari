import { Router } from 'express';
import { invoiceController } from './invoice.controller';
import { InvoiceUploadController } from './invoice-upload.controller';
import { authenticate, requireRole } from '../../middlewares/auth.middleware';
import { userCache, invalidateCache } from '../../middlewares/cache.middleware';

const router = Router();

// All invoice routes require authentication
router.use(authenticate);

/**
 * @route POST /api/invoices/generate
 * @desc Generate invoice for a purchase order
 * @access ACCOUNTS team only
 */
router.post('/generate', 
  requireRole(['ACCOUNTS']),
  invalidateCache(['api:*:/api/invoices*', 'user:*:/api/invoices/*']),
  invoiceController.generateInvoice.bind(invoiceController)
);

/**
 * @route POST /api/invoices/upload-and-link
 * @desc Upload invoice file and create new invoice record linked to purchase order
 * @access Vendor, Accounts
 */
router.post(
  '/upload-and-link',
  invalidateCache(['api:*:/api/invoices*', 'user:*:/api/invoices/*', 'api:*:/api/ops-verification/*']),
  InvoiceUploadController.uploadAndLinkInvoice
);

/**
 * @route GET /api/invoices/uploads
 * @desc Get uploaded invoices for authenticated user (cached for 3 minutes)
 * @access Vendor, Accounts, Ops
 * @important This route MUST come before /:id routes to avoid conflicts
 */
router.get(
  '/uploads',
  userCache(180),
  InvoiceUploadController.getUploadedInvoices
);

/**
 * @route GET /api/invoices
 * @desc List invoices with pagination and filters (cached for 3 minutes)
 * @access ACCOUNTS team only
 */
router.get('/', 
  requireRole(['ACCOUNTS']),
  userCache(180),
  invoiceController.listInvoices.bind(invoiceController)
);

/**
 * @route GET /api/invoices/:id
 * @desc Get invoice by ID (cached for 5 minutes)
 * @access ACCOUNTS team only
 */
router.get('/:id', 
  requireRole(['ACCOUNTS']),
  userCache(300),
  invoiceController.getInvoiceById.bind(invoiceController)
);

/**
 * @route GET /api/invoices/:id/download
 * @desc Download invoice JSON file (not cached - file download)
 * @access ACCOUNTS team only
 */
router.get('/:id/download', 
  requireRole(['ACCOUNTS']),
  invoiceController.downloadInvoice.bind(invoiceController)
);

/**
 * @route POST /api/invoices/:invoiceId/upload
 * @desc Upload file to existing invoice record
 * @access Vendor, Accounts
 */
router.post(
  '/:invoiceId/upload',
  invalidateCache(['api:*:/api/invoices/*', 'user:*:/api/invoices/*']),
  InvoiceUploadController.uploadInvoiceFile
);

export default router;