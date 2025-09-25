import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'

export default function VendorsSignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { login } = useAuth()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email || !password) {
      setError('Please enter email and password')
      return
    }
    // placeholder auth — accepts any credentials for now
    login(email, password)
    navigate('/vendors')
  }

  return (
    <div className="admin-signin__page">
      <style>{`
        /* Ensure root/container don't constrain full-width pages */
        :root { }
        #root { width: 100% !important; max-width: none !important; }

        .admin-signin__page { display:flex; align-items:center; justify-content:center; min-height:100vh; padding:2rem; background-color: var(--color-header-bg); width:100%; box-sizing:border-box; }
        .admin-signin__card { width:100%; max-width:440px; background:white; padding:2rem; border-radius:12px; box-shadow:0 8px 20px rgba(0,0,0,0.08); text-align:center; box-sizing:border-box; }
        .admin-signin__title { font-family: var(--font-heading); color: var(--color-heading); margin-bottom:1rem; }
        .admin-signin__form { display:flex; flex-direction:column; gap:0.75rem; }
        .admin-signin__label { font-size:0.9rem; text-align:left; color: var(--color-primary); }
        .admin-signin__input { width:100%; padding:0.6rem 0.75rem; border-radius:8px; border:1px solid #e6e6e6; margin-top:0.25rem; box-sizing:border-box; }
        .admin-signin__error { color:#b00020; font-size:0.9rem; text-align:left; }
        .admin-signin__button { margin-top:0.5rem; background-color: var(--color-accent); color: var(--color-button-text); padding:0.75rem 1rem; border-radius:8px; border:none; cursor:pointer; font-weight: var(--fw-bold); }
        .admin-signin__button:hover { opacity:0.95; }
  .admin-signin__signup { margin-top:0.5rem; font-size:0.9rem; color:var(--color-primary); display:flex; justify-content:center; gap:0.5rem; }
  .admin-signin__signup-link { background:transparent; border:none; color:var(--color-accent); cursor:pointer; font-weight:var(--fw-medium); text-decoration:none; padding:0; }
  .admin-signin__signup-link:hover { text-decoration:underline; }
      `}</style>

      <div className="admin-signin__card">
        <h2 className="admin-signin__title">Vendors Sign In</h2>
        <form onSubmit={handleSubmit} className="admin-signin__form">
          <label className="admin-signin__label">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="admin-signin__input"
              placeholder="vendor@kyari.com"
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

          <button type="submit" className="admin-signin__button">Sign In</button>

          <div className="admin-signin__signup">
            <span>Don't have an account?</span>
            <Link to="/vendors/signup" className="admin-signin__signup-link">Sign up</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
