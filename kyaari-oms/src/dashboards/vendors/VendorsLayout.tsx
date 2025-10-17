import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../auth/AuthProvider'
import { useNotifications } from '../../hooks/useNotifications'
import type { Notification as AppNotification } from '../../services/notifications'
import type { LucideIcon } from 'lucide-react'
import { LayoutDashboard, Package, FileText, Bell, BarChart3, Users, Wallet, Menu, X, Clock, CheckSquare } from 'lucide-react'
import kyariLogo from '../../assets/kyariLogo.webp'
import { MegaSearch } from '../../components'

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
  { to: '/vendors/support', icon: Users, label: 'Support' },
  { to: '/vendors/profile-settings', icon: Users, label: 'Profile Settings' }
]

function VendorsLayout() {
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  // Use real notification hook with FCM + light polling
  const { 
    notifications, 
    unreadCount, 
    markAsRead,
    markAllAsRead,
  } = useNotifications()
  
  const [showProfile, setShowProfile] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showNotificationsModal, setShowNotificationsModal] = useState(false)
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
      navigate(`/vendors/orders`)
    }
    setShowNotifications(false)
  }

  function getNotificationIcon(type: string) {
    switch (type) {
      case 'critical': return Bell
      case 'info': return Package
      case 'reminder': return Clock
      default: return Bell
    }
  }

  function formatTimeAgo(date: Date | string) {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
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
              {!isMobile && <div className="text-sm text-white/70 mt-1">Vendor Portal</div>}
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
            <div className="font-bold" style={{ fontFamily: 'var(--font-heading)' }}>Vendor Dashboard</div>
            <div className="text-xl mt-1">Welcome Vendor</div>
          </div>
          {/* Spacer on desktop to push right-group to the edge */}
          {!isMobile && <div className="flex-1" />}

          <div className="flex items-center gap-4">
            <MegaSearch 
              isMobile={isMobile} 
              userRole="VENDOR" 
              placeholder="Mega Search"
            />

            <div className="flex items-center gap-4">
            <div className="relative" ref={notificationsRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label="Notifications" 
                className="relative rounded-md text-[var(--color-secondary)] hover:bg-white/10 p-2 transition-colors cursor-pointer" 
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
                  <div className="px-4 py-3 flex items-center justify-between" style={{ background: '#C3754C' }}>
                    <h3 className="font-semibold text-white">Notifications</h3>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-sm text-white hover:text-white/80 flex items-center gap-1 cursor-pointer"
                        >
                          <CheckSquare size={14} />
                          Mark all read
                        </button>
                      )}
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="text-white hover:text-white/80 cursor-pointer"
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
                                      Order: {notification.metadata.orderId}
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
                    <div className="px-4 py-3" style={{ background: '#C3754C' }}>
                      <button
                        className="text-sm text-white hover:text-white/80 flex items-center justify-center gap-1 w-full cursor-pointer"
                        onClick={() => { setShowNotifications(false); setShowNotificationsModal(true) }}
                      >
                        View all notifications
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="relative">
              <button onClick={() => setShowProfile((s) => !s)} className="flex items-center gap-3 p-1 rounded-md" style={{ background: 'transparent' }}>
                <div className={`${isMobile ? 'hidden' : 'block'}`} style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 600, color: 'var(--color-secondary)' }}>{user?.email ? user.email.split('@')[0] : 'Vendor'}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-secondary)' }}>Vendor</div>
                </div>
                <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'var(--color-accent)', color: 'var(--color-button-text)', fontSize: 13 }}>V</div>
              </button>

              {showProfile && (
                <div className={`absolute right-0 mt-2 rounded-md shadow-md p-2 ${
                  isMobile ? 'w-40' : 'w-40'
                }`} style={{ background: 'var(--color-header-bg)' }}>
                  <Link to="/vendors/profile-settings" className="block px-2 py-1 hover:underline" style={{ color: 'var(--color-primary)' }}>Settings</Link>
                  <button onClick={handleLogout} className="w-full text-left px-2 py-1 mt-1" style={{ background: 'transparent', color: 'var(--color-primary)' }}>Logout</button>
                </div>
              )}
            </div>
            </div>
          </div>
        </div>

        {/* Main content area - Outlet renders module content */}
        <div style={{ marginTop: 112, height: 'calc(100vh - 112px)', overflow: 'auto' }}>
          {/* Module area - transparent background, modules should use full width */}
          <div style={{ minHeight: '100%', width: '100%', boxSizing: 'border-box', padding: 0, background: 'transparent' }}>
            <div style={{ width: '100%', padding: 0 }}>
              <Outlet />
            </div>
          </div>
        </div>

        {/* main footer removed per user request */}
      </main>

      {/* Global Notifications Modal */}
      {showNotificationsModal && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl w-full max-w-2xl md:max-w-3xl max-h-[90vh] sm:max-h-[85vh] flex flex-col">
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-2xl sm:rounded-t-xl" style={{ borderColor: '#E4E4E4' }}>
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                <h2 className="text-base sm:text-lg md:text-xl font-semibold" style={{ color: 'var(--color-heading)' }}>All Notifications</h2>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 bg-red-500 text-white rounded-full text-xs font-medium">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="px-3 py-1.5 text-xs sm:text-sm rounded-lg hover:bg-blue-50"
                    style={{ color: 'var(--color-accent)' }}
                  >
                    Mark all as read
                  </button>
                )}
                <button
                  onClick={() => setShowNotificationsModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
                  <Bell className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mb-3 sm:mb-4" />
                  <p className="text-gray-500 text-center text-sm sm:text-base">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => {
                    const IconComponent = getNotificationIcon(notification.type)
                    return (
                      <div key={notification.id} className={`p-3 sm:p-4 ${notification.status !== 'READ' ? 'bg-blue-50' : ''}`}>
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
                              <h4 className={`text-sm font-medium ${notification.status !== 'READ' ? 'text-gray-900' : 'text-gray-700'}`}>{notification.title}</h4>
                              {notification.status !== 'READ' && <div className="w-2 h-2 bg-blue-600 rounded-full" />}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                <Clock size={12} />
                                {formatTimeAgo(notification.createdAt)}
                              </span>
                              {notification.status !== 'READ' && (
                                <button
                                  onClick={() => markAsRead(notification.id)}
                                  className="text-xs text-[var(--color-accent)]"
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
              )}
            </div>

            <div className="p-3 sm:p-4 border-t border-gray-200 bg-gray-50">
              <p className="text-xs sm:text-sm text-gray-600 text-center">
                You have {notifications.length} total notification{notifications.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VendorsLayout