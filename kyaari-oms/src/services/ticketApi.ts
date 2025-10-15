import api from './api'

export interface TicketComment {
  id: string
  userId: string
  content: string
  createdAt: string
  user?: { id: string; name: string; email?: string }
}

export interface TicketListItem {
  id: string
  ticketNumber: string
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  createdAt: string
  updatedAt: string
  goodsReceiptNote?: {
    id: string
    dispatch?: {
      vendor: { companyName: string; user?: { email?: string } }
      items: Array<{ assignedOrderItem: { orderItem: { order: { orderNumber?: string; clientOrderId?: string } } } }>
    }
  }
  _count?: { comments: number; attachments: number }
}

export interface TicketListResponse {
  success: boolean
  data: {
    tickets: TicketListItem[]
    pagination: { page: number; limit: number; total: number }
  }
}

export const TicketApi = {
  async list(params: {
    status?: 'open' | 'under-review' | 'resolved' | 'closed' | 'all'
    vendor?: string
    orderNumber?: string
    dateFrom?: string
    dateTo?: string
    page?: number
    limit?: number
  }) {
    const res = await api.get<TicketListResponse>('/api/tickets', { params })
    return res.data
  },

  async getComments(ticketId: string) {
    const res = await api.get<{ success: boolean; data: TicketComment[] }>(`/api/tickets/${ticketId}/comments`)
    return res.data
  },

  async addComment(ticketId: string, content: string) {
    const res = await api.post<{ success: boolean; data: TicketComment }>(`/api/tickets/${ticketId}/comments`, { content })
    return res.data
  },

  async updateComment(commentId: string, content: string) {
    const res = await api.put<{ success: boolean; data: TicketComment }>(`/api/tickets/comments/${commentId}`, { content })
    return res.data
  },

  async uploadAttachment(ticketId: string, file: File) {
    const form = new FormData()
    form.append('file', file)
    const res = await api.post<{ success: boolean; data: { attachment: { id: string; fileName: string; fileSize: number; url: string } } }>(
      `/api/tickets/${ticketId}/attachments`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return res.data
  },

  async listAttachments(ticketId: string) {
    const res = await api.get<{ success: boolean; data: Array<{ id: string; fileName: string; fileType: string; url: string; uploadedBy: string; uploadedAt: string }> }>(
      `/api/tickets/${ticketId}/attachments`
    )
    return res.data
  }
}


