import { Prisma, UserStatus } from '@prisma/client';
import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';
import { VendorProfileDto, VendorListDto, UpdateVendorProfileDto } from './vendor.dto';

export class VendorService {
  /**
   * Get all vendors with optional filters
   */
  async listVendors(filters?: {
    status?: UserStatus;
    verified?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ vendors: VendorListDto[], total: number }> {
    try {
      const where: Prisma.VendorProfileWhereInput = {};
      
      if (filters?.verified !== undefined) {
        where.verified = filters.verified;
      }

      if (filters?.status) {
        where.user = {
          status: filters.status
        };
      }

      const [vendors, total] = await Promise.all([
        prisma.vendorProfile.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                status: true
              }
            }
          },
          take: filters?.limit,
          skip: filters?.offset,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.vendorProfile.count({ where })
      ]);

      return {
        vendors: vendors.map(v => ({
          id: v.id,
          userId: v.userId,
          companyName: v.companyName,
          contactPersonName: v.contactPersonName,
          contactPhone: v.contactPhone,
          warehouseLocation: v.warehouseLocation,
          pincode: v.pincode,
          email: v.user.email || undefined,
          status: v.user.status,
          verified: v.verified,
          fillRate: v.fillRate || undefined,
          slaComplianceRate: v.slaComplianceRate || undefined,
          createdAt: v.createdAt
        })),
        total
      };
    } catch (error) {
      logger.error('Failed to list vendors', { error });
      throw error;
    }
  }

  /**
   * Get vendor profile by user ID
   */
  async getVendorByUserId(userId: string): Promise<VendorProfileDto | null> {
    try {
      const vendor = await prisma.vendorProfile.findUnique({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              status: true
            }
          }
        }
      });

      if (!vendor) {
        return null;
      }

      return {
        id: vendor.id,
        userId: vendor.userId,
        companyName: vendor.companyName,
        contactPersonName: vendor.contactPersonName,
        contactPhone: vendor.contactPhone,
        warehouseLocation: vendor.warehouseLocation,
        pincode: vendor.pincode,
        gstNumber: vendor.gstNumber || undefined,
        panNumber: vendor.panNumber || undefined,
        verified: vendor.verified,
        verifiedAt: vendor.verifiedAt || undefined,
        verifiedBy: vendor.verifiedBy || undefined,
        fillRate: vendor.fillRate || undefined,
        slaComplianceRate: vendor.slaComplianceRate || undefined,
        createdAt: vendor.createdAt,
        updatedAt: vendor.updatedAt,
        user: {
          ...vendor.user,
          email: vendor.user.email || undefined
        }
      };
    } catch (error) {
      logger.error('Failed to get vendor', { error, userId });
      throw error;
    }
  }

  /**
   * Get vendor profile by vendor profile ID
   */
  async getVendorById(vendorId: string): Promise<VendorProfileDto | null> {
    try {
      const vendor = await prisma.vendorProfile.findUnique({
        where: { id: vendorId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              status: true
            }
          }
        }
      });

      if (!vendor) {
        return null;
      }

      return {
        id: vendor.id,
        userId: vendor.userId,
        companyName: vendor.companyName,
        contactPersonName: vendor.contactPersonName,
        contactPhone: vendor.contactPhone,
        warehouseLocation: vendor.warehouseLocation,
        pincode: vendor.pincode,
        gstNumber: vendor.gstNumber || undefined,
        panNumber: vendor.panNumber || undefined,
        verified: vendor.verified,
        verifiedAt: vendor.verifiedAt || undefined,
        verifiedBy: vendor.verifiedBy || undefined,
        fillRate: vendor.fillRate || undefined,
        slaComplianceRate: vendor.slaComplianceRate || undefined,
        createdAt: vendor.createdAt,
        updatedAt: vendor.updatedAt,
        user: {
          ...vendor.user,
          email: vendor.user.email || undefined
        }
      };
    } catch (error) {
      logger.error('Failed to get vendor', { error, vendorId });
      throw error;
    }
  }

  /**
   * Update vendor profile
   */
  async updateVendorProfile(
    userId: string,
    data: UpdateVendorProfileDto
  ): Promise<VendorProfileDto> {
    try {
      const vendor = await prisma.vendorProfile.update({
        where: { userId },
        data,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              status: true
            }
          }
        }
      });

      logger.info('Vendor profile updated', { userId });

      return {
        id: vendor.id,
        userId: vendor.userId,
        companyName: vendor.companyName,
        contactPersonName: vendor.contactPersonName,
        contactPhone: vendor.contactPhone,
        warehouseLocation: vendor.warehouseLocation,
        pincode: vendor.pincode,
        gstNumber: vendor.gstNumber || undefined,
        panNumber: vendor.panNumber || undefined,
        verified: vendor.verified,
        verifiedAt: vendor.verifiedAt || undefined,
        verifiedBy: vendor.verifiedBy || undefined,
        fillRate: vendor.fillRate || undefined,
        slaComplianceRate: vendor.slaComplianceRate || undefined,
        createdAt: vendor.createdAt,
        updatedAt: vendor.updatedAt,
        user: {
          ...vendor.user,
          email: vendor.user.email || undefined
        }
      };
    } catch (error) {
      logger.error('Failed to update vendor profile', { error, userId });
      throw error;
    }
  }

  /**
   * Approve vendor (Admin only)
   */
  async approveVendor(userId: string, approvedBy: string): Promise<void> {
    try {
      await prisma.$transaction(async (tx) => {
        // Update user status
        await tx.user.update({
          where: { id: userId },
          data: { status: UserStatus.ACTIVE }
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

      logger.info('Vendor approved', { userId, approvedBy });
    } catch (error) {
      logger.error('Failed to approve vendor', { error, userId });
      throw error;
    }
  }

  /**
   * Get vendor statistics
   */
  async getVendorStats(vendorId: string): Promise<any> {
    try {
      // Get order counts
      const [totalOrders, activeOrders, completedOrders] = await Promise.all([
        prisma.assignedOrderItem.count({
          where: { vendorId }
        }),
        prisma.assignedOrderItem.count({
          where: { 
            vendorId,
            status: { in: ['PENDING_CONFIRMATION', 'VENDOR_CONFIRMED_FULL', 'VENDOR_CONFIRMED_PARTIAL', 'INVOICED', 'DISPATCHED'] }
          }
        }),
        prisma.assignedOrderItem.count({
          where: { 
            vendorId,
            status: 'COMPLETED'
          }
        })
      ]);

      const vendor = await prisma.vendorProfile.findUnique({
        where: { id: vendorId }
      });

      return {
        totalOrders,
        activeOrders,
        completedOrders,
        fillRate: vendor?.fillRate || 0,
        slaCompliance: vendor?.slaComplianceRate || 0,
        totalRevenue: 0 // Calculate from completed orders if needed
      };
    } catch (error) {
      logger.error('Failed to get vendor stats', { error, vendorId });
      throw error;
    }
  }
}

export const vendorService = new VendorService();

