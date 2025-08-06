import React from 'react';
import { Match } from '@ump/core';
import { RugbyScoreBreakdown } from './index';

interface RugbyScoreDisplayProps {
  match: Match;
  translations?: Record<string, string>;
  compact?: boolean;
}

export const RugbyScoreDisplay: React.FC<RugbyScoreDisplayProps> = ({
  match,
  translations = {
    tries: 'Tries',
    conversions: 'Conversions',
    penalties: 'Penalties',
    dropGoals: 'Drop Goals',
    vs: 'vs',
  },
  compact = false,
}) => {
  // Safely extract rugby-specific breakdown data
  const getRugbyBreakdown = (
    teamBreakdown: Record<string, number> | undefined
  ): RugbyScoreBreakdown | null => {
    if (!teamBreakdown) return null;

    return {
      tries: teamBreakdown.tries || 0,
      conversions: teamBreakdown.conversions || 0,
      penalties: teamBreakdown.penalties || 0,
      dropGoals: teamBreakdown.dropGoals || 0,
    };
  };

  const breakdownA = getRugbyBreakdown(match.breakdown?.teamA);
  const breakdownB = getRugbyBreakdown(match.breakdown?.teamB);

  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-4">
          <span className="font-medium text-gray-900">{match.teamA.name}</span>
          <span className="text-2xl font-bold text-blue-600">
            {match.scoreA}
          </span>
        </div>
        <span className="text-gray-500 font-medium">{translations.vs}</span>
        <div className="flex items-center space-x-4">
          <span className="text-2xl font-bold text-blue-600">
            {match.scoreB}
          </span>
          <span className="font-medium text-gray-900">{match.teamB.name}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-900">Match Score</h3>
        <div className="flex items-center space-x-4">
          <span className="text-3xl font-bold text-blue-600">
            {match.scoreA}
          </span>
          <span className="text-gray-500 font-medium">{translations.vs}</span>
          <span className="text-3xl font-bold text-blue-600">
            {match.scoreB}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Team A Breakdown */}
        <div className="space-y-3">
          <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">
            {match.teamA.name}
          </h4>
          {breakdownA && (
            <div className="space-y-2">
              <ScoreBreakdownRow
                label={`${translations.tries} (5 pts)`}
                value={breakdownA.tries}
                points={breakdownA.tries * 5}
              />
              <ScoreBreakdownRow
                label={`${translations.conversions} (2 pts)`}
                value={breakdownA.conversions}
                points={breakdownA.conversions * 2}
              />
              <ScoreBreakdownRow
                label={`${translations.penalties} (3 pts)`}
                value={breakdownA.penalties}
                points={breakdownA.penalties * 3}
              />
              <ScoreBreakdownRow
                label={`${translations.dropGoals} (3 pts)`}
                value={breakdownA.dropGoals}
                points={breakdownA.dropGoals * 3}
              />
            </div>
          )}
        </div>

        {/* Team B Breakdown */}
        <div className="space-y-3">
          <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">
            {match.teamB.name}
          </h4>
          {breakdownB && (
            <div className="space-y-2">
              <ScoreBreakdownRow
                label={`${translations.tries} (5 pts)`}
                value={breakdownB.tries}
                points={breakdownB.tries * 5}
              />
              <ScoreBreakdownRow
                label={`${translations.conversions} (2 pts)`}
                value={breakdownB.conversions}
                points={breakdownB.conversions * 2}
              />
              <ScoreBreakdownRow
                label={`${translations.penalties} (3 pts)`}
                value={breakdownB.penalties}
                points={breakdownB.penalties * 3}
              />
              <ScoreBreakdownRow
                label={`${translations.dropGoals} (3 pts)`}
                value={breakdownB.dropGoals}
                points={breakdownB.dropGoals * 3}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface ScoreBreakdownRowProps {
  label: string;
  value: number;
  points: number;
}

const ScoreBreakdownRow: React.FC<ScoreBreakdownRowProps> = ({
  label,
  value,
  points,
}) => (
  <div className="flex justify-between items-center text-sm">
    <span className="text-gray-600">{label}</span>
    <div className="flex items-center space-x-2">
      <span className="font-medium">{value}</span>
      <span className="text-gray-400">×</span>
      <span className="font-semibold text-blue-600">{points}</span>
    </div>
  </div>
);
