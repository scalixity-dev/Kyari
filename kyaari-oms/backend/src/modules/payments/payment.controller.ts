import { Request, Response } from 'express';
import { z } from 'zod';
import { PaymentService } from './payment.service';
import { logger } from '../../utils/logger';

const listSchema = z.object({
  status: z.enum(['Pending', 'Released', 'Overdue']).optional(),
  deliveryVerified: z.enum(['Yes', 'No', 'Partial']).optional(),
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
});

const editAmountSchema = z.object({
  purchaseOrderId: z.string(),
  newAmount: z.coerce.number().positive(),
  reason: z.string().optional(),
});

const releaseSchema = z.object({
  purchaseOrderId: z.string(),
  referenceId: z.string().min(1),
});

const updateDeliveryStatusSchema = z.object({
  purchaseOrderId: z.string(),
  deliveryStatus: z.enum(['Yes', 'No', 'Partial']),
});

export class PaymentController {
  static async list(req: Request, res: Response) {
    try {
      const parse = listSchema.safeParse(req.query);
      if (!parse.success) {
        return res.status(400).json({ success: false, error: 'Invalid query', details: parse.error.errors });
      }
      const data = await PaymentService.listPayments(parse.data);
      return res.json({ success: true, data });
    } catch (error: any) {
      logger.error('Failed to list payments', { error: error.message });
      return res.status(500).json({ success: false, error: 'Failed to fetch payments' });
    }
  }

  static async aging(req: Request, res: Response) {
    try {
      const vendorIdsParam = (req.query.vendors as string | undefined) || '';
      const vendorIds = vendorIdsParam
        ? vendorIdsParam.split(',').map((v) => v.trim()).filter((v) => v.length > 0)
        : undefined;
      const data = await PaymentService.getVendorsPaymentAging(vendorIds);
      return res.json({ success: true, data });
    } catch (error: any) {
      logger.error('Failed to fetch payment aging', { error: error.message });
      return res.status(500).json({ success: false, error: 'Failed to fetch payment aging' });
    }
  }

  static async compliance(req: Request, res: Response) {
    try {
      const vendorIdsParam = (req.query.vendors as string | undefined) || '';
      const vendorIds = vendorIdsParam
        ? vendorIdsParam.split(',').map((v) => v.trim()).filter((v) => v.length > 0)
        : undefined;
      const data = await PaymentService.getInvoiceCompliance(vendorIds);
      return res.json({ success: true, data });
    } catch (error: any) {
      logger.error('Failed to fetch invoice compliance', { error: error.message });
      return res.status(500).json({ success: false, error: 'Failed to fetch invoice compliance' });
    }
  }

  static async slaBreaches(_req: Request, res: Response) {
    try {
      const data = await PaymentService.getSlaBreaches();
      return res.json({ success: true, data });
    } catch (error: any) {
      logger.error('Failed to fetch SLA breaches', { error: error.message });
      return res.status(500).json({ success: false, error: 'Failed to fetch SLA breaches' });
    }
  }

  static async trends(req: Request, res: Response) {
    try {
      const granularityParam = (req.query.granularity as string | undefined) || 'weekly';
      const periodsParam = req.query.periods as string | undefined;
      const granularity = ['weekly', 'monthly', 'yearly'].includes(granularityParam) ? granularityParam as 'weekly' | 'monthly' | 'yearly' : 'weekly';
      const periods = periodsParam ? Math.max(1, Math.min(12, parseInt(periodsParam))) : (granularity === 'yearly' ? 4 : 4);
      const data = await PaymentService.getPaymentTrends(granularity, periods);
      return res.json({ success: true, data });
    } catch (error: any) {
      logger.error('Failed to fetch payment trends', { error: error.message });
      return res.status(500).json({ success: false, error: 'Failed to fetch payment trends' });
    }
  }

  static async summary(req: Request, res: Response) {
    try {
      const granularityParam = (req.query.granularity as string | undefined) || 'weekly';
      const granularity = ['weekly', 'monthly', 'yearly'].includes(granularityParam) ? granularityParam as 'weekly' | 'monthly' | 'yearly' : 'weekly';
      const data = await PaymentService.getPaymentSummary(granularity);
      return res.json({ success: true, data });
    } catch (error: any) {
      logger.error('Failed to fetch payment summary', { error: error.message });
      return res.status(500).json({ success: false, error: 'Failed to fetch payment summary' });
    }
  }
  static async editAmount(req: Request, res: Response) {
    try {
      const parse = editAmountSchema.safeParse(req.body);
      if (!parse.success) {
        return res.status(400).json({ success: false, error: 'Invalid input', details: parse.error.errors });
      }
      const { purchaseOrderId, newAmount } = parse.data;
      const updated = await PaymentService.editInvoiceAmount(purchaseOrderId, newAmount);
      if (!updated) return res.status(404).json({ success: false, error: 'Invoice not found for PO' });
      return res.json({ success: true, data: updated });
    } catch (error: any) {
      logger.error('Failed to edit invoice amount', { error: error.message });
      return res.status(500).json({ success: false, error: 'Failed to edit amount' });
    }
  }

  static async release(req: Request, res: Response) {
    try {
      const parse = releaseSchema.safeParse(req.body);
      if (!parse.success) {
        return res.status(400).json({ success: false, error: 'Invalid input', details: parse.error.errors });
      }
      const { purchaseOrderId, referenceId } = parse.data;
      const processedById = req.user?.userId || 'unknown';
      const payment = await PaymentService.releasePayment(purchaseOrderId, referenceId, processedById);
      if (!payment) return res.status(404).json({ success: false, error: 'Purchase order not found' });
      return res.json({ success: true, data: payment });
    } catch (error: any) {
      logger.error('Failed to release payment', { error: error.message });
      return res.status(500).json({ success: false, error: 'Failed to release payment' });
    }
  }

  static async updateDeliveryStatus(req: Request, res: Response) {
    try {
      const parse = updateDeliveryStatusSchema.safeParse(req.body);
      if (!parse.success) {
        return res.status(400).json({ success: false, error: 'Invalid input', details: parse.error.errors });
      }
      const { purchaseOrderId, deliveryStatus } = parse.data;
      const updated = await PaymentService.updateDeliveryStatus(purchaseOrderId, deliveryStatus);
      if (!updated) return res.status(404).json({ success: false, error: 'Purchase order not found' });
      return res.json({ success: true, data: updated });
    } catch (error: any) {
      logger.error('Failed to update delivery status', { error: error.message });
      return res.status(500).json({ success: false, error: 'Failed to update delivery status' });
    }
  }
}


