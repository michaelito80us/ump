import { Team, Prisma } from '@prisma/client';
import { BaseService, PaginatedResult, ListOptions } from './base.service';
import { ValidationError } from '@ump/core';

export interface CreateTeamInput {
  name: string;
  tournamentId: string;
  sportIds: string;
  seed?: number;
  metadata?: any;
  playerIds?: string[];
}

export interface UpdateTeamInput {
  name?: string;
  sportIds?: string;
  seed?: number;
  metadata?: any;
}

export interface TeamWithRelations extends Team {
  tournament?: any;
  players?: any[];
  matchesA?: any[];
  matchesB?: any[];
}

export class TeamService extends BaseService {
  /**
   * Create a new team
   */
  async create(input: CreateTeamInput): Promise<Team> {
    try {
      this.validateRequired(input, ['name', 'tournamentId', 'sportIds']);

      const teamData: Prisma.TeamCreateInput = {
        name: input.name,
        sportIds: input.sportIds,
        seed: input.seed,
        metadata: this.safeJsonStringify(input.metadata || {}),
        tournaments: {
          connect: [{ id: input.tournamentId }],
        },
        ...(input.playerIds &&
          input.playerIds.length > 0 && {
            players: {
              connect: input.playerIds.map((id) => ({ id })),
            },
          }),
      };

      return await this.db.team.create({
        data: teamData,
      });
    } catch (error: any) {
      this.handlePrismaError(error, 'TeamService.create');
    }
  }

  /**
   * Get team by ID
   */
  async findById(
    id: string,
    includeRelations = false
  ): Promise<TeamWithRelations | null> {
    try {
      const include = includeRelations
        ? {
            tournaments: true,
            players: true,
            matchesA: {
              include: {
                teamB: true,
                phase: true,
              },
            },
            matchesB: {
              include: {
                teamA: true,
                phase: true,
              },
            },
          }
        : undefined;

      const team = await this.db.team.findUnique({
        where: { id },
        include,
      });

      if (team) {
        return {
          ...team,
          metadata: this.safeJsonParse(team.metadata),
        };
      }

      return null;
    } catch (error: any) {
      this.handlePrismaError(error, 'TeamService.findById');
    }
  }

  /**
   * Update team
   */
  async update(id: string, input: UpdateTeamInput): Promise<Team> {
    try {
      const updateData: Prisma.TeamUpdateInput = {};

      if (input.name !== undefined) updateData.name = input.name;
      if (input.sportIds !== undefined) updateData.sportIds = input.sportIds;
      if (input.seed !== undefined) updateData.seed = input.seed;
      if (input.metadata !== undefined)
        updateData.metadata = this.safeJsonStringify(input.metadata);

      const team = await this.db.team.update({
        where: { id },
        data: updateData,
      });

      return {
        ...team,
        metadata: this.safeJsonParse(team.metadata),
      };
    } catch (error: any) {
      this.handlePrismaError(error, 'TeamService.update');
    }
  }

  /**
   * Delete team
   */
  async delete(id: string): Promise<Team> {
    try {
      return await this.db.team.delete({
        where: { id },
      });
    } catch (error: any) {
      this.handlePrismaError(error, 'TeamService.delete');
    }
  }

  /**
   * List teams with pagination and filtering
   */
  async list(options: ListOptions = {}): Promise<PaginatedResult<Team>> {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        sortBy = 'name',
        sortOrder = 'asc',
        filters = {},
      } = options;

      const pagination = this.createPaginationOptions(page, limit);
      const searchFilter = this.createTextSearchFilter(search, ['name']);

      const where: Prisma.TeamWhereInput = {
        ...searchFilter,
        ...filters,
      };

      const orderBy: Prisma.TeamOrderByWithRelationInput = {
        [sortBy]: sortOrder,
      };

      const [teams, total] = await Promise.all([
        this.db.team.findMany({
          where,
          orderBy,
          ...pagination,
          include: {
            tournaments: true,
            players: true,
          },
        }),
        this.db.team.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      // Parse JSON fields for all teams
      const parsedTeams = teams.map((team) => ({
        ...team,
        metadata: this.safeJsonParse(team.metadata),
      }));

      return {
        data: parsedTeams,
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
      this.handlePrismaError(error, 'TeamService.list');
    }
  }

  /**
   * Get teams by tournament
   */
  async findByTournament(
    tournamentId: string,
    options: ListOptions = {}
  ): Promise<PaginatedResult<Team>> {
    return this.list({
      ...options,
      filters: {
        ...options.filters,
        tournamentId,
      },
    });
  }

  /**
   * Get teams by sport
   */
  async findBySport(
    sport: string,
    options: ListOptions = {}
  ): Promise<PaginatedResult<Team>> {
    return this.list({
      ...options,
      filters: {
        ...options.filters,
        sportIds: {
          contains: sport,
        },
      },
    });
  }

  /**
   * Add player to team
   */
  async addPlayer(teamId: string, playerId: string): Promise<Team> {
    try {
      return await this.db.team.update({
        where: { id: teamId },
        data: {
          players: {
            connect: { id: playerId },
          },
        },
        include: {
          players: true,
        },
      });
    } catch (error: any) {
      this.handlePrismaError(error, 'TeamService.addPlayer');
    }
  }

  /**
   * Remove player from team
   */
  async removePlayer(teamId: string, playerId: string): Promise<Team> {
    try {
      return await this.db.team.update({
        where: { id: teamId },
        data: {
          players: {
            disconnect: { id: playerId },
          },
        },
        include: {
          players: true,
        },
      });
    } catch (error: any) {
      this.handlePrismaError(error, 'TeamService.removePlayer');
    }
  }

  /**
   * Add multiple players to team
   */
  async addPlayers(teamId: string, playerIds: string[]): Promise<Team> {
    try {
      return await this.db.team.update({
        where: { id: teamId },
        data: {
          players: {
            connect: playerIds.map((id) => ({ id })),
          },
        },
        include: {
          players: true,
        },
      });
    } catch (error: any) {
      this.handlePrismaError(error, 'TeamService.addPlayers');
    }
  }

  /**
   * Remove multiple players from team
   */
  async removePlayers(teamId: string, playerIds: string[]): Promise<Team> {
    try {
      return await this.db.team.update({
        where: { id: teamId },
        data: {
          players: {
            disconnect: playerIds.map((id) => ({ id })),
          },
        },
        include: {
          players: true,
        },
      });
    } catch (error: any) {
      this.handlePrismaError(error, 'TeamService.removePlayers');
    }
  }

  /**
   * Get team statistics
   */
  async getStatistics(teamId: string): Promise<any> {
    try {
      const team = await this.db.team.findUnique({
        where: { id: teamId },
        include: {
          players: true,
          matchesA: {
            where: {
              status: 'final',
            },
          },
          matchesB: {
            where: {
              status: 'final',
            },
          },
        },
      });

      if (!team) {
        throw new ValidationError('Team not found', 'NOT_FOUND', { teamId });
      }

      const allMatches = [...team.matchesA, ...team.matchesB];
      const wins = allMatches.filter((match) => {
        if (match.teamAId === teamId) {
          return match.scoreA > match.scoreB;
        } else {
          return match.scoreB > match.scoreA;
        }
      }).length;

      const losses = allMatches.filter((match) => {
        if (match.teamAId === teamId) {
          return match.scoreA < match.scoreB;
        } else {
          return match.scoreB < match.scoreA;
        }
      }).length;

      const draws = allMatches.filter(
        (match) => match.scoreA === match.scoreB
      ).length;

      const totalPoints = allMatches.reduce((sum, match) => {
        if (match.teamAId === teamId) {
          return sum + match.scoreA;
        } else {
          return sum + match.scoreB;
        }
      }, 0);

      const totalPointsAgainst = allMatches.reduce((sum, match) => {
        if (match.teamAId === teamId) {
          return sum + match.scoreB;
        } else {
          return sum + match.scoreA;
        }
      }, 0);

      return {
        totalPlayers: team.players.length,
        matchesPlayed: allMatches.length,
        wins,
        losses,
        draws,
        winPercentage:
          allMatches.length > 0 ? (wins / allMatches.length) * 100 : 0,
        totalPoints,
        totalPointsAgainst,
        pointsDifference: totalPoints - totalPointsAgainst,
        averagePointsFor:
          allMatches.length > 0 ? totalPoints / allMatches.length : 0,
        averagePointsAgainst:
          allMatches.length > 0 ? totalPointsAgainst / allMatches.length : 0,
      };
    } catch (error: any) {
      this.handlePrismaError(error, 'TeamService.getStatistics');
    }
  }

  /**
   * Check if team exists
   */
  async exists(id: string): Promise<boolean> {
    try {
      const team = await this.db.team.findUnique({
        where: { id },
        select: { id: true },
      });
      return !!team;
    } catch (error: any) {
      this.handlePrismaError(error, 'TeamService.exists');
    }
  }

  /**
   * Check if team name is unique within tournament
   */
  async isNameUniqueInTournament(
    name: string,
    tournamentId: string,
    excludeTeamId?: string
  ): Promise<boolean> {
    try {
      const where: Prisma.TeamWhereInput = {
        name,
        tournaments: {
          some: {
            id: tournamentId,
          },
        },
        ...(excludeTeamId && { id: { not: excludeTeamId } }),
      };

      const team = await this.db.team.findFirst({
        where,
        select: { id: true },
      });

      return !team;
    } catch (error: any) {
      this.handlePrismaError(error, 'TeamService.isNameUniqueInTournament');
    }
  }
}

export const teamService = new TeamService();
