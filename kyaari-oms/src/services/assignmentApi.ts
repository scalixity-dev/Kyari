import api from './api'
import toast from 'react-hot-toast'

// Assignment status types matching backend
export type AssignmentStatus = 
  | 'PENDING_CONFIRMATION'
  | 'VENDOR_CONFIRMED_FULL'
  | 'VENDOR_CONFIRMED_PARTIAL'
  | 'VENDOR_DECLINED'
  | 'INVOICED'
  | 'DISPATCHED'
  | 'STORE_RECEIVED'
  | 'VERIFIED_OK'
  | 'VERIFIED_MISMATCH'
  | 'COMPLETED'

// Frontend types for the UI
export interface AssignmentProduct {
  id: string
  sku: string
  name: string
  requestedQty: number
  confirmedQty: number
  availableQty: number
  status: 'Pending' | 'Confirmed' | 'Partially Confirmed' | 'Declined' | 'Not Available'
  backorderQty: number
  declineReason?: string
  assignmentId: string // Reference to the backend assignment
}

export interface AssignmentOrder {
  id: string
  orderNumber: string
  date: string
  customerName: string
  products: AssignmentProduct[]
  overallStatus: 'Pending' | 'Confirmed' | 'Partially Confirmed' | 'Declined' | 'Waiting for PO' | 'PO Received' | 'Mixed'
  totalItems: number
  totalConfirmed: number
}

// Backend response types
interface VendorAssignmentDto {
  id: string
  assignedQuantity: number
  confirmedQuantity?: number
  status: string
  assignedAt: string
  vendorActionAt?: string
  productName: string
  sku?: string
  orderNumber: string
  orderStatus: string
  orderCreatedAt: string
}

interface VendorAssignmentListResponseDto {
  assignments: VendorAssignmentDto[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

interface UpdateAssignmentStatusDto {
  status: 'VENDOR_CONFIRMED_FULL' | 'VENDOR_CONFIRMED_PARTIAL' | 'VENDOR_DECLINED'
  confirmedQuantity?: number
  vendorRemarks?: string
}

interface AssignmentStatusUpdateResponseDto {
  assignment: {
    id: string
    assignedQuantity: number
    confirmedQuantity?: number
    status: string
    vendorRemarks?: string
    assignedAt: string
    vendorActionAt?: string
  }
  orderStatusUpdated: boolean
  newOrderStatus?: string
}

// Query parameters for fetching assignments
export interface AssignmentQueryParams {
  page?: number
  limit?: number
  status?: AssignmentStatus
  orderId?: string
  orderNumber?: string
  startDate?: string
  endDate?: string
}

// Assignment API Service
export class AssignmentApiService {
  
  /**
   * Get all assignments for the logged-in vendor
   */
  static async getMyAssignments(params?: AssignmentQueryParams): Promise<AssignmentOrder[]> {
    try {
      const queryParams = new URLSearchParams()
      
      if (params?.page) queryParams.append('page', params.page.toString())
      if (params?.limit) queryParams.append('limit', params.limit.toString())
      if (params?.status) queryParams.append('status', params.status)
      if (params?.orderId) queryParams.append('orderId', params.orderId)
      if (params?.orderNumber) queryParams.append('orderNumber', params.orderNumber)
      if (params?.startDate) queryParams.append('startDate', params.startDate)
      if (params?.endDate) queryParams.append('endDate', params.endDate)

      const queryString = queryParams.toString()
      const url = `/api/assignments/my${queryString ? `?${queryString}` : ''}`
      
      const response = await api.get<{
        success: boolean
        data: VendorAssignmentListResponseDto
      }>(url)

      return this.transformAssignmentsToOrders(response.data.data.assignments)
    } catch (error) {
      console.error('Failed to fetch assignments:', error)
      toast.error('Failed to load orders')
      throw error
    }
  }

  /**
   * Update assignment status (confirm full, partial, or decline)
   */
  static async updateAssignmentStatus(
    assignmentId: string,
    status: 'VENDOR_CONFIRMED_FULL' | 'VENDOR_CONFIRMED_PARTIAL' | 'VENDOR_DECLINED',
    confirmedQuantity?: number,
    vendorRemarks?: string
  ): Promise<AssignmentStatusUpdateResponseDto> {
    try {
      const payload: UpdateAssignmentStatusDto = {
        status,
        ...(confirmedQuantity !== undefined && { confirmedQuantity }),
        ...(vendorRemarks && { vendorRemarks })
      }

      const response = await api.patch<{
        success: boolean
        data: AssignmentStatusUpdateResponseDto
      }>(`/api/assignments/${assignmentId}/status`, payload)

      const statusMessage = 
        status === 'VENDOR_CONFIRMED_FULL' ? 'Order confirmed successfully' :
        status === 'VENDOR_CONFIRMED_PARTIAL' ? 'Partial order confirmed successfully' :
        'Order declined successfully'
      
      toast.success(statusMessage)
      return response.data.data
    } catch (error) {
      console.error('Failed to update assignment status:', error)
      toast.error('Failed to update order status')
      throw error
    }
  }

  /**
   * Transform backend assignments to frontend orders structure
   * Groups assignments by order number
   */
  private static transformAssignmentsToOrders(assignments: VendorAssignmentDto[]): AssignmentOrder[] {
    // Group assignments by order number
    const orderMap = new Map<string, VendorAssignmentDto[]>()
    
    assignments.forEach(assignment => {
      const existing = orderMap.get(assignment.orderNumber) || []
      orderMap.set(assignment.orderNumber, [...existing, assignment])
    })

    // Transform each group into an order
    const orders: AssignmentOrder[] = []
    
    orderMap.forEach((assignmentGroup, orderNumber) => {
      const firstAssignment = assignmentGroup[0]
      
      // Map each assignment to a product
      const products: AssignmentProduct[] = assignmentGroup.map(assignment => {
        const uiStatus = this.mapBackendStatusToUIStatus(assignment.status)
        const backorderQty = assignment.status === 'VENDOR_CONFIRMED_PARTIAL' 
          ? assignment.assignedQuantity - (assignment.confirmedQuantity || 0)
          : 0

        return {
          id: assignment.id, // Use assignment ID as product ID for UI
          sku: assignment.sku || 'N/A',
          name: assignment.productName,
          requestedQty: assignment.assignedQuantity,
          confirmedQty: assignment.confirmedQuantity || 0,
          availableQty: assignment.confirmedQuantity || 0,
          status: uiStatus,
          backorderQty,
          assignmentId: assignment.id
        }
      })

      // Calculate overall order status
      const overallStatus = this.calculateOrderStatus(products)
      const totalConfirmed = products.filter(p => 
        ['Confirmed', 'Partially Confirmed'].includes(p.status)
      ).length

      orders.push({
        id: orderNumber, // Use order number as order ID for UI
        orderNumber,
        date: new Date(firstAssignment.orderCreatedAt).toLocaleDateString('en-GB'),
        customerName: 'Customer', // Backend doesn't provide customer name in assignment
        products,
        overallStatus,
        totalItems: products.length,
        totalConfirmed
      })
    })

    // Sort by date (most recent first)
    return orders.sort((a, b) => {
      const dateA = new Date(a.date.split('/').reverse().join('-'))
      const dateB = new Date(b.date.split('/').reverse().join('-'))
      return dateB.getTime() - dateA.getTime()
    })
  }

  /**
   * Map backend assignment status to UI status
   */
  private static mapBackendStatusToUIStatus(
    status: string
  ): 'Pending' | 'Confirmed' | 'Partially Confirmed' | 'Declined' | 'Not Available' {
    switch (status) {
      case 'PENDING_CONFIRMATION':
        return 'Pending'
      case 'VENDOR_CONFIRMED_FULL':
        return 'Confirmed'
      case 'VENDOR_CONFIRMED_PARTIAL':
        return 'Partially Confirmed'
      case 'VENDOR_DECLINED':
        return 'Declined'
      default:
        return 'Not Available'
    }
  }

  /**
   * Calculate overall order status based on product statuses
   */
  private static calculateOrderStatus(
    products: AssignmentProduct[]
  ): 'Pending' | 'Confirmed' | 'Partially Confirmed' | 'Declined' | 'Mixed' {
    const statuses = products.map(p => p.status)
    const uniqueStatuses = [...new Set(statuses)]
    
    if (uniqueStatuses.length === 1) {
      const status = uniqueStatuses[0]
      if (status === 'Pending') return 'Pending'
      if (status === 'Confirmed') return 'Confirmed'
      if (status === 'Partially Confirmed') return 'Partially Confirmed'
      if (status === 'Declined') return 'Declined'
    }
    
    return 'Mixed'
  }
}

