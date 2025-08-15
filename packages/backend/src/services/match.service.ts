import { Match, Prisma } from '@prisma/client';
import { BaseService, PaginatedResult, ListOptions } from './base.service';
import { ValidationError } from '@ump/core';
import { auditLogger, AuditContext } from './auditLogIntegration';

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
  async create(
    input: CreateMatchInput,
    auditContext?: AuditContext
  ): Promise<Match> {
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

      const match = await this.db.match.create({
        data: matchData,
      });

      // Log the match creation
      if (auditContext) {
        await auditLogger.logMatchOperation('create', match, auditContext, {
          phaseId: input.phaseId,
          teamAId: input.teamAId,
          teamBId: input.teamBId,
          initialScore: {
            scoreA: match.scoreA,
            scoreB: match.scoreB,
          },
        });
      }

      return match;
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
  async update(
    id: string,
    input: UpdateMatchInput,
    auditContext?: AuditContext
  ): Promise<Match> {
    try {
      // Get current match for audit logging
      const currentMatch = await this.db.match.findUnique({
        where: { id },
        include: {
          phase: {
            include: {
              tournament: true,
            },
          },
        },
      });

      if (!currentMatch) {
        throw new ValidationError('Match not found');
      }

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

      // Log the match update
      if (auditContext) {
        await auditLogger.logMatchOperation(
          'update',
          match,
          {
            ...auditContext,
            tournamentId:
              auditContext.tournamentId || currentMatch.phase.tournament.id,
          },
          {
            previousData: {
              scoreA: currentMatch.scoreA,
              scoreB: currentMatch.scoreB,
              status: currentMatch.status,
              venue: currentMatch.venue,
            },
            updatedFields: Object.keys(input),
          }
        );

        // Special logging for score submissions (T-11.2 requirement)
        if (input.scoreA !== undefined || input.scoreB !== undefined) {
          await auditLogger.logScoreSubmission(
            match,
            {
              ...auditContext,
              tournamentId:
                auditContext.tournamentId || currentMatch.phase.tournament.id,
            },
            {
              previousScoreA: currentMatch.scoreA,
              previousScoreB: currentMatch.scoreB,
              newScoreA: match.scoreA,
              newScoreB: match.scoreB,
              breakdown: input.breakdown,
            }
          );
        }
      }

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
  async delete(id: string, auditContext?: AuditContext): Promise<Match> {
    try {
      // Get match data before deletion for audit logging
      const matchToDelete = await this.db.match.findUnique({
        where: { id },
        include: {
          phase: {
            include: {
              tournament: true,
            },
          },
        },
      });

      if (!matchToDelete) {
        throw new ValidationError('Match not found');
      }

      const deletedMatch = await this.db.match.delete({
        where: { id },
      });

      // Log the match deletion
      if (auditContext) {
        await auditLogger.logMatchOperation(
          'delete',
          deletedMatch,
          {
            ...auditContext,
            tournamentId:
              auditContext.tournamentId || matchToDelete.phase.tournament.id,
          },
          {
            deletedData: {
              scoreA: deletedMatch.scoreA,
              scoreB: deletedMatch.scoreB,
              status: deletedMatch.status,
              venue: deletedMatch.venue,
              scheduledTime: deletedMatch.scheduledTime,
            },
          }
        );
      }

      return deletedMatch;
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
