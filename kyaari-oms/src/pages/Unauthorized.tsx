import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'

export default function Unauthorized() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleGoToDashboard = () => {
    if (!user) {
      navigate('/')
      return
    }

    // Redirect based on user role
    const roleRoutes: Record<string, string> = {
      'ADMIN': '/admin',
      'ACCOUNTS': '/accounts',
      'OPS': '/operations',
      'VENDOR': '/vendors'
    }

    navigate(roleRoutes[user.role] || '/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
            <svg 
              className="h-8 w-8 text-red-600" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
            </svg>
          </div>
        </div>
        
        <h1 className="text-2xl font-heading font-semibold text-gray-900 mb-2">
          Access Denied
        </h1>
        
        <p className="text-gray-600 mb-6">
          You don't have permission to access this page.
          {user && (
            <>
              <br />
              <span className="font-semibold mt-2 inline-block">
                Your role: {user.role}
              </span>
            </>
          )}
        </p>

        <div className="space-y-3">
          <button
            onClick={handleGoToDashboard}
            className="w-full bg-accent text-button-text py-3 px-4 rounded-lg font-semibold hover:bg-accent/90 transition-colors"
          >
            {user ? 'Go to My Dashboard' : 'Go to Home'}
          </button>
          
          {user && (
            <button
              onClick={() => logout()}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              Sign Out
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

