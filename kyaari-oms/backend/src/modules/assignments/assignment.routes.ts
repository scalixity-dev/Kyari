import { Router } from 'express';
import { assignmentController } from './assignment.controller';
import { authenticate, requireRole } from '../../middlewares/auth.middleware';
import { APP_CONSTANTS } from '../../config/constants';

const router = Router();

// All assignment routes require authentication and VENDOR role
router.use(authenticate);
router.use(requireRole([APP_CONSTANTS.ROLES.VENDOR]));

// GET /assignments/my - Get vendor's assignments
router.get('/my', 
  assignmentController.getMyAssignments.bind(assignmentController)
);

// GET /assignments/:id - Get assignment details
router.get('/:id', 
  assignmentController.getAssignmentDetails.bind(assignmentController)
);

// PATCH /assignments/:id/status - Update assignment status
router.patch('/:id/status', 
  assignmentController.updateAssignmentStatus.bind(assignmentController)
);

export { router as assignmentRoutes };