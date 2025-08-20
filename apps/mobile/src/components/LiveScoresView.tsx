'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Match, MatchStatus } from '../../lib/types';
import { useMatchUpdatesSubscription } from '../hooks/useMatchSubscription';

// Mock live matches data
const mockLiveMatches: Match[] = [
  {
    id: 'live-match-1',
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
    scoreA: 14,
    scoreB: 7,
    scheduledTime: new Date().toISOString(),
    venue: 'Stadium A',
    status: 'LIVE' as MatchStatus,
  },
  {
    id: 'live-match-2',
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
    scoreA: 21,
    scoreB: 14,
    scheduledTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // Started 30 min ago
    venue: 'Stadium B',
    status: 'LIVE' as MatchStatus,
  },
];

interface LiveScoresViewProps {
  tournamentId?: string;
}

export function LiveScoresView({
  tournamentId = 'default-tournament',
}: LiveScoresViewProps) {
  const t = useTranslations('live');
  const tCommon = useTranslations('common');
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [scoreAnimations, setScoreAnimations] = useState<
    Record<string, { teamA: boolean; teamB: boolean }>
  >({});
  const previousScores = useRef<
    Record<string, { scoreA: number; scoreB: number }>
  >({});

  // Subscribe to real-time match updates
  const { loading: subscriptionLoading } = useMatchUpdatesSubscription(
    tournamentId,
    (updatedMatch) => {
      setMatches((prevMatches) => {
        const existingIndex = prevMatches.findIndex(
          (m) => m.id === updatedMatch.id
        );

        // Check for score changes to trigger animations
        const prevScore = previousScores.current[updatedMatch.id];
        if (prevScore) {
          const scoreAChanged = prevScore.scoreA !== updatedMatch.scoreA;
          const scoreBChanged = prevScore.scoreB !== updatedMatch.scoreB;

          if (scoreAChanged || scoreBChanged) {
            setScoreAnimations((prev) => ({
              ...prev,
              [updatedMatch.id]: {
                teamA: scoreAChanged,
                teamB: scoreBChanged,
              },
            }));

            // Clear animation after 2 seconds
            setTimeout(() => {
              setScoreAnimations((prev) => {
                const newAnimations = { ...prev };
                delete newAnimations[updatedMatch.id];
                return newAnimations;
              });
            }, 2000);
          }
        }

        // Update previous scores
        previousScores.current[updatedMatch.id] = {
          scoreA: updatedMatch.scoreA,
          scoreB: updatedMatch.scoreB,
        };

        if (existingIndex >= 0) {
          const newMatches = [...prevMatches];
          newMatches[existingIndex] = updatedMatch;
          return newMatches;
        } else {
          return [...prevMatches, updatedMatch];
        }
      });
    },
    false // enabled
  );

  useEffect(() => {
    // Initialize with mock data for development
    const fetchLiveMatches = async () => {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setMatches(mockLiveMatches);

      // Initialize previous scores
      mockLiveMatches.forEach((match) => {
        previousScores.current[match.id] = {
          scoreA: match.scoreA,
          scoreB: match.scoreB,
        };
      });

      setLoading(false);
    };

    fetchLiveMatches();

    // Listen for custom DOM events from E2E tests
    const handleMatchStatusUpdate = (event: CustomEvent) => {
      const { matchId, status } = event.detail;
      setMatches((prevMatches) => 
        prevMatches.map((match) => 
          match.id === matchId ? { ...match, status: status as MatchStatus } : match
        )
      );
    };

    const handleMatchUpdate = (event: CustomEvent) => {
      const { matchId, scoreA, scoreB, status } = event.detail;
      setMatches((prevMatches) => 
        prevMatches.map((match) => {
          if (match.id === matchId) {
            const updatedMatch = { 
              ...match, 
              scoreA: scoreA ?? match.scoreA,
              scoreB: scoreB ?? match.scoreB,
              status: status ? (status as MatchStatus) : match.status
            };
            
            // Update previous scores for animation tracking
            previousScores.current[matchId] = {
              scoreA: updatedMatch.scoreA,
              scoreB: updatedMatch.scoreB,
            };
            
            return updatedMatch;
          }
          return match;
        })
      );
    };

    // Add event listeners
    window.addEventListener('matchStatusUpdate', handleMatchStatusUpdate as EventListener);
    window.addEventListener('matchUpdate', handleMatchUpdate as EventListener);

    // Cleanup event listeners
    return () => {
      window.removeEventListener('matchStatusUpdate', handleMatchStatusUpdate as EventListener);
      window.removeEventListener('matchUpdate', handleMatchUpdate as EventListener);
    };
  }, []);

  const getMatchDuration = (startTime: string) => {
    const start = new Date(startTime);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - start.getTime()) / (1000 * 60)
    );
    return `${diffInMinutes}'`;
  };

  if (loading || subscriptionLoading) {
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
    <div className="p-4 space-y-4" data-testid="live-scores-view">
      {/* Live indicator */}
      <div className="flex items-center justify-center mb-4">
        <div className="flex items-center space-x-2 bg-red-100 text-red-800 px-3 py-1 rounded-full" data-testid="live-indicator">
          <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">{t('live')}</span>
        </div>
      </div>

      {matches.map((match, index) => (
        <div
          key={match.id}
          data-testid={index === 0 ? 'live-match-card' : `live-match-card-${match.id}`}
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
                <span className="text-sm text-red-800">
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
                <div className="font-semibold text-lg text-gray-900 mb-1" data-testid={`live-team-a-name-${match.id}`}>
                  {match.teamA.name}
                </div>
                <motion.div
                  className="text-3xl font-bold text-gray-900"
                  data-testid={`live-team-a-score-${match.id}`}
                  animate={
                    scoreAnimations[match.id]?.teamA
                      ? {
                          scale: [1, 1.2, 1],
                          color: ['#111827', '#dc2626', '#111827'],
                        }
                      : {}
                  }
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                >
                  {match.scoreA}
                </motion.div>
              </div>

              {/* VS Separator */}
              <div className="px-4">
                <div className="text-gray-400 font-medium">VS</div>
              </div>

              {/* Team B */}
              <div className="flex-1 text-center">
                <div className="font-semibold text-lg text-gray-900 mb-1" data-testid={`live-team-b-name-${match.id}`}>
                  {match.teamB.name}
                </div>
                <motion.div
                  className="text-3xl font-bold text-gray-900"
                  data-testid={`live-team-b-score-${match.id}`}
                  animate={
                    scoreAnimations[match.id]?.teamB
                      ? {
                          scale: [1, 1.2, 1],
                          color: ['#111827', '#dc2626', '#111827'],
                        }
                      : {}
                  }
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                >
                  {match.scoreB}
                </motion.div>
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
