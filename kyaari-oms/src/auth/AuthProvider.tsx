import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { ApiService } from '../services/api'
import type { User, LoginRequest } from '../services/api'
import toast from 'react-hot-toast'

type AuthContextType = {
  user: User | null
  loading: boolean
  login: (credentials: LoginRequest) => Promise<boolean>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if user is stored locally
        const storedUser = ApiService.getCurrentUserFromStorage()
        if (storedUser && ApiService.isAuthenticated()) {
          // Verify with server and refresh user data
          try {
            const currentUser = await ApiService.getCurrentUser()
            setUser(currentUser)
          } catch (error) {
            // Token might be expired, clear local data
            ApiService.clearAuthData()
            setUser(null)
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        ApiService.clearAuthData()
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const login = useCallback(async (credentials: LoginRequest): Promise<boolean> => {
    try {
      setLoading(true)
      await ApiService.login(credentials)
      // Get the user data that was stored by ApiService.login()
      const user = ApiService.getCurrentUserFromStorage()
      setUser(user)
      return true
    } catch (error: any) {
      console.error('Login error:', error)
      toast.error(error.message || 'Login failed')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)
      await ApiService.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      setLoading(false)
    }
  }, [])

  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      if (ApiService.isAuthenticated()) {
        const currentUser = await ApiService.getCurrentUser()
        setUser(currentUser)
      }
    } catch (error) {
      console.error('Refresh user error:', error)
      // If refresh fails, user might need to login again
      setUser(null)
      ApiService.clearAuthData()
    }
  }, [])

  const isAuthenticated = ApiService.isAuthenticated() && !!user

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading, 
        login, 
        logout, 
        refreshUser, 
        isAuthenticated 
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
