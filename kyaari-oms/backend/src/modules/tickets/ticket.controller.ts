import { Request, Response } from 'express';
import { z } from 'zod';
import { TicketService } from './ticket.service';
import { logger } from '../../utils/logger';

const listSchema = z.object({
  status: z.enum(['open', 'under-review', 'resolved', 'closed', 'all']).optional(),
  vendor: z.string().optional(),
  orderNumber: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
});

const trendsSchema = z.object({
  period: z.enum(['weekly', 'monthly', 'yearly']),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

const resolutionTimeTrendsSchema = z.object({
  period: z.enum(['weekly', 'monthly', 'yearly']),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export class TicketController {
  static async listMyTickets(req: Request, res: Response) {
    try {
      const userId = req.user?.userId as string;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'User authentication required' });
      }

      const parse = listSchema.safeParse(req.query);
      if (!parse.success) {
        return res.status(400).json({ success: false, error: 'Invalid query params', details: parse.error.errors });
      }

      const result = await TicketService.listTicketsByUser(userId, parse.data);
      return res.json({ success: true, data: result });
    } catch (error: any) {
      logger.error('Failed to list tickets', { error: error.message });
      return res.status(500).json({ success: false, error: 'Failed to fetch tickets' });
    }
  }

  static async updateStatus(req: Request, res: Response) {
    const schema = z.object({
      status: z.enum(['open', 'under-review', 'resolved', 'closed']),
    });

    try {
      const userId = req.user?.userId as string;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'User authentication required' });
      }

      const parse = schema.safeParse(req.body);
      if (!parse.success) {
        return res.status(400).json({ success: false, error: 'Invalid body', details: parse.error.errors });
      }

      const ticketId = req.params.ticketId as string;
      const updated = await TicketService.updateStatus(ticketId, parse.data.status, userId);
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Ticket not found' });
      }

      return res.json({ success: true, data: updated });
    } catch (error: any) {
      const message = error?.message === 'Ticket not found' || error?.message === 'Invalid status' ? error.message : 'Failed to update ticket status';
      logger.error('Failed to update ticket status', { error: error?.message });
      const status = error?.message === 'Ticket not found' ? 404 : 500;
      return res.status(status).json({ success: false, error: message });
    }
  }

  static async getTrends(req: Request, res: Response) {
    try {
      const userId = req.user?.userId as string | undefined;
      
      const parse = trendsSchema.safeParse(req.query);
      if (!parse.success) {
        return res.status(400).json({ success: false, error: 'Invalid query params', details: parse.error.errors });
      }

      const result = await TicketService.getTicketTrends({
        period: parse.data.period,
        dateFrom: parse.data.dateFrom,
        dateTo: parse.data.dateTo,
        userId,
      });

      return res.json({ success: true, data: result });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch ticket trends';
      logger.error('Failed to fetch ticket trends', { error: errorMessage });
      return res.status(500).json({ success: false, error: 'Failed to fetch ticket trends' });
    }
  }

  static async getResolutionTimeTrends(req: Request, res: Response) {
    try {
      const userId = req.user?.userId as string | undefined;
      
      const parse = resolutionTimeTrendsSchema.safeParse(req.query);
      if (!parse.success) {
        return res.status(400).json({ success: false, error: 'Invalid query params', details: parse.error.errors });
      }

      const result = await TicketService.getResolutionTimeTrends({
        period: parse.data.period,
        dateFrom: parse.data.dateFrom,
        dateTo: parse.data.dateTo,
        userId,
      });

      return res.json({ success: true, data: result });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch resolution time trends';
      logger.error('Failed to fetch resolution time trends', { error: errorMessage });
      return res.status(500).json({ success: false, error: 'Failed to fetch resolution time trends' });
    }
  }
}


