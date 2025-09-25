import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthProvider'

type Props = {
  children: React.ReactElement
  redirectTo?: string
}

export default function ProtectedRoute({ children, redirectTo = '/admin/signin' }: Props) {
  const { user } = useAuth()
  if (!user) return <Navigate to={redirectTo} replace />
  return children
}
