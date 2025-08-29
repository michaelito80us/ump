// Type definitions for the mobile app

export type TournamentStatus =
  | 'DRAFT'
  | 'PUBLISHED'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'CANCELLED';

export interface Team {
  id: string;
  name: string;
}

export interface ArchivedTournament {
  id: string;
  name: string;
  description: string;
  sportId: string;
  status: TournamentStatus;
  startDate: string;
  endDate: string;
  location: string;
  maxTeams: number;
  registrationDeadline: string;
  rules: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  totalMatches: number;
  totalTeams: number;
  winner?: Team;
}

export interface TournamentStatistics {
  totalTournaments: number;
  totalMatches: number;
  totalTeams: number;
  averageDuration: number; // in days
}
