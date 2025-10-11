import { PrismaClient, NotificationPriority, NotificationStatus, DeviceType, User, Role } from '@prisma/client';
import { getFCM, isFirebaseAvailable, FIREBASE_CONFIG } from '../../config/firebase.config';
import { deviceTokenService } from './deviceToken.service';
import { logger } from '../../utils/logger';
import { env } from '../../config/env';

const prisma = new PrismaClient();

/**
 * Core Notification Service
 * 
 * Handles all notification operations including:
 * - Priority-based notifications (URGENT, NORMAL, LOW)
 * - Role-based targeting
 * - Delivery tracking and analytics
 * - Batch processing for performance
 * - Retry mechanisms for failed notifications
 * - Template support for future expansion
 */

export interface NotificationPayload {
  title: string;
  body: string;
  priority?: NotificationPriority;
  data?: Record<string, string>; // Custom data for deep linking
  imageUrl?: string;
  clickAction?: string; // URL to navigate to on click
  badge?: number;
  sound?: string;
  ttl?: number; // Time to live in seconds
}

export interface NotificationOptions {
  scheduleAt?: Date; // For future scheduled notifications
  expiresAt?: Date; // Custom expiration time
  retryAttempts?: number; // Override default retry attempts
  batchSize?: number; // Override default batch size
}

export interface NotificationResult {
  success: boolean;
  notificationLogId: string;
  totalTargets: number;
  sentCount: number;
  failedCount: number;
  errors?: string[];
}

export interface RoleBasedNotificationResult {
  success: boolean;
  results: Array<{
    userId: string;
    userName: string;
    result: NotificationResult;
  }>;
  totalUsers: number;
  totalNotifications: number;
}

export class NotificationService {

  /**
   * Send notification to a specific user
   */
  async sendNotificationToUser(
    userId: string,
    payload: NotificationPayload,
    options: NotificationOptions = {}
  ): Promise<NotificationResult> {
    try {
      // Validate Firebase availability
      if (!isFirebaseAvailable()) {
        logger.warn('Firebase not available, simulating notification', { userId, title: payload.title });
        return this.simulateNotification(userId, payload);
      }

      // Get active device tokens for the user
      const deviceTokens = await deviceTokenService.getActiveTokensForUser(userId);
      
      if (deviceTokens.length === 0) {
        logger.info('No active device tokens found for user', { userId });
        return {
          success: true,
          notificationLogId: '',
          totalTargets: 0,
          sentCount: 0,
          failedCount: 0
        };
      }

      // Create notification log entry
      const notificationLog = await prisma.notificationLog.create({
        data: {
          userId,
          title: payload.title,
          body: payload.body,
          priority: payload.priority || NotificationPriority.NORMAL,
          status: NotificationStatus.PENDING,
          deviceTokenCount: deviceTokens.length,
          metadata: {
            data: payload.data,
            imageUrl: payload.imageUrl,
            clickAction: payload.clickAction,
            options
          } as any,
          scheduledAt: options.scheduleAt,
          expiresAt: options.expiresAt || this.calculateExpiration(payload.priority || NotificationPriority.NORMAL),
          retryCount: 0
        }
      });

      // Send notifications
      const result = await this.sendToDeviceTokens(deviceTokens, payload, notificationLog.id);

      // Update notification log with results
      await prisma.notificationLog.update({
        where: { id: notificationLog.id },
        data: {
          status: result.success ? NotificationStatus.SENT : NotificationStatus.FAILED,
          sentCount: result.sentCount,
          failedCount: result.failedCount,
          sentAt: new Date(),
          metadata: {
            ...notificationLog.metadata as any,
            errors: result.errors
          } as any
        }
      });

      logger.info('Notification sent to user', {
        userId,
        notificationId: notificationLog.id,
        title: payload.title,
        priority: payload.priority,
        totalTargets: result.totalTargets,
        sentCount: result.sentCount,
        failedCount: result.failedCount
      });

      return {
        ...result,
        notificationLogId: notificationLog.id
      };

    } catch (error) {
      logger.error('Failed to send notification to user', {
        userId,
        title: payload.title,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        notificationLogId: '',
        totalTargets: 0,
        sentCount: 0,
        failedCount: 1,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Send notifications to users with specific roles
   */
  async sendNotificationToRole(
    roles: string[],
    payload: NotificationPayload,
    options: NotificationOptions = {}
  ): Promise<RoleBasedNotificationResult> {
    try {
      // Get users with the specified roles
      const users = await prisma.user.findMany({
        where: {
          roles: {
            some: {
              role: {
                name: { in: roles }
              }
            }
          },
          status: 'ACTIVE',
          deletedAt: null
        },
        include: {
          roles: {
            include: {
              role: true
            }
          }
        }
      });

      if (users.length === 0) {
        logger.info('No active users found with specified roles', { roles });
        return {
          success: true,
          results: [],
          totalUsers: 0,
          totalNotifications: 0
        };
      }

      logger.info('Sending role-based notifications', {
        roles,
        userCount: users.length,
        title: payload.title,
        priority: payload.priority
      });

      // Send notifications to each user
      const results = await Promise.all(
        users.map(async (user) => {
          const result = await this.sendNotificationToUser(user.id, payload, options);
          return {
            userId: user.id,
            userName: user.name,
            result
          };
        })
      );

      // Calculate totals
      const totalNotifications = results.reduce((sum, r) => sum + r.result.sentCount, 0);
      const hasAnyFailures = results.some(r => !r.result.success);

      logger.info('Role-based notifications completed', {
        roles,
        totalUsers: users.length,
        totalNotifications,
        hasFailures: hasAnyFailures
      });

      return {
        success: !hasAnyFailures,
        results,
        totalUsers: users.length,
        totalNotifications
      };

    } catch (error) {
      logger.error('Failed to send role-based notifications', {
        roles,
        title: payload.title,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        results: [],
        totalUsers: 0,
        totalNotifications: 0
      };
    }
  }

  /**
   * Send notifications to multiple specific users
   */
  async sendNotificationToUsers(
    userIds: string[],
    payload: NotificationPayload,
    options: NotificationOptions = {}
  ): Promise<RoleBasedNotificationResult> {
    try {
      // Get user information
      const users = await prisma.user.findMany({
        where: {
          id: { in: userIds },
          status: 'ACTIVE',
          deletedAt: null
        }
      });

      if (users.length === 0) {
        logger.info('No active users found from provided user IDs', { userIds });
        return {
          success: true,
          results: [],
          totalUsers: 0,
          totalNotifications: 0
        };
      }

      logger.info('Sending notifications to specific users', {
        userCount: users.length,
        title: payload.title,
        priority: payload.priority
      });

      // Send notifications to each user
      const results = await Promise.all(
        users.map(async (user) => {
          const result = await this.sendNotificationToUser(user.id, payload, options);
          return {
            userId: user.id,
            userName: user.name,
            result
          };
        })
      );

      // Calculate totals
      const totalNotifications = results.reduce((sum, r) => sum + r.result.sentCount, 0);
      const hasAnyFailures = results.some(r => !r.result.success);

      return {
        success: !hasAnyFailures,
        results,
        totalUsers: users.length,
        totalNotifications
      };

    } catch (error) {
      logger.error('Failed to send notifications to users', {
        userIds,
        title: payload.title,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        results: [],
        totalUsers: 0,
        totalNotifications: 0
      };
    }
  }

  /**
   * Get notification history for a user
   */
  async getNotificationHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{
    notifications: Array<{
      id: string;
      title: string;
      body: string;
      priority: NotificationPriority;
      status: NotificationStatus;
      sentAt: Date | null;
      createdAt: Date;
      metadata?: any;
    }>;
    total: number;
  }> {
    try {
      const [notifications, total] = await Promise.all([
        prisma.notificationLog.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
          select: {
            id: true,
            title: true,
            body: true,
            priority: true,
            status: true,
            sentAt: true,
            createdAt: true,
            metadata: true
          }
        }),
        prisma.notificationLog.count({
          where: { userId }
        })
      ]);

      return { notifications, total };

    } catch (error) {
      logger.error('Failed to get notification history', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return { notifications: [], total: 0 };
    }
  }

  /**
   * Get notification analytics
   */
  async getNotificationAnalytics(startDate?: Date, endDate?: Date): Promise<{
    totalNotifications: number;
    byStatus: Record<NotificationStatus, number>;
    byPriority: Record<NotificationPriority, number>;
    deliveryRate: number;
    avgDeliveryTime: number | null;
    topUsers: Array<{ userId: string; userName: string; count: number }>;
  }> {
    try {
      const dateFilter = {
        ...(startDate && endDate && {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        })
      };

      const [totalNotifications, statusStats, priorityStats, deliveryStats, topUsersStats] = await Promise.all([
        prisma.notificationLog.count({ where: dateFilter }),
        
        prisma.notificationLog.groupBy({
          by: ['status'],
          where: dateFilter,
          _count: { id: true }
        }),
        
        prisma.notificationLog.groupBy({
          by: ['priority'],
          where: dateFilter,
          _count: { id: true }
        }),
        
        prisma.notificationLog.aggregate({
          where: {
            ...dateFilter,
            status: NotificationStatus.SENT,
            sentAt: { not: null }
          },
          _avg: {
            sentCount: true
          }
        }),
        
        prisma.notificationLog.groupBy({
          by: ['userId'],
          where: dateFilter,
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: 10
        })
      ]);

      // Convert to proper format
      const byStatus = statusStats.reduce((acc, item) => {
        acc[item.status] = item._count.id;
        return acc;
      }, {} as Record<NotificationStatus, number>);

      const byPriority = priorityStats.reduce((acc, item) => {
        acc[item.priority] = item._count.id;
        return acc;
      }, {} as Record<NotificationPriority, number>);

      // Get user names for top users
      const userIds = topUsersStats.map(stat => stat.userId);
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true }
      });

      const topUsers = topUsersStats.map(stat => {
        const user = users.find(u => u.id === stat.userId);
        return {
          userId: stat.userId,
          userName: user?.name || 'Unknown',
          count: stat._count.id
        };
      });

      const deliveryRate = totalNotifications > 0 
        ? ((byStatus[NotificationStatus.SENT] || 0) / totalNotifications) * 100 
        : 0;

      return {
        totalNotifications,
        byStatus,
        byPriority,
        deliveryRate,
        avgDeliveryTime: deliveryStats._avg.sentCount,
        topUsers
      };

    } catch (error) {
      logger.error('Failed to get notification analytics', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        totalNotifications: 0,
        byStatus: {} as Record<NotificationStatus, number>,
        byPriority: {} as Record<NotificationPriority, number>,
        deliveryRate: 0,
        avgDeliveryTime: null,
        topUsers: []
      };
    }
  }

  /**
   * Retry failed notifications
   */
  async retryFailedNotifications(maxRetries: number = 3): Promise<{
    processed: number;
    succeeded: number;
    failed: number;
  }> {
    try {
      // Find failed notifications that haven't exceeded retry limit
      const failedNotifications = await prisma.notificationLog.findMany({
        where: {
          status: NotificationStatus.FAILED,
          retryCount: { lt: maxRetries },
          expiresAt: { gt: new Date() }
        },
        include: {
          user: true
        },
        take: 100 // Process in batches
      });

      if (failedNotifications.length === 0) {
        return { processed: 0, succeeded: 0, failed: 0 };
      }

      logger.info('Retrying failed notifications', {
        count: failedNotifications.length,
        maxRetries
      });

      let succeeded = 0;
      let failed = 0;

      for (const notification of failedNotifications) {
        try {
          // Reconstruct payload from stored data
          const metadata = notification.metadata as any;
          const payload: NotificationPayload = {
            title: notification.title,
            body: notification.body,
            priority: notification.priority,
            data: metadata?.data,
            imageUrl: metadata?.imageUrl,
            clickAction: metadata?.clickAction
          };

          // Retry sending
          const result = await this.sendNotificationToUser(notification.userId, payload);
          
          if (result.success) {
            succeeded++;
          } else {
            failed++;
            // Update retry count
            await prisma.notificationLog.update({
              where: { id: notification.id },
              data: {
                retryCount: notification.retryCount + 1,
                lastRetryAt: new Date()
              }
            });
          }

        } catch (error) {
          failed++;
          logger.error('Failed to retry notification', {
            notificationId: notification.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      logger.info('Notification retry completed', {
        processed: failedNotifications.length,
        succeeded,
        failed
      });

      return {
        processed: failedNotifications.length,
        succeeded,
        failed
      };

    } catch (error) {
      logger.error('Failed to retry notifications', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return { processed: 0, succeeded: 0, failed: 0 };
    }
  }

  /**
   * Send notifications to device tokens (internal method)
   */
  private async sendToDeviceTokens(
    deviceTokens: any[],
    payload: NotificationPayload,
    notificationLogId: string
  ): Promise<Omit<NotificationResult, 'notificationLogId'>> {
    try {
      const fcm = getFCM();
      if (!fcm) {
        throw new Error('FCM not available');
      }

      const tokens = deviceTokens.map(dt => dt.token);
      const batchSize = FIREBASE_CONFIG.BATCH_SIZE;
      
      let totalSent = 0;
      let totalFailed = 0;
      const errors: string[] = [];
      const invalidTokens: string[] = [];

      // Process tokens in batches
      for (let i = 0; i < tokens.length; i += batchSize) {
        const batch = tokens.slice(i, i + batchSize);
        
        try {
          const message = this.buildFCMMessage(payload, batch);
          const response = await fcm.sendEachForMulticast(message);
          
          totalSent += response.successCount;
          totalFailed += response.failureCount;

          // Handle failed tokens
          response.responses.forEach((resp, index) => {
            if (!resp.success && resp.error) {
              const error = resp.error;
              if (error.code === 'messaging/registration-token-not-registered' || 
                  error.code === 'messaging/invalid-registration-token') {
                invalidTokens.push(batch[index]);
              }
              errors.push(`Token ${index}: ${error.message}`);
            }
          });

        } catch (error) {
          totalFailed += batch.length;
          errors.push(`Batch error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Deactivate invalid tokens
      if (invalidTokens.length > 0) {
        await deviceTokenService.deactivateTokens(invalidTokens);
      }

      return {
        success: totalSent > 0,
        totalTargets: tokens.length,
        sentCount: totalSent,
        failedCount: totalFailed,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      return {
        success: false,
        totalTargets: deviceTokens.length,
        sentCount: 0,
        failedCount: deviceTokens.length,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Build FCM message from payload
   */
  private buildFCMMessage(payload: NotificationPayload, tokens: string[]) {
    const priority = this.getFCMPriority(payload.priority || NotificationPriority.NORMAL);
    
    return {
      tokens,
      notification: {
        title: payload.title,
        body: payload.body,
        imageUrl: payload.imageUrl
      },
      data: payload.data || {},
      webpush: {
        fcmOptions: {
          link: payload.clickAction
        },
        notification: {
          icon: '/icons/icon-192x192.png', // Default icon
          badge: payload.badge?.toString(),
          requireInteraction: payload.priority === NotificationPriority.URGENT,
          silent: payload.priority === NotificationPriority.LOW
        }
      },
      android: {
        priority: priority.android,
        ttl: payload.ttl || priority.ttl,
        notification: {
          sound: payload.sound || 'default',
          clickAction: payload.clickAction
        }
      },
      apns: {
        headers: {
          'apns-priority': priority.apns
        },
        payload: {
          aps: {
            badge: payload.badge,
            sound: payload.sound || 'default'
          }
        }
      }
    };
  }

  /**
   * Get FCM priority settings based on notification priority
   */
  private getFCMPriority(priority: NotificationPriority) {
    switch (priority) {
      case NotificationPriority.URGENT:
        return { android: 'high' as const, apns: '10', ttl: 3600 }; // 1 hour
      case NotificationPriority.NORMAL:
        return { android: 'normal' as const, apns: '5', ttl: 86400 }; // 24 hours
      case NotificationPriority.LOW:
        return { android: 'normal' as const, apns: '1', ttl: 604800 }; // 7 days
      default:
        return { android: 'normal' as const, apns: '5', ttl: 86400 };
    }
  }

  /**
   * Calculate notification expiration based on priority
   */
  private calculateExpiration(priority: NotificationPriority): Date {
    const now = new Date();
    const priorities = this.getFCMPriority(priority);
    return new Date(now.getTime() + (priorities.ttl * 1000));
  }

  /**
   * Simulate notification for development (when Firebase is not available)
   */
  private async simulateNotification(userId: string, payload: NotificationPayload): Promise<NotificationResult> {
    logger.info('SIMULATED NOTIFICATION', {
      userId,
      title: payload.title,
      body: payload.body,
      priority: payload.priority,
      data: payload.data
    });

    return {
      success: true,
      notificationLogId: 'simulated-' + Date.now(),
      totalTargets: 1,
      sentCount: 1,
      failedCount: 0
    };
  }
}

export const notificationService = new NotificationService();