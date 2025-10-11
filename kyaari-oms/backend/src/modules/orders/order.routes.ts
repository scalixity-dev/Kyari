import { Router } from 'express';
import { orderController } from './order.controller';
import { authenticate, requireRole } from '../../middlewares/auth.middleware';
import { APP_CONSTANTS } from '../../config/constants';

const router = Router();

// All order routes require authentication
router.use(authenticate);

// Order creation and management - ADMIN only
router.post('/', 
  requireRole([APP_CONSTANTS.ROLES.ADMIN]), 
  orderController.createOrder.bind(orderController)
);

// Order listing - ADMIN and OPS can view orders
router.get('/', 
  requireRole([APP_CONSTANTS.ROLES.ADMIN, APP_CONSTANTS.ROLES.OPS]), 
  orderController.listOrders.bind(orderController)
);

// Order details - ADMIN and OPS can view order details
router.get('/:id', 
  requireRole([APP_CONSTANTS.ROLES.ADMIN, APP_CONSTANTS.ROLES.OPS]), 
  orderController.getOrderById.bind(orderController)
);

// Future endpoints for order management
router.put('/:id/status', 
  requireRole([APP_CONSTANTS.ROLES.ADMIN, APP_CONSTANTS.ROLES.OPS]), 
  orderController.updateOrderStatus.bind(orderController)
);

router.put('/:id/cancel', 
  requireRole([APP_CONSTANTS.ROLES.ADMIN]), 
  orderController.cancelOrder.bind(orderController)
);

// Delete order - ADMIN only (only if not assigned)
router.delete('/:id', 
  requireRole([APP_CONSTANTS.ROLES.ADMIN]), 
  orderController.deleteOrder.bind(orderController)
);

// Assign vendor to order - ADMIN only
router.put('/:id/assign-vendor', 
  requireRole([APP_CONSTANTS.ROLES.ADMIN]), 
  orderController.assignVendor.bind(orderController)
);

export { router as orderRoutes };