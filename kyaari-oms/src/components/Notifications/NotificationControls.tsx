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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h2 className="text-lg sm:text-xl font-bold text-[var(--color-heading)] font-[var(--font-heading)]">
          Notifications Center
        </h2>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            {totalUnread.total} unread notifications
          </div>
        </div>
      </div>

      {/* Quick Actions Row */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-3 sm:gap-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
          <span className="text-sm font-medium text-gray-700">Quick Actions:</span>
          <button
            onClick={() => handleMarkAllAsRead()}
            className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium w-full sm:w-auto"
          >
            <CheckSquare size={14} />
            <span className="whitespace-nowrap">Mark All Read ({totalUnread.total})</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={() => onFilterChange({ ...activeFilters, showRead: !activeFilters.showRead })}
            className={`inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium w-full sm:w-auto ${
              activeFilters.showRead 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {activeFilters.showRead ? <EyeOff size={14} /> : <Eye size={14} />}
            <span className="whitespace-nowrap">{activeFilters.showRead ? 'Hide Read' : 'Show Read'}</span>
          </button>

          {mutedVendors.length > 0 && (
            <button
              onClick={() => setShowMutedVendors(!showMutedVendors)}
              className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium w-full sm:w-auto"
            >
              <VolumeX size={14} />
              <span className="whitespace-nowrap">Muted Vendors ({mutedVendors.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Type Filters */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3 sm:mb-2">
          <Filter size={16} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filter by type:</span>
        </div>
        
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3">
          {(['critical', 'info', 'reminder'] as const).map((type) => {
          const isActive = activeFilters.type?.includes(type);
          const count = totalUnread[type];
          
          return (
            <button
              key={type}
              onClick={() => handleTypeFilter(type)}
              className={`inline-flex items-center justify-center gap-2 px-3 py-2 border rounded-lg transition-colors text-sm font-medium capitalize w-full sm:w-auto ${
                isActive ? getTypeActiveColor(type) : getTypeColor(type)
              }`}
            >
              <span className="whitespace-nowrap">{type} ({count})</span>
              {count > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMarkAllAsRead(type);
                  }}
                  className="ml-1 p-1 rounded hover:bg-white/20 transition-colors"
                  title={`Mark all ${type} as read`}
                >
                  <CheckSquare size={12} />
                </button>
              )}
            </button>
            );
          })}
        </div>
      </div>      {/* Muted Vendors List */}
      {showMutedVendors && mutedVendors.length > 0 && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Muted Vendors</h4>
          <div className="space-y-3">
            {mutedVendors.map((vendor) => (
              <div key={vendor.id} className="flex items-start sm:items-center justify-between py-2 gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{vendor.name}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Muted {new Date(vendor.mutedAt).toLocaleDateString('en-GB')}
                  </div>
                </div>
                <button
                  onClick={() => actions.onUnmuteVendor(vendor.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors flex-shrink-0"
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