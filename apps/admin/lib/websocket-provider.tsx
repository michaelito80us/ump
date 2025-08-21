'use client';

/* global WebSocket */

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { useAuth } from '@clerk/nextjs';
import {
  getWebSocketConfig,
  WebSocketMessageType,
  ConnectionState,
  getSecureWebSocketUrl,
} from './websocket-config';

// Safe hook to use Clerk auth only when available
function useSafeAuth() {
  try {
    const auth = useAuth();
    return { ...auth, isClerkAvailable: true };
  } catch (_error) {
    // Clerk is not available, return safe defaults
    return {
      getToken: async () => null,
      isSignedIn: false,
      isClerkAvailable: false,
    };
  }
}

// Types from the realtime package
interface WebSocketMessage {
  id: string;
  type: string;
  timestamp: Date;
  data?: any;
}

interface RealtimeEvent {
  id: string;
  type: string;
  entityId: string;
  entityType: string;
  data: any;
  timestamp: string;
  userId?: string;
}

interface EventMessage extends WebSocketMessage {
  type: 'EVENT';
  data: {
    channel: string;
    event: RealtimeEvent;
  };
}

// WebSocket message interface

interface WebSocketContextType {
  connectionState: ConnectionState;
  isConnected: boolean;
  subscribe: (
    channel: string,
    callback: (event: RealtimeEvent) => void
  ) => () => void;
  unsubscribe: (channel: string) => void;
  reconnect: () => void;
  lastError?: string;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

interface WebSocketProviderProps {
  children: ReactNode;
  url?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export function WebSocketProvider({
  children,
  url: _url = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:4001',
  reconnectInterval: _reconnectInterval = 3000,
  maxReconnectAttempts: _maxReconnectAttempts = 5,
}: WebSocketProviderProps) {
  const { getToken, isSignedIn, isClerkAvailable } = useSafeAuth();
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    ConnectionState.DISCONNECTED
  );
  const [lastError, setLastError] = useState<string>();
  const wsRef = useRef<WebSocket | null>(null);
  const subscriptionsRef = useRef<
    Map<string, Set<(event: RealtimeEvent) => void>>
  >(new Map());
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const config = getWebSocketConfig();

  const generateMessageId = () => {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const sendMessage = useCallback((message: any) => {
    if (
      typeof window !== 'undefined' &&
      window.WebSocket &&
      wsRef.current?.readyState === window.WebSocket.OPEN
    ) {
      wsRef.current.send(
        JSON.stringify({
          ...message,
          id: message.id || generateMessageId(),
          timestamp: new Date(),
        })
      );
    }
  }, []);

  const authenticate = useCallback(async () => {
    if (!isClerkAvailable || !isSignedIn) return;

    try {
      const token = await getToken();
      if (token) {
        sendMessage({
          type: WebSocketMessageType.AUTH,
          data: { token },
        });
      }
    } catch (error) {
      console.error('Failed to get auth token:', error);
      setLastError('Authentication failed');
    }
  }, [isClerkAvailable, isSignedIn, getToken]);

  const connect = useCallback(async () => {
    if (typeof window === 'undefined' || !window.WebSocket) {
      console.warn('WebSocket not available in this environment');
      return;
    }

    if (wsRef.current?.readyState === window.WebSocket.OPEN) return;

    try {
      setConnectionState(ConnectionState.CONNECTING);
      setLastError(undefined);

      const wsUrl = getSecureWebSocketUrl(config.url);
      const ws = new window.WebSocket(wsUrl);

      if (config.enableLogging) {
        console.log('Connecting to WebSocket:', wsUrl);
      }

      ws.onopen = () => {
        if (config.enableLogging) {
          console.log('WebSocket connected');
        }
        setConnectionState(ConnectionState.CONNECTED);
        reconnectAttemptsRef.current = 0;
        authenticate();
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        if (config.enableLogging) {
          console.log('WebSocket disconnected:', event.code, event.reason);
        }
        setConnectionState(ConnectionState.DISCONNECTED);

        // Attempt reconnection if not a clean close
        if (
          event.code !== 1000 &&
          reconnectAttemptsRef.current < config.maxReconnectAttempts
        ) {
          scheduleReconnect();
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionState(ConnectionState.ERROR);
        setLastError('Connection error occurred');
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionState(ConnectionState.ERROR);
      setLastError('Failed to establish connection');
      scheduleReconnect();
    }
  }, []);

  const scheduleReconnect = () => {
    if (reconnectAttemptsRef.current >= config.maxReconnectAttempts) {
      setLastError(
        `Failed to reconnect after ${config.maxReconnectAttempts} attempts`
      );
      return;
    }

    reconnectAttemptsRef.current++;
    if (config.enableLogging) {
      console.log(
        `Scheduling reconnect attempt ${reconnectAttemptsRef.current}/${config.maxReconnectAttempts}`
      );
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, config.reconnectInterval);
  };

  const handleMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case WebSocketMessageType.WELCOME:
        if (config.enableLogging) {
          console.log('Received welcome message:', message.data);
        }
        break;

      case WebSocketMessageType.EVENT: {
        const eventMessage = message as EventMessage;
        const { channel, event } = eventMessage.data;

        // Notify all subscribers for this channel
        const callbacks = subscriptionsRef.current.get(channel);
        if (callbacks) {
          callbacks.forEach((callback) => {
            try {
              callback(event);
            } catch (error) {
              console.error('Error in event callback:', error);
            }
          });
        }
        break;
      }

      case WebSocketMessageType.ACK:
        if (config.enableLogging) {
          console.log('Received acknowledgment:', message.data);
        }
        break;

      case WebSocketMessageType.ERROR:
        console.error('Received error:', message.data);
        setLastError(message.data?.message || 'Unknown error');
        break;

      case WebSocketMessageType.PONG:
        // Handle ping/pong for connection health
        break;

      default:
        if (config.enableLogging) {
          console.log('Received unknown message type:', message.type);
        }
    }
  };

  const subscribe = (
    channel: string,
    callback: (event: RealtimeEvent) => void
  ) => {
    // Add callback to subscriptions
    if (!subscriptionsRef.current.has(channel)) {
      subscriptionsRef.current.set(channel, new Set());
    }
    subscriptionsRef.current.get(channel)!.add(callback);

    // Send subscription message if connected
    if (connectionState === ConnectionState.CONNECTED) {
      sendMessage({
        type: WebSocketMessageType.SUBSCRIBE,
        data: { channels: [channel] },
      });
    }

    // Return unsubscribe function
    return () => {
      const callbacks = subscriptionsRef.current.get(channel);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          subscriptionsRef.current.delete(channel);
          // Send unsubscribe message if connected
          if (connectionState === ConnectionState.CONNECTED) {
            sendMessage({
              type: WebSocketMessageType.UNSUBSCRIBE,
              data: { channels: [channel] },
            });
          }
        }
      }
    };
  };

  const unsubscribe = (channel: string) => {
    subscriptionsRef.current.delete(channel);
    if (connectionState === ConnectionState.CONNECTED) {
      sendMessage({
        type: WebSocketMessageType.UNSUBSCRIBE,
        data: { channels: [channel] },
      });
    }
  };

  const reconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    reconnectAttemptsRef.current = 0;

    if (wsRef.current) {
      wsRef.current.close();
    }

    connect();
  };

  // Initialize connection on mount
  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [
    config.url,
    config.enableLogging,
    config.maxReconnectAttempts,
    authenticate,
  ]);

  // Re-authenticate when auth state changes
  useEffect(() => {
    if (
      connectionState === ConnectionState.CONNECTED &&
      isClerkAvailable &&
      isSignedIn
    ) {
      authenticate();
    }
  }, [isSignedIn, connectionState, isClerkAvailable, authenticate]);

  // Re-subscribe to channels after reconnection
  useEffect(() => {
    if (
      connectionState === ConnectionState.CONNECTED &&
      subscriptionsRef.current.size > 0
    ) {
      const channels = Array.from(subscriptionsRef.current.keys());
      sendMessage({
        type: WebSocketMessageType.SUBSCRIBE,
        data: { channels },
      });
    }
  }, [connectionState, sendMessage]);

  const contextValue: WebSocketContextType = {
    connectionState,
    isConnected: connectionState === ConnectionState.CONNECTED,
    subscribe,
    unsubscribe,
    reconnect,
    lastError,
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}

// Convenience hook for connection status
export function useConnectionStatus() {
  const { connectionState, isConnected, lastError } = useWebSocket();
  return { connectionState, isConnected, lastError };
}
