import { Router } from 'express';
import { assignmentController } from './assignment.controller';
import { accountsAssignmentController } from './accounts-assignment.controller';
import { authenticate, requireRole } from '../../middlewares/auth.middleware';
import { APP_CONSTANTS } from '../../config/constants';

const router = Router();

// All assignment routes require authentication
router.use(authenticate);

// Accounts team routes - for viewing confirmed vendor orders
router.get('/accounts/vendor-orders', 
  requireRole([APP_CONSTANTS.ROLES.ACCOUNTS, APP_CONSTANTS.ROLES.ADMIN]),
  accountsAssignmentController.getConfirmedVendorOrders.bind(accountsAssignmentController)
);

router.get('/accounts/vendor-orders/:id', 
  requireRole([APP_CONSTANTS.ROLES.ACCOUNTS, APP_CONSTANTS.ROLES.ADMIN]),
  accountsAssignmentController.getVendorOrderById.bind(accountsAssignmentController)
);

// Vendor routes - for managing their assignments
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