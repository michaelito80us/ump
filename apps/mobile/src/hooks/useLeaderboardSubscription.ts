'use client';

import { useSubscription } from '@apollo/client';
import { useEffect, useState } from 'react';
import { gql } from '@apollo/client';

// GraphQL subscription for leaderboard updates
const LEADERBOARD_UPDATED_SUBSCRIPTION = gql`
  subscription LeaderboardUpdated($tournamentId: ID!) {
    leaderboardUpdated(tournamentId: $tournamentId) {
      teamId
      position
      points
      wins
      losses
      draws
      goalsFor
      goalsAgainst
      goalDifference
      played
      updatedAt
    }
  }
`;

export interface LeaderboardEntry {
  teamId: string;
  position: number;
  points: number;
  wins: number;
  losses: number;
  draws: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  played: number;
  updatedAt?: string;
}

export interface UseLeaderboardSubscriptionOptions {
  /**
   * Tournament ID to subscribe to
   */
  tournamentId: string;

  /**
   * Callback fired when leaderboard is updated
   */
  onLeaderboardUpdate?: (leaderboard: LeaderboardEntry[]) => void;

  /**
   * Whether to enable debug logging
   */
  debug?: boolean;

  /**
   * Whether the subscription should be active
   */
  enabled?: boolean;
}

export interface UseLeaderboardSubscriptionReturn {
  /**
   * Current leaderboard data
   */
  leaderboard: LeaderboardEntry[];

  /**
   * Whether the subscription is loading
   */
  loading: boolean;

  /**
   * Subscription error if any
   */
  error: Error | null;

  /**
   * Whether the leaderboard has been updated recently
   */
  hasUpdated: boolean;

  /**
   * Number of updates received
   */
  updateCount: number;

  /**
   * Manually refetch leaderboard data
   */
  refetch: () => void;

  /**
   * Position changes for animation purposes
   */
  positionChanges: Record<string, { from: number; to: number }>;
}

/**
 * Hook for subscribing to real-time leaderboard updates via GraphQL WebSocket
 *
 * This hook provides real-time updates for tournament leaderboards and tracks
 * position changes for smooth animations.
 *
 * @param options - Configuration options
 * @returns Object with subscription state and leaderboard data
 */
export function useLeaderboardSubscription(
  options: UseLeaderboardSubscriptionOptions
): UseLeaderboardSubscriptionReturn {
  const {
    tournamentId,
    onLeaderboardUpdate,
    debug = false,
    enabled = true,
  } = options;

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [hasUpdated, setHasUpdated] = useState(false);
  const [updateCount, setUpdateCount] = useState(0);
  const [positionChanges, setPositionChanges] = useState<
    Record<string, { from: number; to: number }>
  >({});
  const [previousPositions, setPreviousPositions] = useState<
    Record<string, number>
  >({});

  // Subscribe to leaderboard updates
  const { data, loading, error, restart } = useSubscription(
    LEADERBOARD_UPDATED_SUBSCRIPTION,
    {
      variables: { tournamentId },
      skip: !enabled || !tournamentId,
      onError: (error) => {
        if (debug) {
          console.error(
            '[useLeaderboardSubscription] Subscription error:',
            error
          );
        }
      },
      onData: ({ data }) => {
        if (debug) {
          console.log('[useLeaderboardSubscription] Received update:', data);
        }
      },
    }
  );

  // Handle subscription data updates
  useEffect(() => {
    if (!data?.leaderboardUpdated) return;

    const updatedLeaderboard = data.leaderboardUpdated as LeaderboardEntry[];

    // Sort by position to ensure correct order
    const sortedLeaderboard = [...updatedLeaderboard].sort(
      (a, b) => a.position - b.position
    );

    // Track position changes for animations
    const newPositionChanges: Record<string, { from: number; to: number }> = {};

    sortedLeaderboard.forEach((entry) => {
      const previousPosition = previousPositions[entry.teamId];
      if (
        previousPosition !== undefined &&
        previousPosition !== entry.position
      ) {
        newPositionChanges[entry.teamId] = {
          from: previousPosition,
          to: entry.position,
        };
      }
    });

    // Update position changes if any
    if (Object.keys(newPositionChanges).length > 0) {
      setPositionChanges(newPositionChanges);

      // Clear position changes after animation duration
      setTimeout(() => {
        setPositionChanges({});
      }, 1000);
    }

    // Update previous positions
    const newPreviousPositions: Record<string, number> = {};
    sortedLeaderboard.forEach((entry) => {
      newPreviousPositions[entry.teamId] = entry.position;
    });
    setPreviousPositions(newPreviousPositions);

    // Update leaderboard state
    setLeaderboard(sortedLeaderboard);
    setHasUpdated(true);
    setUpdateCount((prev) => prev + 1);

    // Fire callback
    onLeaderboardUpdate?.(sortedLeaderboard);

    if (debug) {
      console.log('[useLeaderboardSubscription] Leaderboard updated:', {
        entriesCount: sortedLeaderboard.length,
        positionChanges: newPositionChanges,
        updateCount: updateCount + 1,
      });
    }

    // Reset hasUpdated flag after a delay
    setTimeout(() => {
      setHasUpdated(false);
    }, 3000);
  }, [data, previousPositions, updateCount, onLeaderboardUpdate, debug]);

  return {
    leaderboard,
    loading,
    error: error || null,
    hasUpdated,
    updateCount,
    refetch: restart,

    positionChanges,
  };
}

/**
 * Simplified hook for subscribing to leaderboard updates
 *
 * This is a convenience wrapper around useLeaderboardSubscription
 * for common use cases.
 */
export function useLeaderboardUpdates(
  tournamentId: string,
  onUpdate?: (leaderboard: LeaderboardEntry[]) => void,
  enabled = true
) {
  return useLeaderboardSubscription({
    tournamentId,
    onLeaderboardUpdate: onUpdate,
    enabled,
  });
}
