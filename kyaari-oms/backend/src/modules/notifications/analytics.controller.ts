import { Request, Response } from 'express';
import { notificationService } from './notification.service';
import { deviceTokenService } from './deviceToken.service';
import { logger } from '../../utils/logger';
import { prisma } from '../../config/database';

/**
 * Analytics Controller for Notification System
 * 
 * Provides comprehensive analytics and testing endpoints for:
 * - Notification delivery performance
 * - Device token management statistics
 * - System testing and validation
 * - Performance monitoring and debugging
 */
export class NotificationAnalyticsController {
  /**
   * Get comprehensive notification analytics
   * GET /api/notifications/analytics
   */
  static getNotificationAnalytics = async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      // Validate date range
      if (start && end && start > end) {
        return res.status(400).json({
          success: false,
          message: 'Start date must be before end date'
        });
      }

      const analytics = await notificationService.getNotificationAnalytics(start, end);

      return res.json({
        success: true,
        data: analytics,
        message: 'Notification analytics retrieved successfully'
      });
    } catch (error) {
      logger.error('Failed to get notification analytics', { error });
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve notification analytics'
      });
    }
  };

  /**
   * Get device token analytics
   * GET /api/notifications/analytics/tokens
   */
  static getDeviceTokenAnalytics = async (req: Request, res: Response) => {
    try {
      const analytics = await notificationService.getDeviceTokenAnalytics();

      return res.json({
        success: true,
        data: analytics,
        message: 'Device token analytics retrieved successfully'
      });
    } catch (error) {
      logger.error('Failed to get device token analytics', { error });
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve device token analytics'
      });
    }
  };

  /**
   * Test notification system
   * POST /api/notifications/test
   */
  static testNotificationSystem = async (req: Request, res: Response) => {
    try {
      const { testType = 'basic', targetUserId } = req.body;
      const userId = targetUserId || req.user?.userId;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required for testing'
        });
      }

      // Validate test type
      const validTestTypes = ['basic', 'priority', 'role', 'comprehensive'];
      if (!validTestTypes.includes(testType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid test type. Valid types: basic, priority, role, comprehensive'
        });
      }

      const testResult = await notificationService.testNotificationSystem(userId, testType);

      return res.json({
        success: testResult.success,
        data: testResult,
        message: testResult.success ? 'All tests passed successfully' : 'Some tests failed'
      });
    } catch (error) {
      logger.error('Notification system test failed', { error });
      return res.status(500).json({
        success: false,
        message: 'Failed to execute notification system test'
      });
    }
  };

  /**
   * Send test notification
   * POST /api/notifications/test/send
   */
  static sendTestNotification = async (req: Request, res: Response) => {
    try {
      const { 
        title = 'Test Notification',
        body = 'This is a test notification from Kyari OMS',
        priority = 'NORMAL',
        targetUserId,
        targetRoles,
        data = {}
      } = req.body;

      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Check if user has permission to send test notifications
      const userRoles = req.user?.roles || [];
      if (!userRoles.includes('ADMIN') && !userRoles.includes('OPERATIONS')) {
        return res.status(403).json({
          success: false,
          message: 'Only ADMIN and OPERATIONS users can send test notifications'
        });
      }

      const payload = {
        title,
        body,
        priority: priority as 'LOW' | 'NORMAL' | 'URGENT',
        data: {
          type: 'MANUAL_TEST',
          testId: 'manual-' + Date.now(),
          sentBy: userId,
          ...data
        }
      };

      let result;

      if (targetUserId) {
        // Send to specific user
        result = await notificationService.sendNotificationToUser(targetUserId, payload);
      } else if (targetRoles && Array.isArray(targetRoles)) {
        // Send to specific roles
        result = await notificationService.sendNotificationToRole(targetRoles, payload);
      } else {
        // Send to self by default
        result = await notificationService.sendNotificationToUser(userId, payload);
      }

      return res.json({
        success: result.success,
        data: result,
        message: result.success ? 'Test notification sent successfully' : 'Failed to send test notification'
      });
    } catch (error) {
      logger.error('Failed to send test notification', { error });
      return res.status(500).json({
        success: false,
        message: 'Failed to send test notification'
      });
    }
  };

  /**
   * Get system health status
   * GET /api/notifications/health/detailed
   */
  static getDetailedHealthStatus = async (req: Request, res: Response) => {
    try {
      const [tokenAnalytics, recentNotifications] = await Promise.all([
        notificationService.getDeviceTokenAnalytics(),
        notificationService.getNotificationAnalytics(
          new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          new Date()
        )
      ]);

      const healthStatus = {
        firebase: {
          available: true, // TODO: Add actual Firebase connectivity check
          status: 'connected'
        },
        database: {
          available: true,
          status: 'connected'
        },
        deviceTokens: {
          totalActive: tokenAnalytics.totalActiveTokens,
          totalExpired: tokenAnalytics.totalExpiredTokens,
          recentRegistrations: tokenAnalytics.recentRegistrations.length
        },
        notifications: {
          last24Hours: recentNotifications.totalNotifications,
          deliveryRate: recentNotifications.deliveryRate,
          avgDeliveryTime: recentNotifications.avgDeliveryTime
        },
        timestamp: new Date().toISOString()
      };

      return res.json({
        success: true,
        data: healthStatus,
        message: 'System health status retrieved successfully'
      });
    } catch (error) {
      logger.error('Failed to get system health status', { error });
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve system health status'
      });
    }
  };

  /**
   * Cleanup expired tokens
   * POST /api/notifications/maintenance/cleanup
   */
  static cleanupExpiredTokens = async (req: Request, res: Response) => {
    try {
      const userRoles = req.user?.roles || [];
      if (!userRoles.includes('ADMIN')) {
        return res.status(403).json({
          success: false,
          message: 'Only ADMIN users can perform maintenance operations'
        });
      }

      const result = await deviceTokenService.cleanupExpiredTokens();

      return res.json({
        success: true,
        data: {
          expiredTokensCleaned: result.expired,
          inactiveTokensCleaned: result.inactive,
          totalCleaned: result.expired + result.inactive
        },
        message: `Successfully cleaned up ${result.expired + result.inactive} expired tokens`
      });
    } catch (error) {
      logger.error('Failed to cleanup expired tokens', { error });
      return res.status(500).json({
        success: false,
        message: 'Failed to cleanup expired tokens'
      });
    }
  };

  /**
   * Broadcast notification to all users
   * POST /api/notifications/broadcast
   * @access Admin only
   */
  static broadcastNotification = async (req: Request, res: Response) => {
    try {
      const { title, message, priority, data } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      // Validate required fields
      if (!title || !message) {
        return res.status(400).json({
          success: false,
          error: 'Title and message are required'
        });
      }

      // Create notification for all users
      // First get all users, then send to them
      // For now, we'll use a simple approach - get all users from the database
      const allUsers = await prisma.user.findMany({
        select: { id: true }
      });

      const userIds = allUsers.map((user: { id: string }) => user.id);

      const notification = await notificationService.sendNotificationToUsers(
        userIds,
        {
          title,
          body: message,
          priority: priority || 'medium',
          data: data || {},
        },
        {}
      );

      logger.info('Broadcast notification sent', {
        totalUsers: notification.totalUsers,
        totalNotifications: notification.totalNotifications,
        title,
        priority: priority || 'medium',
        sentBy: userId
      });

      return res.json({
        success: true,
        data: {
          totalUsers: notification.totalUsers,
          totalNotifications: notification.totalNotifications,
          title,
          message,
          priority: priority || 'medium'
        },
        message: 'Broadcast notification sent successfully'
      });

    } catch (error) {
      logger.error('Failed to send broadcast notification', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.userId
      });
      return res.status(500).json({
        success: false,
        error: 'Failed to send broadcast notification'
      });
    }
  };

  /**
   * Broadcast notification to users with specific role
   * POST /api/notifications/broadcast/role
   * @access Admin only
   */
  static broadcastToRole = async (req: Request, res: Response) => {
    try {
      const { title, message, role, priority, data } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      // Validate required fields
      if (!title || !message || !role) {
        return res.status(400).json({
          success: false,
          error: 'Title, message, and role are required'
        });
      }

      // Validate role
      const validRoles = ['ADMIN', 'OPERATIONS', 'VENDOR', 'ACCOUNTS'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid role. Must be one of: ' + validRoles.join(', ')
        });
      }

      // Create notification for role
      const notification = await notificationService.sendNotificationToRole(
        [role],
        {
          title,
          body: message,
          priority: priority || 'medium',
          data: data || {},
        },
        {}
      );

      logger.info('Role-based broadcast notification sent', {
        totalUsers: notification.totalUsers,
        totalNotifications: notification.totalNotifications,
        title,
        role,
        priority: priority || 'medium',
        sentBy: userId
      });

      return res.json({
        success: true,
        data: {
          totalUsers: notification.totalUsers,
          totalNotifications: notification.totalNotifications,
          title,
          message,
          role,
          priority: priority || 'medium'
        },
        message: `Broadcast notification sent to all ${role} users`
      });

    } catch (error) {
      logger.error('Failed to send role-based broadcast notification', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        role: req.body.role,
        userId: req.user?.userId
      });
      return res.status(500).json({
        success: false,
        error: 'Failed to send role-based broadcast notification'
      });
    }
  };
}