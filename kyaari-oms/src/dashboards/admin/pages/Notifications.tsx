import { useState, useMemo, useRef, useEffect } from 'react';
// NotificationSection removed — rendering unified list below
import { Search, Calendar as CalendarIcon, Send } from 'lucide-react';
import { Calendar } from '../../../components/ui/calendar';
import { format } from 'date-fns';
import { notificationService } from '../../../services/notifications';
import BroadcastNotification from '../../../components/BroadcastNotification/BroadcastNotification';
import type { 
  Notification as NotificationServiceType
} from '../../../services/notifications';
import type { 
  NotificationActions, 
  NotificationType, 
  EscalationTarget, 
  MutedVendor 
} from '../../../types/notifications';

export default function Notifications() {
  const [notifications, setNotifications] = useState<NotificationServiceType[]>([]);
  const [mutedVendors, setMutedVendors] = useState<MutedVendor[]>([]);
  const [showUnreadOnly, setShowUnreadOnly] = useState<boolean>(false);
  const [selectedType, setSelectedType] = useState<'all' | NotificationType>('all')
  const [dateFrom, setDateFrom] = useState<Date>()
  const [dateTo, setDateTo] = useState<Date>()
  const [showFromCalendar, setShowFromCalendar] = useState(false)
  const [showToCalendar, setShowToCalendar] = useState(false)
  const [showBroadcast, setShowBroadcast] = useState<boolean>(false)
  
  const fromCalendarRef = useRef<HTMLDivElement>(null)
  const toCalendarRef = useRef<HTMLDivElement>(null)

  // Initialize notifications on mount
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        await notificationService.fetchNotifications()
      } catch (error) {
        console.error('Failed to load notifications:', error)
      }
    }

    loadNotifications()

    // Subscribe to notification updates
    const unsubscribe = notificationService.subscribe((updatedNotifications) => {
      setNotifications(updatedNotifications)
    })

    return () => {
      unsubscribe()
    }
  }, [])

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
    if (showUnreadOnly) {
      filtered = filtered.filter(n => n.status !== 'READ');
    }

    // Filter by date (on or after selected date)
    if (dateFrom) {
      const filterDate = new Date(dateFrom);
      filterDate.setHours(0, 0, 0, 0); // Start of day
      filtered = filtered.filter(n => {
        const notifDate = new Date(n.createdAt);
        notifDate.setHours(0, 0, 0, 0);
        return notifDate >= filterDate;
      });
    }

    // Filter by end date (on or before end date)
    if (dateTo) {
      const filterEndDate = new Date(dateTo);
      filterEndDate.setHours(23, 59, 59, 999); // End of day
      filtered = filtered.filter(n => {
        const notifDate = new Date(n.createdAt);
        return notifDate <= filterEndDate;
      });
    }

    // Sort by timestamp (newest first) and then by priority
    filtered.sort((a, b) => {
      // First sort by unread status
      if (a.status !== b.status) {
        return a.status !== 'READ' ? -1 : 1;
      }
      
      // Then by priority
      const priorityOrder = { 'URGENT': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      // Finally by timestamp
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return filtered;
  }, [notifications, showUnreadOnly, dateFrom, dateTo]);

  // (grouping removed — unified list used)

  // (totals removed - not used by simplified controls)

  // Notification actions using the service
  const actions: NotificationActions = {
    onMarkAsRead: async (notificationId: string) => {
      await notificationService.markAsRead(notificationId);
    },
    
    onMarkAllAsRead: async () => {
      await notificationService.markAllAsRead();
    },
    
    onMuteVendor: (vendorId: string, vendorName: string) => {
      const newMutedVendor: MutedVendor = {
        id: vendorId,
        name: vendorName,
        mutedAt: new Date(),
        mutedBy: 'current-admin' // In real app, get from auth context
      };
      setMutedVendors(prev => [...prev, newMutedVendor]);
    },
    
    onUnmuteVendor: (vendorId: string) => {
      setMutedVendors(prev => prev.filter(v => v.id !== vendorId));
    },
    
    onEscalate: (notificationId: string, target: EscalationTarget) => {
      // In a real app, this would make an API call to escalate
      notificationService.markAsRead(notificationId);
      alert(`Notification escalated to ${target.toUpperCase()} team successfully!`);
    }
  };

  // simplified controls do not use external filter callback

  // mutedVendorIds not used with simplified UI

  return (
  <div className="p-4 sm:p-6 lg:p-8 bg-[var(--color-sharktank-bg)] min-h-[calc(100vh-4rem)] font-sans w-full overflow-x-hidden">
      {/* Page Header */}

      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="font-heading text-secondary text-2xl sm:text-3xl lg:text-4xl font-semibold">Notifications</h2>
        <button
          onClick={() => setShowBroadcast(!showBroadcast)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Send size={16} />
          {showBroadcast ? 'Hide Broadcast' : 'Send Broadcast'}
        </button>

      </div>

      {/* Broadcast Notification Panel */}
      {showBroadcast && (
        <div className="mb-6">
          <BroadcastNotification
            onSuccess={() => {
              setShowBroadcast(false);
              // Refresh notifications to potentially show the new broadcast
              notificationService.fetchNotifications();
            }}
            onError={(error) => {
              console.error('Broadcast failed:', error);
              alert(`Failed to send broadcast: ${error}`);
            }}
          />
        </div>
      )}

      {/* Notification Controls (custom) */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSelectedType('all')} 
            className={`px-4 py-2 rounded-lg shadow-sm text-sm font-medium transition-all ${
              selectedType === 'all' 
                ? 'bg-[var(--color-accent)] text-white' 
                : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
            }`}
          >
            All Notifications
          </button>
          <button 
            onClick={() => setSelectedType('critical')} 
            className={`px-4 py-2 rounded-lg shadow-sm text-sm font-medium transition-all ${
              selectedType === 'critical'
                ? 'bg-[#BE123C] text-white'
                : 'bg-[#FFEAEA] text-[#BE123C] hover:bg-[#FFDBDB]'
            }`}
          >
            Critical
          </button>
          <button 
            onClick={() => setSelectedType('info')} 
            className={`px-4 py-2 rounded-lg shadow-sm text-sm font-medium transition-all ${
              selectedType === 'info'
                ? 'bg-[#0369A1] text-white'
                : 'bg-[#E6F5FF] text-[#0369A1] hover:bg-[#D0EBFF]'
            }`}
          >
            Information
          </button>
          <button 
            onClick={() => setSelectedType('reminder')} 
            className={`px-4 py-2 rounded-lg shadow-sm text-sm font-medium transition-all ${
              selectedType === 'reminder'
                ? 'bg-[#C2410C] text-white'
                : 'bg-[#FFF6E6] text-[#C2410C] hover:bg-[#FFEFD0]'
            }`}
          >
            Reminder
          </button>
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

          <button
            type="button"
            onClick={() => setShowUnreadOnly(prev => !prev)}
            className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all duration-200 flex items-center gap-2 ${
              showUnreadOnly
                ? 'bg-[var(--color-secondary)] text-white border-transparent shadow-sm'
                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
            }`}
          >
            {showUnreadOnly ? 'Unread only' : 'All notifications'}
          </button>
        </div>
      </div>

      {/* Unified Notification List in a single white container */}
      <div className="bg-white rounded-lg p-4 space-y-3">
        {(() => {
          // Map notification types to frontend categories for filtering
          const getDisplayType = (notification: NotificationServiceType): string => {
            if (notification.priority === 'URGENT' || notification.priority === 'HIGH') {
              return 'critical';
            } else if (notification.type === 'DISPATCH' || notification.type === 'ASSIGNMENT') {
              return 'reminder';
            } else {
              return 'info';
            }
          };

          const displayNotifications = selectedType === 'all'
            ? filteredNotifications
            : filteredNotifications.filter(n => getDisplayType(n) === selectedType)

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

          return displayNotifications.map(n => {
            const displayType = getDisplayType(n);
            return (
              <div 
                key={n.id} 
                className="p-3 rounded-md flex items-start justify-between gap-4" 
                style={{ 
                  background: typeBg[displayType] || '#F3F4F6', 
                  borderLeft: `4px solid ${typeBorder[displayType] || '#E5E7EB'}` 
                }}
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-secondary">{n.title}</h4>
                    <span className="text-sm text-gray-500">
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mt-2">{n.message}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                    {n.metadata?.vendorId && <span>Vendor: {n.metadata.vendorId}</span>}
                    {n.metadata?.orderId && <span>Order: {n.metadata.orderId}</span>}
                    {n.metadata?.amount && <span>Amount: ₹{n.metadata.amount.toLocaleString()}</span>}
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs">{n.priority}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  {n.status !== 'READ' && (
                    <button 
                      onClick={() => actions.onMarkAsRead(n.id)} 
                      className="text-sm bg-white px-3 py-1.5 rounded-md border border-gray-200"
                    >
                      Mark read
                    </button>
                  )}
                  {n.priority === 'URGENT' && (
                    <button 
                      onClick={() => actions.onEscalate(n.id, 'admin' as EscalationTarget)} 
                      className="text-sm bg-[var(--color-accent)] text-[var(--color-button-text)] px-3 py-1.5 rounded-md"
                    >
                      Escalate
                    </button>
                  )}
                  {n.metadata?.vendorId && (
                    <button 
                      onClick={() => actions.onMuteVendor(n.metadata?.vendorId!, `Vendor ${n.metadata?.vendorId}`)} 
                      className="text-sm bg-red-50 text-red-600 px-3 py-1.5 rounded-md"
                    >
                      Mute vendor
                    </button>
                  )}
                </div>
              </div>
            );
          })
        })()}
      </div>

      {/* Empty State */}
      {filteredNotifications.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8 lg:p-12 text-center">
          <div className="text-gray-400 text-2xl sm:text-3xl lg:text-4xl mb-4">🔔</div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-600 mb-2">No notifications found</h3>
          <p className="text-sm sm:text-base text-gray-500 max-w-md mx-auto leading-relaxed">
            {showUnreadOnly
              ? (selectedType !== 'all'
                  ? `No unread ${selectedType} notifications match your current filters.`
                  : 'All caught up! No unread notifications at this time.')
              : (selectedType !== 'all'
                  ? `No ${selectedType} notifications match your current filters.`
                  : 'All caught up! No notifications at this time.')}
          </p>
        </div>
      )}
    </div>
  );
}


