import crypto from 'crypto';
import { userService } from '../users/user.service';
import { jwtService } from './jwt.service';
import { verifyPassword, hashPassword } from '../../utils/hashing';
import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';
import { APP_CONSTANTS } from '../../config/constants';
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
        { email: user.email },
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
      // Check if email already exists
      const existingUser = await userService.findByEmail(registrationData.email);
      if (existingUser) {
        throw new Error('Email already registered');
      }

      // Check if phone already exists
      const existingPhone = await prisma.vendorProfile.findUnique({
        where: { phone: registrationData.phone }
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
        throw new Error('Vendor role not found');
      }

      // Create user and vendor profile in transaction
      const result = await prisma.$transaction(async (tx: any) => {
        const user = await tx.user.create({
          data: {
            name: `${registrationData.firstName} ${registrationData.lastName}`,
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
            firstName: registrationData.firstName,
            lastName: registrationData.lastName,
            phone: registrationData.phone,
            warehouseLocation: registrationData.warehouseLocation,
            pincode: registrationData.pincode,
            companyName: registrationData.companyName,
            gstNumber: registrationData.gstNumber,
            panNumber: registrationData.panNumber
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
          email: registrationData.email, 
          phone: registrationData.phone,
          type: 'vendor'
        },
        ipAddress,
        userAgent
      );

      logger.info('Vendor registered successfully', { 
        userId: result.id, 
        email: registrationData.email,
        phone: registrationData.phone
      });

      return { message: 'Registration successful. Awaiting admin approval.' };
    } catch (error) {
      logger.error('Vendor registration failed', { 
        error, 
        email: registrationData.email,
        phone: registrationData.phone 
      });
      throw error;
    }
  }

  async refreshTokens(refreshToken: string, ipAddress?: string, userAgent?: string): Promise<{ accessToken: string }> {
    try {
      const payload = await jwtService.verifyRefreshToken(refreshToken);
      
      // Verify token exists in database and is not revoked
      const storedToken = await prisma.refreshToken.findUnique({
        where: { tokenHash: await this.hashToken(refreshToken) },
        include: { user: { include: { roles: { include: { role: true } } } } }
      });

      if (!storedToken || storedToken.revokedAt) {
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

      const newRefreshToken = await jwtService.generateRefreshToken({
        userId: storedToken.userId,
        family: storedToken.family
      });

      // Store new refresh token
      await this.storeRefreshToken(
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

      return { accessToken: newAccessToken };
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

  private async hashToken(token: string): Promise<string> {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async createAuditLog(
    actorUserId: string | null,
    action: string,
    entityType: string,
    entityId: string,
    metadata: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await prisma.auditLog.create({
      data: {
        actorUserId,
        action,
        entityType,
        entityId,
        metadata,
        ipAddress,
        userAgent
      }
    });
  }
}

export const authService = new AuthService();