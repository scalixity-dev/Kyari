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
  private static readonly USER_KEY = 'kyaari_user'

  static getAccessToken(): string | null {
    try {
      return localStorage.getItem(this.ACCESS_TOKEN_KEY)
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

  static setAccessToken(accessToken: string): void {
    try {
      localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken)
    } catch (error) {
      console.error('Failed to store access token:', error)
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
      localStorage.removeItem(this.USER_KEY)
    } catch (error) {
      console.error('Failed to clear tokens:', error)
    }
  }
}

// Token refresh state management
let isRefreshing = false;
let refreshPromise: Promise<{ accessToken: string }> | null = null;

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
          let accessToken: string;

          // Check if we're already refreshing tokens to prevent race conditions
          if (isRefreshing && refreshPromise) {
            // Wait for the ongoing refresh to complete
            const result = await refreshPromise;
            accessToken = result.accessToken;
          } else {
            // Start a new refresh process
            isRefreshing = true;
            refreshPromise = axios.post(`${API_BASE_URL}/api/auth/refresh`, {}, {
              withCredentials: true, // Include httpOnly cookies
            }).then(response => {
              // Backend sends: { success: true, data: { accessToken: "..." } }
              const { data } = response.data;
              const { accessToken } = data;
              
              // Store new access token
              TokenManager.setAccessToken(accessToken);
              
              return { accessToken };
            }).catch(error => {
              console.error('Token refresh failed:', error.response?.data || error.message);
              throw error;
            }).finally(() => {
              // Reset refresh state
              isRefreshing = false;
              refreshPromise = null;
            });

            const result = await refreshPromise;
            accessToken = result.accessToken;
          }

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return instance(originalRequest);
        } catch (refreshError) {
          // Refresh failed, clear auth data
          TokenManager.clearAll();
          // Reset refresh state
          isRefreshing = false;
          refreshPromise = null;
          // Don't redirect immediately, let the app handle it
          console.error('Token refresh failed:', refreshError);
          return Promise.reject(error);
        }
      }

      // Handle other errors
      const apiError: ApiError = {
        message: error.response?.data?.message || 'An unexpected error occurred',
        statusCode: error.response?.status || 500,
        errors: error.response?.data?.errors
      }

      // Don't show toast for 401 errors as they should be handled by auth system
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
    TokenManager.setAccessToken(accessToken)
    
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
        user: {
          id: string
          email?: string
          name: string
          status: string
          roles: string[]
          lastLoginAt?: string
          createdAt: string
        }
      }
    }>('/api/auth/me')
    
    const { data } = response.data
    
    // Extract user data from the nested structure
    const userData = data.user;
    const name = userData.name || userData.email || 'Unknown User';
    const nameParts = name.split(' ');
    
    const mappedUser: User = {
      id: userData.id,
      email: userData.email || '',
      firstName: nameParts[0] || name,
      lastName: nameParts.slice(1).join(' ') || '',
      role: userData.roles[0] as User['role'], // Take first role
      status: userData.status
    }
    
    TokenManager.setUser(mappedUser)
    return mappedUser
  }

  static async refreshToken(): Promise<{ accessToken: string }> {
    // Use the same deduplication logic as the interceptor
    if (isRefreshing && refreshPromise) {
      return refreshPromise;
    }

    isRefreshing = true;
    // Use raw axios to avoid triggering interceptors and causing recursive refreshes
    refreshPromise = axios.post<{ 
      success: boolean
      data: { accessToken: string }
    }>(`${API_BASE_URL}/api/auth/refresh`, {}, {
      withCredentials: true // Ensure cookies are sent
    }).then(response => {
      const { data } = response.data;
      // Store new access token only - refresh token stays in httpOnly cookie
      TokenManager.setAccessToken(data.accessToken);
      return { accessToken: data.accessToken };
    }).catch(error => {
      console.error('Token refresh failed:', error.response?.data || error.message);
      throw error;
    }).finally(() => {
      // Reset refresh state
      isRefreshing = false;
      refreshPromise = null;
    });

    return refreshPromise;
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

  // Password Reset endpoints
  static async sendPasswordResetCode(email: string): Promise<{ message: string }> {
    const response = await api.post<{
      success: boolean
      message: string
    }>('/api/auth/forgot-password', { email })
    return { message: response.data.message }
  }

  static async verifyPasswordResetCode(email: string, code: string): Promise<{ valid: boolean; message: string }> {
    const response = await api.post<{
      success: boolean
      data: { valid: boolean; message: string }
    }>('/api/auth/verify-reset-code', { email, code })
    return response.data.data
  }

  static async resetPasswordWithCode(email: string, code: string, newPassword: string, confirmPassword: string): Promise<{ message: string }> {
    const response = await api.post<{
      success: boolean
      message: string
    }>('/api/auth/reset-password', { email, code, newPassword, confirmPassword })
    return { message: response.data.message }
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