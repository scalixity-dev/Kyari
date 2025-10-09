import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { ResetPassword } from '../components'

export default function AccountsSignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showResetPassword, setShowResetPassword] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    
    if (!email || !password) {
      setError('Please enter email and password')
      return
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }

    setIsLoading(true)
    try {
      const success = await login({ email, password })
      if (success) {
        navigate('/accounts')
      } else {
        setError('Invalid credentials or you do not have Accounts role access')
      }
    } catch (error: unknown) {
      const err = error as { message?: string }
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="admin-signin__page">
      <style>{`
        /* Ensure root/container don't constrain full-width pages */
        :root { }
        #root { width: 100% !important; max-width: none !important; }

        .admin-signin__page { display:flex; align-items:center; justify-content:center; min-height:100vh; padding:2rem; background-color: var(--color-header-bg); width:100%; box-sizing:border-box; }
        .admin-signin__card { width:100%; max-width:420px; background:white; padding:2rem; border-radius:12px; box-shadow:0 8px 20px rgba(0,0,0,0.08); text-align:center; box-sizing:border-box; }
        .admin-signin__title { font-family: var(--font-heading); color: var(--color-heading); margin-bottom:1rem; }
        .admin-signin__form { display:flex; flex-direction:column; gap:0.75rem; }
        .admin-signin__label { font-size:0.9rem; text-align:left; color: var(--color-primary); }
        .admin-signin__input { width:100%; padding:0.6rem 0.75rem; border-radius:8px; border:1px solid #e6e6e6; margin-top:0.25rem; box-sizing:border-box; }
        .admin-signin__error { color:#b00020; font-size:0.9rem; text-align:left; }
        .admin-signin__button { margin-top:0.5rem; background-color: var(--color-accent); color: var(--color-button-text); padding:0.75rem 1rem; border-radius:8px; border:none; cursor:pointer; font-weight: var(--fw-bold); width:100%; }
        .admin-signin__button:hover { opacity:0.95; }
        .admin-signin__button:disabled { opacity:0.6; cursor:not-allowed; }
        .admin-signin__forgot-password { margin-top:1rem; text-align:center; }
        .admin-signin__forgot-link { background:none; border:none; color: var(--color-accent); font-size:0.9rem; cursor:pointer; text-decoration:none; }
        .admin-signin__forgot-link:hover { text-decoration:underline; }
      `}</style>

      <div className="admin-signin__card">
        <h2 className="admin-signin__title">Accounts Sign In</h2>
        <form onSubmit={handleSubmit} className="admin-signin__form">
          <label className="admin-signin__label">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="admin-signin__input"
              placeholder="accounts@kyari.com"
            />
          </label>

          <label className="admin-signin__label">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="admin-signin__input"
              placeholder="••••••••"
            />
          </label>

          {error && <div className="admin-signin__error">{error}</div>}

          <button type="submit" className="admin-signin__button" disabled={isLoading}>
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>

          <div className="admin-signin__forgot-password">
            <button 
              type="button"
              onClick={() => setShowResetPassword(true)}
              className="admin-signin__forgot-link"
            >
              Forgot Password?
            </button>
          </div>
        </form>
      </div>

      {showResetPassword && (
        <ResetPassword
          onClose={() => setShowResetPassword(false)}
          onSuccess={() => {
            setEmail('')
            setPassword('')
          }}
        />
      )}
    </div>
  )
}
