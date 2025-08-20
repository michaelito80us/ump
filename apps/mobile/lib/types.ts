// Client-only types and utilities from @ump/core
// This file avoids importing server-only modules

// Re-export only the types we need for client components
export type MatchStatus = 'PENDING' | 'LIVE' | 'FINAL' | 'NEEDS_APPROVAL' | 'CANCELLED';

export interface Match {
  id: string;
  scoreA: number;
  scoreB: number;
  breakdown?: Record<string, unknown>;
  scheduledTime?: string;
  venue?: string;
  status: MatchStatus;
  phaseId: string;
  teamA: Team;
  teamB: Team;
}

export interface Team {
  id: string;
  name: string;
  sportIds: string[];
  playerIds: string[];
  managers: string[];
  tournaments: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Player {
  id: string;
  userId: string;
  sports: string[];
  user: User;
  teams: Team[];
}

export interface User {
  id: string;
  email: string;
  name?: string;
  clerkId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tournament {
  id: string;
  pluginId: string;
  name: string;
  sport: string;
  status: 'NOT_STARTED' | 'LIVE' | 'COMPLETED';
  config: Record<string, unknown>;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
  creator: User;
  teams: Team[];
  phases: Phase[];
}

export interface Phase {
  id: string;
  pluginId: string;
  phaseName: string;
  settings: Record<string, unknown>;
  tournamentId: string;
  tournament: Tournament;
  matches: Match[];
}

// Match patch utilities
export interface MatchPatch {
  id: string;
  changes: Partial<Match>;
  timestamp: number;
}

// Utility functions
export function createPatch(
  original: Match,
  updated: Match
): MatchPatch | null {
  if (original.id !== updated.id) {
    throw new Error('Cannot create patch for matches with different IDs');
  }

  const changes: Partial<Match> = {};
  let hasChanges = false;

  // Compare primitive fields
  if (original.scoreA !== updated.scoreA) {
    changes.scoreA = updated.scoreA;
    hasChanges = true;
  }

  if (original.scoreB !== updated.scoreB) {
    changes.scoreB = updated.scoreB;
    hasChanges = true;
  }

  if (original.status !== updated.status) {
    changes.status = updated.status;
    hasChanges = true;
  }

  if (original.scheduledTime !== updated.scheduledTime) {
    changes.scheduledTime = updated.scheduledTime;
    hasChanges = true;
  }

  if (original.venue !== updated.venue) {
    changes.venue = updated.venue;
    hasChanges = true;
  }

  // Compare breakdown object
  if (
    JSON.stringify(original.breakdown) !== JSON.stringify(updated.breakdown)
  ) {
    changes.breakdown = updated.breakdown;
    hasChanges = true;
  }

  // Compare team objects (only check if team references changed)
  if (original.teamA.id !== updated.teamA.id) {
    changes.teamA = updated.teamA;
    hasChanges = true;
  }

  if (original.teamB.id !== updated.teamB.id) {
    changes.teamB = updated.teamB;
    hasChanges = true;
  }

  // Return null if no changes detected
  if (!hasChanges) {
    return null;
  }

  return {
    id: updated.id,
    changes,
    timestamp: Date.now(),
  };
}

export function applyPatch(original: Match, patch: MatchPatch): Match {
  if (original.id !== patch.id) {
    throw new Error('Cannot apply patch to match with different ID');
  }

  return {
    ...original,
    ...patch.changes,
  };
}

// Constants
export const MATCH_STATUSES: MatchStatus[] = [
  'PENDING',
  'LIVE',
  'FINAL',
  'NEEDS_APPROVAL',
];

// Error classes
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class TournamentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TournamentError';
  }
}

export class PermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PermissionError';
  }
}
