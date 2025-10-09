import React from 'react';
import { AlertTriangle, Info, Clock } from 'lucide-react';
import NotificationItem from './NotificationItem';
import type { Notification, NotificationActions, NotificationType } from '../../types/notifications';

interface NotificationSectionProps {
  title: string;
  type: NotificationType;
  notifications: Notification[];
  actions: NotificationActions;
  mutedVendorIds: string[];
  onMarkAllAsRead: (type: NotificationType) => void;
}

export const NotificationSection: React.FC<NotificationSectionProps> = ({
  title,
  type,
  notifications,
  actions,
  mutedVendorIds,
  onMarkAllAsRead
}) => {
  const getIcon = () => {
    switch (type) {
      case 'critical':
        return <AlertTriangle size={20} className="text-red-600" />;
      case 'info':
        return <Info size={20} className="text-blue-600" />;
      case 'reminder':
        return <Clock size={20} className="text-orange-600" />;
    }
  };

  const getHeaderStyle = () => {
    switch (type) {
      case 'critical':
        return 'bg-red-50 border-red-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      case 'reminder':
        return 'bg-orange-50 border-orange-200';
    }
  };

  const unreadCount = notifications.filter(n => n.status === 'unread').length;
  const hasNotifications = notifications.length > 0;

  if (!hasNotifications) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border-b gap-3 ${getHeaderStyle()}`}>
          <div className="flex items-center gap-2 sm:gap-3">
            {getIcon()}
            <h3 className="text-base sm:text-lg font-semibold text-[var(--color-heading)]">{title}</h3>
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs sm:text-sm rounded-full">
              0
            </span>
          </div>
        </div>
        <div className="p-6 sm:p-8 text-center text-gray-500">
          <div className="mb-2 text-sm sm:text-base">No {type} notifications</div>
          <div className="text-xs sm:text-sm">You're all caught up! 🎉</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      {/* Section Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border-b gap-3 ${getHeaderStyle()}`}>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {getIcon()}
          <h3 className="text-base sm:text-lg font-semibold text-[var(--color-heading)]">{title}</h3>
          <span className="px-2 py-1 bg-white text-gray-600 text-xs sm:text-sm rounded-full border">
            {notifications.length}
          </span>
          {unreadCount > 0 && (
            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs sm:text-sm rounded-full whitespace-nowrap">
              {unreadCount} new
            </span>
          )}
        </div>
        
        {unreadCount > 0 && (
          <button
            onClick={() => onMarkAllAsRead(type)}
            className="px-3 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium w-full sm:w-auto"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="p-3 sm:p-4 space-y-3">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            actions={actions}
            isMuted={notification.vendorId ? mutedVendorIds.includes(notification.vendorId) : false}
          />
        ))}
      </div>
    </div>
  );
};

export default NotificationSection;