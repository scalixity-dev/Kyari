import { User, VendorProfile, UserStatus, Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { hashPassword } from '../../utils/hashing';
import { UserDto, VendorProfileDto, CreateUserDto } from './user.dto';
import { APP_CONSTANTS } from '../../config/constants';
import { logger } from '../../utils/logger';
import { generateSecurePassword } from '../../utils/password-generator';
import { emailService } from '../../services/email.service';

type UserWithRolesAndProfile = User & {
  roles: Array<{ role: { name: string } }>;
  vendorProfile?: VendorProfile | null;
};

export class UserService {
  async createUser(data: CreateUserDto, createdBy?: string, sendEmail: boolean = true): Promise<{ user: UserDto; password: string }> {
    try {
      // Generate secure password if not provided
      const plainPassword = data.password || generateSecurePassword();
      const passwordHash = await hashPassword(plainPassword);
      
      // Validate email is provided for non-vendor users
      if (!data.email && data.role !== 'VENDOR') {
        throw new Error('Email is required for ADMIN, OPS, and ACCOUNTS users');
      }

      // Check if email already exists
      if (data.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: data.email }
        });
        if (existingUser) {
          throw new Error('User with this email already exists');
        }
      }
      
      // Get role
      const role = await prisma.role.findUnique({
        where: { name: data.role }
      });
      
      if (!role) {
        throw new Error(`Role ${data.role} not found`);
      }

      const user = await prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          passwordHash,
          status: UserStatus.ACTIVE,
          createdBy,
          roles: {
            create: {
              roleId: role.id,
              assignedBy: createdBy,
            }
          }
        },
        include: {
          roles: {
            include: {
              role: true
            }
          },
          vendorProfile: true
        }
      });

      // Send credentials email for ADMIN, OPS, and ACCOUNTS users
      if (sendEmail && data.email && (data.role === 'ADMIN' || data.role === 'OPS' || data.role === 'ACCOUNTS')) {
        try {
          await emailService.sendCredentialsEmail({
            to: data.email,
            name: data.name,
            email: data.email,
            password: plainPassword,
            role: data.role,
          });
          logger.info('Credentials email sent', { userId: user.id, email: data.email });
        } catch (emailError) {
          logger.error('Failed to send credentials email, but user was created', { 
            error: emailError, 
            userId: user.id 
          });
          // Don't fail user creation if email fails
        }
      }

      logger.info('User created', { userId: user.id, role: data.role, createdBy });
      return {
        user: this.mapToUserDto(user),
        password: plainPassword
      };
    } catch (error) {
      logger.error('Failed to create user', { error, data: { ...data, password: '[REDACTED]' } });
      throw error;
    }
  }

  async findByEmail(email: string): Promise<UserWithRolesAndProfile | null> {
    return await prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            role: true
          }
        },
        vendorProfile: true
      }
    });
  }

  async findById(id: string): Promise<UserWithRolesAndProfile | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: true
          }
        },
        vendorProfile: true
      }
    });
    return user;
  }

  async updateLastLogin(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() }
    });
  }

  async updateUserStatus(userId: string, status: UserStatus, updatedBy?: string): Promise<UserDto> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { status },
      include: {
        roles: {
          include: {
            role: true
          }
        },
        vendorProfile: true
      }
    });

    logger.info('User status updated', { userId, status, updatedBy });
    return this.mapToUserDto(user);
  }

  async deleteUser(userId: string, deletedBy?: string): Promise<void> {
    try {
      // Hard delete - permanently remove from database
      // First delete related records due to foreign key constraints
      await prisma.$transaction(async (tx) => {
        // Delete user roles
        await tx.userRole.deleteMany({
          where: { userId }
        });

        // Delete refresh tokens
        await tx.refreshToken.deleteMany({
          where: { userId }
        });

        // Finally delete the user
        await tx.user.delete({
          where: { id: userId }
        });
      });

      logger.info('User hard deleted', { userId, deletedBy });
    } catch (error) {
      logger.error('Failed to delete user', { error, userId });
      throw error;
    }
  }

  async listUsers(filters?: {
    role?: string;
    status?: UserStatus;
    limit?: number;
    offset?: number;
  }): Promise<{ users: UserDto[], total: number }> {
    const where: Prisma.UserWhereInput = {};
    
    if (filters?.status) {
      where.status = filters.status;
    }
    
    if (filters?.role) {
      where.roles = {
        some: {
          role: {
            name: filters.role
          }
        }
      };
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          roles: {
            include: {
              role: true
            }
          },
          vendorProfile: true
        },
        take: filters?.limit,
        skip: filters?.offset,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    return {
      users: users.map((user: any) => this.mapToUserDto(user)),
      total
    };
  }

  mapToUserDto(user: UserWithRolesAndProfile): UserDto {
    return {
      id: user.id,
      email: user.email || undefined,
      name: user.name,
      status: user.status,
      lastLoginAt: user.lastLoginAt || undefined,
      createdAt: user.createdAt,
      roles: user.roles.map(ur => ur.role.name),
      vendorProfile: user.vendorProfile ? this.mapToVendorProfileDto(user.vendorProfile) : undefined
    };
  }

  private mapToVendorProfileDto(profile: VendorProfile): VendorProfileDto {
    return {
      id: profile.id,
      contactPersonName: profile.contactPersonName,
      contactPhone: profile.contactPhone,
      warehouseLocation: profile.warehouseLocation,
      pincode: profile.pincode,
      companyName: profile.companyName || undefined,
      gstNumber: profile.gstNumber || undefined,
      panNumber: profile.panNumber || undefined,
      verified: profile.verified,
      verifiedAt: profile.verifiedAt || undefined
    };
  }
}

export const userService = new UserService();