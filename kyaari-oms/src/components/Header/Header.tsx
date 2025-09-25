import { Link, useNavigate } from 'react-router-dom'
import styles from './Header.module.css'
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
    <header className={styles.header}>
      <div className={styles.left}>
        <Link to="/">
          <img src={kyariLogo} alt="Kyari" className={styles.logo} />
        </Link>
      </div>
      <div className={styles.right}>
        {user ? (
          <>
            <span className={styles.welcome}>Hi, {user.email}</span>
            <button className={styles.logout} onClick={handleLogout}>Logout</button>
          </>
        ) : null}
      </div>
    </header>
  )
}
