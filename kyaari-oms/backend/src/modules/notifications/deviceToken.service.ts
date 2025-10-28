import { PrismaClient, DeviceToken, DeviceType } from '@prisma/client';
import { logger } from '../../utils/logger';
import { FIREBASE_CONFIG } from '../../config/firebase.config';

const prisma = new PrismaClient();

/**
 * Device Token Management Service
 * 
 * Handles CRUD operations for device tokens, including:
 * - Token registration and validation
 * - Automatic expiration and cleanup
 * - Batch operations for performance
 * - Device type management
 */

export interface DeviceTokenData {
  token: string;
  deviceType?: DeviceType;
  metadata?: {
    userAgent?: string;
    platform?: string;
    browserName?: string;
    browserVersion?: string;
    osName?: string;
    osVersion?: string;
    deviceModel?: string;
    ipAddress?: string;
  };
}

export interface DeviceTokenFilter {
  userId?: string;
  deviceType?: DeviceType;
  isActive?: boolean;
  includeExpired?: boolean;
}

export class DeviceTokenService {

  /**
   * Register a new device token for a user
   */
  async addToken(userId: string, tokenData: DeviceTokenData): Promise<DeviceToken> {
    try {
      // Validate token format (basic FCM token validation)
      if (!this.isValidFCMToken(tokenData.token)) {
        throw new Error('Invalid FCM token format');
      }

      // Check if token already exists
      const existingToken = await prisma.deviceToken.findUnique({
        where: { token: tokenData.token }
      });

      if (existingToken) {
        // If token exists but for different user, update it
        if (existingToken.userId !== userId) {
          logger.info('Token transferred between users', {
            previousUserId: existingToken.userId,
            newUserId: userId,
            tokenId: existingToken.id
          });
        }

        // Update existing token (refresh expiration and metadata)
        const updatedToken = await prisma.deviceToken.update({
          where: { id: existingToken.id },
          data: {
            userId,
            deviceType: tokenData.deviceType || DeviceType.WEB,
            isActive: true,
            lastUsed: new Date(),
            metadata: tokenData.metadata as any || existingToken.metadata,
            expiresAt: new Date(Date.now() + (FIREBASE_CONFIG.TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000)),
            updatedAt: new Date()
          }
        });

        logger.info('Device token updated', {
          userId,
          tokenId: updatedToken.id,
          deviceType: updatedToken.deviceType
        });

        return updatedToken;
      }

      // Create new token
      const newToken = await prisma.deviceToken.create({
        data: {
          token: tokenData.token,
          userId,
          deviceType: tokenData.deviceType || DeviceType.WEB,
          isActive: true,
          lastUsed: new Date(),
          metadata: tokenData.metadata as any,
          expiresAt: new Date(Date.now() + (FIREBASE_CONFIG.TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000))
        }
      });

      logger.info('New device token registered', {
        userId,
        tokenId: newToken.id,
        deviceType: newToken.deviceType
      });

      // Cleanup old tokens for this user (keep only latest 5 per device type)
      await this.cleanupOldTokensForUser(userId, tokenData.deviceType || DeviceType.WEB);

      return newToken;

    } catch (error) {
      logger.error('Failed to add device token', {
        userId,
        deviceType: tokenData.deviceType,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Remove a device token
   */
  async removeToken(userId: string, token: string): Promise<boolean> {
    try {
      const result = await prisma.deviceToken.deleteMany({
        where: {
          token,
          userId
        }
      });

      if (result.count > 0) {
        logger.info('Device token removed', {
          userId,
          removedCount: result.count
        });
        return true;
      }

      logger.warn('Device token not found for removal', {
        userId,
        tokenPreview: token.substring(0, 20) + '...'
      });
      return false;

    } catch (error) {
      logger.error('Failed to remove device token', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  /**
   * Remove all tokens for a user (useful for logout)
   */
  async removeAllTokensForUser(userId: string): Promise<number> {
    try {
      const result = await prisma.deviceToken.deleteMany({
        where: { userId }
      });

      logger.info('All device tokens removed for user', {
        userId,
        removedCount: result.count
      });

      return result.count;

    } catch (error) {
      logger.error('Failed to remove all tokens for user', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return 0;
    }
  }

  /**
   * Get active tokens for a user
   */
  async getActiveTokensForUser(userId: string, deviceType?: DeviceType): Promise<DeviceToken[]> {
    try {
      const tokens = await prisma.deviceToken.findMany({
        where: {
          userId,
          isActive: true,
          expiresAt: { gt: new Date() },
          ...(deviceType && { deviceType })
        },
        orderBy: { lastUsed: 'desc' }
      });

      return tokens;

    } catch (error) {
      logger.error('Failed to get active tokens for user', {
        userId,
        deviceType,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  /**
   * Get tokens for multiple users (for role-based notifications)
   */
  async getActiveTokensForUsers(userIds: string[], deviceType?: DeviceType): Promise<{ userId: string; tokens: DeviceToken[] }[]> {
    try {
      const tokens = await prisma.deviceToken.findMany({
        where: {
          userId: { in: userIds },
          isActive: true,
          expiresAt: { gt: new Date() },
          ...(deviceType && { deviceType })
        },
        orderBy: { lastUsed: 'desc' }
      });

      // Group tokens by userId
      const tokensByUser = tokens.reduce((acc, token) => {
        if (!acc[token.userId]) {
          acc[token.userId] = [];
        }
        acc[token.userId].push(token);
        return acc;
      }, {} as Record<string, DeviceToken[]>);

      // Convert to array format
      return userIds.map(userId => ({
        userId,
        tokens: tokensByUser[userId] || []
      }));

    } catch (error) {
      logger.error('Failed to get active tokens for users', {
        userCount: userIds.length,
        deviceType,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return userIds.map(userId => ({ userId, tokens: [] }));
    }
  }

  /**
   * Update token last used timestamp
   */
  async updateTokenLastUsed(token: string): Promise<void> {
    try {
      await prisma.deviceToken.updateMany({
        where: { token, isActive: true },
        data: { lastUsed: new Date() }
      });
    } catch (error) {
      logger.error('Failed to update token last used', {
        tokenPreview: token.substring(0, 20) + '...',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Deactivate invalid tokens (called when FCM returns invalid token errors)
   */
  async deactivateTokens(tokens: string[]): Promise<number> {
    try {
      if (tokens.length === 0) return 0;

      const result = await prisma.deviceToken.updateMany({
        where: {
          token: { in: tokens }
        },
        data: {
          isActive: false,
          updatedAt: new Date()
        }
      });

      logger.info('Deactivated invalid tokens', {
        deactivatedCount: result.count,
        tokenCount: tokens.length
      });

      return result.count;

    } catch (error) {
      logger.error('Failed to deactivate tokens', {
        tokenCount: tokens.length,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return 0;
    }
  }

  /**
   * Cleanup expired and old tokens
   */
  async cleanupExpiredTokens(): Promise<{ expired: number; inactive: number }> {
    try {
      const now = new Date();

      // Remove expired tokens
      const expiredResult = await prisma.deviceToken.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: now } },
            { isActive: false, updatedAt: { lt: new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000)) } } // Remove inactive tokens older than 7 days
          ]
        }
      });

      logger.info('Cleaned up expired tokens', {
        expiredCount: expiredResult.count
      });

      return {
        expired: expiredResult.count,
        inactive: 0
      };

    } catch (error) {
      logger.error('Failed to cleanup expired tokens', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return { expired: 0, inactive: 0 };
    }
  }

  /**
   * Get token statistics
   */
  async getTokenStatistics(): Promise<{
    total: number;
    active: number;
    expired: number;
    byDeviceType: Record<DeviceType, number>;
    byUser: { userId: string; tokenCount: number }[];
  }> {
    try {
      const now = new Date();

      const [totalTokens, activeTokens, expiredTokens, tokensByDeviceType, tokensByUser] = await Promise.all([
        prisma.deviceToken.count(),
        prisma.deviceToken.count({
          where: {
            isActive: true,
            expiresAt: { gt: now }
          }
        }),
        prisma.deviceToken.count({
          where: {
            OR: [
              { expiresAt: { lt: now } },
              { isActive: false }
            ]
          }
        }),
        prisma.deviceToken.groupBy({
          by: ['deviceType'],
          _count: { id: true },
          where: {
            isActive: true,
            expiresAt: { gt: now }
          }
        }),
        prisma.deviceToken.groupBy({
          by: ['userId'],
          _count: { id: true },
          where: {
            isActive: true,
            expiresAt: { gt: now }
          },
          orderBy: { _count: { id: 'desc' } },
          take: 10
        })
      ]);

      const deviceTypeStats = tokensByDeviceType.reduce((acc, item) => {
        acc[item.deviceType] = item._count.id;
        return acc;
      }, {} as Record<DeviceType, number>);

      const userStats = tokensByUser.map(item => ({
        userId: item.userId,
        tokenCount: item._count.id
      }));

      return {
        total: totalTokens,
        active: activeTokens,
        expired: expiredTokens,
        byDeviceType: deviceTypeStats,
        byUser: userStats
      };

    } catch (error) {
      logger.error('Failed to get token statistics', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return {
        total: 0,
        active: 0,
        expired: 0,
        byDeviceType: {} as Record<DeviceType, number>,
        byUser: []
      };
    }
  }

  /**
   * Validate FCM token format
   */
  private isValidFCMToken(token: string): boolean {
    // FCM token validation - tokens can be 140-200+ characters
    // Modern FCM tokens can contain: alphanumeric, hyphens, underscores, and colons
    // Some tokens from newer Firebase SDK versions can be even longer (up to 250 chars)
    if (!token || typeof token !== 'string') {
      return false;
    }
    
    // Check length (FCM tokens are typically 140-250 characters)
    if (token.length < 140 || token.length > 500) {
      return false;
    }
    
    // Check for valid characters (alphanumeric, hyphens, underscores, colons)
    const fcmTokenPattern = /^[A-Za-z0-9_:-]+$/;
    return fcmTokenPattern.test(token);
  }

  /**
   * Cleanup old tokens for a user (keep only latest N tokens per device type)
   */
  private async cleanupOldTokensForUser(userId: string, deviceType: DeviceType, keepCount: number = 5): Promise<void> {
    try {
      // Get all tokens for this user and device type, ordered by creation date
      const allTokens = await prisma.deviceToken.findMany({
        where: {
          userId,
          deviceType
        },
        orderBy: { createdAt: 'desc' }
      });

      // If we have more than keepCount tokens, remove the oldest ones
      if (allTokens.length > keepCount) {
        const tokensToRemove = allTokens.slice(keepCount);
        const tokenIdsToRemove = tokensToRemove.map(t => t.id);

        if (tokenIdsToRemove.length > 0) {
          await prisma.deviceToken.deleteMany({
            where: {
              id: { in: tokenIdsToRemove }
            }
          });

          logger.info('Cleaned up old tokens for user', {
            userId,
            deviceType,
            removedCount: tokenIdsToRemove.length,
            keptCount: keepCount
          });
        }
      }

    } catch (error) {
      logger.error('Failed to cleanup old tokens for user', {
        userId,
        deviceType,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Remove a device token by its ID
   * Used when the frontend wants to remove a specific token
   */
  async removeTokenById(tokenId: string, userId: string): Promise<boolean> {
    try {
      const result = await prisma.deviceToken.deleteMany({
        where: {
          id: tokenId,
          userId
        }
      });

      if (result.count > 0) {
        logger.info('Device token removed by ID', {
          tokenId,
          userId,
          removedCount: result.count
        });
        return true;
      } else {
        logger.warn('Device token not found for removal', {
          tokenId,
          userId
        });
        return false;
      }
    } catch (error) {
      logger.error('Failed to remove device token by ID', {
        tokenId,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }
}

export const deviceTokenService = new DeviceTokenService();