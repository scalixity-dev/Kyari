import { Request, Response } from 'express';
import { z } from 'zod';
import { TicketCommentsService } from './ticket-comments.service';
import { logger } from '../../utils/logger';

const createSchema = z.object({
  content: z.string().min(1, 'Content is required'),
});

const updateSchema = z.object({
  content: z.string().min(1, 'Content is required'),
});

export class TicketCommentsController {
  static async list(req: Request, res: Response) {
    try {
      const { ticketId } = req.params;
      const comments = await TicketCommentsService.listComments(ticketId);
      return res.json({ success: true, data: comments });
    } catch (error: any) {
      logger.error('Failed to list ticket comments', { error: error.message });
      return res.status(500).json({ success: false, error: 'Failed to fetch comments' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { ticketId } = req.params;
      const parse = createSchema.safeParse(req.body);
      if (!parse.success) {
        return res.status(400).json({ success: false, error: 'Invalid input', details: parse.error.errors });
      }
      const userId = req.user?.userId as string;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'User authentication required' });
      }
      const comment = await TicketCommentsService.createComment({
        ticketId,
        userId,
        content: parse.data.content,
      });
      return res.status(201).json({ success: true, data: comment });
    } catch (error: any) {
      logger.error('Failed to create ticket comment', { error: error.message });
      return res.status(500).json({ success: false, error: 'Failed to create comment' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { commentId } = req.params;
      const parse = updateSchema.safeParse(req.body);
      if (!parse.success) {
        return res.status(400).json({ success: false, error: 'Invalid input', details: parse.error.errors });
      }
      const userId = req.user?.userId as string;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'User authentication required' });
      }
      const updated = await TicketCommentsService.updateComment({
        commentId,
        userId,
        content: parse.data.content,
      });
      return res.json({ success: true, data: updated });
    } catch (error: any) {
      logger.error('Failed to update ticket comment', { error: error.message });
      return res.status(500).json({ success: false, error: 'Failed to update comment' });
    }
  }
}


