import { Router } from 'express';
import dispatchController from '../controllers/dispatch.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';
import { uploadSingle } from '../middlewares/upload.middleware';
import { APP_CONSTANTS } from '../config/constants';

const router = Router();

// All dispatch routes require authentication
router.use(authenticate);

// Vendor-only routes
router.use(requireRole([APP_CONSTANTS.ROLES.VENDOR]));

/**
 * @route   POST /api/dispatches
 * @desc    Create a new dispatch
 * @access  Vendor only
 */
router.post('/', dispatchController.createDispatch.bind(dispatchController));

/**
 * @route   GET /api/dispatches/my
 * @desc    Get vendor's dispatches
 * @access  Vendor only
 */
router.get('/my', dispatchController.getMyDispatches.bind(dispatchController));

/**
 * @route   GET /api/dispatches/:id
 * @desc    Get dispatch details
 * @access  Vendor only
 */
router.get('/:id', dispatchController.getDispatchDetails.bind(dispatchController));

/**
 * @route   POST /api/dispatches/:id/upload-proof
 * @desc    Upload dispatch proof (image/PDF)
 * @access  Vendor only
 */
router.post(
  '/:id/upload-proof',
  uploadSingle('file'),
  dispatchController.uploadDispatchProof.bind(dispatchController)
);

export default router;
