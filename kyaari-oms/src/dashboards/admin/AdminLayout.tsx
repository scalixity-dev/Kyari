import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../auth/AuthProvider'
import type { LucideIcon } from 'lucide-react'
import { LayoutDashboard, Package, Users, Bell, Wallet, MapPin, BarChart3, FileText, Search, ChevronRight } from 'lucide-react'

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
  const [search, setSearch] = useState('')
  const [showProfile, setShowProfile] = useState(false)
  const [notifications] = useState(3)
  const [trackingOpen, setTrackingOpen] = useState(false)
  const [supportOpen, setSupportOpen] = useState(false)

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!search) return
    // navigate to a search results page (not implemented) with query
    navigate(`/admin/search?q=${encodeURIComponent(search)}`)
  }

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-happyplant-bg)', width: '100%', minHeight: '100vh', boxSizing: 'border-box', overflowX: 'hidden' }}>
      {/* Sidebar (fixed) */}
      <aside className="p-6 flex flex-col justify-between scrollbar-hidden" style={{ background: 'var(--color-secondary)', color: 'white', width: '230px', position: 'fixed', left: 0, top: 0, height: '100vh', zIndex: 30, overflowY: 'auto' }}>
        <div>
          <div className="mb-8">
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 600 }}>Kyari</div>
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
                placeholder="Mega Search"
                className="w-1/2 pl-11 pr-3 h-9 rounded-md bg-[var(--color-secondary)] text-white outline-none"
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
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 600, color: 'white' }}>{user?.email ? user.email.split('@')[0] : 'Admin'}</div>
                  <div style={{ fontSize: 12, color: 'white' }}>Admin</div>
                </div>
                <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'var(--color-accent)', color: 'var(--color-button-text)', fontSize: 13 }}>A</div>
              </button>

              {showProfile && (
                <div className="absolute right-0 mt-2 w-40 rounded-md shadow-md p-2" style={{ background: 'var(--color-header-bg)' }}>
                  <Link to="/admin/settings" className="block px-2 py-1 hover:underline" style={{ color: 'var(--color-primary)' }}>Settings</Link>
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

export default AdminLayout


