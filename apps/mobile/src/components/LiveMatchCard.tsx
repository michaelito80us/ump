'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMatchSubscription } from '../hooks/useMatchSubscription';
import { Match, MatchStatus } from '../../lib/types';
import { useTranslations } from 'next-intl';

interface LiveMatchCardProps {
  tournamentId: string;
  matchId?: string;
  initialMatch?: Match;
  onMatchUpdate?: (match: Match) => void;
  debug?: boolean;
}

interface ScoreChangeAnimation {
  field: 'scoreA' | 'scoreB';
  oldValue: number;
  newValue: number;
  timestamp: number;
}

/**
 * LiveMatchCard component demonstrating T-8.2 real-time diff rendering
 *
 * Features:
 * - Real-time WebSocket updates via GraphQL subscriptions
 * - Efficient diff-based rendering using patch system
 * - Smooth animations for score changes
 * - Visual indicators for field updates
 * - Debug mode showing patch details
 */
export function LiveMatchCard({
  tournamentId,
  matchId,
  initialMatch,
  onMatchUpdate,
  debug = false,
}: LiveMatchCardProps) {
  const t = useTranslations();
  const [scoreAnimations, setScoreAnimations] = useState<
    ScoreChangeAnimation[]
  >([]);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    'connecting' | 'connected' | 'error'
  >('connecting');

  // Use the real-time subscription hook with diff rendering
  const { match, loading, error, hasUpdated, updateCount } =
    useMatchSubscription({
      tournamentId,
      matchId,
      onMatchUpdate: (updatedMatch) => {
        setLastUpdateTime(new Date());
        onMatchUpdate?.(updatedMatch);

        // Track score changes for animations
        if (match && updatedMatch) {
          const animations: ScoreChangeAnimation[] = [];

          if (match.scoreA !== updatedMatch.scoreA) {
            animations.push({
              field: 'scoreA',
              oldValue: match.scoreA,
              newValue: updatedMatch.scoreA,
              timestamp: Date.now(),
            });
          }

          if (match.scoreB !== updatedMatch.scoreB) {
            animations.push({
              field: 'scoreB',
              oldValue: match.scoreB,
              newValue: updatedMatch.scoreB,
              timestamp: Date.now(),
            });
          }

          if (animations.length > 0) {
            setScoreAnimations((prev) => [...prev, ...animations]);

            // Clear animations after 2 seconds
            setTimeout(() => {
              setScoreAnimations((prev) =>
                prev.filter((anim) => Date.now() - anim.timestamp > 2000)
              );
            }, 2000);
          }
        }
      },
      debug,
      enabled: true,
    });

  // Update connection status based on subscription state
  useEffect(() => {
    if (loading) {
      setConnectionStatus('connecting');
    } else if (error) {
      setConnectionStatus('error');
    } else {
      setConnectionStatus('connected');
    }
  }, [loading, error]);

  // Use initial match if provided and no subscription data yet
  const displayMatch = match || initialMatch;

  if (!displayMatch) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: MatchStatus) => {
    switch (status) {
      case 'LIVE':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'FINAL':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'NEEDS_APPROVAL':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const isScoreAnimating = (field: 'scoreA' | 'scoreB') => {
    return scoreAnimations.some(
      (anim) => anim.field === field && Date.now() - anim.timestamp < 2000
    );
  };

  return (
    <motion.div
      className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      layout
    >
      {/* Header with status and connection indicator */}
      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(displayMatch.status)}`}
          >
            {t(`status.${displayMatch.status.toLowerCase()}`)}
          </span>

          {displayMatch.venue && (
            <span className="text-sm text-gray-600">
              📍 {displayMatch.venue}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Real-time connection indicator */}
          <div className="flex items-center space-x-1">
            <div
              className={`w-2 h-2 rounded-full ${getConnectionStatusColor()}`}
            ></div>
            <span className="text-xs text-gray-500">
              {connectionStatus === 'connected'
                ? 'Live'
                : connectionStatus === 'connecting'
                  ? 'Connecting...'
                  : 'Offline'}
            </span>
          </div>

          {hasUpdated && (
            <motion.div
              className="text-xs text-blue-600 font-medium"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              Updated
            </motion.div>
          )}
        </div>
      </div>

      {/* Main match content */}
      <div className="p-6">
        {/* Teams and scores */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {displayMatch.teamA.name}
            </h3>
            <motion.div
              className={`text-3xl font-bold ${
                isScoreAnimating('scoreA') ? 'text-blue-600' : 'text-gray-900'
              }`}
              animate={
                isScoreAnimating('scoreA')
                  ? {
                      scale: [1, 1.2, 1],
                      color: ['#1f2937', '#2563eb', '#1f2937'],
                    }
                  : {}
              }
              transition={{ duration: 0.5 }}
            >
              {displayMatch.scoreA}
            </motion.div>
          </div>

          <div className="px-4">
            <div className="text-2xl font-bold text-gray-400">VS</div>
          </div>

          <div className="flex-1 text-right">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {displayMatch.teamB.name}
            </h3>
            <motion.div
              className={`text-3xl font-bold ${
                isScoreAnimating('scoreB') ? 'text-blue-600' : 'text-gray-900'
              }`}
              animate={
                isScoreAnimating('scoreB')
                  ? {
                      scale: [1, 1.2, 1],
                      color: ['#1f2937', '#2563eb', '#1f2937'],
                    }
                  : {}
              }
              transition={{ duration: 0.5 }}
            >
              {displayMatch.scoreB}
            </motion.div>
          </div>
        </div>

        {/* Match details */}
        {displayMatch.scheduledTime && (
          <div className="text-sm text-gray-600 mb-2">
            🕒{' '}
            {new Date(displayMatch.scheduledTime)
              .toISOString()
              .replace('T', ' ')
              .slice(0, 19)}
          </div>
        )}

        {lastUpdateTime && (
          <div className="text-xs text-gray-500">
            Last updated:{' '}
            {lastUpdateTime.toISOString().replace('T', ' ').slice(11, 19)}
          </div>
        )}
      </div>

      {/* Debug information */}
      {debug && (
        <div className="bg-gray-50 border-t border-gray-200 p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            Debug Info (T-8.2)
          </h4>
          <div className="text-xs text-gray-600 space-y-1">
            <div>Match ID: {displayMatch.id}</div>
            <div>Update Count: {updateCount}</div>
            <div>Has Updated: {hasUpdated ? 'Yes' : 'No'}</div>
            <div>Connection: {connectionStatus}</div>
            <div>Active Animations: {scoreAnimations.length}</div>
            {error && (
              <div className="text-red-800">Error: {error.message}</div>
            )}
          </div>
        </div>
      )}

      {/* Score change animations overlay */}
      <AnimatePresence>
        {scoreAnimations.map((animation, index) => (
          <motion.div
            key={`${animation.field}-${animation.timestamp}-${index}`}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            initial={{ opacity: 0, scale: 0.5, y: 0 }}
            animate={{ opacity: 1, scale: 1, y: -20 }}
            exit={{ opacity: 0, scale: 0.5, y: -40 }}
            transition={{ duration: 0.8 }}
          >
            <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
              +{animation.newValue - animation.oldValue}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}

export default LiveMatchCard;
