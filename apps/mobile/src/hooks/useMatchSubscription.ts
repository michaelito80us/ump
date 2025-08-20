'use client';

import { useSubscription } from '@apollo/client';
import { useEffect, useCallback } from 'react';
import { gql } from '@apollo/client';
import { Match } from '../../lib/types';
import { useMatchDiff } from './useMatchDiff';

// GraphQL subscription for match updates
const MATCH_UPDATED_SUBSCRIPTION = gql`
  subscription MatchUpdatedMobile($tournamentId: ID!) {
    matchUpdated(tournamentId: $tournamentId) {
      id
      phaseId
      teamA {
        id
        name
      }
      teamB {
        id
        name
      }
      scoreA
      scoreB
      status
      scheduledAt
      venue
      updatedAt
    }
  }
`;

export interface UseMatchSubscriptionOptions {
  /**
   * Tournament ID to subscribe to
   */
  tournamentId: string;

  /**
   * Optional match ID to filter updates for a specific match
   */
  matchId?: string;

  /**
   * Callback fired when a match is updated
   */
  onMatchUpdate?: (match: Match) => void;

  /**
   * Whether to enable debug logging
   */
  debug?: boolean;

  /**
   * Whether the subscription should be active
   */
  enabled?: boolean;
}

export interface UseMatchSubscriptionReturn {
  /**
   * Current match data (if matchId is provided)
   */
  match: Match | null;

  /**
   * Whether the subscription is loading
   */
  loading: boolean;

  /**
   * Subscription error if any
   */
  error: Error | null;

  /**
   * Whether the match has been updated recently
   */
  hasUpdated: boolean;

  /**
   * Number of updates received
   */
  updateCount: number;

  /**
   * Manually refetch match data
   */
  refetch: () => void;
}

/**
 * Hook for subscribing to real-time match updates via GraphQL WebSocket
 *
 * This hook provides real-time updates for tournament matches and can optionally
 * track a specific match with efficient diff-based updates.
 *
 * @param options - Configuration options
 * @returns Object with subscription state and match data
 */
export function useMatchSubscription(
  options: UseMatchSubscriptionOptions
): UseMatchSubscriptionReturn {
  const {
    tournamentId,
    matchId,
    onMatchUpdate,
    debug = false,
    enabled = true,
  } = options;

  // Return early if disabled to prevent GraphQL subscription
  if (!enabled) {
    return {
      match: null,
      loading: false,
      error: null,
      hasUpdated: false,
      updateCount: 0,
      refetch: () => {},
    };
  }

  // Use match diff hook for efficient updates
  const { match, hasUpdated, updateCount, updateMatch, resetMatch } =
    useMatchDiff(null, {
      debug,
      onPatchApplied: (patch, newMatch) => {
        if (debug) {
          console.log('[useMatchSubscription] Match updated via patch:', {
            matchId: patch.id,
            changes: patch.changes,
            newMatch,
          });
        }
        onMatchUpdate?.(newMatch);
      },
    });

  // Subscribe to match updates
  const { data, loading, error } = useSubscription(MATCH_UPDATED_SUBSCRIPTION, {
    variables: { tournamentId },
    skip: !enabled || !tournamentId,
    onError: (error) => {
      if (debug) {
        console.error('[useMatchSubscription] Subscription error:', error);
      }
    },
    onData: ({ data }) => {
      if (debug) {
        console.log('[useMatchSubscription] Received update:', data);
      }
    },
  });

  // Handle subscription data updates
  useEffect(() => {
    if (!data?.matchUpdated) return;

    const updatedMatch = data.matchUpdated as Match;

    // If we're tracking a specific match, only update if it matches
    if (matchId && updatedMatch.id !== matchId) {
      return;
    }

    // Update the match using diff strategy
    updateMatch(updatedMatch);

    // Fire callback for any match update (not just the tracked one)
    if (!matchId) {
      onMatchUpdate?.(updatedMatch);
    }
  }, [data, matchId, updateMatch, onMatchUpdate]);

  // Reset match when matchId changes
  useEffect(() => {
    if (matchId) {
      resetMatch();
    }
  }, [matchId, resetMatch]);

  // Manual refetch function
  const handleRefetch = useCallback(() => {
    // Note: useSubscription doesn't provide refetch functionality
    // This is a no-op for subscriptions
  }, []);

  return {
    match: matchId ? match : null, // Only return match if we're tracking a specific one
    loading,
    error: error || null,
    hasUpdated,
    updateCount,
    refetch: handleRefetch,
  };
}

/**
 * Simplified hook for subscribing to all match updates in a tournament
 *
 * This is useful for pages that need to show live updates for multiple matches
 * without tracking specific match state.
 */
export function useMatchUpdatesSubscription(
  tournamentId: string,
  onMatchUpdate?: (match: Match) => void,
  enabled = true
) {
  return useMatchSubscription({
    tournamentId,
    onMatchUpdate,
    enabled,
  });
}

/**
 * Hook for subscribing to updates for a specific match
 *
 * This is useful for match detail pages or components that need to track
 * a single match with efficient updates.
 */
export function useSpecificMatchSubscription(
  tournamentId: string,
  matchId: string,
  onMatchUpdate?: (match: Match) => void,
  enabled = true
) {
  return useMatchSubscription({
    tournamentId,
    matchId,
    onMatchUpdate,
    enabled,
  });
}
