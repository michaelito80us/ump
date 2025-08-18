'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Team } from '../../lib/types';
import { useLeaderboardSubscription } from '../hooks/useLeaderboardSubscription';

// Extended interface for display purposes
interface TeamStanding {
  rank: number;
  team: Team;
  wins: number;
  losses: number;
  draws: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  played: number;
}

// Mock leaderboard data
const mockStandingsData: TeamStanding[] = [
  {
    rank: 1,
    team: {
      id: 'team-1',
      name: 'Dragons',
      sportIds: [],
      playerIds: [],
      managers: [],
      tournaments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    wins: 8,
    losses: 1,
    draws: 1,
    points: 25,
    goalsFor: 24,
    goalsAgainst: 8,
    goalDifference: 16,
    played: 10,
  },
  {
    rank: 2,
    team: {
      id: 'team-2',
      name: 'Lions',
      sportIds: [],
      playerIds: [],
      managers: [],
      tournaments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    wins: 7,
    losses: 2,
    draws: 1,
    points: 22,
    goalsFor: 21,
    goalsAgainst: 12,
    goalDifference: 9,
    played: 10,
  },
  {
    rank: 3,
    team: {
      id: 'team-3',
      name: 'Eagles',
      sportIds: [],
      playerIds: [],
      managers: [],
      tournaments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    wins: 6,
    losses: 3,
    draws: 1,
    points: 19,
    goalsFor: 18,
    goalsAgainst: 15,
    goalDifference: 3,
    played: 10,
  },
  {
    rank: 4,
    team: {
      id: 'team-4',
      name: 'Sharks',
      sportIds: [],
      playerIds: [],
      managers: [],
      tournaments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    wins: 5,
    losses: 4,
    draws: 1,
    points: 16,
    goalsFor: 16,
    goalsAgainst: 16,
    goalDifference: 0,
    played: 10,
  },
  {
    rank: 5,
    team: {
      id: 'team-5',
      name: 'Tigers',
      sportIds: [],
      playerIds: [],
      managers: [],
      tournaments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    wins: 4,
    losses: 5,
    draws: 1,
    points: 13,
    goalsFor: 14,
    goalsAgainst: 18,
    goalDifference: -4,
    played: 10,
  },
  {
    rank: 6,
    team: {
      id: 'team-6',
      name: 'Wolves',
      sportIds: [],
      playerIds: [],
      managers: [],
      tournaments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    wins: 2,
    losses: 7,
    draws: 1,
    points: 7,
    goalsFor: 9,
    goalsAgainst: 23,
    goalDifference: -14,
    played: 10,
  },
];

interface LeaderboardViewProps {
  tournamentId?: string;
}

export function LeaderboardView({
  tournamentId = 'default-tournament',
}: LeaderboardViewProps) {
  const t = useTranslations('standings');
  const tCommon = useTranslations('common');
  const [standings, setStandings] = useState<TeamStanding[]>([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to real-time leaderboard updates
  const { loading: subscriptionLoading, positionChanges } =
    useLeaderboardSubscription({
      tournamentId,
      onLeaderboardUpdate: (updatedLeaderboard) => {
        // Convert LeaderboardEntry to TeamStanding format
        const convertedStandings: TeamStanding[] = updatedLeaderboard.map(
          (entry) => ({
            rank: entry.position,
            team: {
              id: entry.teamId,
              name: `Team ${entry.teamId}`, // This should come from a team lookup
              sportIds: [],
              playerIds: [],
              managers: [],
              tournaments: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            wins: entry.wins,
            losses: entry.losses,
            draws: entry.draws,
            points: entry.points,
            goalsFor: entry.goalsFor,
            goalsAgainst: entry.goalsAgainst,
            goalDifference: entry.goalDifference,
            played: entry.played,
          })
        );
        setStandings(convertedStandings);
      },
      enabled: true,
      debug: true,
    });

  useEffect(() => {
    // Initialize with mock data for development
    const fetchStandings = async () => {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 800));
      setStandings(mockStandingsData);
      setLoading(false);
    };

    fetchStandings();
  }, []);

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (rank === 2) return 'bg-gray-100 text-gray-800 border-gray-200';
    if (rank === 3) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-blue-50 text-blue-700 border-blue-200';
  };

  const getGoalDifferenceColor = (diff: number) => {
    if (diff > 0) return 'text-green-800';
    if (diff < 0) return 'text-red-800';
    return 'text-gray-600';
  };

  if (loading || subscriptionLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">{tCommon('loading')}</span>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Table Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {t('leaderboard')}
          </h2>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('rank')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('team')}
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('played')}
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('wins')}
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('draws')}
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('losses')}
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('goalDiff')}
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('points')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <AnimatePresence>
                {standings.map((standing) => {
                  const hasPositionChange = positionChanges[standing.team.id];
                  return (
                    <motion.tr
                      key={standing.team.id}
                      className="hover:bg-gray-50"
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        backgroundColor: hasPositionChange
                          ? '#fef3c7'
                          : 'transparent',
                      }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{
                        duration: 0.5,
                        ease: 'easeOut',
                        backgroundColor: { duration: 2 },
                      }}
                    >
                      <td className="px-4 py-4">
                        <motion.span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRankBadgeColor(standing.rank)}`}
                          animate={
                            hasPositionChange
                              ? {
                                  scale: [1, 1.3, 1],
                                  rotate: [0, 10, -10, 0],
                                }
                              : {}
                          }
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                        >
                          {standing.rank}
                          {hasPositionChange && (
                            <motion.div
                              className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"
                              initial={{ scale: 0 }}
                              animate={{ scale: [0, 1.2, 1] }}
                              exit={{ scale: 0 }}
                              transition={{ duration: 0.5 }}
                            />
                          )}
                        </motion.span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-900">
                          {standing.team.name}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center text-sm text-gray-900">
                        {standing.played}
                      </td>
                      <td className="px-4 py-4 text-center text-sm text-gray-900">
                        {standing.wins}
                      </td>
                      <td className="px-4 py-4 text-center text-sm text-gray-900">
                        {standing.draws}
                      </td>
                      <td className="px-4 py-4 text-center text-sm text-gray-900">
                        {standing.losses}
                      </td>
                      <td
                        className={`px-4 py-4 text-center text-sm font-medium ${getGoalDifferenceColor(standing.goalDifference)}`}
                      >
                        {standing.goalDifference > 0 ? '+' : ''}
                        {standing.goalDifference}
                      </td>
                      <td className="px-4 py-4 text-center text-sm font-bold text-gray-900">
                        <motion.span
                          animate={
                            hasPositionChange
                              ? {
                                  scale: [1, 1.2, 1],
                                  color: ['#111827', '#059669', '#111827'],
                                }
                              : {}
                          }
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                        >
                          {standing.points}
                        </motion.span>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3 p-4">
          <AnimatePresence>
            {standings.map((standing) => {
              const hasPositionChange = positionChanges[standing.team.id];
              return (
                <motion.div
                  key={standing.team.id}
                  className="bg-gray-50 rounded-lg p-4"
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{
                    opacity: 1,
                    x: 0,
                    backgroundColor: hasPositionChange ? '#fef3c7' : '#f9fafb',
                  }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{
                    duration: 0.5,
                    ease: 'easeOut',
                    backgroundColor: { duration: 2 },
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <motion.span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRankBadgeColor(standing.rank)}`}
                        animate={
                          hasPositionChange
                            ? {
                                scale: [1, 1.3, 1],
                                rotate: [0, 10, -10, 0],
                              }
                            : {}
                        }
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      >
                        #{standing.rank}
                      </motion.span>
                      <span className="font-semibold text-gray-900">
                        {standing.team.name}
                      </span>
                    </div>
                    <motion.span
                      className="text-lg font-bold text-gray-900"
                      animate={
                        hasPositionChange
                          ? {
                              scale: [1, 1.2, 1],
                              color: ['#111827', '#059669', '#111827'],
                            }
                          : {}
                      }
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                    >
                      {standing.points} pts
                    </motion.span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-gray-500">{t('wins')}</div>
                      <div className="font-medium">{standing.wins}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-500">{t('draws')}</div>
                      <div className="font-medium">{standing.draws}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-500">{t('losses')}</div>
                      <div className="font-medium">{standing.losses}</div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between text-sm">
                    <span className="text-gray-500">
                      {t('goalDiff')}:{' '}
                      <span
                        className={`font-medium ${getGoalDifferenceColor(standing.goalDifference)}`}
                      >
                        {standing.goalDifference > 0 ? '+' : ''}
                        {standing.goalDifference}
                      </span>
                    </span>
                    <span className="text-gray-500">
                      {t('played')}: {standing.played}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Last Updated */}
      <div className="text-center mt-4 text-sm text-gray-500">
        {t('lastUpdated')}: {new Date().toLocaleString()}
      </div>
    </div>
  );
}
