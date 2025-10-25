import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Package, 
  CheckSquare, 
  AlertTriangle, 
  Clock, 
  Bell, 
  FileText, 
  Eye,
  X
} from 'lucide-react'
import { KPICard } from '../../../components'

interface Notification {
  id: string
  type: 'order' | 'ticket' | 'sla-breach' | 'system'
  message: string
  time: string
  read: boolean
  priority: 'low' | 'medium' | 'high' | 'critical'
  details: string
}

// NotificationItem Component
interface NotificationItemProps {
  id: string
  type: string
  message: string
  time: string
  read: boolean
  priority: string
  details: string
}

const NotificationItem: React.FC<NotificationItemProps> = ({ type, message, time, read }) => {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order': return Package
      case 'ticket': return AlertTriangle
      case 'sla-breach': return Clock
      case 'system': return Bell
      default: return Bell
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'order': return 'text-blue-500'
      case 'ticket': return 'text-orange-500'
      case 'sla-breach': return 'text-red-500'
      case 'system': return 'text-gray-500'
      default: return 'text-gray-500'
    }
  }

  const Icon = getNotificationIcon(type)
  const iconColorClass = getNotificationColor(type)

  return (
    <div className={`flex items-start gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-gray-50 rounded-lg transition-colors ${
      !read ? 'bg-blue-50' : ''
    }`}>
      <div className="flex-shrink-0 mt-1">
        <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${iconColorClass}`} />
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

// NotificationsModal Component
interface NotificationsModalProps {
  isOpen: boolean
  onClose: () => void
  notifications: Notification[]
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

  const unreadCount = notifications.filter(n => !n.read).length

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order': return Package
      case 'ticket': return AlertTriangle
      case 'sla-breach': return Clock
      case 'system': return Bell
      default: return Bell
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'order': return 'text-blue-600 bg-blue-50'
      case 'ticket': return 'text-orange-600 bg-orange-50'
      case 'sla-breach': return 'text-red-600 bg-red-50'
      case 'system': return 'text-gray-600 bg-gray-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500 text-white'
      case 'high': return 'bg-orange-500 text-white'
      case 'medium': return 'bg-yellow-500 text-white'
      case 'low': return 'bg-gray-400 text-white'
      default: return 'bg-gray-400 text-white'
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-heading)]">Notifications</h2>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onMarkAllAsRead}
              className="text-sm text-[var(--color-accent)] hover:underline cursor-pointer"
            >
              Mark all as read
            </button>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 cursor-pointer">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="space-y-3">
            {notifications.map((notification) => {
              const Icon = getNotificationIcon(notification.type)
              const colorClass = getNotificationColor(notification.type)
              const priorityClass = getPriorityColor(notification.priority)

              return (
                <div 
                  key={notification.id}
                  className={`border rounded-lg p-4 cursor-pointer ${
                    notification.read ? 'bg-white border-gray-200' : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg flex-shrink-0 ${colorClass}`}>
                      <Icon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-sm font-semibold text-gray-900">{notification.message}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-semibold ${priorityClass}`}>
                          {notification.priority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{notification.details}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">{notification.time}</p>
                        {!notification.read && (
                          <button
                            onClick={() => onMarkAsRead(notification.id)}
                            className="text-xs text-[var(--color-accent)] hover:underline cursor-pointer"
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// Quick Action Props
interface QuickActionProps {
  title: string
  icon: React.ReactNode
  color: string
  onClick: () => void
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false)
  
  // All notifications with priority and details
  const [allNotifications, setAllNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'order',
      message: 'New Order Received - ORD-2025-001',
      time: '5 mins ago',
      read: false,
      priority: 'high',
      details: 'Order from Fresh Farms needs verification. Contains 15 SKUs totaling ₹12,500.'
    },
    {
      id: '2',
      type: 'ticket',
      message: 'Vendor Resolved Ticket - TKT-456',
      time: '15 mins ago',
      read: false,
      priority: 'medium',
      details: 'Quality Issue ticket marked as resolved by vendor. Awaiting final verification.'
    },
    {
      id: '3',
      type: 'sla-breach',
      message: 'SLA Breach Alert - ORD-2025-002',
      time: '1 hour ago',
      read: true,
      priority: 'critical',
      details: 'Order verification overdue by 2 hours. Immediate action required.'
    },
    {
      id: '4',
      type: 'order',
      message: 'Bulk Orders Received',
      time: '2 hours ago',
      read: true,
      priority: 'medium',
      details: '5 new orders from Delhi Wholesale Market require verification.'
    },
    {
      id: '5',
      type: 'ticket',
      message: 'High Priority Ticket - TKT-789',
      time: '3 hours ago',
      read: true,
      priority: 'high',
      details: 'Payment delay ticket escalated to high priority. Vendor requesting immediate resolution.'
    },
    {
      id: '6',
      type: 'system',
      message: 'System Maintenance Scheduled',
      time: '4 hours ago',
      read: true,
      priority: 'low',
      details: 'Scheduled maintenance on Jan 15, 2025, from 2:00 AM to 4:00 AM IST.'
    }
  ])

  // Mock KPI data
  const kpiData = [
    {
      title: 'Orders Pending Verification',
      value: '23',
      icon: <Clock size={32} />,
      subtitle: 'Require immediate attention'
    },
    {
      title: 'Orders Verified OK',
      value: '156',
      icon: <CheckSquare size={32} />,
      subtitle: 'Successfully processed today'
    },
    {
      title: 'Tickets Raised',
      value: '8',
      icon: <AlertTriangle size={32} />,
      subtitle: '3 pending resolution'
    },
    {
      title: 'Tickets Resolved',
      value: '5',
      icon: <CheckSquare size={32} />,
      subtitle: 'Completed today'
    }
  ]

  // Recent notifications (first 3)
  const recentNotifications = allNotifications.slice(0, 3)

  // Quick actions data
  const quickActions: QuickActionProps[] = [
    {
      title: 'Verify Orders',
      icon: <Eye size={24} />,
      color: 'blue',
      onClick: () => navigate('/operations/received-orders')
    },
    {
      title: 'Manage Tickets',
      icon: <AlertTriangle size={24} />,
      color: 'orange',
      onClick: () => navigate('/operations/tickets')
    },
    {
      title: 'View Reports',
      icon: <FileText size={24} />,
      color: 'green',
      onClick: () => navigate('/operations/reports')
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
      
      {/* KPI Cards */}
      <div className="mb-6 lg:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-heading)] mb-2">Today's Overview</h2>
        <p className="text-sm sm:text-base text-[var(--color-primary)]">
          Monitor daily operations and key performance metrics
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-4 mt-8 sm:mt-12">
          {kpiData.map((kpi, index) => (
            <KPICard
              key={index}
              title={kpi.title}
              value={kpi.value}
              icon={kpi.icon}
              subtitle={kpi.subtitle}
              onClick={
                kpi.title === 'Orders Pending Verification' ? () => navigate('/operations/received-orders') :
                kpi.title === 'Tickets Raised' ? () => navigate('/operations/tickets') :
                undefined
              }
            />
          ))}
        </div>
      </div>

      {/* Quick Insights */}
      <div>
        <div className="grid grid-cols-1 gap-6">
          
          {/* Notifications & Quick Actions Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch">
            {/* Notifications Heading (outside the card) */}
            <div className="lg:col-span-4 mb-0 flex flex-col">
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
                    className="text-sm sm:text-base text-[var(--color-accent)] hover:text-[var(--color-accent)]/80 font-medium cursor-pointer"
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
                        className={`${bgColorClass} text-white p-3 sm:p-4 rounded-xl shadow-md flex flex-col sm:flex-row lg:flex-col items-center justify-center gap-2 sm:gap-3 hover:shadow-lg hover:-translate-y-0.5 transition-all w-full flex-1 lg:flex-none min-h-[80px] sm:min-h-[100px] cursor-pointer`}
                      >
                        <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-lg bg-white/20 flex-shrink-0">
                          {React.isValidElement(action.icon) ? React.cloneElement(action.icon as React.ReactElement<{ size?: number }>, { size: 20 }) : action.icon}
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

      {/* Today's Summary and SLA Status - Side by Side */}
      <div className="mt-6 sm:mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Today's Summary */}
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-semibold text-[var(--color-heading)] mb-4">Today's Summary</h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm sm:text-base text-gray-600">Orders Processed</span>
                <span className="text-base sm:text-lg font-semibold text-gray-900">156</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm sm:text-base text-gray-600">Pending Verification</span>
                <span className="text-base sm:text-lg font-semibold text-orange-600">23</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm sm:text-base text-gray-600">Tickets Resolved</span>
                <span className="text-base sm:text-lg font-semibold text-green-600">5</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm sm:text-base text-gray-600">Active Tickets</span>
                <span className="text-base sm:text-lg font-semibold text-red-600">3</span>
              </div>
            </div>
          </div>

          {/* SLA Status */}
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-semibold text-[var(--color-heading)] mb-4">SLA Status</h3>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm sm:text-base font-medium text-gray-700">Order Verification</span>
                  <span className="text-sm sm:text-base font-semibold text-green-600">92%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm sm:text-base font-medium text-gray-700">Ticket Response</span>
                  <span className="text-sm sm:text-base font-semibold text-yellow-600">78%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm sm:text-base font-medium text-gray-700">Overall Performance</span>
                  <span className="text-sm sm:text-base font-semibold text-blue-600">85%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>
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