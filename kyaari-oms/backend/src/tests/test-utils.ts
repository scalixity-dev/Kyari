import { Request, Response } from 'express';

/**
 * Creates a mock Express Request object for testing
 */
export const createMockRequest = (overrides: Partial<Request> = {}): Partial<Request> => {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    get: jest.fn(),
    ip: '127.0.0.1',
    ...overrides,
  };
};

/**
 * Creates a mock Express Response object for testing
 */
export const createMockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    sendStatus: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
  };
  return res;
};

/**
 * Creates a mock authenticated user for testing
 */
export const createMockAuthUser = (overrides = {}) => {
  return {
    userId: 'test-user-id',
    role: 'ADMIN',
    ...overrides,
  };
};

/**
 * Mock user data generators
 */
export const mockUsers = {
  admin: () => ({
    id: 'admin-123',
    name: 'Admin User',
    email: 'admin@example.com',
    status: 'ACTIVE',
    createdAt: new Date('2024-01-01'),
    roles: [{ role: { name: 'ADMIN' } }],
    vendorProfile: null,
  }),

  vendor: (verified = true) => ({
    id: 'vendor-123',
    name: 'Vendor User',
    email: 'vendor@example.com',
    status: verified ? 'ACTIVE' : 'PENDING',
    createdAt: new Date('2024-01-01'),
    roles: [{ role: { name: 'VENDOR' } }],
    vendorProfile: {
      id: 'profile-123',
      contactPersonName: 'Contact Person',
      contactPhone: '+919876543210',
      warehouseLocation: 'Mumbai',
      pincode: '400001',
      companyName: 'Test Company',
      gstNumber: 'GST123456',
      panNumber: 'PAN123456',
      verified,
      verifiedAt: verified ? new Date('2024-01-10') : null,
    },
  }),

  ops: () => ({
    id: 'ops-123',
    name: 'Operations User',
    email: 'ops@example.com',
    status: 'ACTIVE',
    createdAt: new Date('2024-01-01'),
    roles: [{ role: { name: 'OPS' } }],
    vendorProfile: null,
  }),

  accounts: () => ({
    id: 'accounts-123',
    name: 'Accounts User',
    email: 'accounts@example.com',
    status: 'ACTIVE',
    createdAt: new Date('2024-01-01'),
    roles: [{ role: { name: 'ACCOUNTS' } }],
    vendorProfile: null,
  }),
};

/**
 * Mock validation results
 */
export const mockValidation = {
  success: <T>(data: T) => ({
    success: true as const,
    data,
  }),
  
  error: (errors: Record<string, string[]>) => ({
    success: false as const,
    errors,
  }),
};

/**
 * Common test error messages
 */
export const TEST_ERRORS = {
  DATABASE_ERROR: 'Database connection error',
  VALIDATION_ERROR: 'Validation failed',
  NOT_FOUND: 'Resource not found',
  UNAUTHORIZED: 'Unauthorized',
  FORBIDDEN: 'Forbidden',
};

/**
 * Wait for async operations to complete
 */
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Assert response structure
 */
export const assertSuccessResponse = (jsonMock: jest.Mock, expectedData?: unknown) => {
  expect(jsonMock).toHaveBeenCalledWith(
    expect.objectContaining({
      success: true,
      ...(expectedData ? { data: expectedData } : {}),
    })
  );
};

export const assertErrorResponse = (jsonMock: jest.Mock, errorMessage: string) => {
  expect(jsonMock).toHaveBeenCalledWith(
    expect.objectContaining({
      success: false,
      error: errorMessage,
    })
  );
};

export const assertValidationErrorResponse = (jsonMock: jest.Mock, errors?: Record<string, string[]>) => {
  expect(jsonMock).toHaveBeenCalledWith(
    expect.objectContaining({
      success: false,
      error: 'Validation failed',
      ...(errors ? { errors } : {}),
    })
  );
};

