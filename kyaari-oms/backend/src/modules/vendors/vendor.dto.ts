export interface VendorProfileDto {
  id: string;
  userId: string;
  companyName: string;
  contactPersonName: string;
  contactPhone: string;
  warehouseLocation: string;
  pincode: string;
  gstNumber?: string;
  panNumber?: string;
  verified: boolean;
  verifiedAt?: Date;
  verifiedBy?: string;
  fillRate?: number;
  slaComplianceRate?: number;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    email?: string;
    name: string;
    status: string;
  };
}

export interface VendorListDto {
  id: string;
  userId: string;
  companyName: string;
  contactPersonName: string;
  contactPhone: string;
  warehouseLocation: string;
  pincode: string;
  email?: string;
  status: string;
  verified: boolean;
  fillRate?: number;
  slaComplianceRate?: number;
  createdAt: Date;
}

export interface UpdateVendorProfileDto {
  companyName?: string;
  contactPersonName?: string;
  contactPhone?: string;
  warehouseLocation?: string;
  pincode?: string;
  gstNumber?: string;
  panNumber?: string;
}

export interface VendorStatsDto {
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  fillRate: number;
  slaCompliance: number;
  totalRevenue: number;
}

