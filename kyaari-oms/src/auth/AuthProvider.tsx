import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { ApiService } from '../services/api'
import type { User, LoginRequest } from '../services/api'
import toast from 'react-hot-toast'
import { 
  initializeFirebaseClient, 
  getFCMToken, 
  registerServiceWorker,
  onForegroundMessage,
  isNotificationSupported 
} from '../services/firebase'

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

  // Initialize Firebase and notification handling
  useEffect(() => {
    const initializeFirebase = async () => {
      if (isNotificationSupported()) {
        const initialized = initializeFirebaseClient()
        if (initialized) {
          // Register service worker for background notifications
          await registerServiceWorker()
          
          // Set up foreground message listener
          onForegroundMessage((payload) => {
            console.log('Foreground notification received:', payload)
            
            // Show toast notification for foreground messages
            const body = payload.notification?.body || payload.data?.body || 'New notification received'
            
            toast(body, {
              icon: '🔔',
              duration: 5000,
            })
          })
        }
      }
    }

    initializeFirebase()
  }, [])

  // Register FCM token for authenticated users
  const registerFCMToken = async () => {
    try {
      if (!isNotificationSupported()) {
        console.log('📱 Notifications not supported on this device')
        return
      }

      console.log('🔔 Attempting to register FCM token...')
      const fcmToken = await getFCMToken()
      if (!fcmToken) {
        console.log('⚠️ Could not obtain FCM token - notifications may not work')
        console.log('💡 To enable notifications: Allow notifications in your browser settings')
        return
      }

      console.log('✅ FCM token obtained, registering with backend...')

      // Register token with backend using API service
      const result = await ApiService.registerDeviceToken(fcmToken, 'WEB')
      if (result.success) {
        console.log('FCM token registered successfully')
      } else {
        console.error('Failed to register FCM token:', result.message)
      }
    } catch (error) {
      console.error('Error registering FCM token:', error)
    }
  }

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if user is stored locally
        const storedUser = ApiService.getCurrentUserFromStorage()
        if (storedUser) {
          // First check if we have a valid access token
          if (ApiService.isAuthenticated()) {
            // Try to verify with server
            try {
              const currentUser = await ApiService.getCurrentUser()
              setUser(currentUser)
              return
            } catch (error) {
              // Access token might be expired, try to refresh
              console.log('Access token expired, attempting refresh...')
            }
          }
          
          // Try to refresh token (this will work if refresh token cookie exists)
          try {
            // Add a small delay to avoid race conditions on fast page refreshes
            await new Promise(resolve => setTimeout(resolve, 100))
            await ApiService.refreshToken()
            
            // Add a small delay to ensure token is properly set
            await new Promise(resolve => setTimeout(resolve, 50))
            
            // After refresh, get current user
            const currentUser = await ApiService.getCurrentUser()
            setUser(currentUser)
          } catch (refreshError) {
            // Refresh failed, user needs to login again
            console.log('Token refresh failed on page load, user needs to login')
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
      
      // Register FCM token for push notifications
      if (user?.id) {
        setTimeout(() => {
          registerFCMToken()
        }, 1000) // Small delay to ensure login is fully processed
      }
      
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

  const isAuthenticated = !!user && !loading

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
