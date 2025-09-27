// Notification types and interfaces for the Admin Notifications page

export type NotificationType = 'critical' | 'info' | 'reminder';
export type NotificationStatus = 'unread' | 'read' | 'muted';
export type EscalationTarget = 'ops' | 'admin';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  status: NotificationStatus;
  vendorId?: string;
  vendorName?: string;
  orderId?: string;
  canEscalate?: boolean;
  escalationTarget?: EscalationTarget;
  priority?: 'low' | 'medium' | 'high';
  metadata?: Record<string, any>;
}

export interface NotificationFilters {
  type?: NotificationType[];
  status?: NotificationStatus[];
  vendor?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface NotificationActions {
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: (type?: NotificationType) => void;
  onMuteVendor: (vendorId: string, vendorName: string) => void;
  onEscalate: (notificationId: string, target: EscalationTarget) => void;
  onUnmuteVendor: (vendorId: string) => void;
}

export interface MutedVendor {
  id: string;
  name: string;
  mutedAt: Date;
  mutedBy: string;
}