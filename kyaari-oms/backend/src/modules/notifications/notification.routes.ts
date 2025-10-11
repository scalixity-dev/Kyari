import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { deviceTokenController } from './deviceToken.controller';

const router = Router();

/**
 * @route GET /api/notifications/health
 * @desc Health check for notification system
 * @access Public
 */
router.get('/health', deviceTokenController.healthCheck.bind(deviceTokenController));

/**
 * @route GET /api/notifications/test
 * @desc Test notification endpoint (authenticated users only)
 * @access Private
 */
router.get('/test', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'Notification system is working',
    user: {
      id: req.user?.userId,
      roles: req.user?.roles
    },
    timestamp: new Date().toISOString()
  });
});

export { router as notificationRoutes };