export interface UserDto {
  id: string;
  email?: string;
  name: string;
  status: string;
  lastLoginAt?: Date;
  createdAt: Date;
  roles: string[];
  vendorProfile?: VendorProfileDto;
}

export interface VendorProfileDto {
  id: string;
  contactPersonName: string;
  contactPhone: string;
  warehouseLocation: string;
  pincode: string;
  companyName?: string;
  gstNumber?: string;
  panNumber?: string;
  verified: boolean;
  verifiedAt?: Date;
}

export interface CreateUserDto {
  role: 'ADMIN' | 'OPS' | 'ACCOUNTS';
  name: string;
  email?: string;
  password: string;
}

export interface VendorRegistrationDto {
  contactPersonName: string;
  email: string;
  contactPhone: string;
  password: string;
  confirmPassword: string;
  warehouseLocation: string;
  pincode: string;
  companyName?: string;
  gstNumber?: string;
  panNumber?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponseDto {
  accessToken: string;
  refreshToken?: string;
  user: UserDto;
}