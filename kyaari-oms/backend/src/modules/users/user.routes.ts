import { Router } from 'express';
import { userController } from './user.controller';
import { authenticate, requireRole } from '../../middlewares/auth.middleware';

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

export const userRoutes = router;

