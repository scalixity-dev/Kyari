import axios from 'axios';
import { TokenManager } from './api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface VendorProfile {
  id: string;
  userId: string;
  companyName: string;
  contactPersonName: string;
  contactPhone: string;
  warehouseLocation: string;
  pincode: string;
  gstNumber?: string;
  panNumber?: string;
  verified: boolean;
  verifiedAt?: string;
  verifiedBy?: string;
  fillRate?: number;
  slaComplianceRate?: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email?: string;
    name: string;
    status: string;
  };
}

export interface VendorListItem {
  id: string;
  userId: string;
  companyName: string;
  contactPersonName: string;
  contactPhone: string;
  warehouseLocation: string;
  pincode: string;
  email?: string;
  status: string;
  verified: boolean;
  fillRate?: number;
  slaComplianceRate?: number;
  createdAt: string;
}

export interface VendorsResponse {
  vendors: VendorListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface UpdateVendorProfilePayload {
  companyName?: string;
  contactPersonName?: string;
  contactPhone?: string;
  warehouseLocation?: string;
  pincode?: string;
  gstNumber?: string;
  panNumber?: string;
}

export interface VendorStats {
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  fillRate: number;
  slaCompliance: number;
  totalRevenue: number;
}

class VendorApiService {
  private getAuthHeader() {
    const token = TokenManager.getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /**
   * Get all vendors (Admin only)
   */
  async getVendors(params?: {
    status?: string;
    verified?: boolean;
    page?: number;
    limit?: number;
  }): Promise<VendorsResponse> {
    const response = await axios.get(`${API_URL}/vendors`, {
      headers: this.getAuthHeader(),
      params: {
        status: params?.status,
        verified: params?.verified,
        page: params?.page || 1,
        limit: params?.limit || 50,
      },
    });
    return response.data.data;
  }

  /**
   * Get vendor by ID (Admin only)
   */
  async getVendorById(id: string): Promise<VendorProfile> {
    const response = await axios.get(`${API_URL}/vendors/${id}`, {
      headers: this.getAuthHeader(),
    });
    return response.data.data;
  }

  /**
   * Get current vendor's profile
   */
  async getMyProfile(): Promise<VendorProfile> {
    const response = await axios.get(`${API_URL}/vendors/profile`, {
      headers: this.getAuthHeader(),
    });
    return response.data.data;
  }

  /**
   * Update vendor profile
   */
  async updateProfile(payload: UpdateVendorProfilePayload): Promise<VendorProfile> {
    const response = await axios.patch(`${API_URL}/vendors/profile`, payload, {
      headers: this.getAuthHeader(),
    });
    return response.data.data;
  }

  /**
   * Approve vendor (Admin only)
   */
  async approveVendor(userId: string): Promise<void> {
    await axios.patch(
      `${API_URL}/vendors/${userId}/approve`,
      {},
      {
        headers: this.getAuthHeader(),
      }
    );
  }

  /**
   * Suspend vendor (Admin only)
   */
  async suspendVendor(userId: string): Promise<void> {
    await axios.patch(
      `${API_URL}/vendors/${userId}/suspend`,
      {},
      {
        headers: this.getAuthHeader(),
      }
    );
  }

  /**
   * Get vendor statistics
   */
  async getStats(): Promise<VendorStats> {
    const response = await axios.get(`${API_URL}/vendors/stats`, {
      headers: this.getAuthHeader(),
    });
    return response.data.data;
  }
}

export const vendorApi = new VendorApiService();

