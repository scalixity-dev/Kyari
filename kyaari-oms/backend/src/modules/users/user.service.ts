import { User, VendorProfile, UserStatus, Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { hashPassword } from '../../utils/hashing';
import { UserDto, VendorProfileDto, CreateUserDto } from './user.dto';
import { APP_CONSTANTS } from '../../config/constants';
import { logger } from '../../utils/logger';

type UserWithRolesAndProfile = User & {
  roles: Array<{ role: { name: string } }>;
  vendorProfile?: VendorProfile | null;
};

export class UserService {
  async createUser(data: CreateUserDto, createdBy?: string): Promise<UserDto> {
    try {
      const passwordHash = await hashPassword(data.password);
      
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

      logger.info('User created', { userId: user.id, role: data.role, createdBy });
      return this.mapToUserDto(user);
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
    return await prisma.user.findUnique({
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
      firstName: profile.firstName,
      lastName: profile.lastName,
      phone: profile.phone,
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