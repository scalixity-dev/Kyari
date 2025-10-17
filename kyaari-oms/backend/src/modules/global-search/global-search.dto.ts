export interface GlobalSearchRequest {
  query: string;
  entityTypes?: string[];
  page?: number;
  limit?: number;
}

export interface SearchResultDto {
  type: string;
  id: string;
  title: string;
  description: string;
  metadata: Record<string, unknown>;
  relevanceScore?: number;
}

export interface GlobalSearchResponseDto {
  success: boolean;
  data: {
    results: SearchResultDto[];
    total: number;
    page: number;
    limit: number;
    entityTypes: string[];
  };
  message?: string;
}

export interface AvailableEntityTypesResponseDto {
  success: boolean;
  data: {
    entityTypes: string[];
  };
  message?: string;
}

// Entity type constants for validation
export const VALID_ENTITY_TYPES = [
  'orders',
  'users', 
  'vendors',
  'tickets',
  'payments',
  'dispatches',
  'grns'
] as const;

export type EntityType = typeof VALID_ENTITY_TYPES[number];

// Search result metadata interfaces for type safety
export interface OrderSearchMetadata {
  status: string;
  totalValue: number | null;
  createdAt: Date;
  primaryVendor?: string;
}

export interface UserSearchMetadata {
  email: string | null;
  status: string;
  roles: string[];
  isVendor: boolean;
  createdAt: Date;
}

export interface VendorSearchMetadata {
  contactPersonName: string;
  contactPhone: string;
  gstNumber: string | null;
  verified: boolean;
  userStatus: string;
  createdAt: Date;
}

export interface TicketSearchMetadata {
  ticketNumber: string;
  status: string;
  priority: string;
  createdBy: string;
  assignee?: string;
  createdAt: Date;
}

export interface PaymentSearchMetadata {
  amount: number;
  status: string;
  transactionId: string | null;
  vendor: string;
  processedBy: string;
  createdAt: Date;
}

export interface DispatchSearchMetadata {
  dispatchNumber: string;
  awbNumber: string;
  status: string;
  logisticsPartner: string;
  vendor: string;
  dispatchDate: Date;
  createdAt: Date;
}

export interface GRNSearchMetadata {
  grnNumber: string;
  status: string;
  vendor: string;
  verifiedBy?: string;
  receivedAt: Date;
  verifiedAt: Date | null;
  createdAt: Date;
}
