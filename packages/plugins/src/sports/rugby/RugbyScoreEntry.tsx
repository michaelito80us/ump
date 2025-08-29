import React, { useState, useCallback } from 'react';
import { RugbyScoreBreakdown } from './index';

interface RugbyScoreEntryProps {
  teamName: string;
  initialBreakdown?: RugbyScoreBreakdown;
  onScoreChange: (breakdown: RugbyScoreBreakdown) => void;
  disabled?: boolean;
  translations?: Record<string, string>;
}

export const RugbyScoreEntry: React.FC<RugbyScoreEntryProps> = ({
  teamName,
  initialBreakdown = { tries: 0, conversions: 0, penalties: 0, dropGoals: 0 },
  onScoreChange,
  disabled = false,
  translations = {
    tries: 'Tries',
    conversions: 'Conversions',
    penalties: 'Penalties',
    dropGoals: 'Drop Goals',
    total: 'Total',
  },
}) => {
  const [breakdown, setBreakdown] =
    useState<RugbyScoreBreakdown>(initialBreakdown);

  const updateScore = useCallback(
    (field: keyof RugbyScoreBreakdown, value: number) => {
      const newBreakdown = { ...breakdown, [field]: Math.max(0, value) };

      // Rugby rule: Can't have more conversions than tries
      if (field === 'tries' && newBreakdown.conversions > value) {
        newBreakdown.conversions = value;
      }

      setBreakdown(newBreakdown);
      onScoreChange(newBreakdown);
    },
    [breakdown, onScoreChange]
  );

  const calculateTotal = useCallback((bd: RugbyScoreBreakdown): number => {
    return (
      bd.tries * 5 + bd.conversions * 2 + bd.penalties * 3 + bd.dropGoals * 3
    );
  }, []);

  const inputStyle =
    'w-16 px-2 py-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100';
  const labelStyle = 'text-sm font-medium text-gray-700';

  return (
    <div className="p-4 border border-gray-200 rounded-lg bg-white">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">{teamName}</h3>

      <div className="space-y-3">
        {/* Tries */}
        <div className="flex items-center justify-between">
          <label className={labelStyle}>{translations.tries} (5 pts)</label>
          <input
            type="number"
            min="0"
            value={breakdown.tries}
            onChange={(e) =>
              updateScore('tries', parseInt(e.target.value) || 0)
            }
            disabled={disabled}
            className={inputStyle}
          />
        </div>

        {/* Conversions */}
        <div className="flex items-center justify-between">
          <label className={labelStyle}>
            {translations.conversions} (2 pts)
          </label>
          <input
            type="number"
            min="0"
            max={breakdown.tries}
            value={breakdown.conversions}
            onChange={(e) =>
              updateScore('conversions', parseInt(e.target.value) || 0)
            }
            disabled={disabled}
            className={inputStyle}
          />
        </div>

        {/* Penalties */}
        <div className="flex items-center justify-between">
          <label className={labelStyle}>{translations.penalties} (3 pts)</label>
          <input
            type="number"
            min="0"
            value={breakdown.penalties}
            onChange={(e) =>
              updateScore('penalties', parseInt(e.target.value) || 0)
            }
            disabled={disabled}
            className={inputStyle}
          />
        </div>

        {/* Drop Goals */}
        <div className="flex items-center justify-between">
          <label className={labelStyle}>{translations.dropGoals} (3 pts)</label>
          <input
            type="number"
            min="0"
            value={breakdown.dropGoals}
            onChange={(e) =>
              updateScore('dropGoals', parseInt(e.target.value) || 0)
            }
            disabled={disabled}
            className={inputStyle}
          />
        </div>

        {/* Total Score */}
        <div className="pt-2 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-gray-900">
              {translations.total}
            </span>
            <span className="text-2xl font-bold text-blue-600">
              {calculateTotal(breakdown)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
