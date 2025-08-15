import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { RedisPubSub } from './pubsub';
import {
  ConnectionInfo,
  ClientMessage,
  ServerMessage,
  CHANNEL_PATTERNS,
} from '../types/websocket';
import { RealtimeEvent } from '../types/events';

export interface WebSocketServerConfig {
  port: number;
  jwtSecret: string;
  pubsub: RedisPubSub;
  pingInterval?: number;
  connectionTimeout?: number;
}

export class RealtimeWebSocketServer {
  private wss: WebSocketServer;
  private connections: Map<string, { ws: WebSocket; info: ConnectionInfo }>;
  private pubsub: RedisPubSub;
  private jwtSecret: string;
  private pingInterval: number;
  private connectionTimeout: number;
  private pingTimer?: NodeJS.Timeout;

  constructor(config: WebSocketServerConfig) {
    this.connections = new Map();
    this.pubsub = config.pubsub;
    this.jwtSecret = config.jwtSecret;
    this.pingInterval = config.pingInterval || 30000; // 30 seconds
    this.connectionTimeout = config.connectionTimeout || 60000; // 60 seconds

    // Create WebSocket server
    this.wss = new WebSocketServer({ port: config.port });

    // Set up event handlers
    this.wss.on('connection', this.handleConnection.bind(this));
    this.wss.on('error', (error) => {
      console.error('WebSocket server error:', error);
    });

    console.log(`WebSocket server listening on port ${config.port}`);
  }

  async initialize(): Promise<void> {
    // Set up PubSub pattern subscription to catch all events
    await this.setupPubSubHandler();

    // Start ping timer
    this.startPingTimer();

    console.log('WebSocket server initialized with PubSub');
  }

  private async setupPubSubHandler(): Promise<void> {
    // Subscribe to all channels using pattern matching
    await this.pubsub.psubscribe(
      '*',
      (channel: string, event: RealtimeEvent) => {
        this.handlePubSubMessage(channel, event);
      }
    );
  }

  private handleConnection(ws: WebSocket, request: IncomingMessage): void {
    const connectionId = uuidv4();
    const connectionInfo: ConnectionInfo = {
      id: connectionId,
      connectedAt: new Date(),
      lastActivity: new Date(),
      authenticated: false,
      subscriptions: new Set(),
    };

    this.connections.set(connectionId, { ws, info: connectionInfo });

    // Send welcome message
    this.sendMessage(connectionId, {
      id: uuidv4(),
      type: 'WELCOME',
      timestamp: new Date(),
      data: {
        connectionId,
        serverTime: Date.now(),
      },
    });

    // Set up WebSocket event handlers
    ws.on('message', (data: Buffer) => {
      this.handleMessage(connectionId, data);
    });

    ws.on('close', () => {
      this.handleDisconnection(connectionId);
    });

    ws.on('error', (error) => {
      console.error(`WebSocket error for connection ${connectionId}:`, error);
      this.handleDisconnection(connectionId);
    });

    console.log(
      `New connection: ${connectionId} from ${request.socket.remoteAddress}`
    );
  }

  private handleMessage(connectionId: string, data: Buffer): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    // Update last activity
    connection.info.lastActivity = new Date();

    try {
      const message: ClientMessage = JSON.parse(data.toString());

      switch (message.type) {
        case 'AUTH':
          this.handleAuth(connectionId, message);
          break;
        case 'SUBSCRIBE':
          this.handleSubscribe(connectionId, message);
          break;
        case 'UNSUBSCRIBE':
          this.handleUnsubscribe(connectionId, message);
          break;
        case 'PING':
          this.handlePing(connectionId, message);
          break;
        default:
          this.sendError(
            connectionId,
            'INVALID_MESSAGE_TYPE',
            `Unknown message type: ${(message as any).type}`
          );
      }
    } catch (error) {
      console.error(`Error parsing message from ${connectionId}:`, error);
      this.sendError(
        connectionId,
        'INVALID_MESSAGE_FORMAT',
        'Failed to parse message'
      );
    }
  }

  private handleAuth(
    connectionId: string,
    message: ClientMessage & { type: 'AUTH' }
  ): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    try {
      const decoded = jwt.verify(message.data.token, this.jwtSecret) as any;

      // Update connection info
      connection.info.authenticated = true;
      connection.info.userId = decoded.sub || decoded.userId;

      this.sendAck(connectionId, message.id, true);
      console.log(
        `Connection ${connectionId} authenticated as user ${connection.info.userId}`
      );
    } catch (error) {
      console.error(
        `Authentication failed for connection ${connectionId}:`,
        error
      );
      this.sendAck(connectionId, message.id, false, 'Invalid token');

      // Close connection for invalid JWT
      setTimeout(() => {
        const conn = this.connections.get(connectionId);
        if (conn) {
          conn.ws.close();
        }
      }, 100);
    }
  }

  private handleSubscribe(
    connectionId: string,
    message: ClientMessage & { type: 'SUBSCRIBE' }
  ): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    const { channels } = message.data;
    const allowedChannels: string[] = [];
    const deniedChannels: string[] = [];

    for (const channel of channels) {
      if (this.isChannelAllowed(channel, connection.info)) {
        connection.info.subscriptions.add(channel);
        allowedChannels.push(channel);
      } else {
        deniedChannels.push(channel);
      }
    }

    if (deniedChannels.length > 0) {
      this.sendAck(
        connectionId,
        message.id,
        false,
        `Access denied to channels: ${deniedChannels.join(', ')}`
      );
    } else {
      this.sendAck(connectionId, message.id, true);
    }

    console.log(
      `Connection ${connectionId} subscribed to: ${allowedChannels.join(', ')}`
    );
  }

  private handleUnsubscribe(
    connectionId: string,
    message: ClientMessage & { type: 'UNSUBSCRIBE' }
  ): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    const { channels } = message.data;

    for (const channel of channels) {
      connection.info.subscriptions.delete(channel);
    }

    this.sendAck(connectionId, message.id, true);
    console.log(
      `Connection ${connectionId} unsubscribed from: ${channels.join(', ')}`
    );
  }

  private handlePing(
    connectionId: string,
    _message: ClientMessage & { type: 'PING' }
  ): void {
    this.sendMessage(connectionId, {
      id: uuidv4(),
      type: 'PONG',
      timestamp: new Date(),
    });
  }

  private handlePubSubMessage(channel: string, event: RealtimeEvent): void {
    // Broadcast to all subscribers
    for (const [connectionId, connection] of this.connections) {
      if (connection.info.subscriptions.has(channel)) {
        this.sendEvent(connectionId, channel, event);
      }
    }
  }

  private isChannelAllowed(
    channel: string,
    connectionInfo: ConnectionInfo
  ): boolean {
    // Find matching pattern
    const pattern = CHANNEL_PATTERNS.find((p) => {
      const regex = new RegExp(p.pattern.replace('*', '.*'));
      return regex.test(channel);
    });

    if (!pattern) {
      return false; // No pattern matches, deny access
    }

    // Check authentication requirement
    if (pattern.requiresAuth && !connectionInfo.authenticated) {
      return false;
    }

    // Check user-specific channels
    if (channel.startsWith('user:') && connectionInfo.userId) {
      const channelUserId = channel.split(':')[1];
      return channelUserId === connectionInfo.userId;
    }

    // For now, allow access to public channels
    return true;
  }

  private sendMessage(connectionId: string, message: ServerMessage): void {
    const connection = this.connections.get(connectionId);
    if (!connection || connection.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      connection.ws.send(JSON.stringify(message));
    } catch (error: unknown) {
      console.error(
        `Error sending message to connection ${connectionId}:`,
        error
      );
      this.handleDisconnection(connectionId);
    }
  }

  private sendEvent(
    connectionId: string,
    channel: string,
    event: RealtimeEvent
  ): void {
    const connection = this.connections.get(connectionId);
    if (!connection || !connection.info.subscriptions.has(channel)) {
      return;
    }

    this.sendMessage(connectionId, {
      id: uuidv4(),
      type: 'EVENT',
      timestamp: new Date(),
      data: { channel, event },
    });
  }

  private sendAck(
    connectionId: string,
    messageId: string,
    success: boolean,
    error?: string
  ): void {
    this.sendMessage(connectionId, {
      id: uuidv4(),
      type: 'ACK',
      timestamp: new Date(),
      data: { messageId, success, error },
    });
  }

  private sendError(
    connectionId: string,
    code: string,
    message: string,
    details?: any
  ): void {
    this.sendMessage(connectionId, {
      id: uuidv4(),
      type: 'ERROR',
      timestamp: new Date(),
      data: { code, message, details },
    });
  }

  private handleDisconnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    console.log(`Connection ${connectionId} disconnected`);

    // Clean up subscriptions
    connection.info.subscriptions.clear();

    // Remove from connections map
    this.connections.delete(connectionId);
  }

  private startPingTimer(): void {
    this.pingTimer = setInterval(() => {
      const now = new Date();
      const timeoutThreshold = new Date(now.getTime() - this.connectionTimeout);

      // Check for stale connections
      for (const [connectionId, connection] of this.connections) {
        if (connection.info.lastActivity < timeoutThreshold) {
          console.log(`Closing stale connection: ${connectionId}`);
          connection.ws.close();
          this.handleDisconnection(connectionId);
        }
      }
    }, this.pingInterval);
  }

  /**
   * Broadcast an event to all subscribers of a channel
   */
  async broadcast(channel: string, event: RealtimeEvent): Promise<void> {
    await this.pubsub.publish(channel, event);
  }

  /**
   * Get server statistics
   */
  getStats(): {
    totalConnections: number;
    authenticatedConnections: number;
    totalSubscriptions: number;
    pubsubConnected: boolean;
  } {
    let authenticatedCount = 0;
    let totalSubscriptions = 0;

    for (const connection of this.connections.values()) {
      if (connection.info.authenticated) {
        authenticatedCount++;
      }
      totalSubscriptions += connection.info.subscriptions.size;
    }

    return {
      totalConnections: this.connections.size,
      authenticatedConnections: authenticatedCount,
      totalSubscriptions,
      pubsubConnected: this.pubsub.isConnected(),
    };
  }

  /**
   * Close the server
   */
  async close(): Promise<void> {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
    }

    // Close all connections
    for (const connection of this.connections.values()) {
      connection.ws.close();
    }

    // Close WebSocket server
    return new Promise((resolve) => {
      this.wss.close(() => {
        console.log('WebSocket server closed');
        resolve();
      });
    });
  }
}
