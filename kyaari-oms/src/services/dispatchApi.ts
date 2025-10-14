import api from './api'
import toast from 'react-hot-toast'

// =============================================
// TYPES & INTERFACES
// =============================================

export interface DispatchItemRequest {
  assignmentId: string
  dispatchedQuantity: number
}

export interface CreateDispatchRequest {
  items: DispatchItemRequest[]
  awbNumber: string
  logisticsPartner: string
  dispatchDate?: string
  estimatedDeliveryDate?: string
  remarks?: string
}

export interface DispatchItemResponse {
  id: string
  assignmentId: string
  orderItemId: string
  productName: string
  sku: string | null
  dispatchedQuantity: number
  orderNumber: string
}

export interface AttachmentResponse {
  id: string
  fileName: string
  s3Url: string
  fileSize: number
  mimeType: string
  uploadedAt: string
}

export interface DispatchResponse {
  id: string
  vendorId: string
  vendorEmail: string
  awbNumber: string
  logisticsPartner: string
  dispatchDate: string
  estimatedDeliveryDate?: string
  status: 'PENDING' | 'PROCESSING' | 'DISPATCHED' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED'
  remarks?: string
  items: DispatchItemResponse[]
  attachments?: AttachmentResponse[]
  createdAt: string
  updatedAt: string
}

export interface DispatchListResponse {
  success: boolean
  message?: string
  data: {
    dispatches: DispatchResponse[]
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
    }
  }
}

export interface UploadProofResponse {
  success: boolean
  data: {
    attachment: AttachmentResponse
  }
}

// =============================================
// DISPATCH API SERVICE
// =============================================

export class DispatchApiService {
  /**
   * Get vendor's dispatches
   */
  static async getMyDispatches(params?: {
    page?: number
    limit?: number
    status?: string
    awbNumber?: string
  }): Promise<DispatchListResponse> {
    try {
      const queryParams = new URLSearchParams()
      
      if (params?.page) queryParams.append('page', params.page.toString())
      if (params?.limit) queryParams.append('limit', params.limit.toString())
      if (params?.status) queryParams.append('status', params.status)
      if (params?.awbNumber) queryParams.append('awbNumber', params.awbNumber)

      const response = await api.get<DispatchListResponse>(
        `/api/dispatches/my${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      )
      
      return response.data
    } catch (error) {
      console.error('Failed to fetch dispatches:', error)
      toast.error('Failed to load dispatches')
      throw error
    }
  }

  /**
   * Create a new dispatch
   */
  static async createDispatch(request: CreateDispatchRequest): Promise<DispatchResponse> {
    try {
      const response = await api.post<{
        success: boolean
        data: DispatchResponse
      }>('/api/dispatches', request)

      toast.success('Dispatch created successfully')
      return response.data.data
    } catch (error) {
      console.error('Failed to create dispatch:', error)
      toast.error('Failed to create dispatch')
      throw error
    }
  }

  /**
   * Get dispatch details by ID
   */
  static async getDispatchById(id: string): Promise<DispatchResponse> {
    try {
      const response = await api.get<{
        success: boolean
        data: DispatchResponse
      }>(`/api/dispatches/${id}`)
      
      return response.data.data
    } catch (error) {
      console.error('Failed to fetch dispatch details:', error)
      toast.error('Failed to load dispatch details')
      throw error
    }
  }

  /**
   * Upload dispatch proof (image/PDF)
   */
  static async uploadDispatchProof(dispatchId: string, file: File): Promise<UploadProofResponse> {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await api.post<UploadProofResponse>(
        `/api/dispatches/${dispatchId}/upload-proof`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )

      toast.success('Dispatch proof uploaded successfully')
      return response.data
    } catch (error) {
      console.error('Failed to upload dispatch proof:', error)
      toast.error('Failed to upload proof')
      throw error
    }
  }
}

export default DispatchApiService

