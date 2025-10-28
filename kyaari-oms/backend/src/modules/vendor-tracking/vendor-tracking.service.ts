import { Prisma, AssignmentStatus } from '@prisma/client';
import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';
import { 
  VendorTrackingQueryDto, 
  VendorTrackingResponseDto, 
  VendorFillRateDto,
  VendorPerformanceMetricsDto,
  VendorSlaDto,
  VendorSlaQueryDto,
  VendorTrackingDashboardDto
} from './vendor-tracking.dto';

export class VendorTrackingService {

  /**
   * Get vendor tracking data with fill rate calculations
   */
  async getVendorTracking(query: VendorTrackingQueryDto): Promise<VendorTrackingResponseDto> {
    try {
      const where: Prisma.AssignedOrderItemWhereInput = {};

      // Apply filters
      if (query.vendorId) {
        where.vendorId = query.vendorId;
      }

      if (query.status) {
        where.status = query.status;
      }

      if (query.startDate || query.endDate) {
        where.assignedAt = {};
        if (query.startDate) {
          where.assignedAt.gte = query.startDate;
        }
        if (query.endDate) {
          where.assignedAt.lte = query.endDate;
        }
      }

      // Get vendor tracking data with related information
      const [assignments, total] = await Promise.all([
        prisma.assignedOrderItem.findMany({
          where,
          include: {
            vendor: {
              select: {
                id: true,
                companyName: true,
                contactPersonName: true,
                contactPhone: true,
                fillRate: true,
                slaComplianceRate: true,
                user: {
                  select: {
                    id: true,
                    email: true,
                    name: true,
                    status: true
                  }
                }
              }
            },
            orderItem: {
              select: {
                id: true,
                productName: true,
                sku: true,
                quantity: true,
                pricePerUnit: true,
                totalPrice: true,
                order: {
                  select: {
                    id: true,
                    orderNumber: true,
                    clientOrderId: true,
                    status: true,
                    createdAt: true
                  }
                }
              }
            },
            assignedBy: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: { assignedAt: 'desc' },
          take: query.limit || 50,
          skip: query.offset || 0
        }),
        prisma.assignedOrderItem.count({ where })
      ]);

      // Calculate fill rate for each vendor
      const vendorFillRates = await this.calculateVendorFillRates(query);

      return {
        assignments: assignments.map(assignment => ({
          id: assignment.id,
          assignedQuantity: assignment.assignedQuantity,
          confirmedQuantity: assignment.confirmedQuantity ?? undefined,
          status: assignment.status,
          vendorRemarks: assignment.vendorRemarks ?? undefined,
          assignedAt: assignment.assignedAt,
          vendorActionAt: assignment.vendorActionAt ?? undefined,
          vendor: {
            id: assignment.vendor.id,
            companyName: assignment.vendor.companyName,
            contactPersonName: assignment.vendor.contactPersonName,
            contactPhone: assignment.vendor.contactPhone,
            fillRate: assignment.vendor.fillRate ?? undefined,
            slaComplianceRate: assignment.vendor.slaComplianceRate ?? undefined,
            user: {
              ...assignment.vendor.user,
              email: assignment.vendor.user.email ?? undefined
            }
          },
          orderItem: {
            id: assignment.orderItem.id,
            productName: assignment.orderItem.productName,
            sku: assignment.orderItem.sku ?? undefined,
            quantity: assignment.orderItem.quantity,
            pricePerUnit: assignment.orderItem.pricePerUnit ? Number(assignment.orderItem.pricePerUnit) : undefined,
            totalPrice: assignment.orderItem.totalPrice ? Number(assignment.orderItem.totalPrice) : undefined,
            order: assignment.orderItem.order
          },
          assignedBy: {
            ...assignment.assignedBy,
            email: assignment.assignedBy.email ?? undefined
          }
        })),
        vendorFillRates,
        pagination: {
          total,
          limit: query.limit || 50,
          offset: query.offset || 0,
          hasMore: (query.offset || 0) + (query.limit || 50) < total
        }
      };

    } catch (error) {
      logger.error('Failed to get vendor tracking data', { error, query });
      throw error;
    }
  }

  /**
   * Calculate fill rate for vendors
   */
  async calculateVendorFillRates(query?: VendorTrackingQueryDto): Promise<VendorFillRateDto[]> {
    try {
      const where: Prisma.AssignedOrderItemWhereInput = {};

      if (query?.vendorId) {
        where.vendorId = query.vendorId;
      }

      if (query?.startDate || query?.endDate) {
        where.assignedAt = {};
        if (query.startDate) {
          where.assignedAt.gte = query.startDate;
        }
        if (query.endDate) {
          where.assignedAt.lte = query.endDate;
        }
      }

      // Get vendor statistics
      const vendorStats = await prisma.assignedOrderItem.groupBy({
        by: ['vendorId'],
        where,
        _count: {
          id: true
        },
        _sum: {
          assignedQuantity: true,
          confirmedQuantity: true
        }
      });

      // Get vendor details
      const vendorIds = vendorStats.map(stat => stat.vendorId);
      const vendors = await prisma.vendorProfile.findMany({
        where: { id: { in: vendorIds } },
        select: {
          id: true,
          companyName: true,
          contactPersonName: true,
          contactPhone: true,
          fillRate: true,
          slaComplianceRate: true,
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

      // Calculate fill rates
      const fillRates: VendorFillRateDto[] = vendorStats.map(stat => {
        const vendor = vendors.find(v => v.id === stat.vendorId);
        if (!vendor) return null;

        const totalAssigned = stat._sum.assignedQuantity || 0;
        const totalConfirmed = stat._sum.confirmedQuantity || 0;
        const totalOrders = stat._count.id;
        
        // Calculate fill rate percentage
        const fillRate = totalAssigned > 0 ? (totalConfirmed / totalAssigned) * 100 : 0;

        return {
          vendorId: stat.vendorId,
          vendor: {
            id: vendor.id,
            companyName: vendor.companyName,
            contactPersonName: vendor.contactPersonName,
            contactPhone: vendor.contactPhone,
            fillRate: vendor.fillRate,
            slaComplianceRate: vendor.slaComplianceRate,
            user: vendor.user
          },
          totalOrders,
          totalAssignedQuantity: totalAssigned,
          totalConfirmedQuantity: totalConfirmed,
          calculatedFillRate: Math.round(fillRate * 100) / 100, // Round to 2 decimal places
          currentFillRate: vendor.fillRate || 0
        };
      }).filter(Boolean) as VendorFillRateDto[];

      return fillRates.sort((a, b) => b.calculatedFillRate - a.calculatedFillRate);

    } catch (error) {
      logger.error('Failed to calculate vendor fill rates', { error, query });
      throw error;
    }
  }

  /**
   * Get detailed performance metrics for a specific vendor
   */
  async getVendorPerformanceMetrics(vendorId: string, query?: VendorTrackingQueryDto): Promise<VendorPerformanceMetricsDto> {
    try {
      const where: Prisma.AssignedOrderItemWhereInput = { vendorId };

      if (query?.startDate || query?.endDate) {
        where.assignedAt = {};
        if (query.startDate) {
          where.assignedAt.gte = query.startDate;
        }
        if (query.endDate) {
          where.assignedAt.lte = query.endDate;
        }
      }

      // Get vendor details
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
        throw new Error('Vendor not found');
      }

      // Get assignment statistics by status
      const statusStats = await prisma.assignedOrderItem.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
        _sum: {
          assignedQuantity: true,
          confirmedQuantity: true
        }
      });

      // Get total statistics
      const totalStats = await prisma.assignedOrderItem.aggregate({
        where,
        _count: { id: true },
        _sum: {
          assignedQuantity: true,
          confirmedQuantity: true
        }
      });

      // Calculate metrics
      const totalOrders = totalStats._count.id;
      const totalAssigned = totalStats._sum.assignedQuantity || 0;
      const totalConfirmed = totalStats._sum.confirmedQuantity || 0;
      const fillRate = totalAssigned > 0 ? (totalConfirmed / totalAssigned) * 100 : 0;

      // Get status breakdown
      const statusBreakdown = statusStats.map(stat => ({
        status: stat.status,
        count: stat._count.id,
        assignedQuantity: stat._sum.assignedQuantity || 0,
        confirmedQuantity: stat._sum.confirmedQuantity || 0
      }));

      // Get recent assignments (last 10)
      const recentAssignments = await prisma.assignedOrderItem.findMany({
        where,
        include: {
          orderItem: {
            select: {
              productName: true,
              quantity: true,
              order: {
                select: {
                  orderNumber: true,
                  createdAt: true
                }
              }
            }
          }
        },
        orderBy: { assignedAt: 'desc' },
        take: 10
      });

      return {
        vendor: {
          id: vendor.id,
          companyName: vendor.companyName,
          contactPersonName: vendor.contactPersonName,
          contactPhone: vendor.contactPhone,
          fillRate: vendor.fillRate ?? undefined,
          slaComplianceRate: vendor.slaComplianceRate ?? undefined,
          user: {
            ...vendor.user,
            email: vendor.user.email ?? undefined
          }
        },
        metrics: {
          totalOrders,
          totalAssignedQuantity: totalAssigned,
          totalConfirmedQuantity: totalConfirmed,
          calculatedFillRate: Math.round(fillRate * 100) / 100,
          currentFillRate: vendor.fillRate || 0
        },
        statusBreakdown,
        recentAssignments: recentAssignments.map(assignment => ({
          id: assignment.id,
          status: assignment.status,
          assignedQuantity: assignment.assignedQuantity,
          confirmedQuantity: assignment.confirmedQuantity ?? undefined,
          assignedAt: assignment.assignedAt,
          vendorActionAt: assignment.vendorActionAt ?? undefined,
          orderItem: {
            productName: assignment.orderItem.productName,
            quantity: assignment.orderItem.quantity,
            order: {
              orderNumber: assignment.orderItem.order.orderNumber,
              createdAt: assignment.orderItem.order.createdAt
            }
          }
        }))
      };

    } catch (error) {
      logger.error('Failed to get vendor performance metrics', { error, vendorId, query });
      throw error;
    }
  }

  /**
   * Update vendor fill rate in the database
   */
  async updateVendorFillRate(vendorId: string, fillRate: number): Promise<void> {
    try {
      await prisma.vendorProfile.update({
        where: { id: vendorId },
        data: { fillRate }
      });

      logger.info('Vendor fill rate updated', { vendorId, fillRate });
    } catch (error) {
      logger.error('Failed to update vendor fill rate', { error, vendorId, fillRate });
      throw error;
    }
  }

  /**
   * Bulk update fill rates for all vendors
   */
  async bulkUpdateFillRates(): Promise<{ updated: number; errors: string[] }> {
    try {
      const fillRates = await this.calculateVendorFillRates();
      const errors: string[] = [];
      let updated = 0;

      for (const fillRate of fillRates) {
        try {
          await this.updateVendorFillRate(fillRate.vendorId, fillRate.calculatedFillRate);
          updated++;
        } catch (error) {
          errors.push(`Failed to update vendor ${fillRate.vendorId}: ${error}`);
        }
      }

      logger.info('Bulk fill rate update completed', { updated, errorCount: errors.length });
      return { updated, errors };

    } catch (error) {
      logger.error('Failed to bulk update fill rates', { error });
      throw error;
    }
  }

  /**
   * Calculate SLA compliance for vendors based on fulfillment times
   */
  async calculateVendorSla(query: VendorSlaQueryDto): Promise<VendorSlaDto[]> {
    try {
      const { bufferPercentage = 15, lookbackDays = 30 } = query;
      
      // Calculate date range for historical data
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - lookbackDays);

      // Get all vendors with their assignments
      const vendors = await prisma.vendorProfile.findMany({
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              status: true
            }
          },
          assignedItems: {
            where: {
              assignedAt: {
                gte: startDate,
                lte: endDate
              },
              status: {
                in: ['COMPLETED', 'VERIFIED_OK', 'DISPATCHED']
              }
            },
            include: {
              orderItem: {
                select: {
                  order: {
                    select: {
                      orderNumber: true,
                      createdAt: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      const slaResults: VendorSlaDto[] = [];

      for (const vendor of vendors) {
        // Calculate average fulfillment time from historical data
        const historicalFulfillmentTimes = vendor.assignedItems
          .filter(item => item.vendorActionAt && item.assignedAt)
          .map(item => {
            const fulfillmentTime = (item.vendorActionAt!.getTime() - item.assignedAt.getTime()) / (1000 * 60 * 60 * 24);
            return fulfillmentTime;
          });

        const avgFulfillmentTime = historicalFulfillmentTimes.length > 0
          ? historicalFulfillmentTimes.reduce((sum, time) => sum + time, 0) / historicalFulfillmentTimes.length
          : 0;

        // Get current pending orders for this vendor
        const currentOrders = await prisma.assignedOrderItem.findMany({
          where: {
            vendorId: vendor.id,
            status: {
              in: ['PENDING_CONFIRMATION', 'VENDOR_CONFIRMED_FULL', 'VENDOR_CONFIRMED_PARTIAL', 'INVOICED']
            }
          },
          include: {
            orderItem: {
              select: {
                order: {
                  select: {
                    orderNumber: true,
                    createdAt: true
                  }
                }
              }
            }
            }
        });

        // Calculate current order times
        const currentOrderTimes = currentOrders
          .map(order => {
            const currentTime = (new Date().getTime() - order.assignedAt.getTime()) / (1000 * 60 * 60 * 24);
            return {
              orderNumber: order.orderItem.order.orderNumber,
              daysSinceAssigned: currentTime,
              status: order.status
            };
          });

        // Calculate SLA benchmark (average + buffer)
        const slaBenchmark = avgFulfillmentTime * (1 + bufferPercentage / 100);

        // Determine SLA status for current orders
        const slaStatus = currentOrderTimes.length > 0
          ? currentOrderTimes.every(order => order.daysSinceAssigned <= slaBenchmark)
            ? 'MET'
            : 'BREACHED'
          : 'NO_CURRENT_ORDERS';

        // Calculate SLA compliance percentage
        const totalHistoricalOrders = historicalFulfillmentTimes.length;
        const compliantOrders = historicalFulfillmentTimes.filter(time => time <= slaBenchmark).length;
        const slaComplianceRate = totalHistoricalOrders > 0 
          ? (compliantOrders / totalHistoricalOrders) * 100 
          : 0;

        slaResults.push({
          vendorId: vendor.id,
          vendor: {
            id: vendor.id,
            companyName: vendor.companyName,
            contactPersonName: vendor.contactPersonName,
            contactPhone: vendor.contactPhone,
            fillRate: vendor.fillRate ?? undefined,
            slaComplianceRate: vendor.slaComplianceRate ?? undefined,
            user: {
              ...vendor.user,
              email: vendor.user.email ?? undefined
            }
          },
          metrics: {
            avgFulfillmentTime: Math.round(avgFulfillmentTime * 100) / 100,
            slaBenchmark: Math.round(slaBenchmark * 100) / 100,
            bufferPercentage,
            totalHistoricalOrders,
            compliantOrders,
            slaComplianceRate: Math.round(slaComplianceRate * 100) / 100
          },
          currentOrders: currentOrderTimes,
          slaStatus,
          lastUpdated: new Date()
        });
      }

      // Sort by SLA compliance rate (highest first)
      return slaResults.sort((a, b) => b.metrics.slaComplianceRate - a.metrics.slaComplianceRate);

    } catch (error) {
      logger.error('Failed to calculate vendor SLA', { error, query });
      throw error;
    }
  }

  /**
   * Get comprehensive vendor tracking dashboard data
   */
  async getVendorTrackingDashboard(query: VendorTrackingQueryDto): Promise<{
    summary: {
      totalVendors: number;
      averageFillRate: number;
      averageSlaCompliance: number;
      totalActiveOrders: number;
      totalCompletedOrders: number;
    };
    vendors: VendorTrackingDashboardDto[];
  }> {
    try {
      const where: Prisma.AssignedOrderItemWhereInput = {};

      if (query.vendorId) {
        where.vendorId = query.vendorId;
      }

      if (query.status) {
        where.status = query.status;
      }

      if (query.startDate || query.endDate) {
        where.assignedAt = {};
        if (query.startDate) {
          where.assignedAt.gte = query.startDate;
        }
        if (query.endDate) {
          where.assignedAt.lte = query.endDate;
        }
      }

      // Get all vendors with their performance data
      const vendors = await prisma.vendorProfile.findMany({
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              status: true
            }
          },
          assignedItems: {
            where: query.startDate || query.endDate ? {
              assignedAt: {
                gte: query.startDate,
                lte: query.endDate
              }
            } : undefined,
            include: {
              orderItem: {
                select: {
                  order: {
                    select: {
                      orderNumber: true,
                      createdAt: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      const vendorDashboardData: VendorTrackingDashboardDto[] = [];

      for (const vendor of vendors) {
        // Calculate metrics for this vendor
        const totalOrders = vendor.assignedItems.length;
        const completedOrders = vendor.assignedItems.filter(item => 
          ['COMPLETED', 'VERIFIED_OK', 'DISPATCHED'].includes(item.status)
        );
        const activeOrders = vendor.assignedItems.filter(item => 
          ['PENDING_CONFIRMATION', 'VENDOR_CONFIRMED_FULL', 'VENDOR_CONFIRMED_PARTIAL', 'INVOICED'].includes(item.status)
        );

        // Calculate fill rate
        const totalAssignedQuantity = vendor.assignedItems.reduce((sum, item) => sum + item.assignedQuantity, 0);
        const totalConfirmedQuantity = vendor.assignedItems.reduce((sum, item) => sum + (item.confirmedQuantity || 0), 0);
        const fillRate = totalAssignedQuantity > 0 ? (totalConfirmedQuantity / totalAssignedQuantity) * 100 : 0;

        // Calculate average fulfillment time
        const fulfillmentTimes = completedOrders
          .filter(item => item.vendorActionAt && item.assignedAt)
          .map(item => {
            const fulfillmentTime = (item.vendorActionAt!.getTime() - item.assignedAt.getTime()) / (1000 * 60 * 60 * 24);
            return fulfillmentTime;
          });

        const avgFulfillmentTime = fulfillmentTimes.length > 0
          ? fulfillmentTimes.reduce((sum, time) => sum + time, 0) / fulfillmentTimes.length
          : 0;

        // Calculate SLA compliance (using 15% buffer as default)
        const slaBenchmark = avgFulfillmentTime * 1.15;
        const compliantOrders = fulfillmentTimes.filter(time => time <= slaBenchmark).length;
        const slaCompliance = fulfillmentTimes.length > 0 ? (compliantOrders / fulfillmentTimes.length) * 100 : 0;

        // Get last activity date
        const lastActivity = vendor.assignedItems
          .filter(item => item.vendorActionAt)
          .sort((a, b) => b.vendorActionAt!.getTime() - a.vendorActionAt!.getTime())[0];

        vendorDashboardData.push({
          vendorId: vendor.id,
          vendor: {
            id: vendor.id,
            companyName: vendor.companyName,
            contactPersonName: vendor.contactPersonName,
            contactPhone: vendor.contactPhone,
            fillRate: vendor.fillRate ?? undefined,
            slaComplianceRate: vendor.slaComplianceRate ?? undefined,
            user: {
              ...vendor.user,
              email: vendor.user.email ?? undefined
            }
          },
          metrics: {
            totalOrders,
            activeOrders: activeOrders.length,
            completedOrders: completedOrders.length,
            fillRate: Math.round(fillRate * 100) / 100,
            slaCompliance: Math.round(slaCompliance * 100) / 100,
            avgFulfillmentTime: Math.round(avgFulfillmentTime * 100) / 100,
            completionRate: totalOrders > 0 ? Math.round((completedOrders.length / totalOrders) * 100) / 100 : 0
          },
          lastActivity: lastActivity?.vendorActionAt ?? undefined,
          status: activeOrders.length > 0 ? 'ACTIVE' : completedOrders.length > 0 ? 'INACTIVE' : 'NO_ORDERS'
        });
      }

      // Calculate summary metrics
      const totalVendors = vendorDashboardData.length;
      const averageFillRate = totalVendors > 0 
        ? vendorDashboardData.reduce((sum, vendor) => sum + vendor.metrics.fillRate, 0) / totalVendors 
        : 0;
      const averageSlaCompliance = totalVendors > 0 
        ? vendorDashboardData.reduce((sum, vendor) => sum + vendor.metrics.slaCompliance, 0) / totalVendors 
        : 0;
      const totalActiveOrders = vendorDashboardData.reduce((sum, vendor) => sum + vendor.metrics.activeOrders, 0);
      const totalCompletedOrders = vendorDashboardData.reduce((sum, vendor) => sum + vendor.metrics.completedOrders, 0);

      // Sort vendors by fill rate (highest first)
      vendorDashboardData.sort((a, b) => b.metrics.fillRate - a.metrics.fillRate);

      return {
        summary: {
          totalVendors,
          averageFillRate: Math.round(averageFillRate * 100) / 100,
          averageSlaCompliance: Math.round(averageSlaCompliance * 100) / 100,
          totalActiveOrders,
          totalCompletedOrders
        },
        vendors: vendorDashboardData
      };

    } catch (error) {
      logger.error('Failed to get vendor tracking dashboard', { error, query });
      throw error;
    }
  }

  /**
   * Get performance trends data for a specific vendor
   */
  async getVendorPerformanceTrends(vendorId: string, timeFilter: 'days' | 'weeks' | 'months'): Promise<{
    trends: {
      period: string;
      fillRate: number;
      slaCompliance: number;
    }[];
    fulfillment: {
      period: string;
      fulfillmentTime: number;
      slaCompliance: number;
    }[];
  }> {
    try {
      const now = new Date();
      let startDate: Date;
      let periodFormat: string;
      let periods: string[];

      // Calculate date range and periods based on filter
      if (timeFilter === 'days') {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        periods = Array.from({ length: 30 }, (_, i) => `${i + 1}`);
        periodFormat = 'day';
      } else if (timeFilter === 'weeks') {
        startDate = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
        periods = Array.from({ length: 4 }, (_, i) => `Week ${i + 1}`);
        periodFormat = 'week';
      } else {
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); // Last 12 months
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        periods = monthNames;
        periodFormat = 'month';
      }

      // Get assignments for the vendor in the date range
      const assignments = await prisma.assignedOrderItem.findMany({
        where: {
          vendorId,
          assignedAt: {
            gte: startDate,
            lte: now
          }
        },
        include: {
          orderItem: {
            select: {
              order: {
                select: {
                  orderNumber: true,
                  createdAt: true
                }
              }
            }
          }
        }
      });

      // Group assignments by period
      const groupedData = new Map<string, typeof assignments>();
      
      assignments.forEach(assignment => {
        let periodKey: string;
        const assignedDate = assignment.assignedAt;
        
        if (timeFilter === 'days') {
          const dayDiff = Math.floor((now.getTime() - assignedDate.getTime()) / (1000 * 60 * 60 * 24));
          periodKey = `${30 - dayDiff}`;
        } else if (timeFilter === 'weeks') {
          const weekDiff = Math.floor((now.getTime() - assignedDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
          periodKey = `Week ${4 - weekDiff}`;
        } else {
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          periodKey = monthNames[assignedDate.getMonth()];
        }
        
        if (!groupedData.has(periodKey)) {
          groupedData.set(periodKey, []);
        }
        groupedData.get(periodKey)!.push(assignment);
      });

      // Calculate trends for each period
      const trends = periods.map(period => {
        const periodAssignments = groupedData.get(period) || [];
        
        // Calculate fill rate
        const totalAssigned = periodAssignments.reduce((sum, a) => sum + a.assignedQuantity, 0);
        const totalConfirmed = periodAssignments.reduce((sum, a) => sum + (a.confirmedQuantity || 0), 0);
        const fillRate = totalAssigned > 0 ? (totalConfirmed / totalAssigned) * 100 : 0;

        // Calculate SLA compliance
        const completedAssignments = periodAssignments.filter(a => 
          ['COMPLETED', 'VERIFIED_OK', 'DISPATCHED'].includes(a.status) && a.vendorActionAt
        );
        
        const fulfillmentTimes = completedAssignments.map(a => {
          const fulfillmentTime = (a.vendorActionAt!.getTime() - a.assignedAt.getTime()) / (1000 * 60 * 60 * 24);
          return fulfillmentTime;
        });

        const avgFulfillmentTime = fulfillmentTimes.length > 0
          ? fulfillmentTimes.reduce((sum, time) => sum + time, 0) / fulfillmentTimes.length
          : 0;

        // SLA benchmark (average + 15% buffer)
        const slaBenchmark = avgFulfillmentTime * 1.15;
        const compliantOrders = fulfillmentTimes.filter(time => time <= slaBenchmark).length;
        const slaCompliance = fulfillmentTimes.length > 0 ? (compliantOrders / fulfillmentTimes.length) * 100 : 0;

        return {
          period,
          fillRate: Math.round(fillRate * 100) / 100,
          slaCompliance: Math.round(slaCompliance * 100) / 100
        };
      });

      // Calculate fulfillment data
      const fulfillment = periods.map(period => {
        const periodAssignments = groupedData.get(period) || [];
        const completedAssignments = periodAssignments.filter(a => 
          ['COMPLETED', 'VERIFIED_OK', 'DISPATCHED'].includes(a.status) && a.vendorActionAt
        );
        
        const fulfillmentTimes = completedAssignments.map(a => {
          const fulfillmentTime = (a.vendorActionAt!.getTime() - a.assignedAt.getTime()) / (1000 * 60 * 60 * 24);
          return fulfillmentTime;
        });

        const avgFulfillmentTime = fulfillmentTimes.length > 0
          ? fulfillmentTimes.reduce((sum, time) => sum + time, 0) / fulfillmentTimes.length
          : 0;

        const slaBenchmark = avgFulfillmentTime * 1.15;
        const compliantOrders = fulfillmentTimes.filter(time => time <= slaBenchmark).length;
        const slaCompliance = fulfillmentTimes.length > 0 ? (compliantOrders / fulfillmentTimes.length) * 100 : 0;

        return {
          period,
          fulfillmentTime: Math.round(avgFulfillmentTime * 100) / 100,
          slaCompliance: Math.round(slaCompliance * 100) / 100
        };
      });

      return { trends, fulfillment };

    } catch (error) {
      logger.error('Failed to get vendor performance trends', { error, vendorId, timeFilter });
      throw error;
    }
  }

  /**
   * Get detailed SLA metrics for a specific vendor
   */
  async getVendorSlaMetrics(vendorId: string, query: VendorSlaQueryDto): Promise<VendorSlaDto> {
    try {
      const { bufferPercentage = 15, lookbackDays = 30 } = query;
      
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
        throw new Error('Vendor not found');
      }

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - lookbackDays);

      // Get historical fulfillment data
      const historicalData = await prisma.assignedOrderItem.findMany({
        where: {
          vendorId,
          assignedAt: {
            gte: startDate,
            lte: endDate
          },
          status: {
            in: ['COMPLETED', 'VERIFIED_OK', 'DISPATCHED']
          }
        },
        include: {
          orderItem: {
            select: {
              order: {
                select: {
                  orderNumber: true,
                  createdAt: true
                }
              }
            }
          }
        }
      });

      // Calculate fulfillment times
      const fulfillmentTimes = historicalData
        .filter(item => item.vendorActionAt && item.assignedAt)
        .map(item => {
          const fulfillmentTime = (item.vendorActionAt!.getTime() - item.assignedAt.getTime()) / (1000 * 60 * 60 * 24);
          return {
            orderNumber: item.orderItem.order.orderNumber,
            fulfillmentTime: Math.round(fulfillmentTime * 100) / 100,
            assignedAt: item.assignedAt,
            completedAt: item.vendorActionAt!
          };
        });

      const avgFulfillmentTime = fulfillmentTimes.length > 0
        ? fulfillmentTimes.reduce((sum, item) => sum + item.fulfillmentTime, 0) / fulfillmentTimes.length
        : 0;

      // Get current orders
      const currentOrders = await prisma.assignedOrderItem.findMany({
        where: {
          vendorId,
          status: {
            in: ['PENDING_CONFIRMATION', 'VENDOR_CONFIRMED_FULL', 'VENDOR_CONFIRMED_PARTIAL', 'INVOICED']
          }
        },
        include: {
          orderItem: {
            select: {
              order: {
                select: {
                  orderNumber: true,
                  createdAt: true
                }
              }
            }
          }
        }
      });

      const currentOrderTimes = currentOrders.map(order => {
        const currentTime = (new Date().getTime() - order.assignedAt.getTime()) / (1000 * 60 * 60 * 24);
        return {
          orderNumber: order.orderItem.order.orderNumber,
          daysSinceAssigned: Math.round(currentTime * 100) / 100,
          status: order.status
        };
      });

      // Calculate SLA metrics
      const slaBenchmark = avgFulfillmentTime * (1 + bufferPercentage / 100);
      const totalHistoricalOrders = fulfillmentTimes.length;
      const compliantOrders = fulfillmentTimes.filter(item => item.fulfillmentTime <= slaBenchmark).length;
      const slaComplianceRate = totalHistoricalOrders > 0 
        ? (compliantOrders / totalHistoricalOrders) * 100 
        : 0;

      const slaStatus = currentOrderTimes.length > 0
        ? currentOrderTimes.every(order => order.daysSinceAssigned <= slaBenchmark)
          ? 'MET'
          : 'BREACHED'
        : 'NO_CURRENT_ORDERS';

      return {
        vendorId,
        vendor: {
          id: vendor.id,
          companyName: vendor.companyName,
          contactPersonName: vendor.contactPersonName,
          contactPhone: vendor.contactPhone,
          fillRate: vendor.fillRate ?? undefined,
          slaComplianceRate: vendor.slaComplianceRate ?? undefined,
          user: {
            ...vendor.user,
            email: vendor.user.email ?? undefined
          }
        },
        metrics: {
          avgFulfillmentTime: Math.round(avgFulfillmentTime * 100) / 100,
          slaBenchmark: Math.round(slaBenchmark * 100) / 100,
          bufferPercentage,
          totalHistoricalOrders,
          compliantOrders,
          slaComplianceRate: Math.round(slaComplianceRate * 100) / 100
        },
        currentOrders: currentOrderTimes,
        historicalData: fulfillmentTimes,
        slaStatus,
        lastUpdated: new Date()
      };

    } catch (error) {
      logger.error('Failed to get vendor SLA metrics', { error, vendorId, query });
      throw error;
    }
  }
}

export const vendorTrackingService = new VendorTrackingService();
