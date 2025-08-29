import React from 'react';
import { Phase, Match } from '@ump/core';

interface RoundRobinBracketProps {
  phase: Phase;
}

interface MatchGroup {
  round: string;
  matches: Match[];
}

export const RoundRobinBracket: React.FC<RoundRobinBracketProps> = ({
  phase,
}) => {
  // Group matches by round (rr1, rr2, etc.)
  const groupMatchesByRound = (matches: Match[]): MatchGroup[] => {
    const groups = new Map<string, Match[]>();

    matches.forEach((match) => {
      const roundMatch = match.id.match(/^(rr\d+)/);
      const round = roundMatch ? roundMatch[1] : 'rr1';

      if (!groups.has(round)) {
        groups.set(round, []);
      }
      groups.get(round)!.push(match);
    });

    return Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([round, matches]) => ({ round, matches }));
  };

  const matchGroups = groupMatchesByRound(phase.matches);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-100 text-gray-700';
      case 'live':
        return 'bg-green-100 text-green-700';
      case 'final':
        return 'bg-blue-100 text-blue-700';
      case 'needs_approval':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'live':
        return 'Live';
      case 'final':
        return 'Final';
      case 'needs_approval':
        return 'Needs Approval';
      default:
        return status;
    }
  };

  const formatRoundName = (round: string) => {
    const roundNumber = round.replace('rr', '');
    return `Round ${roundNumber}`;
  };

  if (phase.matches.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <div className="mb-4">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Fixtures Yet
        </h3>
        <p>
          Matches will appear here once the round robin schedule is generated.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Round Robin Fixtures
        </h3>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-100 rounded mr-2"></div>
            <span>Pending</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-100 rounded mr-2"></div>
            <span>Live</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-100 rounded mr-2"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-100 rounded mr-2"></div>
            <span>Needs Approval</span>
          </div>
        </div>
      </div>

      {matchGroups.map((group) => (
        <div
          key={group.round}
          className="bg-white rounded-lg border border-gray-200 shadow-sm"
        >
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 rounded-t-lg">
            <h4 className="text-md font-medium text-gray-900">
              {formatRoundName(group.round)}
            </h4>
            <p className="text-sm text-gray-600">
              {group.matches.filter((m) => m.status === 'final').length} of{' '}
              {group.matches.length} matches completed
            </p>
          </div>

          <div className="divide-y divide-gray-200">
            {group.matches.map((match) => (
              <div
                key={match.id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-4">
                        {/* Team A */}
                        <div className="flex items-center min-w-0 flex-1">
                          <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                            <span className="text-xs font-bold text-gray-600">
                              {match.teamA.name.substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900 truncate">
                            {match.teamA.name}
                          </span>
                        </div>

                        {/* Score */}
                        <div className="flex items-center space-x-2">
                          {match.status === 'final' ? (
                            <>
                              <span
                                className={`text-lg font-bold ${
                                  match.scoreA > match.scoreB
                                    ? 'text-green-600'
                                    : match.scoreA < match.scoreB
                                      ? 'text-gray-600'
                                      : 'text-blue-600'
                                }`}
                              >
                                {match.scoreA}
                              </span>
                              <span className="text-gray-400">-</span>
                              <span
                                className={`text-lg font-bold ${
                                  match.scoreB > match.scoreA
                                    ? 'text-green-600'
                                    : match.scoreB < match.scoreA
                                      ? 'text-gray-600'
                                      : 'text-blue-600'
                                }`}
                              >
                                {match.scoreB}
                              </span>
                            </>
                          ) : match.status === 'live' ? (
                            <>
                              <span className="text-lg font-bold text-green-600">
                                {match.scoreA}
                              </span>
                              <span className="text-gray-400">-</span>
                              <span className="text-lg font-bold text-green-600">
                                {match.scoreB}
                              </span>
                            </>
                          ) : (
                            <span className="text-gray-400 text-sm">vs</span>
                          )}
                        </div>

                        {/* Team B */}
                        <div className="flex items-center min-w-0 flex-1 justify-end">
                          <span className="font-medium text-gray-900 truncate">
                            {match.teamB.name}
                          </span>
                          <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center ml-3">
                            <span className="text-xs font-bold text-gray-600">
                              {match.teamB.name.substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Match details */}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-4">
                        {match.scheduledTime && (
                          <span>
                            {new Date(match.scheduledTime).toLocaleDateString()}{' '}
                            at{' '}
                            {new Date(match.scheduledTime).toLocaleTimeString(
                              [],
                              {
                                hour: '2-digit',
                                minute: '2-digit',
                              }
                            )}
                          </span>
                        )}
                        {match.venue && (
                          <span className="flex items-center">
                            <svg
                              className="w-4 h-4 mr-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                            {match.venue}
                          </span>
                        )}
                      </div>

                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          match.status
                        )}`}
                      >
                        {getStatusText(match.status)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
