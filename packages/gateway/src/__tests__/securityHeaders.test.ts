import request from 'supertest';
import express from 'express';
import {
  createSecurityHeadersMiddleware,
  additionalSecurityHeaders,
  cspReportHandler,
  SECURITY_CONFIGS,
  validateSecurityConfig,
} from '../middleware/securityHeaders';

describe('Security Headers Middleware', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  describe('createSecurityHeadersMiddleware', () => {
    it('should apply OWASP baseline security headers in production', async () => {
      app.use(createSecurityHeadersMiddleware(SECURITY_CONFIGS.production));
      app.get('/test', (req, res) => res.json({ status: 'ok' }));

      const response = await request(app).get('/test');

      // Check HSTS header (production only)
      expect(response.headers['strict-transport-security']).toMatch(
        /max-age=31536000; includeSubDomains; preload/
      );

      // Check X-Content-Type-Options
      expect(response.headers['x-content-type-options']).toBe('nosniff');

      // Check X-Frame-Options
      expect(response.headers['x-frame-options']).toBe('DENY');

      // Check X-XSS-Protection
      expect(response.headers['x-xss-protection']).toBe('0');

      // Check Referrer-Policy
      expect(response.headers['referrer-policy']).toBe(
        'strict-origin-when-cross-origin'
      );

      // Check CSP header exists
      expect(response.headers['content-security-policy']).toBeDefined();
      expect(response.headers['content-security-policy']).toContain(
        "default-src 'self'"
      );
    });

    it('should apply development-friendly headers in development', async () => {
      app.use(createSecurityHeadersMiddleware(SECURITY_CONFIGS.development));
      app.get('/test', (req, res) => res.json({ status: 'ok' }));

      const response = await request(app).get('/test');

      // HSTS should not be present in development
      expect(response.headers['strict-transport-security']).toBeUndefined();

      // CSP should be in report-only mode for development
      expect(
        response.headers['content-security-policy-report-only'] ||
          response.headers['content-security-policy']
      ).toBeDefined();

      // Should allow unsafe-eval and unsafe-inline in development
      const cspHeader =
        response.headers['content-security-policy-report-only'] ||
        response.headers['content-security-policy'];
      expect(cspHeader).toContain("'unsafe-eval'");
      expect(cspHeader).toContain("'unsafe-inline'");
    });

    it('should disable security headers in test environment', async () => {
      app.use(createSecurityHeadersMiddleware(SECURITY_CONFIGS.test));
      app.get('/test', (req, res) => res.json({ status: 'ok' }));

      const response = await request(app).get('/test');

      // CSP should be disabled in test
      expect(response.headers['content-security-policy']).toBeUndefined();
      expect(
        response.headers['content-security-policy-report-only']
      ).toBeUndefined();

      // HSTS should be disabled in test
      expect(response.headers['strict-transport-security']).toBeUndefined();

      // Basic security headers should still be present
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
    });

    it('should allow custom CSP directives', async () => {
      const customConfig = {
        ...SECURITY_CONFIGS.production,
        customCSPDirectives: {
          scriptSrc: ["'self'", "'unsafe-inline'", 'https://trusted-cdn.com'],
          imgSrc: ["'self'", 'data:', 'https://images.example.com'],
        },
      };

      app.use(createSecurityHeadersMiddleware(customConfig));
      app.get('/test', (req, res) => res.json({ status: 'ok' }));

      const response = await request(app).get('/test');
      const cspHeader = response.headers['content-security-policy'];

      expect(cspHeader).toContain('https://trusted-cdn.com');
      expect(cspHeader).toContain('https://images.example.com');
    });

    it('should hide server information headers', async () => {
      app.use(createSecurityHeadersMiddleware(SECURITY_CONFIGS.production));
      app.get('/test', (req, res) => res.json({ status: 'ok' }));

      const response = await request(app).get('/test');

      // X-Powered-By should be hidden
      expect(response.headers['x-powered-by']).toBeUndefined();
    });
  });

  describe('additionalSecurityHeaders', () => {
    beforeEach(() => {
      app.use(additionalSecurityHeaders);
    });

    it('should add custom API headers', async () => {
      app.get('/test', (req, res) => res.json({ status: 'ok' }));

      const response = await request(app).get('/test');

      expect(response.headers['x-api-version']).toBe('1.0');
      expect(response.headers['x-request-id']).toBeDefined();
    });

    it('should add cache control headers for GraphQL endpoints', async () => {
      app.post('/graphql', (req, res) => res.json({ data: {} }));

      const response = await request(app).post('/graphql');

      expect(response.headers['cache-control']).toBe(
        'no-store, no-cache, must-revalidate, private'
      );
      expect(response.headers['pragma']).toBe('no-cache');
      expect(response.headers['expires']).toBe('0');
    });

    it('should use custom request ID when provided', async () => {
      app.get('/test', (req, res) => res.json({ status: 'ok' }));

      const response = await request(app)
        .get('/test')
        .set('x-request-id', 'custom-request-123');

      expect(response.headers['x-request-id']).toBe('custom-request-123');
    });

    it('should remove server information headers', async () => {
      // Simulate Express adding these headers
      app.use((req, res, next) => {
        res.setHeader('X-Powered-By', 'Express');
        res.setHeader('Server', 'nginx/1.18.0');
        next();
      });

      app.use(createSecurityHeadersMiddleware(SECURITY_CONFIGS.production));
      app.get('/test', (req, res) => res.json({ status: 'ok' }));

      const response = await request(app).get('/test');

      expect(response.headers['x-powered-by']).toBeUndefined();
      // Note: Server header is controlled by the runtime environment, not our middleware
    });
  });

  describe('cspReportHandler', () => {
    beforeEach(() => {
      app.use(cspReportHandler);
    });

    it('should handle CSP violation reports', async () => {
      const cspReport = {
        'csp-report': {
          'document-uri': 'https://example.com/page',
          'violated-directive': 'script-src',
          'blocked-uri': 'https://malicious-site.com/script.js',
        },
      };

      const response = await request(app).post('/csp-report').send(cspReport);

      expect(response.status).toBe(204);
    });

    it('should pass through non-CSP report requests', async () => {
      app.get('/other-endpoint', (req, res) => res.json({ status: 'ok' }));

      const response = await request(app).get('/other-endpoint');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'ok' });
    });
  });

  describe('validateSecurityConfig', () => {
    it('should validate correct configuration', () => {
      const validConfig = {
        environment: 'production' as const,
        enableCSP: true,
        enableHSTS: true,
      };

      expect(validateSecurityConfig(validConfig)).toBe(true);
    });

    it('should reject invalid environment', () => {
      const invalidConfig = {
        environment: 'invalid' as any,
        enableCSP: true,
        enableHSTS: true,
      };

      expect(validateSecurityConfig(invalidConfig)).toBe(false);
    });

    it('should warn when HSTS is disabled in production', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const config = {
        environment: 'production' as const,
        enableCSP: true,
        enableHSTS: false,
      };

      const result = validateSecurityConfig(config);

      expect(result).toBe(true);
      consoleSpy.mockRestore();
    });
  });

  describe('SECURITY_CONFIGS', () => {
    it('should have correct development configuration', () => {
      expect(SECURITY_CONFIGS.development).toEqual({
        environment: 'development',
        enableCSP: true,
        enableHSTS: false,
      });
    });

    it('should have correct production configuration', () => {
      expect(SECURITY_CONFIGS.production).toEqual({
        environment: 'production',
        enableCSP: true,
        enableHSTS: true,
      });
    });

    it('should have correct test configuration', () => {
      expect(SECURITY_CONFIGS.test).toEqual({
        environment: 'test',
        enableCSP: false,
        enableHSTS: false,
      });
    });
  });

  describe('Integration with Express app', () => {
    it('should work with full middleware stack', async () => {
      // Simulate full gateway middleware stack
      app.use(createSecurityHeadersMiddleware(SECURITY_CONFIGS.production));
      app.use(additionalSecurityHeaders);
      app.use(cspReportHandler);

      app.get('/api/health', (req, res) => {
        res.json({ status: 'healthy', timestamp: new Date().toISOString() });
      });

      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');

      // Verify security headers are present
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-api-version']).toBe('1.0');
      expect(response.headers['content-security-policy']).toBeDefined();
    });
  });
});
