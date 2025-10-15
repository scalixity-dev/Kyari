import { Router } from 'express';
import { orderController } from './order.controller';
import { authenticate, requireRole } from '../../middlewares/auth.middleware';
import { upload } from '../../middlewares/upload.middleware';
import { userCache, invalidateCache } from '../../middlewares/cache.middleware';
import { APP_CONSTANTS } from '../../config/constants';

const router = Router();

// All order routes require authentication
router.use(authenticate);

// Order creation and management - ADMIN only
router.post('/', 
  requireRole([APP_CONSTANTS.ROLES.ADMIN]),
  invalidateCache(['api:*:/api/orders*']),
  orderController.createOrder.bind(orderController)
);

// Upload orders via Excel - ADMIN only (must be before /:id routes)
router.post('/upload-excel', 
  requireRole([APP_CONSTANTS.ROLES.ADMIN]),
  upload.single('file'),
  invalidateCache(['api:*:/api/orders*']),
  orderController.uploadOrdersExcel.bind(orderController)
);

// Download Excel template - ADMIN only (must be before /:id routes)
router.get('/excel-template', 
  requireRole([APP_CONSTANTS.ROLES.ADMIN]),
  orderController.downloadExcelTemplate.bind(orderController)
);

// Order listing - ADMIN and OPS can view orders (cached for 2 minutes)
router.get('/', 
  requireRole([APP_CONSTANTS.ROLES.ADMIN, APP_CONSTANTS.ROLES.OPS]),
  userCache(120),
  orderController.listOrders.bind(orderController)
);

// Order details - ADMIN and OPS can view order details (cached for 5 minutes)
router.get('/:id', 
  requireRole([APP_CONSTANTS.ROLES.ADMIN, APP_CONSTANTS.ROLES.OPS]),
  userCache(300),
  orderController.getOrderById.bind(orderController)
);

// Update order - ADMIN only (only if RECEIVED status)
router.put('/:id', 
  requireRole([APP_CONSTANTS.ROLES.ADMIN]),
  invalidateCache(['api:*:/api/orders*']),
  orderController.updateOrder.bind(orderController)
);

// Future endpoints for order management
router.put('/:id/status', 
  requireRole([APP_CONSTANTS.ROLES.ADMIN, APP_CONSTANTS.ROLES.OPS]),
  invalidateCache(['api:*:/api/orders*']),
  orderController.updateOrderStatus.bind(orderController)
);

router.put('/:id/cancel', 
  requireRole([APP_CONSTANTS.ROLES.ADMIN]),
  invalidateCache(['api:*:/api/orders*']),
  orderController.cancelOrder.bind(orderController)
);

// Delete order - ADMIN only (only if not assigned)
router.delete('/:id', 
  requireRole([APP_CONSTANTS.ROLES.ADMIN]),
  invalidateCache(['api:*:/api/orders*']),
  orderController.deleteOrder.bind(orderController)
);

// Assign vendor to order - ADMIN only
router.put('/:id/assign-vendor', 
  requireRole([APP_CONSTANTS.ROLES.ADMIN]),
  invalidateCache(['api:*:/api/orders*', 'user:*:/api/assignments/*']),
  orderController.assignVendor.bind(orderController)
);

export { router as orderRoutes };