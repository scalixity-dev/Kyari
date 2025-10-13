import { Router } from 'express';
import { userController } from './user.controller';
import { authenticate, requireRole } from '../../middlewares/auth.middleware';
import { deviceTokenController } from '../notifications/deviceToken.controller';

const router = Router();

/**
 * All routes require authentication
 * Most routes require ADMIN role
 */

// Get all users (with filters)
router.get(
  '/',
  authenticate,
  requireRole(['ADMIN']),
  userController.getUsers.bind(userController)
);

// Get single user by ID
router.get(
  '/:id',
  authenticate,
  requireRole(['ADMIN']),
  userController.getUserById.bind(userController)
);

// Create new user
router.post(
  '/',
  authenticate,
  requireRole(['ADMIN']),
  userController.createUser.bind(userController)
);

// Update user
router.patch(
  '/:id',
  authenticate,
  requireRole(['ADMIN']),
  userController.updateUser.bind(userController)
);

// Toggle user status (activate/deactivate)
router.patch(
  '/:id/status',
  authenticate,
  requireRole(['ADMIN']),
  userController.toggleUserStatus.bind(userController)
);

// Delete user (soft delete)
router.delete(
  '/:id',
  authenticate,
  requireRole(['ADMIN']),
  userController.deleteUser.bind(userController)
);

// =======================================
// == DEVICE TOKEN MANAGEMENT ROUTES
// =======================================

/**
 * @route POST /api/users/me/device-tokens
 * @desc Register a device token for push notifications
 * @access Private (any authenticated user)
 */
router.post(
  '/me/device-tokens',
  authenticate,
  deviceTokenController.registerToken.bind(deviceTokenController)
);

/**
 * @route DELETE /api/users/me/device-tokens
 * @desc Remove a specific device token
 * @access Private (any authenticated user)
 */
router.delete(
  '/me/device-tokens',
  authenticate,
  deviceTokenController.removeToken.bind(deviceTokenController)
);

/**
 * @route DELETE /api/users/me/device-tokens/all
 * @desc Remove all device tokens for the current user (logout all devices)
 * @access Private (any authenticated user)
 */
router.delete(
  '/me/device-tokens/all',
  authenticate,
  deviceTokenController.removeAllTokens.bind(deviceTokenController)
);

/**
 * @route GET /api/users/me/device-tokens
 * @desc Get device tokens for the current user
 * @access Private (any authenticated user)
 */
router.get(
  '/me/device-tokens',
  authenticate,
  deviceTokenController.getMyTokens.bind(deviceTokenController)
);

export const userRoutes = router;

