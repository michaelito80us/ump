import React from 'react';
import { Phase, Match, Team } from '@ump/core';

interface SingleEliminationStandingsProps {
  phase: Phase;
  translations?: Record<string, string>;
}

interface StandingEntry {
  team: Team;
  position: number;
  status: 'champion' | 'runner-up' | 'third' | 'eliminated' | 'active';
  eliminatedInRound?: number;
  wins: number;
  losses: number;
}

export const SingleEliminationStandings: React.FC<
  SingleEliminationStandingsProps
> = ({
  phase,
  translations = {
    position: 'Position',
    team: 'Team',
    status: 'Status',
    record: 'W-L',
    champion: 'Champion',
    runnerUp: 'Runner-up',
    third: 'Third Place',
    eliminated: 'Eliminated',
    active: 'Still Active',
    eliminatedInRound: 'Eliminated in Round',
  },
}) => {
  const standings = calculateStandings(phase);

  const getStatusBadge = (entry: StandingEntry): React.ReactNode => {
    const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full';

    switch (entry.status) {
      case 'champion':
        return (
          <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>
            🏆 {translations.champion}
          </span>
        );
      case 'runner-up':
        return (
          <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
            🥈 {translations.runnerUp}
          </span>
        );
      case 'third':
        return (
          <span className={`${baseClasses} bg-orange-100 text-orange-800`}>
            🥉 {translations.third}
          </span>
        );
      case 'eliminated':
        return (
          <span className={`${baseClasses} bg-red-100 text-red-800`}>
            {translations.eliminated}
            {entry.eliminatedInRound && ` (R${entry.eliminatedInRound})`}
          </span>
        );
      case 'active':
        return (
          <span className={`${baseClasses} bg-blue-100 text-blue-800`}>
            {translations.active}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Tournament Standings
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {translations.position}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {translations.team}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {translations.record}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {translations.status}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {standings.map((entry, index) => (
              <tr
                key={entry.team.id}
                className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {entry.position}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {entry.team.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {entry.wins}-{entry.losses}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(entry)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {standings.length === 0 && (
        <div className="px-6 py-8 text-center text-gray-500">
          No teams in tournament yet
        </div>
      )}
    </div>
  );
};

// Helper function to calculate standings from phase matches
function calculateStandings(phase: Phase): StandingEntry[] {
  const teamStats = new Map<
    string,
    { team: Team; wins: number; losses: number }
  >();
  const finalMatch = phase.matches.find(
    (m) => m.id.includes('final') || isLastRound(m, phase.matches)
  );
  const thirdPlaceMatch = phase.matches.find((m) => m.id === 'third-place');

  // Initialize team stats
  phase.matches.forEach((match) => {
    if (
      !match.teamA.id.startsWith('tbd-') &&
      !match.teamA.id.startsWith('bye-')
    ) {
      if (!teamStats.has(match.teamA.id)) {
        teamStats.set(match.teamA.id, {
          team: match.teamA,
          wins: 0,
          losses: 0,
        });
      }
    }
    if (
      !match.teamB.id.startsWith('tbd-') &&
      !match.teamB.id.startsWith('bye-')
    ) {
      if (!teamStats.has(match.teamB.id)) {
        teamStats.set(match.teamB.id, {
          team: match.teamB,
          wins: 0,
          losses: 0,
        });
      }
    }
  });

  // Calculate wins and losses
  phase.matches.forEach((match) => {
    if (match.status === 'final') {
      const winnerIsA = match.scoreA > match.scoreB;
      const teamAStats = teamStats.get(match.teamA.id);
      const teamBStats = teamStats.get(match.teamB.id);

      if (teamAStats) {
        teamAStats.wins += winnerIsA ? 1 : 0;
        teamAStats.losses += winnerIsA ? 0 : 1;
      }
      if (teamBStats) {
        teamBStats.wins += winnerIsA ? 0 : 1;
        teamBStats.losses += winnerIsA ? 1 : 0;
      }
    }
  });

  // Determine positions and status
  const standings: StandingEntry[] = [];

  // Champion (winner of final)
  if (finalMatch && finalMatch.status === 'final') {
    const champion =
      finalMatch.scoreA > finalMatch.scoreB
        ? finalMatch.teamA
        : finalMatch.teamB;
    const runnerUp =
      finalMatch.scoreA > finalMatch.scoreB
        ? finalMatch.teamB
        : finalMatch.teamA;

    const championStats = teamStats.get(champion.id);
    const runnerUpStats = teamStats.get(runnerUp.id);

    if (championStats) {
      standings.push({
        team: champion,
        position: 1,
        status: 'champion',
        wins: championStats.wins,
        losses: championStats.losses,
      });
    }

    if (runnerUpStats) {
      standings.push({
        team: runnerUp,
        position: 2,
        status: 'runner-up',
        wins: runnerUpStats.wins,
        losses: runnerUpStats.losses,
      });
    }
  }

  // Third place
  if (thirdPlaceMatch && thirdPlaceMatch.status === 'final') {
    const thirdPlace =
      thirdPlaceMatch.scoreA > thirdPlaceMatch.scoreB
        ? thirdPlaceMatch.teamA
        : thirdPlaceMatch.teamB;
    const thirdPlaceStats = teamStats.get(thirdPlace.id);

    if (thirdPlaceStats) {
      standings.push({
        team: thirdPlace,
        position: 3,
        status: 'third',
        wins: thirdPlaceStats.wins,
        losses: thirdPlaceStats.losses,
      });
    }
  }

  // Add remaining teams
  const addedTeamIds = new Set(standings.map((s) => s.team.id));
  let position = standings.length + 1;

  Array.from(teamStats.values())
    .filter((stats) => !addedTeamIds.has(stats.team.id))
    .sort((a, b) => b.wins - a.wins || a.losses - b.losses)
    .forEach((stats) => {
      standings.push({
        team: stats.team,
        position: position++,
        status: stats.losses > 0 ? 'eliminated' : 'active',
        wins: stats.wins,
        losses: stats.losses,
      });
    });

  return standings;
}

// Helper to determine if a match is in the last round
function isLastRound(match: Match, allMatches: Match[]): boolean {
  const roundMatch = match.id.match(/^r(\d+)-/);
  if (!roundMatch) return false;

  const currentRound = parseInt(roundMatch[1]);
  const maxRound = Math.max(
    ...allMatches
      .map((m) => m.id.match(/^r(\d+)-/))
      .filter(Boolean)
      .map((m) => parseInt(m![1]))
  );

  return currentRound === maxRound;
}
