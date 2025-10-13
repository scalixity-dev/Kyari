import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, CheckSquare, AlertTriangle, Wallet, Bell, Eye, FileText, BarChart3, X, Clock } from 'lucide-react'
// Recharts removed — charts taken out from vendor dashboard

interface KPICardProps {
  title: string
  value: number | string
  icon: React.ReactNode
  color: string
  subtitle?: string
  onClick?: () => void
}

interface NotificationProps {
  id: string
  type: 'order' | 'po' | 'invoice' | 'payment' | 'dispatch' | 'system'
  message: string
  time: string
  read: boolean
  priority: 'high' | 'medium' | 'low'
  details?: string
}

interface QuickActionProps {
  title: string
  icon: React.ReactElement<{ size?: number }>
  color: string
  onClick: () => void
}

const KPICard: React.FC<KPICardProps> = ({ title, value, icon, subtitle, onClick }) => {
  return (
    <div className={`bg-[var(--color-happyplant-bg)] p-4 sm:p-6 pt-8 sm:pt-10 rounded-xl shadow-sm flex flex-col items-center text-center relative ${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all' : ''}`}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : -1}
      onKeyDown={(e) => { if (onClick && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onClick() } }}
      onClick={onClick}
    >
      {/* Circular icon at top center, overlapping the card edge */}
      <div className="absolute -top-5 sm:-top-6 left-1/2 -translate-x-1/2 w-12 h-12 sm:w-16 sm:h-16 bg-[var(--color-accent)] rounded-full p-2 sm:p-3 flex items-center justify-center text-white shadow-md">
        {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<{ color?: string; size?: number; strokeWidth?: number }>, { color: 'white', size: 24, strokeWidth: 2 }) : icon}
      </div>
      
      {/* Card content */}
      <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-1 px-2">{title}</h3>
      <div className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{value}</div>
      {subtitle && <div className="text-xs sm:text-sm text-gray-600 mt-1 px-2">{subtitle}</div>}
    </div>
  )
}

const NotificationItem: React.FC<NotificationProps> = ({ type, message, time, read }) => {
  const getNotificationIcon = () => {
    switch (type) {
      case 'order': return <Package className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
      case 'po': return <CheckSquare className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
      case 'invoice': return <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
      case 'payment': return <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
      case 'dispatch': return <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
      case 'system': return <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
      default: return <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
    }
  }

  return (
    <div className={`flex items-start gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-gray-50 rounded-lg transition-colors ${
      !read ? 'bg-blue-50' : ''
    }`}>
      <div className="flex-shrink-0 mt-1">
        {getNotificationIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <p className={`text-sm sm:text-base font-medium leading-tight ${
            !read ? 'text-[var(--color-heading)]' : 'text-gray-700'
          }`}>
            {message}
          </p>
          {!read && (
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-1">{time}</p>
      </div>
    </div>
  )
}



interface NotificationsModalProps {
  isOpen: boolean
  onClose: () => void
  notifications: NotificationProps[]
  onMarkAsRead: (id: string) => void
  onMarkAllAsRead: () => void
}

const NotificationsModal: React.FC<NotificationsModalProps> = ({ 
  isOpen, 
  onClose, 
  notifications, 
  onMarkAsRead, 
  onMarkAllAsRead 
}) => {
  if (!isOpen) return null

  const getNotificationIcon = (type: NotificationProps['type']) => {
    switch (type) {
      case 'order': return <Package className="w-5 h-5 text-blue-500" />
      case 'po': return <CheckSquare className="w-5 h-5 text-green-500" />
      case 'invoice': return <FileText className="w-5 h-5 text-purple-500" />
      case 'payment': return <Wallet className="w-5 h-5 text-green-600" />
      case 'dispatch': return <BarChart3 className="w-5 h-5 text-orange-500" />
      case 'system': return <AlertTriangle className="w-5 h-5 text-red-500" />
      default: return <Bell className="w-5 h-5 text-gray-500" />
    }
  }

  const getPriorityBadge = (priority: NotificationProps['priority']) => {
    switch (priority) {
      case 'high':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">High</span>
      case 'medium':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">Medium</span>
      case 'low':
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">Low</span>
      default:
        return null
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-xl w-full max-w-2xl md:max-w-3xl max-h-[90vh] sm:max-h-[85vh] flex flex-col animate-slide-up sm:animate-none">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white z-10 rounded-t-2xl sm:rounded-t-xl">
          <div className="flex items-center justify-between w-full sm:w-auto">
            <div className="flex items-center gap-2 sm:gap-3">
              <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--color-accent)] flex-shrink-0" />
              <h2 className="text-base sm:text-lg md:text-xl font-semibold text-[var(--color-heading)]">All Notifications</h2>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 sm:py-1 bg-red-500 text-white rounded-full text-xs font-medium flex-shrink-0">
                  {unreadCount} new
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors sm:hidden"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <div className="flex items-center justify-between w-full sm:w-auto gap-2">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-[var(--color-accent)] hover:bg-blue-50 rounded-lg transition-colors flex-1 sm:flex-none font-medium"
              >
                Mark all as read
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors hidden sm:block"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
              <Bell className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mb-3 sm:mb-4" />
              <p className="text-gray-500 text-center text-sm sm:text-base">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 sm:p-4 hover:bg-gray-50 transition-colors ${
                    !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="flex-shrink-0 mt-0.5 sm:mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col gap-1.5 sm:gap-2 mb-2">
                        <p className={`text-sm sm:text-base font-medium leading-tight ${
                          !notification.read ? 'text-[var(--color-heading)]' : 'text-gray-700'
                        }`}>
                          {notification.message}
                        </p>
                        {notification.details && (
                          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{notification.details}</p>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <Clock className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          <p className="text-xs text-gray-500">{notification.time}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {getPriorityBadge(notification.priority)}
                          {!notification.read && (
                            <button
                              onClick={() => onMarkAsRead(notification.id)}
                              className="px-2.5 sm:px-3 py-1 text-xs text-[var(--color-accent)] hover:bg-blue-50 rounded-lg transition-colors whitespace-nowrap"
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-gray-200 bg-gray-50 sticky bottom-0">
          <p className="text-xs sm:text-sm text-gray-600 text-center">
            You have {notifications.length} total notification{notifications.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false)
  // chart state removed
  const [allNotifications, setAllNotifications] = useState<NotificationProps[]>([
    {
      id: '1',
      type: 'order',
      message: 'New Order Assigned - ORD-12345',
      time: '2 hours ago',
      read: false,
      priority: 'high',
      details: 'Organic vegetables worth ₹5,200. Delivery required by tomorrow.'
    },
    {
      id: '2',
      type: 'po',
      message: 'PO Ready for Order ORD-12340',
      time: '4 hours ago',
      read: false,
      priority: 'medium',
      details: 'Purchase Order PO-2025-001 has been generated and is ready for processing.'
    },
    {
      id: '3',
      type: 'invoice',
      message: 'Invoice Rejected - INV-8901',
      time: '1 day ago',
      read: true,
      priority: 'high',
      details: 'Invoice rejected due to quantity mismatch. Please resubmit with correct quantities.'
    },
    {
      id: '4',
      type: 'payment',
      message: 'Payment Released - ₹12,400',
      time: '2 days ago',
      read: true,
      priority: 'medium',
      details: 'Payment for Invoice INV-8895 has been processed and credited to your account.'
    },
    {
      id: '5',
      type: 'dispatch',
      message: 'Dispatch Confirmation Required',
      time: '3 days ago',
      read: false,
      priority: 'medium',
      details: 'Order ORD-12330 is ready for dispatch. Please confirm pickup arrangements.'
    },
    {
      id: '6',
      type: 'system',
      message: 'System Maintenance Scheduled',
      time: '1 week ago',
      read: true,
      priority: 'low',
      details: 'Scheduled maintenance on Oct 5, 2025, from 2:00 AM to 4:00 AM IST.'
    },
    {
      id: '7',
      type: 'order',
      message: 'Order Delivered Successfully - ORD-12320',
      time: '1 week ago',
      read: true,
      priority: 'low',
      details: 'Order has been delivered and verified by the store operator.'
    },
    {
      id: '8',
      type: 'invoice',
      message: 'Invoice Approved - INV-8890',
      time: '2 weeks ago',
      read: true,
      priority: 'medium',
      details: 'Invoice has been approved and payment processing initiated.'
    }
  ])
  
  // fulfillmentDataSets removed
  
  // Mock KPI data
  const kpiData = [
    {
      title: 'Pending Orders',
      value: '12',
      icon: <Package size={32} />,
      color: 'orange',
      subtitle: 'Awaiting confirmation'
    },
    {
      title: 'Orders Confirmed Today',
      value: '8',
      icon: <CheckSquare size={32} />,
      color: 'green',
      subtitle: 'Ready for dispatch'
    },
    {
      title: 'Dispatches Pending',
      value: '5',
      icon: <BarChart3 size={32} />,
      color: 'blue',
      subtitle: 'Awaiting pickup'
    },
    {
      title: 'Payments Pending',
      value: '₹45,600',
      icon: <Wallet size={32} />,
      color: 'red',
      subtitle: '3 invoices'
    }
  ]

  // taskData removed — Actions Required Today section eliminated

  // Recent notifications (first 3)
  const recentNotifications = allNotifications.slice(0, 3)

  // Quick actions data
  const quickActions: QuickActionProps[] = [
    {
      title: 'View Orders',
      icon: <Eye size={24} />,
      color: 'blue',
      onClick: () => navigate('/vendors/orders')
    },
    {
      title: 'Upload Invoice',
      icon: <FileText size={24} />,
      color: 'green',
      onClick: () => navigate('/vendors/invoices')
    },
    {
      title: 'Mark Dispatch',
      icon: <Package size={24} />,
      color: 'orange',
      onClick: () => navigate('/vendors/dispatch')
    }
  ]

  const handleMarkAsRead = (id: string) => {
    setAllNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    )
  }

  const handleMarkAllAsRead = () => {
    setAllNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    )
  }

  return (
    <div className="py-4 px-4 sm:px-6 md:px-8 lg:px-9 sm:py-6 lg:py-8 min-h-[calc(100vh-4rem)] font-sans w-full overflow-x-hidden" style={{ background: 'var(--color-sharktank-bg)' }}>
      
      {/* Actions section removed — KPI cards follow directly */}

      {/* KPI Cards */}
      <div className="mb-6 lg:mb-8">
        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-[var(--color-heading)] mb-4 sm:mb-6 font-[var(--font-heading)]">Today's Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-4 mt-8">
          {kpiData.map((kpi, index) => (
            <KPICard
              key={index}
              title={kpi.title}
              value={kpi.value}
              icon={kpi.icon}
              color={kpi.color}
              subtitle={kpi.subtitle}
              onClick={
                kpi.title === 'Pending Orders' ? () => navigate('/vendors/orders') :
                kpi.title === 'Dispatches Pending' ? () => navigate('/vendors/dispatch') :
                kpi.title === 'Payments Pending' ? () => navigate('/vendors/invoices') : undefined
              }
            />
          ))}
        </div>
      </div>

      {/* Quick Insights */}
      <div>
        <div className="grid grid-cols-1 gap-6">
          
          {/* Order Status & Fulfillment charts removed */}

          {/* Notifications & Quick Actions Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {/* Notifications Heading (outside the card) */}
            <div className="lg:col-span-2 mb-0 flex flex-col">
              <h3 className="text-lg sm:text-xl font-semibold text-[var(--color-heading)] font-[var(--font-heading)] mb-3">Recent Notification</h3>

              <div className="bg-white rounded-xl shadow-md border border-white/20 p-3 sm:p-4 md:p-5 flex-1 flex flex-col overflow-hidden">
                <div className="space-y-1 sm:space-y-2 overflow-y-auto max-h-[400px] sm:max-h-none">
                  {recentNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      id={notification.id}
                      type={notification.type}
                      message={notification.message}
                      time={notification.time}
                      read={notification.read}
                      priority={notification.priority}
                      details={notification.details}
                    />
                  ))}
                </div>
                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100">
                  <button 
                    onClick={() => setNotificationsModalOpen(true)}
                    className="text-sm sm:text-base text-[var(--color-accent)] hover:text-[var(--color-accent)]/80 font-medium"
                  >
                    View all notifications →
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Actions Heading (outside the card) */}
            <div className="flex flex-col justify-between">
              <h3 className="text-lg sm:text-xl font-semibold text-[var(--color-heading)] font-[var(--font-heading)] mb-3">Quick Action</h3>

              <div className="h-full flex flex-col justify-start gap-3">
                <div className="flex flex-row lg:flex-col items-stretch gap-3">
                  {quickActions.map((action, index) => {
                    const bgColorClass = action.color === 'blue' ? 'bg-blue-500 hover:bg-blue-600' :
                                         action.color === 'green' ? 'bg-green-500 hover:bg-green-600' :
                                         action.color === 'orange' ? 'bg-orange-500 hover:bg-orange-600' :
                                         'bg-[var(--color-accent)] hover:bg-[var(--color-accent)]/90'

                    return (
                      <button
                        key={index}
                        onClick={action.onClick}
                        className={`${bgColorClass} text-white p-3 sm:p-4 rounded-xl shadow-md flex flex-col sm:flex-row lg:flex-col items-center justify-center gap-2 sm:gap-3 hover:shadow-lg hover:-translate-y-0.5 transition-all w-full flex-1 lg:flex-none min-h-[80px] sm:min-h-[100px]`}
                      >
                        <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-lg bg-white/20 flex-shrink-0">
                          {React.isValidElement(action.icon) ? React.cloneElement(action.icon as React.ReactElement<any>, { size: 20 }) : action.icon}
                        </div>
                        <span className="font-semibold text-xs sm:text-sm text-center leading-tight">{action.title}</span>
                      </button>
                    )
                  })}

                
                </div>

                
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Total Summary */}
      <div className="mt-6 sm:mt-8">
        <h3 className="text-lg sm:text-xl font-semibold text-[var(--color-heading)] mb-3">Total Summary</h3>
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex-1 bg-white/0 p-3 sm:p-4 rounded-md text-center border-b sm:border-b-0 sm:border-r border-gray-100">
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600">85%</div>
              <div className="text-xs sm:text-sm text-gray-500 mt-1">Order Fulfillment Rate</div>
            </div>

            <div className="flex-1 bg-white/0 p-3 sm:p-4 rounded-md text-center border-b sm:border-b-0 sm:border-r border-gray-100">
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600">2.3 days</div>
              <div className="text-xs sm:text-sm text-gray-500 mt-1">Avg. Processing Time</div>
            </div>

            <div className="flex-1 bg-white/0 p-3 sm:p-4 rounded-md text-center">
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-orange-600">₹1,25,400</div>
              <div className="text-xs sm:text-sm text-gray-500 mt-1">Total Revenue This Month</div>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications Modal */}
      <NotificationsModal
        isOpen={notificationsModalOpen}
        onClose={() => setNotificationsModalOpen(false)}
        notifications={allNotifications}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
      />
    </div>
  )
}