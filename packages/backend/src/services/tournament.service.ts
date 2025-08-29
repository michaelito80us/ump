import { Tournament, Prisma } from '@prisma/client';
import { BaseService, PaginatedResult, ListOptions } from './base.service';
import { ValidationError } from '@ump/core/backend';
import { auditLogger, AuditContext } from './auditLogIntegration';

export interface CreateTournamentInput {
  pluginId: string;
  name: string;
  description?: string;
  sport: string;
  status?: string;
  config?: any;
  metadata?: any;
  isLocked?: boolean;
  startDate?: Date;
  endDate?: Date;
}

export interface UpdateTournamentInput {
  pluginId?: string;
  name?: string;
  description?: string;
  sport?: string;
  status?: string;
  config?: any;
  metadata?: any;
  isLocked?: boolean;
  startDate?: Date;
  endDate?: Date;
}

export interface TournamentWithRelations extends Tournament {
  teams?: any[];
  phases?: any[];
  invitations?: any[];
  joinRequests?: any[];
  auditLogs?: any[];
  playerOverrides?: any[];
}

export class TournamentService extends BaseService {
  /**
   * Create a new tournament
   */
  async create(
    input: CreateTournamentInput,
    creatorId: string
  ): Promise<Tournament> {
    try {
      this.validateRequired(input, ['pluginId', 'name', 'sport']);

      if (input.startDate && input.endDate) {
        this.validateDateRange(input.startDate, input.endDate);
      }

      const tournamentData: Prisma.TournamentCreateInput = {
        pluginId: input.pluginId,
        name: input.name,
        description: input.description,
        sport: input.sport,
        status: input.status || 'NOT_STARTED',
        config: this.safeJsonStringify(input.config || {}),
        metadata: this.safeJsonStringify(input.metadata || {}),
        isLocked: input.isLocked || false,
        startDate: input.startDate,
        endDate: input.endDate,
        creator: {
          connect: { id: creatorId },
        },
      };

      return await this.db.tournament.create({
        data: tournamentData,
      });
    } catch (error: any) {
      this.handlePrismaError(error, 'TournamentService.create');
    }
  }

  /**
   * Get tournament by ID
   */
  async findById(
    id: string,
    includeRelations = false
  ): Promise<TournamentWithRelations | null> {
    try {
      const include = includeRelations
        ? {
            teams: {
              include: {
                players: true,
              },
            },
            phases: {
              include: {
                matches: {
                  include: {
                    teamA: true,
                    teamB: true,
                  },
                },
              },
            },
            invitations: true,
            joinRequests: true,
            auditLogs: true,
            playerOverrides: true,
          }
        : undefined;

      const tournament = await this.db.tournament.findUnique({
        where: { id },
        include,
      });

      if (tournament) {
        // Parse JSON fields
        return {
          ...tournament,
          config: this.safeJsonParse(tournament.config),
          metadata: this.safeJsonParse(tournament.metadata),
        };
      }

      return null;
    } catch (error: any) {
      this.handlePrismaError(error, 'TournamentService.findById');
    }
  }

  /**
   * Update tournament
   */
  async update(
    id: string,
    input: UpdateTournamentInput,
    auditContext?: AuditContext
  ): Promise<Tournament> {
    try {
      if (input.startDate && input.endDate) {
        this.validateDateRange(input.startDate, input.endDate);
      }

      const updateData: Prisma.TournamentUpdateInput = {};

      if (input.pluginId !== undefined) updateData.pluginId = input.pluginId;
      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined)
        updateData.description = input.description;
      if (input.sport !== undefined) updateData.sport = input.sport;
      if (input.status !== undefined) updateData.status = input.status;
      if (input.config !== undefined)
        updateData.config = this.safeJsonStringify(input.config);
      if (input.metadata !== undefined)
        updateData.metadata = this.safeJsonStringify(input.metadata);
      if (input.isLocked !== undefined) updateData.isLocked = input.isLocked;
      if (input.startDate !== undefined) updateData.startDate = input.startDate;
      if (input.endDate !== undefined) updateData.endDate = input.endDate;

      const tournament = await this.db.tournament.update({
        where: { id },
        data: updateData,
      });

      if (auditContext) {
        await auditLogger.logTournamentOperation(
          'update',
          tournament.id,
          auditContext,
          {
            updatedFields: Object.keys(input),
            name: tournament.name,
            status: tournament.status,
          }
        );
      }

      return {
        ...tournament,
        config: this.safeJsonParse(tournament.config),
        metadata: this.safeJsonParse(tournament.metadata),
      };
    } catch (error: any) {
      if (auditContext) {
        await auditLogger.logTournamentOperation('update', id, auditContext, {
          updatedFields: Object.keys(input),
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
      this.handlePrismaError(error, 'TournamentService.update');
    }
  }

  /**
   * Delete tournament
   */
  async delete(id: string): Promise<Tournament> {
    try {
      return await this.db.tournament.delete({
        where: { id },
      });
    } catch (error: any) {
      this.handlePrismaError(error, 'TournamentService.delete');
    }
  }

  /**
   * List tournaments with pagination and filtering
   */
  async list(options: ListOptions = {}): Promise<PaginatedResult<Tournament>> {
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
        'description',
      ]);

      const where: Prisma.TournamentWhereInput = {
        ...searchFilter,
        ...filters,
      };

      const orderBy: Prisma.TournamentOrderByWithRelationInput = {
        [sortBy]: sortOrder,
      };

      const [tournaments, total] = await Promise.all([
        this.db.tournament.findMany({
          where,
          orderBy,
          ...pagination,
        }),
        this.db.tournament.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      // Parse JSON fields for all tournaments
      const parsedTournaments = tournaments.map((tournament) => ({
        ...tournament,
        config: this.safeJsonParse(tournament.config),
        metadata: this.safeJsonParse(tournament.metadata),
      }));

      return {
        data: parsedTournaments,
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
      this.handlePrismaError(error, 'TournamentService.list');
    }
  }

  /**
   * Get tournaments by status
   */
  async findByStatus(
    status: string,
    options: ListOptions = {}
  ): Promise<PaginatedResult<Tournament>> {
    return this.list({
      ...options,
      filters: {
        ...options.filters,
        status,
      },
    });
  }

  /**
   * Get tournaments by sport
   */
  async findBySport(
    sport: string,
    options: ListOptions = {}
  ): Promise<PaginatedResult<Tournament>> {
    return this.list({
      ...options,
      filters: {
        ...options.filters,
        sport,
      },
    });
  }

  /**
   * Get upcoming tournaments
   */
  async findUpcoming(
    options: ListOptions = {}
  ): Promise<PaginatedResult<Tournament>> {
    const now = new Date();
    return this.list({
      ...options,
      filters: {
        ...options.filters,
        startDate: {
          gte: now,
        },
        status: {
          in: ['NOT_STARTED', 'LIVE'],
        },
      },
      sortBy: 'startDate',
      sortOrder: 'asc',
    });
  }

  /**
   * Get live tournaments
   */
  async findLive(
    options: ListOptions = {}
  ): Promise<PaginatedResult<Tournament>> {
    return this.list({
      ...options,
      filters: {
        ...options.filters,
        status: 'LIVE',
      },
    });
  }

  /**
   * Lock/unlock tournament
   */
  async setLocked(id: string, isLocked: boolean): Promise<Tournament> {
    return this.update(id, { isLocked });
  }

  /**
   * Update tournament status
   */
  async updateStatus(id: string, status: string): Promise<Tournament> {
    const validStatuses = ['NOT_STARTED', 'LIVE', 'COMPLETED'];
    if (!validStatuses.includes(status)) {
      throw new ValidationError(
        `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        'VALIDATION_ERROR',
        { status, validStatuses }
      );
    }

    return this.update(id, { status });
  }

  /**
   * Get tournament statistics
   */
  async getStatistics(id: string): Promise<any> {
    try {
      const tournament = await this.db.tournament.findUnique({
        where: { id },
        include: {
          teams: {
            include: {
              players: true,
            },
          },
          phases: {
            include: {
              matches: true,
            },
          },
        },
      });

      if (!tournament) {
        throw new ValidationError('Tournament not found', 'NOT_FOUND', { id });
      }

      const totalTeams = tournament.teams.length;
      const totalPlayers = tournament.teams.reduce(
        (sum, team) => sum + team.players.length,
        0
      );
      const totalMatches = tournament.phases.reduce(
        (sum, phase) => sum + phase.matches.length,
        0
      );
      const completedMatches = tournament.phases.reduce(
        (sum, phase) =>
          sum +
          phase.matches.filter((match) => match.status === 'final').length,
        0
      );
      const liveMatches = tournament.phases.reduce(
        (sum, phase) =>
          sum + phase.matches.filter((match) => match.status === 'live').length,
        0
      );

      return {
        totalTeams,
        totalPlayers,
        totalMatches,
        completedMatches,
        liveMatches,
        pendingMatches: totalMatches - completedMatches - liveMatches,
        completionPercentage:
          totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0,
      };
    } catch (error: any) {
      this.handlePrismaError(error, 'TournamentService.getStatistics');
    }
  }

  /**
   * Check if tournament exists
   */
  async exists(id: string): Promise<boolean> {
    try {
      const tournament = await this.db.tournament.findUnique({
        where: { id },
        select: { id: true },
      });
      return !!tournament;
    } catch (error: any) {
      this.handlePrismaError(error, 'TournamentService.exists');
    }
  }
}

export const tournamentService = new TournamentService();
