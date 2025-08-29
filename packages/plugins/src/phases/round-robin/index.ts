import React from 'react';
import { PhasePlugin } from '@ump/engine';
import { Match, Phase, Team } from '@ump/core';
import { RoundRobinStandings } from './RoundRobinStandings';
import { RoundRobinBracket } from './RoundRobinBracket';

export interface RoundRobinSettings {
  doubleRoundRobin?: boolean; // Play each team twice
  pointsForWin?: number; // Default: 3
  pointsForDraw?: number; // Default: 1
  pointsForLoss?: number; // Default: 0
  allowDraws?: boolean; // Default: false
  tiebreakers?: string[]; // ['points', 'headToHead', 'goalDifference', 'goalsFor']
}

export interface StandingsEntry {
  team: Team;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  position: number;
}

export const RoundRobinPlugin: PhasePlugin = {
  // Plugin metadata
  id: 'round-robin',
  name: 'Round Robin',
  version: '1.0.0',
  description: 'All teams play each other once (or twice)',
  author: 'UMP Core Team',

  // Internationalization
  i18n: {
    en: {
      name: 'Round Robin',
      description: 'All teams play each other',
      standings: 'Standings',
      played: 'Played',
      won: 'Won',
      drawn: 'Drawn',
      lost: 'Lost',
      points: 'Points',
      goalsFor: 'Goals For',
      goalsAgainst: 'Goals Against',
      goalDifference: 'Goal Difference',
      position: 'Position',
      team: 'Team',
      round: 'Round',
    },
    fr: {
      name: 'Championnat',
      description: 'Toutes les équipes se rencontrent',
      standings: 'Classement',
      played: 'Joués',
      won: 'Gagnés',
      drawn: 'Nuls',
      lost: 'Perdus',
      points: 'Points',
      goalsFor: 'Buts Pour',
      goalsAgainst: 'Buts Contre',
      goalDifference: 'Différence',
      position: 'Position',
      team: 'Équipe',
      round: 'Tour',
    },
    es: {
      name: 'Todos contra Todos',
      description: 'Todos los equipos juegan entre sí',
      standings: 'Clasificación',
      played: 'Jugados',
      won: 'Ganados',
      drawn: 'Empatados',
      lost: 'Perdidos',
      points: 'Puntos',
      goalsFor: 'Goles a Favor',
      goalsAgainst: 'Goles en Contra',
      goalDifference: 'Diferencia de Goles',
      position: 'Posición',
      team: 'Equipo',
      round: 'Ronda',
    },
  },

  // Plugin capabilities
  capabilities: ['standings', 'tiebreakers', 'statistics'],

  // Generate round robin schedule
  generateSchedule: (teams: Team[], settings: any): Match[] => {
    const config = settings as RoundRobinSettings;
    const matches: Match[] = [];
    const numTeams = teams.length;

    if (numTeams < 2) {
      return matches; // Need at least 2 teams
    }

    // Check for rounds setting (used in tests) or doubleRoundRobin
    const rounds = settings.rounds || (config.doubleRoundRobin ? 2 : 1);
    let matchCounter = 1;

    // Generate all possible pairings
    const generateRound = (teamList: Team[], roundPrefix: string) => {
      for (let i = 0; i < teamList.length; i++) {
        for (let j = i + 1; j < teamList.length; j++) {
          const teamA = teamList[i];
          const teamB = teamList[j];

          matches.push({
            id: `${roundPrefix}-${matchCounter++}`,
            teamA,
            teamB,
            scoreA: 0,
            scoreB: 0,
            status: 'pending',
          });
        }
      }
    };

    // Generate first round
    generateRound(teams, 'rr1');

    // Generate second round if double round robin
    if (rounds > 1) {
      generateRound(teams, 'rr2');
    }

    return matches;
  },

  // Get next matches that can be played
  getNextMatches: (phase: Phase): Match[] => {
    return phase.matches.filter(
      (match) => match.status === 'pending' || match.status === 'live'
    );
  },

  // Render bracket UI (for round robin, this shows the fixture list)
  renderBracketUI: (phase: Phase): React.ReactElement => {
    return React.createElement(RoundRobinBracket, {
      phase,
    }) as React.ReactElement;
  },

  // Render standings table
  renderStandings: (phase: Phase): React.ReactElement => {
    return React.createElement(RoundRobinStandings, {
      phase,
    }) as React.ReactElement;
  },
};

// Export the calculateStandings function separately
export function calculateStandings(
  phase: Phase,
  settings?: RoundRobinSettings
): StandingsEntry[] {
  const config = settings || {};
  const pointsForWin = config.pointsForWin ?? 3;
  const pointsForDraw = config.pointsForDraw ?? 1;
  const pointsForLoss = config.pointsForLoss ?? 0;
  const allowDraws = config.allowDraws ?? true;

  // Initialize standings for all teams
  const teams = new Map<string, Team>();
  phase.matches.forEach((match) => {
    teams.set(match.teamA.id, match.teamA);
    teams.set(match.teamB.id, match.teamB);
  });

  const standings: StandingsEntry[] = Array.from(teams.values()).map(
    (team) => ({
      team,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      points: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      position: 0,
    })
  );

  // Process completed matches
  const completedMatches = phase.matches.filter(
    (match) => match.status === 'final'
  );

  completedMatches.forEach((match) => {
    const teamAEntry = standings.find(
      (entry) => entry.team.id === match.teamA.id
    )!;
    const teamBEntry = standings.find(
      (entry) => entry.team.id === match.teamB.id
    )!;

    // Update games played
    teamAEntry.played++;
    teamBEntry.played++;

    // Update goals
    const teamAScore = match.scoreA;
    const teamBScore = match.scoreB;
    teamAEntry.goalsFor += teamAScore;
    teamAEntry.goalsAgainst += teamBScore;
    teamBEntry.goalsFor += teamBScore;
    teamBEntry.goalsAgainst += teamAScore;

    // Determine result and update points
    if (teamAScore > teamBScore) {
      // Team A wins
      teamAEntry.won++;
      teamAEntry.points += pointsForWin;
      teamBEntry.lost++;
      teamBEntry.points += pointsForLoss;
    } else if (teamBScore > teamAScore) {
      // Team B wins
      teamBEntry.won++;
      teamBEntry.points += pointsForWin;
      teamAEntry.lost++;
      teamAEntry.points += pointsForLoss;
    } else {
      // Draw
      if (allowDraws) {
        teamAEntry.drawn++;
        teamAEntry.points += pointsForDraw;
        teamBEntry.drawn++;
        teamBEntry.points += pointsForDraw;
      } else {
        // When draws are not allowed, treat as loss for both teams
        teamAEntry.lost++;
        teamAEntry.points += pointsForLoss;
        teamBEntry.lost++;
        teamBEntry.points += pointsForLoss;
      }
    }
  });

  // Calculate goal difference
  standings.forEach((entry) => {
    entry.goalDifference = entry.goalsFor - entry.goalsAgainst;
  });

  // Sort standings by points, then by goal difference, then by goals for
  standings.sort((a, b) => {
    if (a.points !== b.points) return b.points - a.points;
    if (a.goalDifference !== b.goalDifference)
      return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  });

  // Assign positions
  standings.forEach((entry, index) => {
    entry.position = index + 1;
  });

  return standings;
}

// Helper function to get head-to-head record between two teams
export function getHeadToHeadRecord(
  phase: Phase,
  teamAId: string,
  teamBId: string
): { teamAWins: number; teamBWins: number; draws: number } {
  const headToHeadMatches = phase.matches.filter(
    (match) =>
      match.status === 'final' &&
      ((match.teamA.id === teamAId && match.teamB.id === teamBId) ||
        (match.teamA.id === teamBId && match.teamB.id === teamAId))
  );

  let teamAWins = 0;
  let teamBWins = 0;
  let draws = 0;

  headToHeadMatches.forEach((match) => {
    if (match.teamA.id === teamAId) {
      if (match.scoreA > match.scoreB) teamAWins++;
      else if (match.scoreB > match.scoreA) teamBWins++;
      else draws++;
    } else {
      if (match.scoreB > match.scoreA) teamAWins++;
      else if (match.scoreA > match.scoreB) teamBWins++;
      else draws++;
    }
  });

  return { teamAWins, teamBWins, draws };
}
