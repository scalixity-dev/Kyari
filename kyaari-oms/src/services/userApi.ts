import axios from 'axios';
import { TokenManager } from './api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface User {
  id: string;
  name: string;
  email: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  roles: string[];
  createdAt: string;
  lastLoginAt?: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  role: 'ADMIN' | 'ACCOUNTS' | 'OPS';
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  role?: 'ADMIN' | 'ACCOUNTS' | 'OPS';
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class UserApiService {
  private getAuthHeader() {
    const token = TokenManager.getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /**
   * Get all users with optional filters
   */
  async getUsers(params?: {
    role?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<UsersResponse> {
    const response = await axios.get(`${API_URL}/users`, {
      headers: this.getAuthHeader(),
      params: {
        role: params?.role,
        status: params?.status,
        page: params?.page || 1,
        limit: params?.limit || 50,
      },
    });
    return response.data.data;
  }

  /**
   * Get single user by ID
   */
  async getUserById(id: string): Promise<User> {
    const response = await axios.get(`${API_URL}/users/${id}`, {
      headers: this.getAuthHeader(),
    });
    return response.data.data;
  }

  /**
   * Create new user
   */
  async createUser(payload: CreateUserPayload): Promise<User> {
    const response = await axios.post(`${API_URL}/users`, payload, {
      headers: this.getAuthHeader(),
    });
    return response.data.data.user;
  }

  /**
   * Update user
   */
  async updateUser(id: string, payload: UpdateUserPayload): Promise<User> {
    const response = await axios.patch(`${API_URL}/users/${id}`, payload, {
      headers: this.getAuthHeader(),
    });
    return response.data.data;
  }

  /**
   * Toggle user status (activate/deactivate)
   */
  async toggleUserStatus(id: string, status: 'ACTIVE' | 'INACTIVE'): Promise<User> {
    const response = await axios.patch(
      `${API_URL}/users/${id}/status`,
      { status },
      {
        headers: this.getAuthHeader(),
      }
    );
    return response.data.data;
  }

  /**
   * Delete user (soft delete)
   */
  async deleteUser(id: string): Promise<void> {
    await axios.delete(`${API_URL}/users/${id}`, {
      headers: this.getAuthHeader(),
    });
  }
}

export const userApi = new UserApiService();

