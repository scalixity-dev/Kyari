// Frontend Notification Service
// Handles fetching notifications from backend API and real-time updates

import api from './api';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'DISPATCH' | 'ASSIGNMENT' | 'PAYMENT' | 'INVOICE' | 'BROADCAST' | 'SYSTEM';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  createdAt: string;
  readAt?: string;
  metadata?: {
    orderId?: string;
    vendorId?: string;
    amount?: number;
    url?: string;
    [key: string]: any;
  };
}

export interface NotificationFilters {
  type?: string[];
  priority?: string[];
  status?: string[];
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
}

class NotificationService {
  private static instance: NotificationService;
  private listeners: Set<(notifications: Notification[]) => void> = new Set();
  private notifications: Notification[] = [];
  private unreadCount: number = 0;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  subscribe(callback: (notifications: Notification[]) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback(this.notifications));
  }

  async fetchNotifications(filters?: NotificationFilters): Promise<Notification[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters?.type?.length) {
        params.append('type', filters.type.join(','));
      }
      if (filters?.priority?.length) {
        params.append('priority', filters.priority.join(','));
      }
      if (filters?.status?.length) {
        params.append('status', filters.status.join(','));
      }
      if (filters?.startDate) {
        params.append('startDate', filters.startDate);
      }
      if (filters?.endDate) {
        params.append('endDate', filters.endDate);
      }
      if (filters?.limit) {
        params.append('limit', filters.limit.toString());
      }
      if (filters?.offset) {
        params.append('offset', filters.offset.toString());
      }

      const queryString = params.toString();
      const url = `/api/notifications${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get(url);
      
      if (response.data.success) {
        this.notifications = response.data.data.notifications;
        this.unreadCount = this.notifications.filter(n => !n.readAt).length;
        this.notifyListeners();
        return this.notifications;
      } else {
        console.error('❌ [Notifications] API returned error:', response.data.error);
        return [];
      }
      
    } catch (error) {
      console.error('❌ [Notifications] Failed to fetch notifications:', error);
      if (error instanceof Error) {
        console.error('❌ [Notifications] Error details:', {
          message: error.message,
          stack: error.stack
        });
      }
      
      // Always return empty array if API fails - no mock data fallback
      this.notifications = [];
      this.unreadCount = 0;
      this.notifyListeners();
      return [];
    }
  }

  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const response = await api.patch(`/api/notifications/${notificationId}/read`);
      
      if (response.data.success) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification && !notification.readAt) {
          notification.readAt = new Date().toISOString();
          notification.status = 'READ';
          this.unreadCount = Math.max(0, this.unreadCount - 1);
          this.notifyListeners();
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read, optionally filtered by type
   */
  async markAllAsRead(type?: string): Promise<boolean> {
    try {
      // Filter notifications to mark as read
      const notificationsToMark = this.notifications.filter(n => 
        !n.readAt && (type ? n.type === type : true)
      );

      if (notificationsToMark.length === 0) {
        return true; // Nothing to mark
      }

      // Mark each notification as read
      const promises = notificationsToMark.map(notification => 
        api.patch(`/api/notifications/${notification.id}/read`)
      );

      const results = await Promise.allSettled(promises);
      
      // Count successful operations
      let successCount = 0;
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.data.success) {
          const notification = notificationsToMark[index];
          notification.readAt = new Date().toISOString();
          notification.status = 'READ';
          successCount++;
        }
      });

      // Update unread count
      this.unreadCount = Math.max(0, this.unreadCount - successCount);
      this.notifyListeners();

      return successCount === notificationsToMark.length;
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      return false;
    }
  }

  async getUnreadCount(): Promise<number> {
    try {
      const response = await api.get('/api/notifications/unread-count');
      
      if (response.data.success) {
        this.unreadCount = response.data.data.unreadCount;
        return this.unreadCount;
      }
      return 0;
    } catch (error) {
      console.error('❌ [Notifications] Failed to fetch unread count:', error);
      return 0;
    }
  }

  async getNotificationStats(): Promise<NotificationStats | null> {
    try {
      const response = await api.get('/api/notifications/stats');
      
      if (response.data.success) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('❌ [Notifications] Failed to fetch notification stats:', error);
      return null;
    }
  }

  getNotifications(): Notification[] {
    return this.notifications;
  }

  getCachedUnreadCount(): number {
    return this.unreadCount;
  }

  async refresh(): Promise<void> {
    await this.fetchNotifications();
  }
}

export const notificationService = NotificationService.getInstance();
