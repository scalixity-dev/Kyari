import api from './api'

export interface MoneyFlowKPIDto {
  title: string
  value: string
  subtitle: string
  icon: string
}

export interface MoneyFlowTransactionDto {
  id: string
  vendor: string
  amount: string
  status: 'Pending' | 'Released' | 'Approved'
  date: string
  invoiceNumber?: string
  orderId?: string
  dueDate?: string
  releaseDate?: string
  referenceId?: string
}

export interface MoneyFlowTrendDataDto {
  labels: string[]
  pending: number[]
  cleared: number[]
}

export interface MoneyFlowPieChartDto {
  pending: number
  cleared: number
  total: number
  pendingPercent: number
  clearedPercent: number
}

export interface MoneyFlowFilters {
  status?: 'All' | 'Pending' | 'Released' | 'Approved'
  searchQuery?: string
  sortOrder?: 'Latest' | 'Oldest'
  page?: number
  limit?: number
}

export interface MoneyFlowTrendRange {
  range: 'Weekly' | 'Monthly' | 'Yearly'
}

export interface MoneyFlowListResponse {
  kpis: MoneyFlowKPIDto[]
  transactions: MoneyFlowTransactionDto[]
  trendData: MoneyFlowTrendDataDto
  pieChartData: MoneyFlowPieChartDto
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface MoneyFlowKPIsResponse {
  success: boolean
  data: { 
    data: { kpis: MoneyFlowKPIDto[] }
  }
  message: string
}

export interface MoneyFlowTransactionsResponse {
  success: boolean
  data: {
    data: {
      transactions: MoneyFlowTransactionDto[]
      pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
      }
    }
  }
  message: string
}

export interface MoneyFlowTrendResponse {
  success: boolean
  data: { 
    data: { trendData: MoneyFlowTrendDataDto }
  }
  message: string
}

export interface MoneyFlowPieChartResponse {
  success: boolean
  data: { 
    data: { pieChartData: MoneyFlowPieChartDto }
  }
  message: string
}

export interface MoneyFlowCompleteResponse {
  success: boolean
  data: { 
    data: MoneyFlowListResponse
  }
  message: string
}

export const MoneyFlowApi = {
  /**
   * Get money flow KPIs
   */
  async getKPIs(): Promise<MoneyFlowKPIsResponse> {
    const res = await api.get<MoneyFlowKPIsResponse>('/api/money-flow/kpis')
    return res.data
  },

  /**
   * Get money flow transactions with filtering and pagination
   */
  async getTransactions(filters: MoneyFlowFilters): Promise<MoneyFlowTransactionsResponse> {
    const query: Record<string, any> = {}
    if (filters.status) query.status = filters.status
    if (filters.searchQuery) query.searchQuery = filters.searchQuery
    if (filters.sortOrder) query.sortOrder = filters.sortOrder
    if (filters.page) query.page = filters.page
    if (filters.limit) query.limit = filters.limit

    const res = await api.get<MoneyFlowTransactionsResponse>('/api/money-flow/transactions', {
      params: query
    })
    return res.data
  },

  /**
   * Get money flow trend data for charts
   */
  async getTrendData(range: MoneyFlowTrendRange): Promise<MoneyFlowTrendResponse> {
    const res = await api.get<MoneyFlowTrendResponse>('/api/money-flow/trend', {
      params: { range: range.range }
    })
    return res.data
  },

  /**
   * Get money flow pie chart data
   */
  async getPieChartData(): Promise<MoneyFlowPieChartResponse> {
    const res = await api.get<MoneyFlowPieChartResponse>('/api/money-flow/pie-chart')
    return res.data
  },

  /**
   * Get complete money flow data (all components)
   */
  async getCompleteData(filters: MoneyFlowFilters, trendRange: MoneyFlowTrendRange): Promise<MoneyFlowCompleteResponse> {
    const query: Record<string, any> = {}
    if (filters.status) query.status = filters.status
    if (filters.searchQuery) query.searchQuery = filters.searchQuery
    if (filters.sortOrder) query.sortOrder = filters.sortOrder
    if (filters.page) query.page = filters.page
    if (filters.limit) query.limit = filters.limit
    query.range = trendRange.range

    const res = await api.get<MoneyFlowCompleteResponse>('/api/money-flow/complete', {
      params: query
    })
    return res.data
  },

  /**
   * Export money flow transactions to CSV
   */
  async exportCSV(filters: MoneyFlowFilters): Promise<Blob> {
    const res = await api.post('/api/money-flow/export/csv', filters, {
      responseType: 'blob'
    })
    return res.data
  },

  /**
   * Export money flow transactions to PDF
   */
  async exportPDF(filters: MoneyFlowFilters): Promise<Blob> {
    const res = await api.post('/api/money-flow/export/pdf', filters, {
      responseType: 'blob'
    })
    return res.data
  }
}
