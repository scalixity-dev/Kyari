import { Request, Response } from 'express';
import { userService } from '../users/user.service';
import { 
  createUserSchema, 
  approveVendorSchema, 
  validateSchema 
} from '../auth/auth.validators';
import { ResponseHelper } from '../../utils/response';
import { logger } from '../../utils/logger';
import { prisma } from '../../config/database';
import { APP_CONSTANTS } from '../../config/constants';

export class AdminController {
  async createUser(req: Request, res: Response): Promise<void> {
    try {
      const validation = validateSchema(createUserSchema, req.body);
      if (!validation.success) {
        ResponseHelper.validationError(res, validation.errors);
        return;
      }

      const createdBy = req.user?.userId;
      const result = await userService.createUser(validation.data, createdBy, true);

      // Audit log
      await this.createAuditLog(
        createdBy || null,
        APP_CONSTANTS.AUDIT_ACTIONS.USER_CREATE,
        'User',
        result.user.id,
        { role: validation.data.role, email: validation.data.email },
        req.ip,
        req.get('User-Agent')
      );

      ResponseHelper.success(res, result.user, 'User created successfully', 201);
    } catch (error) {
      logger.error('Admin create user error', { error });
      ResponseHelper.error(res, error instanceof Error ? error.message : 'Failed to create user');
    }
  }

  async approveVendor(req: Request, res: Response): Promise<void> {
    try {
      const validation = validateSchema(approveVendorSchema, { userId: req.params.userId });
      if (!validation.success) {
        ResponseHelper.validationError(res, validation.errors);
        return;
      }

      const { userId } = validation.data;
      const approvedBy = req.user?.userId;

      // Check if user exists and is a vendor
      const user = await userService.findById(userId);
      if (!user) {
        ResponseHelper.notFound(res, 'User not found');
        return;
      }

      const isVendor = user.roles.some((ur: any) => ur.role.name === APP_CONSTANTS.ROLES.VENDOR);
      if (!isVendor) {
        ResponseHelper.error(res, 'User is not a vendor');
        return;
      }

      if (user.status === 'ACTIVE') {
        ResponseHelper.error(res, 'Vendor is already approved');
        return;
      }

      // Update user status and vendor profile
      await prisma.$transaction(async (tx: any) => {
        // Update user status
        await tx.user.update({
          where: { id: userId },
          data: { status: 'ACTIVE' }
        });

        // Update vendor profile verification
        await tx.vendorProfile.update({
          where: { userId },
          data: {
            verified: true,
            verifiedAt: new Date(),
            verifiedBy: approvedBy
          }
        });
      });

      // Audit log
      await this.createAuditLog(
        approvedBy || null,
        APP_CONSTANTS.AUDIT_ACTIONS.VENDOR_APPROVE,
        'VendorProfile',
        userId,
        { email: user.email },
        req.ip,
        req.get('User-Agent')
      );

      logger.info('Vendor approved', { userId, approvedBy });
      ResponseHelper.success(res, null, 'Vendor approved successfully');
    } catch (error) {
      logger.error('Admin approve vendor error', { error });
      ResponseHelper.error(res, error instanceof Error ? error.message : 'Failed to approve vendor');
    }
  }

  async suspendVendor(req: Request, res: Response): Promise<void> {
    try {
      const validation = validateSchema(approveVendorSchema, { userId: req.params.userId });
      if (!validation.success) {
        ResponseHelper.validationError(res, validation.errors);
        return;
      }

      const { userId } = validation.data;
      const suspendedBy = req.user?.userId;

      const result = await userService.updateUserStatus(userId, 'SUSPENDED', suspendedBy);

      // Audit log
      await this.createAuditLog(
        suspendedBy || null,
        APP_CONSTANTS.AUDIT_ACTIONS.VENDOR_SUSPEND,
        'User',
        userId,
        {},
        req.ip,
        req.get('User-Agent')
      );

      ResponseHelper.success(res, result, 'Vendor suspended successfully');
    } catch (error) {
      logger.error('Admin suspend vendor error', { error });
      ResponseHelper.error(res, error instanceof Error ? error.message : 'Failed to suspend vendor');
    }
  }

  async listUsers(req: Request, res: Response): Promise<void> {
    try {
      const { role, status, page = '1', limit = '10' } = req.query;
      
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const offset = (pageNum - 1) * limitNum;

      const filters = {
        role: role as string,
        status: status as any,
        limit: limitNum,
        offset
      };

      const result = await userService.listUsers(filters);

      ResponseHelper.success(res, {
        users: result.users,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: result.total,
          pages: Math.ceil(result.total / limitNum)
        }
      });
    } catch (error) {
      logger.error('Admin list users error', { error });
      ResponseHelper.error(res, error instanceof Error ? error.message : 'Failed to list users');
    }
  }

  async getUserDetails(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      
      const user = await userService.findById(userId);
      if (!user) {
        ResponseHelper.notFound(res, 'User not found');
        return;
      }

      const userDto = {
        id: user.id,
        email: user.email || undefined,
        name: user.name,
        status: user.status,
        lastLoginAt: user.lastLoginAt || undefined,
        createdAt: user.createdAt,
        roles: user.roles.map((ur: any) => ur.role.name),
        vendorProfile: user.vendorProfile ? {
          id: user.vendorProfile.id,
          contactPersonName: user.vendorProfile.contactPersonName,
          contactPhone: user.vendorProfile.contactPhone,
          warehouseLocation: user.vendorProfile.warehouseLocation,
          pincode: user.vendorProfile.pincode,
          companyName: user.vendorProfile.companyName || undefined,
          gstNumber: user.vendorProfile.gstNumber || undefined,
          panNumber: user.vendorProfile.panNumber || undefined,
          verified: user.vendorProfile.verified,
          verifiedAt: user.vendorProfile.verifiedAt || undefined
        } : undefined
      };

      ResponseHelper.success(res, userDto);
    } catch (error) {
      logger.error('Admin get user details error', { error });
      ResponseHelper.error(res, error instanceof Error ? error.message : 'Failed to get user details');
    }
  }

  private async createAuditLog(
    actorUserId: string | null,
    action: string,
    entityType: string,
    entityId: string,
    metadata: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await prisma.auditLog.create({
      data: {
        actorUserId,
        action,
        entityType,
        entityId,
        metadata,
        ipAddress,
        userAgent
      }
    });
  }
}

export const adminController = new AdminController();