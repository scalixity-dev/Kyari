import crypto from 'crypto';
import { userService } from '../users/user.service';
import { jwtService } from './jwt.service';
import { verifyPassword, hashPassword } from '../../utils/hashing';
import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';
import { APP_CONSTANTS } from '../../config/constants';
import { emailService } from '../../services/email.service';
import { 
  LoginDto, 
  VendorRegistrationDto, 
  AuthResponseDto, 
  UserDto 
} from '../users/user.dto';

export class AuthService {
  async login(loginData: LoginDto, ipAddress?: string, userAgent?: string): Promise<AuthResponseDto> {
    try {
      const user = await userService.findByEmail(loginData.email);
      
      if (!user) {
        throw new Error('Invalid email or password');
      }

      if (user.status !== 'ACTIVE') {
        throw new Error('Account is not active. Please contact administrator.');
      }

      const isPasswordValid = await verifyPassword(user.passwordHash, loginData.password);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      // Update last login
      await userService.updateLastLogin(user.id);

      // Generate tokens
      const roles = user.roles.map((ur: any) => ur.role.name);
      const accessToken = await jwtService.generateAccessToken({
        userId: user.id,
        email: user.email || undefined,
        roles
      });

      const refreshTokenFamily = crypto.randomUUID();
      const refreshToken = await jwtService.generateRefreshToken({
        userId: user.id,
        family: refreshTokenFamily
      });

      // Store refresh token
      await this.storeRefreshToken(
        user.id,
        refreshToken,
        refreshTokenFamily,
        ipAddress,
        userAgent
      );

      // Audit log
      await this.createAuditLog(
        user.id,
        APP_CONSTANTS.AUDIT_ACTIONS.USER_LOGIN,
        'User',
        user.id,
        { email: user.email || '' },
        ipAddress,
        userAgent
      );

      logger.info('User logged in successfully', { userId: user.id, email: user.email });

      return {
        accessToken,
        refreshToken,
        user: userService.mapToUserDto(user)
      };
    } catch (error) {
      logger.error('Login failed', { error, email: loginData.email });
      throw error;
    }
  }

  async registerVendor(registrationData: VendorRegistrationDto, ipAddress?: string, userAgent?: string): Promise<{ message: string }> {
    try {
      logger.info('Starting vendor registration', { 
        email: registrationData.email, 
        phone: registrationData.contactPhone 
      });

      // Check if email already exists
      const existingUser = await userService.findByEmail(registrationData.email);
      if (existingUser) {
        throw new Error('Email already registered');
      }

      // Check if phone already exists
      const existingPhone = await prisma.vendorProfile.findUnique({
        where: { contactPhone: registrationData.contactPhone }
      });
      if (existingPhone) {
        throw new Error('Phone number already registered');
      }

      const passwordHash = await hashPassword(registrationData.password);

      // Get vendor role
      const vendorRole = await prisma.role.findUnique({
        where: { name: APP_CONSTANTS.ROLES.VENDOR }
      });
      
      if (!vendorRole) {
        logger.error('Vendor role not found in database');
        throw new Error('Vendor role not found. Please run database seed.');
      }

      // Create user and vendor profile in transaction
      const result = await prisma.$transaction(async (tx: any) => {
        const user = await tx.user.create({
          data: {
            name: registrationData.contactPersonName,
            email: registrationData.email,
            passwordHash,
            status: 'PENDING', // Requires admin approval
            roles: {
              create: {
                roleId: vendorRole.id
              }
            }
          }
        });

        await tx.vendorProfile.create({
          data: {
            userId: user.id,
            contactPersonName: registrationData.contactPersonName,
            contactPhone: registrationData.contactPhone,
            warehouseLocation: registrationData.warehouseLocation,
            pincode: registrationData.pincode,
            companyName: registrationData.companyName || registrationData.contactPersonName, // Use contact name if company name not provided
            gstNumber: registrationData.gstNumber || null,
            panNumber: registrationData.panNumber || null
          }
        });

        return user;
      });

      // Audit log
      await this.createAuditLog(
        null, // No actor for self-registration
        APP_CONSTANTS.AUDIT_ACTIONS.USER_REGISTER,
        'User',
        result.id,
        { 
          email: registrationData.email || '', 
          phone: registrationData.contactPhone || '',
          type: 'vendor'
        },
        ipAddress,
        userAgent
      );

      logger.info('Vendor registered successfully', { 
        userId: result.id, 
        email: registrationData.email,
        phone: registrationData.contactPhone
      });

      return { message: 'Registration successful. Awaiting admin approval.' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      logger.error('Vendor registration failed', { 
        error: errorMessage,
        stack: errorStack,
        email: registrationData.email,
        phone: registrationData.contactPhone 
      });
      
      // Re-throw with proper error message
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Registration failed. Please try again.');
    }
  }

  async refreshTokens(refreshToken: string, ipAddress?: string, userAgent?: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const payload = await jwtService.verifyRefreshToken(refreshToken);
      
      // Verify token exists in database and is not revoked
      const storedToken = await prisma.refreshToken.findUnique({
        where: { tokenHash: await this.hashToken(refreshToken) },
        include: { user: { include: { roles: { include: { role: true } } } } }
      });

      if (!storedToken) {
        throw new Error('Refresh token not found');
      }

      if (storedToken.revokedAt) {
        // Security: Token reuse detected - revoke entire token family
        logger.warn('Token reuse detected, revoking entire token family', { 
          tokenFamily: storedToken.family,
          userId: storedToken.userId,
          ipAddress
        });
        await this.revokeTokenFamily(storedToken.family, 'Token reuse detected', ipAddress);
        throw new Error('Invalid refresh token');
      }

      if (storedToken.expiresAt < new Date()) {
        throw new Error('Refresh token expired');
      }

      // Revoke old token
      await prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() }
      });

      // Generate new tokens
      const roles = storedToken.user.roles.map((ur: any) => ur.role.name);
      const newAccessToken = await jwtService.generateAccessToken({
        userId: storedToken.userId,
        email: storedToken.user.email || undefined,
        roles
      });

      // Generate new refresh token with same family (proper token rotation)
      const newRefreshToken = await jwtService.generateRefreshToken({
        userId: storedToken.userId,
        family: storedToken.family
      });

      // Store new refresh token with retry logic for unique constraint
      await this.storeRefreshTokenWithRetry(
        storedToken.userId,
        newRefreshToken,
        storedToken.family,
        ipAddress,
        userAgent
      );

      // Audit log
      await this.createAuditLog(
        storedToken.userId,
        APP_CONSTANTS.AUDIT_ACTIONS.TOKEN_REFRESH,
        'RefreshToken',
        storedToken.id,
        {},
        ipAddress,
        userAgent
      );

      logger.info('Tokens refreshed successfully', { userId: storedToken.userId });

      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch (error) {
      logger.error('Token refresh failed', { error });
      throw error;
    }
  }

  async logout(refreshToken: string, userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    try {
      // Revoke refresh token
      const tokenHash = await this.hashToken(refreshToken);
      await prisma.refreshToken.updateMany({
        where: { 
          tokenHash,
          userId,
          revokedAt: null
        },
        data: { revokedAt: new Date() }
      });

      // Audit log
      await this.createAuditLog(
        userId,
        APP_CONSTANTS.AUDIT_ACTIONS.USER_LOGOUT,
        'User',
        userId,
        {},
        ipAddress,
        userAgent
      );

      logger.info('User logged out successfully', { userId });
    } catch (error) {
      logger.error('Logout failed', { error, userId });
      throw error;
    }
  }

  private async storeRefreshToken(
    userId: string,
    token: string,
    family: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const tokenHash = await this.hashToken(token);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    // Clean up expired and revoked tokens for this user to prevent hash collisions
    await prisma.refreshToken.deleteMany({
      where: {
        userId,
        OR: [
          { expiresAt: { lt: new Date() } },
          { revokedAt: { not: null } }
        ]
      }
    });

    await prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        family,
        expiresAt,
        ipAddress,
        userAgent
      }
    });
  }

  private async storeRefreshTokenWithRetry(
    userId: string,
    token: string,
    family: string,
    ipAddress?: string,
    userAgent?: string,
    maxRetries: number = 3
  ): Promise<void> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.storeRefreshToken(userId, token, family, ipAddress, userAgent);
        return; // Success, exit the retry loop
      } catch (error: any) {
        lastError = error;
        
        // If it's a unique constraint violation, try to clean up and regenerate
        if (error?.code === 'P2002' && error?.meta?.target?.includes('tokenHash')) {
          logger.warn(`Token hash collision on attempt ${attempt}, cleaning up expired tokens`, { userId, family });
          
          // Clean up expired tokens for this user
          await prisma.refreshToken.deleteMany({
            where: {
              userId,
              expiresAt: { lt: new Date() }
            }
          });
          
          // If not the last attempt, regenerate token with additional entropy
          if (attempt < maxRetries) {
            // Add a small delay and extra randomness to avoid collisions
            await new Promise(resolve => setTimeout(resolve, 100 * attempt));
            token = await jwtService.generateRefreshToken({
              userId,
              family,
              jti: crypto.randomUUID() // Add unique JWT ID
            });
            continue;
          }
        }
        
        // If it's not a unique constraint error or we've exceeded retries, throw
        if (attempt === maxRetries) {
          throw lastError;
        }
      }
    }
  }

  private async hashToken(token: string): Promise<string> {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Revoke entire token family - used when token reuse is detected
   */
  private async revokeTokenFamily(family: string, reason: string, ipAddress?: string): Promise<number> {
    const result = await prisma.refreshToken.updateMany({
      where: { 
        family,
        revokedAt: null // Only revoke active tokens in the family
      },
      data: { 
        revokedAt: new Date()
        // TODO: Add revokedReason and revokedByIp after schema migration
        // revokedReason: reason,
        // revokedByIp: ipAddress
      }
    });

    logger.info('Token family revoked', { 
      family, 
      reason, 
      revokedCount: result.count,
      ipAddress 
    });

    return result.count;
  }

  /**
   * Generate and send password reset code
   */
  async sendPasswordResetCode(email: string, ipAddress?: string, userAgent?: string): Promise<{ message: string }> {
    try {
      // Check if user exists
      const user = await userService.findByEmail(email);
      if (!user) {
        // Don't reveal that user doesn't exist for security
        logger.warn('Password reset requested for non-existent email', { email });
        return { message: 'If the email exists, a password reset code has been sent.' };
      }

      // Check if user is active
      if (user.status !== 'ACTIVE') {
        throw new Error('Account is not active. Please contact administrator.');
      }

      // Invalidate any existing unused codes for this email
      await prisma.passwordResetCode.updateMany({
        where: {
          email: email.toLowerCase(),
          usedAt: null,
          expiresAt: { gt: new Date() }
        },
        data: {
          usedAt: new Date() // Mark as used to invalidate
        }
      });

      // Generate 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Set expiry to 15 minutes from now
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15);

      // Store code in database
      await prisma.passwordResetCode.create({
        data: {
          email: email.toLowerCase(),
          code,
          expiresAt,
          ipAddress,
          userAgent
        }
      });

      // Send email with code
      await emailService.sendPasswordResetCode(email, user.name, code);

      // Audit log
      await this.createAuditLog(
        null, // No actor for password reset request
        'PASSWORD_RESET_CODE_SENT',
        'User',
        user.id,
        { email },
        ipAddress,
        userAgent
      );

      logger.info('Password reset code generated and sent', { email, userId: user.id });
      return { message: 'If the email exists, a password reset code has been sent.' };
    } catch (error) {
      logger.error('Failed to send password reset code', { error, email });
      throw error;
    }
  }

  /**
   * Verify password reset code
   */
  async verifyPasswordResetCode(email: string, code: string): Promise<{ valid: boolean; message: string }> {
    try {
      // Find the most recent unused, non-expired code
      const resetCode = await prisma.passwordResetCode.findFirst({
        where: {
          email: email.toLowerCase(),
          code,
          usedAt: null,
          expiresAt: { gt: new Date() }
        },
        orderBy: { createdAt: 'desc' }
      });

      if (!resetCode) {
        logger.warn('Invalid or expired password reset code', { email, code });
        return { valid: false, message: 'Invalid or expired code. Please request a new one.' };
      }

      logger.info('Password reset code verified', { email });
      return { valid: true, message: 'Code verified successfully.' };
    } catch (error) {
      logger.error('Failed to verify password reset code', { error, email });
      throw error;
    }
  }

  /**
   * Reset password using code
   */
  async resetPasswordWithCode(
    email: string, 
    code: string, 
    newPassword: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ message: string }> {
    try {
      // Verify code exists and is valid
      const resetCode = await prisma.passwordResetCode.findFirst({
        where: {
          email: email.toLowerCase(),
          code,
          usedAt: null,
          expiresAt: { gt: new Date() }
        },
        orderBy: { createdAt: 'desc' }
      });

      if (!resetCode) {
        throw new Error('Invalid or expired code. Please request a new one.');
      }

      // Get user
      const user = await userService.findByEmail(email);
      if (!user) {
        throw new Error('User not found.');
      }

      // Hash new password
      const passwordHash = await hashPassword(newPassword);

      // Update password and increment password version
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          passwordVersion: { increment: 1 }
        }
      });

      // Mark code as used
      await prisma.passwordResetCode.update({
        where: { id: resetCode.id },
        data: { usedAt: new Date() }
      });

      // Revoke all existing refresh tokens for security
      await prisma.refreshToken.updateMany({
        where: { 
          userId: user.id,
          revokedAt: null
        },
        data: { revokedAt: new Date() }
      });

      // Audit log
      await this.createAuditLog(
        user.id,
        'PASSWORD_RESET_SUCCESS',
        'User',
        user.id,
        { email },
        ipAddress,
        userAgent
      );

      logger.info('Password reset successful', { email, userId: user.id });
      return { message: 'Password reset successfully. Please login with your new password.' };
    } catch (error) {
      logger.error('Failed to reset password', { error, email });
      throw error;
    }
  }

  private async createAuditLog(
    actorUserId: string | null,
    action: string,
    entityType: string,
    entityId: string,
    metadata: Record<string, string>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await prisma.auditLog.create({
      data: {
        actorUserId,
        action,
        entityType,
        entityId,
        metadata: metadata as Record<string, string>,
        ipAddress,
        userAgent
      }
    });
  }

  /**
   * Cleanup expired refresh tokens
   */
  async cleanupExpiredTokens(): Promise<{ deletedCount: number }> {
    try {
      const now = new Date();
      
      // Delete expired refresh tokens
      const deleteResult = await prisma.refreshToken.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: now } },
            { revokedAt: { not: null } }
          ]
        }
      });

      logger.info('Expired refresh tokens cleaned up', { 
        deletedCount: deleteResult.count 
      });

      return { deletedCount: deleteResult.count };
    } catch (error) {
      logger.error('Failed to cleanup expired tokens', { error });
      throw new Error('Token cleanup failed');
    }
  }

  /**
   * Cleanup tokens for a specific user
   */
  async revokeAllUserTokens(userId: string): Promise<{ revokedCount: number }> {
    try {
      const updateResult = await prisma.refreshToken.updateMany({
        where: {
          userId,
          revokedAt: null
        },
        data: {
          revokedAt: new Date()
        }
      });

      logger.info('All user tokens revoked', { 
        userId, 
        revokedCount: updateResult.count 
      });

      return { revokedCount: updateResult.count };
    } catch (error) {
      logger.error('Failed to revoke user tokens', { error, userId });
      throw new Error('Token revocation failed');
    }
  }
}

export const authService = new AuthService();