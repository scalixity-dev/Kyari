import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, CheckSquare, AlertTriangle, Wallet, Bell, Eye, FileText, BarChart3, X, Clock } from 'lucide-react'

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
  icon: React.ReactNode
  color: string
  onClick: () => void
}

const KPICard: React.FC<KPICardProps> = ({ title, value, icon, color, subtitle, onClick }) => {
  const borderTopClass = color === 'blue' ? 'border-t-4 border-blue-600' : 
                        color === 'orange' ? 'border-t-4 border-orange-600' : 
                        color === 'green' ? 'border-t-4 border-green-600' : 
                        color === 'red' ? 'border-t-4 border-red-600' : ''
  
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : -1}
      onKeyDown={(e) => { if (onClick && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onClick() } }}
      onClick={onClick}
      className={`bg-white p-6 rounded-xl shadow-md flex items-center gap-4 border border-white/20 relative overflow-hidden ${borderTopClass} ${onClick ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-transform' : ''}`}
    >
      <div className="w-16 h-16 flex items-center justify-center rounded-lg text-3xl text-[var(--color-heading)]">
        {React.isValidElement(icon) ? React.cloneElement(icon as any, { color: 'var(--color-heading)', size: 32 } as any) : icon}
      </div>
      <div className="flex-1">
        <h3 className="text-xs font-semibold text-[var(--color-primary)] uppercase tracking-wide mb-1">{title}</h3>
        <div className="text-2xl font-bold text-[var(--color-primary)] mb-1">{value}</div>
        {subtitle && <div className="text-sm text-gray-400">{subtitle}</div>}
      </div>
    </div>
  )
}

const NotificationItem: React.FC<NotificationProps> = ({ type, message, time, read }) => {
  const getNotificationIcon = () => {
    switch (type) {
      case 'order': return <Package className="w-5 h-5 text-blue-500" />
      case 'po': return <CheckSquare className="w-5 h-5 text-green-500" />
      case 'invoice': return <AlertTriangle className="w-5 h-5 text-red-500" />
      case 'payment': return <Wallet className="w-5 h-5 text-green-600" />
      case 'dispatch': return <BarChart3 className="w-5 h-5 text-orange-500" />
      case 'system': return <AlertTriangle className="w-5 h-5 text-red-500" />
      default: return <Bell className="w-5 h-5 text-gray-500" />
    }
  }

  return (
    <div className={`flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors ${
      !read ? 'bg-blue-50' : ''
    }`}>
      <div className="flex-shrink-0 mt-1">
        {getNotificationIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <p className={`text-sm font-medium ${
            !read ? 'text-[var(--color-heading)]' : 'text-gray-700'
          }`}>
            {message}
          </p>
          {!read && (
            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">{time}</p>
      </div>
    </div>
  )
}

const QuickActionCard: React.FC<QuickActionProps> = ({ title, icon, color, onClick }) => {
  const bgColorClass = color === 'blue' ? 'bg-blue-500 hover:bg-blue-600' :
                      color === 'green' ? 'bg-green-500 hover:bg-green-600' :
                      color === 'orange' ? 'bg-orange-500 hover:bg-orange-600' :
                      'bg-[var(--color-accent)] hover:bg-[var(--color-accent)]/90'

  return (
    <button
      onClick={onClick}
      className={`${bgColorClass} text-white p-6 rounded-xl shadow-md flex flex-col items-center gap-3 hover:shadow-lg hover:-translate-y-1 transition-all w-full`}
    >
      <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-white/20">
        {React.isValidElement(icon) ? React.cloneElement(icon as any, { size: 24 } as any) : icon}
      </div>
      <span className="font-semibold text-sm text-center">{title}</span>
    </button>
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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-[var(--color-accent)]" />
            <h2 className="text-xl font-semibold text-[var(--color-heading)]">All Notifications</h2>
            {unreadCount > 0 && (
              <span className="px-2 py-1 bg-red-500 text-white rounded-full text-xs font-medium">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="px-3 py-1 text-sm text-[var(--color-accent)] hover:bg-blue-50 rounded-lg transition-colors"
              >
                Mark all as read
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Bell className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-gray-500 text-center">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className={`text-sm font-medium ${
                          !notification.read ? 'text-[var(--color-heading)]' : 'text-gray-700'
                        }`}>
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {getPriorityBadge(notification.priority)}
                          {!notification.read && (
                            <button
                              onClick={() => onMarkAsRead(notification.id)}
                              className="text-xs text-[var(--color-accent)] hover:underline"
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>
                      {notification.details && (
                        <p className="text-xs text-gray-600 mb-2">{notification.details}</p>
                      )}
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <p className="text-xs text-gray-500">{notification.time}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600 text-center">
            You have {notifications.length} total notifications
          </p>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false)
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
  
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

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
    <div className="p-8 bg-[var(--color-happyplant-bg)] min-h-[calc(100vh-4rem)] font-sans w-full overflow-x-hidden">
      {/* Header Section */}
      <div className="bg-white p-8 rounded-xl shadow-lg mb-8 border border-gray-200">
        <h1 className="text-4xl font-bold text-[var(--color-heading)] mb-2 font-[var(--font-heading)]">Welcome, Vendor!</h1>
        <p className="text-lg text-[var(--color-primary)] font-medium">{today}</p>
      </div>

      {/* KPI Cards */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-[var(--color-heading)] mb-6 font-[var(--font-heading)]">Today's Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Notifications Section */}
        <div className="bg-white rounded-xl shadow-md border border-white/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-[var(--color-heading)] font-[var(--font-heading)]">Recent Notifications</h3>
            <Bell className="w-5 h-5 text-[var(--color-primary)]" />
          </div>
          <div className="space-y-2">
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
          <div className="mt-4 pt-4 border-t border-gray-100">
            <button 
              onClick={() => setNotificationsModalOpen(true)}
              className="text-sm text-[var(--color-accent)] hover:text-[var(--color-accent)]/80 font-medium"
            >
              View all notifications →
            </button>
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className="bg-white rounded-xl shadow-md border border-white/20 p-6">
          <h3 className="text-xl font-semibold text-[var(--color-heading)] mb-6 font-[var(--font-heading)]">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <QuickActionCard
                key={index}
                title={action.title}
                icon={action.icon}
                color={action.color}
                onClick={action.onClick}
              />
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500 text-center">
              Need help? <button className="text-[var(--color-accent)] hover:text-[var(--color-accent)]/80 font-medium">Contact Support</button>
            </p>
          </div>
        </div>
      </div>

      {/* Status Summary */}
      <div className="bg-white rounded-xl shadow-md border border-white/20 p-6">
        <h3 className="text-xl font-semibold text-[var(--color-heading)] mb-6 font-[var(--font-heading)]">Today's Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">85%</div>
            <div className="text-sm text-gray-500">Order Fulfillment Rate</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">2.3 days</div>
            <div className="text-sm text-gray-500">Avg. Processing Time</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">₹1,25,400</div>
            <div className="text-sm text-gray-500">Total Revenue This Month</div>
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