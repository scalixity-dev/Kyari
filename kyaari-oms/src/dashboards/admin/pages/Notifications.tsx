import { useState, useMemo } from 'react';
import NotificationControls from '../../../components/Notifications/NotificationControls';
import NotificationSection from '../../../components/Notifications/NotificationSection';
import type { 
  Notification, 
  NotificationActions, 
  NotificationType, 
  EscalationTarget, 
  MutedVendor 
} from '../../../types/notifications';

// Mock data - in a real app this would come from API
const generateMockNotifications = (): Notification[] => [
  {
    id: '1',
    type: 'critical',
    title: 'SLA Breach Alert',
    message: 'Order #ORD-2024-001 has exceeded delivery SLA by 4 hours. Customer escalation expected.',
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    status: 'unread',
    vendorId: 'vendor-1',
    vendorName: 'Fresh Foods Co.',
    orderId: 'ORD-2024-001',
    canEscalate: true,
    escalationTarget: 'ops',
    priority: 'high'
  },
  {
    id: '2',
    type: 'critical',
    title: 'Payment System Error',
    message: 'Multiple payment failures detected. Transaction processing is currently degraded.',
    timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
    status: 'unread',
    canEscalate: true,
    escalationTarget: 'admin',
    priority: 'high'
  },
  {
    id: '3',
    type: 'info',
    title: 'Order Dispatched',
    message: 'Order #ORD-2024-002 has been successfully dispatched and is en route to customer.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    status: 'unread',
    vendorId: 'vendor-2',
    vendorName: 'Green Garden Supplies',
    orderId: 'ORD-2024-002'
  },
  {
    id: '4',
    type: 'info',
    title: 'New Vendor Registration',
    message: 'Organic Farms Ltd. has completed registration and is pending approval.',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    status: 'read',
    vendorId: 'vendor-3',
    vendorName: 'Organic Farms Ltd.'
  },
  {
    id: '5',
    type: 'reminder',
    title: 'Payment Approval Pending',
    message: 'Invoice #INV-2024-015 requires approval. Amount: ₹45,000. Vendor: Fresh Foods Co.',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    status: 'unread',
    vendorId: 'vendor-1',
    vendorName: 'Fresh Foods Co.',
    priority: 'medium'
  },
  {
    id: '6',
    type: 'reminder',
    title: 'Weekly Report Due',
    message: 'Vendor performance report for Week 38 is due tomorrow. 12 vendors pending submission.',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    status: 'unread',
    priority: 'low'
  },
  {
    id: '7',
    type: 'critical',
    title: 'Inventory Critical Low',
    message: 'Tomatoes inventory has reached critical levels (< 5% threshold). Immediate restocking required.',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
    status: 'read',
    vendorId: 'vendor-4',
    vendorName: 'Local Harvest Co.',
    canEscalate: true,
    escalationTarget: 'ops',
    priority: 'high'
  }
];

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>(generateMockNotifications());
  const [mutedVendors, setMutedVendors] = useState<MutedVendor[]>([]);
  const [filters, setFilters] = useState<{
    type?: NotificationType[];
    showRead?: boolean;
  }>({
    showRead: false
  });

  // Filter notifications based on current filters
  const filteredNotifications = useMemo(() => {
    let filtered = [...notifications];

    // Filter by read status
    if (!filters.showRead) {
      filtered = filtered.filter(n => n.status === 'unread');
    }

    // Filter by type
    if (filters.type && filters.type.length > 0) {
      filtered = filtered.filter(n => filters.type!.includes(n.type));
    }

    // Sort by timestamp (newest first) and then by priority
    filtered.sort((a, b) => {
      // First sort by unread status
      if (a.status !== b.status) {
        return a.status === 'unread' ? -1 : 1;
      }
      
      // Then by priority
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority || 'low'];
      const bPriority = priorityOrder[b.priority || 'low'];
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      // Finally by timestamp
      return b.timestamp.getTime() - a.timestamp.getTime();
    });

    return filtered;
  }, [notifications, filters]);

  // Group notifications by type
  const groupedNotifications = useMemo(() => {
    const groups = {
      critical: filteredNotifications.filter(n => n.type === 'critical'),
      info: filteredNotifications.filter(n => n.type === 'info'),
      reminder: filteredNotifications.filter(n => n.type === 'reminder')
    };
    return groups;
  }, [filteredNotifications]);

  // Calculate totals for unread notifications
  const totalUnread = useMemo(() => {
    const unread = notifications.filter(n => n.status === 'unread');
    return {
      critical: unread.filter(n => n.type === 'critical').length,
      info: unread.filter(n => n.type === 'info').length,
      reminder: unread.filter(n => n.type === 'reminder').length,
      total: unread.length
    };
  }, [notifications]);

  // Notification actions
  const actions: NotificationActions = {
    onMarkAsRead: (notificationId: string) => {
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, status: 'read' as const } : n
      ));
    },
    
    onMarkAllAsRead: (type?: NotificationType) => {
      setNotifications(prev => prev.map(n => 
        (!type || n.type === type) && n.status === 'unread' 
          ? { ...n, status: 'read' as const } 
          : n
      ));
    },
    
    onMuteVendor: (vendorId: string, vendorName: string) => {
      const newMutedVendor: MutedVendor = {
        id: vendorId,
        name: vendorName,
        mutedAt: new Date(),
        mutedBy: 'current-admin' // In real app, get from auth context
      };
      setMutedVendors(prev => [...prev, newMutedVendor]);
      
      // Mark all notifications from this vendor as muted
      setNotifications(prev => prev.map(n => 
        n.vendorId === vendorId ? { ...n, status: 'muted' as const } : n
      ));
    },
    
    onUnmuteVendor: (vendorId: string) => {
      setMutedVendors(prev => prev.filter(v => v.id !== vendorId));
      
      // Restore muted notifications to unread
      setNotifications(prev => prev.map(n => 
        n.vendorId === vendorId && n.status === 'muted' 
          ? { ...n, status: 'unread' as const } 
          : n
      ));
    },
    
    onEscalate: (notificationId: string, target: EscalationTarget) => {
      // In a real app, this would make an API call to escalate
      console.log(`Escalating notification ${notificationId} to ${target}`);
      
      // Mark notification as read since it's been handled
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, status: 'read' as const } : n
      ));
      
      // Show success message (in real app, use toast notification)
      alert(`Notification escalated to ${target.toUpperCase()} team successfully!`);
    }
  };

  const handleFilterChange = (newFilters: { type?: NotificationType[]; showRead?: boolean }) => {
    setFilters(newFilters);
  };

  const mutedVendorIds = mutedVendors.map(v => v.id);

  return (
    <div className="p-8 bg-[var(--color-happyplant-bg)] min-h-[calc(100vh-4rem)] font-sans w-full overflow-x-hidden">
      {/* Page Header */}
      <div className="bg-[var(--color-header-bg)] p-8 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] mb-8 border border-[rgba(0,0,0,0.03)]">
        <h1 className="text-4xl font-bold text-[var(--color-heading)] mb-2 font-[var(--font-heading)]">
          Notifications
        </h1>
        <p className="text-lg text-[var(--color-primary)] font-medium">
          Stay updated with critical alerts, information, and reminders
        </p>
      </div>

      {/* Notification Controls */}
      <NotificationControls
        actions={actions}
        mutedVendors={mutedVendors}
        totalUnread={totalUnread}
        onFilterChange={handleFilterChange}
        activeFilters={filters}
      />

      {/* Notification Sections */}
      <div className="space-y-6">
        <NotificationSection
          title="Critical Alerts"
          type="critical"
          notifications={groupedNotifications.critical}
          actions={actions}
          mutedVendorIds={mutedVendorIds}
          onMarkAllAsRead={actions.onMarkAllAsRead}
        />
        
        <NotificationSection
          title="Information"
          type="info"
          notifications={groupedNotifications.info}
          actions={actions}
          mutedVendorIds={mutedVendorIds}
          onMarkAllAsRead={actions.onMarkAllAsRead}
        />
        
        <NotificationSection
          title="Reminders"
          type="reminder"
          notifications={groupedNotifications.reminder}
          actions={actions}
          mutedVendorIds={mutedVendorIds}
          onMarkAllAsRead={actions.onMarkAllAsRead}
        />
      </div>

      {/* Empty State */}
      {filteredNotifications.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-gray-400 text-lg mb-4">🔔</div>
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No notifications found</h3>
          <p className="text-gray-500">
            {filters.type?.length ? 
              `No ${filters.type.join(', ')} notifications match your current filters.` :
              'All caught up! No new notifications at this time.'
            }
          </p>
        </div>
      )}
    </div>
  );
}


