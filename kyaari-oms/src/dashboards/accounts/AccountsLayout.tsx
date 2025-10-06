import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { LayoutDashboard, Package, FileText, Wallet, BarChart3, Bell, Search, Users, Menu, X } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../auth/AuthProvider'

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

function AccountsLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const [search, setSearch] = useState('')
  const [showProfile, setShowProfile] = useState(false)
  const [notifications] = useState(2)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
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
            <button aria-label="Notifications" className="relative p-0 rounded-md text-white" style={{ background: 'transparent' }}>
              <Bell size={18} />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 text-xs rounded-full px-1" style={{ background: 'var(--color-accent)', color: 'var(--color-button-text)' }}>{notifications}</span>
              )}
            </button>

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


