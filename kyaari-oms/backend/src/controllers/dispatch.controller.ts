import { Request, Response, NextFunction } from 'express';
import dispatchService from '../services/dispatch.service';
import { createDispatchSchema, getDispatchesQuerySchema } from '../modules/dispatch/dispatch.validators';

class DispatchController {
  /**
   * Create a new dispatch
   * POST /api/dispatches
   */
  async createDispatch(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      if (!user?.userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      // Get vendor profile
      const vendorProfile = await this.getVendorProfile(user.userId);
      if (!vendorProfile) {
        return res.status(403).json({
          success: false,
          error: 'Vendor profile required',
        });
      }

      // Validate request body
      const validationResult = createDispatchSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          errors: validationResult.error.flatten().fieldErrors,
        });
      }

      const dispatch = await dispatchService.createDispatch(
        vendorProfile.id,
        validationResult.data,
        user.userId
      );

      res.status(201).json({
        success: true,
        data: dispatch,
      });
    } catch (error: any) {
      console.error('Create dispatch error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create dispatch',
      });
    }
  }

  /**
   * Get vendor's dispatches
   * GET /api/dispatches/my
   */
  async getMyDispatches(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      if (!user?.userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      // Get vendor profile
      const vendorProfile = await this.getVendorProfile(user.userId);
      if (!vendorProfile) {
        return res.status(403).json({
          success: false,
          error: 'Vendor profile required',
        });
      }

      // Validate query params
      const validationResult = getDispatchesQuerySchema.safeParse(req.query);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          errors: validationResult.error.flatten().fieldErrors,
        });
      }

      const result = await dispatchService.getVendorDispatches(
        vendorProfile.id,
        validationResult.data
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Get dispatches error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get dispatches',
      });
    }
  }

  /**
   * Get dispatch details
   * GET /api/dispatches/:id
   */
  async getDispatchDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      if (!user?.userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const { id } = req.params;

      // Get vendor profile (vendor can only see their own dispatches)
      const vendorProfile = await this.getVendorProfile(user.userId);
      const vendorId = vendorProfile?.id;

      const dispatch = await dispatchService.getDispatchById(id, vendorId);

      res.json({
        success: true,
        data: dispatch,
      });
    } catch (error: any) {
      console.error('Get dispatch details error:', error);
      if (error.message === 'Dispatch not found') {
        return res.status(404).json({
          success: false,
          error: 'Dispatch not found',
        });
      }
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get dispatch details',
      });
    }
  }

  /**
   * Upload dispatch proof
   * POST /api/dispatches/:id/upload-proof
   */
  async uploadDispatchProof(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      if (!user?.userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      // Get vendor profile
      const vendorProfile = await this.getVendorProfile(user.userId);
      if (!vendorProfile) {
        return res.status(403).json({
          success: false,
          error: 'Vendor profile required',
        });
      }

      const { id } = req.params;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          error: 'File is required',
        });
      }

      const result = await dispatchService.uploadDispatchProof(
        id,
        vendorProfile.id,
        file,
        user.userId
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Upload dispatch proof error:', error);
      if (error.message === 'Dispatch not found') {
        return res.status(404).json({
          success: false,
          error: 'Dispatch not found',
        });
      }
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to upload dispatch proof',
      });
    }
  }

  /**
   * Helper method to get vendor profile
   */
  private async getVendorProfile(userId: string) {
    const { prisma } = await import('../config/database');
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { vendorProfile: true },
    });
    return user?.vendorProfile;
  }
}

export default new DispatchController();
