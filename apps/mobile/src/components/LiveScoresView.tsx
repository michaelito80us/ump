'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { Match, MatchStatus } from '@ump/core';

// Mock live matches data
const mockLiveMatches: Match[] = [
  {
    id: 'live-match-1',
    teamA: {
      id: 'team-1',
      name: 'Dragons',
      sportIds: [],
      playerIds: [],
      managers: [],
      tournaments: [],
    },
    teamB: {
      id: 'team-2',
      name: 'Lions',
      sportIds: [],
      playerIds: [],
      managers: [],
      tournaments: [],
    },
    scoreA: 14,
    scoreB: 7,
    scheduledTime: new Date().toISOString(),
    venue: 'Stadium A',
    status: 'live' as MatchStatus,
  },
  {
    id: 'live-match-2',
    teamA: {
      id: 'team-3',
      name: 'Eagles',
      sportIds: [],
      playerIds: [],
      managers: [],
      tournaments: [],
    },
    teamB: {
      id: 'team-4',
      name: 'Sharks',
      sportIds: [],
      playerIds: [],
      managers: [],
      tournaments: [],
    },
    scoreA: 21,
    scoreB: 14,
    scheduledTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // Started 30 min ago
    venue: 'Stadium B',
    status: 'live' as MatchStatus,
  },
];

export function LiveScoresView() {
  const t = useTranslations('live');
  const tCommon = useTranslations('common');
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const fetchLiveMatches = async () => {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setMatches(mockLiveMatches);
      setLoading(false);
    };

    fetchLiveMatches();

    // Simulate real-time score updates
    const interval = setInterval(() => {
      setMatches((prevMatches) =>
        prevMatches.map((match) => {
          // Randomly update scores
          if (Math.random() > 0.8) {
            const updatedMatch = { ...match };
            if (Math.random() > 0.5) {
              updatedMatch.scoreA += Math.floor(Math.random() * 3) + 1;
            } else {
              updatedMatch.scoreB += Math.floor(Math.random() * 3) + 1;
            }
            return updatedMatch;
          }
          return match;
        })
      );
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const getMatchDuration = (startTime: string) => {
    const start = new Date(startTime);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - start.getTime()) / (1000 * 60)
    );
    return `${diffInMinutes}'`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        <span className="ml-2 text-gray-600">{tCommon('loading')}</span>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {t('noLiveMatches')}
        </h3>
        <p className="text-gray-500">{t('checkBackLater')}</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Live indicator */}
      <div className="flex items-center justify-center mb-4">
        <div className="flex items-center space-x-2 bg-red-100 text-red-800 px-3 py-1 rounded-full">
          <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">{t('live')}</span>
        </div>
      </div>

      {matches.map((match) => (
        <div
          key={match.id}
          className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
        >
          {/* Match Header */}
          <div className="bg-red-50 px-4 py-2 border-b border-red-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-red-800">
                  {t('live')}
                </span>
                <span className="text-sm text-red-600">
                  {getMatchDuration(match.scheduledTime || '')}
                </span>
              </div>
              <div className="text-sm text-gray-600">{match.venue}</div>
            </div>
          </div>

          {/* Score Display */}
          <div className="p-4">
            <div className="flex items-center justify-between">
              {/* Team A */}
              <div className="flex-1 text-center">
                <div className="font-semibold text-lg text-gray-900 mb-1">
                  {match.teamA.name}
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {match.scoreA}
                </div>
              </div>

              {/* VS Separator */}
              <div className="px-4">
                <div className="text-gray-400 font-medium">VS</div>
              </div>

              {/* Team B */}
              <div className="flex-1 text-center">
                <div className="font-semibold text-lg text-gray-900 mb-1">
                  {match.teamB.name}
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {match.scoreB}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-4 pb-4 flex space-x-2">
            <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
              {t('viewDetails')}
            </button>
            <button className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors">
              {t('followMatch')}
            </button>
          </div>
        </div>
      ))}

      {/* Refresh Button */}
      <div className="text-center pt-4">
        <button
          onClick={() => window.location.reload()}
          className="text-blue-600 text-sm font-medium hover:text-blue-700"
        >
          {tCommon('refresh')} {t('scores')}
        </button>
      </div>
    </div>
  );
}
