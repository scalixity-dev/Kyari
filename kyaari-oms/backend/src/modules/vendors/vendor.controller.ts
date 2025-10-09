import { Request, Response } from 'express';
import { vendorService } from './vendor.service';
import { userService } from '../users/user.service';
import { ResponseHelper } from '../../utils/response';
import { logger } from '../../utils/logger';
import { z } from 'zod';
import { validateSchema } from '../auth/auth.validators';
import { APP_CONSTANTS } from '../../config/constants';
import { prisma } from '../../config/database';

const updateVendorProfileSchema = z.object({
  companyName: z.string().min(1).optional(),
  contactPersonName: z.string().min(1).optional(),
  contactPhone: z.string().regex(/^\+?[\d\s\-\(\)]{10,20}$/).optional(),
  warehouseLocation: z.string().min(1).optional(),
  pincode: z.string().regex(/^\d{6}$/).optional(),
  gstNumber: z.string().optional(),
  panNumber: z.string().optional(),
});

export class VendorController {
  /**
   * Get all vendors (Admin only)
   */
  async getVendors(req: Request, res: Response): Promise<void> {
    try {
      const { status, verified, page = '1', limit = '50' } = req.query;
      
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const offset = (pageNum - 1) * limitNum;

      const filters = {
        status: status as any,
        verified: verified === 'true' ? true : verified === 'false' ? false : undefined,
        limit: limitNum,
        offset
      };

      const result = await vendorService.listVendors(filters);

      ResponseHelper.success(res, {
        vendors: result.vendors,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: result.total,
          pages: Math.ceil(result.total / limitNum)
        }
      });
    } catch (error) {
      logger.error('Get vendors error', { error });
      ResponseHelper.error(res, error instanceof Error ? error.message : 'Failed to fetch vendors');
    }
  }

  /**
   * Get vendor details by ID (Admin) or own profile (Vendor)
   */
  async getVendorById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const currentUserId = req.user?.userId;
      const currentUserRoles = req.user?.roles || [];

      const vendor = await vendorService.getVendorById(id);
      
      if (!vendor) {
        ResponseHelper.notFound(res, 'Vendor not found');
        return;
      }

      // Vendors can only see their own profile, admins can see all
      const isAdmin = currentUserRoles.includes(APP_CONSTANTS.ROLES.ADMIN);
      if (!isAdmin && vendor.userId !== currentUserId) {
        ResponseHelper.forbidden(res, 'You can only access your own profile');
        return;
      }

      ResponseHelper.success(res, vendor);
    } catch (error) {
      logger.error('Get vendor by ID error', { error });
      ResponseHelper.error(res, error instanceof Error ? error.message : 'Failed to fetch vendor');
    }
  }

  /**
   * Get current vendor's profile
   */
  async getMyProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      
      if (!userId) {
        ResponseHelper.unauthorized(res);
        return;
      }

      const vendor = await vendorService.getVendorByUserId(userId);
      
      if (!vendor) {
        ResponseHelper.notFound(res, 'Vendor profile not found');
        return;
      }

      ResponseHelper.success(res, vendor);
    } catch (error) {
      logger.error('Get my profile error', { error });
      ResponseHelper.error(res, error instanceof Error ? error.message : 'Failed to fetch profile');
    }
  }

  /**
   * Update vendor profile
   */
  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      
      if (!userId) {
        ResponseHelper.unauthorized(res);
        return;
      }

      const validation = validateSchema(updateVendorProfileSchema, req.body);
      if (!validation.success) {
        ResponseHelper.validationError(res, validation.errors);
        return;
      }

      const updatedVendor = await vendorService.updateVendorProfile(userId, validation.data);

      logger.info('Vendor profile updated', { userId });
      ResponseHelper.success(res, updatedVendor, 'Profile updated successfully');
    } catch (error) {
      logger.error('Update vendor profile error', { error });
      ResponseHelper.error(res, error instanceof Error ? error.message : 'Failed to update profile');
    }
  }

  /**
   * Approve vendor (Admin only)
   */
  async approveVendor(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const approvedBy = req.user?.userId;

      if (!approvedBy) {
        ResponseHelper.unauthorized(res);
        return;
      }

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

      await vendorService.approveVendor(userId, approvedBy);

      // Audit log
      await this.createAuditLog(
        approvedBy,
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
      logger.error('Approve vendor error', { error });
      ResponseHelper.error(res, error instanceof Error ? error.message : 'Failed to approve vendor');
    }
  }

  /**
   * Suspend vendor (Admin only)
   */
  async suspendVendor(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const suspendedBy = req.user?.userId;

      if (!suspendedBy) {
        ResponseHelper.unauthorized(res);
        return;
      }

      const result = await userService.updateUserStatus(userId, 'SUSPENDED', suspendedBy);

      // Audit log
      await this.createAuditLog(
        suspendedBy,
        APP_CONSTANTS.AUDIT_ACTIONS.VENDOR_SUSPEND,
        'User',
        userId,
        {},
        req.ip,
        req.get('User-Agent')
      );

      ResponseHelper.success(res, result, 'Vendor suspended successfully');
    } catch (error) {
      logger.error('Suspend vendor error', { error });
      ResponseHelper.error(res, error instanceof Error ? error.message : 'Failed to suspend vendor');
    }
  }

  /**
   * Get vendor statistics
   */
  async getVendorStats(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      
      if (!userId) {
        ResponseHelper.unauthorized(res);
        return;
      }

      const vendor = await vendorService.getVendorByUserId(userId);
      if (!vendor) {
        ResponseHelper.notFound(res, 'Vendor profile not found');
        return;
      }

      const stats = await vendorService.getVendorStats(vendor.id);
      ResponseHelper.success(res, stats);
    } catch (error) {
      logger.error('Get vendor stats error', { error });
      ResponseHelper.error(res, error instanceof Error ? error.message : 'Failed to fetch statistics');
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

export const vendorController = new VendorController();

