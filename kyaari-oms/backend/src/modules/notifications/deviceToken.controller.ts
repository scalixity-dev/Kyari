import { Request, Response } from 'express';
import { z } from 'zod';
import { DeviceType } from '@prisma/client';
import { deviceTokenService, DeviceTokenData } from './deviceToken.service';
import { logger } from '../../utils/logger';

/**
 * Device Token Controller
 * 
 * Handles API endpoints for device token management:
 * - Register device tokens
 * - Remove device tokens
 * - Get token statistics
 * - Cleanup operations
 */

// Validation schemas
const registerTokenSchema = z.object({
  token: z.string().min(140).max(200),
  deviceType: z.nativeEnum(DeviceType).optional().default(DeviceType.WEB),
  metadata: z.object({
    userAgent: z.string().optional(),
    platform: z.string().optional(),
    browserName: z.string().optional(),
    browserVersion: z.string().optional(),
    osName: z.string().optional(),
    osVersion: z.string().optional(),
    deviceModel: z.string().optional(),
  }).optional()
});

const removeTokenSchema = z.object({
  token: z.string().min(140).max(200)
});

export class DeviceTokenController {

  /**
   * Register a device token for the current user
   * POST /api/users/me/device-tokens
   */
  async registerToken(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      // Validate request body
      const validation = registerTokenSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: validation.error.errors
        });
      }

      const { token, deviceType, metadata } = validation.data;

      // Add client IP and enhanced metadata
      const enhancedMetadata = {
        ...metadata,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        registeredAt: new Date().toISOString()
      };

      const tokenData: DeviceTokenData = {
        token,
        deviceType,
        metadata: enhancedMetadata
      };

      // Register the token
      const deviceToken = await deviceTokenService.addToken(userId, tokenData);

      logger.info('Device token registered via API', {
        userId,
        tokenId: deviceToken.id,
        deviceType: deviceToken.deviceType,
        ip: req.ip
      });

      return res.status(201).json({
        success: true,
        data: {
          id: deviceToken.id,
          deviceType: deviceToken.deviceType,
          expiresAt: deviceToken.expiresAt,
          createdAt: deviceToken.createdAt
        },
        message: 'Device token registered successfully'
      });

    } catch (error) {
      logger.error('Failed to register device token', {
        userId: req.user?.userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        ip: req.ip
      });

      return res.status(500).json({
        success: false,
        error: 'Failed to register device token'
      });
    }
  }

  /**
   * Remove a device token for the current user
   * DELETE /api/users/me/device-tokens
   */
  async removeToken(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      // Validate request body
      const validation = removeTokenSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: validation.error.errors
        });
      }

      const { token } = validation.data;

      // Remove the token
      const removed = await deviceTokenService.removeToken(userId, token);

      if (removed) {
        logger.info('Device token removed via API', {
          userId,
          ip: req.ip
        });

        return res.json({
          success: true,
          message: 'Device token removed successfully'
        });
      } else {
        return res.status(404).json({
          success: false,
          error: 'Device token not found'
        });
      }

    } catch (error) {
      logger.error('Failed to remove device token', {
        userId: req.user?.userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        ip: req.ip
      });

      return res.status(500).json({
        success: false,
        error: 'Failed to remove device token'
      });
    }
  }

  /**
   * Remove all device tokens for the current user (logout all devices)
   * DELETE /api/users/me/device-tokens/all
   */
  async removeAllTokens(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      // Remove all tokens for the user
      const removedCount = await deviceTokenService.removeAllTokensForUser(userId);

      logger.info('All device tokens removed via API', {
        userId,
        removedCount,
        ip: req.ip
      });

      return res.json({
        success: true,
        data: { removedCount },
        message: `Removed ${removedCount} device tokens`
      });

    } catch (error) {
      logger.error('Failed to remove all device tokens', {
        userId: req.user?.userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        ip: req.ip
      });

      return res.status(500).json({
        success: false,
        error: 'Failed to remove device tokens'
      });
    }
  }

  /**
   * Get device tokens for the current user
   * GET /api/users/me/device-tokens
   */
  async getMyTokens(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      const deviceType = req.query.deviceType as DeviceType | undefined;

      // Get active tokens for the user
      const tokens = await deviceTokenService.getActiveTokensForUser(userId, deviceType);

      // Return sanitized token data (without actual token values)
      const sanitizedTokens = tokens.map(token => ({
        id: token.id,
        deviceType: token.deviceType,
        lastUsed: token.lastUsed,
        expiresAt: token.expiresAt,
        metadata: token.metadata,
        createdAt: token.createdAt
      }));

      return res.json({
        success: true,
        data: {
          tokens: sanitizedTokens,
          count: sanitizedTokens.length
        }
      });

    } catch (error) {
      logger.error('Failed to get user device tokens', {
        userId: req.user?.userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return res.status(500).json({
        success: false,
        error: 'Failed to get device tokens'
      });
    }
  }

  /**
   * Get device token statistics (admin only)
   * GET /api/admin/device-tokens/stats
   */
  async getTokenStatistics(req: Request, res: Response) {
    try {
      // This endpoint should be admin-only (implement role check if needed)
      const userRoles = req.user?.roles || [];
      const isAdmin = userRoles.includes('ADMIN');

      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions'
        });
      }

      // Get token statistics
      const stats = await deviceTokenService.getTokenStatistics();

      return res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      logger.error('Failed to get token statistics', {
        userId: req.user?.userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return res.status(500).json({
        success: false,
        error: 'Failed to get token statistics'
      });
    }
  }

  /**
   * Cleanup expired tokens (admin only)
   * POST /api/admin/device-tokens/cleanup
   */
  async cleanupTokens(req: Request, res: Response) {
    try {
      // This endpoint should be admin-only
      const userRoles = req.user?.roles || [];
      const isAdmin = userRoles.includes('ADMIN');

      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions'
        });
      }

      // Cleanup expired tokens
      const result = await deviceTokenService.cleanupExpiredTokens();

      logger.info('Token cleanup performed via API', {
        userId: req.user?.userId,
        result,
        ip: req.ip
      });

      return res.json({
        success: true,
        data: result,
        message: `Cleaned up ${result.expired} expired tokens`
      });

    } catch (error) {
      logger.error('Failed to cleanup tokens', {
        userId: req.user?.userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return res.status(500).json({
        success: false,
        error: 'Failed to cleanup tokens'
      });
    }
  }

  /**
   * Health check for notification system
   * GET /api/notifications/health
   */
  async healthCheck(req: Request, res: Response) {
    try {
      const stats = await deviceTokenService.getTokenStatistics();
      
      return res.json({
        success: true,
        data: {
          service: 'Device Token Management',
          status: 'healthy',
          timestamp: new Date().toISOString(),
          statistics: {
            totalTokens: stats.total,
            activeTokens: stats.active,
            expiredTokens: stats.expired
          }
        }
      });

    } catch (error) {
      logger.error('Device token health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return res.status(500).json({
        success: false,
        error: 'Health check failed'
      });
    }
  }
}

export const deviceTokenController = new DeviceTokenController();