'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useWebSocket } from '../lib/websocket-provider';

// Types for real-time events
interface RealtimeEvent {
  id: string;
  type: string;
  entityId: string;
  entityType: string;
  data: any;
  timestamp: string;
  userId?: string;
}

interface TournamentEvent extends RealtimeEvent {
  entityType: 'TOURNAMENT';
  data: {
    id: string;
    name?: string;
    status?: 'DRAFT' | 'PUBLISHED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
    startDate?: string;
    endDate?: string;
    participantCount?: number;
    [key: string]: any;
  };
}

interface MatchEvent extends RealtimeEvent {
  entityType: 'MATCH';
  data: {
    id: string;
    tournamentId?: string;
    teamAId?: string;
    teamBId?: string;
    scoreA?: number;
    scoreB?: number;
    status?: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED' | 'CANCELLED';
    startTime?: string;
    venue?: string;
    [key: string]: any;
  };
}

interface SystemEvent extends RealtimeEvent {
  entityType: 'SYSTEM';
  data: {
    message: string;
    level: 'info' | 'warning' | 'error';
    [key: string]: any;
  };
}

// Hook for general real-time connection management
export function useRealtimeConnection() {
  const { connectionState, isConnected, reconnect, lastError } = useWebSocket();

  return {
    connectionState,
    isConnected,
    reconnect,
    lastError,
    isConnecting: connectionState === 'connecting',
    isDisconnected: connectionState === 'disconnected',
    hasError: connectionState === 'error',
  };
}

// Hook for subscribing to tournament updates
export function useTournamentSubscription(tournamentId?: string) {
  const { subscribe, isConnected } = useWebSocket();
  const [tournamentData, setTournamentData] = useState<any>(null);
  const [lastUpdate, setLastUpdate] = useState<TournamentEvent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const handleTournamentEvent = useCallback((event: RealtimeEvent) => {
    if (event.entityType === 'TOURNAMENT') {
      const tournamentEvent = event as TournamentEvent;
      setLastUpdate(tournamentEvent);

      // Update tournament data with the new information
      setTournamentData((prev: any) => {
        if (!prev) return tournamentEvent.data;
        return { ...prev, ...tournamentEvent.data };
      });

      console.log('Tournament update received:', tournamentEvent);
    }
  }, []);

  useEffect(() => {
    if (!tournamentId || !isConnected) {
      return;
    }

    setIsLoading(true);

    // Subscribe to tournament-specific channel
    const channel = `tournament:${tournamentId}`;
    unsubscribeRef.current = subscribe(channel, handleTournamentEvent);

    setIsLoading(false);

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [tournamentId, isConnected, subscribe, handleTournamentEvent]);

  return {
    tournamentData,
    lastUpdate,
    isLoading,
    isSubscribed: !!unsubscribeRef.current,
  };
}

// Hook for subscribing to match updates
export function useMatchSubscription(matchId?: string) {
  const { subscribe, isConnected } = useWebSocket();
  const [matchData, setMatchData] = useState<any>(null);
  const [lastUpdate, setLastUpdate] = useState<MatchEvent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const handleMatchEvent = useCallback((event: RealtimeEvent) => {
    if (event.entityType === 'MATCH') {
      const matchEvent = event as MatchEvent;
      setLastUpdate(matchEvent);

      // Update match data with the new information
      setMatchData((prev: any) => {
        if (!prev) return matchEvent.data;
        return { ...prev, ...matchEvent.data };
      });

      console.log('Match update received:', matchEvent);
    }
  }, []);

  useEffect(() => {
    if (!matchId || !isConnected) {
      return;
    }

    setIsLoading(true);

    // Subscribe to match-specific channel
    const channel = `match:${matchId}`;
    unsubscribeRef.current = subscribe(channel, handleMatchEvent);

    setIsLoading(false);

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [matchId, isConnected, subscribe, handleMatchEvent]);

  return {
    matchData,
    lastUpdate,
    isLoading,
    isSubscribed: !!unsubscribeRef.current,
  };
}

// Hook for subscribing to multiple tournaments
export function useTournamentsSubscription(tournamentIds: string[] = []) {
  const { subscribe, isConnected } = useWebSocket();
  const [tournamentsData, setTournamentsData] = useState<{ [id: string]: any }>(
    {}
  );
  const [lastUpdate, setLastUpdate] = useState<TournamentEvent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const unsubscribeRefs = useRef<Map<string, () => void>>(new Map());

  const handleTournamentEvent = useCallback((event: RealtimeEvent) => {
    if (event.entityType === 'TOURNAMENT') {
      const tournamentEvent = event as TournamentEvent;
      setLastUpdate(tournamentEvent);

      // Update specific tournament data
      setTournamentsData((prev) => ({
        ...prev,
        [tournamentEvent.entityId]: {
          ...prev[tournamentEvent.entityId],
          ...tournamentEvent.data,
        },
      }));

      console.log('Tournament update received:', tournamentEvent);
    }
  }, []);

  useEffect(() => {
    if (!isConnected || tournamentIds.length === 0) {
      return;
    }

    setIsLoading(true);

    // Clean up existing subscriptions
    unsubscribeRefs.current.forEach((unsubscribe) => unsubscribe());
    unsubscribeRefs.current.clear();

    // Subscribe to each tournament
    tournamentIds.forEach((tournamentId) => {
      const channel = `tournament:${tournamentId}`;
      const unsubscribe = subscribe(channel, handleTournamentEvent);
      unsubscribeRefs.current.set(tournamentId, unsubscribe);
    });

    setIsLoading(false);

    return () => {
      unsubscribeRefs.current.forEach((unsubscribe) => unsubscribe());
      unsubscribeRefs.current.clear();
    };
  }, [tournamentIds, isConnected, subscribe, handleTournamentEvent]);

  return {
    tournamentsData,
    lastUpdate,
    isLoading,
    subscribedCount: unsubscribeRefs.current.size,
  };
}

// Hook for subscribing to multiple matches
export function useMatchesSubscription(matchIds: string[] = []) {
  const { subscribe, isConnected } = useWebSocket();
  const [matchesData, setMatchesData] = useState<{ [id: string]: any }>({});
  const [lastUpdate, setLastUpdate] = useState<MatchEvent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const unsubscribeRefs = useRef<Map<string, () => void>>(new Map());

  const handleMatchEvent = useCallback((event: RealtimeEvent) => {
    if (event.entityType === 'MATCH') {
      const matchEvent = event as MatchEvent;
      setLastUpdate(matchEvent);

      // Update specific match data
      setMatchesData((prev) => ({
        ...prev,
        [matchEvent.entityId]: {
          ...prev[matchEvent.entityId],
          ...matchEvent.data,
        },
      }));

      console.log('Match update received:', matchEvent);
    }
  }, []);

  useEffect(() => {
    if (!isConnected || matchIds.length === 0) {
      return;
    }

    setIsLoading(true);

    // Clean up existing subscriptions
    unsubscribeRefs.current.forEach((unsubscribe) => unsubscribe());
    unsubscribeRefs.current.clear();

    // Subscribe to each match
    matchIds.forEach((matchId) => {
      const channel = `match:${matchId}`;
      const unsubscribe = subscribe(channel, handleMatchEvent);
      if (unsubscribe) {
        unsubscribeRefs.current.set(matchId, unsubscribe);
      }
    });

    setIsLoading(false);

    return () => {
      unsubscribeRefs.current.forEach((unsubscribe) => unsubscribe());
      unsubscribeRefs.current.clear();
    };
  }, [matchIds, isConnected, subscribe, handleMatchEvent]);

  return {
    matchesData,
    lastUpdate,
    isLoading,
    subscribedCount: unsubscribeRefs.current.size,
  };
}

// Hook for subscribing to system notifications
export function useSystemNotifications() {
  const { subscribe, isConnected } = useWebSocket();
  const [notifications, setNotifications] = useState<SystemEvent[]>([]);
  const [lastNotification, setLastNotification] = useState<SystemEvent | null>(
    null
  );
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const handleSystemEvent = useCallback((event: RealtimeEvent) => {
    if (event.entityType === 'SYSTEM') {
      const systemEvent = event as SystemEvent;
      setLastNotification(systemEvent);

      // Add to notifications list (keep last 50)
      setNotifications((prev) => {
        const updated = [systemEvent, ...prev].slice(0, 50);
        return updated;
      });

      console.log('System notification received:', systemEvent);
    }
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setLastNotification(null);
  }, []);

  const dismissNotification = useCallback((notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  }, []);

  useEffect(() => {
    if (!isConnected) {
      return;
    }

    // Subscribe to system notifications
    const channel = 'system:notifications';
    unsubscribeRef.current = subscribe(channel, handleSystemEvent);

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [isConnected, subscribe, handleSystemEvent]);

  return {
    notifications,
    lastNotification,
    clearNotifications,
    dismissNotification,
    isSubscribed: !!unsubscribeRef.current,
    unreadCount: notifications.length,
  };
}

// Hook for subscribing to admin-specific events
export function useAdminSubscription() {
  const { subscribe, isConnected } = useWebSocket();
  const [adminEvents, setAdminEvents] = useState<RealtimeEvent[]>([]);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const handleAdminEvent = useCallback((event: RealtimeEvent) => {
    setLastEvent(event);

    // Add to admin events list (keep last 100)
    setAdminEvents((prev) => {
      const updated = [event, ...prev].slice(0, 100);
      return updated;
    });

    console.log('Admin event received:', event);
  }, []);

  useEffect(() => {
    if (!isConnected) {
      return;
    }

    // Subscribe to admin channel
    const channel = 'admin:events';
    unsubscribeRef.current = subscribe(channel, handleAdminEvent);

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [isConnected, subscribe, handleAdminEvent]);

  return {
    adminEvents,
    lastEvent,
    isSubscribed: !!unsubscribeRef.current,
    eventCount: adminEvents.length,
  };
}

/**
 * Hook for connection status monitoring
 */
export function useConnectionStatus() {
  const { connectionState, isConnected, lastError, reconnect } =
    useRealtimeConnection();

  return {
    connectionState,
    isConnected,
    lastError,
    reconnect,
  };
}
