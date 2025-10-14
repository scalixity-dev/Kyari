// Test setup file for global configurations and mocks

// Mock Prisma Client
jest.mock('../config/database', () => ({
  prisma: {
    user: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    vendorProfile: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

// Mock Logger
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Global test timeout
jest.setTimeout(10000);

