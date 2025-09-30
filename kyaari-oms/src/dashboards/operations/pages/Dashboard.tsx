import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  Package, 
  CheckSquare, 
  AlertTriangle, 
  Clock, 
  Bell, 
  Users, 
  FileText, 
  ChevronUp,
  ChevronRight
} from 'lucide-react'

interface DashboardMetrics {
  ordersPendingVerification: number
  ordersVerifiedOK: number
  ticketsRaised: number
  ticketsResolved: number
  ticketsPending: number
}

interface Notification {
  id: string
  type: 'order' | 'ticket' | 'sla-breach'
  title: string
  message: string
  time: string
  isUnread: boolean
}

const dashboardMetrics: DashboardMetrics = {
  ordersPendingVerification: 23,
  ordersVerifiedOK: 156,
  ticketsRaised: 8,
  ticketsResolved: 5,
  ticketsPending: 3
}

const notifications: Notification[] = [
  {
    id: '1',
    type: 'order',
    title: 'New Order Received',
    message: 'Order ORD-2025-001 from Fresh Farms needs verification',
    time: '5 mins ago',
    isUnread: true
  },
  {
    id: '2',
    type: 'ticket',
    title: 'Vendor Resolved Ticket',
    message: 'Quality Issue ticket TKT-456 marked as resolved by vendor',
    time: '15 mins ago',
    isUnread: true
  },
  {
    id: '3',
    type: 'sla-breach',
    title: 'SLA Breach Alert',
    message: 'Order verification for ORD-2025-002 overdue by 2 hours',
    time: '1 hour ago',
    isUnread: false
  },
  {
    id: '4',
    type: 'order',
    title: 'Bulk Orders Received',
    message: '5 new orders from Delhi Wholesale Market require verification',
    time: '2 hours ago',
    isUnread: false
  },
  {
    id: '5',
    type: 'ticket',
    title: 'High Priority Ticket',
    message: 'Payment delay ticket TKT-789 escalated to high priority',
    time: '3 hours ago',
    isUnread: false
  }
]

interface MetricCardProps {
  title: string
  value: number
  icon: React.ElementType
  color: string
  trend?: number
  description?: string
  linkTo?: string
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, value, icon: Icon, color, trend, description, linkTo 
}) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-white/20 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-medium ${
            trend >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            <ChevronUp size={16} className={trend < 0 ? 'rotate-180' : ''} />
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="mb-2">
        <span className="text-3xl font-bold text-[var(--color-primary)]">
          {value.toLocaleString()}
        </span>
      </div>
      <h3 className="text-sm font-medium text-gray-800 mb-1">{title}</h3>
      {description && (
        <p className="text-xs text-gray-500 mb-3">{description}</p>
      )}
      {linkTo && (
        <Link 
          to={linkTo} 
          className="inline-flex items-center gap-1 text-xs text-[var(--color-accent)] hover:underline"
        >
          View Details <ChevronRight size={12} />
        </Link>
      )}
    </div>
  )
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'order': return Package
    case 'ticket': return AlertTriangle
    case 'sla-breach': return AlertTriangle
    default: return Bell
  }
}

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'order': return 'text-blue-600'
    case 'ticket': return 'text-orange-600'
    case 'sla-breach': return 'text-red-600'
    default: return 'text-gray-600'
  }
}

export default function Dashboard() {
  const [unreadNotifications, setUnreadNotifications] = useState(
    notifications.filter(n => n.isUnread).length
  )

  const handleMarkAllAsRead = () => {
    setUnreadNotifications(0)
    // In a real app, you'd update the notifications in your state management
  }

  return (
    <div className="p-8 bg-[var(--color-happyplant-bg)] min-h-[calc(100vh-4rem)] font-sans w-full overflow-x-hidden">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--color-heading)] mb-2 font-[var(--font-heading)]">
          Operations Dashboard
        </h1>
        <p className="text-[var(--color-primary)]">
          Quick overview of operations activities and pending tasks
        </p>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-[var(--color-heading)] mb-4">Quick Actions</h2>
        <div className="flex gap-4 flex-wrap">
          <Link
            to="/operations/received-orders"
            className="bg-[var(--color-accent)] text-white px-6 py-3 rounded-lg font-medium hover:bg-[var(--color-accent)]/90 transition-colors flex items-center gap-2"
          >
            <Package size={18} />
            Verify Orders
            <ChevronRight size={16} />
          </Link>
          <Link
            to="/operations/tickets"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <AlertTriangle size={18} />
            Manage Tickets
            <ChevronRight size={16} />
          </Link>
          <Link
            to="/operations/reports"
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <FileText size={18} />
            View Reports
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>

      {/* Dashboard Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Orders Pending Verification"
          value={dashboardMetrics.ordersPendingVerification}
          icon={Clock}
          color="bg-orange-500"
          trend={12}
          description="Require immediate attention"
          linkTo="/operations/received-orders"
        />
        
        <MetricCard
          title="Orders Verified OK"
          value={dashboardMetrics.ordersVerifiedOK}
          icon={CheckSquare}
          color="bg-green-500"
          trend={8}
          description="Successfully processed today"
        />
        
        <MetricCard
          title="Tickets Raised"
          value={dashboardMetrics.ticketsRaised}
          icon={AlertTriangle}
          color="bg-red-500"
          trend={-5}
          description="Active issues reported"
          linkTo="/operations/tickets"
        />
        
        <MetricCard
          title="Tickets Status"
          value={dashboardMetrics.ticketsResolved}
          icon={Users}
          color="bg-blue-500"
          description={`${dashboardMetrics.ticketsPending} pending resolution`}
          linkTo="/operations/tickets"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notifications Panel */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-md border border-white/20 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-[var(--color-accent)]" />
                <h3 className="text-lg font-semibold text-[var(--color-heading)]">
                  Recent Notifications
                </h3>
                {unreadNotifications > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {unreadNotifications}
                  </span>
                )}
              </div>
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-[var(--color-accent)] hover:underline"
              >
                Mark all as read
              </button>
            </div>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {notifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type)
                const colorClass = getNotificationColor(notification.type)
                
                return (
                  <div 
                    key={notification.id} 
                    className={`p-4 rounded-lg border-l-4 ${
                      notification.isUnread ? 'bg-blue-50 border-blue-500' : 'bg-gray-50 border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={`w-5 h-5 mt-0.5 ${colorClass}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900 text-sm">
                            {notification.title}
                          </h4>
                          {notification.isUnread && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500">
                          {notification.time}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Activity Summary */}
        <div className="space-y-6">
          {/* Today's Summary */}
          <div className="bg-white rounded-xl shadow-md border border-white/20 p-6">
            <h3 className="text-lg font-semibold text-[var(--color-heading)] mb-4">
              Today's Summary
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Orders Processed</span>
                <span className="font-semibold text-gray-900">
                  {dashboardMetrics.ordersVerifiedOK}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pending Verification</span>
                <span className="font-semibold text-orange-600">
                  {dashboardMetrics.ordersPendingVerification}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Tickets Resolved</span>
                <span className="font-semibold text-green-600">
                  {dashboardMetrics.ticketsResolved}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active Tickets</span>
                <span className="font-semibold text-red-600">
                  {dashboardMetrics.ticketsPending}
                </span>
              </div>
            </div>
          </div>

          {/* SLA Status */}
          <div className="bg-white rounded-xl shadow-md border border-white/20 p-6">
            <h3 className="text-lg font-semibold text-[var(--color-heading)] mb-4">
              SLA Status
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Order Verification</span>
                  <span className="text-sm text-green-600">92%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Ticket Response</span>
                  <span className="text-sm text-yellow-600">78%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Overall Performance</span>
                  <span className="text-sm text-blue-600">85%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}