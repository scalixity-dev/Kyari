import { Router } from 'express';
import { validationController } from './validation.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

// Apply authentication to all validation routes
router.use(authenticate);

/**
 * @route POST /api/validation/invoice-amount
 * @desc Validate invoice amount against purchase order
 * @access Private - Accounts/Admin
 */
router.post('/invoice-amount', validationController.validateInvoiceAmount);

/**
 * @route POST /api/validation/vendor-authorization
 * @desc Validate vendor authorization for operations
 * @access Private - All authenticated users
 */
router.post('/vendor-authorization', validationController.validateVendorAuthorization);

/**
 * @route GET /api/validation/data-consistency/:orderId
 * @desc Validate data consistency across related entities
 * @access Private - All authenticated users
 */
router.get('/data-consistency/:orderId', validationController.validateDataConsistency);

/**
 * @route POST /api/validation/business-rules
 * @desc Validate business rules for entity operations
 * @access Private - All authenticated users
 */
router.post('/business-rules', validationController.validateBusinessRules);

/**
 * @route GET /api/validation/full-workflow/:orderId
 * @desc Comprehensive validation for complete workflow
 * @access Private - All authenticated users
 */
router.get('/full-workflow/:orderId', validationController.validateFullWorkflow);

/**
 * @route GET /api/validation/summary
 * @desc Get validation summary for dashboard
 * @access Private - Admin/Accounts/Operations
 */
router.get('/summary', validationController.getValidationSummary);

/**
 * @route POST /api/validation/batch
 * @desc Batch validation for multiple entities
 * @access Private - All authenticated users
 */
router.post('/batch', validationController.batchValidation);

export { router as validationRoutes };