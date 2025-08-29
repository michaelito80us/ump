# @ump/realtime

Real-time WebSocket service for the UMP (Ultimate Match Platform) tournament management system.

## Overview

This package provides a WebSocket-based real-time communication layer that enables live updates for tournaments, matches, and user interactions. It uses Redis for pub/sub messaging and JWT for authentication.

## Features

- **WebSocket Server**: Real-time bidirectional communication
- **Redis PubSub**: Scalable message distribution
- **JWT Authentication**: Secure connection authentication
- **Channel-based Subscriptions**: Organized event routing
- **Rate Limiting**: Protection against abuse
- **Health Monitoring**: Built-in health checks

## Installation

```bash
pnpm install @ump/realtime
```

## Usage

### Starting the Server

```typescript
import { startServer } from '@ump/realtime';

// Start with default configuration
startServer();

// Or with custom configuration
import {
  createConfig,
  RealtimeWebSocketServer,
  RedisPubSub,
} from '@ump/realtime';

const config = createConfig({
  port: 4001,
  redis: {
    host: 'localhost',
    port: 6379,
  },
  jwt: {
    secret: 'your-jwt-secret',
  },
});

const pubsub = new RedisPubSub({ redis: config.redis });
const server = new RealtimeWebSocketServer({
  port: config.port,
  jwtSecret: config.jwt.secret,
  pubsub,
});

// Initialize the server (required)
await server.initialize();
```

### Client Connection

```typescript
// Connect to WebSocket server
const ws = new WebSocket('ws://localhost:4001');

// Authenticate
ws.send(
  JSON.stringify({
    id: 'msg_1',
    type: 'AUTH',
    data: {
      token: 'your-jwt-token',
    },
  })
);

// Subscribe to channels
ws.send(
  JSON.stringify({
    id: 'msg_2',
    type: 'SUBSCRIBE',
    data: {
      channels: ['tournament:123', 'match:456'],
    },
  })
);

// Listen for events
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};
```

## Channel Patterns

The system supports several channel patterns:

- `tournament:*` - Tournament-wide events
- `match:*` - Match-specific events
- `user:*` - User-specific events (private)
- `admin:*` - Admin-only events
- `global:*` - System-wide announcements

## Event Types

### Match Events

- `MATCH_STARTED` - Match has begun
- `MATCH_SCORE_UPDATED` - Score changed
- `MATCH_COMPLETED` - Match finished

### Tournament Events

- `TOURNAMENT_STARTED` - Tournament began
- `TOURNAMENT_COMPLETED` - Tournament finished

### User Events

- `USER_JOINED` - User joined a channel
- `USER_LEFT` - User left a channel

## Configuration

Environment variables:

```bash
# Server
REALTIME_PORT=4001

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=optional
REDIS_DB=0

# JWT
JWT_SECRET=your-secret-key
JWT_ISSUER=optional
JWT_AUDIENCE=optional

# WebSocket
WS_PING_INTERVAL=30000
WS_PONG_TIMEOUT=5000
WS_MAX_CONNECTIONS=1000
WS_MAX_SUBSCRIPTIONS_PER_CONNECTION=50

# Channels
CHANNELS_MAX_PATTERN_SUBSCRIPTIONS=10
```

## API Reference

### Classes

#### `RealtimeWebSocketServer`

Main WebSocket server class.

#### `RedisPubSub`

Redis-based pub/sub messaging service.

#### `RateLimiter`

Rate limiting utility for connection management.

### Types

#### `RealtimeEvent`

Union type of all possible real-time events.

#### `ClientMessage`

Messages sent from client to server.

#### `ServerMessage`

Messages sent from server to client.

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Run in development mode
pnpm dev

# Run tests
pnpm test

# Lint
pnpm lint
```

## License

Private package for UMP project.
