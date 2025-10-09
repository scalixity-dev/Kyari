// GRN (Goods Receipt Note) DTOs

export interface GRNItemRequest {
  dispatchItemId: string;
  receivedQuantity: number;
  itemRemarks?: string;
  damageReported?: boolean;
  damageDescription?: string;
}

export interface CreateGRNRequest {
  dispatchId: string;
  items: GRNItemRequest[];
  operatorRemarks?: string;
  receivedAt?: string;
}

export interface GRNItemResponse {
  id: string;
  dispatchItemId: string;
  assignmentId: string;
  productName: string;
  sku: string;
  assignedQuantity: number;
  confirmedQuantity: number;
  receivedQuantity: number;
  discrepancyQuantity: number;
  status: string;
  itemRemarks?: string;
  damageReported: boolean;
  damageDescription?: string;
}

export interface GRNResponse {
  id: string;
  grnNumber: string;
  dispatchId: string;
  awbNumber: string;
  vendorName: string;
  status: string;
  operatorRemarks?: string;
  verifiedById: string;
  verifiedByEmail: string;
  receivedAt: string;
  verifiedAt?: string;
  items: GRNItemResponse[];
  orderStatusUpdated: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GRNListResponse {
  grns: GRNResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
