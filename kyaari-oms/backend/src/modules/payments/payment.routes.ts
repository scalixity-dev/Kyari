import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { PaymentController } from './payment.controller';
import { cacheService } from '../../services/cache.service';

const router = Router();

const cacheResponse = (keyBuilder: (req: any) => string, ttlSeconds = 60) => {
  return async (req: any, res: any, next: any) => {
    try {
      const key = keyBuilder(req);
      const cached = await cacheService.get<any>(key);
      if (cached) return res.json(cached);
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

const invalidatePatterns = (patternsBuilder: (req: any) => string[]) => {
  return async (req: any, _res: any, next: any) => {
    try {
      const patterns = patternsBuilder(req);
      await Promise.all(patterns.map((p) => cacheService.invalidate(p)));
    } catch (_e) {}
    next();
  };
};

router.get(
  '/',
  authenticate,
  cacheResponse((req) => `user:${req.user?.userId}:/api/payments?${new URLSearchParams(req.query as any).toString()}`, 60),
  PaymentController.list
);

router.post(
  '/edit-amount',
  authenticate,
  invalidatePatterns((req) => [
    `user:${req.user?.userId}:/api/payments*`,
  ]),
  PaymentController.editAmount
);

router.post(
  '/release',
  authenticate,
  invalidatePatterns((req) => [
    `user:${req.user?.userId}:/api/payments*`,
  ]),
  PaymentController.release
);

router.post(
  '/update-delivery-status',
  authenticate,
  invalidatePatterns((req) => [
    `user:${req.user?.userId}:/api/payments*`,
  ]),
  PaymentController.updateDeliveryStatus
);

export default router;


