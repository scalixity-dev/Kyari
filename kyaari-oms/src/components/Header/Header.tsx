import { Link, useNavigate } from 'react-router-dom'
import kyariLogo from '../../assets/kyariLogo.webp'
import { useAuth } from '../../auth/AuthProvider'

export default function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <header className="flex items-center justify-between px-4 py-2 bg-header-bg border-b border-black/4">
      <div className="flex items-center">
        <Link to="/">
          <img src={kyariLogo} alt="Kyari" className="h-10" />
        </Link>
      </div>
      <div className="flex gap-3 items-center">
        {user ? (
          <>
            <span className="text-primary">Hi, {user.email}</span>
            <button 
              className="bg-transparent border border-accent text-accent px-3 py-1.5 rounded-lg cursor-pointer" 
              onClick={handleLogout}
            >
              Logout
            </button>
          </>
        ) : null}
      </div>
    </header>
  )
}
