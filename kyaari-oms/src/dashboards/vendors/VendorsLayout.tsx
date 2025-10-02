import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../auth/AuthProvider'
import type { LucideIcon } from 'lucide-react'
import { LayoutDashboard, Package, FileText, Bell, BarChart3, Users, Search, Wallet, X, Clock, CheckSquare } from 'lucide-react'

type NotificationType = 'order' | 'invoice' | 'dispatch' | 'performance' | 'payment'

interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: Date
  isRead: boolean
  action?: {
    label: string
    path: string
  }
}

type NavItem = {
  to: string
  icon: LucideIcon
  label: string
}

const navItems: NavItem[] = [
  { to: '/vendors', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/vendors/orders', icon: Package, label: 'Orders' },
  { to: '/vendors/invoices', icon: FileText, label: 'Invoices' },
  { to: '/vendors/dispatch', icon: Wallet, label: 'Dispatch' },
  { to: '/vendors/performance', icon: BarChart3, label: 'Performance' },
  { to: '/vendors/profile-settings', icon: Users, label: 'Profile Settings' }
]

// Vendor-specific sample notifications
const sampleNotifications: Notification[] = [
  {
    id: '1',
    type: 'order',
    title: 'New Order Assigned',
    message: 'Order #ORD-2025-025 for ₹45,000 has been assigned to you',
    timestamp: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
    isRead: false,
    action: { label: 'View Order', path: '/vendors/orders' }
  },
  {
    id: '2',
    type: 'payment',
    title: 'Payment Received',
    message: 'Payment of ₹85,000 for invoice #INV-2025-012 has been processed',
    timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    isRead: false,
    action: { label: 'View Invoice', path: '/vendors/invoices' }
  },
  {
    id: '3',
    type: 'dispatch',
    title: 'Dispatch Reminder',
    message: 'Order #ORD-2025-020 is due for dispatch by 5:00 PM today',
    timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
    isRead: false,
    action: { label: 'Update Dispatch', path: '/vendors/dispatch' }
  },
  {
    id: '4',
    type: 'invoice',
    title: 'Invoice Approved',
    message: 'Invoice #INV-2025-015 has been approved and payment is processing',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    isRead: true,
    action: { label: 'View Invoice', path: '/vendors/invoices' }
  },
  {
    id: '5',
    type: 'performance',
    title: 'Performance Update',
    message: 'Your monthly performance score: 4.8/5.0 - Excellent!',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    isRead: true,
    action: { label: 'View Performance', path: '/vendors/performance' }
  },
  {
    id: '6',
    type: 'order',
    title: 'Order Modification',
    message: 'Order #ORD-2025-018 has been modified. Please review changes.',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    isRead: false,
    action: { label: 'Review Order', path: '/vendors/orders' }
  }
]

function VendorsLayout() {
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [search, setSearch] = useState('')
  const [showProfile, setShowProfile] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>(sampleNotifications)
  const notificationsRef = useRef<HTMLDivElement>(null)
  
  const unreadCount = notifications.filter(n => !n.isRead).length

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showNotifications])

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!search) return
    // navigate to a search results page (not implemented) with query
    navigate(`/vendors/search?q=${encodeURIComponent(search)}`)
  }

  function handleLogout() {
    logout()
    navigate('/')
  }

  function markAsRead(notificationId: string) {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      )
    )
  }

  function markAllAsRead() {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, isRead: true }))
    )
  }

  function handleNotificationClick(notification: Notification) {
    markAsRead(notification.id)
    if (notification.action) {
      navigate(notification.action.path)
    }
    setShowNotifications(false)
  }

  function getNotificationIcon(type: NotificationType) {
    switch (type) {
      case 'order': return Package
      case 'invoice': return FileText
      case 'dispatch': return Wallet
      case 'performance': return BarChart3
      case 'payment': return Wallet
      default: return Bell
    }
  }

  function formatTimeAgo(date: Date) {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-happyplant-bg)', width: '100%', minHeight: '100vh', boxSizing: 'border-box', overflowX: 'hidden' }}>
      {/* Sidebar (fixed) */}
      <aside className="p-6 flex flex-col justify-between" style={{ background: 'var(--color-secondary)', color: 'white', width: '230px', position: 'fixed', left: 0, top: 0, height: '100vh', zIndex: 30 }}>
        <div>
          <div className="mb-8">
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 600 }}>Kyari</div>
            <div className="text-sm text-white/70 mt-1">Vendor Portal</div>
          </div>

          <nav className="flex flex-col gap-4">
            {navItems.map(({ to, icon: Icon, label }) => {
              const isActive = location.pathname === to
              
              return (
                <Link 
                  key={to} 
                  to={to} 
                  className={`py-2 rounded-md flex items-center gap-2 w-full whitespace-nowrap text-left ${
                    isActive ? 'bg-white text-gray-800 pl-3 pr-1' : 'hover:bg-white/5 px-3'
                  }`} 
                  style={{ color: isActive ? 'var(--color-primary)' : 'white' }}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* footer intentionally removed per user request */}
      </aside>

      {/* Main area */}
      <main style={{ marginLeft: '230px', marginTop: 0, paddingTop: 0, overflowX: 'hidden', height: '100vh' }}>
        {/* Top bar (fixed) */}
        <div className="flex items-center justify-between bg-[var(--color-secondary)] py-2 pr-6 pl-0 fixed top-0 left-[230px] right-0 h-16 z-40 border-l border-white/20">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-3 w-[60%]">
            <div className="relative w-full">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/90">
                <Search size={18} />
              </div>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search orders, invoices..."
                className="w-1/2 pl-11 pr-3 h-9 rounded-md bg-[var(--color-secondary)] text-white outline-none"
              />
            </div>
          </form>

          <div className="flex items-center gap-4">
            <div className="relative" ref={notificationsRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label="Notifications" 
                className="relative p-0 rounded-md text-white hover:bg-white/10 p-2 transition-colors" 
                style={{ background: 'transparent' }}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center" style={{ background: 'var(--color-accent)', color: 'var(--color-button-text)' }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-96 max-h-[500px] rounded-lg shadow-lg border border-gray-200 z-50" style={{ background: 'white' }}>
                  {/* Notifications Header */}
                  <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Vendor Notifications</h3>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <CheckSquare size={14} />
                          Mark all read
                        </button>
                      )}
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Notifications List */}
                  <div className="max-h-[400px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-gray-500">
                        <Bell size={24} className="mx-auto mb-2 text-gray-300" />
                        <p>No notifications</p>
                      </div>
                    ) : (
                      notifications.map((notification) => {
                        const IconComponent = getNotificationIcon(notification.type)
                        return (
                          <div
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`px-4 py-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                              !notification.isRead ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-full flex-shrink-0 ${
                                notification.type === 'order' ? 'bg-blue-100 text-blue-600' :
                                notification.type === 'invoice' ? 'bg-green-100 text-green-600' :
                                notification.type === 'dispatch' ? 'bg-orange-100 text-orange-600' :
                                notification.type === 'performance' ? 'bg-purple-100 text-purple-600' :
                                'bg-emerald-100 text-emerald-600'
                              }`}>
                                <IconComponent size={16} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <h4 className={`text-sm font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                                    {notification.title}
                                  </h4>
                                  {!notification.isRead && (
                                    <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-xs text-gray-400 flex items-center gap-1">
                                    <Clock size={12} />
                                    {formatTimeAgo(notification.timestamp)}
                                  </span>
                                  {notification.action && (
                                    <span className="text-xs text-blue-600 font-medium">
                                      {notification.action.label} →
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>

                  {/* Notifications Footer */}
                  {notifications.length > 0 && (
                    <div className="px-4 py-3 border-t border-gray-200">
                      <Link
                        to="/vendors/notifications"
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1"
                        onClick={() => setShowNotifications(false)}
                      >
                        View all notifications
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="relative">
              <button onClick={() => setShowProfile((s) => !s)} className="flex items-center gap-3 p-1 rounded-md" style={{ background: 'transparent' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 600, color: 'white' }}>{user?.email ? user.email.split('@')[0] : 'Vendor'}</div>
                  <div style={{ fontSize: 12, color: 'white' }}>Vendor</div>
                </div>
                <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'var(--color-accent)', color: 'var(--color-button-text)', fontSize: 13 }}>V</div>
              </button>

              {showProfile && (
                <div className="absolute right-0 mt-2 w-40 rounded-md shadow-md p-2" style={{ background: 'var(--color-header-bg)' }}>
                  <Link to="/vendors/profile-settings" className="block px-2 py-1 hover:underline" style={{ color: 'var(--color-primary)' }}>Settings</Link>
                  <button onClick={handleLogout} className="w-full text-left px-2 py-1 mt-1" style={{ background: 'transparent', color: 'var(--color-primary)' }}>Logout</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main content area - Outlet renders module content */}
        <div style={{ marginTop: 64, height: 'calc(100vh - 64px)', overflow: 'auto' }}>
          {/* Module area - transparent background, modules should use full width */}
          <div style={{ minHeight: '100%', width: '100%', boxSizing: 'border-box', padding: 0, background: 'transparent' }}>
            <div style={{ width: '100%', padding: 0 }}>
              <Outlet />
            </div>
          </div>
        </div>

        {/* main footer removed per user request */}
      </main>
    </div>
  )
}

export default VendorsLayout


