import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';
import { NotificationStatus } from '@prisma/client';

export class NotificationController {
  /**
   * Get user notifications with filtering and pagination
   * @route GET /api/notifications
   */
  async getUserNotifications(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      // Extract query parameters
      const {
        page = '1',
        limit = '20',
        status,
        priority,
        type,
        startDate,
        endDate
      } = req.query;

      const pageNum = Math.max(1, parseInt(page as string));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit as string))); // Max 100 items per page
      const offset = (pageNum - 1) * limitNum;

      // Build where clause
      const where: any = {
        userId: userId
      };

      // Add status filter
      if (status && typeof status === 'string') {
        const statusArray = status.split(',').map(s => s.trim().toUpperCase());
        where.status = { in: statusArray };
      }

      // Add priority filter
      if (priority && typeof priority === 'string') {
        const priorityArray = priority.split(',').map(p => p.trim().toUpperCase());
        where.priority = { in: priorityArray };
      }

      // Add type filter (from metadata.type)
      if (type && typeof type === 'string') {
        const typeArray = type.split(',').map(t => t.trim());
        where.metadata = {
          path: ['type'],
          in: typeArray
        };
      }

      // Add date range filter
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          where.createdAt.gte = new Date(startDate as string);
        }
        if (endDate) {
          where.createdAt.lte = new Date(endDate as string);
        }
      }

      // Fetch notifications with total count
      const [notifications, totalCount] = await Promise.all([
        prisma.notificationLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limitNum,
          select: {
            id: true,
            title: true,
            body: true,
            priority: true,
            status: true,
            metadata: true,
            createdAt: true,
            sentAt: true
          }
        }),
        prisma.notificationLog.count({ where })
      ]);

      // Transform to frontend format
      const transformedNotifications = notifications.map(notification => {
        const metadata = (notification.metadata as Record<string, unknown>) || {};
        const readAt = typeof metadata.readAt === 'string' ? metadata.readAt : undefined;

        let status: 'SENT' | 'DELIVERED' | 'FAILED' | 'READ';
        if (readAt) {
          status = 'READ';
        } else if (notification.status === NotificationStatus.DELIVERED) {
          status = 'DELIVERED';
        } else if (notification.status === NotificationStatus.FAILED || notification.status === NotificationStatus.EXPIRED) {
          status = 'FAILED';
        } else {
          status = 'SENT';
        }

        return {
          id: notification.id,
          title: notification.title,
          message: notification.body,
          type: (metadata as any)?.type || 'SYSTEM',
          priority: notification.priority,
          status,
          createdAt: notification.createdAt.toISOString(),
          readAt,
          metadata
        };
      });

      // Calculate pagination info
      const totalPages = Math.ceil(totalCount / limitNum);
      const hasNextPage = pageNum < totalPages;
      const hasPrevPage = pageNum > 1;

      res.json({
        success: true,
        data: {
          notifications: transformedNotifications,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: totalCount,
            totalPages,
            hasNextPage,
            hasPrevPage
          }
        }
      });

    } catch (error) {
      logger.error('Failed to fetch user notifications', { error, userId: req.user?.userId });
      res.status(500).json({
        success: false,
        error: 'Failed to fetch notifications'
      });
    }
  }

  /**
   * Mark notification as read by storing readAt timestamp in metadata
   * @route PATCH /api/notifications/:id/read
   */
  async markAsRead(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const notificationId = req.params.id;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      // Find the notification first
      const notification = await prisma.notificationLog.findFirst({
        where: {
          id: notificationId,
          userId: userId
        }
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          error: 'Notification not found'
        });
      }

      // Check if already read
      const currentMetadata = notification.metadata as any || {};
      if (currentMetadata.readAt) {
        return res.json({
          success: true,
          message: 'Notification already read'
        });
      }

      // Update metadata to include readAt timestamp
      const updatedMetadata = {
        ...currentMetadata,
        readAt: new Date().toISOString()
      };

      await prisma.notificationLog.update({
        where: { id: notificationId },
        data: {
          metadata: updatedMetadata
        }
      });

      res.json({
        success: true,
        message: 'Notification marked as read'
      });

    } catch (error) {
      logger.error('Failed to mark notification as read', { 
        error, 
        userId: req.user?.userId, 
        notificationId: req.params.id 
      });
      res.status(500).json({
        success: false,
        error: 'Failed to update notification'
      });
    }
  }

  /**
   * Get unread notification count (notifications without readAt in metadata)
   * @route GET /api/notifications/unread-count
   */
  async getUnreadCount(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      // Get all notifications for user
      const notifications = await prisma.notificationLog.findMany({
        where: { userId },
        select: { metadata: true }
      });

      // Count notifications without readAt in metadata
      const unreadCount = notifications.filter(notification => {
        const metadata = notification.metadata as any || {};
        return !metadata.readAt;
      }).length;

      res.json({
        success: true,
        data: {
          unreadCount
        }
      });

    } catch (error) {
      logger.error('Failed to get unread notification count', { error, userId: req.user?.userId });
      res.status(500).json({
        success: false,
        error: 'Failed to get unread count'
      });
    }
  }

  /**
   * Get notification statistics
   * @route GET /api/notifications/stats
   */
  async getNotificationStats(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      // Get statistics for the user
      const [total, unread, byType, byPriority] = await Promise.all([
        // Total notifications
        prisma.notificationLog.count({
          where: { userId }
        }),
        
        // Unread notifications (without readAt in metadata)
        prisma.notificationLog.findMany({
          where: { userId },
          select: { metadata: true }
        }).then(notifications => 
          notifications.filter(n => !(n.metadata as any)?.readAt).length
        ),

        // Group by type (from metadata)
        prisma.notificationLog.groupBy({
          by: ['metadata'],
          where: { userId },
          _count: true
        }),

        // Group by priority
        prisma.notificationLog.groupBy({
          by: ['priority'],
          where: { userId },
          _count: true
        })
      ]);

      // Transform type statistics
      const typeStats: Record<string, number> = {};
      byType.forEach(item => {
        const type = (item.metadata as any)?.type || 'SYSTEM';
        typeStats[type] = (typeStats[type] || 0) + item._count;
      });

      // Transform priority statistics
      const priorityStats: Record<string, number> = {};
      byPriority.forEach(item => {
        priorityStats[item.priority] = item._count;
      });

      res.json({
        success: true,
        data: {
          total,
          unread,
          byType: typeStats,
          byPriority: priorityStats
        }
      });

    } catch (error) {
      logger.error('Failed to get notification statistics', { error, userId: req.user?.userId });
      res.status(500).json({
        success: false,
        error: 'Failed to get notification statistics'
      });
    }
  }
}

export const notificationController = new NotificationController();