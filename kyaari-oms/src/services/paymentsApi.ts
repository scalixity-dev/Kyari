import api from './api'

export interface ListPaymentsParams {
  status?: 'Pending' | 'Released' | 'Overdue' | ''
  deliveryVerified?: 'Yes' | 'No' | 'Partial' | ''
  page?: number
  limit?: number
}

export interface PaymentListItem {
  id: string
  vendor: string
  orderId: string
  invoiceNumber: string
  invoiceAmount: number
  deliveryVerified: 'Yes' | 'No' | 'Partial'
  paymentStatus: 'Pending' | 'Released' | 'Overdue'
  invoiceDate: string
  dueDate: string
  releaseDate?: string
  referenceId?: string
  accountsInvoiceUrl?: string
  vendorInvoiceUrl?: string
}

export const PaymentsApi = {
  async list(params: ListPaymentsParams) {
    const query: Record<string, any> = {}
    if (params.status) query.status = params.status
    if (params.deliveryVerified) query.deliveryVerified = params.deliveryVerified
    if (params.page) query.page = params.page
    if (params.limit) query.limit = params.limit
    const res = await api.get<{ success: boolean; data: { items: PaymentListItem[]; pagination: { page: number; limit: number; total: number } } }>(
      '/api/payments',
      { params: query }
    )
    return res.data
  },

  async editAmount(purchaseOrderId: string, newAmount: number, reason?: string) {
    const res = await api.post<{ success: boolean; data: any }>(
      '/api/payments/edit-amount',
      { purchaseOrderId, newAmount, reason }
    )
    return res.data
  },

  async release(purchaseOrderId: string, referenceId: string) {
    const res = await api.post<{ success: boolean; data: any }>(
      '/api/payments/release',
      { purchaseOrderId, referenceId }
    )
    return res.data
  },

  async updateDeliveryStatus(purchaseOrderId: string, deliveryStatus: 'Yes' | 'No' | 'Partial') {
    const res = await api.post<{ success: boolean; data: any }>(
      '/api/payments/update-delivery-status',
      { purchaseOrderId, deliveryStatus }
    )
    return res.data
  },

  async aging(vendors?: string[]) {
    const params: Record<string, string> = {}
    if (vendors && vendors.length > 0) {
      params.vendors = vendors.join(',')
    }
    const res = await api.get<{ success: boolean; data: Array<{ vendorId: string; vendorName: string; outstandingAmount: number; avgPendingDays: number; oldestInvoiceDate: string | null }> }>(
      '/api/payments/aging',
      { params }
    )
    return res.data
  },

  async compliance(vendors?: string[]) {
    const params: Record<string, string> = {}
    if (vendors && vendors.length > 0) {
      params.vendors = vendors.join(',')
    }
    const res = await api.get<{ success: boolean; data: { vendors: Array<{ vendorId: string; vendor: string; totalInvoices: number; compliantPercentage: number; issuesFound: number }>; overallComplianceRate: number } }>(
      '/api/payments/compliance',
      { params }
    )
    return res.data
  },

  async slaBreaches() {
    const res = await api.get<{ success: boolean; data: { items: Array<{ slaType: string; breachCount: number; avgDelayDays: number }>; totalBreaches: number; avgDelayAcrossAll: number } }>(
      '/api/payments/sla-breaches'
    )
    return res.data
  },

  async trends(granularity: 'weekly' | 'monthly' | 'yearly' = 'weekly', periods?: number) {
    const params: Record<string, string | number> = { granularity }
    if (periods) params.periods = periods
    const res = await api.get<{ success: boolean; data: Array<{ period: string; released: number; pending: number }> }>(
      '/api/payments/trends',
      { params }
    )
    return res.data
  },

  async summary(granularity: 'weekly' | 'monthly' | 'yearly' = 'weekly') {
    const res = await api.get<{ success: boolean; data: { released: number; pending: number } }>(
      '/api/payments/summary',
      { params: { granularity } }
    )
    return res.data
  }
}


