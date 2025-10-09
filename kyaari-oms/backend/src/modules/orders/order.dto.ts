export interface CreateOrderDto {
  orderNumber: string;
  primaryVendorId: string;
  items: CreateOrderItemDto[];
}

export interface CreateOrderItemDto {
  productName: string;
  sku?: string;
  quantity: number;
  pricePerUnit: number;
}

export interface OrderDto {
  id: string;
  orderNumber: string;
  status: string;
  source: string;
  primaryVendor: VendorSummaryDto;
  items: OrderItemDto[];
  createdAt: Date;
  updatedAt: Date;
  createdBy?: {
    id: string;
    name: string;
  };
}

export interface OrderItemDto {
  id: string;
  productName: string;
  sku?: string;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
  pricingStatus: 'complete';  // Always complete now since pricing is mandatory
  assignedItems: AssignedOrderItemDto[];
}

export interface AssignedOrderItemDto {
  id: string;
  vendorId: string;
  vendor: VendorSummaryDto;
  assignedQuantity: number;
  confirmedQuantity?: number;
  status: string;
  assignedAt: Date;
  vendorActionAt?: Date;
}

export interface VendorSummaryDto {
  id: string;
  companyName: string;
  contactPersonName: string;
  contactPhone: string;
}

export interface OrderListDto {
  id: string;
  orderNumber: string;
  status: string;
  itemCount: number;
  primaryVendor: {
    companyName: string;
  };
  createdAt: Date;
  pricingStatus: 'complete'; // Always complete since pricing is mandatory
}

export interface OrderListResponseDto {
  orders: OrderListDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface OrderQueryDto {
  page?: number;
  limit?: number;
  status?: string;
  vendorId?: string;
  search?: string;
  startDate?: Date;
  endDate?: Date;
}