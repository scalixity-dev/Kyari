import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../auth/AuthProvider'
import type { LucideIcon } from 'lucide-react'
import { LayoutDashboard, Package, Users, Bell, Wallet, MapPin, BarChart3, FileText } from 'lucide-react'

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
    <div className="min-h-screen grid grid-cols-[230px_1fr]" style={{ background: 'var(--color-happyplant-bg)', width: '100vw', minHeight: '100vh', boxSizing: 'border-box', overflowX: 'hidden' }}>
      {/* Sidebar */}
      <aside className="p-6 flex flex-col justify-between" style={{ background: 'var(--color-secondary)', color: 'white' }}>
        <div>
          <div className="mb-8">
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 600 }}>Kyari</div>
          </div>

          <nav className="flex flex-col gap-4">
            {navItems.map(({ to, icon: Icon, label }) => (
              <Link key={to} to={to} className="px-3 py-2 rounded-md hover:bg-white/5 flex items-center  gap-2 w-full whitespace-nowrap text-left" style={{ color: 'white' }}>
                <Icon size={18} />
                <span>{label}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* footer intentionally removed per user request */}
      </aside>

      {/* Main area */}
      <main className="p-6">
  {/* Top bar (sticky) */}
  <div
    className="flex items-center justify-between sticky top-0 z-20"
    style={{
      background: 'var(--color-secondary)',
  padding: '4px 0',
      marginLeft: '-24px',
      marginRight: '-24px',
      marginTop: '-24px',
      paddingLeft: '24px',
      paddingRight: '24px'
    }}
  >
          <form onSubmit={handleSearchSubmit} className="flex items-center" style={{ gap: 12, width: '60%' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.9)' }}>🔍</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Mega Search"
                className="rounded-md"
                style={{
                  width: '50%',
                  paddingLeft: 44,
                  paddingRight: 12,
                  height: 36,
                  border: '1px solid rgba(255,255,255,0.85)',
                  borderRadius: 6,
                  outline: 'none',
                  background: 'var(--color-secondary)',
                  color: 'white'
                }}
              />
            </div>
          </form>

          <div className="flex items-center gap-4">
            <button aria-label="Notifications" className="relative p-0 rounded-md" style={{ background: 'transparent' }}>
              🔔
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
        <div>
          <Outlet />
        </div>

        {/* main footer removed per user request */}
      </main>
    </div>
  )
}

export default AdminLayout


