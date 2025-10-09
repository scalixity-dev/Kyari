import { Request, Response } from 'express';
import { assignmentService } from './assignment.service';
import { prisma } from '../../config/database';
import { 
  vendorAssignmentQuerySchema, 
  updateAssignmentStatusSchema, 
  assignmentIdSchema,
  validateSchema 
} from './assignment.validators';
import { ResponseHelper } from '../../utils/response';
import { logger } from '../../utils/logger';

export class AssignmentController {

  /**
   * Get vendor profile for authenticated user
   */
  private async getVendorProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { vendorProfile: true }
    });
    return user?.vendorProfile;
  }

  /**
   * Get vendor's assignments (GET /assignments/my)
   */
  async getMyAssignments(req: Request, res: Response): Promise<void> {
    try {
      // Ensure user is authenticated
      const user = (req as any).user;
      if (!user?.userId) {
        ResponseHelper.forbidden(res, 'Authentication required');
        return;
      }

      // Get vendor profile
      const vendorProfile = await this.getVendorProfile(user.userId);
      if (!vendorProfile) {
        ResponseHelper.forbidden(res, 'Vendor profile required');
        return;
      }

      // Validate query parameters
      const validation = validateSchema(vendorAssignmentQuerySchema, req.query);
      if (!validation.success) {
        ResponseHelper.validationError(res, validation.errors);
        return;
      }

      // Get assignments
      const result = await assignmentService.getVendorAssignments(vendorProfile.id, validation.data);

      ResponseHelper.success(res, result);
    } catch (error) {
      logger.error('Get assignments controller error', { 
        error, 
        userId: (req as any).user?.userId,
        query: req.query 
      });
      ResponseHelper.error(res, error instanceof Error ? error.message : 'Failed to retrieve assignments');
    }
  }

  /**
   * Get single assignment details (GET /assignments/:id)
   */
  async getAssignmentDetails(req: Request, res: Response): Promise<void> {
    try {
      // Ensure user is authenticated
      const user = (req as any).user;
      if (!user?.userId) {
        ResponseHelper.forbidden(res, 'Authentication required');
        return;
      }

      // Get vendor profile
      const vendorProfile = await this.getVendorProfile(user.userId);
      if (!vendorProfile) {
        ResponseHelper.forbidden(res, 'Vendor profile required');
        return;
      }

      // Validate assignment ID
      const validation = validateSchema(assignmentIdSchema, req.params);
      if (!validation.success) {
        ResponseHelper.validationError(res, validation.errors);
        return;
      }

      const assignmentId = validation.data.id;

      // Get assignment details
      const assignment = await assignmentService.getVendorAssignmentById(assignmentId, vendorProfile.id);

      if (!assignment) {
        ResponseHelper.notFound(res, 'Assignment not found');
        return;
      }

      ResponseHelper.success(res, assignment);
    } catch (error) {
      logger.error('Get assignment details controller error', { 
        error, 
        userId: (req as any).user?.userId,
        assignmentId: req.params.id 
      });
      ResponseHelper.error(res, error instanceof Error ? error.message : 'Failed to retrieve assignment details');
    }
  }

  /**
   * Update assignment status (PATCH /assignments/:id/status)
   */
  async updateAssignmentStatus(req: Request, res: Response): Promise<void> {
    try {
      // Ensure user is authenticated
      const user = (req as any).user;
      if (!user?.userId) {
        ResponseHelper.forbidden(res, 'Authentication required');
        return;
      }

      // Get vendor profile
      const vendorProfile = await this.getVendorProfile(user.userId);
      if (!vendorProfile) {
        ResponseHelper.forbidden(res, 'Vendor profile required');
        return;
      }

      // Validate assignment ID
      const paramValidation = validateSchema(assignmentIdSchema, req.params);
      if (!paramValidation.success) {
        ResponseHelper.validationError(res, paramValidation.errors);
        return;
      }

      const assignmentId = paramValidation.data.id;

      // Validate request body
      const bodyValidation = validateSchema(updateAssignmentStatusSchema, req.body);
      if (!bodyValidation.success) {
        ResponseHelper.validationError(res, bodyValidation.errors);
        return;
      }

      // Check vendor access to assignment
      const hasAccess = await assignmentService.validateVendorAccess(assignmentId, vendorProfile.id);
      if (!hasAccess) {
        ResponseHelper.notFound(res, 'Assignment not found');
        return;
      }

      // Update assignment status
      const result = await assignmentService.updateAssignmentStatus(
        assignmentId,
        vendorProfile.id,
        bodyValidation.data,
        user.userId
      );

      ResponseHelper.success(res, result);
    } catch (error) {
      logger.error('Update assignment status controller error', { 
        error, 
        userId: (req as any).user?.userId,
        assignmentId: req.params.id,
        body: req.body 
      });
      
      // Handle specific business logic errors
      if (error instanceof Error) {
        if (error.message.includes('already been processed')) {
          ResponseHelper.error(res, error.message, 400);
          return;
        }
        if (error.message.includes('Confirmed quantity')) {
          ResponseHelper.error(res, error.message, 400);
          return;
        }
        if (error.message.includes('not found')) {
          ResponseHelper.notFound(res, error.message);
          return;
        }
      }
      
      ResponseHelper.error(res, error instanceof Error ? error.message : 'Failed to update assignment status');
    }
  }
}

export const assignmentController = new AssignmentController();