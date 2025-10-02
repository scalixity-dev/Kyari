import { Request, Response } from 'express';
import { orderService } from './order.service';
import { 
  createOrderSchema, 
  orderQuerySchema, 
  orderIdSchema,
  validateSchema 
} from './order.validators';
import { ResponseHelper } from '../../utils/response';
import { logger } from '../../utils/logger';

export class OrderController {
  
  async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const validation = validateSchema(createOrderSchema, req.body);
      if (!validation.success) {
        ResponseHelper.validationError(res, validation.errors);
        return;
      }

      const createdById = req.user?.userId;
      if (!createdById) {
        ResponseHelper.unauthorized(res, 'Authentication required');
        return;
      }

      const result = await orderService.createOrder(validation.data, createdById);

      ResponseHelper.success(res, result, 'Order created successfully', 201);
    } catch (error) {
      logger.error('Order creation controller error', { error, body: req.body });
      ResponseHelper.error(res, error instanceof Error ? error.message : 'Failed to create order');
    }
  }

  async listOrders(req: Request, res: Response): Promise<void> {
    try {
      const validation = validateSchema(orderQuerySchema, req.query);
      if (!validation.success) {
        ResponseHelper.validationError(res, validation.errors);
        return;
      }

      const result = await orderService.listOrders(validation.data);

      ResponseHelper.success(res, {
        orders: result.orders,
        pagination: {
          page: validation.data.page || 1,
          limit: validation.data.limit || 10,
          total: result.total,
          pages: Math.ceil(result.total / (validation.data.limit || 10))
        }
      });
    } catch (error) {
      logger.error('Order list controller error', { error, query: req.query });
      ResponseHelper.error(res, error instanceof Error ? error.message : 'Failed to list orders');
    }
  }

  async getOrderById(req: Request, res: Response): Promise<void> {
    try {
      const validation = validateSchema(orderIdSchema, req.params);
      if (!validation.success) {
        ResponseHelper.validationError(res, validation.errors);
        return;
      }

      const result = await orderService.getOrderById(validation.data.id);

      ResponseHelper.success(res, result);
    } catch (error) {
      logger.error('Get order controller error', { error, orderId: req.params.id });
      
      if (error instanceof Error && error.message === 'Order not found') {
        ResponseHelper.notFound(res, 'Order not found');
        return;
      }
      
      ResponseHelper.error(res, error instanceof Error ? error.message : 'Failed to get order');
    }
  }

  // Future endpoints for order management
  async updateOrderStatus(req: Request, res: Response): Promise<void> {
    try {
      // TODO: Implement order status updates
      ResponseHelper.error(res, 'Order status update not implemented yet', 501);
    } catch (error) {
      logger.error('Update order status controller error', { error });
      ResponseHelper.internalError(res, 'Failed to update order status');
    }
  }

  async cancelOrder(req: Request, res: Response): Promise<void> {
    try {
      // TODO: Implement order cancellation
      ResponseHelper.error(res, 'Order cancellation not implemented yet', 501);
    } catch (error) {
      logger.error('Cancel order controller error', { error });
      ResponseHelper.internalError(res, 'Failed to cancel order');
    }
  }
}

export const orderController = new OrderController();