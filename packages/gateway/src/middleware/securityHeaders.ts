import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * OWASP Baseline Security Headers Middleware
 *
 * Implements security headers according to OWASP recommendations:
 * - Content Security Policy (CSP)
 * - HTTP Strict Transport Security (HSTS)
 * - X-Content-Type-Options
 * - X-Frame-Options
 * - X-XSS-Protection
 * - Referrer-Policy
 * - Permissions-Policy
 */

interface SecurityHeadersOptions {
  environment?: 'development' | 'production' | 'test';
  enableCSP?: boolean;
  enableHSTS?: boolean;
  customCSPDirectives?: Record<string, string[]>;
}

const DEFAULT_CSP_DIRECTIVES = {
  defaultSrc: ["'self'"],
  styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  fontSrc: ["'self'", 'https://fonts.gstatic.com'],
  imgSrc: ["'self'", 'data:', 'https:'],
  scriptSrc: ["'self'"],
  connectSrc: ["'self'", 'wss:', 'ws:'],
  frameSrc: ["'none'"],
  objectSrc: ["'none'"],
  baseUri: ["'self'"],
  formAction: ["'self'"],
  upgradeInsecureRequests: [],
};

const DEVELOPMENT_CSP_DIRECTIVES = {
  ...DEFAULT_CSP_DIRECTIVES,
  scriptSrc: ["'self'", "'unsafe-eval'", "'unsafe-inline'"],
  connectSrc: [
    "'self'",
    'wss:',
    'ws:',
    'http://localhost:*',
    'https://localhost:*',
  ],
};

/**
 * Creates security headers middleware with OWASP baseline configuration
 */
export function createSecurityHeadersMiddleware(
  options: SecurityHeadersOptions = {}
) {
  const {
    environment = process.env.NODE_ENV || 'development',
    enableCSP = true,
    enableHSTS = environment === 'production',
    customCSPDirectives = {},
  } = options;

  const _isProduction = environment === 'production';
  const isDevelopment = environment === 'development';

  // Merge custom CSP directives with defaults
  const cspDirectives = {
    ...(isDevelopment ? DEVELOPMENT_CSP_DIRECTIVES : DEFAULT_CSP_DIRECTIVES),
    ...customCSPDirectives,
  };

  const helmetConfig = {
    // Content Security Policy
    contentSecurityPolicy: enableCSP
      ? {
          directives: cspDirectives,
          reportOnly: isDevelopment, // Report-only mode in development
        }
      : false,

    // HTTP Strict Transport Security (HTTPS only)
    hsts: enableHSTS
      ? {
          maxAge: 31536000, // 1 year
          includeSubDomains: true,
          preload: true,
        }
      : false,

    // Prevent MIME type sniffing
    noSniff: true,

    // X-Frame-Options: Prevent clickjacking
    frameguard: {
      action: 'deny' as const,
    },

    // X-XSS-Protection (legacy browsers)
    xssFilter: true,

    // Referrer Policy
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin' as const,
    },

    // Permissions Policy (Feature Policy)
    permissionsPolicy: {
      camera: [],
      microphone: [],
      geolocation: [],
      payment: [],
      usb: [],
      magnetometer: [],
      gyroscope: [],
      accelerometer: [],
    },

    // Cross-Origin Embedder Policy
    crossOriginEmbedderPolicy: false, // Disabled for GraphQL compatibility

    // Cross-Origin Opener Policy
    crossOriginOpenerPolicy: {
      policy: 'same-origin' as const,
    },

    // Cross-Origin Resource Policy
    crossOriginResourcePolicy: {
      policy: 'cross-origin' as const, // Allow cross-origin for API
    },

    // Hide X-Powered-By header
    hidePoweredBy: true,
  };

  return helmet(helmetConfig);
}

/**
 * Custom middleware to add additional security headers
 */
export function additionalSecurityHeaders(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Add custom security headers
  res.setHeader('X-API-Version', '1.0');
  res.setHeader('X-Request-ID', req.headers['x-request-id'] || 'unknown');

  // Remove server information
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');

  // Add cache control for API responses
  if (req.path.includes('/graphql')) {
    res.setHeader(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, private'
    );
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  next();
}

/**
 * Middleware to log security header violations (CSP reports)
 */
export function cspReportHandler(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (req.path === '/csp-report' && req.method === 'POST') {
    logger.warn('CSP Violation Report', {
      report: req.body,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });

    res.status(204).end();
    return;
  }

  next();
}

/**
 * Security headers configuration for different environments
 */
export const SECURITY_CONFIGS = {
  development: {
    environment: 'development' as const,
    enableCSP: true,
    enableHSTS: false,
  },
  production: {
    environment: 'production' as const,
    enableCSP: true,
    enableHSTS: true,
  },
  test: {
    environment: 'test' as const,
    enableCSP: false,
    enableHSTS: false,
  },
} as const;

/**
 * Validates security headers configuration
 */
export function validateSecurityConfig(
  config: SecurityHeadersOptions
): boolean {
  if (
    config.environment &&
    !['development', 'production', 'test'].includes(config.environment)
  ) {
    logger.error('Invalid environment specified for security headers');
    return false;
  }

  if (config.environment === 'production' && !config.enableHSTS) {
    logger.warn('HSTS should be enabled in production environment');
  }

  return true;
}
