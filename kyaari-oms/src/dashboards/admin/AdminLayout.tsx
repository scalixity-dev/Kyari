import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../auth/AuthProvider'
import type { LucideIcon } from 'lucide-react'
import { LayoutDashboard, Package, Users, Bell, Wallet, MapPin, BarChart3, FileText, Search } from 'lucide-react'

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
  { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/admin/audit-logs', icon: FileText, label: 'Audit Logs' }
]

function AdminLayout() {
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [showProfile, setShowProfile] = useState(false)
  const [notifications] = useState(3)
  const [trackingOpen, setTrackingOpen] = useState(false)

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
      <aside className="p-6 flex flex-col justify-between" style={{ background: 'var(--color-secondary)', color: 'white', width: '230px', position: 'fixed', left: 0, top: 0, height: '100vh', zIndex: 30 }}>
        <div>
          <div className="mb-8">
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 600 }}>Kyari</div>
          </div>

          <nav className="flex flex-col gap-4">
            {navItems.map(({ to, icon: Icon, label }) => {
              if (label === 'Tracking') {
                return (
                  <div key={to} className="flex flex-col">
                    <button
                      onClick={() => setTrackingOpen((s) => !s)}
                      className="px-3 py-2 rounded-md hover:bg-white/5 flex items-center gap-2 w-full whitespace-nowrap text-left"
                      style={{ color: 'white' }}
                      aria-expanded={trackingOpen}
                    >
                      <Icon size={18} />
                      <span className="flex-1 text-left">{label}</span>
                      <span className="text-sm">{trackingOpen ? '▾' : '▸'}</span>
                    </button>

                    {trackingOpen && (
                      <div className="mt-2 ml-3 flex flex-col gap-2">
                        <Link to="/admin/tracking/orders" className="px-3 py-2 rounded-md hover:bg-white/5 flex items-center gap-2 w-full whitespace-nowrap text-left" style={{ color: 'white' }}>
                          <Package size={16} />
                          <span>Order Tracking</span>
                        </Link>
                        <Link to="/admin/tracking/vendors" className="px-3 py-2 rounded-md hover:bg-white/5 flex items-center gap-2 w-full whitespace-nowrap text-left" style={{ color: 'white' }}>
                          <Users size={16} />
                          <span>Vendor Tracking</span>
                        </Link>
                      </div>
                    )}
                  </div>
                )
              }

              return (
                <Link key={to} to={to} className="px-3 py-2 rounded-md hover:bg-white/5 flex items-center  gap-2 w-full whitespace-nowrap text-left" style={{ color: 'white' }}>
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
  <div className="flex items-center justify-between bg-[var(--color-secondary)] py-2 pr-6 pl-0 fixed top-0 left-[230px] right-0 h-16 z-40">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-3 w-[60%]">
            <div className="relative w-full">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/90">
                <Search size={18} />
              </div>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Mega Search"
                className="w-1/2 pl-11 pr-3 h-9rounded-md bg-[var(--color-secondary)] text-white outline-none"
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


