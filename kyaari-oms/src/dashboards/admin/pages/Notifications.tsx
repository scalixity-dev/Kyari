import { useState, useMemo, useRef, useEffect } from 'react';
// NotificationSection removed — rendering unified list below
import { Search, Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '../../../components/ui/calendar';
import { format } from 'date-fns';
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
  const [showRead] = useState<boolean>(false); // Always show only unread
  const [selectedType, setSelectedType] = useState<'all' | NotificationType>('all')
  const [dateFrom, setDateFrom] = useState<Date>()
  const [dateTo, setDateTo] = useState<Date>()
  const [showFromCalendar, setShowFromCalendar] = useState(false)
  const [showToCalendar, setShowToCalendar] = useState(false)
  
  const fromCalendarRef = useRef<HTMLDivElement>(null)
  const toCalendarRef = useRef<HTMLDivElement>(null)

  // Close calendars when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fromCalendarRef.current && !fromCalendarRef.current.contains(event.target as Node)) {
        setShowFromCalendar(false)
      }
      if (toCalendarRef.current && !toCalendarRef.current.contains(event.target as Node)) {
        setShowToCalendar(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter notifications based on current filters
  const filteredNotifications = useMemo(() => {
    let filtered = [...notifications];

    // Filter by read status
    if (!showRead) {
      filtered = filtered.filter(n => n.status === 'unread');
    }

    // Filter by type (handled by selectedType below, not here)
    // if (filters.type && filters.type.length > 0) {
    //   filtered = filtered.filter(n => filters.type!.includes(n.type));
    // }

    // Filter by date (on or after selected date)
    if (dateFrom) {
      const filterDate = new Date(dateFrom);
      filterDate.setHours(0, 0, 0, 0); // Start of day
      filtered = filtered.filter(n => {
        const notifDate = new Date(n.timestamp);
        notifDate.setHours(0, 0, 0, 0);
        return notifDate >= filterDate;
      });
    }

    // Filter by end date (on or before end date)
    if (dateTo) {
      const filterEndDate = new Date(dateTo);
      filterEndDate.setHours(23, 59, 59, 999); // End of day
      filtered = filtered.filter(n => {
        const notifDate = new Date(n.timestamp);
        return notifDate <= filterEndDate;
      });
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
  }, [notifications, showRead, dateFrom, dateTo]);

  // (grouping removed — unified list used)

  // (totals removed - not used by simplified controls)

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

  // simplified controls do not use external filter callback

  // mutedVendorIds not used with simplified UI

  return (
  <div className="p-4 sm:p-6 lg:p-8 bg-[var(--color-sharktank-bg)] min-h-[calc(100vh-4rem)] font-sans w-full overflow-x-hidden">
      {/* Page Header */}
      <div className="mb-4 sm:mb-6">
        <h2 className="font-heading text-secondary text-2xl sm:text-3xl lg:text-4xl font-semibold">Notifications</h2>
      </div>

      {/* Notification Controls (custom) */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedType('critical')} className="bg-[#FFEAEA] text-[#BE123C] px-4 py-2 rounded-lg shadow-sm text-sm font-medium">Critical</button>
          <button onClick={() => setSelectedType('info')} className="bg-[#E6F5FF] text-[#0369A1] px-4 py-2 rounded-lg shadow-sm text-sm font-medium">Information</button>
          <button onClick={() => setSelectedType('reminder')} className="bg-[#FFF6E6] text-[#C2410C] px-4 py-2 rounded-lg shadow-sm text-sm font-medium">Reminder</button>
          {mutedVendors.length > 0 && (
            <span className="ml-2 text-sm text-gray-500">Muted: {mutedVendors.length}</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white rounded-lg px-3 py-2 w-64 flex items-center gap-2 border border-gray-200">
            <Search className="w-4 h-4 text-gray-400" />
            <input placeholder="Search notifications..." className="flex-1 text-sm placeholder-gray-400 focus:outline-none bg-transparent" />
          </div>
          
          {/* From Date Calendar */}
          <div className="relative" ref={fromCalendarRef}>
            <button
              type="button"
              onClick={() => {
                setShowFromCalendar(!showFromCalendar)
                setShowToCalendar(false)
              }}
              className="bg-white rounded-lg px-3 py-2 border border-gray-200 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all duration-200 flex items-center justify-between min-w-[140px]"
            >
              <span className={dateFrom ? "text-gray-900" : "text-gray-500"}>
                {dateFrom ? format(dateFrom, "PPP") : "From date"}
              </span>
              <CalendarIcon className="h-4 w-4 text-gray-500 ml-2" />
            </button>
            {showFromCalendar && (
              <div className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-md shadow-lg w-full min-w-[320px]">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={(date) => {
                    setDateFrom(date)
                    setShowFromCalendar(false)
                  }}
                  initialFocus
                  className="w-full"
                />
              </div>
            )}
          </div>

          {/* To Date Calendar */}
          <div className="relative" ref={toCalendarRef}>
            <button
              type="button"
              onClick={() => {
                setShowToCalendar(!showToCalendar)
                setShowFromCalendar(false)
              }}
              className="bg-white rounded-lg px-3 py-2 border border-gray-200 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all duration-200 flex items-center justify-between min-w-[140px]"
            >
              <span className={dateTo ? "text-gray-900" : "text-gray-500"}>
                {dateTo ? format(dateTo, "PPP") : "To date"}
              </span>
              <CalendarIcon className="h-4 w-4 text-gray-500 ml-2" />
            </button>
            {showToCalendar && (
              <div className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-md shadow-lg w-full min-w-[320px] right-0">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={(date) => {
                    setDateTo(date)
                    setShowToCalendar(false)
                  }}
                  initialFocus
                  disabled={(date) => dateFrom ? date < dateFrom : false}
                  className="w-full"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Unified Notification List in a single white container */}
      <div className="bg-white rounded-lg p-4 space-y-3">
        {(() => {
          const displayNotifications = selectedType === 'all'
            ? filteredNotifications
            : filteredNotifications.filter(n => n.type === selectedType)

          const typeBg: Record<string, string> = {
            critical: '#FFF1F2', // very light red
            info: '#F0F9FF', // very light blue
            reminder: '#FFFBEB' // very light yellow
          }

          const typeBorder: Record<string, string> = {
            critical: '#FCA5A5',
            info: '#93C5FD',
            reminder: '#FBBF24'
          }

          return displayNotifications.map(n => (
            <div key={n.id} className="p-3 rounded-md flex items-start justify-between gap-4" style={{ background: typeBg[n.type] || '#F3F4F6', borderLeft: `4px solid ${typeBorder[n.type] || '#E5E7EB'}` }}>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-secondary">{n.title}</h4>
                  <span className="text-sm text-gray-500">{n.timestamp.toLocaleString()}</span>
                </div>
                <p className="text-sm text-gray-700 mt-2">{n.message}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                  {n.vendorName && <span>Vendor: {n.vendorName}</span>}
                  {n.orderId && <span>Order: {n.orderId}</span>}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <button onClick={() => actions.onMarkAsRead(n.id)} className="text-sm bg-white px-3 py-1.5 rounded-md border border-gray-200">Mark read</button>
                {n.canEscalate && (
                  <button onClick={() => actions.onEscalate(n.id, (n.escalationTarget || 'ops') as EscalationTarget)} className="text-sm bg-[var(--color-accent)] text-[var(--color-button-text)] px-3 py-1.5 rounded-md">Escalate</button>
                )}
                {n.vendorId && (
                  <button onClick={() => actions.onMuteVendor(n.vendorId!, n.vendorName || '')} className="text-sm bg-red-50 text-red-600 px-3 py-1.5 rounded-md">Mute vendor</button>
                )}
              </div>
            </div>
          ))
        })()}
      </div>

      {/* Empty State */}
      {filteredNotifications.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8 lg:p-12 text-center">
          <div className="text-gray-400 text-2xl sm:text-3xl lg:text-4xl mb-4">🔔</div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-600 mb-2">No notifications found</h3>
          <p className="text-sm sm:text-base text-gray-500 max-w-md mx-auto leading-relaxed">
            {selectedType !== 'all' ? 
              `No ${selectedType} notifications match your current filters.` :
              'All caught up! No new notifications at this time.'
            }
          </p>
        </div>
      )}
    </div>
  );
}


