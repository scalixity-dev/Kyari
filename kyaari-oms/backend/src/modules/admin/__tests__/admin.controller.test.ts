import { Request, Response } from 'express';
import { AdminController } from '../admin.controller';
import { userService } from '../../users/user.service';
import { validateSchema } from '../../auth/auth.validators';
import { ResponseHelper } from '../../../utils/response';
import { logger } from '../../../utils/logger';
import { prisma } from '../../../config/database';
import { APP_CONSTANTS } from '../../../config/constants';

// Mock dependencies
jest.mock('../../users/user.service');
jest.mock('../../auth/auth.validators');
jest.mock('../../../utils/logger');
jest.mock('../../../config/database');

describe('AdminController', () => {
  let adminController: AdminController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    adminController = new AdminController();
    
    // Setup mock response
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    // Setup mock request
    mockRequest = {
      body: {},
      params: {},
      query: {},
      user: {
        userId: 'admin-user-id',
        roles: ['ADMIN'],
      } as any,
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('Mozilla/5.0'),
    };

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a user successfully', async () => {
      // Arrange
      const userData = {
        role: 'VENDOR',
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!',
      };

      const createdUser = {
        id: 'user-123',
        name: userData.name,
        email: userData.email,
        status: 'PENDING',
        createdAt: new Date(),
      };

      mockRequest.body = userData;

      (validateSchema as jest.Mock).mockReturnValue({
        success: true,
        data: userData,
      });

      (userService.createUser as jest.Mock).mockResolvedValue({
        user: createdUser,
      });

      (prisma.auditLog.create as jest.Mock).mockResolvedValue({});

      // Act
      await adminController.createUser(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(validateSchema).toHaveBeenCalledWith(expect.anything(), userData);
      expect(userService.createUser).toHaveBeenCalledWith(userData, 'admin-user-id', true);
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          actorUserId: 'admin-user-id',
          action: APP_CONSTANTS.AUDIT_ACTIONS.USER_CREATE,
          entityType: 'User',
          entityId: createdUser.id,
          ipAddress: '127.0.0.1',
        }),
      });
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'User created successfully',
          data: createdUser,
        })
      );
    });

    it('should return validation error for invalid data', async () => {
      // Arrange
      const invalidData = {
        role: 'INVALID_ROLE',
        name: '',
        email: 'invalid-email',
      };

      mockRequest.body = invalidData;

      const validationErrors = {
        role: ['Invalid role'],
        name: ['Name is required'],
        email: ['Invalid email format'],
      };

      (validateSchema as jest.Mock).mockReturnValue({
        success: false,
        errors: validationErrors,
      });

      const responseHelperSpy = jest.spyOn(ResponseHelper, 'validationError');

      // Act
      await adminController.createUser(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(validateSchema).toHaveBeenCalledWith(expect.anything(), invalidData);
      expect(responseHelperSpy).toHaveBeenCalledWith(mockResponse, validationErrors);
      expect(userService.createUser).not.toHaveBeenCalled();
    });

    it('should handle errors during user creation', async () => {
      // Arrange
      const userData = {
        role: 'VENDOR',
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!',
      };

      mockRequest.body = userData;

      (validateSchema as jest.Mock).mockReturnValue({
        success: true,
        data: userData,
      });

      const errorMessage = 'Database connection error';
      (userService.createUser as jest.Mock).mockRejectedValue(new Error(errorMessage));

      const responseHelperSpy = jest.spyOn(ResponseHelper, 'error');

      // Act
      await adminController.createUser(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(logger.error).toHaveBeenCalledWith('Admin create user error', { error: expect.any(Error) });
      expect(responseHelperSpy).toHaveBeenCalledWith(mockResponse, errorMessage);
    });
  });

  describe('approveVendor', () => {
    it('should approve a vendor successfully', async () => {
      // Arrange
      const userId = 'vendor-123';
      mockRequest.params = { userId };

      const vendorUser = {
        id: userId,
        email: 'vendor@example.com',
        name: 'Vendor Name',
        status: 'PENDING',
        roles: [
          { role: { name: APP_CONSTANTS.ROLES.VENDOR } },
        ],
        vendorProfile: {
          id: 'vendor-profile-123',
          verified: false,
        },
      };

      (validateSchema as jest.Mock).mockReturnValue({
        success: true,
        data: { userId },
      });

      (userService.findById as jest.Mock).mockResolvedValue(vendorUser);

      const transactionMock = jest.fn().mockImplementation(async (callback) => {
        const tx = {
          user: {
            update: jest.fn().mockResolvedValue({ id: userId, status: 'ACTIVE' }),
          },
          vendorProfile: {
            update: jest.fn().mockResolvedValue({ verified: true }),
          },
        };
        return callback(tx);
      });

      (prisma.$transaction as jest.Mock).mockImplementation(transactionMock);
      (prisma.auditLog.create as jest.Mock).mockResolvedValue({});

      // Act
      await adminController.approveVendor(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(validateSchema).toHaveBeenCalledWith(expect.anything(), { userId });
      expect(userService.findById).toHaveBeenCalledWith(userId);
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          actorUserId: 'admin-user-id',
          action: APP_CONSTANTS.AUDIT_ACTIONS.VENDOR_APPROVE,
          entityType: 'VendorProfile',
          entityId: userId,
        }),
      });
      expect(logger.info).toHaveBeenCalledWith('Vendor approved', {
        userId,
        approvedBy: 'admin-user-id',
      });
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Vendor approved successfully',
        })
      );
    });

    it('should return 404 if vendor not found', async () => {
      // Arrange
      const userId = 'non-existent-user';
      mockRequest.params = { userId };

      (validateSchema as jest.Mock).mockReturnValue({
        success: true,
        data: { userId },
      });

      (userService.findById as jest.Mock).mockResolvedValue(null);

      const responseHelperSpy = jest.spyOn(ResponseHelper, 'notFound');

      // Act
      await adminController.approveVendor(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(userService.findById).toHaveBeenCalledWith(userId);
      expect(responseHelperSpy).toHaveBeenCalledWith(mockResponse, 'User not found');
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should return error if user is not a vendor', async () => {
      // Arrange
      const userId = 'admin-123';
      mockRequest.params = { userId };

      const adminUser = {
        id: userId,
        email: 'admin@example.com',
        status: 'ACTIVE',
        roles: [
          { role: { name: APP_CONSTANTS.ROLES.ADMIN } },
        ],
      };

      (validateSchema as jest.Mock).mockReturnValue({
        success: true,
        data: { userId },
      });

      (userService.findById as jest.Mock).mockResolvedValue(adminUser);

      const responseHelperSpy = jest.spyOn(ResponseHelper, 'error');

      // Act
      await adminController.approveVendor(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(userService.findById).toHaveBeenCalledWith(userId);
      expect(responseHelperSpy).toHaveBeenCalledWith(mockResponse, 'User is not a vendor');
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should return error if vendor is already approved', async () => {
      // Arrange
      const userId = 'vendor-123';
      mockRequest.params = { userId };

      const activeVendor = {
        id: userId,
        email: 'vendor@example.com',
        status: 'ACTIVE',
        roles: [
          { role: { name: APP_CONSTANTS.ROLES.VENDOR } },
        ],
      };

      (validateSchema as jest.Mock).mockReturnValue({
        success: true,
        data: { userId },
      });

      (userService.findById as jest.Mock).mockResolvedValue(activeVendor);

      const responseHelperSpy = jest.spyOn(ResponseHelper, 'error');

      // Act
      await adminController.approveVendor(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(responseHelperSpy).toHaveBeenCalledWith(mockResponse, 'Vendor is already approved');
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      // Arrange
      mockRequest.params = { userId: '' };

      const validationErrors = {
        userId: ['User ID is required'],
      };

      (validateSchema as jest.Mock).mockReturnValue({
        success: false,
        errors: validationErrors,
      });

      const responseHelperSpy = jest.spyOn(ResponseHelper, 'validationError');

      // Act
      await adminController.approveVendor(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(responseHelperSpy).toHaveBeenCalledWith(mockResponse, validationErrors);
      expect(userService.findById).not.toHaveBeenCalled();
    });
  });

  describe('suspendVendor', () => {
    it('should suspend a vendor successfully', async () => {
      // Arrange
      const userId = 'vendor-123';
      mockRequest.params = { userId };

      const suspendedUser = {
        id: userId,
        status: 'SUSPENDED',
      };

      (validateSchema as jest.Mock).mockReturnValue({
        success: true,
        data: { userId },
      });

      (userService.updateUserStatus as jest.Mock).mockResolvedValue(suspendedUser);
      (prisma.auditLog.create as jest.Mock).mockResolvedValue({});

      // Act
      await adminController.suspendVendor(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(validateSchema).toHaveBeenCalledWith(expect.anything(), { userId });
      expect(userService.updateUserStatus).toHaveBeenCalledWith(userId, 'SUSPENDED', 'admin-user-id');
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          actorUserId: 'admin-user-id',
          action: APP_CONSTANTS.AUDIT_ACTIONS.VENDOR_SUSPEND,
          entityType: 'User',
          entityId: userId,
        }),
      });
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Vendor suspended successfully',
          data: suspendedUser,
        })
      );
    });

    it('should handle validation errors', async () => {
      // Arrange
      mockRequest.params = { userId: '' };

      const validationErrors = {
        userId: ['User ID is required'],
      };

      (validateSchema as jest.Mock).mockReturnValue({
        success: false,
        errors: validationErrors,
      });

      const responseHelperSpy = jest.spyOn(ResponseHelper, 'validationError');

      // Act
      await adminController.suspendVendor(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(responseHelperSpy).toHaveBeenCalledWith(mockResponse, validationErrors);
      expect(userService.updateUserStatus).not.toHaveBeenCalled();
    });

    it('should handle errors during suspension', async () => {
      // Arrange
      const userId = 'vendor-123';
      mockRequest.params = { userId };

      (validateSchema as jest.Mock).mockReturnValue({
        success: true,
        data: { userId },
      });

      const errorMessage = 'User not found';
      (userService.updateUserStatus as jest.Mock).mockRejectedValue(new Error(errorMessage));

      const responseHelperSpy = jest.spyOn(ResponseHelper, 'error');

      // Act
      await adminController.suspendVendor(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(logger.error).toHaveBeenCalledWith('Admin suspend vendor error', { error: expect.any(Error) });
      expect(responseHelperSpy).toHaveBeenCalledWith(mockResponse, errorMessage);
    });
  });

  describe('listUsers', () => {
    it('should list users with default pagination', async () => {
      // Arrange
      const users = [
        { id: '1', name: 'User 1', email: 'user1@example.com', status: 'ACTIVE' },
        { id: '2', name: 'User 2', email: 'user2@example.com', status: 'PENDING' },
      ];

      const listResult = {
        users,
        total: 25,
      };

      (userService.listUsers as jest.Mock).mockResolvedValue(listResult);

      // Act
      await adminController.listUsers(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(userService.listUsers).toHaveBeenCalledWith({
        role: undefined,
        status: undefined,
        limit: 10,
        offset: 0,
      });
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: {
            users,
            pagination: {
              page: 1,
              limit: 10,
              total: 25,
              pages: 3,
            },
          },
        })
      );
    });

    it('should list users with custom pagination and filters', async () => {
      // Arrange
      mockRequest.query = {
        role: 'VENDOR',
        status: 'PENDING',
        page: '2',
        limit: '20',
      };

      const users = [
        { id: '1', name: 'Vendor 1', email: 'vendor1@example.com', status: 'PENDING' },
      ];

      const listResult = {
        users,
        total: 45,
      };

      (userService.listUsers as jest.Mock).mockResolvedValue(listResult);

      // Act
      await adminController.listUsers(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(userService.listUsers).toHaveBeenCalledWith({
        role: 'VENDOR',
        status: 'PENDING',
        limit: 20,
        offset: 20, // (page 2 - 1) * 20
      });
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: {
            users,
            pagination: {
              page: 2,
              limit: 20,
              total: 45,
              pages: 3, // Math.ceil(45 / 20)
            },
          },
        })
      );
    });

    it('should handle errors during user listing', async () => {
      // Arrange
      const errorMessage = 'Database error';
      (userService.listUsers as jest.Mock).mockRejectedValue(new Error(errorMessage));

      const responseHelperSpy = jest.spyOn(ResponseHelper, 'error');

      // Act
      await adminController.listUsers(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(logger.error).toHaveBeenCalledWith('Admin list users error', { error: expect.any(Error) });
      expect(responseHelperSpy).toHaveBeenCalledWith(mockResponse, errorMessage);
    });
  });

  describe('getUserDetails', () => {
    it('should get user details for a regular user', async () => {
      // Arrange
      const userId = 'user-123';
      mockRequest.params = { userId };

      const user = {
        id: userId,
        email: 'user@example.com',
        name: 'Test User',
        status: 'ACTIVE',
        lastLoginAt: new Date('2024-01-15'),
        createdAt: new Date('2024-01-01'),
        roles: [
          { role: { name: 'OPS' } },
        ],
        vendorProfile: null,
      };

      (userService.findById as jest.Mock).mockResolvedValue(user);

      // Act
      await adminController.getUserDetails(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(userService.findById).toHaveBeenCalledWith(userId);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: {
            id: user.id,
            email: user.email,
            name: user.name,
            status: user.status,
            lastLoginAt: user.lastLoginAt,
            createdAt: user.createdAt,
            roles: ['OPS'],
            vendorProfile: undefined,
          },
        })
      );
    });

    it('should get user details for a vendor with profile', async () => {
      // Arrange
      const userId = 'vendor-123';
      mockRequest.params = { userId };

      const user = {
        id: userId,
        email: 'vendor@example.com',
        name: 'Vendor User',
        status: 'ACTIVE',
        lastLoginAt: new Date('2024-01-15'),
        createdAt: new Date('2024-01-01'),
        roles: [
          { role: { name: 'VENDOR' } },
        ],
        vendorProfile: {
          id: 'profile-123',
          contactPersonName: 'Contact Person',
          contactPhone: '+919876543210',
          warehouseLocation: 'Mumbai',
          pincode: '400001',
          companyName: 'ABC Company',
          gstNumber: 'GST123456',
          panNumber: 'PAN123456',
          verified: true,
          verifiedAt: new Date('2024-01-10'),
        },
      };

      (userService.findById as jest.Mock).mockResolvedValue(user);

      // Act
      await adminController.getUserDetails(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(userService.findById).toHaveBeenCalledWith(userId);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            id: user.id,
            email: user.email,
            roles: ['VENDOR'],
            vendorProfile: expect.objectContaining({
              id: 'profile-123',
              contactPersonName: 'Contact Person',
              verified: true,
            }),
          }),
        })
      );
    });

    it('should return 404 if user not found', async () => {
      // Arrange
      const userId = 'non-existent-user';
      mockRequest.params = { userId };

      (userService.findById as jest.Mock).mockResolvedValue(null);

      const responseHelperSpy = jest.spyOn(ResponseHelper, 'notFound');

      // Act
      await adminController.getUserDetails(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(userService.findById).toHaveBeenCalledWith(userId);
      expect(responseHelperSpy).toHaveBeenCalledWith(mockResponse, 'User not found');
    });

    it('should handle errors during user details retrieval', async () => {
      // Arrange
      const userId = 'user-123';
      mockRequest.params = { userId };

      const errorMessage = 'Database error';
      (userService.findById as jest.Mock).mockRejectedValue(new Error(errorMessage));

      const responseHelperSpy = jest.spyOn(ResponseHelper, 'error');

      // Act
      await adminController.getUserDetails(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(logger.error).toHaveBeenCalledWith('Admin get user details error', { error: expect.any(Error) });
      expect(responseHelperSpy).toHaveBeenCalledWith(mockResponse, errorMessage);
    });
  });
});

