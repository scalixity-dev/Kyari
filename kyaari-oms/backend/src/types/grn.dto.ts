export interface CreateGRNRequest {
  dispatchId: string;
  receivedDate?: string;
  operatorRemarks?: string;
  items: GRNItemRequest[];
}

export interface GRNItemRequest {
  dispatchItemId: string;
  receivedQuantity: number;
  itemRemarks?: string;
  damageReported?: boolean;
  damageDescription?: string;
}

export interface GRNItemData {
  id: string;
  dispatchItemId: string;
  receivedQuantity: number;
  assignedQuantity: number;
  confirmedQuantity: number;
  discrepancyQuantity: number;
  itemRemarks?: string;
  damageReported: boolean;
  damageDescription?: string;
  productName: string;
  sku: string;
  status: GRNItemStatus;
}

export interface CreateGRNResponse {
  grn: {
    id: string;
    grnNumber: string;
    status: GRNStatus;
    receivedDate: string;
    createdAt: string;
    operatorRemarks?: string;
    dispatch: {
      id: string;
      awbNumber: string;
      logisticsPartner: string;
      vendor: {
        id: string;
        companyName: string;
      };
    };
    operator: {
      id: string;
      email: string;
    };
    items: GRNItemData[];
  };
  discrepanciesFound: boolean;
  totalItemsVerified: number;
  totalItemsWithDiscrepancy: number;
}

export interface GRNDetails {
  id: string;
  grnNumber: string;
  status: GRNStatus;
  receivedDate: string;
  createdAt: string;
  operatorRemarks?: string;
  dispatch: {
    id: string;
    awbNumber: string;
    logisticsPartner: string;
    estimatedDeliveryDate?: string;
    vendor: {
      id: string;
      companyName: string;
      contactPersonName: string;
      contactPhone: string;
    };
  };
  operator: {
    id: string;
    email: string;
    profile?: {
      name: string;
    };
  };
  items: GRNItemData[];
  summary: {
    totalItems: number;
    itemsWithDiscrepancy: number;
    totalReceivedQuantity: number;
    totalConfirmedQuantity: number;
    totalDiscrepancyQuantity: number;
  };
}

export interface GRNListQuery {
  page?: number;
  limit?: number;
  status?: GRNStatus;
  startDate?: string;
  endDate?: string;
  vendorId?: string;
  operatorId?: string;
}

export interface GRNListResponse {
  grns: GRNDetails[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Enums for GRN status
export enum GRNStatus {
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  VERIFIED_OK = 'VERIFIED_OK',
  VERIFIED_MISMATCH = 'VERIFIED_MISMATCH',
  PARTIALLY_VERIFIED = 'PARTIALLY_VERIFIED'
}

export enum GRNItemStatus {
  VERIFIED_OK = 'VERIFIED_OK',
  QUANTITY_MISMATCH = 'QUANTITY_MISMATCH',
  DAMAGE_REPORTED = 'DAMAGE_REPORTED',
  SHORTAGE_REPORTED = 'SHORTAGE_REPORTED',
  EXCESS_RECEIVED = 'EXCESS_RECEIVED'
}

// For audit and tracking
export interface DiscrepancyAnalysis {
  dispatchItemId: string;
  assignedQuantity: number;
  confirmedQuantity: number;
  receivedQuantity: number;
  discrepancyQuantity: number;
  discrepancyType: 'SHORTAGE' | 'EXCESS' | 'DAMAGE' | 'NONE';
  discrepancyPercentage: number;
}