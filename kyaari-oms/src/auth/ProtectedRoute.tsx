import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider'
import type { ReactElement } from 'react'

export default function ProtectedRoute({ 
  children, 
  redirectTo = '/', 
  requiredRole,
}: {
  children: ReactElement
  redirectTo?: string
  requiredRole?: string | string[]
}) {
  const { user, loading, isAuthenticated } = useAuth()
  const location = useLocation()

  // Show loading spinner while auth is being verified
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    )
  }

  // Redirect to sign-in if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />
  }

  // Check role-based access if required
  if (requiredRole) {
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    
    if (!allowedRoles.includes(user.role)) {
      // User is authenticated but doesn't have required role
      // Redirect to their appropriate dashboard
      const roleRedirects: Record<string, string> = {
        'ADMIN': '/admin/signin',
        'ACCOUNTS': '/accounts/signin',
        'OPS': '/operations/signin',
        'VENDOR': '/vendors/signin'
      }
      
      const targetRedirect = roleRedirects[user.role] || redirectTo
      
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
            <div className="mb-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
            <p className="text-sm text-gray-600 mb-4">
              You don't have permission to access this area. Your role is <strong>{user.role}</strong>.
            </p>
            <button
              onClick={() => window.location.href = targetRedirect}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Go to Your Dashboard
            </button>
          </div>
        </div>
      )
    }
  }

  // Check user status
  if (user.status !== 'ACTIVE') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="mb-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
              <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Account Pending</h3>
          <p className="text-sm text-gray-600 mb-4">
            Your account is currently {user.status.toLowerCase()}. 
            {user.status === 'PENDING' && ' Please wait for admin approval.'}
            {user.status === 'SUSPENDED' && ' Please contact support for assistance.'}
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    )
  }

  return children
}
