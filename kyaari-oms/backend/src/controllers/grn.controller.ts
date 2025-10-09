import { Request, Response, NextFunction } from 'express';
import grnService from '../services/grn.service';
import { createGRNSchema, getGRNsQuerySchema } from '../modules/grn/grn.validators';

class GRNController {
  /**
   * Create a new GRN (Goods Receipt Note)
   * POST /api/grn
   */
  async createGRN(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      if (!user?.userId || !user?.email) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      // Check if user has OPERATIONS role
      if (!user.roles.includes('OPS') && !user.roles.includes('ADMIN')) {
        return res.status(403).json({
          success: false,
          error: 'Operations team access required',
        });
      }

      // Validate request body
      const validationResult = createGRNSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          errors: validationResult.error.flatten().fieldErrors,
        });
      }

      const grn = await grnService.createGRN(
        validationResult.data,
        user.userId,
        user.email
      );

      res.status(201).json({
        success: true,
        data: grn,
      });
    } catch (error: any) {
      console.error('Create GRN error:', error);
      if (error.message.includes('not found') || error.message.includes('already exists')) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create GRN',
      });
    }
  }

  /**
   * Get GRN details
   * GET /api/grn/:id
   */
  async getGRNDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      if (!user?.userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const { id } = req.params;
      const grn = await grnService.getGRNById(id);

      res.json({
        success: true,
        data: grn,
      });
    } catch (error: any) {
      console.error('Get GRN details error:', error);
      if (error.message === 'GRN not found') {
        return res.status(404).json({
          success: false,
          error: 'GRN not found',
        });
      }
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get GRN details',
      });
    }
  }

  /**
   * Get all GRNs with filters
   * GET /api/grn
   */
  async getGRNs(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      if (!user?.userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      // Validate query params
      const validationResult = getGRNsQuerySchema.safeParse(req.query);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          errors: validationResult.error.flatten().fieldErrors,
        });
      }

      const result = await grnService.getGRNs(validationResult.data);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Get GRNs error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get GRNs',
      });
    }
  }
}

export default new GRNController();
