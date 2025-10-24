import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';
import { 
  MoneyFlowKPIDto, 
  MoneyFlowTransactionDto, 
  MoneyFlowTrendDataDto, 
  MoneyFlowPieChartDto,
  MoneyFlowFiltersDto,
  MoneyFlowTrendRangeDto
} from './money-flow.dto';

export class MoneyFlowService {
  
  /**
   * Get KPIs for money flow dashboard
   */
  static async getKPIs(): Promise<MoneyFlowKPIDto[]> {
    try {
      // Get total pending payments (PurchaseOrders without payments)
      const pendingPayments = await prisma.purchaseOrder.aggregate({
        where: { 
          payment: null,
          vendorInvoice: { isNot: null }
        },
        _sum: { totalAmount: true },
        _count: { id: true }
      });

      // Get total released payments this month
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);
      
      const releasedThisMonth = await prisma.payment.aggregate({
        where: { 
          status: 'COMPLETED',
          processedAt: { gte: currentMonth }
        },
        _sum: { amount: true },
        _count: { id: true }
      });

      // Get vendor with highest outstanding
      const vendorWithHighestOutstanding = await prisma.purchaseOrder.findFirst({
        where: {
          payment: null,
          vendorInvoice: { isNot: null }
        },
        include: {
          vendor: true,
          vendorInvoice: true
        },
        orderBy: {
          totalAmount: 'desc'
        }
      });

      const kpis: MoneyFlowKPIDto[] = [
        {
          title: 'Total Payments Pending',
          value: `₹${Number(pendingPayments._sum.totalAmount || 0).toLocaleString()}`,
          subtitle: `${pendingPayments._count.id} invoices`,
          icon: 'Wallet'
        },
        {
          title: 'Payments Released This Month',
          value: `₹${Number(releasedThisMonth._sum.amount || 0).toLocaleString()}`,
          subtitle: `${releasedThisMonth._count.id} payouts`,
          icon: 'FileText'
        },
        {
          title: 'Vendor with Highest Outstanding',
          value: vendorWithHighestOutstanding?.vendor.companyName || 'N/A',
          subtitle: vendorWithHighestOutstanding ? `₹${Number(vendorWithHighestOutstanding.totalAmount).toLocaleString()}` : '₹0',
          icon: 'Users'
        }
      ];

      return kpis;
    } catch (error) {
      logger.error('Failed to get money flow KPIs', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw new Error('Failed to fetch money flow KPIs');
    }
  }

  /**
   * Get transactions with filtering and pagination
   */
  static async getTransactions(filters: MoneyFlowFiltersDto): Promise<{
    transactions: MoneyFlowTransactionDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const { 
        status = 'All', 
        searchQuery = '', 
        sortOrder = 'Latest', 
        page = 1, 
        limit = 10 
      } = filters;

      const skip = (page - 1) * limit;

      // Build where clause for filtering
      const whereClause: any = {
        vendorInvoice: { isNot: null }
      };

      // Add status filter
      if (status !== 'All') {
        if (status === 'Pending') {
          whereClause.payment = null;
        } else if (status === 'Released') {
          whereClause.payment = { status: 'COMPLETED' };
        } else if (status === 'Approved') {
          whereClause.payment = { status: 'PROCESSING' };
        }
      }

      // Add search filter
      if (searchQuery.trim()) {
        whereClause.OR = [
          { poNumber: { contains: searchQuery, mode: 'insensitive' } },
          { vendor: { companyName: { contains: searchQuery, mode: 'insensitive' } } }
        ];
      }

      // Get purchase orders with related data
      const [purchaseOrders, total] = await Promise.all([
        prisma.purchaseOrder.findMany({
          where: whereClause,
          include: {
            vendor: true,
            vendorInvoice: true,
            payment: true
          },
          orderBy: sortOrder === 'Latest' ? { createdAt: 'desc' } : { createdAt: 'asc' },
          skip,
          take: limit
        }),
        prisma.purchaseOrder.count({ where: whereClause })
      ]);

      // Transform to DTOs
      const transactions: MoneyFlowTransactionDto[] = purchaseOrders.map(po => {
        const invoice = po.vendorInvoice;
        const payment = po.payment;
        
        // Determine status
        let status: 'Pending' | 'Released' | 'Approved' = 'Pending';
        if (payment?.status === 'COMPLETED') {
          status = 'Released';
        } else if (payment?.status === 'PROCESSING') {
          status = 'Approved';
        }

        // Calculate due date (7 days from invoice date)
        const dueDate = invoice?.invoiceDate 
          ? new Date(invoice.invoiceDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          : undefined;

        return {
          id: po.poNumber,
          vendor: po.vendor.companyName,
          amount: `₹${Number(po.totalAmount).toLocaleString()}`,
          status,
          date: po.createdAt.toISOString().split('T')[0],
          invoiceNumber: invoice?.invoiceNumber,
          orderId: po.poNumber,
          dueDate,
          releaseDate: payment?.processedAt?.toISOString().split('T')[0],
          referenceId: payment?.transactionId || undefined
        };
      });

      const totalPages = Math.ceil(total / limit);

      return {
        transactions,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      };
    } catch (error) {
      logger.error('Failed to get money flow transactions', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw new Error('Failed to fetch money flow transactions');
    }
  }

  /**
   * Get trend data for charts
   */
  static async getTrendData(range: MoneyFlowTrendRangeDto): Promise<MoneyFlowTrendDataDto> {
    try {
      const { range: trendRange } = range;
      const now = new Date();
      
      let labels: string[] = [];
      let pending: number[] = [];
      let cleared: number[] = [];

      if (trendRange === 'Weekly') {
        // Get last 4 weeks with dynamic labels
        const weeks = [];
        for (let i = 3; i >= 0; i--) {
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - (i * 7));
          weekStart.setHours(0, 0, 0, 0);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          weekEnd.setHours(23, 59, 59, 999);
          weeks.push({ start: weekStart, end: weekEnd });
          
          // Add week label (e.g., "Oct 14-20")
          const startDay = weekStart.getDate();
          const endDay = weekEnd.getDate();
          const monthName = weekStart.toLocaleDateString('en', { month: 'short' });
          labels.push(`${monthName} ${startDay}-${endDay}`);
        }

        for (const week of weeks) {
          const [weekPending, weekCleared] = await Promise.all([
            prisma.purchaseOrder.aggregate({
              where: {
                payment: null,
                vendorInvoice: { isNot: null },
                createdAt: { gte: week.start, lte: week.end }
              },
              _sum: { totalAmount: true }
            }),
            prisma.purchaseOrder.aggregate({
              where: {
                payment: { status: 'COMPLETED' },
                vendorInvoice: { isNot: null },
                createdAt: { gte: week.start, lte: week.end }
              },
              _sum: { totalAmount: true }
            })
          ]);

          pending.push(Number(weekPending._sum.totalAmount || 0));
          cleared.push(Number(weekCleared._sum.totalAmount || 0));
        }
      } else if (trendRange === 'Monthly') {
        // Get last 12 months with dynamic labels
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        for (let i = 11; i >= 0; i--) {
          const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
          
          // Add month label
          labels.push(monthNames[monthStart.getMonth()]);

          const [monthPending, monthCleared] = await Promise.all([
            prisma.purchaseOrder.aggregate({
              where: {
                payment: null,
                vendorInvoice: { isNot: null },
                createdAt: { gte: monthStart, lte: monthEnd }
              },
              _sum: { totalAmount: true }
            }),
            prisma.purchaseOrder.aggregate({
              where: {
                payment: { status: 'COMPLETED' },
                vendorInvoice: { isNot: null },
                createdAt: { gte: monthStart, lte: monthEnd }
              },
              _sum: { totalAmount: true }
            })
          ]);

          pending.push(Number(monthPending._sum.totalAmount || 0));
          cleared.push(Number(monthCleared._sum.totalAmount || 0));
        }
      } else if (trendRange === 'Yearly') {
        // Get last 4 years with dynamic labels
        for (let i = 3; i >= 0; i--) {
          const yearStart = new Date(now.getFullYear() - i, 0, 1);
          const yearEnd = new Date(now.getFullYear() - i, 11, 31, 23, 59, 59, 999);
          
          // Add year label
          labels.push(yearStart.getFullYear().toString());

          const [yearPending, yearCleared] = await Promise.all([
            prisma.purchaseOrder.aggregate({
              where: {
                payment: null,
                vendorInvoice: { isNot: null },
                createdAt: { gte: yearStart, lte: yearEnd }
              },
              _sum: { totalAmount: true }
            }),
            prisma.purchaseOrder.aggregate({
              where: {
                payment: { status: 'COMPLETED' },
                vendorInvoice: { isNot: null },
                createdAt: { gte: yearStart, lte: yearEnd }
              },
              _sum: { totalAmount: true }
            })
          ]);

          pending.push(Number(yearPending._sum.totalAmount || 0));
          cleared.push(Number(yearCleared._sum.totalAmount || 0));
        }
      }

      return {
        labels,
        pending,
        cleared
      };
    } catch (error) {
      logger.error('Failed to get money flow trend data', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw new Error('Failed to fetch money flow trend data');
    }
  }

  /**
   * Get pie chart data for pending vs cleared
   */
  static async getPieChartData(): Promise<MoneyFlowPieChartDto> {
    try {
      const [pendingData, clearedData] = await Promise.all([
        prisma.purchaseOrder.aggregate({
          where: { 
            payment: null,
            vendorInvoice: { isNot: null }
          },
          _sum: { totalAmount: true },
          _count: { id: true }
        }),
        prisma.purchaseOrder.aggregate({
          where: { 
            payment: { status: 'COMPLETED' },
            vendorInvoice: { isNot: null }
          },
          _sum: { totalAmount: true },
          _count: { id: true }
        })
      ]);

      const pendingAmount = Number(pendingData._sum.totalAmount || 0);
      const clearedAmount = Number(clearedData._sum.totalAmount || 0);
      const total = pendingAmount + clearedAmount;

      const pendingPercent = total > 0 ? Math.round((pendingAmount / total) * 100) : 0;
      const clearedPercent = total > 0 ? Math.round((clearedAmount / total) * 100) : 0;

      return {
        pending: pendingAmount,
        cleared: clearedAmount,
        total,
        pendingPercent,
        clearedPercent
      };
    } catch (error) {
      logger.error('Failed to get money flow pie chart data', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw new Error('Failed to fetch money flow pie chart data');
    }
  }

  /**
   * Get complete money flow data (all components)
   */
  static async getCompleteMoneyFlowData(filters: MoneyFlowFiltersDto, trendRange: MoneyFlowTrendRangeDto): Promise<{
    kpis: MoneyFlowKPIDto[];
    transactions: MoneyFlowTransactionDto[];
    trendData: MoneyFlowTrendDataDto;
    pieChartData: MoneyFlowPieChartDto;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const [kpis, transactionsData, trendData, pieChartData] = await Promise.all([
        this.getKPIs(),
        this.getTransactions(filters),
        this.getTrendData(trendRange),
        this.getPieChartData()
      ]);

      return {
        kpis,
        transactions: transactionsData.transactions,
        trendData,
        pieChartData,
        pagination: transactionsData.pagination
      };
    } catch (error) {
      logger.error('Failed to get complete money flow data', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw new Error('Failed to fetch complete money flow data');
    }
  }
}
