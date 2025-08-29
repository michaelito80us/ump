'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { ArchivedTournament, TournamentStatus } from '../types';

// Mock data for development - replace with real data fetching

const mockArchivedTournaments: ArchivedTournament[] = [
  {
    id: 'tournament-1',
    name: 'Summer Championship 2024',
    description: 'Annual summer tournament featuring top teams',
    sportId: 'sport-1',
    status: 'COMPLETED' as TournamentStatus,
    startDate: '2024-06-01T10:00:00Z',
    endDate: '2024-06-15T18:00:00Z',
    location: 'Central Sports Complex',
    maxTeams: 16,
    registrationDeadline: '2024-05-25T23:59:59Z',
    rules: 'Standard tournament rules apply',
    createdAt: '2024-05-01T10:00:00Z',
    updatedAt: '2024-06-15T18:00:00Z',
    completedAt: '2024-06-15T18:00:00Z',
    totalMatches: 31,
    totalTeams: 16,
    winner: {
      id: 'team-1',
      name: 'Dragons',
    },
  },
  {
    id: 'tournament-2',
    name: 'Spring League 2024',
    description: 'Regional spring tournament',
    sportId: 'sport-1',
    status: 'COMPLETED' as TournamentStatus,
    startDate: '2024-03-01T10:00:00Z',
    endDate: '2024-03-20T18:00:00Z',
    location: 'Regional Arena',
    maxTeams: 12,
    registrationDeadline: '2024-02-25T23:59:59Z',
    rules: 'Standard tournament rules apply',
    createdAt: '2024-02-01T10:00:00Z',
    updatedAt: '2024-03-20T18:00:00Z',
    completedAt: '2024-03-20T18:00:00Z',
    totalMatches: 23,
    totalTeams: 12,
    winner: {
      id: 'team-2',
      name: 'Lions',
    },
  },
  {
    id: 'tournament-3',
    name: 'Winter Cup 2023',
    description: 'End of year championship',
    sportId: 'sport-1',
    status: 'COMPLETED' as TournamentStatus,
    startDate: '2023-12-01T10:00:00Z',
    endDate: '2023-12-18T18:00:00Z',
    location: 'Winter Sports Hall',
    maxTeams: 8,
    registrationDeadline: '2023-11-25T23:59:59Z',
    rules: 'Standard tournament rules apply',
    createdAt: '2023-11-01T10:00:00Z',
    updatedAt: '2023-12-18T18:00:00Z',
    completedAt: '2023-12-18T18:00:00Z',
    totalMatches: 15,
    totalTeams: 8,
    winner: {
      id: 'team-3',
      name: 'Eagles',
    },
  },
];

export function TournamentArchiveView() {
  const t = useTranslations('archive');
  const tCommon = useTranslations('common');
  const [tournaments, setTournaments] = useState<ArchivedTournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>('all');

  useEffect(() => {
    // Simulate API call
    const fetchTournaments = async () => {
      setLoading(true);
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setTournaments(mockArchivedTournaments);
      setLoading(false);
    };

    fetchTournaments();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getYearFromDate = (dateString: string) => {
    return new Date(dateString).getFullYear().toString();
  };

  const availableYears = Array.from(
    new Set(
      tournaments
        .map((t) => (t.completedAt ? getYearFromDate(t.completedAt) : ''))
        .filter(Boolean)
    )
  ).sort((a, b) => parseInt(b) - parseInt(a));

  const filteredTournaments =
    selectedYear === 'all'
      ? tournaments
      : tournaments.filter(
          (t) =>
            t.completedAt && getYearFromDate(t.completedAt) === selectedYear
        );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">{tCommon('loading')}</span>
      </div>
    );
  }

  if (tournaments.length === 0) {
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
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {t('noTournaments')}
        </h3>
        <p className="text-gray-500">{t('noTournamentsDescription')}</p>
      </div>
    );
  }

  return (
    <div className="p-4" data-testid="tournament-archive-view">
      {/* Filter Controls */}
      <div className="mb-6">
        <div className="flex items-center space-x-4">
          <label
            htmlFor="year-filter"
            className="text-sm font-medium text-gray-700"
          >
            {t('filterByYear')}
          </label>
          <select
            id="year-filter"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            data-testid="year-filter"
          >
            <option value="all">{t('allYears')}</option>
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tournament Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-2xl font-bold text-blue-600">
            {filteredTournaments.length}
          </div>
          <div className="text-sm text-gray-600">{t('totalTournaments')}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-2xl font-bold text-green-600">
            {filteredTournaments.reduce((sum, t) => sum + t.totalMatches, 0)}
          </div>
          <div className="text-sm text-gray-600">{t('totalMatches')}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-2xl font-bold text-purple-600">
            {filteredTournaments.reduce((sum, t) => sum + t.totalTeams, 0)}
          </div>
          <div className="text-sm text-gray-600">{t('totalTeams')}</div>
        </div>
      </div>

      {/* Tournament List */}
      <div className="space-y-4">
        {filteredTournaments.map((tournament) => (
          <div
            key={tournament.id}
            data-testid={`tournament-card-${tournament.id}`}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            {/* Tournament Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3
                  className="text-lg font-semibold text-gray-900 mb-1"
                  data-testid={`tournament-name-${tournament.id}`}
                >
                  {tournament.name}
                </h3>
                <p className="text-gray-600 text-sm mb-2">
                  {tournament.description}
                </p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>
                    {formatDate(tournament.startDate)} -{' '}
                    {formatDate(tournament.endDate)}
                  </span>
                  <span>•</span>
                  <span>{tournament.location}</span>
                </div>
              </div>
              {tournament.winner && (
                <div className="text-right">
                  <div className="flex items-center space-x-2">
                    <svg
                      className="w-5 h-5 text-yellow-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span
                      className="text-sm font-medium text-gray-900"
                      data-testid={`tournament-winner-${tournament.id}`}
                    >
                      {tournament.winner.name}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">{t('winner')}</div>
                </div>
              )}
            </div>

            {/* Tournament Stats */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {tournament.totalTeams}
                </div>
                <div className="text-xs text-gray-500">{t('teams')}</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {tournament.totalMatches}
                </div>
                <div className="text-xs text-gray-500">{t('matches')}</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {Math.ceil(
                    (new Date(tournament.endDate).getTime() -
                      new Date(tournament.startDate).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )}
                </div>
                <div className="text-xs text-gray-500">{t('days')}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
