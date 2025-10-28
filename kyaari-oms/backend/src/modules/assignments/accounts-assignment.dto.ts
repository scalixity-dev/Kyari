/**
 * DTOs for Accounts Team Assignment Views
 */

export interface AccountsVendorOrderItemDto {
  sku: string
  product: string
  qty: number
  confirmedQty: number
}

export interface AccountsVendorOrderDto {
  id: string // Assignment group ID or order number
  vendorId: string
  vendorName: string
  items: AccountsVendorOrderItemDto[]
  orderStatus: 'Confirmed' | 'Awaiting PO' | 'PO Generated' | 'Delivered' | 'Closed'
  poStatus: 'Pending' | 'Generated'
  invoiceStatus: 'Not Created' | 'Awaiting Validation' | 'Approved'
  orderDate: string
  confirmationDate: string
  orderNumber: string
  orderId: string
  totalAmount: number
  poNumber?: string | null  // Actual PO number from PurchaseOrder table
  accountInvoiceUrl?: string | null
  vendorInvoiceUrl?: string | null
  invoiceId?: string | null  // Invoice ID for fetching JSON data
}

export interface AccountsVendorOrderListResponseDto {
  orders: AccountsVendorOrderDto[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface AccountsAssignmentQueryDto {
  page?: number
  limit?: number
  vendorId?: string
  vendorName?: string
  orderStatus?: 'Confirmed' | 'Awaiting PO' | 'PO Generated' | 'Delivered' | 'Closed'
  poStatus?: 'Pending' | 'Generated'
  invoiceStatus?: 'Not Created' | 'Awaiting Validation' | 'Approved'
  startDate?: Date
  endDate?: Date
  orderNumber?: string
}

