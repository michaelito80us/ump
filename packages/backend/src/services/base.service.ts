import { PrismaClient } from '@prisma/client';
import { db } from './database';
import { TournamentError, ValidationError } from '@ump/core';

/**
 * Base service class providing common CRUD operations and utilities
 */
export abstract class BaseService {
  protected db: PrismaClient;

  constructor() {
    this.db = db;
  }

  /**
   * Validates required fields in data object
   */
  protected validateRequired(data: any, fields: string[]): void {
    const missing = fields.filter((field) => {
      const value = data[field];
      return value === undefined || value === null || value === '';
    });

    if (missing.length > 0) {
      throw new ValidationError(
        `Missing required fields: ${missing.join(', ')}`,
        'VALIDATION_ERROR',
        { missingFields: missing }
      );
    }
  }

  /**
   * Validates email format
   */
  protected validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError('Invalid email format', 'VALIDATION_ERROR', {
        email,
      });
    }
  }

  /**
   * Validates date range
   */
  protected validateDateRange(startDate: Date, endDate: Date): void {
    if (startDate >= endDate) {
      throw new ValidationError(
        'Start date must be before end date',
        'VALIDATION_ERROR',
        { startDate, endDate }
      );
    }
  }

  /**
   * Handles Prisma errors and converts them to domain errors
   */
  protected handlePrismaError(error: any, context: string): never {
    if (error.code === 'P2002') {
      throw new ValidationError(
        `Duplicate entry: ${error.meta?.target?.join(', ') || 'unknown field'}`,
        'DUPLICATE_ENTRY',
        { originalError: error, context }
      );
    }

    if (error.code === 'P2025') {
      throw new TournamentError('Record not found', 'NOT_FOUND', {
        originalError: error,
        context,
      });
    }

    if (error.code === 'P2003') {
      throw new ValidationError(
        'Foreign key constraint failed',
        'FOREIGN_KEY_ERROR',
        { originalError: error, context }
      );
    }

    throw new TournamentError(
      `Database operation failed: ${error.message}`,
      'DATABASE_ERROR',
      { originalError: error, context }
    );
  }

  /**
   * Safely parses JSON string
   */
  protected safeJsonParse(jsonString: string, defaultValue: any = {}): any {
    try {
      return JSON.parse(jsonString);
    } catch {
      return defaultValue;
    }
  }

  /**
   * Safely stringifies JSON object
   */
  protected safeJsonStringify(obj: any): string {
    try {
      return JSON.stringify(obj);
    } catch {
      return '{}';
    }
  }

  /**
   * Creates pagination options
   */
  protected createPaginationOptions(page?: number, limit?: number) {
    const pageNum = Math.max(1, page || 1);
    const limitNum = Math.min(100, Math.max(1, limit || 20));

    return {
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    };
  }

  /**
   * Creates search filter for text fields
   */
  protected createTextSearchFilter(searchTerm?: string, fields: string[] = []) {
    if (!searchTerm || fields.length === 0) {
      return {};
    }

    return {
      OR: fields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: 'insensitive' as const,
        },
      })),
    };
  }
}

/**
 * Interface for paginated results
 */
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Interface for list query options
 */
export interface ListOptions {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}
