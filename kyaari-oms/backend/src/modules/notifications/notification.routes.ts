import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { deviceTokenController } from './deviceToken.controller';
import { NotificationAnalyticsController } from './analytics.controller';

const router = Router();

/**
 * @route GET /api/notifications/health
 * @desc Health check for notification system
 * @access Public
 */
router.get('/health', deviceTokenController.healthCheck.bind(deviceTokenController));

/**
 * @route GET /api/notifications/health/detailed
 * @desc Detailed health status including analytics
 * @access Private (Admin/Operations)
 */
router.get('/health/detailed', authenticate, NotificationAnalyticsController.getDetailedHealthStatus);

/**
 * @route GET /api/notifications/analytics
 * @desc Get notification delivery analytics
 * @access Private (Admin/Operations)
 */
router.get('/analytics', authenticate, NotificationAnalyticsController.getNotificationAnalytics);

/**
 * @route GET /api/notifications/analytics/tokens
 * @desc Get device token analytics
 * @access Private (Admin/Operations)
 */
router.get('/analytics/tokens', authenticate, NotificationAnalyticsController.getDeviceTokenAnalytics);

/**
 * @route POST /api/notifications/test
 * @desc Run notification system tests
 * @access Private (Admin/Operations)
 */
router.post('/test', authenticate, NotificationAnalyticsController.testNotificationSystem);

/**
 * @route POST /api/notifications/test/send
 * @desc Send a test notification
 * @access Private (Admin/Operations)
 */
router.post('/test/send', authenticate, NotificationAnalyticsController.sendTestNotification);

/**
 * @route POST /api/notifications/maintenance/cleanup
 * @desc Clean up expired device tokens
 * @access Private (Admin only)
 */
router.post('/maintenance/cleanup', authenticate, NotificationAnalyticsController.cleanupExpiredTokens);

/**
 * @route GET /api/notifications/test
 * @desc Basic test endpoint (legacy support)
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
    timestamp: new Date().toISOString(),
    note: 'Use POST /api/notifications/test for comprehensive testing'
  });
});

export { router as notificationRoutes };