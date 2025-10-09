import { Router } from 'express';
import { vendorController } from './vendor.controller';
import { authenticate, requireRole } from '../../middlewares/auth.middleware';
import { APP_CONSTANTS } from '../../config/constants';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * Vendor self-service routes (VENDOR role)
 */

// Get own profile
router.get(
  '/profile',
  requireRole([APP_CONSTANTS.ROLES.VENDOR]),
  vendorController.getMyProfile.bind(vendorController)
);

// Update own profile
router.patch(
  '/profile',
  requireRole([APP_CONSTANTS.ROLES.VENDOR]),
  vendorController.updateProfile.bind(vendorController)
);

// Get own statistics
router.get(
  '/stats',
  requireRole([APP_CONSTANTS.ROLES.VENDOR]),
  vendorController.getVendorStats.bind(vendorController)
);

/**
 * Admin vendor management routes (ADMIN role)
 */

// Get all vendors (Admin only)
router.get(
  '/',
  requireRole([APP_CONSTANTS.ROLES.ADMIN]),
  vendorController.getVendors.bind(vendorController)
);

// Get vendor by ID (Admin only)
router.get(
  '/:id',
  requireRole([APP_CONSTANTS.ROLES.ADMIN]),
  vendorController.getVendorById.bind(vendorController)
);

// Approve vendor (Admin only)
router.patch(
  '/:userId/approve',
  requireRole([APP_CONSTANTS.ROLES.ADMIN]),
  vendorController.approveVendor.bind(vendorController)
);

// Suspend vendor (Admin only)
router.patch(
  '/:userId/suspend',
  requireRole([APP_CONSTANTS.ROLES.ADMIN]),
  vendorController.suspendVendor.bind(vendorController)
);

export const vendorRoutes = router;

