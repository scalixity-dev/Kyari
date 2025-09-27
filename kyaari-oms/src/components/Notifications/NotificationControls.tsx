import React, { useState } from 'react';
import { CheckSquare, Filter, Eye, EyeOff, VolumeX, X } from 'lucide-react';
import type { NotificationType, NotificationActions, MutedVendor } from '../../types/notifications';

interface NotificationControlsProps {
  actions: NotificationActions;
  mutedVendors: MutedVendor[];
  totalUnread: {
    critical: number;
    info: number;
    reminder: number;
    total: number;
  };
  onFilterChange: (filters: { type?: NotificationType[]; showRead?: boolean }) => void;
  activeFilters: { type?: NotificationType[]; showRead?: boolean };
}

export const NotificationControls: React.FC<NotificationControlsProps> = ({
  actions,
  mutedVendors,
  totalUnread,
  onFilterChange,
  activeFilters
}) => {
  const [showMutedVendors, setShowMutedVendors] = useState(false);

  const handleTypeFilter = (type: NotificationType) => {
    const currentTypes = activeFilters.type || [];
    const newTypes = currentTypes.includes(type) 
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type];
    
    onFilterChange({ 
      ...activeFilters, 
      type: newTypes.length === 0 ? undefined : newTypes 
    });
  };

  const handleMarkAllAsRead = (type?: NotificationType) => {
    actions.onMarkAllAsRead(type);
  };

  const getTypeColor = (type: NotificationType) => {
    switch (type) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'reminder': return 'text-orange-600 bg-orange-50 border-orange-200';
    }
  };

  const getTypeActiveColor = (type: NotificationType) => {
    switch (type) {
      case 'critical': return 'text-white bg-red-600 border-red-600';
      case 'info': return 'text-white bg-blue-600 border-blue-600';
      case 'reminder': return 'text-white bg-orange-600 border-orange-600';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[var(--color-heading)] font-[var(--font-heading)]">
          Notifications Center
        </h2>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            {totalUnread.total} unread notifications
          </div>
        </div>
      </div>

      {/* Quick Actions Row */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Quick Actions:</span>
          <button
            onClick={() => handleMarkAllAsRead()}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
          >
            <CheckSquare size={14} />
            Mark All Read ({totalUnread.total})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onFilterChange({ ...activeFilters, showRead: !activeFilters.showRead })}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium ${
              activeFilters.showRead 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {activeFilters.showRead ? <EyeOff size={14} /> : <Eye size={14} />}
            {activeFilters.showRead ? 'Hide Read' : 'Show Read'}
          </button>
        </div>

        {mutedVendors.length > 0 && (
          <button
            onClick={() => setShowMutedVendors(!showMutedVendors)}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            <VolumeX size={14} />
            Muted Vendors ({mutedVendors.length})
          </button>
        )}
      </div>

      {/* Type Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filter by type:</span>
        </div>
        
        {(['critical', 'info', 'reminder'] as const).map((type) => {
          const isActive = activeFilters.type?.includes(type);
          const count = totalUnread[type];
          
          return (
            <button
              key={type}
              onClick={() => handleTypeFilter(type)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 border rounded-lg transition-colors text-sm font-medium capitalize ${
                isActive ? getTypeActiveColor(type) : getTypeColor(type)
              }`}
            >
              {type} ({count})
              {count > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMarkAllAsRead(type);
                  }}
                  className="ml-1 p-0.5 rounded hover:bg-white/20"
                  title={`Mark all ${type} as read`}
                >
                  <CheckSquare size={12} />
                </button>
              )}
            </button>
          );
        })}
      </div>

      {/* Muted Vendors List */}
      {showMutedVendors && mutedVendors.length > 0 && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Muted Vendors</h4>
          <div className="space-y-2">
            {mutedVendors.map((vendor) => (
              <div key={vendor.id} className="flex items-center justify-between py-2">
                <div>
                  <span className="text-sm font-medium text-gray-900">{vendor.name}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    Muted {new Date(vendor.mutedAt).toLocaleDateString()}
                  </span>
                </div>
                <button
                  onClick={() => actions.onUnmuteVendor(vendor.id)}
                  className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Unmute vendor"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationControls;