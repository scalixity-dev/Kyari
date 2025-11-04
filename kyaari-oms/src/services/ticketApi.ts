import api from './api'

export interface TicketComment {
  id: string
  userId: string
  content: string
  createdAt: string
  user?: { id: string; name: string; email?: string }
}

export interface TicketChatMessage {
  id: string
  ticketId: string
  senderId: string
  message?: string
  attachments?: any[]
  messageType: 'TEXT' | 'FILE' | 'IMAGE' | 'SYSTEM'
  createdAt: string
  updatedAt: string
  sender: {
    id: string
    name: string
    email: string
    role: string
    companyName?: string
  }
}

export interface TicketChatResponse {
  success: boolean
  data: {
    messages: TicketChatMessage[]
    pagination: { page: number; limit: number; total: number; hasMore: boolean }
    ticket: {
      id: string
      ticketNumber: string
      title: string
      status: string
      priority: string
    }
    participants: Array<{
      id: string
      name: string
      email: string
      role: string
      type: string
      companyName?: string
    }>
  }
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

export interface TicketTrendData {
  period: string
  periodStart: string
  periodEnd: string
  raised: number
  resolved: number
}

export interface TicketTrendsResponse {
  success: boolean
  data: {
    trends: TicketTrendData[]
    period: 'weekly' | 'monthly' | 'yearly'
    dateRange: {
      from: string
      to: string
    }
  }
}

export interface ResolutionTimeTrendData {
  period: string
  periodStart: string
  periodEnd: string
  avgResolutionHours: number
  totalResolved: number
}

export interface ResolutionTimeTrendsResponse {
  success: boolean
  data: {
    trends: ResolutionTimeTrendData[]
    period: 'weekly' | 'monthly' | 'yearly'
    dateRange: {
      from: string
      to: string
    }
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

  async getChatMessages(ticketId: string, params?: { page?: number; limit?: number }) {
    const res = await api.get<TicketChatResponse>(`/api/tickets/${ticketId}/chat`, { params })
    return res.data
  },

  async getChatParticipants(ticketId: string) {
    const res = await api.get<{ success: boolean; data: { ticket: { id: string; ticketNumber: string; title: string; status: string; priority: string }, participants: Array<{ id: string; name: string; email: string; role: string; type: string; companyName?: string }> } }>(
      `/api/tickets/${ticketId}/chat/participants`
    )
    return res.data
  },

  async sendChatMessage(ticketId: string, message: string) {
    const res = await api.post<{ success: boolean; data: { message: TicketChatMessage } }>(
      `/api/tickets/${ticketId}/chat`,
      { message, messageType: 'TEXT' }
    )
    return res.data
  },

  async uploadChatFile(ticketId: string, file: File, message?: string) {
    const form = new FormData()
    form.append('file', file)
    if (message) form.append('message', message)
    const res = await api.post<{ success: boolean; data: { message: TicketChatMessage; attachment: any } }>(
      `/api/tickets/${ticketId}/chat/upload`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return res.data
  },

  async create(payload: {
    title: string
    description: string
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
    goodsReceiptNoteId?: string
  }) {
    const res = await api.post('/api/tickets', payload)
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
  },

  async updateStatus(ticketId: string, status: 'open' | 'under-review' | 'resolved') {
    const res = await api.put<{ success: boolean; data: TicketListItem }>(`/api/tickets/${ticketId}/status`, { status })
    return res.data
  },

  async getTrends(params: {
    period: 'weekly' | 'monthly' | 'yearly'
    dateFrom?: string
    dateTo?: string
  }) {
    const res = await api.get<TicketTrendsResponse>('/api/tickets/trends', { params })
    return res.data
  },

  async getResolutionTimeTrends(params: {
    period: 'weekly' | 'monthly' | 'yearly'
    dateFrom?: string
    dateTo?: string
  }) {
    const res = await api.get<ResolutionTimeTrendsResponse>('/api/tickets/resolution-time-trends', { params })
    return res.data
  }
}


