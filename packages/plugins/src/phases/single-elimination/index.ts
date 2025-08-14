import React from 'react';
import { PhasePlugin } from '@ump/engine';
import { Match, Phase, Team } from '@ump/core';
import { SingleEliminationBracket } from './SingleEliminationBracket';
import { SingleEliminationStandings } from './SingleEliminationStandings';

export interface SingleEliminationSettings {
  allowThirdPlace?: boolean;
  seedingMethod?: 'random' | 'ranked' | 'manual';
  byeHandling?: 'top_seeds' | 'bottom_seeds' | 'random';
}

export interface BracketPosition {
  round: number;
  position: number;
  teamId?: string;
  isWinner?: boolean;
  advancesTo?: BracketPosition;
}

export const SingleEliminationPlugin: PhasePlugin = {
  // Plugin metadata
  id: 'single-elimination',
  name: 'Single Elimination',
  version: '1.0.0',
  description: 'Classic single elimination tournament bracket',
  author: 'UMP Core Team',

  // Internationalization
  i18n: {
    en: {
      name: 'Single Elimination',
      description: 'Winner advances, loser is eliminated',
      round: 'Round',
      final: 'Final',
      semifinal: 'Semifinal',
      quarterfinal: 'Quarterfinal',
      thirdPlace: 'Third Place',
      champion: 'Champion',
      runnerUp: 'Runner-up',
      bye: 'Bye',
    },
    fr: {
      name: 'Élimination Directe',
      description: 'Le gagnant avance, le perdant est éliminé',
      round: 'Tour',
      final: 'Finale',
      semifinal: 'Demi-finale',
      quarterfinal: 'Quart de finale',
      thirdPlace: 'Troisième Place',
      champion: 'Champion',
      runnerUp: 'Finaliste',
      bye: 'Exempt',
    },
  },

  // Plugin capabilities
  capabilities: ['bracket', 'seeding', 'advancement'],

  // Generate initial bracket schedule
  generateSchedule: (teams: Team[], settings: any): Match[] => {
    const config = settings as SingleEliminationSettings;
    const matches: Match[] = [];

    // Calculate number of rounds needed
    const numTeams = teams.length;
    const numRounds = Math.ceil(Math.log2(numTeams));
    const bracketSize = Math.pow(2, numRounds);

    // Handle byes if needed
    const teamsWithByes = [...teams];
    const numByes = bracketSize - numTeams;

    if (numByes > 0) {
      // Add placeholder "bye" teams based on bye handling strategy
      for (let i = 0; i < numByes; i++) {
        teamsWithByes.push({
          id: `bye-${i}`,
          name: 'BYE',
          sportIds: [],
          playerIds: [],
          managers: [],
          tournaments: [],
        });
      }
    }

    // Generate first round matches
    const firstRoundMatches = Math.floor(bracketSize / 2);

    for (let i = 0; i < firstRoundMatches; i++) {
      const teamA = teamsWithByes[i * 2];
      const teamB = teamsWithByes[i * 2 + 1];

      // Skip matches where both teams are byes
      if (teamA.id.startsWith('bye-') && teamB.id.startsWith('bye-')) {
        continue;
      }

      matches.push({
        id: `r1-m${i + 1}`,
        teamA,
        teamB,
        scoreA: 0,
        scoreB: 0,
        status: 'pending',
      });
    }

    // Generate subsequent round placeholders
    let currentRoundMatches = firstRoundMatches;
    for (let round = 2; round <= numRounds; round++) {
      currentRoundMatches = Math.floor(currentRoundMatches / 2);

      for (let i = 0; i < currentRoundMatches; i++) {
        matches.push({
          id: `r${round}-m${i + 1}`,
          teamA: {
            id: `tbd-r${round}-${i * 2 + 1}`,
            name: 'TBD',
            sportIds: [],
            playerIds: [],
            managers: [],
            tournaments: [],
          },
          teamB: {
            id: `tbd-r${round}-${i * 2 + 2}`,
            name: 'TBD',
            sportIds: [],
            playerIds: [],
            managers: [],
            tournaments: [],
          },
          scoreA: 0,
          scoreB: 0,
          status: 'pending',
        });
      }
    }

    // Add third place match if enabled
    if (config.allowThirdPlace && numRounds > 1) {
      matches.push({
        id: 'third-place',
        teamA: {
          id: 'tbd-3rd-1',
          name: 'TBD',
          sportIds: [],
          playerIds: [],
          managers: [],
          tournaments: [],
        },
        teamB: {
          id: 'tbd-3rd-2',
          name: 'TBD',
          sportIds: [],
          playerIds: [],
          managers: [],
          tournaments: [],
        },
        scoreA: 0,
        scoreB: 0,
        status: 'pending',
      });
    }

    return matches;
  },

  // Get next matches that can be played
  getNextMatches: (phase: Phase): Match[] => {
    return phase.matches.filter(
      (match) =>
        match.status === 'pending' &&
        !match.teamA.id.startsWith('tbd-') &&
        !match.teamB.id.startsWith('tbd-') &&
        !match.teamA.id.startsWith('bye-') &&
        !match.teamB.id.startsWith('bye-')
    );
  },

  // Render bracket UI
  renderBracketUI: (phase: Phase): React.ReactElement => {
    return React.createElement(SingleEliminationBracket, {
      phase,
    }) as React.ReactElement;
  },

  // Render standings
  renderStandings: (phase: Phase): React.ReactElement => {
    return React.createElement(SingleEliminationStandings, {
      phase,
    }) as React.ReactElement;
  },
};
