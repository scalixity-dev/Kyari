// Money Flow DTOs for API responses and data transfer

export interface MoneyFlowKPIDto {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
}

export interface MoneyFlowTransactionDto {
  id: string;
  vendor: string;
  amount: string;
  status: 'Pending' | 'Released' | 'Approved';
  date: string;
  invoiceNumber?: string;
  orderId?: string;
  dueDate?: string;
  releaseDate?: string;
  referenceId?: string;
}

export interface MoneyFlowTrendDataDto {
  labels: string[];
  pending: number[];
  cleared: number[];
}

export interface MoneyFlowPieChartDto {
  pending: number;
  cleared: number;
  total: number;
  pendingPercent: number;
  clearedPercent: number;
}

export interface MoneyFlowFiltersDto {
  status?: 'All' | 'Pending' | 'Released' | 'Approved';
  searchQuery?: string;
  sortOrder?: 'Latest' | 'Oldest';
  page?: number;
  limit?: number;
}

export interface MoneyFlowTrendRangeDto {
  range: 'Weekly' | 'Monthly' | 'Yearly';
}

export interface MoneyFlowListResponseDto {
  kpis: MoneyFlowKPIDto[];
  transactions: MoneyFlowTransactionDto[];
  trendData: MoneyFlowTrendDataDto;
  pieChartData: MoneyFlowPieChartDto;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface MoneyFlowKPIsResponseDto {
  kpis: MoneyFlowKPIDto[];
}

export interface MoneyFlowTransactionsResponseDto {
  transactions: MoneyFlowTransactionDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface MoneyFlowTrendResponseDto {
  trendData: MoneyFlowTrendDataDto;
}

export interface MoneyFlowPieChartResponseDto {
  pieChartData: MoneyFlowPieChartDto;
}
