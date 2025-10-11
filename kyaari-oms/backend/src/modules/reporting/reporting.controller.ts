import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger';

const prisma = new PrismaClient();

export class ReportingController {

  /**
   * Invoice status report
   */
  async getInvoiceStatusReport(req: Request, res: Response) {
    try {
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const vendorId = req.query.vendorId as string;

      const dateFilter: any = {};
      if (startDate && endDate) {
        dateFilter.invoiceDate = {
          gte: new Date(startDate),
          lte: new Date(endDate)
        };
      }

      const vendorFilter: any = {};
      if (vendorId) {
        vendorFilter.purchaseOrder = {
          vendorId: vendorId
        };
      }

      const where = { ...dateFilter, ...vendorFilter };

      const [invoiceStats, invoicesByStatus, monthlyTrend, vendorBreakdown] = await Promise.all([
        // Overall statistics
        prisma.vendorInvoice.aggregate({
          where,
          _count: { id: true },
          _sum: { invoiceAmount: true },
          _avg: { invoiceAmount: true }
        }),

        // Group by status
        prisma.vendorInvoice.groupBy({
          by: ['status'],
          where,
          _count: { id: true },
          _sum: { invoiceAmount: true }
        }),

        // Monthly trend (last 12 months)
import { PrismaClient, Prisma } from '@prisma/client';
...
        prisma.$queryRaw`
          SELECT 
            DATE_TRUNC('month', invoice_date) as month,
            COUNT(*) as invoice_count,
            SUM(invoice_amount) as total_amount,
            status
          FROM vendor_invoices 
          WHERE invoice_date >= NOW() - INTERVAL '12 months'
          ${vendorId ? Prisma.sql`AND purchase_order_id IN (
            SELECT id FROM purchase_orders WHERE vendor_id = ${vendorId}
          )` : Prisma.empty}
          GROUP BY DATE_TRUNC('month', invoice_date), status
          ORDER BY month DESC
        `,
      ]);

      return res.json({
        success: true,
        data: {
          summary: {
            totalInvoices: invoiceStats._count.id,
            totalAmount: Number(invoiceStats._sum.invoiceAmount || 0),
            averageAmount: Number(invoiceStats._avg.invoiceAmount || 0)
          },
          statusBreakdown: invoicesByStatus.map(item => ({
            status: item.status,
            count: item._count.id,
            amount: Number(item._sum.invoiceAmount || 0)
          })),
          monthlyTrend,
          vendorBreakdown
        }
      });

    } catch (error) {
      logger.error('Error generating invoice status report', { error });
      return res.status(500).json({
        success: false,
        error: 'Failed to generate invoice status report'
      });
    }
  }

  /**
   * Payment tracking report
   */
  async getPaymentTrackingReport(req: Request, res: Response) {
    try {
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const paymentStatus = req.query.status as string;

      const dateFilter: any = {};
      if (startDate && endDate) {
        dateFilter.createdAt = {
          gte: new Date(startDate),
          lte: new Date(endDate)
        };
      }

      const statusFilter: any = {};
      if (paymentStatus) {
        statusFilter.status = paymentStatus;
      }

      const where = { ...dateFilter, ...statusFilter };

      const [paymentStats, paymentsByStatus, agingAnalysis, vendorPayments] = await Promise.all([
        // Overall payment statistics
        prisma.payment.aggregate({
          where,
          _count: { id: true },
          _sum: { amount: true },
          _avg: { amount: true }
        }),

        // Group by payment status
        prisma.payment.groupBy({
          by: ['status'],
          where,
          _count: { id: true },
          _sum: { amount: true }
        }),

        // Aging analysis
        prisma.$queryRaw`
          SELECT 
            CASE 
              WHEN EXTRACT(DAYS FROM NOW() - p.created_at) <= 30 THEN '0-30 days'
              WHEN EXTRACT(DAYS FROM NOW() - p.created_at) <= 60 THEN '31-60 days'
              WHEN EXTRACT(DAYS FROM NOW() - p.created_at) <= 90 THEN '61-90 days'
              ELSE '90+ days'
            END as age_bucket,
            COUNT(*) as payment_count,
            SUM(p.amount) as total_amount
          FROM payments p
          WHERE p.status = 'PENDING'
          GROUP BY age_bucket
          ORDER BY age_bucket
        `,

        // Top vendors by payment amount
        prisma.$queryRaw`
          SELECT 
            vp.company_name,
            vp.id as vendor_id,
            COUNT(p.*) as payment_count,
            SUM(p.amount) as total_amount,
            AVG(p.amount) as avg_amount,
            p.status
          FROM payments p
          JOIN purchase_orders po ON p.purchase_order_id = po.id
          JOIN vendor_profiles vp ON po.vendor_id = vp.id
          ${startDate && endDate ? prisma.$queryRaw`WHERE p.created_at BETWEEN ${new Date(startDate)} AND ${new Date(endDate)}` : prisma.$queryRaw``}
          GROUP BY vp.company_name, vp.id, p.status
          ORDER BY total_amount DESC
          LIMIT 20
        `
      ]);

      return res.json({
        success: true,
        data: {
          summary: {
            totalPayments: paymentStats._count.id,
            totalAmount: Number(paymentStats._sum.amount || 0),
            averageAmount: Number(paymentStats._avg.amount || 0)
          },
          statusBreakdown: paymentsByStatus.map(item => ({
            status: item.status,
            count: item._count.id,
            amount: Number(item._sum.amount || 0)
          })),
          agingAnalysis,
          vendorPayments
        }
      });

    } catch (error) {
      logger.error('Error generating payment tracking report', { error });
      return res.status(500).json({
        success: false,
        error: 'Failed to generate payment tracking report'
      });
    }
  }

  /**
   * Financial analytics report
   */
  async getFinancialAnalytics(req: Request, res: Response) {
    try {
      const period = req.query.period as string || '12m'; // 12m, 6m, 3m, 1m
      const vendorId = req.query.vendorId as string;

      let dateFilter: Date;
      switch (period) {
        case '1m':
          dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '3m':
          dateFilter = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '6m':
          dateFilter = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
          break;
        default:
          dateFilter = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      }

      const [
        orderMetrics,
        invoiceMetrics,
        paymentMetrics,
        cashFlowAnalysis,
        vendorPerformance
      ] = await Promise.all([
        // Order metrics
        prisma.order.aggregate({
          where: {
            createdAt: { gte: dateFilter },
            ...(vendorId && {
              items: {
                some: {
                  assignedItems: {
                    some: { vendorId }
                  }
                }
              }
            })
          },
          _count: { id: true },
          _sum: { totalValue: true },
          _avg: { totalValue: true }
        }),

        // Invoice metrics
        prisma.vendorInvoice.aggregate({
          where: {
            invoiceDate: { gte: dateFilter },
            ...(vendorId && {
              purchaseOrder: { vendorId }
            })
          },
          _count: { id: true },
          _sum: { invoiceAmount: true },
          _avg: { invoiceAmount: true }
        }),

        // Payment metrics
        prisma.payment.aggregate({
          where: {
            createdAt: { gte: dateFilter },
            ...(vendorId && {
              purchaseOrder: { vendorId }
            })
          },
          _count: { id: true },
          _sum: { amount: true },
          _avg: { amount: true }
        }),

        // Cash flow analysis
        prisma.$queryRaw`
          SELECT 
            DATE_TRUNC('month', p.created_at) as month,
            SUM(CASE WHEN p.status = 'COMPLETED' THEN p.amount ELSE 0 END) as outflow,
            SUM(CASE WHEN p.status = 'PENDING' THEN p.amount ELSE 0 END) as pending_outflow,
            COUNT(CASE WHEN p.status = 'COMPLETED' THEN 1 END) as completed_payments,
            COUNT(CASE WHEN p.status = 'PENDING' THEN 1 END) as pending_payments
          FROM payments p
          WHERE p.created_at >= ${dateFilter}
          ${vendorId ? prisma.$queryRaw`AND p.purchase_order_id IN (
            SELECT id FROM purchase_orders WHERE vendor_id = ${vendorId}
          )` : prisma.$queryRaw``}
          GROUP BY DATE_TRUNC('month', p.created_at)
          ORDER BY month DESC
        `,

        // Vendor performance metrics
        prisma.$queryRaw`
          SELECT 
            vp.company_name,
            vp.id as vendor_id,
            COUNT(DISTINCT o.id) as order_count,
            COUNT(DISTINCT vi.id) as invoice_count,
            COUNT(DISTINCT p.id) as payment_count,
            SUM(o.total_value) as total_order_value,
            SUM(vi.invoice_amount) as total_invoice_amount,
            SUM(p.amount) as total_payment_amount,
            AVG(EXTRACT(DAYS FROM vi.created_at - po.created_at)) as avg_invoice_delay_days,
            AVG(EXTRACT(DAYS FROM p.processed_at - vi.created_at)) as avg_payment_delay_days
          FROM vendor_profiles vp
          LEFT JOIN purchase_orders po ON vp.id = po.vendor_id
          LEFT JOIN vendor_invoices vi ON po.id = vi.purchase_order_id
          LEFT JOIN payments p ON po.id = p.purchase_order_id
          LEFT JOIN assigned_order_items aoi ON vp.id = aoi.vendor_id
          LEFT JOIN order_items oi ON aoi.order_item_id = oi.id
          LEFT JOIN orders o ON oi.order_id = o.id
          WHERE o.created_at >= ${dateFilter}
          ${vendorId ? prisma.$queryRaw`AND vp.id = ${vendorId}` : prisma.$queryRaw``}
          GROUP BY vp.company_name, vp.id
          HAVING COUNT(DISTINCT o.id) > 0
          ORDER BY total_order_value DESC
          LIMIT 20
        `
      ]);

      // Calculate key performance indicators
      const kpis = {
        orderToInvoiceRatio: invoiceMetrics._count.id > 0 ? 
          (Number(orderMetrics._count.id) / Number(invoiceMetrics._count.id)) : 0,
        invoiceToPaymentRatio: paymentMetrics._count.id > 0 ? 
          (Number(invoiceMetrics._count.id) / Number(paymentMetrics._count.id)) : 0,
        averageOrderValue: Number(orderMetrics._avg.totalValue || 0),
        averageInvoiceValue: Number(invoiceMetrics._avg.invoiceAmount || 0),
        averagePaymentValue: Number(paymentMetrics._avg.amount || 0),
        totalOutstanding: Number(invoiceMetrics._sum.invoiceAmount || 0) - Number(paymentMetrics._sum.amount || 0)
      };

      return res.json({
        success: true,
        data: {
          period,
          kpis,
          orderMetrics: {
            count: orderMetrics._count.id,
            totalValue: Number(orderMetrics._sum.totalValue || 0),
            averageValue: Number(orderMetrics._avg.totalValue || 0)
          },
          invoiceMetrics: {
            count: invoiceMetrics._count.id,
            totalAmount: Number(invoiceMetrics._sum.invoiceAmount || 0),
            averageAmount: Number(invoiceMetrics._avg.invoiceAmount || 0)
          },
          paymentMetrics: {
            count: paymentMetrics._count.id,
            totalAmount: Number(paymentMetrics._sum.amount || 0),
            averageAmount: Number(paymentMetrics._avg.amount || 0)
          },
          cashFlowAnalysis,
          vendorPerformance
        }
      });

    } catch (error) {
      logger.error('Error generating financial analytics', { error });
      return res.status(500).json({
        success: false,
        error: 'Failed to generate financial analytics'
      });
    }
  }

  /**
   * Order fulfillment report
   */
  async getOrderFulfillmentReport(req: Request, res: Response) {
    try {
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const status = req.query.status as string;

      const dateFilter: any = {};
      if (startDate && endDate) {
        dateFilter.createdAt = {
          gte: new Date(startDate),
          lte: new Date(endDate)
        };
      }

      const statusFilter: any = {};
      if (status) {
        statusFilter.status = status;
      }

      const where = { ...dateFilter, ...statusFilter };

      const [orderStats, statusBreakdown, fulfillmentTimes, vendorPerformance] = await Promise.all([
        // Overall order statistics
        prisma.order.aggregate({
          where,
          _count: { id: true },
          _sum: { totalValue: true },
          _avg: { totalValue: true }
        }),

        // Orders by status
        prisma.order.groupBy({
          by: ['status'],
          where,
          _count: { id: true },
          _sum: { totalValue: true }
        }),

        // Average fulfillment times
        prisma.$queryRaw<Array<{avg_fulfillment_days: number, completed_orders: number}>>`
          SELECT 
            AVG(EXTRACT(DAYS FROM grn.verified_at - o.created_at)) as avg_fulfillment_days,
            COUNT(*) as completed_orders
          FROM orders o
          JOIN order_items oi ON o.id = oi.order_id
          JOIN assigned_order_items aoi ON oi.id = aoi.order_item_id
          JOIN goods_receipt_items gri ON aoi.id = gri.assigned_order_item_id
          JOIN goods_receipt_notes grn ON gri.goods_receipt_note_id = grn.id
          WHERE grn.status IN ('VERIFIED_OK', 'VERIFIED_MISMATCH')
          AND o.created_at >= ${dateFilter.createdAt?.gte || new Date('2024-01-01')}
        `,

        // Vendor performance summary
        prisma.$queryRaw`
          SELECT 
            vp.company_name,
            vp.id as vendor_id,
            COUNT(DISTINCT o.id) as total_orders,
            COUNT(DISTINCT CASE WHEN o.status = 'FULFILLED' THEN o.id END) as fulfilled_orders,
            COUNT(DISTINCT CASE WHEN grn.status = 'VERIFIED_MISMATCH' THEN o.id END) as orders_with_issues,
            AVG(EXTRACT(DAYS FROM grn.verified_at - o.created_at)) as avg_fulfillment_days,
            SUM(o.total_value) as total_order_value
          FROM vendor_profiles vp
          JOIN assigned_order_items aoi ON vp.id = aoi.vendor_id
          JOIN order_items oi ON aoi.order_item_id = oi.id
          JOIN orders o ON oi.order_id = o.id
          LEFT JOIN goods_receipt_items gri ON aoi.id = gri.assigned_order_item_id
          LEFT JOIN goods_receipt_notes grn ON gri.goods_receipt_note_id = grn.id
          WHERE o.created_at >= ${dateFilter.createdAt?.gte || new Date('2024-01-01')}
          GROUP BY vp.company_name, vp.id
          HAVING COUNT(DISTINCT o.id) > 0
          ORDER BY total_order_value DESC
          LIMIT 20
        `
      ]);

      return res.json({
        success: true,
        data: {
          summary: {
            totalOrders: orderStats._count.id,
            totalValue: Number(orderStats._sum.totalValue || 0),
            averageValue: Number(orderStats._avg.totalValue || 0)
          },
          statusBreakdown: statusBreakdown.map(item => ({
            status: item.status,
            count: item._count.id,
            value: Number(item._sum.totalValue || 0)
          })),
          fulfillmentMetrics: fulfillmentTimes[0] || { avg_fulfillment_days: 0, completed_orders: 0 },
          vendorPerformance
        }
      });

    } catch (error) {
      logger.error('Error generating order fulfillment report', { error });
      return res.status(500).json({
        success: false,
        error: 'Failed to generate order fulfillment report'
      });
    }
  }

  /**
   * GRN and quality report
   */
  async getGRNQualityReport(req: Request, res: Response) {
    try {
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const vendorId = req.query.vendorId as string;

      const dateFilter: any = {};
      if (startDate && endDate) {
        dateFilter.receivedAt = {
          gte: new Date(startDate),
          lte: new Date(endDate)
        };
      }

      const [grnStats, statusBreakdown, qualityIssues, vendorQuality] = await Promise.all([
        // Overall GRN statistics
        prisma.goodsReceiptNote.aggregate({
          where: {
            ...dateFilter,
            ...(vendorId && {
              dispatch: {
                vendorId
              }
            })
          },
          _count: { id: true }
        }),

        // GRN by status
        prisma.goodsReceiptNote.groupBy({
          by: ['status'],
          where: {
            ...dateFilter,
            ...(vendorId && {
              dispatch: {
                vendorId
              }
            })
          },
          _count: { id: true }
        }),

        // Quality issues breakdown
        prisma.goodsReceiptItem.groupBy({
          by: ['status'],
          where: {
            goodsReceiptNote: {
              ...dateFilter,
              ...(vendorId && {
                dispatch: {
                  vendorId
                }
              })
            }
          },
          _count: { id: true },
          _sum: { discrepancyQuantity: true }
        }),

        // Vendor quality performance
        prisma.$queryRaw`
          SELECT 
            vp.company_name,
            vp.id as vendor_id,
            COUNT(grn.*) as total_grns,
            COUNT(CASE WHEN grn.status = 'VERIFIED_OK' THEN 1 END) as clean_grns,
            COUNT(CASE WHEN grn.status = 'VERIFIED_MISMATCH' THEN 1 END) as grns_with_issues,
            COUNT(CASE WHEN gri.damage_reported = true THEN 1 END) as damage_incidents,
            SUM(ABS(gri.discrepancy_quantity)) as total_discrepancy,
            COUNT(t.*) as tickets_created
          FROM vendor_profiles vp
          JOIN dispatches d ON vp.id = d.vendor_id
          JOIN goods_receipt_notes grn ON d.id = grn.dispatch_id
          JOIN goods_receipt_items gri ON grn.id = gri.goods_receipt_note_id
          LEFT JOIN tickets t ON grn.id = t.goods_receipt_note_id
          WHERE grn.received_at >= ${dateFilter.receivedAt?.gte || new Date('2024-01-01')}
          ${vendorId ? prisma.$queryRaw`AND vp.id = ${vendorId}` : prisma.$queryRaw``}
          GROUP BY vp.company_name, vp.id
          HAVING COUNT(grn.*) > 0
          ORDER BY grns_with_issues DESC
          LIMIT 20
        `
      ]);

      // Calculate quality metrics
      const qualityMetrics = {
        totalGRNs: grnStats._count.id,
        cleanGRNs: statusBreakdown.find(s => s.status === 'VERIFIED_OK')?._count.id || 0,
        problematicGRNs: statusBreakdown.find(s => s.status === 'VERIFIED_MISMATCH')?._count.id || 0,
        qualityRate: grnStats._count.id > 0 ? 
          ((statusBreakdown.find(s => s.status === 'VERIFIED_OK')?._count.id || 0) / grnStats._count.id) * 100 : 0
      };

      return res.json({
        success: true,
        data: {
          summary: qualityMetrics,
          statusBreakdown: statusBreakdown.map(item => ({
            status: item.status,
            count: item._count.id
          })),
          qualityIssues: qualityIssues.map(item => ({
            issueType: item.status,
            count: item._count.id,
            totalDiscrepancy: Number(item._sum.discrepancyQuantity || 0)
          })),
          vendorQuality
        }
      });

    } catch (error) {
      logger.error('Error generating GRN quality report', { error });
      return res.status(500).json({
        success: false,
        error: 'Failed to generate GRN quality report'
      });
    }
  }

  /**
   * Export report data as CSV
   */
  async exportReport(req: Request, res: Response) {
    try {
      const { reportType, format = 'json' } = req.query;

      let data: any;
      
      switch (reportType) {
        case 'invoice-status':
          // Re-run invoice status report
          req.query = { ...req.query };
          await this.getInvoiceStatusReport(req, res);
          return;
        
        case 'payment-tracking':
          await this.getPaymentTrackingReport(req, res);
          return;
        
        case 'financial-analytics':
          await this.getFinancialAnalytics(req, res);
          return;
        
        case 'order-fulfillment':
          await this.getOrderFulfillmentReport(req, res);
          return;
        
        case 'grn-quality':
          await this.getGRNQualityReport(req, res);
          return;
        
        default:
          return res.status(400).json({
            success: false,
            error: 'Invalid report type'
          });
      }

    } catch (error) {
      logger.error('Error exporting report', { error });
      return res.status(500).json({
        success: false,
        error: 'Failed to export report'
      });
    }
  }
}

export const reportingController = new ReportingController();