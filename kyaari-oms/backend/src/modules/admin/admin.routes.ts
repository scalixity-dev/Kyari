import { Router } from 'express';
import { adminController } from './admin.controller';
import { authenticate, requireRole } from '../../middlewares/auth.middleware';
import { APP_CONSTANTS } from '../../config/constants';
import { deviceTokenController } from '../notifications/deviceToken.controller';

const router = Router();

// All admin routes require authentication and ADMIN role
router.use(authenticate);
router.use(requireRole([APP_CONSTANTS.ROLES.ADMIN]));

// User management
router.post('/users', adminController.createUser.bind(adminController));
router.get('/users', adminController.listUsers.bind(adminController));
router.get('/users/:userId', adminController.getUserDetails.bind(adminController));

// Note: Vendor management has been moved to /api/vendors routes
// Keeping these routes for backward compatibility
router.put('/vendors/:userId/approve', adminController.approveVendor.bind(adminController));
router.put('/vendors/:userId/suspend', adminController.suspendVendor.bind(adminController));

// =======================================
// == DEVICE TOKEN ADMIN ROUTES
// =======================================

/**
 * @route GET /api/admin/device-tokens/stats
 * @desc Get device token statistics and analytics
 * @access Private (Admin only)
 */
router.get('/device-tokens/stats', deviceTokenController.getTokenStatistics.bind(deviceTokenController));

/**
 * @route POST /api/admin/device-tokens/cleanup
 * @desc Cleanup expired and invalid device tokens
 * @access Private (Admin only)
 */
router.post('/device-tokens/cleanup', deviceTokenController.cleanupTokens.bind(deviceTokenController));

export { router as adminRoutes };