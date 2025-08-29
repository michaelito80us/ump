'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// Types for real-time events
export interface ScoreUpdate {
  matchId: string;
  homeScore: number;
  awayScore: number;
  timestamp: string;
  period?: string;
  gameTime?: string;
}

export interface MatchEvent {
  id: string;
  matchId: string;
  type:
    | 'GOAL'
    | 'CARD'
    | 'SUBSTITUTION'
    | 'TIMEOUT'
    | 'PERIOD_START'
    | 'PERIOD_END';
  timestamp: string;
  description: string;
  playerId?: string;
  teamId?: string;
}

// Additional types for other message types
export interface MatchStatus {
  matchId: string;
  status: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED';
  timestamp: string;
}

export interface ConnectionStatus {
  status: 'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING';
  timestamp: string;
}

export interface RealtimeMessage {
  type: 'SCORE_UPDATE' | 'MATCH_EVENT' | 'MATCH_STATUS' | 'CONNECTION_STATUS';
  data: ScoreUpdate | MatchEvent | MatchStatus | ConnectionStatus;
}

// Enhanced WebSocket Mock for realistic simulation
export class EnhancedWebSocketMock {
  private listeners: { [key: string]: ((event: MessageEvent) => void)[] } = {};
  private intervalId: NodeJS.Timeout | null = null;
  private isConnected = false;
  private matchIds: string[] = [];
  private scores: { [matchId: string]: { home: number; away: number } } = {};

  constructor(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _url: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _protocols?: string | string[]
  ) {
    // Simulate connection delay
    setTimeout(() => {
      this.isConnected = true;
      this.dispatchEvent('open', {});
      this.startSimulation();
    }, 100);
  }

  addEventListener(type: string, listener: (event: MessageEvent) => void) {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(listener);
  }

  removeEventListener(type: string, listener: (event: MessageEvent) => void) {
    if (this.listeners[type]) {
      this.listeners[type] = this.listeners[type].filter((l) => l !== listener);
    }
  }

  send(data: string) {
    try {
      const message = JSON.parse(data);
      if (message.type === 'SUBSCRIBE_MATCHES' && message.matchIds) {
        this.matchIds = message.matchIds;
        // Initialize scores for subscribed matches
        message.matchIds.forEach((matchId: string) => {
          this.scores[matchId] = { home: 0, away: 0 };
        });
      }
    } catch (
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _e
    ) {
      console.warn('Invalid message format:', data);
    }
  }

  close() {
    this.isConnected = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.dispatchEvent('close', {});
  }

  private dispatchEvent(
    type: string,
    data: RealtimeMessage | Record<string, unknown>
  ) {
    if (this.listeners[type]) {
      const event = new MessageEvent(type, { data: JSON.stringify(data) });
      this.listeners[type].forEach((listener) => listener(event));
    }
  }

  private startSimulation() {
    // Send periodic score updates every 3-8 seconds
    this.intervalId = setInterval(
      () => {
        if (this.matchIds.length > 0 && Math.random() > 0.3) {
          this.simulateScoreUpdate();
        }

        // Occasionally send match events
        if (this.matchIds.length > 0 && Math.random() > 0.7) {
          this.simulateMatchEvent();
        }
      },
      3000 + Math.random() * 5000
    );
  }

  private simulateScoreUpdate() {
    const matchId =
      this.matchIds[Math.floor(Math.random() * this.matchIds.length)];
    const currentScore = this.scores[matchId] || { home: 0, away: 0 };

    // Randomly increment home or away score
    if (Math.random() > 0.5) {
      currentScore.home++;
    } else {
      currentScore.away++;
    }

    this.scores[matchId] = currentScore;

    const scoreUpdate: RealtimeMessage = {
      type: 'SCORE_UPDATE',
      data: {
        matchId,
        homeScore: currentScore.home,
        awayScore: currentScore.away,
        timestamp: new Date().toISOString(),
        period: `Period ${Math.floor(Math.random() * 3) + 1}`,
        gameTime: `${Math.floor(Math.random() * 45) + 1}:${Math.floor(
          Math.random() * 60
        )
          .toString()
          .padStart(2, '0')}`,
      },
    };

    this.dispatchEvent('message', scoreUpdate);
  }

  private simulateMatchEvent() {
    const matchId =
      this.matchIds[Math.floor(Math.random() * this.matchIds.length)];
    const eventTypes = ['GOAL', 'CARD', 'SUBSTITUTION', 'TIMEOUT'] as const;
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];

    const matchEvent: RealtimeMessage = {
      type: 'MATCH_EVENT',
      data: {
        id: `event-${Date.now()}`,
        matchId,
        type: eventType,
        timestamp: new Date().toISOString(),
        description: this.getEventDescription(eventType),
        playerId: `player-${Math.floor(Math.random() * 20) + 1}`,
        teamId: `team-${Math.floor(Math.random() * 2) + 1}`,
      },
    };

    this.dispatchEvent('message', matchEvent);
  }

  private getEventDescription(eventType: string): string {
    const descriptions = {
      GOAL: 'Goal scored!',
      CARD: Math.random() > 0.5 ? 'Yellow card issued' : 'Red card issued',
      SUBSTITUTION: 'Player substitution',
      TIMEOUT: 'Team timeout called',
    };
    return (
      descriptions[eventType as keyof typeof descriptions] || 'Match event'
    );
  }

  // WebSocket-like properties
  get readyState() {
    return this.isConnected ? 1 : 0; // OPEN = 1
  }

  get CONNECTING() {
    return 0;
  }
  get OPEN() {
    return 1;
  }
  get CLOSING() {
    return 2;
  }
  get CLOSED() {
    return 3;
  }
}

// Types for match updates and change details
export interface RealtimeMatch {
  id: string;
  status: string;
  scoreA?: number;
  scoreB?: number;
  teamA?: {
    name: string;
  };
  teamB?: {
    name: string;
  };
}

export interface MatchUpdateCallback {
  (
    match: RealtimeMatch,
    changeDetails: Array<{ type: string; description?: string }>
  ): void;
}

// React hook for using the realtime simulator
export function useRealtimeSimulator(matchIds: string[] = []) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [lastMessage, setLastMessage] = useState<RealtimeMessage | null>(null);
  const [scores, setScores] = useState<{ [matchId: string]: ScoreUpdate }>({});
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [isSimulationActive, setIsSimulationActive] = useState(false);
  const wsRef = useRef<EnhancedWebSocketMock | null>(null);
  const subscriptionsRef = useRef<{ [matchId: string]: MatchUpdateCallback }>(
    {}
  );

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === 1) return; // Already connected

    setConnectionStatus('Connecting...');

    // Use mock WebSocket for development/testing
    wsRef.current = new EnhancedWebSocketMock('ws://localhost:4000/realtime');

    wsRef.current.addEventListener('open', () => {
      setIsConnected(true);
      setConnectionStatus('Connected to simulation server');
      // Note: Match subscription is handled separately in useEffect
    });

    wsRef.current.addEventListener('message', (event) => {
      try {
        const message: RealtimeMessage = JSON.parse(event.data);
        setLastMessage(message);

        switch (message.type) {
          case 'SCORE_UPDATE': {
            const scoreData = message.data as ScoreUpdate;
            setScores((prev) => ({
              ...prev,
              [scoreData.matchId]: scoreData,
            }));

            // Trigger match update callback if subscribed
            const callback = subscriptionsRef.current[scoreData.matchId];
            if (callback) {
              const mockMatch = {
                id: scoreData.matchId,
                scoreA: scoreData.homeScore,
                scoreB: scoreData.awayScore,
                teamA: { name: 'Team A' },
                teamB: { name: 'Team B' },
                status: 'LIVE',
              };
              callback(mockMatch, [
                { type: 'SCORE_UPDATE', description: 'Score updated' },
              ]);
            }
            break;
          }

          case 'MATCH_EVENT': {
            const eventData = message.data as MatchEvent;
            setEvents((prev) => [eventData, ...prev].slice(0, 50)); // Keep last 50 events

            // Trigger match event callback if subscribed
            const eventCallback = subscriptionsRef.current[eventData.matchId];
            if (eventCallback) {
              const mockMatch = {
                id: eventData.matchId,
                status: 'LIVE',
              };
              eventCallback(mockMatch, [
                { type: 'MATCH_EVENT', description: eventData.description },
              ]);
            }
            break;
          }
        }
      } catch (error) {
        console.error('Error parsing realtime message:', error);
      }
    });

    wsRef.current.addEventListener('close', () => {
      setIsConnected(false);
      setConnectionStatus('Disconnected');
    });

    wsRef.current.addEventListener('error', (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
      setConnectionStatus('Connection error');
    });
  }, []); // Remove matchIds dependency to prevent reconnection loops

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    setIsConnected(false);
    setConnectionStatus('Disconnected');
  }, []);

  const subscribeToMatches = useCallback((newMatchIds: string[]) => {
    if (wsRef.current?.readyState === 1) {
      wsRef.current.send(
        JSON.stringify({
          type: 'SUBSCRIBE_MATCHES',
          matchIds: newMatchIds,
        })
      );
    }
  }, []);

  const startSimulation = useCallback(() => {
    setIsSimulationActive(true);
    if (!isConnected) {
      connect();
    }
  }, [isConnected, connect]);

  const stopSimulation = useCallback(() => {
    setIsSimulationActive(false);
    disconnect();
  }, [disconnect]);

  const subscribeToMatch = useCallback(
    (matchId: string, callback: MatchUpdateCallback): (() => void) => {
      subscriptionsRef.current[matchId] = callback;

      // Subscribe to this specific match if connected
      if (wsRef.current?.readyState === 1) {
        wsRef.current.send(
          JSON.stringify({
            type: 'SUBSCRIBE_MATCHES',
            matchIds: [matchId],
          })
        );
      }

      // Return unsubscribe function
      return () => {
        delete subscriptionsRef.current[matchId];
      };
    },
    []
  );

  const unsubscribeFromMatch = useCallback((matchId: string) => {
    delete subscriptionsRef.current[matchId];
  }, []);

  // Auto-connect when component mounts (only once)
  useEffect(() => {
    connect();
    return () => {
      // Clean up connection on unmount
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
        setIsConnected(false);
        setConnectionStatus('Disconnected');
      }
    };
  }, []); // Remove dependencies to prevent reconnection loops

  // Update subscription when matchIds change or connection is established
  useEffect(() => {
    if (isConnected && matchIds.length > 0) {
      subscribeToMatches(matchIds);
    }
  }, [isConnected, matchIds, subscribeToMatches]);

  return {
    isConnected,
    connectionStatus,
    lastMessage,
    scores,
    events,
    isSimulationActive,
    connect,
    disconnect,
    subscribeToMatches,
    startSimulation,
    stopSimulation,
    subscribeToMatch,
    unsubscribeFromMatch,
  };
}

// Utility function to create mock match IDs for testing
export function createMockMatchIds(count: number = 3): string[] {
  return Array.from({ length: count }, (_, i) => `match-${i + 1}`);
}

// Export the simulator service as default
export default {
  EnhancedWebSocketMock,
  useRealtimeSimulator,
  createMockMatchIds,
};
