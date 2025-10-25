import { AssignmentStatus } from '@prisma/client';

export interface VendorTrackingQueryDto {
  vendorId?: string;
  status?: AssignmentStatus;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface VendorTrackingResponseDto {
  assignments: VendorAssignmentTrackingDto[];
  vendorFillRates: VendorFillRateDto[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface VendorAssignmentTrackingDto {
  id: string;
  assignedQuantity: number;
  confirmedQuantity?: number;
  status: AssignmentStatus;
  vendorRemarks?: string;
  assignedAt: Date;
  vendorActionAt?: Date;
  vendor: {
    id: string;
    companyName: string;
    contactPersonName: string;
    contactPhone: string;
    fillRate?: number;
    slaComplianceRate?: number;
    user: {
      id: string;
      email?: string;
      name: string;
      status: string;
    };
  };
  orderItem: {
    id: string;
    productName: string;
    sku?: string;
    quantity: number;
    pricePerUnit?: number;
    totalPrice?: number;
    order: {
      id: string;
      orderNumber: string;
      clientOrderId: string;
      status: string;
      createdAt: Date;
    };
  };
  assignedBy: {
    id: string;
    name: string;
    email?: string;
  };
}

export interface VendorFillRateDto {
  vendorId: string;
  vendor: {
    id: string;
    companyName: string;
    contactPersonName: string;
    contactPhone: string;
    fillRate?: number;
    slaComplianceRate?: number;
    user: {
      id: string;
      email?: string;
      name: string;
      status: string;
    };
  };
  totalOrders: number;
  totalAssignedQuantity: number;
  totalConfirmedQuantity: number;
  calculatedFillRate: number;
  currentFillRate: number;
}

export interface VendorPerformanceMetricsDto {
  vendor: {
    id: string;
    companyName: string;
    contactPersonName: string;
    contactPhone: string;
    fillRate?: number;
    slaComplianceRate?: number;
    user: {
      id: string;
      email?: string;
      name: string;
      status: string;
    };
  };
  metrics: {
    totalOrders: number;
    totalAssignedQuantity: number;
    totalConfirmedQuantity: number;
    calculatedFillRate: number;
    currentFillRate: number;
  };
  statusBreakdown: {
    status: AssignmentStatus;
    count: number;
    assignedQuantity: number;
    confirmedQuantity: number;
  }[];
  recentAssignments: {
    id: string;
    status: AssignmentStatus;
    assignedQuantity: number;
    confirmedQuantity?: number;
    assignedAt: Date;
    vendorActionAt?: Date;
    orderItem: {
      productName: string;
      quantity: number;
      order: {
        orderNumber: string;
        createdAt: Date;
      };
    };
  }[];
}

export interface UpdateFillRateDto {
  fillRate: number;
}

export interface BulkUpdateFillRatesResponseDto {
  updated: number;
  errors: string[];
}

export interface VendorSlaQueryDto {
  bufferPercentage?: number; // Default 15%
  lookbackDays?: number; // Default 30 days
}

export interface VendorSlaDto {
  vendorId: string;
  vendor: {
    id: string;
    companyName: string;
    contactPersonName: string;
    contactPhone: string;
    fillRate?: number;
    slaComplianceRate?: number;
    user: {
      id: string;
      email?: string;
      name: string;
      status: string;
    };
  };
  metrics: {
    avgFulfillmentTime: number; // Average fulfillment time in days
    slaBenchmark: number; // SLA benchmark (avg + buffer)
    bufferPercentage: number;
    totalHistoricalOrders: number;
    compliantOrders: number;
    slaComplianceRate: number; // Percentage of orders that met SLA
  };
  currentOrders: {
    orderNumber: string;
    daysSinceAssigned: number;
    status: string;
  }[];
  historicalData?: {
    orderNumber: string;
    fulfillmentTime: number;
    assignedAt: Date;
    completedAt: Date;
  }[];
  slaStatus: 'MET' | 'BREACHED' | 'NO_CURRENT_ORDERS';
  lastUpdated: Date;
}

export interface VendorTrackingDashboardDto {
  vendorId: string;
  vendor: {
    id: string;
    companyName: string;
    contactPersonName: string;
    contactPhone: string;
    fillRate?: number;
    slaComplianceRate?: number;
    user: {
      id: string;
      email?: string;
      name: string;
      status: string;
    };
  };
  metrics: {
    totalOrders: number;
    activeOrders: number;
    completedOrders: number;
    fillRate: number;
    slaCompliance: number;
    avgFulfillmentTime: number;
    completionRate: number;
  };
  lastActivity?: Date;
  status: 'ACTIVE' | 'INACTIVE' | 'NO_ORDERS';
}
