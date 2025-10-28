import axios from 'axios';
import { TokenManager } from './api';

// Ensure API_URL always includes /api path
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_URL = BASE_URL.endsWith('/api') ? BASE_URL : `${BASE_URL}/api`;

export interface VendorTrackingDashboardDto {
  vendorId: string;
  vendor: {
    id: string;
    companyName: string;
    contactPersonName: string;
    contactPhone: string;
    fillRate?: number;
    slaComplianceRate?: number;
    user: {
      id: string;
      email?: string;
      name: string;
      status: string;
    };
  };
  metrics: {
    totalOrders: number;
    activeOrders: number;
    completedOrders: number;
    fillRate: number;
    slaCompliance: number;
    avgFulfillmentTime: number;
    completionRate: number;
  };
  lastActivity?: Date;
  status: 'ACTIVE' | 'INACTIVE' | 'NO_ORDERS';
}

export interface VendorTrackingDashboardResponse {
  summary: {
    totalVendors: number;
    averageFillRate: number;
    averageSlaCompliance: number;
    totalActiveOrders: number;
    totalCompletedOrders: number;
  };
  vendors: VendorTrackingDashboardDto[];
}

export interface VendorFillRateDto {
  vendorId: string;
  vendor: {
    id: string;
    companyName: string;
    contactPersonName: string;
    contactPhone: string;
    fillRate?: number;
    slaComplianceRate?: number;
    user: {
      id: string;
      email?: string;
      name: string;
      status: string;
    };
  };
  totalOrders: number;
  totalAssignedQuantity: number;
  totalConfirmedQuantity: number;
  calculatedFillRate: number;
  currentFillRate: number;
}

export interface VendorPerformanceMetricsDto {
  vendor: {
    id: string;
    companyName: string;
    contactPersonName: string;
    contactPhone: string;
    fillRate?: number;
    slaComplianceRate?: number;
    user: {
      id: string;
      email?: string;
      name: string;
      status: string;
    };
  };
  metrics: {
    totalOrders: number;
    totalAssignedQuantity: number;
    totalConfirmedQuantity: number;
    calculatedFillRate: number;
    currentFillRate: number;
  };
  statusBreakdown: {
    status: string;
    count: number;
    assignedQuantity: number;
    confirmedQuantity: number;
  }[];
  recentAssignments: {
    id: string;
    status: string;
    assignedQuantity: number;
    confirmedQuantity?: number;
    assignedAt: Date;
    vendorActionAt?: Date;
    orderItem: {
      productName: string;
      quantity: number;
      order: {
        orderNumber: string;
        createdAt: Date;
      };
    };
  }[];
}

export interface VendorSlaDto {
  vendorId: string;
  vendor: {
    id: string;
    companyName: string;
    contactPersonName: string;
    contactPhone: string;
    fillRate?: number;
    slaComplianceRate?: number;
    user: {
      id: string;
      email?: string;
      name: string;
      status: string;
    };
  };
  metrics: {
    avgFulfillmentTime: number;
    slaBenchmark: number;
    bufferPercentage: number;
    totalHistoricalOrders: number;
    compliantOrders: number;
    slaComplianceRate: number;
  };
  currentOrders: {
    orderNumber: string;
    daysSinceAssigned: number;
    status: string;
  }[];
  historicalData?: {
    orderNumber: string;
    fulfillmentTime: number;
    assignedAt: Date;
    completedAt: Date;
  }[];
  slaStatus: 'MET' | 'BREACHED' | 'NO_CURRENT_ORDERS';
  lastUpdated: Date;
}

export interface VendorTrackingQueryParams {
  vendorId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface VendorSlaQueryParams {
  bufferPercentage?: number;
  lookbackDays?: number;
}

class VendorTrackingApiService {
  private getAuthHeader() {
    const token = TokenManager.getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /**
   * Get comprehensive vendor tracking dashboard data
   */
  async getVendorTrackingDashboard(params?: VendorTrackingQueryParams): Promise<VendorTrackingDashboardResponse> {
    const response = await axios.get(`${API_URL}/vendor-tracking/dashboard`, {
      headers: this.getAuthHeader(),
      params,
    });
    return response.data.data;
  }

  /**
   * Get vendor tracking data with fill rate calculations
   */
  async getVendorTracking(params?: VendorTrackingQueryParams): Promise<{
    assignments: any[];
    vendorFillRates: VendorFillRateDto[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }> {
    const response = await axios.get(`${API_URL}/vendor-tracking`, {
      headers: this.getAuthHeader(),
      params,
    });
    return response.data.data;
  }

  /**
   * Get fill rates for all vendors
   */
  async getVendorFillRates(params?: {
    startDate?: string;
    endDate?: string;
    vendorId?: string;
  }): Promise<VendorFillRateDto[]> {
    const response = await axios.get(`${API_URL}/vendor-tracking/fill-rates`, {
      headers: this.getAuthHeader(),
      params,
    });
    return response.data.data;
  }

  /**
   * Get detailed performance metrics for a specific vendor
   */
  async getVendorPerformanceMetrics(vendorId: string, params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<VendorPerformanceMetricsDto> {
    const response = await axios.get(`${API_URL}/vendor-tracking/${vendorId}/metrics`, {
      headers: this.getAuthHeader(),
      params,
    });
    return response.data.data;
  }

  /**
   * Get vendor performance comparison
   */
  async getVendorPerformanceComparison(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{
    summary: {
      totalVendors: number;
      averageFillRate: number;
      highestFillRate: number;
      lowestFillRate: number;
    };
    topPerformers: VendorFillRateDto[];
    bottomPerformers: VendorFillRateDto[];
    allVendors: VendorFillRateDto[];
  }> {
    const response = await axios.get(`${API_URL}/vendor-tracking/performance-comparison`, {
      headers: this.getAuthHeader(),
      params,
    });
    return response.data.data;
  }

  /**
   * Get vendor fill rate history
   */
  async getVendorFillRateHistory(vendorId: string, params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{
    vendor: VendorFillRateDto['vendor'];
    currentFillRate: number;
    calculatedFillRate: number;
    metrics: {
      totalOrders: number;
      totalAssignedQuantity: number;
      totalConfirmedQuantity: number;
    };
  }> {
    const response = await axios.get(`${API_URL}/vendor-tracking/${vendorId}/fill-rate-history`, {
      headers: this.getAuthHeader(),
      params,
    });
    return response.data.data;
  }

  /**
   * Update fill rate for a specific vendor (Admin only)
   */
  async updateVendorFillRate(vendorId: string, fillRate: number): Promise<{
    vendorId: string;
    fillRate: number;
  }> {
    const response = await axios.put(`${API_URL}/vendor-tracking/${vendorId}/fill-rate`, {
      fillRate,
    }, {
      headers: this.getAuthHeader(),
    });
    return response.data.data;
  }

  /**
   * Bulk update fill rates for all vendors (Admin only)
   */
  async bulkUpdateFillRates(force?: boolean): Promise<{
    updated: number;
    errorCount: number;
    errors: string[];
  }> {
    const response = await axios.post(`${API_URL}/vendor-tracking/bulk-update-fill-rates`, {
      force,
    }, {
      headers: this.getAuthHeader(),
    });
    return response.data.data;
  }

  /**
   * Get SLA compliance for all vendors
   */
  async getVendorSla(params?: VendorSlaQueryParams): Promise<VendorSlaDto[]> {
    const response = await axios.get(`${API_URL}/vendor-tracking/sla`, {
      headers: this.getAuthHeader(),
      params,
    });
    return response.data.data;
  }

  /**
   * Get performance trends for a specific vendor
   */
  async getVendorPerformanceTrends(vendorId: string, timeFilter: 'days' | 'weeks' | 'months' = 'days'): Promise<{
    trends: {
      period: string;
      fillRate: number;
      slaCompliance: number;
    }[];
    fulfillment: {
      period: string;
      fulfillmentTime: number;
      slaCompliance: number;
    }[];
  }> {
    const response = await axios.get(`${API_URL}/vendor-tracking/${vendorId}/performance-trends`, {
      headers: this.getAuthHeader(),
      params: { timeFilter },
    });
    return response.data.data;
  }

  /**
   * Get detailed SLA metrics for a specific vendor
   */
  async getVendorSlaMetrics(vendorId: string, params?: VendorSlaQueryParams): Promise<VendorSlaDto> {
    const response = await axios.get(`${API_URL}/vendor-tracking/${vendorId}/sla`, {
      headers: this.getAuthHeader(),
      params,
    });
    return response.data.data;
  }
}

export const vendorTrackingApi = new VendorTrackingApiService();
