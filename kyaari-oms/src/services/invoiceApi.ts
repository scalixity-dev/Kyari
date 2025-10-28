import api from './api'
import toast from 'react-hot-toast'

// Invoice types
export type POStatus = 'Pending' | 'Generated'

export interface InvoiceItem {
  sku: string
  productName: string
  quantity: number
  pricePerUnit: number
  amount: number
}

export interface Invoice {
  id: string
  orderId: string
  orderNumber: string
  vendorId: string
  vendorName: string
  items: InvoiceItem[]
  totalAmount: number
  invoiceNumber?: string
  generatedAt?: string
  invoiceFileUrl?: string
  status: 'DRAFT' | 'GENERATED' | 'SENT' | 'PAID'
}

export interface POOrder {
  id: string
  orderId: string
  orderNumber: string
  vendor: string
  vendorId: string
  confirmedQty: number
  poStatus: POStatus
  items: string
  amount: number
  poNumber: string | null
  accountInvoice: string | null
  vendorInvoice: string | null
  invoiceId: string | null
}

export interface GenerateInvoicePayload {
  orderId: string
  vendorId: string
  items: InvoiceItem[]
  totalAmount: number
}

export interface UploadInvoiceResponse {
  success: boolean
  data: {
    fileUrl: string
    invoiceId?: string
  }
}

// Invoice API Service
export class InvoiceApiService {

  /**
   * Get all PO orders ready for invoice generation
   * This fetches confirmed vendor orders from the assignments API
   */
  static async getPOOrders(): Promise<POOrder[]> {
    try {
      const response = await api.get<{
        success: boolean
        data: {
          orders: Array<{
            id: string
            orderId: string
            orderNumber: string
            vendorId: string
            vendorName: string
            items: Array<{
              sku: string
              product: string
              qty: number
              confirmedQty: number
            }>
            orderStatus: string
            poStatus: 'Pending' | 'Generated'
            invoiceStatus: string
            orderDate: string
            confirmationDate: string
            totalAmount: number
            poNumber?: string | null
            accountInvoiceUrl?: string | null
            vendorInvoiceUrl?: string | null
            invoiceId?: string | null
          }>
        }
      }>('/api/assignments/accounts/vendor-orders?limit=100')

      // Transform to PO orders format
      const poOrders: POOrder[] = response.data.data.orders.map(order => {
        const totalQty = order.items.reduce((sum, item) => sum + item.confirmedQty, 0)
        const itemsStr = order.items.map(item => `${item.product} (${item.confirmedQty})`).join(', ')

        return {
          id: order.id,
          orderId: order.orderId,
          orderNumber: order.orderNumber,
          vendor: order.vendorName,
          vendorId: order.vendorId,
          confirmedQty: totalQty,
          poStatus: order.poStatus,
          items: itemsStr,
          amount: order.totalAmount, // Use actual total amount from backend
          poNumber: order.poNumber ?? null, // Actual PO number from backend
          accountInvoice: order.accountInvoiceUrl ?? null, // Actual URL from backend
          vendorInvoice: order.vendorInvoiceUrl ?? null, // Actual URL from backend
          invoiceId: order.invoiceId ?? null  // Invoice ID for fetching JSON data
        }
      })

      return poOrders
    } catch (error) {
      console.error('Failed to fetch PO orders:', error)
      toast.error('Failed to load PO orders')
      throw error
    }
  }

  /**
   * Generate invoice in JSON format and return the full invoice object
   */
  static async generateInvoice(payload: GenerateInvoicePayload): Promise<Record<string, unknown>> {
    try {
      const response = await api.post<{
        success: boolean
        data: Record<string, unknown>
      }>('/api/invoices/generate', {
        orderId: payload.orderId,
        vendorId: payload.vendorId
      })

      toast.success('Invoice generated successfully')
      return response.data.data
    } catch (error) {
      console.error('Failed to generate invoice:', error)
      toast.error('Failed to generate invoice')
      throw error
    }
  }

  /**
   * Get invoice data by ID (returns full JSON)
   */
  static async getInvoiceJson(invoiceId: string): Promise<Record<string, unknown>> {
    try {
      const response = await api.get<{
        success: boolean
        data: Record<string, unknown>
      }>(`/api/invoices/${invoiceId}`)

      return response.data.data
    } catch (error) {
      console.error('Failed to fetch invoice JSON:', error)
      toast.error('Failed to load invoice data')
      throw error
    }
  }

  /**
   * Download invoice as JSON file from invoice ID
   */
  static async downloadInvoice(invoiceId: string): Promise<void> {
    try {
      const response = await api.get(`/api/invoices/${invoiceId}/download`, {
        responseType: 'blob'
      })

      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `invoice-${invoiceId}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success('Invoice downloaded successfully')
    } catch (error) {
      console.error('Failed to download invoice:', error)
      toast.error('Failed to download invoice')
      throw error
    }
  }

  /**
   * Download JSON data directly (no API call needed)
   */
  static downloadJsonData(jsonData: Record<string, unknown>, filename: string): void {
    const jsonString = JSON.stringify(jsonData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    toast.success('Invoice downloaded successfully')
  }

  /**
   * Upload invoice file to S3
   */
  static async uploadInvoiceFile(file: File, invoiceId?: string): Promise<UploadInvoiceResponse> {
    try {
      const formData = new FormData()
      formData.append('file', file)

      let url = '/api/invoices/upload-and-link'
      if (invoiceId) {
        url = `/api/invoices/${invoiceId}/upload`
      }

      const response = await api.post<UploadInvoiceResponse>(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      toast.success('Invoice uploaded successfully')
      return response.data
    } catch (error) {
      console.error('Failed to upload invoice:', error)
      toast.error('Failed to upload invoice')
      throw error
    }
  }

  /**
   * Upload and link invoice to purchase order
   */
  static async uploadAndLinkInvoice(
    file: File,
    orderId: string,
    vendorId: string,
    invoiceNumber?: string
  ): Promise<UploadInvoiceResponse> {
    try {
      const formData = new FormData()
      formData.append('invoice', file) // Backend expects 'invoice', not 'file'
      formData.append('invoiceType', 'ACCOUNTS_UPLOAD')
      formData.append('orderId', orderId)
      formData.append('vendorId', vendorId)
      if (invoiceNumber) {
        formData.append('invoiceNumber', invoiceNumber)
      }

      const response = await api.post<UploadInvoiceResponse>(
        '/api/invoices/upload-and-link',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      )

      toast.success('Invoice uploaded and linked successfully')
      return response.data
    } catch (error) {
      console.error('Failed to upload and link invoice:', error)
      toast.error('Failed to upload and link invoice')
      throw error
    }
  }

  /**
   * Get uploaded invoices
   */
  static async getUploadedInvoices(filters?: {
    vendorId?: string
    orderId?: string
    status?: string
  }): Promise<Invoice[]> {
    try {
      const queryParams = new URLSearchParams()
      
      if (filters?.vendorId) queryParams.append('vendorId', filters.vendorId)
      if (filters?.orderId) queryParams.append('orderId', filters.orderId)
      if (filters?.status) queryParams.append('status', filters.status)

      const queryString = queryParams.toString()
      const url = `/api/invoices/uploads${queryString ? `?${queryString}` : ''}`

      const response = await api.get<{
        success: boolean
        data: Invoice[]
      }>(url)

      return response.data.data
    } catch (error) {
      console.error('Failed to fetch uploaded invoices:', error)
      toast.error('Failed to load invoices')
      throw error
    }
  }

  /**
   * List all invoices with pagination
   */
  static async listInvoices(params?: {
    page?: number
    limit?: number
    status?: string
    vendorId?: string
  }): Promise<{
    invoices: Invoice[]
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
    }
  }> {
    try {
      const queryParams = new URLSearchParams()
      
      if (params?.page) queryParams.append('page', params.page.toString())
      if (params?.limit) queryParams.append('limit', params.limit.toString())
      if (params?.status) queryParams.append('status', params.status)
      if (params?.vendorId) queryParams.append('vendorId', params.vendorId)

      const queryString = queryParams.toString()
      const url = `/api/invoices${queryString ? `?${queryString}` : ''}`

      const response = await api.get<{
        success: boolean
        data: {
          invoices: Invoice[]
          pagination: {
            page: number
            limit: number
            total: number
            pages: number
          }
        }
      }>(url)

      return response.data.data
    } catch (error) {
      console.error('Failed to fetch invoices:', error)
      toast.error('Failed to load invoices')
      throw error
    }
  }

  /**
   * Get invoice by ID
   */
  static async getInvoiceById(invoiceId: string): Promise<Invoice> {
    try {
      const response = await api.get<{
        success: boolean
        data: Invoice
      }>(`/api/invoices/${invoiceId}`)

      return response.data.data
    } catch (error) {
      console.error('Failed to fetch invoice:', error)
      toast.error('Failed to load invoice details')
      throw error
    }
  }

  // =============================================
  // VENDOR-SPECIFIC INVOICE METHODS (NEW)
  // =============================================

  /**
   * Get vendor invoices with full purchase order and dispatch details
   * This is specifically for the vendor dashboard invoice page
   */
  static async getVendorInvoicesDetailed(params?: {
    page?: number
    limit?: number
    status?: string
    purchaseOrderId?: string
  }): Promise<VendorInvoiceListResponse> {
    try {
      const queryParams = new URLSearchParams()
      
      if (params?.page) queryParams.append('page', params.page.toString())
      if (params?.limit) queryParams.append('limit', params.limit.toString())
      if (params?.status) queryParams.append('status', params.status)
      if (params?.purchaseOrderId) queryParams.append('purchaseOrderId', params.purchaseOrderId)

      const response = await api.get<VendorInvoiceListResponse>(
        `/api/invoices/uploads${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      )
      
      return response.data
    } catch (error) {
      console.error('Failed to fetch vendor invoices:', error)
      toast.error('Failed to load invoices')
      throw error
    }
  }

  /**
   * Upload vendor invoice file to existing invoice/purchase order
   * This is for vendors to upload their invoice documents
   */
  static async uploadVendorInvoice(request: VendorInvoiceUploadRequest): Promise<VendorInvoiceUploadResponse> {
    try {
      const formData = new FormData()
      formData.append('invoice', request.file)
      formData.append('invoiceType', 'VENDOR_UPLOAD')
      if (request.notes) {
        formData.append('notes', request.notes)
      }

      const response = await api.post<VendorInvoiceUploadResponse>(
        `/api/invoices/${request.invoiceId}/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )

      toast.success('Invoice uploaded successfully')
      return response.data
    } catch (error) {
      console.error('Failed to upload vendor invoice:', error)
      toast.error('Failed to upload invoice')
      throw error
    }
  }
}

// =============================================
// VENDOR INVOICE TYPES (NEW)
// =============================================

export interface VendorInvoiceDetailed {
  id: string
  invoiceNumber: string
  invoiceDate: string
  invoiceAmount: number
  status: 'PENDING_VERIFICATION' | 'APPROVED' | 'REJECTED' | 'PAID'
  purchaseOrder: {
    id: string
    poNumber: string
    totalAmount: number
    status: 'DRAFT' | 'ISSUED' | 'ACCEPTED' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED'
    issuedAt: string | null
    createdAt: string
    vendor: {
      id: string
      companyName: string
      contactPersonName: string
    }
    items: VendorPurchaseOrderItem[]
  }
  attachment: {
    id: string
    fileName: string
    s3Url: string
  } | null
  accountsAttachment: {
    id: string
    fileName: string
    s3Url: string
  } | null
  vendorAttachment: {
    id: string
    fileName: string
    s3Url: string
  } | null
  createdAt: string
  updatedAt: string
}

export interface VendorPurchaseOrderItem {
  id: string
  quantity: number
  pricePerUnit: number
  totalPrice: number
  assignedOrderItem: {
    id: string
    assignedQuantity: number
    confirmedQuantity: number | null
    status: string
    orderItem: {
      id: string
      productName: string
      sku: string | null
      orderId: string
      order: {
        id: string
        clientOrderId: string
        orderNumber: string
      }
    }
    dispatchItems?: Array<{
      id: string
      dispatch: {
        id: string
        goodsReceiptNote: {
          id: string
          grnNumber: string
          status: string
          items: Array<{
            id: string
            status: string
            receivedQuantity: number
            discrepancyQuantity: number
            damageReported: boolean
          }>
        } | null
      }
    }>
  }
}

export interface VendorInvoiceListResponse {
  success: boolean
  message: string
  data: {
    invoices: VendorInvoiceDetailed[]
    pagination: {
      currentPage: number
      totalPages: number
      totalItems: number
      itemsPerPage: number
    }
  }
}

export interface VendorInvoiceUploadRequest {
  file: File
  invoiceId: string
  notes?: string
}

export interface VendorInvoiceUploadResponse {
  success: boolean
  message: string
  data: {
    invoice: {
      id: string
      invoiceNumber: string
      purchaseOrderId: string
      status: string
    }
    attachment: {
      id: string
      fileName: string
      fileSize: number
      uploadedAt: string
    }
  }
}

