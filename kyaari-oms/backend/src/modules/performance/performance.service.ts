import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';



export class PerformanceService {

  /**
   * Calculate fill rate for a vendor
   */
  async calculateFillRate(vendorId: string, startDate?: Date, endDate?: Date): Promise<number> {
    try {
      const dateFilter = this.buildDateFilter(startDate, endDate);

      const [totalOrders, completedOrders] = await Promise.all([
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
        })
      ]);

      return totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
    } catch (error) {
      logger.error('Error calculating fill rate', { error, vendorId });
      throw error;
    }
  }

  /**
   * Calculate rejection rate for a vendor
   */
  async calculateRejectionRate(vendorId: string, startDate?: Date, endDate?: Date): Promise<number> {
    try {
      const dateFilter = this.buildDateFilter(startDate, endDate);

      const [totalOrders, rejectedOrders] = await Promise.all([
        prisma.assignedOrderItem.count({
          where: {
            vendorId,
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

      return totalOrders > 0 ? (rejectedOrders / totalOrders) * 100 : 0;
    } catch (error) {
      logger.error('Error calculating rejection rate', { error, vendorId });
      throw error;
    }
  }

  /**
   * Get SLA breaches count for a vendor
   */
  async getSLABreaches(vendorId: string, startDate?: Date, endDate?: Date): Promise<number> {
    try {
      const dateFilter = this.buildDateFilter(startDate, endDate);

      return await prisma.assignedOrderItem.count({
        where: {
          vendorId,
          status: { in: ['PENDING_CONFIRMATION', 'VENDOR_CONFIRMED_FULL', 'VENDOR_CONFIRMED_PARTIAL', 'INVOICED'] },
          AND: [
            { assignedAt: dateFilter.assignedAt },
            { assignedAt: { lt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) } } // More than 3 days old
          ]
        }
      });
    } catch (error) {
      logger.error('Error getting SLA breaches', { error, vendorId });
      throw error;
    }
  }

  /**
   * Get payment statistics for a vendor based on verified orders
   */
  async getPaymentStatistics(vendorId: string, startDate?: Date, endDate?: Date) {
    try {
      const dateFilter = this.buildDateFilter(startDate, endDate);

      // Get verified orders for this vendor
      const verifiedOrders = await prisma.goodsReceiptItem.findMany({
        where: {
          assignedOrderItem: {
            vendorId
          },
          status: 'VERIFIED_OK',
          goodsReceiptNote: {
            verifiedAt: dateFilter.assignedAt
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
      const seenPurchaseOrderIds = new Set<string>();

      verifiedOrders.forEach(grnItem => {
        const purchaseOrder = grnItem.assignedOrderItem.purchaseOrderItem?.purchaseOrder;
        if (purchaseOrder && purchaseOrder.id) {
          // Skip if we've already processed this purchase order
          if (seenPurchaseOrderIds.has(purchaseOrder.id)) {
            return;
          }
          
          // Mark this purchase order as seen
          seenPurchaseOrderIds.add(purchaseOrder.id);
          
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
        }
      });

      return {
        pendingPayments,
        releasedPayments
      };
    } catch (error) {
      logger.error('Error getting payment statistics', { error, vendorId });
      throw error;
    }
  }

  /**
   * Get order statistics for a vendor
   */
  async getOrderStatistics(vendorId: string, startDate?: Date, endDate?: Date) {
    try {
      const dateFilter = this.buildDateFilter(startDate, endDate);

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

      return {
        totalOrders,
        completedOrders,
        rejectedOrders
      };
    } catch (error) {
      logger.error('Error getting order statistics', { error, vendorId });
      throw error;
    }
  }

  /**
   * Get performance trends data grouped by time period
   */
  async getPerformanceTrends(vendorId: string, timeRange: string, startDate?: Date, endDate?: Date) {
    try {
      const dateFilter = this.buildDateFilter(startDate, endDate);

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

      return this.groupOrdersByTimePeriod(orders, timeRange);
    } catch (error) {
      logger.error('Error getting performance trends', { error, vendorId });
      throw error;
    }
  }

  /**
   * Get SLA breach analysis for vendor
   */
  async getSLABreachAnalysis(vendorId: string, startDate?: Date, endDate?: Date) {
    try {
      const dateFilter = this.buildDateFilter(startDate, endDate);
      const bufferPercentage = 15; // 15% buffer for SLA calculation
      const lookbackDays = 30;

      // Calculate date range for historical data
      const endDateForHistory = new Date();
      const startDateForHistory = new Date();
      startDateForHistory.setDate(startDateForHistory.getDate() - lookbackDays);

      // Get vendor's historical completed orders for SLA benchmark calculation
      const historicalOrders = await prisma.assignedOrderItem.findMany({
        where: {
          vendorId,
          assignedAt: {
            gte: startDateForHistory,
            lte: endDateForHistory
          },
          status: {
            in: ['COMPLETED', 'VERIFIED_OK', 'DISPATCHED']
          },
          vendorActionAt: {
            not: null
          }
        },
        select: {
          id: true,
          assignedAt: true,
          vendorActionAt: true,
          status: true
        }
      });

      // Calculate average fulfillment time from historical data
      const fulfillmentTimes = historicalOrders
        .filter(item => item.vendorActionAt && item.assignedAt)
        .map(item => {
          const fulfillmentTime = (item.vendorActionAt!.getTime() - item.assignedAt.getTime()) / (1000 * 60 * 60 * 24);
          return fulfillmentTime;
        });

      const avgFulfillmentTime = fulfillmentTimes.length > 0
        ? fulfillmentTimes.reduce((sum, time) => sum + time, 0) / fulfillmentTimes.length
        : 3; // Default to 3 days if no historical data

      // Calculate SLA benchmark (average + buffer)
      const slaBenchmark = avgFulfillmentTime * (1 + bufferPercentage / 100);

      // Get current pending orders for SLA breach analysis
      const currentOrders = await prisma.assignedOrderItem.findMany({
        where: {
          vendorId,
          status: {
            in: ['PENDING_CONFIRMATION', 'VENDOR_CONFIRMED_FULL', 'VENDOR_CONFIRMED_PARTIAL', 'INVOICED']
          },
          ...dateFilter
        },
        select: {
          id: true,
          assignedAt: true,
          status: true,
          orderItem: {
            select: {
              productName: true,
              order: {
                select: {
                  orderNumber: true
                }
              }
            }
          }
        }
      });

      // Categorize orders by SLA breach type
      const slaBreachCategories: { [key: string]: any[] } = {
        'Order Confirmation': [],
        'Dispatch Marking': [],
        'Invoice Upload': []
      };

      const compliantOrders: any[] = [];
      const breachedOrders: any[] = [];

      currentOrders.forEach(order => {
        const daysSinceAssigned = (new Date().getTime() - order.assignedAt.getTime()) / (1000 * 60 * 60 * 24);
        const isBreached = daysSinceAssigned > slaBenchmark;

        const orderData = {
          id: order.id,
          orderNumber: order.orderItem.order.orderNumber,
          productName: order.orderItem.productName,
          status: order.status,
          daysSinceAssigned: Math.round(daysSinceAssigned * 100) / 100,
          assignedAt: order.assignedAt
        };

        if (isBreached) {
          breachedOrders.push(orderData);
          
          // Categorize breach type based on status
          if (order.status === 'PENDING_CONFIRMATION') {
            slaBreachCategories['Order Confirmation'].push(orderData);
          } else if (order.status === 'VENDOR_CONFIRMED_FULL' || order.status === 'VENDOR_CONFIRMED_PARTIAL') {
            slaBreachCategories['Dispatch Marking'].push(orderData);
          } else if (order.status === 'INVOICED') {
            slaBreachCategories['Invoice Upload'].push(orderData);
          }
        } else {
          compliantOrders.push(orderData);
        }
      });

      // Calculate SLA compliance metrics
      const totalOrders = currentOrders.length;
      const totalBreached = breachedOrders.length;
      const slaComplianceRate = totalOrders > 0 ? ((totalOrders - totalBreached) / totalOrders) * 100 : 100;

      // Format data for chart
      const chartData = Object.entries(slaBreachCategories).map(([type, orders]) => ({
        type,
        count: orders.length,
        target: Math.max(1, Math.round(totalOrders * 0.05)) // Target: max 5% of total orders
      }));

      return {
        summary: {
          totalOrders,
          breachedOrders: totalBreached,
          compliantOrders: compliantOrders.length,
          slaComplianceRate: Math.round(slaComplianceRate * 100) / 100,
          avgFulfillmentTime: Math.round(avgFulfillmentTime * 100) / 100,
          slaBenchmark: Math.round(slaBenchmark * 100) / 100,
          bufferPercentage
        },
        categories: slaBreachCategories,
        chartData,
        timeRange: {
          startDate: startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          endDate: endDate || new Date()
        }
      };
    } catch (error) {
      logger.error('Error getting SLA breach analysis', { error, vendorId });
      throw error;
    }
  }

  /**
   * Get weekly order fulfillment data for the last 4 weeks
   */
  async getWeeklyOrderFulfillment(vendorId: string) {
    try {
      const now = new Date();
      const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000); // 4 weeks ago

      // Get orders from the last 4 weeks
      const orders = await prisma.assignedOrderItem.findMany({
        where: {
          vendorId,
          assignedAt: {
            gte: fourWeeksAgo,
            lte: now
          }
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

      // Group orders by week
      const weeklyData = this.groupOrdersByWeek(orders);

      // Calculate metrics for each week
      const fulfillmentData = weeklyData.map(week => {
        const total = week.orders.length;
        const delivered = week.orders.filter(o => ['COMPLETED', 'VERIFIED_OK', 'DISPATCHED'].includes(o.status)).length;
        const rejected = week.orders.filter(o => o.status === 'VENDOR_DECLINED').length;
        const pending = week.orders.filter(o => ['PENDING_CONFIRMATION', 'VENDOR_CONFIRMED_FULL', 'VENDOR_CONFIRMED_PARTIAL', 'INVOICED'].includes(o.status)).length;

        return {
          week: week.weekLabel,
          delivered,
          rejected,
          pending,
          total
        };
      });

      return {
        weeklyData: fulfillmentData,
        summary: {
          totalOrders: orders.length,
          totalDelivered: orders.filter(o => ['COMPLETED', 'VERIFIED_OK', 'DISPATCHED'].includes(o.status)).length,
          totalRejected: orders.filter(o => o.status === 'VENDOR_DECLINED').length,
          totalPending: orders.filter(o => ['PENDING_CONFIRMATION', 'VENDOR_CONFIRMED_FULL', 'VENDOR_CONFIRMED_PARTIAL', 'INVOICED'].includes(o.status)).length
        },
        timeRange: {
          startDate: fourWeeksAgo,
          endDate: now
        }
      };
    } catch (error) {
      logger.error('Error getting weekly order fulfillment', { error, vendorId });
      throw error;
    }
  }

  /**
   * Get rejection reasons breakdown with categorization
   */
  async getRejectionReasons(vendorId: string, startDate?: Date, endDate?: Date) {
    try {
      const dateFilter = this.buildDateFilter(startDate, endDate);

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

      return {
        summary: {
          totalRejections,
          rejectionRate: totalRejections > 0 ? Math.round((totalRejections / (totalRejections + completedCount)) * 100) : 0
        },
        categories: rejectionStats,
        timeRange: {
          startDate: startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          endDate: endDate || new Date()
        }
      };
    } catch (error) {
      logger.error('Error getting rejection reasons', { error, vendorId });
      throw error;
    }
  }

  /**
   * Build date filter object
   */
  private buildDateFilter(startDate?: Date, endDate?: Date) {
    if (!startDate && !endDate) {
      // Default to last 3 months
      const defaultEndDate = new Date();
      const defaultStartDate = new Date();
      defaultStartDate.setMonth(defaultStartDate.getMonth() - 3);
      
      return {
        assignedAt: {
          gte: defaultStartDate,
          lte: defaultEndDate
        }
      };
    }

    const filter: any = {};
    if (startDate) {
      filter.gte = startDate;
    }
    if (endDate) {
      filter.lte = endDate;
    }

    return {
      assignedAt: filter
    };
  }

  /**
   * Group orders by week for the last 4 weeks
   */
  private groupOrdersByWeek(orders: any[]) {
    const groups: { [key: string]: any[] } = {};
    const now = new Date();

    orders.forEach(order => {
      const orderDate = new Date(order.assignedAt);
      
      // Calculate which week this order belongs to (Week 1, Week 2, Week 3, Week 4)
      const daysDiff = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
      let weekNumber: number;
      
      if (daysDiff <= 7) {
        weekNumber = 4; // Current week
      } else if (daysDiff <= 14) {
        weekNumber = 3; // 1 week ago
      } else if (daysDiff <= 21) {
        weekNumber = 2; // 2 weeks ago
      } else {
        weekNumber = 1; // 3 weeks ago
      }
      
      const weekKey = `Week ${weekNumber}`;
      
      if (!groups[weekKey]) {
        groups[weekKey] = [];
      }
      groups[weekKey].push(order);
    });

    // Ensure we have all 4 weeks, even if empty
    const result = [];
    for (let i = 1; i <= 4; i++) {
      const weekKey = `Week ${i}`;
      result.push({
        weekLabel: weekKey,
        orders: groups[weekKey] || []
      });
    }

    return result;
  }

  /**
   * Group orders by time period
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

    return Object.entries(groups).map(([period, orders]) => {
      const total = orders.length;
      const completed = orders.filter(o => ['COMPLETED', 'VERIFIED_OK', 'DISPATCHED'].includes(o.status)).length;
      const rejected = orders.filter(o => o.status === 'VENDOR_DECLINED').length;
      const slaBreaches = orders.filter(o => ['PENDING_CONFIRMATION', 'VENDOR_CONFIRMED_FULL', 'VENDOR_CONFIRMED_PARTIAL', 'INVOICED'].includes(o.status) && new Date(o.assignedAt).getTime() < Date.now() - 3 * 24 * 60 * 60 * 1000).length;

      return {
        period,
        fillRate: total > 0 ? Math.round((completed / total) * 100 * 100) / 100 : 0,
        rejectionRate: total > 0 ? Math.round((rejected / total) * 100 * 100) / 100 : 0,
        slaBreaches,
        totalOrders: total,
        completedOrders: completed,
        rejectedOrders: rejected
      };
    });
  }
}

export const performanceService = new PerformanceService();