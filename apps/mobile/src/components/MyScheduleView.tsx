'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { Match, MatchStatus } from '../../lib/types';

// Mock data for development - replace with real data fetching
const mockMatches: Match[] = [
  {
    id: 'match-1',
    phaseId: 'phase-1',
    teamA: {
      id: 'team-1',
      name: 'Fire Dragons',
      sportIds: [],
      playerIds: [],
      managers: [],
      tournaments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    teamB: {
      id: 'team-2',
      name: 'Thunder Bolts',
      sportIds: [],
      playerIds: [],
      managers: [],
      tournaments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    scoreA: 0,
    scoreB: 0,
    scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
    venue: 'Court A',
    status: 'PENDING' as MatchStatus,
  },
  {
    id: 'match-2',
    phaseId: 'phase-1',
    teamA: {
      id: 'team-3',
      name: 'Fire Dragons',
      sportIds: [],
      playerIds: [],
      managers: [],
      tournaments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    teamB: {
      id: 'team-4',
      name: 'Thunder Bolts',
      sportIds: [],
      playerIds: [],
      managers: [],
      tournaments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    scoreA: 45,
    scoreB: 42,
    scheduledTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // Started 30 min ago
    venue: 'Court B',
    status: 'LIVE' as MatchStatus,
  },
];

export function MyScheduleView() {
  const t = useTranslations('schedule');
  const tCommon = useTranslations('common');
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load fixture data in test environment, fallback to mock data
    const loadMatches = async () => {
      try {
        // Try to load fixture data first (for tests)
        const response = await fetch('/fixtures/matches.json');
        if (response.ok) {
          const data = await response.json();
          const fixtureMatches = data.matches.map(
            (match: {
              id: string;
              status: string;
              teamA: { id: string; name: string };
              teamB: { id: string; name: string };
              scoreA?: number;
              scoreB?: number;
              startTime?: string;
              venue?: string;
            }) => ({
              ...match,
              teamA: {
                ...match.teamA,
                sportIds: [],
                playerIds: [],
                managers: [],
                tournaments: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
              teamB: {
                ...match.teamB,
                sportIds: [],
                playerIds: [],
                managers: [],
                tournaments: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
              scheduledTime: match.startTime || new Date().toISOString(),
              phaseId: 'phase-1',
            })
          );
          setMatches(fixtureMatches);
        } else {
          // Fallback to mock data
          setMatches(mockMatches);
        }
      } catch {
        // Fallback to mock data on error
        setMatches(mockMatches);
      } finally {
        setLoading(false);
      }
    };

    loadMatches();
  }, []);

  const formatMatchTime = (dateString?: string) => {
    if (!dateString) return '';

    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (date.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24 && diffInHours > 0) {
      return t('today');
    } else if (diffInHours < 48 && diffInHours > 24) {
      return t('tomorrow');
    } else {
      return date.toLocaleDateString();
    }
  };

  const getStatusColor = (status: MatchStatus) => {
    switch (status) {
      case 'LIVE':
        return 'bg-red-100 text-red-800';
      case 'FINAL':
        return 'bg-green-100 text-green-800';
      case 'NEEDS_APPROVAL':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {t('noMatches')}
        </h3>
        <p className="text-gray-500">{t('upcomingMatches')}</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4" data-testid="schedule-view">
      {matches.map((match) => (
        <div
          key={match.id}
          data-testid={`match-card-${match.id}`}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
        >
          {/* Match Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(match.status)}`}
                data-testid={`match-status-${match.id}`}
              >
                {t(`status.${match.status.toLowerCase()}`)}
              </span>
              <span className="text-sm text-gray-500">
                {formatMatchTime(match.scheduledTime)}
              </span>
            </div>
            <div className="text-sm text-gray-500">
              {match.scheduledTime &&
                new Date(match.scheduledTime).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
            </div>
          </div>

          {/* Teams */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1">
              <div
                className="font-medium text-gray-900"
                data-testid={`team-a-${match.id}`}
              >
                {match.teamA.name}
              </div>
              <div className="text-sm text-gray-500">vs</div>
              <div
                className="font-medium text-gray-900"
                data-testid={`team-b-${match.id}`}
              >
                {match.teamB.name}
              </div>
            </div>

            {match.status === 'FINAL' && (
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">
                  {match.scoreA} - {match.scoreB}
                </div>
              </div>
            )}
          </div>

          {/* Venue */}
          {match.venue && (
            <div className="flex items-center text-sm text-gray-500">
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
            </div>
          )}

          {/* Action Button */}
          {match.status === 'LIVE' && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <button
                className="w-full bg-red-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
                data-testid="view-details-button"
              >
                {t('status.live')} - View Details
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
