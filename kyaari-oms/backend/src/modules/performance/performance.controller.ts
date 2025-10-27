import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger';
import { ResponseHelper } from '../../utils/response';
import { performanceService } from './performance.service';

const prisma = new PrismaClient();

export class PerformanceController {

  /**
   * Get KPI cards data for vendor performance dashboard
   * @route GET /api/performance/kpi-cards
   * @access Private
   */
  async getKPICards(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        ResponseHelper.unauthorized(res, 'User authentication required');
        return;
      }

      // Get vendor profile for the user
      const vendorProfile = await prisma.vendorProfile.findUnique({
        where: { userId }
      });

      if (!vendorProfile) {
        ResponseHelper.unauthorized(res, 'Vendor profile not found');
        return;
      }

      const vendorId = vendorProfile.id;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      // Set default date range if not provided (last 3 months)
      const defaultEndDate = new Date();
      const defaultStartDate = new Date();
      defaultStartDate.setMonth(defaultStartDate.getMonth() - 3);

      const dateFilter = {
        assignedAt: {
          gte: startDate ? new Date(startDate) : defaultStartDate,
          lte: endDate ? new Date(endDate) : defaultEndDate
        }
      };

      // Get order statistics from AssignedOrderItem (the actual fulfillment data)
      const [totalOrders, completedOrders, rejectedOrders] = await Promise.all([
        prisma.assignedOrderItem.count({
          where: {
            vendorId,
            ...dateFilter
          }
        }),
        prisma.assignedOrderItem.count({
          where: {
            vendorId,
            status: { in: ['COMPLETED', 'VERIFIED_OK', 'DISPATCHED'] },
            ...dateFilter
          }
        }),
        prisma.assignedOrderItem.count({
          where: {
            vendorId,
            status: 'VENDOR_DECLINED',
            ...dateFilter
          }
        })
      ]);

      // Calculate fill rate and rejection rate
      const fillRate = totalOrders > 0 ? ((completedOrders / totalOrders) * 100) : 0;
      const rejectionRate = totalOrders > 0 ? ((rejectedOrders / totalOrders) * 100) : 0;

      // Get SLA breaches (orders that took too long to complete)
      const slaBreaches = await prisma.assignedOrderItem.count({
        where: {
          vendorId,
          status: { in: ['PENDING_CONFIRMATION', 'VENDOR_CONFIRMED_FULL', 'VENDOR_CONFIRMED_PARTIAL', 'INVOICED'] },
          assignedAt: {
            ...dateFilter.assignedAt,
            lt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // More than 3 days old
          }
        }
      });

      // Get payment statistics based on verified orders
      const verifiedOrders = await prisma.goodsReceiptItem.findMany({
        where: {
          assignedOrderItem: {
            vendorId
          },
          status: 'VERIFIED_OK',
          goodsReceiptNote: {
            verifiedAt: {
              gte: startDate ? new Date(startDate) : defaultStartDate,
              lte: endDate ? new Date(endDate) : defaultEndDate
            }
          }
        },
        include: {
          assignedOrderItem: {
            include: {
              purchaseOrderItem: {
                include: {
                  purchaseOrder: {
                    include: {
                      payment: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      // Calculate pending and released payments (deduplicate by purchase order)
      let pendingPayments = 0;
      let releasedPayments = 0;

      // Collect unique purchase orders to avoid double counting
      const uniquePurchaseOrders = new Map();
      
      verifiedOrders.forEach(grnItem => {
        const purchaseOrder = grnItem.assignedOrderItem.purchaseOrderItem?.purchaseOrder;
        if (purchaseOrder) {
          uniquePurchaseOrders.set(purchaseOrder.id, purchaseOrder);
        }
      });

      // Process each unique purchase order once
      uniquePurchaseOrders.forEach(purchaseOrder => {
        const orderAmount = Number(purchaseOrder.totalAmount);
        
        if (purchaseOrder.payment) {
          // Payment exists - check status
          if (purchaseOrder.payment.status === 'COMPLETED') {
            releasedPayments += orderAmount;
          } else if (purchaseOrder.payment.status === 'PENDING') {
            pendingPayments += orderAmount;
          }
        } else {
          // No payment record exists - this is pending
          pendingPayments += orderAmount;
        }
      });

      const kpiData = {
        fillRate: Math.round(fillRate * 100) / 100,
        rejectionRate: Math.round(rejectionRate * 100) / 100,
        slaBreaches,
        pendingPayments,
        releasedPayments,
        totalOrders,
        completedOrders,
        rejectedOrders
      };

      ResponseHelper.success(res, kpiData, 'KPI cards data retrieved successfully');
    } catch (error) {
      logger.error('Error fetching KPI cards data', { error, userId: req.user?.userId });
      ResponseHelper.error(res, 'Failed to fetch KPI cards data');
    }
  }

  /**
   * Get performance insights for vendor
   * @route GET /api/performance/insights
   * @access Private
   */
  async getPerformanceInsights(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        ResponseHelper.unauthorized(res, 'User authentication required');
        return;
      }

      // Get vendor profile for the user
      const vendorProfile = await prisma.vendorProfile.findUnique({
        where: { userId }
      });

      if (!vendorProfile) {
        ResponseHelper.unauthorized(res, 'Vendor profile not found');
        return;
      }

      const vendorId = vendorProfile.id;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      // Set default date range if not provided (last 3 months)
      const defaultEndDate = new Date();
      const defaultStartDate = new Date();
      defaultStartDate.setMonth(defaultStartDate.getMonth() - 3);

      const dateFilter = {
        assignedAt: {
          gte: startDate ? new Date(startDate) : defaultStartDate,
          lte: endDate ? new Date(endDate) : defaultEndDate
        }
      };

      // Get current performance metrics from AssignedOrderItem
      const [totalOrders, completedOrders, rejectedOrders, slaBreaches] = await Promise.all([
        prisma.assignedOrderItem.count({
          where: { 
            vendorId, 
            ...dateFilter 
          }
        }),
        prisma.assignedOrderItem.count({
          where: { 
            vendorId, 
            status: { in: ['COMPLETED', 'VERIFIED_OK', 'DISPATCHED'] },
            ...dateFilter 
          }
        }),
        prisma.assignedOrderItem.count({
          where: { 
            vendorId, 
            status: 'VENDOR_DECLINED',
            ...dateFilter 
          }
        }),
        prisma.assignedOrderItem.count({
          where: {
            vendorId,
            status: { in: ['PENDING_CONFIRMATION', 'VENDOR_CONFIRMED_FULL', 'VENDOR_CONFIRMED_PARTIAL', 'INVOICED'] },
            AND: [
              { assignedAt: dateFilter.assignedAt },
              { assignedAt: { lt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) } } // More than 3 days old
            ]
          }
        })
      ]);

      const fillRate = totalOrders > 0 ? ((completedOrders / totalOrders) * 100) : 0;
      const rejectionRate = totalOrders > 0 ? ((rejectedOrders / totalOrders) * 100) : 0;

      // Get industry average data (mock data - in real app, this would come from industry benchmarks)
      const industryAverage = {
        fillRate: 88.0,
        rejectionRate: 5.5,
        slaCompliance: 95.0
      };

      // Generate insights based on performance
      const insights = [];

      // Fill Rate Insight
      if (fillRate > industryAverage.fillRate) {
        insights.push({
          type: 'positive',
          title: 'Excellent Fill Rate',
          description: `Your ${fillRate.toFixed(1)}% fill rate is above industry average of ${industryAverage.fillRate}%`,
          icon: 'check-circle',
          color: 'green'
        });
      } else if (fillRate < industryAverage.fillRate - 5) {
        insights.push({
          type: 'warning',
          title: 'Fill Rate Below Average',
          description: `Your ${fillRate.toFixed(1)}% fill rate is below industry average. Consider improving inventory management.`,
          icon: 'alert-triangle',
          color: 'orange'
        });
      }

      // SLA Insight
      const slaComplianceRate = totalOrders > 0 ? (((totalOrders - slaBreaches) / totalOrders) * 100) : 100;
      if (slaComplianceRate < industryAverage.slaCompliance) {
        insights.push({
          type: 'warning',
          title: 'SLA Improvement Needed',
          description: `Focus on order confirmation times to reduce SLA breaches. Current compliance: ${slaComplianceRate.toFixed(1)}%`,
          icon: 'clock',
          color: 'orange'
        });
      }

      // Payment Insight - Get verified orders for payment calculation
      const verifiedOrdersForInsight = await prisma.goodsReceiptItem.findMany({
        where: {
          assignedOrderItem: {
            vendorId
          },
          status: 'VERIFIED_OK',
          goodsReceiptNote: {
            verifiedAt: {
              gte: startDate ? new Date(startDate) : defaultStartDate,
              lte: endDate ? new Date(endDate) : defaultEndDate
            }
          }
        },
        include: {
          assignedOrderItem: {
            include: {
              purchaseOrderItem: {
                include: {
                  purchaseOrder: {
                    include: {
                      payment: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      // Calculate pending payments for insights
      let pendingPaymentsForInsight = 0;
      const seenPurchaseOrderIds = new Set<string>();
      
      verifiedOrdersForInsight.forEach(grnItem => {
        const purchaseOrder = grnItem.assignedOrderItem.purchaseOrderItem?.purchaseOrder;
        if (purchaseOrder && purchaseOrder.id) {
          // Skip if we've already processed this purchase order
          if (seenPurchaseOrderIds.has(purchaseOrder.id)) {
            return;
          }
          
          // Mark this purchase order as seen
          seenPurchaseOrderIds.add(purchaseOrder.id);
          
          // Add to pending payments if payment is absent or status is PENDING
          if (!purchaseOrder.payment || purchaseOrder.payment.status === 'PENDING') {
            pendingPaymentsForInsight += Number(purchaseOrder.totalAmount);
          }
        }
      });

      if (pendingPaymentsForInsight > 0) {
        insights.push({
          type: 'info',
          title: 'Payment Processing',
          description: `₹${(pendingPaymentsForInsight / 1000).toFixed(0)}K pending payments, expected release in 3-5 days`,
          icon: 'wallet',
          color: 'blue'
        });
      }

      // Rejection Rate Insight
      if (rejectionRate > industryAverage.rejectionRate) {
        insights.push({
          type: 'warning',
          title: 'High Rejection Rate',
          description: `Your ${rejectionRate.toFixed(1)}% rejection rate is above industry average. Review quality control processes.`,
          icon: 'x-circle',
          color: 'red'
        });
      }

      ResponseHelper.success(res, {
        insights,
        currentMetrics: {
          fillRate: Math.round(fillRate * 100) / 100,
          rejectionRate: Math.round(rejectionRate * 100) / 100,
          slaComplianceRate: Math.round(slaComplianceRate * 100) / 100,
          totalOrders,
          slaBreaches
        },
        industryAverage
      }, 'Performance insights retrieved successfully');
    } catch (error) {
      logger.error('Error fetching performance insights', { error, userId: req.user?.userId });
      ResponseHelper.error(res, 'Failed to fetch performance insights');
    }
  }

  /**
   * Get performance goals and targets for vendor
   * @route GET /api/performance/goals
   * @access Private
   */
  async getPerformanceGoals(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        ResponseHelper.unauthorized(res, 'User authentication required');
        return;
      }

      // Get vendor profile for the user
      const vendorProfile = await prisma.vendorProfile.findUnique({
        where: { userId }
      });

      if (!vendorProfile) {
        ResponseHelper.unauthorized(res, 'Vendor profile not found');
        return;
      }

      const vendorId = vendorProfile.id;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      // Set default date range if not provided (last 3 months)
      const defaultEndDate = new Date();
      const defaultStartDate = new Date();
      defaultStartDate.setMonth(defaultStartDate.getMonth() - 3);

      const dateFilter = {
        assignedAt: {
          gte: startDate ? new Date(startDate) : defaultStartDate,
          lte: endDate ? new Date(endDate) : defaultEndDate
        }
      };

      // Get current performance metrics from AssignedOrderItem
      const [totalOrders, completedOrders, rejectedOrders, slaBreaches] = await Promise.all([
        prisma.assignedOrderItem.count({
          where: { 
            vendorId, 
            ...dateFilter 
          }
        }),
        prisma.assignedOrderItem.count({
          where: { 
            vendorId, 
            status: { in: ['COMPLETED', 'VERIFIED_OK', 'DISPATCHED'] },
            ...dateFilter 
          }
        }),
        prisma.assignedOrderItem.count({
          where: { 
            vendorId, 
            status: 'VENDOR_DECLINED',
            ...dateFilter 
          }
        }),
        prisma.assignedOrderItem.count({
          where: {
            vendorId,
            status: { in: ['PENDING_CONFIRMATION', 'VENDOR_CONFIRMED_FULL', 'VENDOR_CONFIRMED_PARTIAL', 'INVOICED'] },
            AND: [
              { assignedAt: dateFilter.assignedAt },
              { assignedAt: { lt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) } } // More than 3 days old
            ]
          }
        })
      ]);

      const fillRate = totalOrders > 0 ? ((completedOrders / totalOrders) * 100) : 0;
      const rejectionRate = totalOrders > 0 ? ((rejectedOrders / totalOrders) * 100) : 0;
      const slaComplianceRate = totalOrders > 0 ? (((totalOrders - slaBreaches) / totalOrders) * 100) : 100;

      // Define performance targets (these could be configurable per vendor)
      const targets = {
        fillRate: 95.0,
        rejectionRate: 3.0,
        slaCompliance: 100.0
      };

      // Calculate progress towards goals
      const goals = [
        {
          name: 'Fill Rate Target',
          current: Math.round(fillRate * 100) / 100,
          target: targets.fillRate,
          progress: Math.min((fillRate / targets.fillRate) * 100, 100),
          unit: '%',
          status: fillRate >= targets.fillRate ? 'achieved' : 'in-progress'
        },
        {
          name: 'Rejection Rate Target',
          current: Math.round(rejectionRate * 100) / 100,
          target: targets.rejectionRate,
          progress: Math.min(((targets.rejectionRate - rejectionRate) / targets.rejectionRate) * 100, 100),
          unit: '%',
          status: rejectionRate <= targets.rejectionRate ? 'achieved' : 'in-progress'
        },
        {
          name: 'SLA Compliance',
          current: Math.round(slaComplianceRate * 100) / 100,
          target: targets.slaCompliance,
          progress: slaComplianceRate,
          unit: '%',
          status: slaComplianceRate >= targets.slaCompliance ? 'achieved' : 'in-progress'
        }
      ];

      ResponseHelper.success(res, {
        goals,
        targets,
        summary: {
          totalGoals: goals.length,
          achievedGoals: goals.filter(g => g.status === 'achieved').length,
          overallProgress: Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length)
        }
      }, 'Performance goals retrieved successfully');
    } catch (error) {
      logger.error('Error fetching performance goals', { error, userId: req.user?.userId });
      ResponseHelper.error(res, 'Failed to fetch performance goals');
    }
  }

  /**
   * Get performance trends data for charts
   * @route GET /api/performance/trends
   * @access Private
   */
  async getPerformanceTrends(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        ResponseHelper.unauthorized(res, 'User authentication required');
        return;
      }

      // Get vendor profile for the user
      const vendorProfile = await prisma.vendorProfile.findUnique({
        where: { userId }
      });

      if (!vendorProfile) {
        ResponseHelper.unauthorized(res, 'Vendor profile not found');
        return;
      }

      const vendorId = vendorProfile.id;
      const timeRange = req.query.timeRange as string || '3M';
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      // Calculate date range based on timeRange parameter
      let dateFilter: any = {};
      const now = new Date();

      if (startDate && endDate) {
        dateFilter.assignedAt = {
          gte: new Date(startDate),
          lte: new Date(endDate)
        };
      } else {
        switch (timeRange) {
          case '1W':
            const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            dateFilter.assignedAt = { gte: oneWeekAgo, lte: now };
            break;
          case '1M':
            const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            dateFilter.assignedAt = { gte: oneMonthAgo, lte: now };
            break;
          case '3M':
            const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            dateFilter.assignedAt = { gte: threeMonthsAgo, lte: now };
            break;
          case '6M':
            const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
            dateFilter.assignedAt = { gte: sixMonthsAgo, lte: now };
            break;
          case '1Y':
            const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            dateFilter.assignedAt = { gte: oneYearAgo, lte: now };
            break;
        }
      }

      // Get orders grouped by time period from AssignedOrderItem
      const orders = await prisma.assignedOrderItem.findMany({
        where: {
          vendorId,
          ...dateFilter
        },
        select: {
          id: true,
          status: true,
          assignedAt: true
        },
        orderBy: {
          assignedAt: 'asc'
        }
      });

      // Group orders by time period based on timeRange
      const groupedData = this.groupOrdersByTimePeriod(orders, timeRange);

      // Calculate metrics for each period
      const trendsData = groupedData.map(period => {
      const total = period.orders.length;
      const completed = period.orders.filter(o => ['COMPLETED', 'VERIFIED_OK', 'DISPATCHED'].includes(o.status)).length;
      const rejected = period.orders.filter(o => o.status === 'VENDOR_DECLINED').length;
      const slaBreaches = period.orders.filter(o => ['PENDING_CONFIRMATION', 'VENDOR_CONFIRMED_FULL', 'VENDOR_CONFIRMED_PARTIAL', 'INVOICED'].includes(o.status) && new Date(o.assignedAt).getTime() < Date.now() - 3 * 24 * 60 * 60 * 1000).length;

        return {
          period: period.period,
          fillRate: total > 0 ? Math.round((completed / total) * 100 * 100) / 100 : 0,
          rejectionRate: total > 0 ? Math.round((rejected / total) * 100 * 100) / 100 : 0,
          slaBreaches,
          totalOrders: total,
          completedOrders: completed,
          rejectedOrders: rejected
        };
      });

      ResponseHelper.success(res, {
        trends: trendsData,
        timeRange,
        totalPeriods: trendsData.length
      }, 'Performance trends retrieved successfully');
    } catch (error) {
      logger.error('Error fetching performance trends', { error, userId: req.user?.userId });
      ResponseHelper.error(res, 'Failed to fetch performance trends');
    }
  }

  /**
   * Get weekly order fulfillment data for vendor
   * @route GET /api/performance/weekly-fulfillment
   * @access Private
   */
  async getWeeklyOrderFulfillment(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        ResponseHelper.unauthorized(res, 'User authentication required');
        return;
      }

      // Get vendor profile for the user
      const vendorProfile = await prisma.vendorProfile.findUnique({
        where: { userId }
      });

      if (!vendorProfile) {
        ResponseHelper.unauthorized(res, 'Vendor profile not found');
        return;
      }

      const vendorId = vendorProfile.id;

      // Get weekly fulfillment data from service
      const fulfillmentData = await performanceService.getWeeklyOrderFulfillment(vendorId);

      ResponseHelper.success(res, fulfillmentData, 'Weekly order fulfillment data retrieved successfully');
    } catch (error) {
      logger.error('Error fetching weekly order fulfillment', { error, userId: req.user?.userId });
      ResponseHelper.error(res, 'Failed to fetch weekly order fulfillment data');
    }
  }

  /**
   * Get SLA breach analysis for vendor
   * @route GET /api/performance/sla-breach-analysis
   * @access Private
   */
  async getSLABreachAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        ResponseHelper.unauthorized(res, 'User authentication required');
        return;
      }

      // Get vendor profile for the user
      const vendorProfile = await prisma.vendorProfile.findUnique({
        where: { userId }
      });

      if (!vendorProfile) {
        ResponseHelper.unauthorized(res, 'Vendor profile not found');
        return;
      }

      const vendorId = vendorProfile.id;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      // Get SLA breach analysis from service
      const slaAnalysis = await performanceService.getSLABreachAnalysis(
        vendorId,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      );

      ResponseHelper.success(res, slaAnalysis, 'SLA breach analysis retrieved successfully');
    } catch (error) {
      logger.error('Error fetching SLA breach analysis', { error, userId: req.user?.userId });
      ResponseHelper.error(res, 'Failed to fetch SLA breach analysis');
    }
  }

  /**
   * Get rejection reasons analysis for vendor
   * @route GET /api/performance/rejection-reasons
   * @access Private
   */
  async getRejectionReasons(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        ResponseHelper.unauthorized(res, 'User authentication required');
        return;
      }

      // Get vendor profile for the user
      const vendorProfile = await prisma.vendorProfile.findUnique({
        where: { userId }
      });

      if (!vendorProfile) {
        ResponseHelper.unauthorized(res, 'Vendor profile not found');
        return;
      }

      const vendorId = vendorProfile.id;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      // Set default date range if not provided (last 3 months)
      const defaultEndDate = new Date();
      const defaultStartDate = new Date();
      defaultStartDate.setMonth(defaultStartDate.getMonth() - 3);

      const dateFilter = {
        assignedAt: {
          gte: startDate ? new Date(startDate) : defaultStartDate,
          lte: endDate ? new Date(endDate) : defaultEndDate
        }
      };

      // Get rejected orders with vendor remarks
      const rejectedOrders = await prisma.assignedOrderItem.findMany({
        where: {
          vendorId,
          status: 'VENDOR_DECLINED',
          ...dateFilter
        },
        select: {
          id: true,
          vendorRemarks: true,
          assignedAt: true,
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
        orderBy: {
          assignedAt: 'desc'
        }
      });

      // Categorize rejection reasons
      const rejectionCategories: { [key: string]: any[] } = {
        'Stock Unavailable': [],
        'Quality Issue': [],
        'Price Mismatch': [],
        'Late Delivery': []
      };

      const uncategorizedRejections: any[] = [];

      rejectedOrders.forEach(order => {
        const remarks = order.vendorRemarks?.toLowerCase() || '';
        const orderData = {
          id: order.id,
          orderNumber: order.orderItem.order.orderNumber,
          productName: order.orderItem.productName,
          quantity: order.orderItem.quantity,
          remarks: order.vendorRemarks,
          rejectedAt: order.assignedAt,
          orderCreatedAt: order.orderItem.order.createdAt
        };

        // Categorize based on keywords in remarks
        if (remarks.includes('stock') || remarks.includes('unavailable') || remarks.includes('out of stock') || remarks.includes('inventory')) {
          rejectionCategories['Stock Unavailable'].push(orderData);
        } else if (remarks.includes('quality') || remarks.includes('defect') || remarks.includes('damage') || remarks.includes('condition')) {
          rejectionCategories['Quality Issue'].push(orderData);
        } else if (remarks.includes('price') || remarks.includes('cost') || remarks.includes('expensive') || remarks.includes('rate')) {
          rejectionCategories['Price Mismatch'].push(orderData);
        } else if (remarks.includes('delivery') || remarks.includes('time') || remarks.includes('late') || remarks.includes('delay') || remarks.includes('urgent')) {
          rejectionCategories['Late Delivery'].push(orderData);
        } else {
          uncategorizedRejections.push(orderData);
        }
      });

      // Calculate statistics
      const totalRejections = rejectedOrders.length;
      const rejectionStats = Object.entries(rejectionCategories).map(([reason, orders]) => ({
        reason,
        count: orders.length,
        percentage: totalRejections > 0 ? Math.round((orders.length / totalRejections) * 100) : 0,
        orders: orders.slice(0, 10), // Show only first 10 orders for each category
        totalOrders: orders.length
      }));

      // Add uncategorized rejections
      if (uncategorizedRejections.length > 0) {
        rejectionStats.push({
          reason: 'Other Reasons',
          count: uncategorizedRejections.length,
          percentage: totalRejections > 0 ? Math.round((uncategorizedRejections.length / totalRejections) * 100) : 0,
          orders: uncategorizedRejections.slice(0, 10),
          totalOrders: uncategorizedRejections.length
        });
      }

      // Sort by count (highest first)
      rejectionStats.sort((a, b) => b.count - a.count);

      // Get completed orders count for rejection rate calculation
      const completedCount = await prisma.assignedOrderItem.count({
        where: { vendorId, status: { in: ['COMPLETED', 'VERIFIED_OK', 'DISPATCHED'] }, ...dateFilter }
      });

      ResponseHelper.success(res, {
        summary: {
          totalRejections,
          rejectionRate: totalRejections > 0 ? Math.round((totalRejections / (totalRejections + completedCount)) * 100) : 0
        },
        categories: rejectionStats,
        timeRange: {
          startDate: startDate ? new Date(startDate) : defaultStartDate,
          endDate: endDate ? new Date(endDate) : defaultEndDate
        }
      }, 'Rejection reasons analysis retrieved successfully');
    } catch (error) {
      logger.error('Error fetching rejection reasons', { error, userId: req.user?.userId });
      ResponseHelper.error(res, 'Failed to fetch rejection reasons analysis');
    }
  }

  /**
   * Helper method to group orders by time period
   */
  private groupOrdersByTimePeriod(orders: any[], timeRange: string) {
    const groups: { [key: string]: any[] } = {};

    orders.forEach(order => {
      const date = new Date(order.assignedAt);
      let key: string;

      switch (timeRange) {
        case '1W':
          // Group by day
          key = date.toLocaleDateString('en-US', { weekday: 'short' });
          break;
        case '1M': {
          // Group by week
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = `Week ${Math.ceil(date.getDate() / 7)}`;
          break;
        }
        case '3M':
        case '6M':
        case '1Y':
        default:
          // Group by month
          key = date.toLocaleDateString('en-US', { month: 'short' });
          break;
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(order);
    });

    return Object.entries(groups).map(([period, orders]) => ({
      period,
      orders
    }));
  }
}

export const performanceController = new PerformanceController();