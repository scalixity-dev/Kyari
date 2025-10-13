import api from './api';

export interface OrderItem {
  id: string;
  productName: string;
  sku?: string;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
  pricingStatus: 'complete';
  assignedItems: AssignedOrderItem[];
}

export interface AssignedOrderItem {
  id: string;
  vendorId: string;
  vendor: VendorSummary;
  assignedQuantity: number;
  confirmedQuantity?: number;
  status: string;
  assignedAt: string;
  vendorActionAt?: string;
}

export interface VendorSummary {
  id: string;
  companyName: string;
  contactPersonName: string;
  contactPhone: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: string;
  source: string;
  primaryVendor: VendorSummary;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id: string;
    name: string;
  };
}

export interface OrderListItem {
  id: string;
  orderNumber: string;
  status: string;
  itemCount: number;
  primaryVendor: {
    companyName: string;
  };
  createdAt: string;
  pricingStatus: 'complete';
}

export interface OrdersResponse {
  orders: OrderListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CreateOrderItem {
  productName: string;
  sku?: string;
  quantity: number;
  pricePerUnit: number;
}

export interface CreateOrderRequest {
  orderNumber: string;
  primaryVendorId: string;
  items: CreateOrderItem[];
}

export interface OrderQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  vendorId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

class OrderApiService {
  private getAuthHeader() {
    const token = localStorage.getItem('accessToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async getOrders(params?: OrderQueryParams): Promise<OrdersResponse> {
    const response = await api.get<{
      success: boolean;
      data: OrdersResponse;
    }>('/api/orders', {
      params,
      headers: this.getAuthHeader()
    });
    return response.data.data;
  }

  async getOrderById(id: string): Promise<Order> {
    const response = await api.get<{
      success: boolean;
      data: Order;
    }>(`/api/orders/${id}`, {
      headers: this.getAuthHeader()
    });
    return response.data.data;
  }

  async createOrder(data: CreateOrderRequest): Promise<Order> {
    const response = await api.post<{
      success: boolean;
      data: Order;
      message: string;
    }>('/api/orders', data, {
      headers: this.getAuthHeader()
    });
    return response.data.data;
  }

  async updateOrderStatus(id: string, status: string): Promise<Order> {
    const response = await api.put<{
      success: boolean;
      data: Order;
    }>(`/api/orders/${id}/status`, { status }, {
      headers: this.getAuthHeader()
    });
    return response.data.data;
  }

  async cancelOrder(id: string): Promise<void> {
    await api.put(`/api/orders/${id}/cancel`, {}, {
      headers: this.getAuthHeader()
    });
  }

  async deleteOrder(id: string): Promise<void> {
    await api.delete(`/api/orders/${id}`, {
      headers: this.getAuthHeader()
    });
  }

  async assignVendor(id: string, vendorId: string): Promise<Order> {
    const response = await api.put<{
      success: boolean;
      data: Order;
    }>(`/api/orders/${id}/assign-vendor`, { vendorId }, {
      headers: this.getAuthHeader()
    });
    return response.data.data;
  }

  async uploadExcel(file: File): Promise<{
    successCount: number;
    failedCount: number;
    errors: { orderNumber: string; error: string }[];
  }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<{
      success: boolean;
      data: {
        successCount: number;
        failedCount: number;
        errors: { orderNumber: string; error: string }[];
        createdOrders: Order[];
      };
    }>('/api/orders/upload-excel', formData, {
      headers: {
        ...this.getAuthHeader(),
        'Content-Type': 'multipart/form-data'
      }
    });

    return {
      successCount: response.data.data.successCount,
      failedCount: response.data.data.failedCount,
      errors: response.data.data.errors
    };
  }

  async downloadExcelTemplate(): Promise<Blob> {
    const response = await api.get('/api/orders/excel-template', {
      headers: this.getAuthHeader(),
      responseType: 'blob'
    });
    return response.data;
  }
}

export const orderApi = new OrderApiService();

