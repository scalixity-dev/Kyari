import { Request, Response } from 'express';
import { ResponseHelper } from '../../utils/response';
import { logger } from '../../utils/logger';
import { orderTrackingService } from './order-tracking.service';
import { 
  OrderTrackingQueryRequest, 
  OrderStatusUpdateRequest 
} from './order-tracking.dto';

export class OrderTrackingController {
  
  /**
   * GET /api/order-tracking
   * Get order tracking data with filters and pagination
   */
  static async getOrderTracking(req: Request, res: Response): Promise<void> {
    try {
      // Extract user information from authenticated request
      if (!req.user) {
        ResponseHelper.unauthorized(res, 'Authentication required');
        return;
      }

      const { userId, roles } = req.user;
      const query: OrderTrackingQueryRequest = (req as any).validatedQuery || req.query;

      logger.info('Order tracking request initiated', {
        userId,
        roles,
        query
      });

      // Get order tracking data
      const result = await orderTrackingService.getOrderTracking(query);

      logger.info('Order tracking request completed', {
        userId,
        totalOrders: result.data.total,
        page: result.data.page,
        limit: result.data.limit
      });

      ResponseHelper.success(res, result.data, result.message);

    } catch (error) {
      logger.error('Order tracking request failed', {
        error: error instanceof Error ? error.message : error,
        userId: req.user?.userId,
        query: req.query
      });

      ResponseHelper.error(res, 'Failed to retrieve order tracking data', 500);
    }
  }

  /**
   * GET /api/order-tracking/summary
   * Get order tracking summary with status counts
   */
  static async getOrderTrackingSummary(req: Request, res: Response): Promise<void> {
    try {
      // Extract user information from authenticated request
      if (!req.user) {
        ResponseHelper.unauthorized(res, 'Authentication required');
        return;
      }

      const { userId, roles } = req.user;

      logger.info('Order tracking summary request initiated', {
        userId,
        roles
      });

      // Get order tracking summary
      const summary = await orderTrackingService.getOrderTrackingSummary();

      logger.info('Order tracking summary request completed', {
        userId,
        totalOrders: summary.totalOrders
      });

      ResponseHelper.success(res, {
        success: true,
        data: summary,
        message: 'Order tracking summary retrieved successfully'
      });

    } catch (error) {
      logger.error('Order tracking summary request failed', {
        error: error instanceof Error ? error.message : error,
        userId: req.user?.userId
      });

      ResponseHelper.error(res, 'Failed to retrieve order tracking summary', 500);
    }
  }

  /**
   * GET /api/order-tracking/:id
   * Get specific order tracking details
   */
  static async getOrderById(req: Request, res: Response): Promise<void> {
    try {
      // Extract user information from authenticated request
      if (!req.user) {
        ResponseHelper.unauthorized(res, 'Authentication required');
        return;
      }

      const { userId, roles } = req.user;
      const { id } = req.params;

      logger.info('Order details request initiated', {
        userId,
        roles,
        orderId: id
      });

      // Get order details
      const order = await orderTrackingService.getOrderById(id);

      if (!order) {
        ResponseHelper.notFound(res, 'Order not found');
        return;
      }

      logger.info('Order details request completed', {
        userId,
        orderId: id
      });

      ResponseHelper.success(res, {
        success: true,
        data: order,
        message: 'Order details retrieved successfully'
      });

    } catch (error) {
      logger.error('Order details request failed', {
        error: error instanceof Error ? error.message : error,
        userId: req.user?.userId,
        orderId: req.params.id
      });

      ResponseHelper.error(res, 'Failed to retrieve order details', 500);
    }
  }

  /**
   * PUT /api/order-tracking/:id/status
   * Update order status (for drag and drop functionality)
   */
  static async updateOrderStatus(req: Request, res: Response): Promise<void> {
    try {
      // Extract user information from authenticated request
      if (!req.user) {
        ResponseHelper.unauthorized(res, 'Authentication required');
        return;
      }

      const { userId, roles } = req.user;
      const { id } = req.params;
      const updateData: OrderStatusUpdateRequest = (req as any).validatedBody || req.body;

      // Validate that the order item ID matches the URL parameter
      if (updateData.orderItemId !== id) {
        ResponseHelper.error(res, 'Order item ID mismatch', 400);
        return;
      }

      logger.info('Order status update request initiated', {
        userId,
        roles,
        orderItemId: id,
        newStatus: updateData.newStatus,
        remarks: updateData.remarks
      });

      // Update order status
      const updatedOrder = await orderTrackingService.updateOrderStatus(
        updateData,
        userId
      );

      logger.info('Order status update request completed', {
        userId,
        orderItemId: id,
        newStatus: updateData.newStatus
      });

      ResponseHelper.success(res, {
        success: true,
        data: updatedOrder,
        message: 'Order status updated successfully'
      });

    } catch (error) {
      logger.error('Order status update request failed', {
        error: error instanceof Error ? error.message : error,
        userId: req.user?.userId,
        orderItemId: req.params.id,
        updateData: req.body
      });

      if (error instanceof Error && error.message === 'Order item not found') {
        ResponseHelper.notFound(res, 'Order item not found');
        return;
      }

      ResponseHelper.error(res, 'Failed to update order status', 500);
    }
  }

  /**
   * GET /api/order-tracking/export/csv
   * Export order tracking data as CSV
   */
  static async exportToCSV(req: Request, res: Response): Promise<void> {
    try {
      // Extract user information from authenticated request
      if (!req.user) {
        ResponseHelper.unauthorized(res, 'Authentication required');
        return;
      }

      const { userId, roles } = req.user;
      const query: OrderTrackingQueryRequest = (req as any).validatedQuery || req.query;

      logger.info('Order tracking CSV export request initiated', {
        userId,
        roles,
        query
      });

      // Get all orders (no pagination for export)
      const exportQuery = { ...query, limit: 10000, page: 1 };
      const result = await orderTrackingService.getOrderTracking(exportQuery);

      // Generate CSV content
      const csvHeaders = [
        'Order ID',
        'Order Number',
        'Client Order ID',
        'Product Name',
        'SKU',
        'Quantity',
        'Price Per Unit',
        'Total Price',
        'Vendor',
        'Status',
        'Assigned Quantity',
        'Confirmed Quantity',
        'Vendor Remarks',
        'Assigned At',
        'Vendor Action At',
        'Created At',
        'Updated At'
      ];

      const csvRows = result.data.orders.map(order => [
        order.id,
        order.orderNumber,
        order.clientOrderId,
        `"${order.productName}"`,
        order.sku || '',
        order.quantity,
        order.pricePerUnit || '',
        order.totalPrice || '',
        `"${order.vendor.companyName}"`,
        order.status,
        order.assignedQuantity || '',
        order.confirmedQuantity || '',
        `"${order.vendorRemarks || ''}"`,
        order.assignedAt?.toString() || '',
        order.vendorActionAt?.toString() || '',
        order.createdAt.toString(),
        order.updatedAt.toString()
      ]);

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.join(','))
      ].join('\n');

      // Set response headers for CSV download
      const filename = `order-tracking-${new Date().toISOString().split('T')[0]}.csv`;
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      logger.info('Order tracking CSV export request completed', {
        userId,
        totalOrders: result.data.total,
        filename
      });

      res.send(csvContent);

    } catch (error) {
      logger.error('Order tracking CSV export request failed', {
        error: error instanceof Error ? error.message : error,
        userId: req.user?.userId,
        query: req.query
      });

      ResponseHelper.error(res, 'Failed to export order tracking data', 500);
    }
  }

  /**
   * GET /api/order-tracking/export/pdf
   * Export order tracking data as PDF (simplified text format)
   */
  static async exportToPDF(req: Request, res: Response): Promise<void> {
    try {
      // Extract user information from authenticated request
      if (!req.user) {
        ResponseHelper.unauthorized(res, 'Authentication required');
        return;
      }

      const { userId, roles } = req.user;
      const query: OrderTrackingQueryRequest = (req as any).validatedQuery || req.query;

      logger.info('Order tracking PDF export request initiated', {
        userId,
        roles,
        query
      });

      // Get all orders (no pagination for export)
      const exportQuery = { ...query, limit: 10000, page: 1 };
      const result = await orderTrackingService.getOrderTracking(exportQuery);

      // Generate PDF content (simplified text format)
      const pdfContent = [
        'ORDER TRACKING REPORT',
        `Generated on: ${new Date().toLocaleString()}`,
        `Total Orders: ${result.data.total}`,
        '',
        'ORDER DETAILS:',
        '='.repeat(80),
        ...result.data.orders.map(order => [
          `Order ID: ${order.id}`,
          `Order Number: ${order.orderNumber}`,
          `Product: ${order.productName}`,
          `Vendor: ${order.vendor.companyName}`,
          `Quantity: ${order.quantity}`,
          `Status: ${order.status}`,
          `Created: ${order.createdAt.toLocaleString()}`,
          '-'.repeat(40)
        ].join('\n'))
      ].join('\n');

      // Set response headers for PDF download
      const filename = `order-tracking-${new Date().toISOString().split('T')[0]}.txt`;
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      logger.info('Order tracking PDF export request completed', {
        userId,
        totalOrders: result.data.total,
        filename
      });

      res.send(pdfContent);

    } catch (error) {
      logger.error('Order tracking PDF export request failed', {
        error: error instanceof Error ? error.message : error,
        userId: req.user?.userId,
        query: req.query
      });

      ResponseHelper.error(res, 'Failed to export order tracking data', 500);
    }
  }
}
