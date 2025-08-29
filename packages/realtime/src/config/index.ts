export interface RealtimeConfig {
  port: number;
  redis: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
  jwt: {
    secret: string;
    issuer?: string;
    audience?: string;
  };
  websocket: {
    pingInterval: number;
    pongTimeout: number;
    maxConnections: number;
    maxSubscriptionsPerConnection: number;
  };
  channels: {
    maxPatternSubscriptions: number;
    allowedPatterns: string[];
  };
}

export const defaultConfig: RealtimeConfig = {
  port: parseInt(process.env.REALTIME_PORT || '4001', 10),
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-jwt-secret',
    issuer: process.env.JWT_ISSUER,
    audience: process.env.JWT_AUDIENCE,
  },
  websocket: {
    pingInterval: parseInt(process.env.WS_PING_INTERVAL || '30000', 10), // 30 seconds
    pongTimeout: parseInt(process.env.WS_PONG_TIMEOUT || '5000', 10), // 5 seconds
    maxConnections: parseInt(process.env.WS_MAX_CONNECTIONS || '1000', 10),
    maxSubscriptionsPerConnection: parseInt(
      process.env.WS_MAX_SUBSCRIPTIONS_PER_CONNECTION || '50',
      10
    ),
  },
  channels: {
    maxPatternSubscriptions: parseInt(
      process.env.CHANNELS_MAX_PATTERN_SUBSCRIPTIONS || '10',
      10
    ),
    allowedPatterns: [
      'tournament:*',
      'match:*',
      'user:*',
      'admin:*',
      'global:*',
    ],
  },
};

export function createConfig(
  overrides: Partial<RealtimeConfig> = {}
): RealtimeConfig {
  return {
    ...defaultConfig,
    ...overrides,
    redis: {
      ...defaultConfig.redis,
      ...overrides.redis,
    },
    jwt: {
      ...defaultConfig.jwt,
      ...overrides.jwt,
    },
    websocket: {
      ...defaultConfig.websocket,
      ...overrides.websocket,
    },
    channels: {
      ...defaultConfig.channels,
      ...overrides.channels,
    },
  };
}
