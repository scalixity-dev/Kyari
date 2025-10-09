export interface VendorAssignmentDto {
  id: string;
  assignedQuantity: number;
  confirmedQuantity?: number;
  status: string;
  vendorRemarks?: string;
  assignedAt: Date;
  vendorActionAt?: Date;
  orderItem: {
    id: string;
    productName: string;
    sku?: string;
    quantity: number;
    order: {
      id: string;
      orderNumber: string;
      status: string;
      createdAt: Date;
    };
  };
}

export interface VendorAssignmentListDto {
  id: string;
  assignedQuantity: number;
  confirmedQuantity?: number;
  status: string;
  assignedAt: Date;
  vendorActionAt?: Date;
  productName: string;
  sku?: string;
  orderNumber: string;
  orderStatus: string;
  orderCreatedAt: Date;
}

export interface VendorAssignmentListResponseDto {
  assignments: VendorAssignmentListDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface VendorAssignmentQueryDto {
  page?: number;
  limit?: number;
  status?: string;
  orderId?: string;
  orderNumber?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface UpdateAssignmentStatusDto {
  status: 'VENDOR_CONFIRMED_FULL' | 'VENDOR_CONFIRMED_PARTIAL' | 'VENDOR_DECLINED';
  confirmedQuantity?: number;
  vendorRemarks?: string;
}

export interface AssignmentStatusUpdateResponseDto {
  assignment: VendorAssignmentDto;
  orderStatusUpdated: boolean;
  newOrderStatus?: string;
}