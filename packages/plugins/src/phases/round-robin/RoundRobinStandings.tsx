import React from 'react';
import { Phase } from '@ump/core';
import { type StandingsEntry, calculateStandings } from './index';

interface RoundRobinStandingsProps {
  phase: Phase;
}

export const RoundRobinStandings: React.FC<RoundRobinStandingsProps> = ({
  phase,
}) => {
  // Calculate current standings
  const standings = calculateStandings(phase, {});

  if (standings.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>No teams in this phase yet.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Standings</h3>
        <p className="text-sm text-gray-600">
          {phase.matches.filter((m) => m.status === 'final').length} of{' '}
          {phase.matches.length} matches completed
        </p>
      </div>

      <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Pos
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Team
            </th>
            <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              P
            </th>
            <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              W
            </th>
            <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              D
            </th>
            <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              L
            </th>
            <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              GF
            </th>
            <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              GA
            </th>
            <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              GD
            </th>
            <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Pts
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {standings.map((entry: StandingsEntry, index: number) => (
            <tr
              key={entry.team.id}
              className={`hover:bg-gray-50 ${
                index === 0
                  ? 'bg-green-50'
                  : index === 1
                    ? 'bg-blue-50'
                    : index === 2
                      ? 'bg-orange-50'
                      : ''
              }`}
            >
              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                <div className="flex items-center">
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                      index === 0
                        ? 'bg-green-100 text-green-800'
                        : index === 1
                          ? 'bg-blue-100 text-blue-800'
                          : index === 2
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {entry.position}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                    <span className="text-xs font-bold text-gray-600">
                      {entry.team.name.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {entry.team.name}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-2 py-3 text-sm text-center text-gray-900">
                {entry.played}
              </td>
              <td className="px-2 py-3 text-sm text-center text-green-600 font-medium">
                {entry.won}
              </td>
              <td className="px-2 py-3 text-sm text-center text-gray-600">
                {entry.drawn}
              </td>
              <td className="px-2 py-3 text-sm text-center text-red-600 font-medium">
                {entry.lost}
              </td>
              <td className="px-2 py-3 text-sm text-center text-gray-900">
                {entry.goalsFor}
              </td>
              <td className="px-2 py-3 text-sm text-center text-gray-900">
                {entry.goalsAgainst}
              </td>
              <td className="px-2 py-3 text-sm text-center font-medium">
                <span
                  className={`${
                    entry.goalDifference > 0
                      ? 'text-green-600'
                      : entry.goalDifference < 0
                        ? 'text-red-600'
                        : 'text-gray-600'
                  }`}
                >
                  {entry.goalDifference > 0 ? '+' : ''}
                  {entry.goalDifference}
                </span>
              </td>
              <td className="px-3 py-3 text-sm text-center font-bold text-gray-900">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {entry.points}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Legend */}
      <div className="mt-4 text-xs text-gray-500">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center">
            <span className="font-medium">P:</span> Played
          </div>
          <div className="flex items-center">
            <span className="font-medium">W:</span> Won
          </div>
          <div className="flex items-center">
            <span className="font-medium">D:</span> Drawn
          </div>
          <div className="flex items-center">
            <span className="font-medium">L:</span> Lost
          </div>
          <div className="flex items-center">
            <span className="font-medium">GF:</span> Goals For
          </div>
          <div className="flex items-center">
            <span className="font-medium">GA:</span> Goals Against
          </div>
          <div className="flex items-center">
            <span className="font-medium">GD:</span> Goal Difference
          </div>
          <div className="flex items-center">
            <span className="font-medium">Pts:</span> Points
          </div>
        </div>
      </div>
    </div>
  );
};
