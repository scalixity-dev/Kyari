/// <reference path="../../types/express.d.ts" />
import { Request, Response } from 'express';
import { authService } from './auth.service';
import { 
  loginSchema, 
  vendorRegistrationSchema, 
  validateSchema 
} from './auth.validators';
import { ResponseHelper } from '../../utils/response';
import { logger } from '../../utils/logger';

export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const validation = validateSchema(loginSchema, req.body);
      if (!validation.success) {
        ResponseHelper.validationError(res, validation.errors);
        return;
      }

      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || 'unknown';

      const result = await authService.login(validation.data, ipAddress, userAgent);

      // Set refresh token as httpOnly cookie
      if (result.refreshToken) {
        res.cookie('refresh_token', result.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          path: '/'
        });
      }

      ResponseHelper.success(res, { accessToken: result.accessToken, user: result.user }, 'Login successful');
    } catch (error) {
      logger.error('Login controller error', { error });
      ResponseHelper.error(res, error instanceof Error ? error.message : 'Login failed', 401);
    }
  }

  async registerVendor(req: Request, res: Response): Promise<void> {
    try {
      const validation = validateSchema(vendorRegistrationSchema, req.body);
      if (!validation.success) {
        ResponseHelper.validationError(res, validation.errors);
        return;
      }

      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || 'unknown';

      const result = await authService.registerVendor(validation.data, ipAddress, userAgent);

      ResponseHelper.success(res, result, result.message, 201);
    } catch (error) {
      logger.error('Vendor registration controller error', { error });
      ResponseHelper.error(res, error instanceof Error ? error.message : 'Registration failed', 400);
    }
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies?.refresh_token;
      if (!refreshToken) {
        ResponseHelper.unauthorized(res, 'Refresh token not provided');
        return;
      }

      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || 'unknown';

      const result = await authService.refreshTokens(refreshToken, ipAddress, userAgent);

      // Set new refresh token as httpOnly cookie (token rotation)
      const newRefreshToken = await this.extractRefreshTokenFromResult(result);
      if (newRefreshToken) {
        res.cookie('refresh_token', newRefreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          path: '/'
        });
      }

      ResponseHelper.success(res, { accessToken: result.accessToken }, 'Token refreshed successfully');
    } catch (error) {
      // Clear invalid refresh token
      res.clearCookie('refresh_token');
      logger.error('Token refresh controller error', { error });
      ResponseHelper.unauthorized(res, error instanceof Error ? error.message : 'Token refresh failed');
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies?.refresh_token;
      const userId = req.user?.userId; // From auth middleware

      if (refreshToken && userId) {
        const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
        const userAgent = req.get('User-Agent') || 'unknown';
        
        await authService.logout(refreshToken, userId, ipAddress, userAgent);
      }

      // Clear refresh token cookie
      res.clearCookie('refresh_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
      });

      ResponseHelper.success(res, null, 'Logout successful');
    } catch (error) {
      logger.error('Logout controller error', { error });
      ResponseHelper.error(res, error instanceof Error ? error.message : 'Logout failed');
    }
  }

  async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        ResponseHelper.unauthorized(res, 'User not authenticated');
        return;
      }

      const userService = await import('../users/user.service');
      const user = await userService.userService.findById(userId);
      
      if (!user) {
        ResponseHelper.notFound(res, 'User not found');
        return;
      }

      const userDto = {
        id: user.id,
        email: user.email || undefined,
        name: user.name,
        status: user.status,
        lastLoginAt: user.lastLoginAt || undefined,
        createdAt: user.createdAt,
        roles: user.roles.map((ur: any) => ur.role.name),
        vendorProfile: user.vendorProfile ? {
          id: user.vendorProfile.id,
          contactPersonName: user.vendorProfile.contactPersonName,
          contactPhone: user.vendorProfile.contactPhone,
          warehouseLocation: user.vendorProfile.warehouseLocation,
          pincode: user.vendorProfile.pincode,
          companyName: user.vendorProfile.companyName || undefined,
          gstNumber: user.vendorProfile.gstNumber || undefined,
          panNumber: user.vendorProfile.panNumber || undefined,
          verified: user.vendorProfile.verified,
          verifiedAt: user.vendorProfile.verifiedAt || undefined
        } : undefined
      };

      ResponseHelper.success(res, { user: userDto }, 'User data retrieved successfully');
    } catch (error) {
      logger.error('Get current user controller error', { error });
      ResponseHelper.internalError(res, 'Failed to retrieve user data');
    }
  }

  private async extractRefreshTokenFromResult(result: any): Promise<string | null> {
    // This is a placeholder - in the actual implementation,
    // the refresh token would be returned from the auth service
    // For now, we'll handle this in the service layer
    return null;
  }
}

export const authController = new AuthController();