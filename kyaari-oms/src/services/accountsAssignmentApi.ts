import api from './api'
import toast from 'react-hot-toast'

// Frontend types matching the accounts UI
export type OrderStatus = 'Confirmed' | 'Awaiting PO' | 'PO Generated' | 'Delivered' | 'Closed'
export type POStatus = 'Pending' | 'Generated'
export type InvoiceStatus = 'Not Created' | 'Awaiting Validation' | 'Approved'

export interface VendorOrderItem {
  sku: string
  product: string
  qty: number
  confirmedQty: number
}

export interface VendorOrder {
  id: string
  vendorId: string
  vendorName: string
  items: VendorOrderItem[]
  orderStatus: OrderStatus
  poStatus: POStatus
  invoiceStatus: InvoiceStatus
  orderDate: string
  confirmationDate: string
  orderNumber: string
  orderId: string
  totalAmount: number
  accountInvoiceUrl?: string | null
  vendorInvoiceUrl?: string | null
}

export interface VendorOrderListResponse {
  orders: VendorOrder[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// Query parameters for filtering vendor orders
export interface AccountsVendorOrderQueryParams {
  page?: number
  limit?: number
  vendorId?: string
  vendorName?: string
  orderStatus?: OrderStatus
  poStatus?: POStatus
  invoiceStatus?: InvoiceStatus
  startDate?: string
  endDate?: string
  orderNumber?: string
}

// Accounts Assignment API Service
export class AccountsAssignmentApiService {
  
  /**
   * Get all confirmed vendor orders for accounts team
   */
  static async getConfirmedVendorOrders(params?: AccountsVendorOrderQueryParams): Promise<VendorOrderListResponse> {
    try {
      const queryParams = new URLSearchParams()
      
      if (params?.page) queryParams.append('page', params.page.toString())
      if (params?.limit) queryParams.append('limit', params.limit.toString())
      if (params?.vendorId) queryParams.append('vendorId', params.vendorId)
      if (params?.vendorName) queryParams.append('vendorName', params.vendorName)
      if (params?.orderStatus) queryParams.append('orderStatus', params.orderStatus)
      if (params?.poStatus) queryParams.append('poStatus', params.poStatus)
      if (params?.invoiceStatus) queryParams.append('invoiceStatus', params.invoiceStatus)
      if (params?.startDate) queryParams.append('startDate', params.startDate)
      if (params?.endDate) queryParams.append('endDate', params.endDate)
      if (params?.orderNumber) queryParams.append('orderNumber', params.orderNumber)

      const queryString = queryParams.toString()
      const url = `/api/assignments/accounts/vendor-orders${queryString ? `?${queryString}` : ''}`
      
      const response = await api.get<{
        success: boolean
        data: VendorOrderListResponse
      }>(url)

      return response.data.data
    } catch (error) {
      console.error('Failed to fetch vendor orders:', error)
      toast.error('Failed to load vendor orders')
      throw error
    }
  }

  /**
   * Get single vendor order details
   */
  static async getVendorOrderById(id: string): Promise<VendorOrder> {
    try {
      const response = await api.get<{
        success: boolean
        data: VendorOrder
      }>(`/api/assignments/accounts/vendor-orders/${id}`)

      return response.data.data
    } catch (error) {
      console.error('Failed to fetch vendor order details:', error)
      toast.error('Failed to load vendor order details')
      throw error
    }
  }

  /**
   * Generate PO for vendor order
   * TODO: Implement when PO generation endpoint is ready
   */
  static async generatePO(orderId: string, vendorId: string): Promise<void> {
    try {
      // This endpoint needs to be implemented in the backend
      await api.post(`/api/po/generate`, {
        orderId,
        vendorId
      })
      
      toast.success('PO generated successfully')
    } catch (error) {
      console.error('Failed to generate PO:', error)
      toast.error('Failed to generate PO')
      throw error
    }
  }

  /**
   * Bulk generate POs
   * TODO: Implement when bulk PO generation endpoint is ready
   */
  static async bulkGeneratePO(orderIds: string[]): Promise<void> {
    try {
      // This endpoint needs to be implemented in the backend
      await api.post(`/api/po/bulk-generate`, {
        orderIds
      })
      
      toast.success(`POs generated for ${orderIds.length} orders`)
    } catch (error) {
      console.error('Failed to bulk generate POs:', error)
      toast.error('Failed to generate POs')
      throw error
    }
  }
}

