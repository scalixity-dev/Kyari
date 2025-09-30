import { Request, Response, NextFunction } from 'express';
import { jwtService } from '../modules/auth/jwt.service';
import { ResponseHelper } from '../utils/response';
import { logger } from '../utils/logger';

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      ResponseHelper.unauthorized(res, 'Access token required');
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      ResponseHelper.unauthorized(res, 'Access token required');
      return;
    }

    const payload = await jwtService.verifyAccessToken(token);
    req.user = payload;
    
    next();
  } catch (error) {
    logger.warn('Authentication failed', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    ResponseHelper.unauthorized(res, 'Invalid or expired token');
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        ResponseHelper.unauthorized(res, 'Authentication required');
        return;
      }

      const userRoles = req.user.roles || [];
      const hasRequiredRole = allowedRoles.some(role => userRoles.includes(role));

      if (!hasRequiredRole) {
        logger.warn('Access denied - insufficient permissions', {
          userId: req.user.userId,
          userRoles,
          requiredRoles: allowedRoles,
          ip: req.ip
        });
        ResponseHelper.forbidden(res, 'Insufficient permissions');
        return;
      }

      next();
    } catch (error) {
      logger.error('Role check failed', { error });
      ResponseHelper.internalError(res, 'Authorization check failed');
    }
  };
};

export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        ResponseHelper.unauthorized(res, 'Authentication required');
        return;
      }

      // For now, we'll implement basic role-based permissions
      // This can be extended to support more granular permissions
      const userRoles = req.user.roles || [];
      
      // Admin has all permissions
      if (userRoles.includes('ADMIN')) {
        next();
        return;
      }

      // Map permissions to roles (this would typically come from database)
      const rolePermissions: Record<string, string[]> = {
        'VENDOR': ['vendor:read', 'vendor:update'],
        'ACCOUNTS': ['user:read', 'vendor:read', 'order:read'],
        'OPS': ['user:read', 'vendor:read', 'order:read', 'order:update'],
      };

      const hasPermission = userRoles.some(role => 
        rolePermissions[role]?.includes(permission)
      );

      if (!hasPermission) {
        logger.warn('Access denied - missing permission', {
          userId: req.user.userId,
          userRoles,
          requiredPermission: permission,
          ip: req.ip
        });
        ResponseHelper.forbidden(res, `Permission denied: ${permission}`);
        return;
      }

      next();
    } catch (error) {
      logger.error('Permission check failed', { error });
      ResponseHelper.internalError(res, 'Permission check failed');
    }
  };
};