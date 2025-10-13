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
import { excelService } from '../../services/excel.service';

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

  async updateOrder(req: Request, res: Response): Promise<void> {
    try {
      const orderIdValidation = validateSchema(orderIdSchema, req.params);
      if (!orderIdValidation.success) {
        ResponseHelper.validationError(res, orderIdValidation.errors);
        return;
      }

      const bodyValidation = validateSchema(createOrderSchema, req.body);
      if (!bodyValidation.success) {
        ResponseHelper.validationError(res, bodyValidation.errors);
        return;
      }

      const userId = req.user?.userId;
      if (!userId) {
        ResponseHelper.unauthorized(res, 'Authentication required');
        return;
      }

      const result = await orderService.updateOrder(orderIdValidation.data.id, bodyValidation.data, userId);

      ResponseHelper.success(res, result, 'Order updated successfully');
    } catch (error) {
      logger.error('Order update controller error', { error, orderId: req.params.id });
      
      if (error instanceof Error && error.message.includes('cannot be updated')) {
        ResponseHelper.error(res, error.message, 400);
        return;
      }
      
      ResponseHelper.error(res, error instanceof Error ? error.message : 'Failed to update order');
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

  async deleteOrder(req: Request, res: Response): Promise<void> {
    try {
      const validation = validateSchema(orderIdSchema, req.params);
      if (!validation.success) {
        ResponseHelper.validationError(res, validation.errors);
        return;
      }

      const userId = req.user?.userId;
      if (!userId) {
        ResponseHelper.unauthorized(res, 'Authentication required');
        return;
      }

      await orderService.deleteOrder(validation.data.id, userId);

      ResponseHelper.success(res, null, 'Order deleted successfully');
    } catch (error) {
      logger.error('Delete order controller error', { error, orderId: req.params.id });
      
      if (error instanceof Error) {
        if (error.message === 'Order not found') {
          ResponseHelper.notFound(res, 'Order not found');
          return;
        }
        if (error.message.includes('cannot be deleted')) {
          ResponseHelper.error(res, error.message, 400);
          return;
        }
      }
      
      ResponseHelper.error(res, error instanceof Error ? error.message : 'Failed to delete order');
    }
  }

  async assignVendor(req: Request, res: Response): Promise<void> {
    try {
      const validation = validateSchema(orderIdSchema, req.params);
      if (!validation.success) {
        ResponseHelper.validationError(res, validation.errors);
        return;
      }

      const { vendorId } = req.body;
      if (!vendorId) {
        ResponseHelper.error(res, 'Vendor ID is required', 400);
        return;
      }

      const userId = req.user?.userId;
      if (!userId) {
        ResponseHelper.unauthorized(res, 'Authentication required');
        return;
      }

      const result = await orderService.assignVendorToOrder(validation.data.id, vendorId, userId);

      ResponseHelper.success(res, result, 'Vendor assigned successfully');
    } catch (error) {
      logger.error('Assign vendor controller error', { error, orderId: req.params.id });
      
      if (error instanceof Error) {
        if (error.message === 'Order not found' || error.message.includes('not found')) {
          ResponseHelper.notFound(res, error.message);
          return;
        }
        if (error.message.includes('not active') || error.message.includes('not verified')) {
          ResponseHelper.error(res, error.message, 400);
          return;
        }
      }
      
      ResponseHelper.error(res, error instanceof Error ? error.message : 'Failed to assign vendor');
    }
  }

  async uploadOrdersExcel(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        ResponseHelper.error(res, 'No file uploaded', 400);
        return;
      }

      const userId = req.user?.userId;
      if (!userId) {
        ResponseHelper.unauthorized(res, 'Authentication required');
        return;
      }

      // Validate file type
      const allowedMimeTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];

      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        ResponseHelper.error(res, 'Invalid file type. Please upload an Excel file (.xls or .xlsx)', 400);
        return;
      }

      // Parse Excel file
      const parsedOrders = excelService.parseOrdersExcel(req.file.buffer);

      if (parsedOrders.length === 0) {
        ResponseHelper.error(res, 'No valid orders found in Excel file', 400);
        return;
      }

      // Create orders
      const result = await orderService.createOrdersFromExcel(parsedOrders, userId);

      ResponseHelper.success(res, result, `Successfully created ${result.successCount} orders`, 201);
    } catch (error) {
      logger.error('Excel upload controller error', { error });
      
      if (error instanceof Error) {
        if (error.message.includes('Missing required columns') || 
            error.message.includes('must be') ||
            error.message.includes('Row ')) {
          ResponseHelper.error(res, error.message, 400);
          return;
        }
      }
      
      ResponseHelper.error(res, error instanceof Error ? error.message : 'Failed to upload orders');
    }
  }

  async downloadExcelTemplate(req: Request, res: Response): Promise<void> {
    try {
      const templateBuffer = excelService.generateSampleTemplate();

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=order_template.xlsx');
      res.send(templateBuffer);
    } catch (error) {
      logger.error('Download template controller error', { error });
      ResponseHelper.error(res, error instanceof Error ? error.message : 'Failed to generate template');
    }
  }
}

export const orderController = new OrderController();