import { useState, useEffect, useCallback, useRef } from 'react';
import { onForegroundMessage } from '../services/firebase';
import { notificationService, type Notification, type NotificationStats } from '../services/notifications';

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  stats: NotificationStats | null;
  loading: boolean;
  error: string | null;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  lastUpdate: number;
}

const POLLING_INTERVAL = 30 * 1000; // 30 seconds

export const useNotifications = (): UseNotificationsReturn => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef<boolean>(false);

  const forceUpdate = useCallback(() => {
    setLastUpdate(Date.now());
  }, []);

  const fetchNotifications = useCallback(async (): Promise<void> => {
    try {
      const data = await notificationService.fetchNotifications();
      if (isMountedRef.current) {
        setNotifications(data);
        setError(null);
        forceUpdate();
      }
    } catch (err) {
      console.error('❌ [useNotifications] Error fetching notifications:', err);
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
        forceUpdate();
      }
    }
  }, [forceUpdate]);

  const fetchUnreadCount = useCallback(async (): Promise<void> => {
    try {
      const count = await notificationService.getUnreadCount();
      if (isMountedRef.current) {
        setUnreadCount(count);
        forceUpdate();
      }
    } catch (err) {
      console.error('❌ [useNotifications] Error fetching unread count:', err);
    }
  }, [forceUpdate]);

  const fetchStats = useCallback(async (): Promise<void> => {
    try {
      const statsData = await notificationService.getNotificationStats();
      if (isMountedRef.current) {
        setStats(statsData);
        forceUpdate();
      }
    } catch (err) {
      console.error('❌ [useNotifications] Error fetching stats:', err);
    }
  }, [forceUpdate]);

  const refreshNotifications = useCallback(async (): Promise<void> => {
    setLoading(true);
    
    try {
      await Promise.all([fetchNotifications(), fetchUnreadCount(), fetchStats()]);
    } catch (err) {
      console.error('❌ [useNotifications] Error during refresh:', err);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        forceUpdate();
      }
    }
  }, [fetchNotifications, fetchUnreadCount, fetchStats, forceUpdate]);

  const markAsRead = useCallback(async (notificationId: string): Promise<void> => {
    try {
      await notificationService.markAsRead(notificationId);
      
      if (isMountedRef.current) {
        const readAt = new Date().toISOString();
        setNotifications(prev => prev.map(notif =>
          notif.id === notificationId ? { ...notif, status: 'READ' as const, readAt } : notif
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
        await fetchUnreadCount(); // Refresh from server
        forceUpdate();
      }
    } catch (err) {
      console.error('❌ [useNotifications] Error marking as read:', err);
      throw err;
    }
  }, [fetchUnreadCount, forceUpdate]);

  const markAllAsRead = useCallback(async (): Promise<void> => {
    try {
      await notificationService.markAllAsRead();
      
      if (isMountedRef.current) {
  const readAt = new Date().toISOString();
  setNotifications(prev => prev.map(notif => ({ ...notif, status: 'READ' as const, readAt })));
        setUnreadCount(0);
        forceUpdate();
      }
    } catch (err) {
      console.error('❌ [useNotifications] Error marking all as read:', err);
      throw err;
    }
  }, [forceUpdate]);

  const deleteNotification = useCallback(async (notificationId: string): Promise<void> => {
    try {
      if (isMountedRef.current) {
        const targetNotification = notifications.find(n => n.id === notificationId);
        const wasUnread = !!targetNotification && targetNotification.status !== 'READ' && !targetNotification.readAt;
  setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
        if (wasUnread) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        await fetchUnreadCount(); // Refresh from server
        forceUpdate();
      }
    } catch (err) {
      console.error('❌ [useNotifications] Error deleting notification:', err);
      throw err;
    }
  }, [notifications, fetchUnreadCount, forceUpdate]);

  // Debug state changes
  // Initialize notification system
  useEffect(() => {
  isMountedRef.current = true;
    const initialFetch = async () => {
      try {
        await Promise.all([fetchNotifications(), fetchUnreadCount(), fetchStats()]);
      } catch (err) {
        console.error('❌ [useNotifications] Initial fetch failed:', err);
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
          forceUpdate();
        }
      }
    };
    
    initialFetch();

    // Setup FCM real-time listener
    const unsubscribeFCM = onForegroundMessage((payload) => {
      // Show browser notification
      if (payload.notification) {
        new Notification(payload.notification.title || 'New Notification', {
          body: payload.notification.body,
          icon: '/kyariLogoFavicon.jpg',
        });
      }
      
      // Refresh notifications immediately when FCM message received
      refreshNotifications();
    });

    // Setup polling as backup
    pollingIntervalRef.current = setInterval(() => {
      Promise.all([fetchNotifications(), fetchUnreadCount(), fetchStats()]);
    }, POLLING_INTERVAL);

    return () => {
      isMountedRef.current = false;
      
      if (unsubscribeFCM) {
        unsubscribeFCM();
      }
      
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [fetchNotifications, fetchUnreadCount, fetchStats, refreshNotifications]);

  return {
    notifications,
    unreadCount,
    stats,
    loading,
    error,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    lastUpdate,
  };
};