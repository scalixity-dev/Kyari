import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { LayoutDashboard, Package, FileText, Wallet, BarChart3, Bell, Search, Users, Menu, X, Clock, CheckSquare } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../auth/AuthProvider'

type NotificationType = 'payment' | 'invoice' | 'order' | 'vendor' | 'support'

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
  { to: '/accounts', icon: LayoutDashboard, label: 'Dashboard ' },
  { to: '/accounts/vendor-orders', icon: Package, label: 'Vendor Orders' },
  { to: '/accounts/po-invoices', icon: FileText, label: 'Invoice' },
  { to: '/accounts/payment-release', icon: Wallet, label: 'Payment Release' },
  { to: '/accounts/reports', icon: BarChart3, label: 'Reports' },
  { to: '/accounts/support', icon: Users, label: 'Support' },
  { to: '/accounts/profile-settings', icon: FileText, label: 'Profile & Settings' }
]

// Accounts-specific sample notifications
const sampleNotifications: Notification[] = [
  {
    id: '1',
    type: 'payment',
    title: 'Payment Approval Required',
    message: 'Invoice #INV-2025-024 for ₹45,000 requires approval',
    timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
    isRead: false,
    action: { label: 'Review Payment', path: '/accounts/payment-release' }
  },
  {
    id: '2',
    type: 'invoice',
    title: 'New Invoice Received',
    message: 'Invoice #INV-2025-025 from Vendor ABC for ₹28,500',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    isRead: false,
    action: { label: 'View Invoice', path: '/accounts/po-invoices' }
  },
  {
    id: '3',
    type: 'order',
    title: 'Order Status Update',
    message: 'Order #ORD-2025-018 has been dispatched by vendor',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    isRead: false,
    action: { label: 'View Order', path: '/accounts/vendor-orders' }
  },
  {
    id: '4',
    type: 'vendor',
    title: 'Vendor Payment Completed',
    message: 'Payment of ₹52,000 to Vendor XYZ has been processed',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    isRead: true,
    action: { label: 'View Details', path: '/accounts/payment-release' }
  },
  {
    id: '5',
    type: 'support',
    title: 'Support Query Resolved',
    message: 'Your query regarding invoice discrepancy has been resolved',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    isRead: true,
    action: { label: 'View Support', path: '/accounts/support' }
  }
]

function AccountsLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const [search, setSearch] = useState('')
  const [showProfile, setShowProfile] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>(sampleNotifications)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const notificationsRef = useRef<HTMLDivElement>(null)
  
  const unreadCount = notifications.filter(n => !n.isRead).length
  
  // Check if screen is mobile/tablet
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024)
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false) // Close mobile sidebar when on desktop
      }
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

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

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (isMobile && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        const target = event.target as HTMLElement
        // Don't close if clicking on the hamburger menu button
        if (!target.closest('[data-mobile-menu-toggle]')) {
          setSidebarOpen(false)
        }
      }
    }

    if (sidebarOpen && isMobile) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [sidebarOpen, isMobile])

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!search) return
    navigate(`/accounts/search?q=${encodeURIComponent(search)}`)
  }

  function handleLogout() {
    logout()
    navigate('/')
  }

  function handleNavClick() {
    if (isMobile) {
      setSidebarOpen(false)
    }
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
      case 'payment': return Wallet
      case 'invoice': return FileText
      case 'order': return Package
      case 'vendor': return Users
      case 'support': return Users
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
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        ref={sidebarRef}
        className={`p-6 flex flex-col justify-between scrollbar-hidden transition-transform duration-300 ease-in-out ${
          isMobile 
            ? `fixed left-0 top-0 h-full z-50 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
            : 'fixed left-0 top-0 h-full z-30'
        }`}
        style={{ 
          background: 'var(--color-secondary)', 
          color: 'white', 
          width: '230px', 
          height: '100vh', 
          overflowY: 'auto' 
        }}
      >
        <div>
          <div className="mb-8 flex items-center justify-between">
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 600 }}>Kyari</div>
              {!isMobile && <div className="text-sm text-white/70 mt-1">Accounts</div>}
            </div>
            {/* Mobile Close Button */}
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 text-white hover:bg-white/10 rounded-md transition-colors"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            )}
          </div>

          <nav className="flex flex-col gap-2">
            {navItems.map(({ to, icon: Icon, label }) => {
              const isActive = location.pathname === to
              
              return (
                <Link 
                  key={to} 
                  to={to} 
                  onClick={handleNavClick}
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

        {/* footer intentionally empty to match admin layout minimalism */}
      </aside>

      {/* Main area */}
      <main className={`transition-all duration-300 ease-in-out ${isMobile ? 'ml-0' : 'ml-[230px]'}`} style={{ marginTop: 0, paddingTop: 0, overflowX: 'hidden', height: '100vh' }}>
        {/* Top bar (fixed) */}
        <div className={`flex items-center justify-between bg-[var(--color-secondary)] py-2 pr-6 pl-0 fixed top-0 right-0 h-16 z-40 border-l border-white/20 transition-all duration-300 ease-in-out ${
          isMobile ? 'left-0' : 'left-[230px]'
        }`}>
          {/* Mobile Menu Button */}
          {isMobile && (
            <button
              data-mobile-menu-toggle
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-white hover:bg-white/10 rounded-md transition-colors lg:hidden"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
          )}
          <form onSubmit={handleSearchSubmit} className={`flex items-center gap-3 ${isMobile ? 'flex-1 mx-3' : 'w-[60%]'}`}>
            <div className="relative w-full">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/90">
                <Search size={18} />
              </div>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isMobile ? "Search..." : "Search in Accounts"}
                className={`pl-11 pr-3 h-9 rounded-md bg-[var(--color-secondary)] text-white outline-none transition-all ${
                  isMobile ? 'w-full' : 'w-1/2'
                }`}
              />
            </div>
          </form>

          <div className="flex items-center gap-4">
            <div className="relative" ref={notificationsRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label="Notifications" 
                className="relative p-2 rounded-md text-white hover:bg-white/10 transition-colors" 
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
                <div className={`absolute right-0 mt-2 rounded-lg shadow-lg border border-gray-200 z-50 ${
                  isMobile ? 'w-[calc(100vw-2rem)] max-w-sm -mr-12' : 'w-96'
                } max-h-[500px]`} style={{ background: 'white' }}>
                  {/* Notifications Header */}
                  <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Accounts Notifications</h3>
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
                                notification.type === 'payment' ? 'bg-green-100 text-green-600' :
                                notification.type === 'invoice' ? 'bg-blue-100 text-blue-600' :
                                notification.type === 'order' ? 'bg-purple-100 text-purple-600' :
                                notification.type === 'vendor' ? 'bg-orange-100 text-orange-600' :
                                'bg-red-100 text-red-600'
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
                        to="/accounts/notifications"
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
                <div className={`${isMobile ? 'hidden' : 'block'}`} style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 600, color: 'white' }}>{user?.email ? user.email.split('@')[0] : 'Accounts'}</div>
                  <div style={{ fontSize: 12, color: 'white' }}>Accounts</div>
                </div>
                <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'var(--color-accent)', color: 'var(--color-button-text)', fontSize: 13 }}>A</div>
              </button>

              {showProfile && (
                <div className={`absolute right-0 mt-2 rounded-md shadow-md p-2 ${
                  isMobile ? 'w-40' : 'w-40'
                }`} style={{ background: 'var(--color-header-bg)' }}>
                  <Link to="/accounts/profile-settings" className="block px-2 py-1 hover:underline" style={{ color: 'var(--color-primary)' }}>Settings</Link>
                  <button onClick={handleLogout} className="w-full text-left px-2 py-1 mt-1" style={{ background: 'transparent', color: 'var(--color-primary)' }}>Logout</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main content area - Outlet renders module content */}
        <div style={{ marginTop: 64, height: 'calc(100vh - 64px)', overflow: 'auto' }}>
          <div style={{ minHeight: '100%', width: '100%', boxSizing: 'border-box', padding: 0, background: 'transparent' }}>
            <div style={{ width: '100%', padding: 16 }}>
              <Outlet />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default AccountsLayout


