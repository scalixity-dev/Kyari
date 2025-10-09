export interface CreateDispatchRequest {
  assignmentIds: string[];
  awbNumber: string;
  logisticsPartner: string;
  estimatedDeliveryDate?: string;
  vendorRemarks?: string;
}

export interface DispatchItemData {
  assignmentId: string;
  assignedQuantity: number;
  confirmedQuantity: number;
  productName: string;
  sku: string;
}

export interface CreateDispatchResponse {
  dispatch: {
    id: string;
    awbNumber: string;
    logisticsPartner: string;
    status: string;
    createdAt: string;
    estimatedDeliveryDate?: string;
    vendorRemarks?: string;
    vendor: {
      id: string;
      companyName: string;
    };
    items: DispatchItemData[];
  };
}

export interface UploadProofRequest {
  // This will be handled by multer middleware
  // File will be available in req.file
}

export interface AttachmentData {
  id: string;
  fileName: string;
  originalName: string;
  s3Key: string;
  s3Url: string;
  presignedUrl?: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

export interface UploadProofResponse {
  dispatch: {
    id: string;
    awbNumber: string;
    status: string;
  };
  attachment: AttachmentData;
}

export interface DispatchDetails {
  id: string;
  awbNumber: string;
  logisticsPartner: string;
  status: string;
  createdAt: string;
  estimatedDeliveryDate?: string;
  vendorRemarks?: string;
  vendor: {
    id: string;
    companyName: string;
    contactPersonName: string;
    contactPhone: string;
  };
  items: (DispatchItemData & {
    orderNumber: string;
    orderStatus: string;
  })[];
  attachments: AttachmentData[];
}

export interface VendorDispatchListQuery {
  page?: number;
  limit?: number;
  status?: 'PENDING' | 'DISPATCHED' | 'IN_TRANSIT' | 'DELIVERED';
  startDate?: string;
  endDate?: string;
}

export interface VendorDispatchListResponse {
  dispatches: DispatchDetails[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Enums for dispatch status
export enum DispatchStatus {
  PENDING = 'PENDING',
  DISPATCHED = 'DISPATCHED',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED'
}