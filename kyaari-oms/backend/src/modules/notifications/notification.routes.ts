import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { deviceTokenController } from './deviceToken.controller';
import { NotificationAnalyticsController } from './analytics.controller';
import { notificationController } from './notification.controller';

const router = Router();

/**
 * @route GET /api/notifications/health
 * @desc Health check for notification system
 * @access Public
 */
router.get('/health', deviceTokenController.healthCheck.bind(deviceTokenController));

/**
 * USER NOTIFICATION ROUTES - Specific routes must come before generic ones
 */

/**
 * @route GET /api/notifications/unread-count
 * @desc Get unread notification count
 * @access Private
 */
router.get('/unread-count', authenticate, notificationController.getUnreadCount.bind(notificationController));

/**
 * @route GET /api/notifications/stats
 * @desc Get notification statistics
 * @access Private
 */
router.get('/stats', authenticate, notificationController.getNotificationStats.bind(notificationController));

/**
 * @route GET /api/notifications
 * @desc Get user notifications with filtering and pagination
 * @access Private
 */
router.get('/', authenticate, notificationController.getUserNotifications.bind(notificationController));

/**
 * @route PATCH /api/notifications/:id/read
 * @desc Mark notification as read
 * @access Private
 */
router.patch('/:id/read', authenticate, notificationController.markAsRead.bind(notificationController));

/**
 * @route GET /api/notifications/health/detailed
 * @desc Detailed health status including analytics
 * @access Private (Admin/Operations)
 */
router.get('/health/detailed', authenticate, NotificationAnalyticsController.getDetailedHealthStatus);

/**
 * @route POST /api/notifications/tokens/register
 * @desc Register a device token for push notifications
 * @access Private
 */
router.post('/tokens/register', authenticate, deviceTokenController.registerToken.bind(deviceTokenController));

/**
 * @route DELETE /api/notifications/tokens/:tokenId
 * @desc Unregister a device token
 * @access Private
 */
router.delete('/tokens/:tokenId', authenticate, deviceTokenController.unregisterToken.bind(deviceTokenController));

/**
 * @route GET /api/notifications/tokens/me
 * @desc Get current user's device tokens
 * @access Private
 */
router.get('/tokens/me', authenticate, deviceTokenController.getMyTokens.bind(deviceTokenController));

/**
 * @route POST /api/notifications/broadcast
 * @desc Broadcast notification to all users (Admin only)
 * @access Private (Admin only)
 */
router.post('/broadcast', authenticate, NotificationAnalyticsController.broadcastNotification);

/**
 * @route POST /api/notifications/broadcast/role
 * @desc Broadcast notification to specific role (Admin only)  
 * @access Private (Admin only)
 */
router.post('/broadcast/role', authenticate, NotificationAnalyticsController.broadcastToRole);

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