// Core type definitions for the tournament management platform

export type MatchStatus = 'pending' | 'live' | 'final' | 'needs_approval';

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tournament extends BaseEntity {
  name: string;
  status: 'not_started' | 'live' | 'completed';
  isLocked: boolean;
}

// Additional types will be added in T-1.1
