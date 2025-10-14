import { Router } from 'express';
import { assignmentController } from './assignment.controller';
import { accountsAssignmentController } from './accounts-assignment.controller';
import { authenticate, requireRole } from '../../middlewares/auth.middleware';
import { userCache, invalidateCache } from '../../middlewares/cache.middleware';
import { APP_CONSTANTS } from '../../config/constants';

const router = Router();

// All assignment routes require authentication
router.use(authenticate);

// Accounts team routes - for viewing confirmed vendor orders (cached for 3 minutes)
router.get('/accounts/vendor-orders', 
  requireRole([APP_CONSTANTS.ROLES.ACCOUNTS, APP_CONSTANTS.ROLES.ADMIN]),
  userCache(180),
  accountsAssignmentController.getConfirmedVendorOrders.bind(accountsAssignmentController)
);

router.get('/accounts/vendor-orders/:id', 
  requireRole([APP_CONSTANTS.ROLES.ACCOUNTS, APP_CONSTANTS.ROLES.ADMIN]),
  userCache(300),
  accountsAssignmentController.getVendorOrderById.bind(accountsAssignmentController)
);

// Vendor routes - for managing their assignments
router.use(requireRole([APP_CONSTANTS.ROLES.VENDOR]));

// GET /assignments/my - Get vendor's assignments (cached for 2 minutes)
router.get('/my', 
  userCache(120),
  assignmentController.getMyAssignments.bind(assignmentController)
);

// GET /assignments/:id - Get assignment details (cached for 5 minutes)
router.get('/:id', 
  userCache(300),
  assignmentController.getAssignmentDetails.bind(assignmentController)
);

// PATCH /assignments/:id/status - Update assignment status and invalidate caches
router.patch('/:id/status', 
  invalidateCache(['user:*:/api/assignments/*', 'user:*:/api/accounts/vendor-orders*']),
  assignmentController.updateAssignmentStatus.bind(assignmentController)
);

export { router as assignmentRoutes };