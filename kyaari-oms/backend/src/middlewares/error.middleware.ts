import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ResponseHelper } from '../utils/response';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export interface CustomError extends Error {
  statusCode?: number;
  code?: string;
}

export const errorHandler = (
  error: CustomError | ZodError | Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error
  logger.error('Unhandled error', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.userId
  });

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const errors: Record<string, string[]> = {};
    error.issues.forEach((issue) => {
      const path = issue.path.join('.');
      if (!errors[path]) errors[path] = [];
      errors[path].push(issue.message);
    });
    
    ResponseHelper.validationError(res, errors);
    return;
  }

  // Handle custom errors
  if ('statusCode' in error && error.statusCode) {
    ResponseHelper.error(res, error.message, error.statusCode);
    return;
  }

  // Handle specific error types
  if (error.message.includes('Invalid email or password')) {
    ResponseHelper.unauthorized(res, error.message);
    return;
  }

  if (error.message.includes('not found')) {
    ResponseHelper.notFound(res, error.message);
    return;
  }

  if (error.message.includes('already exists') || error.message.includes('already registered')) {
    ResponseHelper.error(res, error.message, 409);
    return;
  }

  // Default to 500 Internal Server Error
  const isDevelopment = env.NODE_ENV === 'development';
  const message = isDevelopment ? error.message : 'Internal server error';
  
  ResponseHelper.internalError(res, message);
};

export const notFoundHandler = (req: Request, res: Response): void => {
  ResponseHelper.notFound(res, `Route ${req.method} ${req.path} not found`);
};

// Rate limiting middleware (basic implementation)
export const rateLimiter = (maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const clientId = req.ip || 'unknown';
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean up old entries
    for (const [key, value] of requests) {
      if (value.resetTime < windowStart) {
        requests.delete(key);
      }
    }

    const clientData = requests.get(clientId);
    
    if (!clientData || clientData.resetTime < windowStart) {
      requests.set(clientId, { count: 1, resetTime: now + windowMs });
      next();
      return;
    }

    if (clientData.count >= maxRequests) {
      logger.warn('Rate limit exceeded', { ip: clientId, count: clientData.count });
      ResponseHelper.error(res, 'Too many requests, please try again later', 429);
      return;
    }

    clientData.count++;
    next();
  };
};