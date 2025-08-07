import { v4 as uuidv4 } from 'uuid';
import type { RealtimeEvent } from '../types/events';
import type { ServerMessage } from '../types/websocket';

/**
 * Generate a unique connection ID
 */
export function generateConnectionId(): string {
  return `conn_${uuidv4()}`;
}

/**
 * Generate a unique message ID
 */
export function generateMessageId(): string {
  return `msg_${uuidv4()}`;
}

/**
 * Validate channel name format
 */
export function isValidChannelName(channel: string): boolean {
  // Channel names should follow pattern: type:id or type:*
  const channelPattern = /^[a-zA-Z]+:[a-zA-Z0-9_*-]+$/;
  return channelPattern.test(channel);
}

/**
 * Check if a channel matches a pattern
 */
export function channelMatchesPattern(
  channel: string,
  pattern: string
): boolean {
  if (pattern === channel) return true;

  // Convert pattern to regex (replace * with .*)
  const regexPattern = pattern.replace(/\*/g, '.*');
  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(channel);
}

/**
 * Extract channel type from channel name
 */
export function getChannelType(channel: string): string | null {
  const match = channel.match(/^([a-zA-Z]+):/);
  return match ? match[1] : null;
}

/**
 * Extract entity ID from channel name
 */
export function getChannelEntityId(channel: string): string | null {
  const match = channel.match(/^[a-zA-Z]+:(.+)$/);
  return match ? match[1] : null;
}

/**
 * Create a server message
 */
export function createServerMessage(
  type: ServerMessage['type'],
  data: any,
  messageId?: string
): ServerMessage {
  const baseMessage = {
    id: messageId || generateMessageId(),
    timestamp: new Date(),
  };

  switch (type) {
    case 'EVENT':
      return {
        ...baseMessage,
        type: 'EVENT',
        data: {
          channel: data.channel,
          event: data.event as RealtimeEvent,
        },
      };
    case 'ACK':
      return {
        ...baseMessage,
        type: 'ACK',
        data: {
          messageId: data.messageId,
          success: data.success,
          error: data.error,
        },
      };
    case 'ERROR':
      return {
        ...baseMessage,
        type: 'ERROR',
        data: {
          code: data.code,
          message: data.message,
          details: data.details,
        },
      };
    case 'PONG':
      return {
        ...baseMessage,
        type: 'PONG',
      };
    default:
      throw new Error(`Unknown server message type: ${type}`);
  }
}

/**
 * Safely parse JSON message
 */
export function safeJsonParse<T = any>(data: string): T | null {
  try {
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
}

/**
 * Safely stringify JSON
 */
export function safeJsonStringify(data: any): string {
  try {
    return JSON.stringify(data);
  } catch {
    return '{}';
  }
}

/**
 * Check if user has permission to access channel
 */
export function hasChannelPermission(
  userId: string,
  userRole: string,
  channel: string
): boolean {
  const channelType = getChannelType(channel);
  const entityId = getChannelEntityId(channel);

  switch (channelType) {
    case 'user':
      // Users can only access their own user channels
      return entityId === userId;

    case 'admin':
      // Only admins can access admin channels
      return userRole === 'admin';

    case 'tournament':
    case 'match':
    case 'global':
      // These are generally accessible to authenticated users
      return true;

    default:
      return false;
  }
}

/**
 * Rate limiting helper
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}

  isAllowed(key: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];

    // Remove old requests outside the window
    const validRequests = requests.filter((time) => now - time < this.windowMs);

    if (validRequests.length >= this.maxRequests) {
      return false;
    }

    // Add current request
    validRequests.push(now);
    this.requests.set(key, validRequests);

    return true;
  }

  reset(key: string): void {
    this.requests.delete(key);
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, requests] of this.requests.entries()) {
      const validRequests = requests.filter(
        (time) => now - time < this.windowMs
      );
      if (validRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validRequests);
      }
    }
  }
}
