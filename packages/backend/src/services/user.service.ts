import { User, Prisma } from '@prisma/client';
import { BaseService, PaginatedResult, ListOptions } from './base.service';

export interface CreateUserInput {
  email: string;
  name?: string;
  avatar?: string;
  role?: string;
  clerkId?: string;
}

export interface UpdateUserInput {
  email?: string;
  name?: string;
  avatar?: string;
  role?: string;
  clerkId?: string;
}

export interface UserWithRelations extends User {
  teams?: any[];
  playerStats?: any[];
  sentInvitations?: any[];
  auditLogs?: any[];
  joinRequests?: any[];
  matchScoreAudits?: any[];
  playerOverrides?: any[];
  createdOverrides?: any[];
}

export class UserService extends BaseService {
  /**
   * Create a new user
   */
  async create(input: CreateUserInput): Promise<User> {
    try {
      this.validateRequired(input, ['email']);
      this.validateEmail(input.email);

      const userData: Prisma.UserCreateInput = {
        email: input.email,
        name: input.name,
        avatar: input.avatar,
        role: input.role || 'user',
        clerkId: input.clerkId,
      };

      return await this.db.user.create({
        data: userData,
      });
    } catch (error: any) {
      this.handlePrismaError(error, 'UserService.create');
    }
  }

  /**
   * Get user by ID
   */
  async findById(
    id: string,
    includeRelations = false
  ): Promise<UserWithRelations | null> {
    try {
      const include = includeRelations
        ? {
            teams: true,
            playerStats: true,
            sentInvitations: true,
            auditLogs: true,
            joinRequests: true,
            matchScoreAudits: true,
            playerOverrides: true,
            createdOverrides: true,
          }
        : undefined;

      return await this.db.user.findUnique({
        where: { id },
        include,
      });
    } catch (error: any) {
      this.handlePrismaError(error, 'UserService.findById');
    }
  }

  /**
   * Get user by email
   */
  async findByEmail(
    email: string,
    includeRelations = false
  ): Promise<UserWithRelations | null> {
    try {
      this.validateEmail(email);

      const include = includeRelations
        ? {
            teams: true,
            playerStats: true,
            sentInvitations: true,
            auditLogs: true,
            joinRequests: true,
            matchScoreAudits: true,
            playerOverrides: true,
            createdOverrides: true,
          }
        : undefined;

      return await this.db.user.findUnique({
        where: { email },
        include,
      });
    } catch (error: any) {
      this.handlePrismaError(error, 'UserService.findByEmail');
    }
  }

  /**
   * Get user by Clerk ID
   */
  async findByClerkId(
    clerkId: string,
    includeRelations = false
  ): Promise<UserWithRelations | null> {
    try {
      const include = includeRelations
        ? {
            teams: true,
            playerStats: true,
            sentInvitations: true,
            auditLogs: true,
            joinRequests: true,
            matchScoreAudits: true,
            playerOverrides: true,
            createdOverrides: true,
          }
        : undefined;

      return await this.db.user.findUnique({
        where: { clerkId },
        include,
      });
    } catch (error: any) {
      this.handlePrismaError(error, 'UserService.findByClerkId');
    }
  }

  /**
   * Update user
   */
  async update(id: string, input: UpdateUserInput): Promise<User> {
    try {
      if (input.email) {
        this.validateEmail(input.email);
      }

      const updateData: Prisma.UserUpdateInput = {};

      if (input.email !== undefined) updateData.email = input.email;
      if (input.name !== undefined) updateData.name = input.name;
      if (input.avatar !== undefined) updateData.avatar = input.avatar;
      if (input.role !== undefined) updateData.role = input.role;
      if (input.clerkId !== undefined) updateData.clerkId = input.clerkId;

      return await this.db.user.update({
        where: { id },
        data: updateData,
      });
    } catch (error: any) {
      this.handlePrismaError(error, 'UserService.update');
    }
  }

  /**
   * Delete user
   */
  async delete(id: string): Promise<User> {
    try {
      return await this.db.user.delete({
        where: { id },
      });
    } catch (error: any) {
      this.handlePrismaError(error, 'UserService.delete');
    }
  }

  /**
   * List users with pagination and filtering
   */
  async list(options: ListOptions = {}): Promise<PaginatedResult<User>> {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        filters = {},
      } = options;

      const pagination = this.createPaginationOptions(page, limit);
      const searchFilter = this.createTextSearchFilter(search, [
        'name',
        'email',
      ]);

      const where: Prisma.UserWhereInput = {
        ...searchFilter,
        ...filters,
      };

      const orderBy: Prisma.UserOrderByWithRelationInput = {
        [sortBy]: sortOrder,
      };

      const [users, total] = await Promise.all([
        this.db.user.findMany({
          where,
          orderBy,
          ...pagination,
        }),
        this.db.user.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: users,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error: any) {
      this.handlePrismaError(error, 'UserService.list');
    }
  }

  /**
   * Get users by role
   */
  async findByRole(
    role: string,
    options: ListOptions = {}
  ): Promise<PaginatedResult<User>> {
    return this.list({
      ...options,
      filters: {
        ...options.filters,
        role,
      },
    });
  }

  /**
   * Get users in a specific team
   */
  async findByTeam(
    teamId: string,
    options: ListOptions = {}
  ): Promise<PaginatedResult<User>> {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        sortBy = 'name',
        sortOrder = 'asc',
      } = options;

      const pagination = this.createPaginationOptions(page, limit);
      const searchFilter = this.createTextSearchFilter(search, [
        'name',
        'email',
      ]);

      const where: Prisma.UserWhereInput = {
        ...searchFilter,
        teams: {
          some: {
            id: teamId,
          },
        },
      };

      const orderBy: Prisma.UserOrderByWithRelationInput = {
        [sortBy]: sortOrder,
      };

      const [users, total] = await Promise.all([
        this.db.user.findMany({
          where,
          orderBy,
          ...pagination,
        }),
        this.db.user.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: users,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error: any) {
      this.handlePrismaError(error, 'UserService.findByTeam');
    }
  }

  /**
   * Check if user exists
   */
  async exists(id: string): Promise<boolean> {
    try {
      const user = await this.db.user.findUnique({
        where: { id },
        select: { id: true },
      });
      return !!user;
    } catch (error: any) {
      this.handlePrismaError(error, 'UserService.exists');
    }
  }

  /**
   * Check if email is already taken
   */
  async isEmailTaken(email: string, excludeUserId?: string): Promise<boolean> {
    try {
      this.validateEmail(email);

      const where: Prisma.UserWhereInput = {
        email,
        ...(excludeUserId && { id: { not: excludeUserId } }),
      };

      const user = await this.db.user.findFirst({
        where,
        select: { id: true },
      });

      return !!user;
    } catch (error: any) {
      this.handlePrismaError(error, 'UserService.isEmailTaken');
    }
  }
}

export const userService = new UserService();
