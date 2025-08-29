import { Match, Tournament } from '@ump/core';

// Simple User interface for realtime events
export interface User {
  id: string;
  email: string;
  name?: string;
  clerkId?: string;
}

// Base event interface
export interface BaseEvent {
  id: string;
  type: string;
  timestamp: Date;
  userId?: string;
  tournamentId?: string;
  matchId?: string;
}

// Match-related events
export interface MatchStartedEvent extends BaseEvent {
  type: 'MATCH_STARTED';
  match: Match;
}

export interface MatchScoreUpdatedEvent extends BaseEvent {
  type: 'MATCH_SCORE_UPDATED';
  match: Match;
  previousScore: {
    scoreA: number;
    scoreB: number;
  };
}

export interface MatchCompletedEvent extends BaseEvent {
  type: 'MATCH_COMPLETED';
  match: Match;
  winner: 'A' | 'B' | 'DRAW';
}

export interface MatchStatusChangedEvent extends BaseEvent {
  type: 'MATCH_STATUS_CHANGED';
  match: Match;
  previousStatus: string;
}

// Tournament-related events
export interface TournamentStartedEvent extends BaseEvent {
  type: 'TOURNAMENT_STARTED';
  tournament: Tournament;
}

export interface TournamentCompletedEvent extends BaseEvent {
  type: 'TOURNAMENT_COMPLETED';
  tournament: Tournament;
}

export interface TournamentUpdatedEvent extends BaseEvent {
  type: 'TOURNAMENT_UPDATED';
  tournament: Tournament;
}

// User-related events
export interface UserJoinedEvent extends BaseEvent {
  type: 'USER_JOINED';
  user: User;
  role: 'SPECTATOR' | 'PARTICIPANT' | 'ORGANIZER';
}

export interface UserLeftEvent extends BaseEvent {
  type: 'USER_LEFT';
  user: User;
}

// System-related events
export interface SystemAnnouncementEvent extends BaseEvent {
  type: 'SYSTEM_ANNOUNCEMENT';
  data: {
    message: string;
    level?: 'info' | 'warning' | 'error';
    serverTime?: number;
    [key: string]: any;
  };
}

// Union type for all events
export type RealtimeEvent =
  | MatchStartedEvent
  | MatchScoreUpdatedEvent
  | MatchCompletedEvent
  | MatchStatusChangedEvent
  | TournamentStartedEvent
  | TournamentCompletedEvent
  | TournamentUpdatedEvent
  | UserJoinedEvent
  | UserLeftEvent
  | SystemAnnouncementEvent;

// Event type constants
export const EVENT_TYPES = {
  MATCH_STARTED: 'MATCH_STARTED',
  MATCH_SCORE_UPDATED: 'MATCH_SCORE_UPDATED',
  MATCH_COMPLETED: 'MATCH_COMPLETED',
  MATCH_STATUS_CHANGED: 'MATCH_STATUS_CHANGED',
  TOURNAMENT_STARTED: 'TOURNAMENT_STARTED',
  TOURNAMENT_COMPLETED: 'TOURNAMENT_COMPLETED',
  TOURNAMENT_UPDATED: 'TOURNAMENT_UPDATED',
  USER_JOINED: 'USER_JOINED',
  USER_LEFT: 'USER_LEFT',
  SYSTEM_ANNOUNCEMENT: 'SYSTEM_ANNOUNCEMENT',
} as const;
