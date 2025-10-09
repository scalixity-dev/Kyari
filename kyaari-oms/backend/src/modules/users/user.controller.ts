import { Request, Response } from 'express';
import { userService } from './user.service';
import { ResponseHelper } from '../../utils/response';
import { logger } from '../../utils/logger';
import { z } from 'zod';
import { UserStatus } from '@prisma/client';
import { validateSchema } from '../auth/auth.validators';

const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  role: z.enum(['ADMIN', 'OPS', 'ACCOUNTS'], {
    errorMap: () => ({ message: 'Role must be ADMIN, OPS, or ACCOUNTS' })
  }),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional().default('ACTIVE'),
});

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.enum(['ADMIN', 'OPS', 'ACCOUNTS']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
});

export class UserController {
  /**
   * Get all users (Accounts and Ops teams)
   * Query params: role, status, page, limit
   */
  async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const { role, status, page = '1', limit = '50' } = req.query;
      
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const offset = (pageNum - 1) * limitNum;

      const filters = {
        role: role as string | undefined,
        status: status as UserStatus | undefined,
        limit: limitNum,
        offset
      };

      const result = await userService.listUsers(filters);

      ResponseHelper.success(res, {
        users: result.users,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: result.total,
          pages: Math.ceil(result.total / limitNum)
        }
      });
    } catch (error) {
      logger.error('Get users error', { error });
      ResponseHelper.error(res, error instanceof Error ? error.message : 'Failed to fetch users');
    }
  }

  /**
   * Get single user by ID
   */
  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const user = await userService.findById(id);
      if (!user) {
        ResponseHelper.notFound(res, 'User not found');
        return;
      }

      const userDto = userService.mapToUserDto(user);
      ResponseHelper.success(res, userDto);
    } catch (error) {
      logger.error('Get user by ID error', { error });
      ResponseHelper.error(res, error instanceof Error ? error.message : 'Failed to fetch user');
    }
  }

  /**
   * Create new user (Accounts or Ops team member)
   * Sends email with credentials
   */
  async createUser(req: Request, res: Response): Promise<void> {
    try {
      const validation = validateSchema(createUserSchema, req.body);
      
      if (!validation.success) {
        ResponseHelper.validationError(res, validation.errors);
        return;
      }

      const { name, email, role, status } = validation.data;
      const createdBy = req.user?.userId;

      // Create user (password will be auto-generated)
      const result = await userService.createUser(
        {
          name,
          email,
          role,
          password: '', // Will be auto-generated
        },
        createdBy,
        true // Send email
      );

      logger.info('User created via API', { 
        userId: result.user.id, 
        email, 
        role, 
        createdBy 
      });

      ResponseHelper.success(res, {
        user: result.user,
        message: 'User created successfully. Login credentials have been sent to their email.'
      }, 'User created successfully', 201);
    } catch (error) {
      logger.error('Create user error', { error });
      
      if (error instanceof Error && error.message.includes('already exists')) {
        ResponseHelper.error(res, error.message, 409);
        return;
      }
      
      ResponseHelper.error(res, error instanceof Error ? error.message : 'Failed to create user');
    }
  }

  /**
   * Update user details
   */
  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const validation = validateSchema(updateUserSchema, req.body);
      
      if (!validation.success) {
        ResponseHelper.validationError(res, validation.errors);
        return;
      }

      const updateData = validation.data;
      const updatedBy = req.user?.userId;

      // Check if user exists
      const existingUser = await userService.findById(id);
      if (!existingUser) {
        ResponseHelper.notFound(res, 'User not found');
        return;
      }

      // Update user status if provided
      if (updateData.status) {
        await userService.updateUserStatus(id, updateData.status as UserStatus, updatedBy);
      }

      // For now, we'll just return the updated user
      // In a full implementation, you'd add methods to update name, email, role
      const updatedUser = await userService.findById(id);
      const userDto = userService.mapToUserDto(updatedUser!);

      logger.info('User updated', { userId: id, updatedBy });
      ResponseHelper.success(res, userDto, 'User updated successfully');
    } catch (error) {
      logger.error('Update user error', { error });
      ResponseHelper.error(res, error instanceof Error ? error.message : 'Failed to update user');
    }
  }

  /**
   * Activate/Deactivate user
   */
  async toggleUserStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updatedBy = req.user?.userId;

      if (!status || !['ACTIVE', 'INACTIVE'].includes(status)) {
        ResponseHelper.error(res, 'Status must be ACTIVE or INACTIVE');
        return;
      }

      const updatedUser = await userService.updateUserStatus(id, status as UserStatus, updatedBy);

      logger.info('User status toggled', { userId: id, newStatus: status, updatedBy });
      ResponseHelper.success(res, updatedUser, `User ${status.toLowerCase()} successfully`);
    } catch (error) {
      logger.error('Toggle user status error', { error });
      ResponseHelper.error(res, error instanceof Error ? error.message : 'Failed to update user status');
    }
  }

  /**
   * Delete user (hard delete - permanently removes from database)
   */
  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deletedBy = req.user?.userId;

      // Check if user exists
      const existingUser = await userService.findById(id);
      if (!existingUser) {
        ResponseHelper.notFound(res, 'User not found');
        return;
      }

      // Prevent deleting yourself
      if (id === deletedBy) {
        ResponseHelper.error(res, 'You cannot delete your own account', 403);
        return;
      }

      // Check if user is a vendor (vendors should not be deleted directly)
      const isVendor = existingUser.roles.some((ur: { role: { name: string } }) => ur.role.name === 'VENDOR');
      if (isVendor) {
        ResponseHelper.error(res, 'Vendor users cannot be deleted. Please deactivate instead.', 403);
        return;
      }

      await userService.deleteUser(id, deletedBy);

      logger.info('User hard deleted', { userId: id, deletedBy });
      ResponseHelper.success(res, null, 'User deleted successfully');
    } catch (error) {
      logger.error('Delete user error', { error });
      ResponseHelper.error(res, error instanceof Error ? error.message : 'Failed to delete user');
    }
  }
}

export const userController = new UserController();

