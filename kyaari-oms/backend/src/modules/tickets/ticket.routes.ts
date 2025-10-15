import { Router } from 'express';
import { TicketCommentsController } from './ticket-comments.controller';
import { TicketController } from './ticket.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { TicketAttachmentsController } from './ticket-attachments.controller';
import { cacheService } from '../../services/cache.service';

const router = Router();

// Simple cache middleware for GET routes
const cacheResponse = (keyBuilder: (req: any) => string, ttlSeconds = 60) => {
  return async (req: any, res: any, next: any) => {
    try {
      const key = keyBuilder(req);
      const cached = await cacheService.get<any>(key);
      if (cached) {
        return res.json(cached);
      }
      const originalJson = res.json.bind(res);
      res.json = (body: any) => {
        cacheService.set(key, body, ttlSeconds).catch(() => {});
        return originalJson(body);
      };
      next();
    } catch (_e) {
      next();
    }
  };
};

// Invalidate helper for POST/PUT routes
const invalidatePatterns = (patternsBuilder: (req: any) => string[]) => {
  return async (req: any, _res: any, next: any) => {
    try {
      const patterns = patternsBuilder(req);
      await Promise.all(patterns.map((p) => cacheService.invalidate(p)));
    } catch (_e) {
      // no-op
    }
    next();
  };
};

// Tickets listing (raised by current user) with caching
router.get(
  '/',
  authenticate,
  cacheResponse((req) => `user:${req.user?.userId}:/api/tickets?${new URLSearchParams(req.query as any).toString()}`, 60),
  TicketController.listMyTickets
);

// Comments (cache + invalidation)
router.get(
  '/:ticketId/comments',
  authenticate,
  cacheResponse((req) => `user:${req.user?.userId}:/api/tickets/${req.params.ticketId}/comments`, 60),
  TicketCommentsController.list
);
router.post(
  '/:ticketId/comments',
  authenticate,
  invalidatePatterns((req) => [
    `user:${req.user?.userId}:/api/tickets*`,
    `user:${req.user?.userId}:/api/tickets/${req.params.ticketId}/comments*`,
  ]),
  TicketCommentsController.create
);
router.put(
  '/comments/:commentId',
  authenticate,
  invalidatePatterns((req) => [
    `user:${req.user?.userId}:/api/tickets*`,
    'user:*:/api/tickets/*/comments*',
  ]),
  TicketCommentsController.update
);

// Attachments (invalidate list and comments cache)
router.get(
  '/:ticketId/attachments',
  authenticate,
  cacheResponse((req) => `user:${req.user?.userId}:/api/tickets/${req.params.ticketId}/attachments`, 60),
  TicketAttachmentsController.list
);
router.post(
  '/:ticketId/attachments',
  authenticate,
  invalidatePatterns((req) => [
    `user:${req.user?.userId}:/api/tickets*`,
    `user:${req.user?.userId}:/api/tickets/${req.params.ticketId}/comments*`,
    `user:${req.user?.userId}:/api/tickets/${req.params.ticketId}/attachments*`,
  ]),
  TicketAttachmentsController.upload
);

export default router;


