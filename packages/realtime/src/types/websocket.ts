import { RealtimeEvent } from './events';

// WebSocket connection states
export type ConnectionState =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error';

// WebSocket message types
export interface WebSocketMessage {
  id: string;
  type: string;
  timestamp: Date;
  data?: any;
}

// Client-to-server messages
export interface SubscribeMessage extends WebSocketMessage {
  type: 'SUBSCRIBE';
  data: {
    channels: string[];
  };
}

export interface UnsubscribeMessage extends WebSocketMessage {
  type: 'UNSUBSCRIBE';
  data: {
    channels: string[];
  };
}

export interface AuthMessage extends WebSocketMessage {
  type: 'AUTH';
  data: {
    token: string;
  };
}

export interface PingMessage extends WebSocketMessage {
  type: 'PING';
}

// Server-to-client messages
export interface EventMessage extends WebSocketMessage {
  type: 'EVENT';
  data: {
    channel: string;
    event: RealtimeEvent;
  };
}

export interface AckMessage extends WebSocketMessage {
  type: 'ACK';
  data: {
    messageId: string;
    success: boolean;
    error?: string;
  };
}

export interface PongMessage extends WebSocketMessage {
  type: 'PONG';
}

export interface ErrorMessage extends WebSocketMessage {
  type: 'ERROR';
  data: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface WelcomeMessage extends WebSocketMessage {
  type: 'WELCOME';
  data: {
    connectionId: string;
    serverTime: number;
  };
}

// Union types for all message types
export type ClientMessage =
  | SubscribeMessage
  | UnsubscribeMessage
  | AuthMessage
  | PingMessage;
export type ServerMessage =
  | EventMessage
  | AckMessage
  | PongMessage
  | ErrorMessage
  | WelcomeMessage;
export type WSMessage = ClientMessage | ServerMessage;

// Connection metadata
export interface ConnectionInfo {
  id: string;
  userId?: string;
  connectedAt: Date;
  lastActivity: Date;
  subscriptions: Set<string>;
  authenticated: boolean;
}

// Channel patterns
export interface ChannelPattern {
  pattern: string;
  description: string;
  requiresAuth: boolean;
  permissions?: string[];
}

// Predefined channel patterns
export const CHANNEL_PATTERNS: ChannelPattern[] = [
  {
    pattern: 'tournament:*',
    description: 'Tournament-wide events',
    requiresAuth: false,
  },
  {
    pattern: 'tournament:*:matches',
    description: 'All matches in a tournament',
    requiresAuth: false,
  },
  {
    pattern: 'match:*',
    description: 'Specific match events',
    requiresAuth: false,
  },
  {
    pattern: 'user:*',
    description: 'User-specific events',
    requiresAuth: true,
    permissions: ['read:user'],
  },
  {
    pattern: 'admin:*',
    description: 'Admin-only events',
    requiresAuth: true,
    permissions: ['admin'],
  },
];
