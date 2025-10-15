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
}


