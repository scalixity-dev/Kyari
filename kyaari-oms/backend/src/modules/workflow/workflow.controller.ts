import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { WorkflowOrchestrationService } from './workflow.service';
import { logger } from '../../utils/logger';

const prisma = new PrismaClient();
const workflowService = new WorkflowOrchestrationService(prisma);

export class WorkflowController {
  
  /**
   * Initiate order to PO workflow
   */
  async initiateOrderToPO(req: Request, res: Response) {
    try {
      const { orderId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User authentication required'
        });
      }

      const result = await workflowService.initiateOrderToPOWorkflow(orderId, userId);
      
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Error in initiateOrderToPO', { error });
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Initiate invoice to payment workflow
   */
  async initiateInvoiceToPayment(req: Request, res: Response) {
    try {
      const { invoiceId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User authentication required'
        });
      }

      const result = await workflowService.initiateInvoiceToPaymentWorkflow(invoiceId, userId);
      
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Error in initiateInvoiceToPayment', { error });
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Initiate dispatch to GRN workflow
   */
  async initiateDispatchToGRN(req: Request, res: Response) {
    try {
      const { dispatchId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User authentication required'
        });
      }

      const result = await workflowService.initiateDispatchToGRNWorkflow(dispatchId, userId);
      
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Error in initiateDispatchToGRN', { error });
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Complete order workflow
   */
  async completeOrder(req: Request, res: Response) {
    try {
      const { orderId } = req.params;

      const result = await workflowService.completeOrderWorkflow(orderId);
      
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Error in completeOrder', { error });
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get order workflow status
   */
  async getOrderWorkflowStatus(req: Request, res: Response) {
    try {
      const { orderId } = req.params;

      const workflow = await workflowService.getOrderWorkflowStatus(orderId);
      
      return res.json({
        success: true,
        data: workflow
      });
    } catch (error) {
      logger.error('Error in getOrderWorkflowStatus', { error });
      return res.status(500).json({
        success: false,
        error: 'Failed to get workflow status'
      });
    }
  }

  /**
   * Get workflow summary for dashboard
   */
  async getWorkflowSummary(req: Request, res: Response) {
    try {
      const summary = await prisma.$transaction(async (tx) => {
        const [
          pendingOrders,
          processingOrders,
          pendingPOs,
          pendingInvoices,
          pendingPayments,
          pendingGRNs,
          openTickets
        ] = await Promise.all([
          tx.order.count({ where: { status: 'RECEIVED' } }),
          tx.order.count({ where: { status: 'PROCESSING' } }),
          tx.purchaseOrder.count({ where: { status: 'DRAFT' } }),
          tx.vendorInvoice.count({ where: { status: 'PENDING_VERIFICATION' } }),
          tx.payment.count({ where: { status: 'PENDING' } }),
          tx.goodsReceiptNote.count({ where: { status: 'PENDING_VERIFICATION' } }),
          tx.ticket.count({ where: { status: 'OPEN' } })
        ]);

        return {
          orders: {
            pending: pendingOrders,
            processing: processingOrders
          },
          purchaseOrders: {
            pending: pendingPOs
          },
          invoices: {
            pendingVerification: pendingInvoices
          },
          payments: {
            pending: pendingPayments
          },
          grns: {
            pendingVerification: pendingGRNs
          },
          tickets: {
            open: openTickets
          }
        };
      });

      return res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      logger.error('Error in getWorkflowSummary', { error });
      return res.status(500).json({
        success: false,
        error: 'Failed to get workflow summary'
      });
    }
  }
}

export const workflowController = new WorkflowController();