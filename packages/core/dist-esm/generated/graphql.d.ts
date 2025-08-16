import {
  UseMutationOptions,
  UseQueryOptions,
  UseSuspenseQueryOptions,
  UseInfiniteQueryOptions,
  InfiniteData,
  UseSuspenseInfiniteQueryOptions,
} from '@tanstack/react-query';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<
  T extends {
    [key: string]: unknown;
  },
> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>;
};
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>;
};
export type MakeEmpty<
  T extends {
    [key: string]: unknown;
  },
  K extends keyof T,
> = {
  [_ in K]?: never;
};
export type Incremental<T> =
  | T
  | {
      [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never;
    };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: {
    input: string;
    output: string;
  };
  String: {
    input: string;
    output: string;
  };
  Boolean: {
    input: boolean;
    output: boolean;
  };
  Int: {
    input: number;
    output: number;
  };
  Float: {
    input: number;
    output: number;
  };
  DateTime: {
    input: string;
    output: string;
  };
  JSON: {
    input: any;
    output: any;
  };
};
export type CreateMatchInput = {
  name?: InputMaybe<Scalars['String']['input']>;
  phaseId: Scalars['ID']['input'];
  scheduledAt?: InputMaybe<Scalars['DateTime']['input']>;
  teamAId?: InputMaybe<Scalars['ID']['input']>;
  teamBId?: InputMaybe<Scalars['ID']['input']>;
  venue?: InputMaybe<Scalars['String']['input']>;
};
export type CreatePhaseInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  endDate?: InputMaybe<Scalars['DateTime']['input']>;
  name: Scalars['String']['input'];
  order: Scalars['Int']['input'];
  pluginId?: InputMaybe<Scalars['String']['input']>;
  startDate?: InputMaybe<Scalars['DateTime']['input']>;
  tournamentId: Scalars['ID']['input'];
};
export type CreatePlayerInput = {
  email?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  role: PlayerRole;
  teamId: Scalars['ID']['input'];
};
export type CreateTeamInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  tournamentId: Scalars['ID']['input'];
};
export type CreateTournamentInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  endDate?: InputMaybe<Scalars['DateTime']['input']>;
  maxTeams?: InputMaybe<Scalars['Int']['input']>;
  name: Scalars['String']['input'];
  settings?: InputMaybe<Scalars['JSON']['input']>;
  sport?: InputMaybe<Scalars['String']['input']>;
  startDate?: InputMaybe<Scalars['DateTime']['input']>;
};
export type LeaderboardEntry = {
  __typename?: 'LeaderboardEntry';
  draws: Scalars['Int']['output'];
  goalDifference?: Maybe<Scalars['Int']['output']>;
  goalsAgainst?: Maybe<Scalars['Int']['output']>;
  goalsFor?: Maybe<Scalars['Int']['output']>;
  id: Scalars['ID']['output'];
  losses: Scalars['Int']['output'];
  points: Scalars['Int']['output'];
  position: Scalars['Int']['output'];
  stats?: Maybe<Scalars['JSON']['output']>;
  team: Team;
  teamId: Scalars['ID']['output'];
  tournament: Tournament;
  tournamentId: Scalars['ID']['output'];
  wins: Scalars['Int']['output'];
};
export type Match = {
  __typename?: 'Match';
  completedAt?: Maybe<Scalars['DateTime']['output']>;
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  name?: Maybe<Scalars['String']['output']>;
  phase: Phase;
  phaseId: Scalars['ID']['output'];
  result?: Maybe<Scalars['JSON']['output']>;
  scheduledAt?: Maybe<Scalars['DateTime']['output']>;
  scoreA?: Maybe<Scalars['Int']['output']>;
  scoreB?: Maybe<Scalars['Int']['output']>;
  startedAt?: Maybe<Scalars['DateTime']['output']>;
  status: MatchStatus;
  teamA?: Maybe<Team>;
  teamB?: Maybe<Team>;
  tournament: Tournament;
  tournamentId: Scalars['ID']['output'];
  updatedAt: Scalars['DateTime']['output'];
  venue?: Maybe<Scalars['String']['output']>;
};
export type MatchStatus =
  | 'CANCELLED'
  | 'COMPLETED'
  | 'IN_PROGRESS'
  | 'POSTPONED'
  | 'SCHEDULED';
export type Mutation = {
  __typename?: 'Mutation';
  completeMatch: Match;
  createMatch: Match;
  createPhase: Phase;
  createPlayer: Player;
  createTeam: Team;
  createTournament: Tournament;
  deleteMatch: Scalars['Boolean']['output'];
  deletePhase: Scalars['Boolean']['output'];
  deletePlayer: Scalars['Boolean']['output'];
  deleteTeam: Scalars['Boolean']['output'];
  deleteTournament: Scalars['Boolean']['output'];
  startMatch: Match;
  updateMatch: Match;
  updateMatchScore: Match;
  updatePhase: Phase;
  updatePlayer: Player;
  updateTeam: Team;
  updateTournament: Tournament;
};
export type MutationCompleteMatchArgs = {
  id: Scalars['ID']['input'];
  result: Scalars['JSON']['input'];
};
export type MutationCreateMatchArgs = {
  input: CreateMatchInput;
};
export type MutationCreatePhaseArgs = {
  input: CreatePhaseInput;
};
export type MutationCreatePlayerArgs = {
  input: CreatePlayerInput;
};
export type MutationCreateTeamArgs = {
  input: CreateTeamInput;
};
export type MutationCreateTournamentArgs = {
  input: CreateTournamentInput;
};
export type MutationDeleteMatchArgs = {
  id: Scalars['ID']['input'];
};
export type MutationDeletePhaseArgs = {
  id: Scalars['ID']['input'];
};
export type MutationDeletePlayerArgs = {
  id: Scalars['ID']['input'];
};
export type MutationDeleteTeamArgs = {
  id: Scalars['ID']['input'];
};
export type MutationDeleteTournamentArgs = {
  id: Scalars['ID']['input'];
};
export type MutationStartMatchArgs = {
  id: Scalars['ID']['input'];
};
export type MutationUpdateMatchArgs = {
  id: Scalars['ID']['input'];
  input: UpdateMatchInput;
};
export type MutationUpdateMatchScoreArgs = {
  id: Scalars['ID']['input'];
  score: Scalars['JSON']['input'];
};
export type MutationUpdatePhaseArgs = {
  id: Scalars['ID']['input'];
  input: UpdatePhaseInput;
};
export type MutationUpdatePlayerArgs = {
  id: Scalars['ID']['input'];
  input: UpdatePlayerInput;
};
export type MutationUpdateTeamArgs = {
  id: Scalars['ID']['input'];
  input: UpdateTeamInput;
};
export type MutationUpdateTournamentArgs = {
  id: Scalars['ID']['input'];
  input: UpdateTournamentInput;
};
export type Phase = {
  __typename?: 'Phase';
  createdAt: Scalars['DateTime']['output'];
  endDate?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  matches: Array<Match>;
  name: Scalars['String']['output'];
  order: Scalars['Int']['output'];
  pluginId?: Maybe<Scalars['String']['output']>;
  startDate?: Maybe<Scalars['DateTime']['output']>;
  status: PhaseStatus;
  tournament: Tournament;
  tournamentId: Scalars['ID']['output'];
  updatedAt: Scalars['DateTime']['output'];
};
export type PhaseStatus = 'CANCELLED' | 'COMPLETED' | 'IN_PROGRESS' | 'PENDING';
export type Player = {
  __typename?: 'Player';
  createdAt: Scalars['DateTime']['output'];
  email?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  role: PlayerRole;
  team: Team;
  teamId: Scalars['ID']['output'];
  tournament: Tournament;
  tournamentId: Scalars['ID']['output'];
  updatedAt: Scalars['DateTime']['output'];
};
export type PlayerRole = 'CAPTAIN' | 'COACH' | 'PLAYER' | 'SUBSTITUTE';
export type Query = {
  __typename?: 'Query';
  leaderboard: Array<LeaderboardEntry>;
  match?: Maybe<Match>;
  matches: Array<Match>;
  phase?: Maybe<Phase>;
  phases: Array<Phase>;
  player?: Maybe<Player>;
  players: Array<Player>;
  team?: Maybe<Team>;
  teams: Array<Team>;
  tournament?: Maybe<Tournament>;
  tournaments: Array<Tournament>;
};
export type QueryLeaderboardArgs = {
  tournamentId: Scalars['ID']['input'];
};
export type QueryMatchArgs = {
  id: Scalars['ID']['input'];
};
export type QueryMatchesArgs = {
  phaseId?: InputMaybe<Scalars['ID']['input']>;
  tournamentId?: InputMaybe<Scalars['ID']['input']>;
};
export type QueryPhaseArgs = {
  id: Scalars['ID']['input'];
};
export type QueryPhasesArgs = {
  tournamentId: Scalars['ID']['input'];
};
export type QueryPlayerArgs = {
  id: Scalars['ID']['input'];
};
export type QueryPlayersArgs = {
  teamId?: InputMaybe<Scalars['ID']['input']>;
  tournamentId?: InputMaybe<Scalars['ID']['input']>;
};
export type QueryTeamArgs = {
  id: Scalars['ID']['input'];
};
export type QueryTeamsArgs = {
  tournamentId?: InputMaybe<Scalars['ID']['input']>;
};
export type QueryTournamentArgs = {
  id: Scalars['ID']['input'];
};
export type Subscription = {
  __typename?: 'Subscription';
  leaderboardUpdated: Array<LeaderboardEntry>;
  matchCompleted: Match;
  matchStarted: Match;
  matchUpdated: Match;
  tournamentUpdated: Tournament;
};
export type SubscriptionLeaderboardUpdatedArgs = {
  tournamentId: Scalars['ID']['input'];
};
export type SubscriptionMatchCompletedArgs = {
  tournamentId: Scalars['ID']['input'];
};
export type SubscriptionMatchStartedArgs = {
  tournamentId: Scalars['ID']['input'];
};
export type SubscriptionMatchUpdatedArgs = {
  tournamentId: Scalars['ID']['input'];
};
export type SubscriptionTournamentUpdatedArgs = {
  id: Scalars['ID']['input'];
};
export type Team = {
  __typename?: 'Team';
  captain?: Maybe<Player>;
  captainId?: Maybe<Scalars['ID']['output']>;
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  players: Array<Player>;
  tournament: Tournament;
  tournamentId: Scalars['ID']['output'];
  updatedAt: Scalars['DateTime']['output'];
};
export type Tournament = {
  __typename?: 'Tournament';
  createdAt: Scalars['DateTime']['output'];
  endDate?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  isLocked: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  phases: Array<Phase>;
  settings?: Maybe<Scalars['JSON']['output']>;
  sport?: Maybe<Scalars['String']['output']>;
  startDate?: Maybe<Scalars['DateTime']['output']>;
  status: TournamentStatus;
  teams: Array<Team>;
  updatedAt: Scalars['DateTime']['output'];
};
export type TournamentStatus =
  | 'CANCELLED'
  | 'COMPLETED'
  | 'DRAFT'
  | 'IN_PROGRESS'
  | 'REGISTRATION_CLOSED'
  | 'REGISTRATION_OPEN';
export type UpdateMatchInput = {
  name?: InputMaybe<Scalars['String']['input']>;
  result?: InputMaybe<Scalars['JSON']['input']>;
  scheduledAt?: InputMaybe<Scalars['DateTime']['input']>;
  status?: InputMaybe<MatchStatus>;
  venue?: InputMaybe<Scalars['String']['input']>;
};
export type UpdatePhaseInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  endDate?: InputMaybe<Scalars['DateTime']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  order?: InputMaybe<Scalars['Int']['input']>;
  pluginId?: InputMaybe<Scalars['String']['input']>;
  startDate?: InputMaybe<Scalars['DateTime']['input']>;
  status?: InputMaybe<PhaseStatus>;
};
export type UpdatePlayerInput = {
  email?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  role?: InputMaybe<PlayerRole>;
};
export type UpdateTeamInput = {
  captainId?: InputMaybe<Scalars['ID']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};
export type UpdateTournamentInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  endDate?: InputMaybe<Scalars['DateTime']['input']>;
  isLocked?: InputMaybe<Scalars['Boolean']['input']>;
  maxTeams?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  settings?: InputMaybe<Scalars['JSON']['input']>;
  sport?: InputMaybe<Scalars['String']['input']>;
  startDate?: InputMaybe<Scalars['DateTime']['input']>;
  status?: InputMaybe<TournamentStatus>;
};
export type CreateTournamentAdminTestMutationVariables = Exact<{
  input: CreateTournamentInput;
}>;
export type CreateTournamentAdminTestMutationResult = {
  __typename?: 'Mutation';
  createTournament: {
    __typename?: 'Tournament';
    id: string;
    name: string;
    status: TournamentStatus;
    startDate?: string | null;
    endDate?: string | null;
  };
};
export type UpdateTournamentMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateTournamentInput;
}>;
export type UpdateTournamentMutationResult = {
  __typename?: 'Mutation';
  updateTournament: {
    __typename?: 'Tournament';
    id: string;
    name: string;
    status: TournamentStatus;
    startDate?: string | null;
    endDate?: string | null;
  };
};
export type DeleteTournamentMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;
export type DeleteTournamentMutationResult = {
  __typename?: 'Mutation';
  deleteTournament: boolean;
};
export type GetTournamentDetailsQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;
export type GetTournamentDetailsQueryResult = {
  __typename?: 'Query';
  tournament?: {
    __typename?: 'Tournament';
    id: string;
    name: string;
    status: TournamentStatus;
    startDate?: string | null;
    endDate?: string | null;
    settings?: any | null;
    phases: Array<{
      __typename?: 'Phase';
      id: string;
      name: string;
      matches: Array<{
        __typename?: 'Match';
        id: string;
        scoreA?: number | null;
        scoreB?: number | null;
        status: MatchStatus;
        startedAt?: string | null;
        venue?: string | null;
        teamA?: {
          __typename?: 'Team';
          id: string;
          name: string;
        } | null;
        teamB?: {
          __typename?: 'Team';
          id: string;
          name: string;
        } | null;
      }>;
    }>;
  } | null;
};
export type GetTournamentsMobileTestQueryVariables = Exact<{
  [key: string]: never;
}>;
export type GetTournamentsMobileTestQueryResult = {
  __typename?: 'Query';
  tournaments: Array<{
    __typename?: 'Tournament';
    id: string;
    name: string;
    status: TournamentStatus;
    startDate?: string | null;
    endDate?: string | null;
  }>;
};
export type GetTournamentMobileTestQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;
export type GetTournamentMobileTestQueryResult = {
  __typename?: 'Query';
  tournament?: {
    __typename?: 'Tournament';
    id: string;
    name: string;
    status: TournamentStatus;
    startDate?: string | null;
    endDate?: string | null;
    phases: Array<{
      __typename?: 'Phase';
      id: string;
      name: string;
      matches: Array<{
        __typename?: 'Match';
        id: string;
        scoreA?: number | null;
        scoreB?: number | null;
        status: MatchStatus;
        startedAt?: string | null;
        teamA?: {
          __typename?: 'Team';
          id: string;
          name: string;
        } | null;
        teamB?: {
          __typename?: 'Team';
          id: string;
          name: string;
        } | null;
      }>;
    }>;
  } | null;
};
export type GetMatchesMobileTestQueryVariables = Exact<{
  [key: string]: never;
}>;
export type GetMatchesMobileTestQueryResult = {
  __typename?: 'Query';
  matches: Array<{
    __typename?: 'Match';
    id: string;
    scoreA?: number | null;
    scoreB?: number | null;
    status: MatchStatus;
    startedAt?: string | null;
    teamA?: {
      __typename?: 'Team';
      id: string;
      name: string;
    } | null;
    teamB?: {
      __typename?: 'Team';
      id: string;
      name: string;
    } | null;
  }>;
};
export type TestConnectionQueryVariables = Exact<{
  [key: string]: never;
}>;
export type TestConnectionQueryResult = {
  __typename: 'Query';
};
export type MatchUpdatesApolloSubscriptionVariables = Exact<{
  tournamentId: Scalars['ID']['input'];
}>;
export type MatchUpdatesApolloSubscriptionResult = {
  __typename?: 'Subscription';
  matchUpdated: {
    __typename?: 'Match';
    id: string;
    status: MatchStatus;
    scoreA?: number | null;
    scoreB?: number | null;
  };
};
export type MatchUpdatesSubscriptionVariables = Exact<{
  tournamentId: Scalars['ID']['input'];
}>;
export type MatchUpdatesSubscriptionResult = {
  __typename?: 'Subscription';
  matchUpdated: {
    __typename?: 'Match';
    id: string;
    status: MatchStatus;
    scoreA?: number | null;
    scoreB?: number | null;
  };
};
export type LeaderboardUpdatedMobileSubscriptionVariables = Exact<{
  tournamentId: Scalars['ID']['input'];
}>;
export type LeaderboardUpdatedMobileSubscriptionResult = {
  __typename?: 'Subscription';
  leaderboardUpdated: Array<{
    __typename?: 'LeaderboardEntry';
    teamId: string;
    position: number;
    points: number;
    wins: number;
    losses: number;
    draws: number;
    goalsFor?: number | null;
    goalsAgainst?: number | null;
    goalDifference?: number | null;
  }>;
};
export type MatchUpdatedMobileSubscriptionVariables = Exact<{
  tournamentId: Scalars['ID']['input'];
}>;
export type MatchUpdatedMobileSubscriptionResult = {
  __typename?: 'Subscription';
  matchUpdated: {
    __typename?: 'Match';
    id: string;
    phaseId: string;
    scoreA?: number | null;
    scoreB?: number | null;
    status: MatchStatus;
    scheduledAt?: string | null;
    venue?: string | null;
    updatedAt: string;
    teamA?: {
      __typename?: 'Team';
      id: string;
      name: string;
    } | null;
    teamB?: {
      __typename?: 'Team';
      id: string;
      name: string;
    } | null;
  };
};
export type GetTournamentsQueryVariables = Exact<{
  [key: string]: never;
}>;
export type GetTournamentsQueryResult = {
  __typename?: 'Query';
  tournaments: Array<{
    __typename?: 'Tournament';
    id: string;
    name: string;
    sport?: string | null;
    status: TournamentStatus;
    startDate?: string | null;
    endDate?: string | null;
    isLocked: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
};
export type GetTournamentQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;
export type GetTournamentQueryResult = {
  __typename?: 'Query';
  tournament?: {
    __typename?: 'Tournament';
    id: string;
    name: string;
    sport?: string | null;
    status: TournamentStatus;
    startDate?: string | null;
    endDate?: string | null;
    settings?: any | null;
    isLocked: boolean;
    createdAt: string;
    updatedAt: string;
    phases: Array<{
      __typename?: 'Phase';
      id: string;
      name: string;
      pluginId?: string | null;
      status: PhaseStatus;
      matches: Array<{
        __typename?: 'Match';
        id: string;
        scoreA?: number | null;
        scoreB?: number | null;
        status: MatchStatus;
        scheduledAt?: string | null;
        venue?: string | null;
        teamA?: {
          __typename?: 'Team';
          id: string;
          name: string;
        } | null;
        teamB?: {
          __typename?: 'Team';
          id: string;
          name: string;
        } | null;
      }>;
    }>;
    teams: Array<{
      __typename?: 'Team';
      id: string;
      name: string;
      players: Array<{
        __typename?: 'Player';
        id: string;
        name: string;
        email?: string | null;
        role: PlayerRole;
      }>;
    }>;
  } | null;
};
export type GetMatchesQueryVariables = Exact<{
  [key: string]: never;
}>;
export type GetMatchesQueryResult = {
  __typename?: 'Query';
  matches: Array<{
    __typename?: 'Match';
    id: string;
    scoreA?: number | null;
    scoreB?: number | null;
    status: MatchStatus;
    scheduledAt?: string | null;
    venue?: string | null;
    teamA?: {
      __typename?: 'Team';
      id: string;
      name: string;
    } | null;
    teamB?: {
      __typename?: 'Team';
      id: string;
      name: string;
    } | null;
  }>;
};
export type CreateTournamentMutationVariables = Exact<{
  input: CreateTournamentInput;
}>;
export type CreateTournamentMutationResult = {
  __typename?: 'Mutation';
  createTournament: {
    __typename?: 'Tournament';
    id: string;
    name: string;
    sport?: string | null;
    status: TournamentStatus;
    startDate?: string | null;
    endDate?: string | null;
    settings?: any | null;
    isLocked: boolean;
    createdAt: string;
    updatedAt: string;
  };
};
export type UpdateMatchScoreMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  score: Scalars['JSON']['input'];
}>;
export type UpdateMatchScoreMutationResult = {
  __typename?: 'Mutation';
  updateMatchScore: {
    __typename?: 'Match';
    id: string;
    scoreA?: number | null;
    scoreB?: number | null;
    status: MatchStatus;
    completedAt?: string | null;
  };
};
export type MatchUpdatedSubscriptionVariables = Exact<{
  tournamentId: Scalars['ID']['input'];
}>;
export type MatchUpdatedSubscriptionResult = {
  __typename?: 'Subscription';
  matchUpdated: {
    __typename?: 'Match';
    id: string;
    scoreA?: number | null;
    scoreB?: number | null;
    status: MatchStatus;
    teamA?: {
      __typename?: 'Team';
      id: string;
      name: string;
    } | null;
    teamB?: {
      __typename?: 'Team';
      id: string;
      name: string;
    } | null;
  };
};
export type TournamentUpdatedSubscriptionVariables = Exact<{
  id: Scalars['ID']['input'];
}>;
export type TournamentUpdatedSubscriptionResult = {
  __typename?: 'Subscription';
  tournamentUpdated: {
    __typename?: 'Tournament';
    id: string;
    name: string;
    sport?: string | null;
    status: TournamentStatus;
    updatedAt: string;
    phases: Array<{
      __typename?: 'Phase';
      id: string;
      name: string;
      status: PhaseStatus;
    }>;
  };
};
export type LeaderboardUpdatedSubscriptionVariables = Exact<{
  tournamentId: Scalars['ID']['input'];
}>;
export type LeaderboardUpdatedSubscriptionResult = {
  __typename?: 'Subscription';
  leaderboardUpdated: Array<{
    __typename?: 'LeaderboardEntry';
    position: number;
    points: number;
    wins: number;
    losses: number;
    draws: number;
    stats?: any | null;
    team: {
      __typename?: 'Team';
      id: string;
      name: string;
    };
  }>;
};
export declare const CreateTournamentAdminTestDocument =
  '\n    mutation CreateTournamentAdminTest($input: CreateTournamentInput!) {\n  createTournament(input: $input) {\n    id\n    name\n    status\n    startDate\n    endDate\n  }\n}\n    ';
export declare const useCreateTournamentAdminTestMutation: {
  <TError = unknown, TContext = unknown>(
    dataSource: {
      endpoint: string;
      fetchParams?: RequestInit;
    },
    options?: UseMutationOptions<
      CreateTournamentAdminTestMutationResult,
      TError,
      CreateTournamentAdminTestMutationVariables,
      TContext
    >
  ): import('@tanstack/react-query').UseMutationResult<
    CreateTournamentAdminTestMutationResult,
    TError,
    Exact<{
      input: CreateTournamentInput;
    }>,
    TContext
  >;
  getKey(): string[];
};
export declare const UpdateTournamentDocument =
  '\n    mutation UpdateTournament($id: ID!, $input: UpdateTournamentInput!) {\n  updateTournament(id: $id, input: $input) {\n    id\n    name\n    status\n    startDate\n    endDate\n  }\n}\n    ';
export declare const useUpdateTournamentMutation: {
  <TError = unknown, TContext = unknown>(
    dataSource: {
      endpoint: string;
      fetchParams?: RequestInit;
    },
    options?: UseMutationOptions<
      UpdateTournamentMutationResult,
      TError,
      UpdateTournamentMutationVariables,
      TContext
    >
  ): import('@tanstack/react-query').UseMutationResult<
    UpdateTournamentMutationResult,
    TError,
    Exact<{
      id: Scalars['ID']['input'];
      input: UpdateTournamentInput;
    }>,
    TContext
  >;
  getKey(): string[];
};
export declare const DeleteTournamentDocument =
  '\n    mutation DeleteTournament($id: ID!) {\n  deleteTournament(id: $id)\n}\n    ';
export declare const useDeleteTournamentMutation: {
  <TError = unknown, TContext = unknown>(
    dataSource: {
      endpoint: string;
      fetchParams?: RequestInit;
    },
    options?: UseMutationOptions<
      DeleteTournamentMutationResult,
      TError,
      DeleteTournamentMutationVariables,
      TContext
    >
  ): import('@tanstack/react-query').UseMutationResult<
    DeleteTournamentMutationResult,
    TError,
    Exact<{
      id: Scalars['ID']['input'];
    }>,
    TContext
  >;
  getKey(): string[];
};
export declare const GetTournamentDetailsDocument =
  '\n    query GetTournamentDetails($id: ID!) {\n  tournament(id: $id) {\n    id\n    name\n    status\n    startDate\n    endDate\n    phases {\n      id\n      name\n      matches {\n        id\n        teamA {\n          id\n          name\n        }\n        teamB {\n          id\n          name\n        }\n        scoreA\n        scoreB\n        status\n        startedAt\n        venue\n      }\n    }\n    settings\n  }\n}\n    ';
export declare const useGetTournamentDetailsQuery: {
  <TData = GetTournamentDetailsQueryResult, TError = unknown>(
    dataSource: {
      endpoint: string;
      fetchParams?: RequestInit;
    },
    variables: GetTournamentDetailsQueryVariables,
    options?: Omit<
      UseQueryOptions<GetTournamentDetailsQueryResult, TError, TData>,
      'queryKey'
    > & {
      queryKey?: UseQueryOptions<
        GetTournamentDetailsQueryResult,
        TError,
        TData
      >['queryKey'];
    }
  ): import('@tanstack/react-query').UseQueryResult<TData, TError>;
  document: string;
  getKey(variables: GetTournamentDetailsQueryVariables): (
    | string
    | Exact<{
        id: Scalars['ID']['input'];
      }>
  )[];
};
export declare const useSuspenseGetTournamentDetailsQuery: {
  <TData = GetTournamentDetailsQueryResult, TError = unknown>(
    dataSource: {
      endpoint: string;
      fetchParams?: RequestInit;
    },
    variables: GetTournamentDetailsQueryVariables,
    options?: Omit<
      UseSuspenseQueryOptions<GetTournamentDetailsQueryResult, TError, TData>,
      'queryKey'
    > & {
      queryKey?: UseSuspenseQueryOptions<
        GetTournamentDetailsQueryResult,
        TError,
        TData
      >['queryKey'];
    }
  ): import('@tanstack/react-query').UseSuspenseQueryResult<TData, TError>;
  document: string;
  getKey(variables: GetTournamentDetailsQueryVariables): (
    | string
    | Exact<{
        id: Scalars['ID']['input'];
      }>
  )[];
};
export declare const useInfiniteGetTournamentDetailsQuery: {
  <
    TData = InfiniteData<GetTournamentDetailsQueryResult, unknown>,
    TError = unknown,
  >(
    dataSource: {
      endpoint: string;
      fetchParams?: RequestInit;
    },
    variables: GetTournamentDetailsQueryVariables,
    options: Omit<
      UseInfiniteQueryOptions<GetTournamentDetailsQueryResult, TError, TData>,
      'queryKey'
    > & {
      queryKey?: UseInfiniteQueryOptions<
        GetTournamentDetailsQueryResult,
        TError,
        TData
      >['queryKey'];
    }
  ): import('@tanstack/react-query').UseInfiniteQueryResult<TData, TError>;
  getKey(variables: GetTournamentDetailsQueryVariables): (
    | string
    | Exact<{
        id: Scalars['ID']['input'];
      }>
  )[];
};
export declare const useSuspenseInfiniteGetTournamentDetailsQuery: {
  <
    TData = InfiniteData<GetTournamentDetailsQueryResult, unknown>,
    TError = unknown,
  >(
    dataSource: {
      endpoint: string;
      fetchParams?: RequestInit;
    },
    variables: GetTournamentDetailsQueryVariables,
    options: Omit<
      UseSuspenseInfiniteQueryOptions<
        GetTournamentDetailsQueryResult,
        TError,
        TData
      >,
      'queryKey'
    > & {
      queryKey?: UseSuspenseInfiniteQueryOptions<
        GetTournamentDetailsQueryResult,
        TError,
        TData
      >['queryKey'];
    }
  ): import('@tanstack/react-query').UseSuspenseInfiniteQueryResult<
    TData,
    TError
  >;
  getKey(variables: GetTournamentDetailsQueryVariables): (
    | string
    | Exact<{
        id: Scalars['ID']['input'];
      }>
  )[];
};
export declare const GetTournamentsMobileTestDocument =
  '\n    query GetTournamentsMobileTest {\n  tournaments {\n    id\n    name\n    status\n    startDate\n    endDate\n  }\n}\n    ';
export declare const useGetTournamentsMobileTestQuery: {
  <TData = GetTournamentsMobileTestQueryResult, TError = unknown>(
    dataSource: {
      endpoint: string;
      fetchParams?: RequestInit;
    },
    variables?: GetTournamentsMobileTestQueryVariables,
    options?: Omit<
      UseQueryOptions<GetTournamentsMobileTestQueryResult, TError, TData>,
      'queryKey'
    > & {
      queryKey?: UseQueryOptions<
        GetTournamentsMobileTestQueryResult,
        TError,
        TData
      >['queryKey'];
    }
  ): import('@tanstack/react-query').UseQueryResult<TData, TError>;
  document: string;
  getKey(variables?: GetTournamentsMobileTestQueryVariables): (
    | string
    | Exact<{
        [key: string]: never;
      }>
  )[];
};
export declare const useSuspenseGetTournamentsMobileTestQuery: {
  <TData = GetTournamentsMobileTestQueryResult, TError = unknown>(
    dataSource: {
      endpoint: string;
      fetchParams?: RequestInit;
    },
    variables?: GetTournamentsMobileTestQueryVariables,
    options?: Omit<
      UseSuspenseQueryOptions<
        GetTournamentsMobileTestQueryResult,
        TError,
        TData
      >,
      'queryKey'
    > & {
      queryKey?: UseSuspenseQueryOptions<
        GetTournamentsMobileTestQueryResult,
        TError,
        TData
      >['queryKey'];
    }
  ): import('@tanstack/react-query').UseSuspenseQueryResult<TData, TError>;
  document: string;
  getKey(variables?: GetTournamentsMobileTestQueryVariables): (
    | string
    | Exact<{
        [key: string]: never;
      }>
  )[];
};
export declare const useInfiniteGetTournamentsMobileTestQuery: {
  <
    TData = InfiniteData<GetTournamentsMobileTestQueryResult, unknown>,
    TError = unknown,
  >(
    dataSource: {
      endpoint: string;
      fetchParams?: RequestInit;
    },
    variables: GetTournamentsMobileTestQueryVariables,
    options: Omit<
      UseInfiniteQueryOptions<
        GetTournamentsMobileTestQueryResult,
        TError,
        TData
      >,
      'queryKey'
    > & {
      queryKey?: UseInfiniteQueryOptions<
        GetTournamentsMobileTestQueryResult,
        TError,
        TData
      >['queryKey'];
    }
  ): import('@tanstack/react-query').UseInfiniteQueryResult<TData, TError>;
  getKey(variables?: GetTournamentsMobileTestQueryVariables): (
    | string
    | Exact<{
        [key: string]: never;
      }>
  )[];
};
export declare const useSuspenseInfiniteGetTournamentsMobileTestQuery: {
  <
    TData = InfiniteData<GetTournamentsMobileTestQueryResult, unknown>,
    TError = unknown,
  >(
    dataSource: {
      endpoint: string;
      fetchParams?: RequestInit;
    },
    variables: GetTournamentsMobileTestQueryVariables,
    options: Omit<
      UseSuspenseInfiniteQueryOptions<
        GetTournamentsMobileTestQueryResult,
        TError,
        TData
      >,
      'queryKey'
    > & {
      queryKey?: UseSuspenseInfiniteQueryOptions<
        GetTournamentsMobileTestQueryResult,
        TError,
        TData
      >['queryKey'];
    }
  ): import('@tanstack/react-query').UseSuspenseInfiniteQueryResult<
    TData,
    TError
  >;
  getKey(variables?: GetTournamentsMobileTestQueryVariables): (
    | string
    | Exact<{
        [key: string]: never;
      }>
  )[];
};
export declare const GetTournamentMobileTestDocument =
  '\n    query GetTournamentMobileTest($id: ID!) {\n  tournament(id: $id) {\n    id\n    name\n    status\n    startDate\n    endDate\n    phases {\n      id\n      name\n      matches {\n        id\n        teamA {\n          id\n          name\n        }\n        teamB {\n          id\n          name\n        }\n        scoreA\n        scoreB\n        status\n        startedAt\n      }\n    }\n  }\n}\n    ';
export declare const useGetTournamentMobileTestQuery: {
  <TData = GetTournamentMobileTestQueryResult, TError = unknown>(
    dataSource: {
      endpoint: string;
      fetchParams?: RequestInit;
    },
    variables: GetTournamentMobileTestQueryVariables,
    options?: Omit<
      UseQueryOptions<GetTournamentMobileTestQueryResult, TError, TData>,
      'queryKey'
    > & {
      queryKey?: UseQueryOptions<
        GetTournamentMobileTestQueryResult,
        TError,
        TData
      >['queryKey'];
    }
  ): import('@tanstack/react-query').UseQueryResult<TData, TError>;
  document: string;
  getKey(variables: GetTournamentMobileTestQueryVariables): (
    | string
    | Exact<{
        id: Scalars['ID']['input'];
      }>
  )[];
};
export declare const useSuspenseGetTournamentMobileTestQuery: {
  <TData = GetTournamentMobileTestQueryResult, TError = unknown>(
    dataSource: {
      endpoint: string;
      fetchParams?: RequestInit;
    },
    variables: GetTournamentMobileTestQueryVariables,
    options?: Omit<
      UseSuspenseQueryOptions<
        GetTournamentMobileTestQueryResult,
        TError,
        TData
      >,
      'queryKey'
    > & {
      queryKey?: UseSuspenseQueryOptions<
        GetTournamentMobileTestQueryResult,
        TError,
        TData
      >['queryKey'];
    }
  ): import('@tanstack/react-query').UseSuspenseQueryResult<TData, TError>;
  document: string;
  getKey(variables: GetTournamentMobileTestQueryVariables): (
    | string
    | Exact<{
        id: Scalars['ID']['input'];
      }>
  )[];
};
export declare const useInfiniteGetTournamentMobileTestQuery: {
  <
    TData = InfiniteData<GetTournamentMobileTestQueryResult, unknown>,
    TError = unknown,
  >(
    dataSource: {
      endpoint: string;
      fetchParams?: RequestInit;
    },
    variables: GetTournamentMobileTestQueryVariables,
    options: Omit<
      UseInfiniteQueryOptions<
        GetTournamentMobileTestQueryResult,
        TError,
        TData
      >,
      'queryKey'
    > & {
      queryKey?: UseInfiniteQueryOptions<
        GetTournamentMobileTestQueryResult,
        TError,
        TData
      >['queryKey'];
    }
  ): import('@tanstack/react-query').UseInfiniteQueryResult<TData, TError>;
  getKey(variables: GetTournamentMobileTestQueryVariables): (
    | string
    | Exact<{
        id: Scalars['ID']['input'];
      }>
  )[];
};
export declare const useSuspenseInfiniteGetTournamentMobileTestQuery: {
  <
    TData = InfiniteData<GetTournamentMobileTestQueryResult, unknown>,
    TError = unknown,
  >(
    dataSource: {
      endpoint: string;
      fetchParams?: RequestInit;
    },
    variables: GetTournamentMobileTestQueryVariables,
    options: Omit<
      UseSuspenseInfiniteQueryOptions<
        GetTournamentMobileTestQueryResult,
        TError,
        TData
      >,
      'queryKey'
    > & {
      queryKey?: UseSuspenseInfiniteQueryOptions<
        GetTournamentMobileTestQueryResult,
        TError,
        TData
      >['queryKey'];
    }
  ): import('@tanstack/react-query').UseSuspenseInfiniteQueryResult<
    TData,
    TError
  >;
  getKey(variables: GetTournamentMobileTestQueryVariables): (
    | string
    | Exact<{
        id: Scalars['ID']['input'];
      }>
  )[];
};
export declare const GetMatchesMobileTestDocument =
  '\n    query GetMatchesMobileTest {\n  matches {\n    id\n    teamA {\n      id\n      name\n    }\n    teamB {\n      id\n      name\n    }\n    scoreA\n    scoreB\n    status\n    startedAt\n  }\n}\n    ';
export declare const useGetMatchesMobileTestQuery: {
  <TData = GetMatchesMobileTestQueryResult, TError = unknown>(
    dataSource: {
      endpoint: string;
      fetchParams?: RequestInit;
    },
    variables?: GetMatchesMobileTestQueryVariables,
    options?: Omit<
      UseQueryOptions<GetMatchesMobileTestQueryResult, TError, TData>,
      'queryKey'
    > & {
      queryKey?: UseQueryOptions<
        GetMatchesMobileTestQueryResult,
        TError,
        TData
      >['queryKey'];
    }
  ): import('@tanstack/react-query').UseQueryResult<TData, TError>;
  document: string;
  getKey(variables?: GetMatchesMobileTestQueryVariables): (
    | string
    | Exact<{
        [key: string]: never;
      }>
  )[];
};
export declare const useSuspenseGetMatchesMobileTestQuery: {
  <TData = GetMatchesMobileTestQueryResult, TError = unknown>(
    dataSource: {
      endpoint: string;
      fetchParams?: RequestInit;
    },
    variables?: GetMatchesMobileTestQueryVariables,
    options?: Omit<
      UseSuspenseQueryOptions<GetMatchesMobileTestQueryResult, TError, TData>,
      'queryKey'
    > & {
      queryKey?: UseSuspenseQueryOptions<
        GetMatchesMobileTestQueryResult,
        TError,
        TData
      >['queryKey'];
    }
  ): import('@tanstack/react-query').UseSuspenseQueryResult<TData, TError>;
  document: string;
  getKey(variables?: GetMatchesMobileTestQueryVariables): (
    | string
    | Exact<{
        [key: string]: never;
      }>
  )[];
};
export declare const useInfiniteGetMatchesMobileTestQuery: {
  <
    TData = InfiniteData<GetMatchesMobileTestQueryResult, unknown>,
    TError = unknown,
  >(
    dataSource: {
      endpoint: string;
      fetchParams?: RequestInit;
    },
    variables: GetMatchesMobileTestQueryVariables,
    options: Omit<
      UseInfiniteQueryOptions<GetMatchesMobileTestQueryResult, TError, TData>,
      'queryKey'
    > & {
      queryKey?: UseInfiniteQueryOptions<
        GetMatchesMobileTestQueryResult,
        TError,
        TData
      >['queryKey'];
    }
  ): import('@tanstack/react-query').UseInfiniteQueryResult<TData, TError>;
  getKey(variables?: GetMatchesMobileTestQueryVariables): (
    | string
    | Exact<{
        [key: string]: never;
      }>
  )[];
};
export declare const useSuspenseInfiniteGetMatchesMobileTestQuery: {
  <
    TData = InfiniteData<GetMatchesMobileTestQueryResult, unknown>,
    TError = unknown,
  >(
    dataSource: {
      endpoint: string;
      fetchParams?: RequestInit;
    },
    variables: GetMatchesMobileTestQueryVariables,
    options: Omit<
      UseSuspenseInfiniteQueryOptions<
        GetMatchesMobileTestQueryResult,
        TError,
        TData
      >,
      'queryKey'
    > & {
      queryKey?: UseSuspenseInfiniteQueryOptions<
        GetMatchesMobileTestQueryResult,
        TError,
        TData
      >['queryKey'];
    }
  ): import('@tanstack/react-query').UseSuspenseInfiniteQueryResult<
    TData,
    TError
  >;
  getKey(variables?: GetMatchesMobileTestQueryVariables): (
    | string
    | Exact<{
        [key: string]: never;
      }>
  )[];
};
export declare const TestConnectionDocument =
  '\n    query TestConnection {\n  __typename\n}\n    ';
export declare const useTestConnectionQuery: {
  <TData = TestConnectionQueryResult, TError = unknown>(
    dataSource: {
      endpoint: string;
      fetchParams?: RequestInit;
    },
    variables?: TestConnectionQueryVariables,
    options?: Omit<
      UseQueryOptions<TestConnectionQueryResult, TError, TData>,
      'queryKey'
    > & {
      queryKey?: UseQueryOptions<
        TestConnectionQueryResult,
        TError,
        TData
      >['queryKey'];
    }
  ): import('@tanstack/react-query').UseQueryResult<TData, TError>;
  document: string;
  getKey(variables?: TestConnectionQueryVariables): (
    | string
    | Exact<{
        [key: string]: never;
      }>
  )[];
};
export declare const useSuspenseTestConnectionQuery: {
  <TData = TestConnectionQueryResult, TError = unknown>(
    dataSource: {
      endpoint: string;
      fetchParams?: RequestInit;
    },
    variables?: TestConnectionQueryVariables,
    options?: Omit<
      UseSuspenseQueryOptions<TestConnectionQueryResult, TError, TData>,
      'queryKey'
    > & {
      queryKey?: UseSuspenseQueryOptions<
        TestConnectionQueryResult,
        TError,
        TData
      >['queryKey'];
    }
  ): import('@tanstack/react-query').UseSuspenseQueryResult<TData, TError>;
  document: string;
  getKey(variables?: TestConnectionQueryVariables): (
    | string
    | Exact<{
        [key: string]: never;
      }>
  )[];
};
export declare const useInfiniteTestConnectionQuery: {
  <TData = InfiniteData<TestConnectionQueryResult, unknown>, TError = unknown>(
    dataSource: {
      endpoint: string;
      fetchParams?: RequestInit;
    },
    variables: TestConnectionQueryVariables,
    options: Omit<
      UseInfiniteQueryOptions<TestConnectionQueryResult, TError, TData>,
      'queryKey'
    > & {
      queryKey?: UseInfiniteQueryOptions<
        TestConnectionQueryResult,
        TError,
        TData
      >['queryKey'];
    }
  ): import('@tanstack/react-query').UseInfiniteQueryResult<TData, TError>;
  getKey(variables?: TestConnectionQueryVariables): (
    | string
    | Exact<{
        [key: string]: never;
      }>
  )[];
};
export declare const useSuspenseInfiniteTestConnectionQuery: {
  <TData = InfiniteData<TestConnectionQueryResult, unknown>, TError = unknown>(
    dataSource: {
      endpoint: string;
      fetchParams?: RequestInit;
    },
    variables: TestConnectionQueryVariables,
    options: Omit<
      UseSuspenseInfiniteQueryOptions<TestConnectionQueryResult, TError, TData>,
      'queryKey'
    > & {
      queryKey?: UseSuspenseInfiniteQueryOptions<
        TestConnectionQueryResult,
        TError,
        TData
      >['queryKey'];
    }
  ): import('@tanstack/react-query').UseSuspenseInfiniteQueryResult<
    TData,
    TError
  >;
  getKey(variables?: TestConnectionQueryVariables): (
    | string
    | Exact<{
        [key: string]: never;
      }>
  )[];
};
export declare const MatchUpdatesApolloDocument =
  '\n    subscription MatchUpdatesApollo($tournamentId: ID!) {\n  matchUpdated(tournamentId: $tournamentId) {\n    id\n    status\n    scoreA\n    scoreB\n  }\n}\n    ';
export declare const MatchUpdatesDocument =
  '\n    subscription MatchUpdates($tournamentId: ID!) {\n  matchUpdated(tournamentId: $tournamentId) {\n    id\n    status\n    scoreA\n    scoreB\n  }\n}\n    ';
export declare const LeaderboardUpdatedMobileDocument =
  '\n    subscription LeaderboardUpdatedMobile($tournamentId: ID!) {\n  leaderboardUpdated(tournamentId: $tournamentId) {\n    teamId\n    position\n    points\n    wins\n    losses\n    draws\n    goalsFor\n    goalsAgainst\n    goalDifference\n  }\n}\n    ';
export declare const MatchUpdatedMobileDocument =
  '\n    subscription MatchUpdatedMobile($tournamentId: ID!) {\n  matchUpdated(tournamentId: $tournamentId) {\n    id\n    phaseId\n    teamA {\n      id\n      name\n    }\n    teamB {\n      id\n      name\n    }\n    scoreA\n    scoreB\n    status\n    scheduledAt\n    venue\n    updatedAt\n  }\n}\n    ';
export declare const GetTournamentsDocument =
  '\n    query GetTournaments {\n  tournaments {\n    id\n    name\n    sport\n    status\n    startDate\n    endDate\n    isLocked\n    createdAt\n    updatedAt\n  }\n}\n    ';
export declare const useGetTournamentsQuery: {
  <TData = GetTournamentsQueryResult, TError = unknown>(
    dataSource: {
      endpoint: string;
      fetchParams?: RequestInit;
    },
    variables?: GetTournamentsQueryVariables,
    options?: Omit<
      UseQueryOptions<GetTournamentsQueryResult, TError, TData>,
      'queryKey'
    > & {
      queryKey?: UseQueryOptions<
        GetTournamentsQueryResult,
        TError,
        TData
      >['queryKey'];
    }
  ): import('@tanstack/react-query').UseQueryResult<TData, TError>;
  document: string;
  getKey(variables?: GetTournamentsQueryVariables): (
    | string
    | Exact<{
        [key: string]: never;
      }>
  )[];
};
export declare const useSuspenseGetTournamentsQuery: {
  <TData = GetTournamentsQueryResult, TError = unknown>(
    dataSource: {
      endpoint: string;
      fetchParams?: RequestInit;
    },
    variables?: GetTournamentsQueryVariables,
    options?: Omit<
      UseSuspenseQueryOptions<GetTournamentsQueryResult, TError, TData>,
      'queryKey'
    > & {
      queryKey?: UseSuspenseQueryOptions<
        GetTournamentsQueryResult,
        TError,
        TData
      >['queryKey'];
    }
  ): import('@tanstack/react-query').UseSuspenseQueryResult<TData, TError>;
  document: string;
  getKey(variables?: GetTournamentsQueryVariables): (
    | string
    | Exact<{
        [key: string]: never;
      }>
  )[];
};
export declare const useInfiniteGetTournamentsQuery: {
  <TData = InfiniteData<GetTournamentsQueryResult, unknown>, TError = unknown>(
    dataSource: {
      endpoint: string;
      fetchParams?: RequestInit;
    },
    variables: GetTournamentsQueryVariables,
    options: Omit<
      UseInfiniteQueryOptions<GetTournamentsQueryResult, TError, TData>,
      'queryKey'
    > & {
      queryKey?: UseInfiniteQueryOptions<
        GetTournamentsQueryResult,
        TError,
        TData
      >['queryKey'];
    }
  ): import('@tanstack/react-query').UseInfiniteQueryResult<TData, TError>;
  getKey(variables?: GetTournamentsQueryVariables): (
    | string
    | Exact<{
        [key: string]: never;
      }>
  )[];
};
export declare const useSuspenseInfiniteGetTournamentsQuery: {
  <TData = InfiniteData<GetTournamentsQueryResult, unknown>, TError = unknown>(
    dataSource: {
      endpoint: string;
      fetchParams?: RequestInit;
    },
    variables: GetTournamentsQueryVariables,
    options: Omit<
      UseSuspenseInfiniteQueryOptions<GetTournamentsQueryResult, TError, TData>,
      'queryKey'
    > & {
      queryKey?: UseSuspenseInfiniteQueryOptions<
        GetTournamentsQueryResult,
        TError,
        TData
      >['queryKey'];
    }
  ): import('@tanstack/react-query').UseSuspenseInfiniteQueryResult<
    TData,
    TError
  >;
  getKey(variables?: GetTournamentsQueryVariables): (
    | string
    | Exact<{
        [key: string]: never;
      }>
  )[];
};
export declare const GetTournamentDocument =
  '\n    query GetTournament($id: ID!) {\n  tournament(id: $id) {\n    id\n    name\n    sport\n    status\n    startDate\n    endDate\n    phases {\n      id\n      name\n      pluginId\n      status\n      matches {\n        id\n        teamA {\n          id\n          name\n        }\n        teamB {\n          id\n          name\n        }\n        scoreA\n        scoreB\n        status\n        scheduledAt\n        venue\n      }\n    }\n    teams {\n      id\n      name\n      players {\n        id\n        name\n        email\n        role\n      }\n    }\n    settings\n    isLocked\n    createdAt\n    updatedAt\n  }\n}\n    ';
export declare const useGetTournamentQuery: {
  <TData = GetTournamentQueryResult, TError = unknown>(
    dataSource: {
      endpoint: string;
      fetchParams?: RequestInit;
    },
    variables: GetTournamentQueryVariables,
    options?: Omit<
      UseQueryOptions<GetTournamentQueryResult, TError, TData>,
      'queryKey'
    > & {
      queryKey?: UseQueryOptions<
        GetTournamentQueryResult,
        TError,
        TData
      >['queryKey'];
    }
  ): import('@tanstack/react-query').UseQueryResult<TData, TError>;
  document: string;
  getKey(variables: GetTournamentQueryVariables): (
    | string
    | Exact<{
        id: Scalars['ID']['input'];
      }>
  )[];
};
export declare const useSuspenseGetTournamentQuery: {
  <TData = GetTournamentQueryResult, TError = unknown>(
    dataSource: {
      endpoint: string;
      fetchParams?: RequestInit;
    },
    variables: GetTournamentQueryVariables,
    options?: Omit<
      UseSuspenseQueryOptions<GetTournamentQueryResult, TError, TData>,
      'queryKey'
    > & {
      queryKey?: UseSuspenseQueryOptions<
        GetTournamentQueryResult,
        TError,
        TData
      >['queryKey'];
    }
  ): import('@tanstack/react-query').UseSuspenseQueryResult<TData, TError>;
  document: string;
  getKey(variables: GetTournamentQueryVariables): (
    | string
    | Exact<{
        id: Scalars['ID']['input'];
      }>
  )[];
};
export declare const useInfiniteGetTournamentQuery: {
  <TData = InfiniteData<GetTournamentQueryResult, unknown>, TError = unknown>(
    dataSource: {
      endpoint: string;
      fetchParams?: RequestInit;
    },
    variables: GetTournamentQueryVariables,
    options: Omit<
      UseInfiniteQueryOptions<GetTournamentQueryResult, TError, TData>,
      'queryKey'
    > & {
      queryKey?: UseInfiniteQueryOptions<
        GetTournamentQueryResult,
        TError,
        TData
      >['queryKey'];
    }
  ): import('@tanstack/react-query').UseInfiniteQueryResult<TData, TError>;
  getKey(variables: GetTournamentQueryVariables): (
    | string
    | Exact<{
        id: Scalars['ID']['input'];
      }>
  )[];
};
export declare const useSuspenseInfiniteGetTournamentQuery: {
  <TData = InfiniteData<GetTournamentQueryResult, unknown>, TError = unknown>(
    dataSource: {
      endpoint: string;
      fetchParams?: RequestInit;
    },
    variables: GetTournamentQueryVariables,
    options: Omit<
      UseSuspenseInfiniteQueryOptions<GetTournamentQueryResult, TError, TData>,
      'queryKey'
    > & {
      queryKey?: UseSuspenseInfiniteQueryOptions<
        GetTournamentQueryResult,
        TError,
        TData
      >['queryKey'];
    }
  ): import('@tanstack/react-query').UseSuspenseInfiniteQueryResult<
    TData,
    TError
  >;
  getKey(variables: GetTournamentQueryVariables): (
    | string
    | Exact<{
        id: Scalars['ID']['input'];
      }>
  )[];
};
export declare const GetMatchesDocument =
  '\n    query GetMatches {\n  matches {\n    id\n    teamA {\n      id\n      name\n    }\n    teamB {\n      id\n      name\n    }\n    scoreA\n    scoreB\n    status\n    scheduledAt\n    venue\n  }\n}\n    ';
export declare const useGetMatchesQuery: {
  <TData = GetMatchesQueryResult, TError = unknown>(
    dataSource: {
      endpoint: string;
      fetchParams?: RequestInit;
    },
    variables?: GetMatchesQueryVariables,
    options?: Omit<
      UseQueryOptions<GetMatchesQueryResult, TError, TData>,
      'queryKey'
    > & {
      queryKey?: UseQueryOptions<
        GetMatchesQueryResult,
        TError,
        TData
      >['queryKey'];
    }
  ): import('@tanstack/react-query').UseQueryResult<TData, TError>;
  document: string;
  getKey(variables?: GetMatchesQueryVariables): (
    | string
    | Exact<{
        [key: string]: never;
      }>
  )[];
};
export declare const useSuspenseGetMatchesQuery: {
  <TData = GetMatchesQueryResult, TError = unknown>(
    dataSource: {
      endpoint: string;
      fetchParams?: RequestInit;
    },
    variables?: GetMatchesQueryVariables,
    options?: Omit<
      UseSuspenseQueryOptions<GetMatchesQueryResult, TError, TData>,
      'queryKey'
    > & {
      queryKey?: UseSuspenseQueryOptions<
        GetMatchesQueryResult,
        TError,
        TData
      >['queryKey'];
    }
  ): import('@tanstack/react-query').UseSuspenseQueryResult<TData, TError>;
  document: string;
  getKey(variables?: GetMatchesQueryVariables): (
    | string
    | Exact<{
        [key: string]: never;
      }>
  )[];
};
export declare const useInfiniteGetMatchesQuery: {
  <TData = InfiniteData<GetMatchesQueryResult, unknown>, TError = unknown>(
    dataSource: {
      endpoint: string;
      fetchParams?: RequestInit;
    },
    variables: GetMatchesQueryVariables,
    options: Omit<
      UseInfiniteQueryOptions<GetMatchesQueryResult, TError, TData>,
      'queryKey'
    > & {
      queryKey?: UseInfiniteQueryOptions<
        GetMatchesQueryResult,
        TError,
        TData
      >['queryKey'];
    }
  ): import('@tanstack/react-query').UseInfiniteQueryResult<TData, TError>;
  getKey(variables?: GetMatchesQueryVariables): (
    | string
    | Exact<{
        [key: string]: never;
      }>
  )[];
};
export declare const useSuspenseInfiniteGetMatchesQuery: {
  <TData = InfiniteData<GetMatchesQueryResult, unknown>, TError = unknown>(
    dataSource: {
      endpoint: string;
      fetchParams?: RequestInit;
    },
    variables: GetMatchesQueryVariables,
    options: Omit<
      UseSuspenseInfiniteQueryOptions<GetMatchesQueryResult, TError, TData>,
      'queryKey'
    > & {
      queryKey?: UseSuspenseInfiniteQueryOptions<
        GetMatchesQueryResult,
        TError,
        TData
      >['queryKey'];
    }
  ): import('@tanstack/react-query').UseSuspenseInfiniteQueryResult<
    TData,
    TError
  >;
  getKey(variables?: GetMatchesQueryVariables): (
    | string
    | Exact<{
        [key: string]: never;
      }>
  )[];
};
export declare const CreateTournamentDocument =
  '\n    mutation CreateTournament($input: CreateTournamentInput!) {\n  createTournament(input: $input) {\n    id\n    name\n    sport\n    status\n    startDate\n    endDate\n    settings\n    isLocked\n    createdAt\n    updatedAt\n  }\n}\n    ';
export declare const useCreateTournamentMutation: {
  <TError = unknown, TContext = unknown>(
    dataSource: {
      endpoint: string;
      fetchParams?: RequestInit;
    },
    options?: UseMutationOptions<
      CreateTournamentMutationResult,
      TError,
      CreateTournamentMutationVariables,
      TContext
    >
  ): import('@tanstack/react-query').UseMutationResult<
    CreateTournamentMutationResult,
    TError,
    Exact<{
      input: CreateTournamentInput;
    }>,
    TContext
  >;
  getKey(): string[];
};
export declare const UpdateMatchScoreDocument =
  '\n    mutation UpdateMatchScore($id: ID!, $score: JSON!) {\n  updateMatchScore(id: $id, score: $score) {\n    id\n    scoreA\n    scoreB\n    status\n    completedAt\n  }\n}\n    ';
export declare const useUpdateMatchScoreMutation: {
  <TError = unknown, TContext = unknown>(
    dataSource: {
      endpoint: string;
      fetchParams?: RequestInit;
    },
    options?: UseMutationOptions<
      UpdateMatchScoreMutationResult,
      TError,
      UpdateMatchScoreMutationVariables,
      TContext
    >
  ): import('@tanstack/react-query').UseMutationResult<
    UpdateMatchScoreMutationResult,
    TError,
    Exact<{
      id: Scalars['ID']['input'];
      score: Scalars['JSON']['input'];
    }>,
    TContext
  >;
  getKey(): string[];
};
export declare const MatchUpdatedDocument =
  '\n    subscription MatchUpdated($tournamentId: ID!) {\n  matchUpdated(tournamentId: $tournamentId) {\n    id\n    teamA {\n      id\n      name\n    }\n    teamB {\n      id\n      name\n    }\n    scoreA\n    scoreB\n    status\n  }\n}\n    ';
export declare const TournamentUpdatedDocument =
  '\n    subscription TournamentUpdated($id: ID!) {\n  tournamentUpdated(id: $id) {\n    id\n    name\n    sport\n    status\n    phases {\n      id\n      name\n      status\n    }\n    updatedAt\n  }\n}\n    ';
export declare const LeaderboardUpdatedDocument =
  '\n    subscription LeaderboardUpdated($tournamentId: ID!) {\n  leaderboardUpdated(tournamentId: $tournamentId) {\n    team {\n      id\n      name\n    }\n    position\n    points\n    wins\n    losses\n    draws\n    stats\n  }\n}\n    ';
//# sourceMappingURL=graphql.d.ts.map
