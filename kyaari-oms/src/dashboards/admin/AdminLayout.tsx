import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../auth/AuthProvider'
import { useNotifications } from '../../hooks/useNotifications'
import type { Notification as AppNotification } from '../../services/notifications'
import type { LucideIcon } from 'lucide-react'
import { LayoutDashboard, Package, Users, Bell, Wallet, MapPin, BarChart3, FileText, ChevronRight, X, Clock, CheckSquare, Menu, AlertCircle } from 'lucide-react'
import kyariLogo from '../../assets/kyariLogo.webp'
import { MegaSearch } from '../../components'

type NavItem = {
  to: string
  icon: LucideIcon
  label: string
}

const navItems: NavItem[] = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/orders', icon: Package, label: 'Orders' },
  { to: '/admin/users', icon: Users, label: 'Users & Roles' },
  { to: '/admin/notifications', icon: Bell, label: 'Notifications' },
  { to: '/admin/money-flow', icon: Wallet, label: 'Money Flow' },
  { to: '/admin/tracking', icon: MapPin, label: 'Tracking' },
  { to: '/admin/support', icon: Users, label: 'Support' },
  { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/admin/audit-logs', icon: FileText, label: 'Audit Logs' }
]

function AdminLayout() {
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  // Use real notification hook with FCM + light polling
  const { 
    notifications, 
    unreadCount, 
    markAsRead,
    markAllAsRead,
    refreshNotifications,
  } = useNotifications()
  
  const [showProfile, setShowProfile] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [trackingOpen, setTrackingOpen] = useState(false)
  const [supportOpen, setSupportOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const notificationsRef = useRef<HTMLDivElement>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)

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


  function handleLogout() {
    logout()
    navigate('/')
  }

  function handleNotificationClick(notification: AppNotification) {
    markAsRead(notification.id)
    // Navigate based on orderId if available
    if (notification.metadata?.orderId) {
      navigate(`/admin/orders`)
    }
    setShowNotifications(false)
  }

  function getNotificationIcon(type: string) {
    // Check for specific notification types first
    if (type.includes('INVOICE')) return FileText
    if (type.includes('TICKET') || type.includes('ISSUE')) return AlertCircle
    
    // Fallback to generic types
    switch (type) {
      case 'critical': return Bell
      case 'info': return Package
      case 'reminder': return Clock
      default: return Bell
    }
  }

  function formatTimeAgo(date: Date | string) {
    const now = new Date()
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const diffInMinutes = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }


  function handleNavClick() {
    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-sharktank-bg)', width: '100%', minHeight: '100vh', boxSizing: 'border-box', overflowX: 'hidden' }}>
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
              <img 
                src={kyariLogo} 
                alt="Kyari Logo" 
                className="h-8"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
              {!isMobile && <div className="text-sm text-white/70 mt-1">Admin Portal</div>}
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
              
              if (label === 'Tracking') {
                return (
                  <div key={to} className="flex flex-col">
                    <button
                      onClick={() => setTrackingOpen((s) => !s)}
                      className={`py-2 rounded-md flex items-center gap-2 w-full whitespace-nowrap text-left ${
                        isActive ? 'bg-white text-gray-800 pl-3 pr-1' : 'hover:bg-white/5 px-3'
                      }`}
                      style={{ color: isActive ? 'var(--color-primary)' : 'white' }}
                      aria-expanded={trackingOpen}
                    >
                      <Icon size={18} />
                      <span className="flex-1 text-left">{label}</span>
                      <span className="text-sm">
                        <ChevronRight size={14} className={`transform transition-transform duration-200 ${trackingOpen ? 'rotate-90' : 'rotate-0'}`} aria-hidden />
                      </span>
                    </button>
                    {/* submenu always present but animated for smooth open/close */}
                    <div
                      className={`${trackingOpen ? 'mt-2' : 'mt-0'} ml-3 flex flex-col gap-2 overflow-hidden transition-all duration-200 ease-in-out transform origin-top ${
                        trackingOpen ? 'max-h-40 opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-1'
                      }`}
                      aria-hidden={!trackingOpen}
                    >
                      <Link
                        to="/admin/tracking/orders"
                        onClick={handleNavClick}
                        className={`px-3 py-2 rounded-md flex items-center gap-2 w-full whitespace-nowrap text-left ${
                          location.pathname.startsWith('/admin/tracking/orders') ? 'bg-white text-gray-800' : 'hover:bg-white/5'
                        }`}
                        style={{ color: location.pathname.startsWith('/admin/tracking/orders') ? 'var(--color-primary)' : 'white' }}
                      >
                        <Package size={16} />
                        <span>Order Tracking</span>
                      </Link>
                      <Link
                        to="/admin/tracking/vendors"
                        onClick={handleNavClick}
                        className={`px-3 py-2 rounded-md flex items-center gap-2 w-full whitespace-nowrap text-left ${
                          location.pathname.startsWith('/admin/tracking/vendors') ? 'bg-white text-gray-800' : 'hover:bg-white/5'
                        }`}
                        style={{ color: location.pathname.startsWith('/admin/tracking/vendors') ? 'var(--color-primary)' : 'white' }}
                      >
                        <Users size={16} />
                        <span>Vendor Tracking</span>
                      </Link>
                    </div>
                  </div>
                )
              }

              if (label === 'Support') {
                return (
                  <div key={to} className="flex flex-col">
                    <button
                      onClick={() => setSupportOpen((s) => !s)}
                      className={`py-2 rounded-md flex items-center gap-2 w-full whitespace-nowrap text-left ${
                        isActive ? 'bg-white text-gray-800 pl-3 pr-1' : 'hover:bg-white/5 px-3'
                      }`}
                      style={{ color: isActive ? 'var(--color-primary)' : 'white' }}
                      aria-expanded={supportOpen}
                    >
                      <Icon size={18} />
                      <span className="flex-1 text-left">{label}</span>
                      <span className="text-sm">
                        <ChevronRight size={14} className={`transform transition-transform duration-200 ${supportOpen ? 'rotate-90' : 'rotate-0'}`} aria-hidden />
                      </span>
                    </button>
                    <div
                      className={`${supportOpen ? 'mt-2' : 'mt-0'} ml-3 flex flex-col gap-2 overflow-hidden transition-all duration-200 ease-in-out transform origin-top ${
                        supportOpen ? 'max-h-40 opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-1'
                      }`}
                      aria-hidden={!supportOpen}
                    >
                      <Link
                        to="/admin/support/vendors"
                        onClick={handleNavClick}
                        className={`px-3 py-2 rounded-md flex items-center gap-2 w-full whitespace-nowrap text-left ${
                          location.pathname.startsWith('/admin/support/vendors') ? 'bg-white text-gray-800' : 'hover:bg-white/5'
                        }`}
                        style={{ color: location.pathname.startsWith('/admin/support/vendors') ? 'var(--color-primary)' : 'white' }}
                      >
                        <Users size={16} />
                        <span>Vendor Support</span>
                      </Link>
                      <Link
                        to="/admin/support/accounts"
                        onClick={handleNavClick}
                        className={`px-3 py-2 rounded-md flex items-center gap-2 w-full whitespace-nowrap text-left ${
                          location.pathname.startsWith('/admin/support/accounts') ? 'bg-white text-gray-800' : 'hover:bg-white/5'
                        }`}
                        style={{ color: location.pathname.startsWith('/admin/support/accounts') ? 'var(--color-primary)' : 'white' }}
                      >
                        <Wallet size={16} />
                        <span>Account Support</span>
                      </Link>
                      <Link
                        to="/admin/support/ops"
                        onClick={handleNavClick}
                        className={`px-3 py-2 rounded-md flex items-center gap-2 w-full whitespace-nowrap text-left ${
                          location.pathname.startsWith('/admin/support/ops') ? 'bg-white text-gray-800' : 'hover:bg-white/5'
                        }`}
                        style={{ color: location.pathname.startsWith('/admin/support/ops') ? 'var(--color-primary)' : 'white' }}
                      >
                        <Package size={16} />
                        <span>Ops Support</span>
                      </Link>
                    </div>
                  </div>
                )
              }

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

        {/* footer intentionally removed per user request */}
      </aside>

  {/* Main area */}
  <main className={`transition-all duration-300 ease-in-out ${isMobile ? 'ml-0' : 'ml-[230px]'}`} style={{ marginTop: 0, paddingTop: 0, overflowX: 'hidden', height: '100vh' }}>
  {/* Top bar (fixed) */}
  <div className={`flex items-center justify-between bg-[var(--color-sharktank-bg)] py-2 pr-6 pl-0 fixed top-0 right-0 h-28 z-40 border-l border-white/20 transition-all duration-300 ease-in-out ${
    isMobile ? 'left-0' : 'left-[230px]'
  }`}>
          {/* Mobile Menu Button */}
          {isMobile && (
            <button
              data-mobile-menu-toggle
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-[var(--color-secondary)] hover:bg-white/10 rounded-md transition-colors lg:hidden"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
          )}

          {/* Left welcome text (visible on md+) */}
          <div className="hidden md:block ml-9 mr-6 text-3xl font-medium" style={{ color: 'var(--color-secondary)' }}>
            <div className="font-bold" style={{ fontFamily: 'var(--font-heading)' }}>Admin Dashboard</div>
            <div className="text-xl mt-1">Welcome Admin</div>
          </div>
          {/* Spacer on desktop to push right-group to the edge */}
          {!isMobile && <div className="flex-1" />}

          <div className="flex items-center gap-4">
            <MegaSearch 
              isMobile={isMobile} 
              userRole="ADMIN" 
              placeholder="Mega Search"
            />

            <div className="flex items-center gap-4">
            <div className="relative" ref={notificationsRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label="Notifications" 
                className="relative rounded-md text-[var(--color-secondary)] hover:bg-white/10 p-2 transition-colors" 
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
                  isMobile ? 'w-[calc(100vw-2rem)] max-w-sm -mr-4' : 'w-96'
                } max-h-[500px]`} style={{ background: 'white' }}>
                  {/* Notifications Header */}
                  <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Admin Notifications</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          refreshNotifications();
                        }}
                        className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
                        title="Refresh notifications"
                      >
                        <ChevronRight size={14} />
                        Refresh
                      </button>
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
                        const isUnread = notification.status !== 'READ' && !notification.readAt
                        return (
                          <div
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`px-4 py-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                              isUnread ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-full flex-shrink-0 ${
                                notification.priority === 'HIGH' || notification.priority === 'URGENT' ? 'bg-red-100 text-red-600' :
                                notification.priority === 'MEDIUM' ? 'bg-orange-100 text-orange-600' :
                                'bg-blue-100 text-blue-600'
                              }`}>
                                <IconComponent size={16} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <h4 className={`text-sm font-medium ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                                    {notification.title}
                                  </h4>
                                  {isUnread && (
                                    <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-xs text-gray-400 flex items-center gap-1">
                                    <Clock size={12} />
                                    {formatTimeAgo(notification.createdAt)}
                                  </span>
                                  {notification.metadata?.orderId && (
                                    <span className="text-xs text-blue-600 font-medium">
                                      Order: {notification.metadata?.orderId}
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
                        to="/admin/notifications"
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
                  <div style={{ fontWeight: 600, color: 'var(--color-secondary)' }}>{user?.email ? user.email.split('@')[0] : 'Admin'}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-secondary)' }}>Admin</div>
                </div>
                <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'var(--color-accent)', color: 'var(--color-button-text)', fontSize: 13 }}>A</div>
              </button>

              {showProfile && (
                <div className={`absolute right-0 mt-2 rounded-md shadow-md p-2 ${
                  isMobile ? 'w-40' : 'w-40'
                }`} style={{ background: 'var(--color-header-bg)' }}>
                  <Link to="/admin/settings" className="block px-2 py-1 hover:underline" style={{ color: 'var(--color-primary)' }}>Settings</Link>
                  <button onClick={handleLogout} className="w-full text-left px-2 py-1 mt-1" style={{ background: 'transparent', color: 'var(--color-primary)' }}>Logout</button>
                </div>
              )}
            </div>
            </div>
          </div>
        </div>

        {/* Main content area - Outlet renders module content */}
        <div className="mt-28 h-[calc(100vh-7rem)] overflow-auto">
          {/* Module area - transparent background, modules should use full width */}
          <div className="min-h-full w-full box-border p-0 bg-transparent">
            <div className="w-full p-0">
              <Outlet />
            </div>
          </div>
        </div>

        {/* main footer removed per user request */}
      </main>
    </div>
  )
}

export default AdminLayout


