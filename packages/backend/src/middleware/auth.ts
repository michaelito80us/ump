import { GraphQLError } from 'graphql';
import jwt from 'jsonwebtoken';
import { db } from '../services/database';
import { logger } from '../utils/logger';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

export interface AuthContext {
  user?: AuthUser;
}

export async function getAuthContext(req: any): Promise<AuthContext> {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return {};
  }

  try {
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      logger.error('JWT_SECRET not configured');
      return {};
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Fetch user from database
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      logger.warn(`User not found for token: ${decoded.userId}`);
      return {};
    }

    return { user };
  } catch (error) {
    logger.warn('Invalid token:', error);
    return {};
  }
}

export function requireAuth(context: AuthContext): AuthUser {
  if (!context.user) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return context.user;
}

export function requireRole(
  context: AuthContext,
  allowedRoles: string[]
): AuthUser {
  const user = requireAuth(context);

  if (!allowedRoles.includes(user.role)) {
    throw new GraphQLError('Insufficient permissions', {
      extensions: { code: 'FORBIDDEN' },
    });
  }

  return user;
}
