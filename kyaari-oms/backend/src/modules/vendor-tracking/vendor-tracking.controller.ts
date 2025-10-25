import { Request, Response } from 'express';
import { z } from 'zod';
import { logger } from '../../utils/logger';
import { vendorTrackingService } from './vendor-tracking.service';
import { 
  vendorTrackingQuerySchema, 
  vendorIdSchema, 
  updateFillRateSchema, 
  bulkUpdateFillRatesSchema,
  dateRangeSchema,
  vendorSlaQuerySchema
} from './vendor-tracking.validators';

export class VendorTrackingController {

  /**
   * Get comprehensive vendor tracking dashboard data
   */
  async getVendorTrackingDashboard(req: Request, res: Response) {
    try {
      const query = vendorTrackingQuerySchema.parse(req.query);
      
      const result = await vendorTrackingService.getVendorTrackingDashboard(query);

      return res.json({
        success: true,
        data: result
      });

    } catch (error) {
      logger.error('Error getting vendor tracking dashboard', { error, query: req.query });
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: error.errors
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Failed to fetch vendor tracking dashboard'
      });
    }
  }

  /**
   * Get vendor tracking data with fill rate calculations
   */
  async getVendorTracking(req: Request, res: Response) {
    try {
      const query = vendorTrackingQuerySchema.parse(req.query);
      
      const result = await vendorTrackingService.getVendorTracking(query);

      return res.json({
        success: true,
        data: result
      });

    } catch (error) {
      logger.error('Error getting vendor tracking data', { error, query: req.query });
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: error.errors
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Failed to fetch vendor tracking data'
      });
    }
  }

  /**
   * Get fill rates for all vendors
   */
  async getVendorFillRates(req: Request, res: Response) {
    try {
      const query = dateRangeSchema.parse(req.query);
      
      const fillRates = await vendorTrackingService.calculateVendorFillRates(query);

      return res.json({
        success: true,
        data: fillRates
      });

    } catch (error) {
      logger.error('Error getting vendor fill rates', { error, query: req.query });
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: error.errors
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Failed to fetch vendor fill rates'
      });
    }
  }

  /**
   * Get detailed performance metrics for a specific vendor
   */
  async getVendorPerformanceMetrics(req: Request, res: Response) {
    try {
      const { vendorId } = vendorIdSchema.parse(req.params);
      const query = dateRangeSchema.parse(req.query);
      
      const metrics = await vendorTrackingService.getVendorPerformanceMetrics(vendorId, query);

      return res.json({
        success: true,
        data: metrics
      });

    } catch (error) {
      logger.error('Error getting vendor performance metrics', { 
        error, 
        vendorId: req.params.vendorId, 
        query: req.query 
      });
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid parameters',
          details: error.errors
        });
      }

      if (error instanceof Error && error.message === 'Vendor not found') {
        return res.status(404).json({
          success: false,
          error: 'Vendor not found'
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Failed to fetch vendor performance metrics'
      });
    }
  }

  /**
   * Update fill rate for a specific vendor
   */
  async updateVendorFillRate(req: Request, res: Response) {
    try {
      const { vendorId } = vendorIdSchema.parse(req.params);
      const { fillRate } = updateFillRateSchema.parse(req.body);
      
      await vendorTrackingService.updateVendorFillRate(vendorId, fillRate);

      return res.json({
        success: true,
        message: 'Vendor fill rate updated successfully',
        data: { vendorId, fillRate }
      });

    } catch (error) {
      logger.error('Error updating vendor fill rate', { 
        error, 
        vendorId: req.params.vendorId, 
        body: req.body 
      });
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid parameters',
          details: error.errors
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Failed to update vendor fill rate'
      });
    }
  }

  /**
   * Bulk update fill rates for all vendors
   */
  async bulkUpdateFillRates(req: Request, res: Response) {
    try {
      const { force } = bulkUpdateFillRatesSchema.parse(req.body);
      
      // Check if user has permission to perform bulk updates
      // This would typically be an admin-only operation
      const result = await vendorTrackingService.bulkUpdateFillRates();

      return res.json({
        success: true,
        message: 'Bulk fill rate update completed',
        data: {
          updated: result.updated,
          errorCount: result.errors.length,
          errors: result.errors
        }
      });

    } catch (error) {
      logger.error('Error bulk updating fill rates', { error, body: req.body });
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid parameters',
          details: error.errors
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Failed to bulk update fill rates'
      });
    }
  }

  /**
   * Get vendor fill rate history (if implemented)
   */
  async getVendorFillRateHistory(req: Request, res: Response) {
    try {
      const { vendorId } = vendorIdSchema.parse(req.params);
      const query = dateRangeSchema.parse(req.query);
      
      // This would require implementing a fill rate history table
      // For now, return current fill rate
      const fillRates = await vendorTrackingService.calculateVendorFillRates({
        vendorId,
        ...query
      });

      const vendorFillRate = fillRates.find(fr => fr.vendorId === vendorId);

      if (!vendorFillRate) {
        return res.status(404).json({
          success: false,
          error: 'Vendor not found'
        });
      }

      return res.json({
        success: true,
        data: {
          vendor: vendorFillRate.vendor,
          currentFillRate: vendorFillRate.currentFillRate,
          calculatedFillRate: vendorFillRate.calculatedFillRate,
          metrics: {
            totalOrders: vendorFillRate.totalOrders,
            totalAssignedQuantity: vendorFillRate.totalAssignedQuantity,
            totalConfirmedQuantity: vendorFillRate.totalConfirmedQuantity
          }
        }
      });

    } catch (error) {
      logger.error('Error getting vendor fill rate history', { 
        error, 
        vendorId: req.params.vendorId, 
        query: req.query 
      });
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid parameters',
          details: error.errors
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Failed to fetch vendor fill rate history'
      });
    }
  }

  /**
   * Get vendor performance comparison
   */
  async getVendorPerformanceComparison(req: Request, res: Response) {
    try {
      const query = dateRangeSchema.parse(req.query);
      
      const fillRates = await vendorTrackingService.calculateVendorFillRates(query);

      // Calculate performance statistics
      const totalVendors = fillRates.length;
      const averageFillRate = totalVendors > 0 
        ? fillRates.reduce((sum, fr) => sum + fr.calculatedFillRate, 0) / totalVendors 
        : 0;
      
      const topPerformers = fillRates.slice(0, 5);
      const bottomPerformers = fillRates.slice(-5).reverse();

      return res.json({
        success: true,
        data: {
          summary: {
            totalVendors,
            averageFillRate: Math.round(averageFillRate * 100) / 100,
            highestFillRate: fillRates[0]?.calculatedFillRate || 0,
            lowestFillRate: fillRates[fillRates.length - 1]?.calculatedFillRate || 0
          },
          topPerformers,
          bottomPerformers,
          allVendors: fillRates
        }
      });

    } catch (error) {
      logger.error('Error getting vendor performance comparison', { error, query: req.query });
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: error.errors
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Failed to fetch vendor performance comparison'
      });
    }
  }

  /**
   * Get SLA compliance for all vendors
   */
  async getVendorSla(req: Request, res: Response) {
    try {
      const query = vendorSlaQuerySchema.parse(req.query);
      
      const slaResults = await vendorTrackingService.calculateVendorSla(query);

      return res.json({
        success: true,
        data: slaResults
      });

    } catch (error) {
      logger.error('Error getting vendor SLA', { error, query: req.query });
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: error.errors
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Failed to fetch vendor SLA data'
      });
    }
  }

  /**
   * Get performance trends for a specific vendor
   */
  async getVendorPerformanceTrends(req: Request, res: Response) {
    try {
      const { vendorId } = vendorIdSchema.parse(req.params);
      const { timeFilter = 'days' } = req.query as { timeFilter?: 'days' | 'weeks' | 'months' };
      
      const trends = await vendorTrackingService.getVendorPerformanceTrends(vendorId, timeFilter);

      return res.json({
        success: true,
        data: trends
      });

    } catch (error) {
      logger.error('Error getting vendor performance trends', { 
        error, 
        vendorId: req.params.vendorId, 
        query: req.query 
      });
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid parameters',
          details: error.errors
        });
      }

      if (error instanceof Error && error.message === 'Vendor not found') {
        return res.status(404).json({
          success: false,
          error: 'Vendor not found'
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Failed to fetch vendor performance trends'
      });
    }
  }

  /**
   * Get detailed SLA metrics for a specific vendor
   */
  async getVendorSlaMetrics(req: Request, res: Response) {
    try {
      const { vendorId } = vendorIdSchema.parse(req.params);
      const query = vendorSlaQuerySchema.parse(req.query);
      
      const slaMetrics = await vendorTrackingService.getVendorSlaMetrics(vendorId, query);

      return res.json({
        success: true,
        data: slaMetrics
      });

    } catch (error) {
      logger.error('Error getting vendor SLA metrics', { 
        error, 
        vendorId: req.params.vendorId, 
        query: req.query 
      });
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid parameters',
          details: error.errors
        });
      }

      if (error instanceof Error && error.message === 'Vendor not found') {
        return res.status(404).json({
          success: false,
          error: 'Vendor not found'
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Failed to fetch vendor SLA metrics'
      });
    }
  }
}

export const vendorTrackingController = new VendorTrackingController();
