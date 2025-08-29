# Security Headers Configuration

This document describes the OWASP baseline security headers implementation in the UMP API Gateway and how to configure or override them for different environments.

## Overview

The gateway implements comprehensive security headers based on OWASP recommendations to protect against common web vulnerabilities:

- **Cross-Site Scripting (XSS)**
- **Clickjacking**
- **MIME type sniffing**
- **Man-in-the-middle attacks**
- **Content injection**
- **Information disclosure**

## Implemented Security Headers

### Content Security Policy (CSP)

Prevents XSS attacks by controlling which resources can be loaded.

**Production Default:**

```
default-src 'self';
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data: https:;
script-src 'self';
connect-src 'self' wss: ws:;
frame-src 'none';
object-src 'none';
base-uri 'self';
form-action 'self';
upgrade-insecure-requests;
```

**Development Modifications:**

- Adds `'unsafe-eval'` and `'unsafe-inline'` to `script-src` for hot reloading
- Allows `localhost` connections in `connect-src`
- Uses report-only mode for easier debugging

### HTTP Strict Transport Security (HSTS)

Forces HTTPS connections and prevents protocol downgrade attacks.

**Production Only:**

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

- `max-age=31536000`: 1 year cache duration
- `includeSubDomains`: Apply to all subdomains
- `preload`: Eligible for browser preload lists

### X-Content-Type-Options

Prevents MIME type sniffing attacks.

```
X-Content-Type-Options: nosniff
```

### X-Frame-Options

Prevents clickjacking attacks.

```
X-Frame-Options: DENY
```

### X-XSS-Protection

Enables browser XSS filtering (legacy browsers).

```
X-XSS-Protection: 1; mode=block
```

### Referrer-Policy

Controls referrer information sent with requests.

```
Referrer-Policy: strict-origin-when-cross-origin
```

### Permissions-Policy

Controls access to browser features.

```
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()
```

### Additional Headers

- **X-API-Version**: API version identifier
- **X-Request-ID**: Request tracking identifier
- **Cache-Control**: No-cache directives for GraphQL endpoints
- **Cross-Origin-Opener-Policy**: `same-origin`
- **Cross-Origin-Resource-Policy**: `cross-origin`

## Environment Configurations

### Development

```typescript
{
  environment: 'development',
  enableCSP: true,      // Report-only mode
  enableHSTS: false,    // Disabled for HTTP development
}
```

**Features:**

- CSP in report-only mode
- Relaxed script-src for hot reloading
- No HSTS enforcement
- Localhost connections allowed

### Production

```typescript
{
  environment: 'production',
  enableCSP: true,      // Enforced mode
  enableHSTS: true,     // Full HSTS with preload
}
```

**Features:**

- Strict CSP enforcement
- Full HSTS with preload
- Minimal allowed sources
- Maximum security posture

### Test

```typescript
{
  environment: 'test',
  enableCSP: false,     // Disabled for testing
  enableHSTS: false,    // Disabled for testing
}
```

**Features:**

- CSP disabled for test flexibility
- No HSTS enforcement
- Basic headers only

## Customization and Overrides

### Custom CSP Directives

You can override or extend CSP directives:

```typescript
import { createSecurityHeadersMiddleware } from './middleware/securityHeaders';

const customConfig = {
  environment: 'production',
  enableCSP: true,
  enableHSTS: true,
  customCSPDirectives: {
    scriptSrc: ["'self'", "'unsafe-inline'", 'https://trusted-cdn.com'],
    imgSrc: ["'self'", 'data:', 'https://images.example.com'],
    connectSrc: ["'self'", 'wss:', 'https://api.external-service.com'],
  },
};

app.use(createSecurityHeadersMiddleware(customConfig));
```

### Environment Variables

Control security headers via environment variables:

```bash
# .env
NODE_ENV=production
ENABLE_CSP=true
ENABLE_HSTS=true
CSP_REPORT_URI=https://your-domain.com/csp-report
```

### Disabling Specific Headers

For special cases, you can disable specific headers:

```typescript
const config = {
  environment: 'production',
  enableCSP: false, // Disable CSP entirely
  enableHSTS: true,
};
```

## CSP Violation Reporting

### Report Endpoint

CSP violations are automatically logged via the `/csp-report` endpoint:

```typescript
// Automatic logging of violations
logger.warn('CSP Violation Report', {
  report: req.body,
  userAgent: req.headers['user-agent'],
  ip: req.ip,
  timestamp: new Date().toISOString(),
});
```

### Monitoring Violations

1. **Development**: Check console logs for CSP reports
2. **Production**: Monitor structured logs for violation patterns
3. **External Services**: Forward reports to security monitoring tools

### Common Violations

| Violation     | Cause                           | Solution                                          |
| ------------- | ------------------------------- | ------------------------------------------------- |
| `script-src`  | Inline scripts or external CDNs | Add nonce or whitelist domain                     |
| `style-src`   | Inline styles                   | Use external stylesheets or add `'unsafe-inline'` |
| `img-src`     | External images                 | Whitelist image domains                           |
| `connect-src` | API calls to external services  | Add API domains to whitelist                      |

## Security Best Practices

### 1. Regular Header Audits

```bash
# Test headers in staging
curl -I https://staging-api.ump.com/graphql

# Verify CSP compliance
npx csp-evaluator --url https://staging-api.ump.com
```

### 2. Gradual CSP Deployment

1. Start with report-only mode
2. Monitor violation reports
3. Adjust directives based on legitimate violations
4. Enable enforcement mode

### 3. HSTS Preloading

For production domains:

1. Ensure HSTS header includes `preload`
2. Submit domain to [HSTS Preload List](https://hstspreload.org/)
3. Monitor for successful inclusion

### 4. Regular Security Scans

```bash
# Security header analysis
npx security-headers-check https://api.ump.com

# OWASP ZAP baseline scan
docker run -t owasp/zap2docker-stable zap-baseline.py -t https://api.ump.com
```

## Troubleshooting

### CSP Blocking Legitimate Resources

1. Check browser console for CSP violation reports
2. Identify the blocked resource
3. Add appropriate directive to CSP configuration
4. Test in development before deploying

### HSTS Issues

**Problem**: Cannot access site over HTTP in development
**Solution**: Use different domain or clear HSTS cache

```bash
# Clear Chrome HSTS cache
chrome://net-internals/#hsts
```

### Performance Impact

Security headers have minimal performance impact:

- Headers add ~1-2KB to response size
- CSP parsing is handled by browser
- No server-side processing overhead

## Testing Security Headers

### Automated Tests

```bash
# Run security header tests
pnpm test src/__tests__/securityHeaders.test.ts

# Integration tests
pnpm test:integration
```

### Manual Testing

```bash
# Check headers in staging
curl -I https://staging-gateway.ump.com/graphql

# Verify CSP
curl -H "Content-Security-Policy-Report-Only: default-src 'self'" \
     https://staging-gateway.ump.com/graphql
```

### Security Scanning Tools

- [Mozilla Observatory](https://observatory.mozilla.org/)
- [Security Headers](https://securityheaders.com/)
- [OWASP ZAP](https://www.zaproxy.org/)
- [Nmap NSE Scripts](https://nmap.org/nsedoc/scripts/http-security-headers.html)

## Compliance and Standards

This implementation follows:

- **OWASP Top 10** mitigation strategies
- **NIST Cybersecurity Framework** guidelines
- **Mozilla Security Guidelines**
- **Google Web Security Best Practices**

## Support and Updates

For questions or security concerns:

1. Check this documentation
2. Review test cases in `__tests__/securityHeaders.test.ts`
3. Consult OWASP security headers guide
4. Create issue in project repository

---

**Last Updated**: February 2025  
**Version**: 1.0  
**Maintainer**: UMP Security Team
