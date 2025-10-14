import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

// Public routes
router.post('/login', authController.login.bind(authController));
router.post('/register/vendor', authController.registerVendor.bind(authController));
router.post('/refresh', authController.refreshToken.bind(authController));

// Password reset routes (public)
router.post('/forgot-password', authController.sendPasswordResetCode.bind(authController));
router.post('/verify-reset-code', authController.verifyPasswordResetCode.bind(authController));
router.post('/reset-password', authController.resetPasswordWithCode.bind(authController));

// Protected routes
router.post('/logout', authenticate, authController.logout.bind(authController));
router.get('/me', authenticate, authController.getCurrentUser.bind(authController));

// Admin routes for token management
router.post('/admin/cleanup-tokens', authenticate, authController.cleanupExpiredTokens.bind(authController));
router.post('/admin/revoke-user-tokens/:userId', authenticate, authController.revokeUserTokens.bind(authController));

export { router as authRoutes };