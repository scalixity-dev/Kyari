import { Router } from 'express';
import dispatchController from '../controllers/dispatch.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';
import { uploadSingle } from '../middlewares/upload.middleware';
import { userCache, invalidateCache } from '../middlewares/cache.middleware';
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
router.post('/', 
  invalidateCache(['user:*:/api/dispatches/my*', 'api:*:/api/ops/received-orders*']),
  dispatchController.createDispatch.bind(dispatchController)
);

/**
 * @route   GET /api/dispatches/my
 * @desc    Get vendor's dispatches (cached for 3 minutes)
 * @access  Vendor only
 */
router.get('/my', 
  userCache(180),
  dispatchController.getMyDispatches.bind(dispatchController)
);

/**
 * @route   GET /api/dispatches/:id
 * @desc    Get dispatch details (cached for 5 minutes)
 * @access  Vendor only
 */
router.get('/:id', 
  userCache(300),
  dispatchController.getDispatchDetails.bind(dispatchController)
);

/**
 * @route   POST /api/dispatches/:id/upload-proof
 * @desc    Upload dispatch proof (image/PDF)
 * @access  Vendor only
 */
router.post(
  '/:id/upload-proof',
  uploadSingle('file'),
  invalidateCache(['user:*:/api/dispatches/*', 'api:*:/api/ops/received-orders*']),
  dispatchController.uploadDispatchProof.bind(dispatchController)
);

export default router;
