import { Link, useNavigate } from 'react-router-dom'
import kyariLogo from '../../assets/kyariLogo.webp'
import { useAuth } from '../../auth/AuthProvider'
import { useEffect, useRef, useState } from 'react'

export default function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  // user object shape may only include email in our app types; safely read optional photoURL
  const photoURL = (user as any)?.photoURL as string | undefined
  const initial = user?.email ? user.email.charAt(0).toUpperCase() : 'U'

  function handleLogout() {
    logout()
    navigate('/')
  }

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return
      if (e.target instanceof Node && !menuRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  return (
    <header className="flex items-center justify-between px-4 py-2 bg-[var(--color-sharktank-bg)] border-b border-black/4">
      <div className="flex items-center">
        <Link to="/">
          <img src={kyariLogo} alt="Kyari" className="h-10" />
        </Link>
      </div>

      {/* Desktop / tablet: show greeting + logout. Mobile: show compact menu button */}
      <div className="flex items-center">
        {/* Visible on md+ */}
        <div className="hidden md:flex gap-3 items-center">
          {user ? (
            <>
              <span className="text-primary truncate">Hi, {user.email}</span>
              <button
                className="bg-transparent border border-accent text-accent px-3 py-1.5 rounded-lg cursor-pointer min-h-[44px]"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : null}
        </div>

        {/* Mobile avatar menu button */}
        <div className="md:hidden" ref={menuRef}>
          <button
            aria-label="Open user menu"
            aria-expanded={open}
            onClick={() => setOpen(v => !v)}
            className="inline-flex items-center justify-center p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
          >
            {/* Avatar: show image if available, otherwise initials */}
            {user ? (
              photoURL ? (
                <img src={photoURL} alt="Profile" className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <div className="h-9 w-9 rounded-full bg-accent text-white flex items-center justify-center font-medium">
                  {initial}
                </div>
              )
            ) : (
              <div className="h-9 w-9 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-medium">U</div>
            )}
          </button>

          {open && (
            <div className="absolute right-3 mt-2 w-56 bg-white border rounded-lg shadow-md z-50" role="menu">
              <div className="px-3 py-2 border-b">
                <div className="text-sm font-medium text-gray-900 truncate">{(user as any)?.displayName || user?.email || 'User'}</div>
                {user?.email && <div className="text-xs text-gray-500 truncate">{user.email}</div>}
              </div>
              <div className="py-1">
                <button
                  className="w-full text-left px-3 py-2 text-sm text-accent hover:bg-gray-50"
                  onClick={() => { setOpen(false); handleLogout() }}
                  role="menuitem"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
