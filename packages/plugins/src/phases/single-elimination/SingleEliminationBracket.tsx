import React from 'react';
import { Phase, Match } from '@ump/core';

interface SingleEliminationBracketProps {
  phase: Phase;
  translations?: Record<string, string>;
}

export const SingleEliminationBracket: React.FC<
  SingleEliminationBracketProps
> = ({
  phase,
  translations = {
    round: 'Round',
    final: 'Final',
    semifinal: 'Semifinal',
    quarterfinal: 'Quarterfinal',
    thirdPlace: 'Third Place',
    vs: 'vs',
    tbd: 'TBD',
    bye: 'BYE',
  },
}) => {
  // Group matches by round
  const matchesByRound = groupMatchesByRound(phase.matches);
  const rounds = Object.keys(matchesByRound).sort(
    (a, b) => parseInt(a) - parseInt(b)
  );
  const maxRound = Math.max(...rounds.map((r) => parseInt(r)));

  const getRoundName = (round: number): string => {
    if (round === maxRound) return translations.final;
    if (round === maxRound - 1) return translations.semifinal;
    if (round === maxRound - 2) return translations.quarterfinal;
    return `${translations.round} ${round}`;
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h3 className="text-xl font-bold text-gray-900 mb-6">
        Tournament Bracket
      </h3>

      <div className="flex space-x-8 overflow-x-auto">
        {rounds.map((roundStr) => {
          const round = parseInt(roundStr);
          const roundMatches = matchesByRound[round] || [];

          return (
            <div key={round} className="flex-shrink-0">
              <h4 className="text-lg font-semibold text-gray-800 mb-4 text-center">
                {getRoundName(round)}
              </h4>

              <div className="space-y-4">
                {roundMatches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    translations={translations}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {/* Third place match if it exists */}
        {phase.matches.find((m) => m.id === 'third-place') && (
          <div className="flex-shrink-0">
            <h4 className="text-lg font-semibold text-gray-800 mb-4 text-center">
              {translations.thirdPlace}
            </h4>
            <MatchCard
              match={phase.matches.find((m) => m.id === 'third-place')!}
              translations={translations}
            />
          </div>
        )}
      </div>
    </div>
  );
};

interface MatchCardProps {
  match: Match;
  translations: Record<string, string>;
}

const MatchCard: React.FC<MatchCardProps> = ({ match, translations }) => {
  const getTeamDisplayName = (team: any): string => {
    if (team.id.startsWith('tbd-')) return translations.tbd;
    if (team.id.startsWith('bye-')) return translations.bye;
    return team.name;
  };

  const getMatchStatusColor = (status: string): string => {
    switch (status) {
      case 'final':
        return 'bg-green-50 border-green-200';
      case 'live':
        return 'bg-blue-50 border-blue-200';
      case 'pending':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const isWinner = (
    teamScore: number,
    opponentScore: number,
    status: string
  ): boolean => {
    return status === 'final' && teamScore > opponentScore;
  };

  return (
    <div
      className={`border rounded-lg p-3 min-w-[200px] ${getMatchStatusColor(match.status)}`}
    >
      <div className="space-y-2">
        {/* Team A */}
        <div
          className={`flex justify-between items-center p-2 rounded ${
            isWinner(match.scoreA, match.scoreB, match.status)
              ? 'bg-green-100 font-semibold'
              : 'bg-white'
          }`}
        >
          <span className="text-sm truncate">
            {getTeamDisplayName(match.teamA)}
          </span>
          <span className="text-sm font-mono ml-2">{match.scoreA}</span>
        </div>

        {/* VS divider */}
        <div className="text-center text-xs text-gray-500">
          {translations.vs}
        </div>

        {/* Team B */}
        <div
          className={`flex justify-between items-center p-2 rounded ${
            isWinner(match.scoreB, match.scoreA, match.status)
              ? 'bg-green-100 font-semibold'
              : 'bg-white'
          }`}
        >
          <span className="text-sm truncate">
            {getTeamDisplayName(match.teamB)}
          </span>
          <span className="text-sm font-mono ml-2">{match.scoreB}</span>
        </div>
      </div>

      {/* Match status indicator */}
      <div className="mt-2 text-center">
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            match.status === 'final'
              ? 'bg-green-100 text-green-800'
              : match.status === 'live'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-600'
          }`}
        >
          {match.status.toUpperCase()}
        </span>
      </div>
    </div>
  );
};

// Helper function to group matches by round
function groupMatchesByRound(matches: Match[]): Record<number, Match[]> {
  const grouped: Record<number, Match[]> = {};

  matches.forEach((match) => {
    if (match.id === 'third-place') return; // Handle separately

    const roundMatch = match.id.match(/^r(\d+)-/);
    if (roundMatch) {
      const round = parseInt(roundMatch[1]);
      if (!grouped[round]) grouped[round] = [];
      grouped[round].push(match);
    }
  });

  return grouped;
}
