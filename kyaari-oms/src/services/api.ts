import axios from 'axios'
import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import toast from 'react-hot-toast'

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// Types for authentication
export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  success: boolean
  message: string
  data: {
    user: {
      id: string
      email: string
      name: string
      status: string
      roles: string[]
      lastLoginAt: string
      createdAt: string
    }
    accessToken: string
    // refreshToken is handled via httpOnly cookies, not returned in response
  }
}

export interface RegisterVendorRequest {
  contactPersonName: string
  email: string
  contactPhone: string
  password: string
  confirmPassword: string
  warehouseLocation: string
  pincode: string
  companyName?: string
  gstNumber?: string
  panNumber?: string
}

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'ADMIN' | 'VENDOR' | 'OPS' | 'ACCOUNTS'
  status: string
}

export interface ApiError {
  message: string
  statusCode: number
  errors?: string[]
}

// Token management
class TokenManager {
  private static readonly ACCESS_TOKEN_KEY = 'kyaari_access_token'
  private static readonly REFRESH_TOKEN_KEY = 'kyaari_refresh_token'
  private static readonly USER_KEY = 'kyaari_user'

  static getAccessToken(): string | null {
    try {
      return localStorage.getItem(this.ACCESS_TOKEN_KEY)
    } catch {
      return null
    }
  }

  static getRefreshToken(): string | null {
    try {
      return localStorage.getItem(this.REFRESH_TOKEN_KEY)
    } catch {
      return null
    }
  }

  static getUser(): User | null {
    try {
      const userStr = localStorage.getItem(this.USER_KEY)
      return userStr ? JSON.parse(userStr) : null
    } catch {
      return null
    }
  }

  static setTokens(accessToken: string, refreshToken: string): void {
    try {
      localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken)
      localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken)
    } catch (error) {
      console.error('Failed to store tokens:', error)
    }
  }

  static setUser(user: User): void {
    try {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user))
    } catch (error) {
      console.error('Failed to store user:', error)
    }
  }

  static clearAll(): void {
    try {
      localStorage.removeItem(this.ACCESS_TOKEN_KEY)
      localStorage.removeItem(this.REFRESH_TOKEN_KEY)
      localStorage.removeItem(this.USER_KEY)
    } catch (error) {
      console.error('Failed to clear tokens:', error)
    }
  }
}

// Create axios instance
const createApiInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    withCredentials: true, // Include cookies in requests for refresh token
    headers: {
      'Content-Type': 'application/json',
    },
  })

  // Request interceptor to add auth token
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = TokenManager.getAccessToken()
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error: any) => {
      return Promise.reject(error)
    }
  )

  // Response interceptor for error handling and token refresh
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      return response
    },
    async (error: any) => {
      const originalRequest = error.config

      // Handle 401 Unauthorized errors
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true

        try {
          const refreshToken = TokenManager.getRefreshToken()
          if (refreshToken) {
            const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
              refreshToken
            })

            const { accessToken, refreshToken: newRefreshToken } = response.data
            TokenManager.setTokens(accessToken, newRefreshToken)

            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${accessToken}`
            return instance(originalRequest)
          }
        } catch (refreshError) {
          // Refresh failed, redirect to login
          TokenManager.clearAll()
          window.location.href = '/'
          return Promise.reject(refreshError)
        }
      }

      // Handle other errors
      const apiError: ApiError = {
        message: error.response?.data?.message || 'An unexpected error occurred',
        statusCode: error.response?.status || 500,
        errors: error.response?.data?.errors
      }

      // Show error toast for user-facing errors
      if (error.response?.status !== 401) {
        toast.error(apiError.message)
      }

      return Promise.reject(apiError)
    }
  )

  return instance
}

// Create API instance
const api = createApiInstance()

// API Service class
export class ApiService {
  // Authentication endpoints
  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/api/auth/login', credentials)
    const { data } = response.data
    const { user, accessToken } = data

    // Store access token only - refresh token is handled via httpOnly cookies
    TokenManager.setTokens(accessToken, '')
    
    // Map backend user format to frontend User format
    const mappedUser: User = {
      id: user.id,
      email: user.email,
      firstName: user.name.split(' ')[0] || user.name,
      lastName: user.name.split(' ').slice(1).join(' ') || '',
      role: user.roles[0] as User['role'], // Take first role
      status: user.status
    }
    
    TokenManager.setUser(mappedUser)

    toast.success(`Welcome back, ${mappedUser.firstName}!`)
    return response.data
  }

  static async registerVendor(data: RegisterVendorRequest): Promise<{ message: string }> {
    const response = await api.post<{ 
      success: boolean
      message: string 
    }>('/api/auth/register/vendor', data)
    toast.success(response.data.message || 'Vendor registration successful! Please wait for admin approval.')
    return { message: response.data.message }
  }

  static async getCurrentUser(): Promise<User> {
    const response = await api.get<{
      success: boolean
      data: {
        id: string
        email?: string
        name: string
        status: string
        roles: string[]
        lastLoginAt?: string
        createdAt: string
      }
    }>('/api/auth/me')
    
    const { data } = response.data
    
    // Map backend user format to frontend User format
    const mappedUser: User = {
      id: data.id,
      email: data.email || '',
      firstName: data.name.split(' ')[0] || data.name,
      lastName: data.name.split(' ').slice(1).join(' ') || '',
      role: data.roles[0] as User['role'], // Take first role
      status: data.status
    }
    
    TokenManager.setUser(mappedUser)
    return mappedUser
  }

  static async refreshToken(): Promise<{ accessToken: string; refreshToken: string }> {
    // Refresh token is sent automatically via httpOnly cookie
    const response = await api.post<{ 
      success: boolean
      data: { accessToken: string }
    }>('/api/auth/refresh')

    const { data } = response.data
    // Store new access token
    const currentRefreshToken = TokenManager.getRefreshToken() || ''
    TokenManager.setTokens(data.accessToken, currentRefreshToken)
    return { accessToken: data.accessToken, refreshToken: currentRefreshToken }
  }

  static async logout(): Promise<void> {
    try {
      await api.post('/api/auth/logout')
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API call failed:', error)
    } finally {
      TokenManager.clearAll()
      toast.success('Logged out successfully')
    }
  }

  // Helper methods
  static isAuthenticated(): boolean {
    return !!TokenManager.getAccessToken()
  }

  static getCurrentUserFromStorage(): User | null {
    return TokenManager.getUser()
  }

  static hasRole(role: string): boolean {
    const user = TokenManager.getUser()
    return user?.role === role
  }

  static clearAuthData(): void {
    TokenManager.clearAll()
  }
}

// Export token manager for direct access if needed
export { TokenManager }

// Export the configured axios instance for custom requests
export default api