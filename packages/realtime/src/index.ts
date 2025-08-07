export * from './types/events';
export * from './types/websocket';
export * from './services/pubsub';
export * from './services/websocket-server';
export * from './config';
export * from './utils';

// Re-export commonly used types for convenience
export type {
  RealtimeEvent,
  MatchStartedEvent,
  MatchScoreUpdatedEvent,
  MatchCompletedEvent,
  TournamentStartedEvent,
  TournamentCompletedEvent,
  User,
} from './types/events';

export type {
  ConnectionState,
  ClientMessage,
  ServerMessage,
  ConnectionInfo,
} from './types/websocket';

export type { RealtimeConfig } from './config';

export { RedisPubSub } from './services/pubsub';
export { RealtimeWebSocketServer } from './services/websocket-server';
export { defaultConfig, createConfig } from './config';
export {
  generateConnectionId,
  generateMessageId,
  isValidChannelName,
  channelMatchesPattern,
  getChannelType,
  getChannelEntityId,
  createServerMessage,
  safeJsonParse,
  safeJsonStringify,
  hasChannelPermission,
  RateLimiter,
} from './utils';
