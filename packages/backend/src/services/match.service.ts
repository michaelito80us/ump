import { Match, Prisma } from '@prisma/client';
import { BaseService, PaginatedResult, ListOptions } from './base.service';
import { ValidationError } from '@ump/core';

export interface CreateMatchInput {
  phaseId: string;
  teamAId?: string;
  teamBId?: string;
  scoreA?: number;
  scoreB?: number;
  breakdown?: any;
  scheduledTime?: Date;
  venue?: string;
  status?: string;
}

export interface UpdateMatchInput {
  teamAId?: string;
  teamBId?: string;
  scoreA?: number;
  scoreB?: number;
  breakdown?: any;
  scheduledTime?: Date;
  venue?: string;
  status?: string;
}

export interface MatchWithRelations extends Match {
  phase?: any;
  teamA?: any;
  teamB?: any;
  scoreAudits?: any[];
}

export class MatchService extends BaseService {
  /**
   * Create a new match
   */
  async create(input: CreateMatchInput): Promise<Match> {
    try {
      this.validateRequired(input, ['phaseId', 'teamAId', 'teamBId']);

      const matchData: Prisma.MatchCreateInput = {
        scoreA: input.scoreA || 0,
        scoreB: input.scoreB || 0,
        breakdown: this.safeJsonStringify(input.breakdown || {}),
        scheduledTime: input.scheduledTime,
        venue: input.venue,
        status: input.status || 'pending',
        phase: {
          connect: { id: input.phaseId },
        },
        teamA: {
          connect: { id: input.teamAId! },
        },
        teamB: {
          connect: { id: input.teamBId! },
        },
      };

      return await this.db.match.create({
        data: matchData,
      });
    } catch (error: any) {
      this.handlePrismaError(error, 'MatchService.create');
    }
  }

  /**
   * Get match by ID
   */
  async findById(
    id: string,
    includeRelations = false
  ): Promise<MatchWithRelations | null> {
    try {
      const include = includeRelations
        ? {
            phase: {
              include: {
                tournament: true,
              },
            },
            teamA: {
              include: {
                players: true,
              },
            },
            teamB: {
              include: {
                players: true,
              },
            },
            scoreAudits: {
              orderBy: {
                submittedAt: 'desc' as const,
              },
            },
          }
        : undefined;

      const match = await this.db.match.findUnique({
        where: { id },
        include,
      });

      if (match) {
        return {
          ...match,
          breakdown: this.safeJsonParse(match.breakdown || '{}'),
        };
      }

      return null;
    } catch (error: any) {
      this.handlePrismaError(error, 'MatchService.findById');
    }
  }

  /**
   * Update match
   */
  async update(id: string, input: UpdateMatchInput): Promise<Match> {
    try {
      const updateData: Prisma.MatchUpdateInput = {};

      if (input.teamAId !== undefined) {
        updateData.teamA = input.teamAId
          ? { connect: { id: input.teamAId } }
          : undefined;
      }
      if (input.teamBId !== undefined) {
        updateData.teamB = input.teamBId
          ? { connect: { id: input.teamBId } }
          : undefined;
      }
      if (input.scoreA !== undefined) updateData.scoreA = input.scoreA;
      if (input.scoreB !== undefined) updateData.scoreB = input.scoreB;
      if (input.breakdown !== undefined)
        updateData.breakdown = this.safeJsonStringify(input.breakdown);
      if (input.scheduledTime !== undefined)
        updateData.scheduledTime = input.scheduledTime;
      if (input.venue !== undefined) updateData.venue = input.venue;
      if (input.status !== undefined) updateData.status = input.status;

      const match = await this.db.match.update({
        where: { id },
        data: updateData,
      });

      return {
        ...match,
        breakdown: this.safeJsonParse(match.breakdown || '{}'),
      };
    } catch (error: any) {
      this.handlePrismaError(error, 'MatchService.update');
    }
  }

  /**
   * Delete match
   */
  async delete(id: string): Promise<Match> {
    try {
      return await this.db.match.delete({
        where: { id },
      });
    } catch (error: any) {
      this.handlePrismaError(error, 'MatchService.delete');
    }
  }

  /**
   * List matches with pagination and filtering
   */
  async list(options: ListOptions = {}): Promise<PaginatedResult<Match>> {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        sortBy = 'scheduledTime',
        sortOrder = 'asc',
        filters = {},
      } = options;

      const pagination = this.createPaginationOptions(page, limit);
      const searchFilter = this.createTextSearchFilter(search, ['venue']);

      const where: Prisma.MatchWhereInput = {
        ...searchFilter,
        ...filters,
      };

      const orderBy: Prisma.MatchOrderByWithRelationInput = {
        [sortBy]: sortOrder,
      };

      const [matches, total] = await Promise.all([
        this.db.match.findMany({
          where,
          orderBy,
          ...pagination,
          include: {
            phase: true,
            teamA: true,
            teamB: true,
          },
        }),
        this.db.match.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      // Parse JSON fields for all matches
      const parsedMatches = matches.map((match) => ({
        ...match,
        breakdown: this.safeJsonParse(match.breakdown || '{}'),
      }));

      return {
        data: parsedMatches,
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
      this.handlePrismaError(error, 'MatchService.list');
    }
  }

  /**
   * Get matches by phase
   */
  async findByPhase(
    phaseId: string,
    options: ListOptions = {}
  ): Promise<PaginatedResult<Match>> {
    return this.list({
      ...options,
      filters: {
        ...options.filters,
        phaseId,
      },
    });
  }

  /**
   * Get matches by tournament
   */
  async findByTournament(
    tournamentId: string,
    options: ListOptions = {}
  ): Promise<PaginatedResult<Match>> {
    return this.list({
      ...options,
      filters: {
        ...options.filters,
        phase: {
          tournamentId,
        },
      },
    });
  }

  /**
   * Get matches by team
   */
  async findByTeam(
    teamId: string,
    options: ListOptions = {}
  ): Promise<PaginatedResult<Match>> {
    return this.list({
      ...options,
      filters: {
        ...options.filters,
        OR: [{ teamAId: teamId }, { teamBId: teamId }],
      },
    });
  }

  /**
   * Get matches by status
   */
  async findByStatus(
    status: string,
    options: ListOptions = {}
  ): Promise<PaginatedResult<Match>> {
    return this.list({
      ...options,
      filters: {
        ...options.filters,
        status,
      },
    });
  }

  /**
   * Get live matches
   */
  async findLive(options: ListOptions = {}): Promise<PaginatedResult<Match>> {
    return this.findByStatus('live', options);
  }

  /**
   * Get upcoming matches
   */
  async findUpcoming(
    options: ListOptions = {}
  ): Promise<PaginatedResult<Match>> {
    const now = new Date();
    return this.list({
      ...options,
      filters: {
        ...options.filters,
        status: 'pending',
        scheduledTime: {
          gte: now,
        },
      },
      sortBy: 'scheduledTime',
      sortOrder: 'asc',
    });
  }

  /**
   * Get recent matches
   */
  async findRecent(options: ListOptions = {}): Promise<PaginatedResult<Match>> {
    return this.list({
      ...options,
      filters: {
        ...options.filters,
        status: 'final',
      },
      sortBy: 'scheduledTime',
      sortOrder: 'desc',
    });
  }

  /**
   * Update match score
   */
  async updateScore(
    id: string,
    scoreA: number,
    scoreB: number,
    breakdown?: any,
    submittedBy?: string
  ): Promise<Match> {
    try {
      return await this.db.$transaction(async (tx) => {
        // Update the match
        const match = await tx.match.update({
          where: { id },
          data: {
            scoreA,
            scoreB,
            ...(breakdown && { breakdown: this.safeJsonStringify(breakdown) }),
          },
        });

        // Create score audit entry if submittedBy is provided
        if (submittedBy) {
          await tx.matchScoreAudit.create({
            data: {
              matchId: id,
              submittedBy: submittedBy,
              breakdown: this.safeJsonStringify(breakdown || {}),
              scoreA,
              scoreB,
              source: 'manual',
            },
          });
        }

        return {
          ...match,
          breakdown: this.safeJsonParse(match.breakdown || '{}'),
        };
      });
    } catch (error: any) {
      this.handlePrismaError(error, 'MatchService.updateScore');
    }
  }

  /**
   * Update match status
   */
  async updateStatus(id: string, status: string): Promise<Match> {
    const validStatuses = ['pending', 'live', 'final', 'needs_approval'];
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
   * Start match (set status to live)
   */
  async startMatch(id: string): Promise<Match> {
    return this.updateStatus(id, 'live');
  }

  /**
   * End match (set status to final)
   */
  async endMatch(id: string): Promise<Match> {
    return this.updateStatus(id, 'final');
  }

  /**
   * Get match score history
   */
  async getScoreHistory(matchId: string): Promise<any[]> {
    try {
      const scoreAudits = await this.db.matchScoreAudit.findMany({
        where: { matchId },

        orderBy: {
          submittedAt: 'asc',
        },
      });

      return scoreAudits.map((audit) => ({
        ...audit,
        breakdown: this.safeJsonParse(audit.breakdown || '{}'),
      }));
    } catch (error: any) {
      this.handlePrismaError(error, 'MatchService.getScoreHistory');
    }
  }

  /**
   * Check if match exists
   */
  async exists(id: string): Promise<boolean> {
    try {
      const match = await this.db.match.findUnique({
        where: { id },
        select: { id: true },
      });
      return !!match;
    } catch (error: any) {
      this.handlePrismaError(error, 'MatchService.exists');
    }
  }

  /**
   * Check for scheduling conflicts
   */
  async checkSchedulingConflicts(
    teamIds: string[],
    scheduledTime: Date,
    excludeMatchId?: string
  ): Promise<Match[]> {
    try {
      const timeBuffer = 2 * 60 * 60 * 1000; // 2 hours buffer
      const startTime = new Date(scheduledTime.getTime() - timeBuffer);
      const endTime = new Date(scheduledTime.getTime() + timeBuffer);

      const where: Prisma.MatchWhereInput = {
        OR: [{ teamAId: { in: teamIds } }, { teamBId: { in: teamIds } }],
        scheduledTime: {
          gte: startTime,
          lte: endTime,
        },
        status: {
          in: ['pending', 'live'],
        },
        ...(excludeMatchId && { id: { not: excludeMatchId } }),
      };

      return await this.db.match.findMany({
        where,
        include: {
          teamA: true,
          teamB: true,
          phase: {
            include: {
              tournament: true,
            },
          },
        },
      });
    } catch (error: any) {
      this.handlePrismaError(error, 'MatchService.checkSchedulingConflicts');
    }
  }
}

export const matchService = new MatchService();
