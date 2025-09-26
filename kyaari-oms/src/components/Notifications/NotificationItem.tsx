import React from 'react';
import { AlertTriangle, Info, Clock, ChevronUp, Volume2, VolumeX } from 'lucide-react';
import type { Notification, NotificationActions, EscalationTarget } from '../../types/notifications';

interface NotificationItemProps {
  notification: Notification;
  actions: NotificationActions;
  isMuted?: boolean;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({ 
  notification, 
  actions, 
  isMuted = false 
}) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'critical':
        return <AlertTriangle size={20} className="text-red-600" />;
      case 'info':
        return <Info size={20} className="text-blue-600" />;
      case 'reminder':
        return <Clock size={20} className="text-orange-600" />;
      default:
        return <Info size={20} className="text-gray-600" />;
    }
  };

  const getBorderColor = () => {
    switch (notification.type) {
      case 'critical':
        return 'border-l-red-500';
      case 'info':
        return 'border-l-blue-500';
      case 'reminder':
        return 'border-l-orange-500';
      default:
        return 'border-l-gray-500';
    }
  };

  const getBackgroundColor = () => {
    if (notification.status === 'read') return 'bg-gray-50';
    if (isMuted) return 'bg-gray-100 opacity-75';
    return 'bg-white';
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (hours > 24) {
      return timestamp.toLocaleDateString();
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return 'Just now';
    }
  };

  const handleEscalate = (target: EscalationTarget) => {
    actions.onEscalate(notification.id, target);
  };

  return (
    <div className={`
      ${getBackgroundColor()} 
      ${getBorderColor()} 
      border-l-4 p-4 rounded-r-lg shadow-sm hover:shadow-md transition-shadow
      ${notification.status === 'unread' ? 'ring-1 ring-blue-200' : ''}
    `}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="mt-0.5">
            {getIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className={`font-semibold text-sm ${
                notification.status === 'unread' ? 'text-[var(--color-heading)]' : 'text-gray-600'
              }`}>
                {notification.title}
              </h4>
              {notification.priority === 'high' && (
                <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                  HIGH
                </span>
              )}
              {isMuted && <VolumeX size={14} className="text-gray-400" />}
            </div>
            
            <p className={`text-sm mb-2 ${
              notification.status === 'unread' ? 'text-[var(--color-primary)]' : 'text-gray-500'
            }`}>
              {notification.message}
            </p>
            
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
              <span>{formatTimestamp(notification.timestamp)}</span>
              {notification.vendorName && (
                <span className="px-2 py-1 bg-gray-100 rounded">
                  Vendor: {notification.vendorName}
                </span>
              )}
              {notification.orderId && (
                <span className="px-2 py-1 bg-gray-100 rounded">
                  Order: #{notification.orderId}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {notification.status === 'unread' && (
            <button
              onClick={() => actions.onMarkAsRead(notification.id)}
              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
            >
              Mark Read
            </button>
          )}
          
          {notification.vendorId && !isMuted && (
            <button
              onClick={() => actions.onMuteVendor(notification.vendorId!, notification.vendorName || 'Unknown')}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              title="Mute this vendor"
            >
              <Volume2 size={16} />
            </button>
          )}
          
          {notification.canEscalate && (
            <div className="relative group">
              <button className="p-1.5 text-orange-500 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors">
                <ChevronUp size={16} />
              </button>
              <div className="absolute right-0 top-8 bg-white border rounded-lg shadow-lg p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                <div className="flex flex-col gap-1 min-w-[120px]">
                  <button
                    onClick={() => handleEscalate('ops')}
                    className="px-3 py-2 text-left text-sm hover:bg-gray-100 rounded"
                  >
                    Escalate to Ops
                  </button>
                  <button
                    onClick={() => handleEscalate('admin')}
                    className="px-3 py-2 text-left text-sm hover:bg-gray-100 rounded"
                  >
                    Escalate to Admin
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;