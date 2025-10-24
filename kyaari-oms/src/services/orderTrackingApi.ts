import api from './api';

// Types for order tracking
export interface OrderTrackingItem {
  id: string;
  orderId: string;
  orderNumber: string;
  clientOrderId: string;
  productName: string;
  sku?: string;
  quantity: number;
  pricePerUnit?: number;
  totalPrice?: number;
  vendor: {
    id: string;
    companyName: string;
    contactPersonName: string;
    contactPhone: string;
  };
  status: 'Received' | 'Assigned' | 'Confirmed' | 'Invoiced' | 'Dispatched' | 'Verified' | 'Paid';
  assignedQuantity?: number;
  confirmedQuantity?: number;
  vendorRemarks?: string;
  assignedAt?: string;
  vendorActionAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderTrackingSummary {
  totalOrders: number;
  statusCounts: Record<string, number>;
  recentOrders: OrderTrackingItem[];
}

export interface OrderTrackingFilters {
  vendor?: string;
  status?: string;
  qtyMin?: number;
  qtyMax?: number;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface OrderTrackingQuery {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'quantity' | 'status';
  sortOrder?: 'asc' | 'desc';
  filters?: OrderTrackingFilters;
}

export interface OrderTrackingResponse {
  success: boolean;
  data: {
    orders: OrderTrackingItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    summary: OrderTrackingSummary;
  };
  message: string;
}

export interface OrderStatusUpdate {
  orderItemId: string;
  newStatus: 'Received' | 'Assigned' | 'Confirmed' | 'Invoiced' | 'Dispatched' | 'Verified' | 'Paid';
  remarks?: string;
}

export class OrderTrackingApi {
  /**
   * Get order tracking data with filters and pagination
   */
  static async getOrderTracking(query: OrderTrackingQuery = {}): Promise<OrderTrackingResponse> {
    
    const params = new URLSearchParams();
    
    if (query.page) params.append('page', query.page.toString());
    if (query.limit) params.append('limit', query.limit.toString());
    if (query.sortBy) params.append('sortBy', query.sortBy);
    if (query.sortOrder) params.append('sortOrder', query.sortOrder);
    
    if (query.filters) {
      if (query.filters.vendor) params.append('filters.vendor', query.filters.vendor);
      if (query.filters.status) params.append('filters.status', query.filters.status);
      if (query.filters.qtyMin !== undefined) params.append('filters.qtyMin', query.filters.qtyMin.toString());
      if (query.filters.qtyMax !== undefined) params.append('filters.qtyMax', query.filters.qtyMax.toString());
      if (query.filters.dateFrom) params.append('filters.dateFrom', query.filters.dateFrom);
      if (query.filters.dateTo) params.append('filters.dateTo', query.filters.dateTo);
      if (query.filters.search) params.append('filters.search', query.filters.search);
    }

    const url = `/api/order-tracking?${params.toString()}`;


    try {
      const response = await api.get(url);

      return response.data;
    } catch (error: unknown) {

      throw error;
    }
  }

  /**
   * Get order tracking summary
   */
  static async getOrderTrackingSummary(): Promise<{ success: boolean; data: OrderTrackingSummary; message: string }> {
    
    try {
      const response = await api.get('/api/order-tracking/summary');
      return response.data;
    } catch (error: unknown) {
      throw error;
    }
  }

  /**
   * Get specific order details
   */
  static async getOrderById(id: string): Promise<{ success: boolean; data: OrderTrackingItem; message: string }> {
    const response = await api.get(`/api/order-tracking/${id}`);
    return response.data;
  }

  /**
   * Update order status (for drag and drop)
   */
  static async updateOrderStatus(id: string, updateData: OrderStatusUpdate): Promise<{ success: boolean; data: OrderTrackingItem; message: string }> {
    const response = await api.put(`/api/order-tracking/${id}/status`, updateData);
    return response.data;
  }

  /**
   * Export order tracking data as CSV
   */
  static async exportToCSV(filters?: OrderTrackingFilters): Promise<Blob> {
    const params = new URLSearchParams();
    
    if (filters) {
      if (filters.vendor) params.append('filters.vendor', filters.vendor);
      if (filters.status) params.append('filters.status', filters.status);
      if (filters.qtyMin !== undefined) params.append('filters.qtyMin', filters.qtyMin.toString());
      if (filters.qtyMax !== undefined) params.append('filters.qtyMax', filters.qtyMax.toString());
      if (filters.dateFrom) params.append('filters.dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('filters.dateTo', filters.dateTo);
      if (filters.search) params.append('filters.search', filters.search);
    }

    const response = await api.get(`/api/order-tracking/export/csv?${params.toString()}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  /**
   * Export order tracking data as PDF
   */
  static async exportToPDF(filters?: OrderTrackingFilters): Promise<Blob> {
    const params = new URLSearchParams();
    
    if (filters) {
      if (filters.vendor) params.append('filters.vendor', filters.vendor);
      if (filters.status) params.append('filters.status', filters.status);
      if (filters.qtyMin !== undefined) params.append('filters.qtyMin', filters.qtyMin.toString());
      if (filters.qtyMax !== undefined) params.append('filters.qtyMax', filters.qtyMax.toString());
      if (filters.dateFrom) params.append('filters.dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('filters.dateTo', filters.dateTo);
      if (filters.search) params.append('filters.search', filters.search);
    }

    const response = await api.get(`/api/order-tracking/export/pdf?${params.toString()}`, {
      responseType: 'blob'
    });
    return response.data;
  }
}
