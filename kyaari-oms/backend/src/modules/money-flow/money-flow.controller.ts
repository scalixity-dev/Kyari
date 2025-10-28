import { Request, Response } from 'express';
import { z } from 'zod';
import { MoneyFlowService } from './money-flow.service';
import { logger } from '../../utils/logger';
import { ResponseHelper } from '../../utils/response';

// Validation schemas
const moneyFlowFiltersSchema = z.object({
  status: z.enum(['All', 'Pending', 'Released', 'Approved']).optional().default('All'),
  searchQuery: z.string().optional().default(''),
  sortOrder: z.enum(['Latest', 'Oldest']).optional().default('Latest'),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(10)
});

const trendRangeSchema = z.object({
  range: z.enum(['Weekly', 'Monthly', 'Yearly'])
});

export class MoneyFlowController {
  
  /**
   * GET /api/money-flow/kpis
   * Get money flow KPIs
   */
  static async getKPIs(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseHelper.unauthorized(res, 'Authentication required');
        return;
      }

      logger.info('Fetching money flow KPIs', { userId: req.user.userId });

      const kpis = await MoneyFlowService.getKPIs();

      ResponseHelper.success(res, { kpis }, 'Money flow KPIs fetched successfully');
    } catch (error) {
      logger.error('Failed to fetch money flow KPIs', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.userId 
      });
      ResponseHelper.error(res, 'Failed to fetch money flow KPIs', 500);
    }
  }

  /**
   * GET /api/money-flow/transactions
   * Get money flow transactions with filtering and pagination
   */
  static async getTransactions(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseHelper.unauthorized(res, 'Authentication required');
        return;
      }

      const parseResult = moneyFlowFiltersSchema.safeParse(req.query);
      if (!parseResult.success) {
        ResponseHelper.error(res, 'Invalid request body', 400);
        return;
      }

      const filters = parseResult.data;

      logger.info('Fetching money flow transactions', { 
        userId: req.user.userId, 
        filters 
      });

      const result = await MoneyFlowService.getTransactions(filters);

      ResponseHelper.success(res, result, `Found ${result.pagination.total} transactions`);
    } catch (error) {
      logger.error('Failed to fetch money flow transactions', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.userId 
      });
      ResponseHelper.error(res, 'Failed to fetch money flow transactions', 500);
    }
  }

  /**
   * GET /api/money-flow/trend
   * Get money flow trend data for charts
   */
  static async getTrendData(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseHelper.unauthorized(res, 'Authentication required');
        return;
      }

      const parseResult = trendRangeSchema.safeParse(req.query);
      if (!parseResult.success) {
        ResponseHelper.error(res, 'Invalid request body', 400);
        return;
      }

      const trendRange = parseResult.data;

      logger.info('Fetching money flow trend data', { 
        userId: req.user.userId, 
        range: trendRange.range 
      });

      const trendData = await MoneyFlowService.getTrendData(trendRange);

      ResponseHelper.success(res, { trendData }, 'Money flow trend data fetched successfully');
    } catch (error) {
      logger.error('Failed to fetch money flow trend data', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.userId 
      });
      ResponseHelper.error(res, 'Failed to fetch money flow trend data', 500);
    }
  }

  /**
   * GET /api/money-flow/pie-chart
   * Get money flow pie chart data
   */
  static async getPieChartData(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseHelper.unauthorized(res, 'Authentication required');
        return;
      }

      logger.info('Fetching money flow pie chart data', { userId: req.user.userId });

      const pieChartData = await MoneyFlowService.getPieChartData();

      ResponseHelper.success(res, { pieChartData }, 'Money flow pie chart data fetched successfully');
    } catch (error) {
      logger.error('Failed to fetch money flow pie chart data', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.userId 
      });
      ResponseHelper.error(res, 'Failed to fetch money flow pie chart data', 500);
    }
  }

  /**
   * GET /api/money-flow/complete
   * Get complete money flow data (all components)
   */
  static async getCompleteData(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseHelper.unauthorized(res, 'Authentication required');
        return;
      }

      const filtersParseResult = moneyFlowFiltersSchema.safeParse(req.query);
      if (!filtersParseResult.success) {
        ResponseHelper.error(res, 'Invalid query parameters', 400);
        return;
      }

      const trendRangeParseResult = trendRangeSchema.safeParse(req.query);
      if (!trendRangeParseResult.success) {
        ResponseHelper.error(res, 'Invalid trend range parameter', 400);
        return;
      }

      const filters = filtersParseResult.data;
      const trendRange = trendRangeParseResult.data;

      logger.info('Fetching complete money flow data', { 
        userId: req.user.userId, 
        filters,
        trendRange 
      });

      const completeData = await MoneyFlowService.getCompleteMoneyFlowData(filters, trendRange);

      ResponseHelper.success(res, completeData, 'Complete money flow data fetched successfully');
    } catch (error) {
      logger.error('Failed to fetch complete money flow data', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.userId 
      });
      ResponseHelper.error(res, 'Failed to fetch complete money flow data', 500);
    }
  }

  /**
   * POST /api/money-flow/export/csv
   * Export money flow transactions to CSV
   */
  static async exportCSV(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseHelper.unauthorized(res, 'Authentication required');
        return;
      }

      const parseResult = moneyFlowFiltersSchema.safeParse(req.body);
      if (!parseResult.success) {
        ResponseHelper.error(res, 'Invalid request body', 400);
        return;
      }

      const filters = parseResult.data;

      logger.info('Exporting money flow transactions to CSV', { 
        userId: req.user.userId, 
        filters 
      });

      // Get all transactions (no pagination for export)
      const exportFilters = { ...filters, limit: 10000, page: 1 };
      const result = await MoneyFlowService.getTransactions(exportFilters);

      // Generate CSV content
      const headers = ['Invoice ID', 'Vendor', 'Amount', 'Status', 'Date', 'Due Date', 'Release Date', 'Reference ID'];
      const csvRows = [
        headers.join(','),
        ...result.transactions.map(t => [
          t.id,
          `"${t.vendor}"`,
          t.amount,
          t.status,
          t.date,
          t.dueDate || '',
          t.releaseDate || '',
          t.referenceId || ''
        ].join(','))
      ];

      const csvContent = csvRows.join('\n');
      const filename = `money-flow-transactions-${new Date().toISOString().split('T')[0]}.csv`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csvContent);
    } catch (error) {
      logger.error('Failed to export money flow transactions to CSV', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.userId 
      });
      ResponseHelper.error(res, 'Failed to export transactions to CSV', 500);
    }
  }

  /**
   * POST /api/money-flow/export/pdf
   * Export money flow transactions to PDF (returns text format for now)
   */
  static async exportPDF(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseHelper.unauthorized(res, 'Authentication required');
        return;
      }

      const parseResult = moneyFlowFiltersSchema.safeParse(req.body);
      if (!parseResult.success) {
        ResponseHelper.error(res, 'Invalid request body', 400);
        return;
      }

      const filters = parseResult.data;

      logger.info('Exporting money flow transactions to PDF', { 
        userId: req.user.userId, 
        filters 
      });

      // Get all transactions (no pagination for export)
      const exportFilters = { ...filters, limit: 10000, page: 1 };
      const result = await MoneyFlowService.getTransactions(exportFilters);

      // Generate PDF content (text format for now)
      const content = [
        'MONEY FLOW TRANSACTIONS REPORT',
        `Generated: ${new Date().toLocaleString()}`,
        `Total Transactions: ${result.pagination.total}`,
        `Filter: ${filters.status}`,
        `Sort: ${filters.sortOrder}`,
        '',
        '=== TRANSACTIONS ===',
        ...result.transactions.map(t => 
          `${t.id} | ${t.vendor} | ${t.amount} | ${t.status} | ${t.date}`
        )
      ].join('\n');

      const filename = `money-flow-transactions-${new Date().toISOString().split('T')[0]}.txt`;

      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(content);
    } catch (error) {
      logger.error('Failed to export money flow transactions to PDF', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.userId 
      });
      ResponseHelper.error(res, 'Failed to export transactions to PDF', 500);
    }
  }
}
