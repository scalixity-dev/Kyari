import api from './api'
import toast from 'react-hot-toast'

// =============================================
// TYPES & INTERFACES
// =============================================

export interface ReceivedOrderItem {
  id: string
  assignedOrderItemId: string
  productName: string
  sku: string
  quantityInvoiced: number
  quantityDispatched: number
  orderNumber: string
}

export interface ReceivedOrder {
  id: string
  orderNumber: string
  vendor: {
    name: string
    id: string
    email: string
  }
  submittedAt: string
  items: number
  quantityInvoiced: number
  quantityReceived: number
  status: 'pending' | 'verified' | 'mismatch'
  dispatchId: string
  grnNumber?: string
  ticketId?: string
  ticketNumber?: string
  verifiedBy?: string
  verifiedAt?: string
  itemDetails: ReceivedOrderItem[]
}

export interface ReceivedOrdersResponse {
  success: boolean
  data: {
    orders: ReceivedOrder[]
    pagination: {
      currentPage: number
      totalPages: number
      totalItems: number
      itemsPerPage: number
    }
  }
}

export interface ReceivedOrderMetrics {
  pending: number
  verified: number
  mismatch: number
  total: number
}

export interface VendorMismatchAnalysis {
  vendorName: string
  vendorId: string
  totalOrders: number
  mismatchOrders: number
  mismatchPercentage: number
  performance: 'Excellent' | 'Good' | 'Needs Attention'
  contactEmail: string | null
}

export interface VerifyOrderRequest {
  verificationNotes?: string
}

export interface RaiseTicketRequest {
  issueType: 'qty-mismatch' | 'damaged' | 'missing-item'
  comments: string
  mismatches: Array<{
    grnItemId: string
    assignedOrderItemId: string
    assignedQuantity: number
    confirmedQuantity: number
    receivedQuantity: number
    discrepancyQuantity: number
    status: 'QUANTITY_MISMATCH' | 'DAMAGE_REPORTED' | 'SHORTAGE_REPORTED'
    itemRemarks?: string
    damageReported?: boolean
    damageDescription?: string
  }>
  operatorRemarks?: string
}

// =============================================
// RECEIVED ORDERS API SERVICE
// =============================================

export class ReceivedOrdersApiService {
  /**
   * Get received orders with filters
   */
  static async getReceivedOrders(params?: {
    page?: number
    limit?: number
    vendor?: string
    status?: string
    orderNumber?: string
    dateFrom?: string
    dateTo?: string
  }): Promise<ReceivedOrdersResponse> {
    try {
      const queryParams = new URLSearchParams()
      
      if (params?.page) queryParams.append('page', params.page.toString())
      if (params?.limit) queryParams.append('limit', params.limit.toString())
      if (params?.vendor) queryParams.append('vendor', params.vendor)
      if (params?.status) queryParams.append('status', params.status)
      if (params?.orderNumber) queryParams.append('orderNumber', params.orderNumber)
      if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom)
      if (params?.dateTo) queryParams.append('dateTo', params.dateTo)

      const response = await api.get<ReceivedOrdersResponse>(
        `/api/ops/received-orders${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      )
      
      return response.data
    } catch (error) {
      console.error('Failed to fetch received orders:', error)
      toast.error('Failed to load received orders')
      throw error
    }
  }

  /**
   * Get received order details
   */
  static async getReceivedOrderDetails(orderId: string) {
    try {
      const response = await api.get(`/api/ops/received-orders/${orderId}`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch received order details:', error)
      toast.error('Failed to load order details')
      throw error
    }
  }

  /**
   * Verify received order as OK
   */
  static async verifyOrder(orderId: string, data: VerifyOrderRequest) {
    try {
      const response = await api.post(`/api/ops/received-orders/${orderId}/verify`, data)
      toast.success('Order verified successfully')
      return response.data
    } catch (error) {
      console.error('Failed to verify order:', error)
      toast.error('Failed to verify order')
      throw error
    }
  }

  /**
   * Raise ticket for mismatch
   */
  static async raiseTicket(orderId: string, data: RaiseTicketRequest) {
    try {
      const response = await api.post(`/api/ops/received-orders/${orderId}/raise-ticket`, data)
      toast.success('Ticket raised successfully')
      return response.data
    } catch (error) {
      console.error('Failed to raise ticket:', error)
      const msg = (error as { response?: { data?: { error?: string; message?: string } }; message?: string })?.response?.data?.error 
        || (error as { response?: { data?: { error?: string; message?: string } }; message?: string })?.response?.data?.message 
        || (error as { message?: string })?.message 
        || 'Failed to raise ticket'
      toast.error(msg)
      throw error
    }
  }

  /**
   * Get received orders metrics
   */
  static async getMetrics(): Promise<{ success: boolean; data: ReceivedOrderMetrics }> {
    try {
      const response = await api.get<{ success: boolean; data: ReceivedOrderMetrics }>(
        '/api/ops/received-orders/metrics'
      )
      return response.data
    } catch (error) {
      console.error('Failed to fetch metrics:', error)
      toast.error('Failed to load metrics')
      throw error
    }
  }

  /**
   * Get vendor-wise mismatch analysis
   */
  static async getVendorMismatchAnalysis(params?: {
    dateFrom?: string
    dateTo?: string
  }): Promise<{ success: boolean; data: VendorMismatchAnalysis[] }> {
    try {
      const queryParams = new URLSearchParams()
      
      if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom)
      if (params?.dateTo) queryParams.append('dateTo', params.dateTo)

      const response = await api.get<{ success: boolean; data: VendorMismatchAnalysis[] }>(
        `/api/ops/received-orders/vendor-mismatch${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      )
      
      return response.data
    } catch (error) {
      console.error('Failed to fetch vendor mismatch analysis:', error)
      toast.error('Failed to load vendor mismatch analysis')
      throw error
    }
  }
}

export default ReceivedOrdersApiService

