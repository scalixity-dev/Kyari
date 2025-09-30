import { Router } from 'express';
import { adminController } from './admin.controller';
import { authenticate, requireRole } from '../../middlewares/auth.middleware';
import { APP_CONSTANTS } from '../../config/constants';

const router = Router();

// All admin routes require authentication and ADMIN role
router.use(authenticate);
router.use(requireRole([APP_CONSTANTS.ROLES.ADMIN]));

// User management
router.post('/users', adminController.createUser.bind(adminController));
router.get('/users', adminController.listUsers.bind(adminController));
router.get('/users/:userId', adminController.getUserDetails.bind(adminController));

// Vendor management
router.put('/vendors/:userId/approve', adminController.approveVendor.bind(adminController));
router.put('/vendors/:userId/suspend', adminController.suspendVendor.bind(adminController));

export { router as adminRoutes };