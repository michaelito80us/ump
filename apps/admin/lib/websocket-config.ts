// WebSocket configuration for the admin application

export interface WebSocketConfig {
  url: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
  connectionTimeout: number;
  enableLogging: boolean;
}

// Default WebSocket configuration
const defaultConfig: WebSocketConfig = {
  url: 'ws://localhost:8080/ws', // Default WebSocket URL
  reconnectInterval: 3000, // 3 seconds
  maxReconnectAttempts: 10,
  heartbeatInterval: 30000, // 30 seconds
  connectionTimeout: 10000, // 10 seconds
  enableLogging: process.env.NODE_ENV === 'development',
};

// Get WebSocket configuration from environment variables
export function getWebSocketConfig(): WebSocketConfig {
  return {
    url: process.env.NEXT_PUBLIC_WEBSOCKET_URL || defaultConfig.url,
    reconnectInterval: parseInt(
      process.env.NEXT_PUBLIC_WS_RECONNECT_INTERVAL || '3000'
    ),
    maxReconnectAttempts: parseInt(
      process.env.NEXT_PUBLIC_WS_MAX_RECONNECT_ATTEMPTS || '10'
    ),
    heartbeatInterval: parseInt(
      process.env.NEXT_PUBLIC_WS_HEARTBEAT_INTERVAL || '30000'
    ),
    connectionTimeout: parseInt(
      process.env.NEXT_PUBLIC_WS_CONNECTION_TIMEOUT || '10000'
    ),
    enableLogging:
      process.env.NEXT_PUBLIC_WS_ENABLE_LOGGING === 'true' ||
      process.env.NODE_ENV === 'development',
  };
}

// WebSocket message types based on the realtime package
export enum WebSocketMessageType {
  WELCOME = 'WELCOME',
  SUBSCRIBE = 'SUBSCRIBE',
  UNSUBSCRIBE = 'UNSUBSCRIBE',
  EVENT = 'EVENT',
  ACK = 'ACK',
  ERROR = 'ERROR',
  PING = 'PING',
  PONG = 'PONG',
  AUTH = 'AUTH',
}

// WebSocket connection states
export enum ConnectionState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error',
}

// Channel patterns for subscriptions
export const CHANNEL_PATTERNS = {
  TOURNAMENT: (id: string) => `tournament:${id}`,
  TOURNAMENTS: 'tournaments:*',
  MATCH: (id: string) => `match:${id}`,
  MATCHES: 'matches:*',
  USER: (id: string) => `user:${id}`,
  SYSTEM: 'system:*',
  ADMIN: 'admin:*',
} as const;

// Event types for real-time updates
export const EVENT_TYPES = {
  TOURNAMENT_CREATED: 'tournament.created',
  TOURNAMENT_UPDATED: 'tournament.updated',
  TOURNAMENT_DELETED: 'tournament.deleted',
  MATCH_CREATED: 'match.created',
  MATCH_UPDATED: 'match.updated',
  MATCH_SCORE_UPDATED: 'match.score_updated',
  MATCH_STATUS_CHANGED: 'match.status_changed',
  SYSTEM_NOTIFICATION: 'system.notification',
  ADMIN_ALERT: 'admin.alert',
} as const;

// Utility function to validate WebSocket URL
export function isValidWebSocketUrl(url: string): boolean {
  try {
    // Use globalThis.URL to ensure compatibility
    const parsedUrl = new globalThis.URL(url);
    return parsedUrl.protocol === 'ws:' || parsedUrl.protocol === 'wss:';
  } catch {
    return false;
  }
}

// Utility function to get secure WebSocket URL in production
export function getSecureWebSocketUrl(url: string): string {
  if (process.env.NODE_ENV === 'production' && url.startsWith('ws://')) {
    return url.replace('ws://', 'wss://');
  }
  return url;
}

// Environment variables documentation
export const ENV_VARS_DOCS = {
  NEXT_PUBLIC_WEBSOCKET_URL:
    'WebSocket server URL (e.g., ws://localhost:8080/ws)',
  NEXT_PUBLIC_WS_RECONNECT_INTERVAL:
    'Reconnection interval in milliseconds (default: 3000)',
  NEXT_PUBLIC_WS_MAX_RECONNECT_ATTEMPTS:
    'Maximum reconnection attempts (default: 10)',
  NEXT_PUBLIC_WS_HEARTBEAT_INTERVAL:
    'Heartbeat interval in milliseconds (default: 30000)',
  NEXT_PUBLIC_WS_CONNECTION_TIMEOUT:
    'Connection timeout in milliseconds (default: 10000)',
  NEXT_PUBLIC_WS_ENABLE_LOGGING:
    'Enable WebSocket logging (true/false, default: development mode)',
} as const;

export default getWebSocketConfig;
