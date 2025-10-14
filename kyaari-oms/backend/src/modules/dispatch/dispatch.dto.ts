// Dispatch DTOs

export interface DispatchItemRequest {
  assignmentId: string;
  dispatchedQuantity: number;
}

export interface CreateDispatchRequest {
  items: DispatchItemRequest[];
  awbNumber: string;
  logisticsPartner: string;
  dispatchDate?: string;
  estimatedDeliveryDate?: string;
  remarks?: string;
}

export interface DispatchItemResponse {
  id: string;
  assignmentId: string;
  orderItemId: string;
  productName: string;
  sku: string;
  dispatchedQuantity: number;
  orderNumber: string;
}

export interface AttachmentResponse {
  id: string;
  fileName: string;
  s3Url: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

export interface DispatchResponse {
  id: string;
  vendorId: string;
  vendorEmail: string;
  awbNumber: string;
  logisticsPartner: string;
  dispatchDate: string;
  estimatedDeliveryDate?: string;
  status: string;
  remarks?: string;
  poNumber?: string | null;
  items: DispatchItemResponse[];
  attachments?: AttachmentResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface DispatchListResponse {
  dispatches: DispatchResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface UploadProofResponse {
  attachment: {
    id: string;
    fileName: string;
    s3Url: string;
    presignedUrl: string;
    fileSize: number;
    mimeType: string;
    uploadedAt: Date;
  };
}
