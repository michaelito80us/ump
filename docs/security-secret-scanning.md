# Secret Scanning Setup

This document describes the secret scanning implementation for the Unified Management Platform (UMP) to prevent accidental commits of sensitive information.

## Overview

The secret scanning system uses [Gitleaks](https://github.com/gitleaks/gitleaks) to detect secrets, API keys, passwords, and other sensitive information in the codebase. It runs automatically in CI/CD pipelines and can be executed locally during development.

## Implementation Details

### Files Created/Modified

- `.github/workflows/secret-scan.yml` - GitHub Actions workflow for CI secret scanning
- `.gitleaks.toml` - Gitleaks configuration file with custom rules
- `scripts/test-secret-scan.js` - Test script to verify secret scanning functionality
- `__tests__/secret-scan-integration.test.js` - Jest integration tests
- `package.json` - Added gitleaks dependency and npm scripts

### Configuration

The `.gitleaks.toml` file includes:

#### Custom Rules

- **Clerk Secret Keys**: Detects `sk_test_*` and `sk_live_*` patterns
- **Clerk Publishable Keys**: Detects `pk_test_*` and `pk_live_*` patterns
- **Database URLs**: Detects PostgreSQL connection strings with credentials
- **Redis URLs**: Detects Redis connection strings with credentials
- **JWT Secrets**: Detects JWT secret patterns

#### Allowlisted Paths

- Test files (`*.test.ts`, `*.spec.ts`)
- Mock directories (`__mocks__/`, `mocks/`)
- Documentation (`docs/`, `README.md`)
- Example files (`.env.example`)

#### Stop Words

Common words like "example", "test", "mock", "dummy" are treated as stop words to reduce false positives.

## Usage

### Local Development

```bash
# Run secret scan on entire repository
pnpm secret-scan

# Run secret scan with CI format (generates SARIF report)
pnpm secret-scan:ci

# Test the secret scanning functionality
pnpm test:secret-scan
```

### CI/CD Integration

The secret scanning runs automatically on:

- All pushes to `main` branch
- All pull requests to `main` branch

The workflow will:

1. Check out the repository with full git history
2. Install dependencies
3. Run gitleaks with the custom configuration
4. Generate SARIF report if secrets are found
5. Upload findings to GitHub Security tab
6. **Block the merge** if secrets are detected

### Testing

Run the integration tests:

```bash
# Run all secret scanning tests
pnpm test __tests__/secret-scan-integration.test.js

# Run the demonstration script
pnpm test:secret-scan
```

## What Gets Detected

### AWS Credentials

```javascript
// ❌ Will be detected
const config = {
  accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
  secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
};
```

### Clerk API Keys

```javascript
// ❌ Will be detected
const clerkConfig = {
  secretKey: 'sk_test_1234567890abcdefghijklmnopqrstuvwxyz123456',
  publishableKey: 'pk_live_1234567890abcdefghijklmnopqrstuvwxyz123456',
};
```

### Database URLs

```javascript
// ❌ Will be detected
const dbUrl = 'postgres://username:password123@localhost:5432/mydb';
```

### JWT Secrets

```javascript
// ❌ Will be detected
const jwtSecret = 'super-secret-jwt-key-that-should-not-be-committed';
```

## What's Allowed

### Test Files

```javascript
// ✅ Allowed in *.test.js files
const mockConfig = {
  accessKeyId: 'AKIAIOSFODNN7EXAMPLE', // This won't trigger in test files
};
```

### Example Files

```bash
# ✅ Allowed in .env.example
CLERK_SECRET_KEY=sk_test_your_secret_key_here
DATABASE_URL=postgres://username:password@localhost:5432/dbname
```

### Documentation

```markdown
<!-- ✅ Allowed in documentation -->

Example API key: `sk_test_example_key_for_documentation`
```

## Troubleshooting

### False Positives

If gitleaks detects a false positive:

1. **For test data**: Ensure the file is in an allowlisted directory or has a test-related filename
2. **For documentation**: Move the content to a `.md` file or `docs/` directory
3. **For legitimate examples**: Use stop words like "example", "test", "mock" in the string

### Adding Custom Rules

To add new secret detection rules, edit `.gitleaks.toml`:

```toml
[[rules]]
id = "custom-api-key"
description = "Custom API Key Pattern"
regex = '''custom_api_[a-zA-Z0-9]{32}'''
tags = ["api", "custom"]
```

### Bypassing Detection (Not Recommended)

If you absolutely need to commit something that triggers a false positive:

1. Add the specific pattern to the `allowlist.regexes` section in `.gitleaks.toml`
2. Document why this exception is necessary
3. Consider if the data truly needs to be in the repository

## Security Benefits

1. **Prevents accidental exposure** of API keys, passwords, and tokens
2. **Automated detection** in CI/CD pipeline blocks dangerous commits
3. **Historical scanning** checks entire git history for existing secrets
4. **Customizable rules** for organization-specific secret patterns
5. **Integration with GitHub Security** for centralized security monitoring

## Compliance

This implementation helps meet security requirements for:

- **OWASP Top 10** - A02:2021 Cryptographic Failures
- **GDPR** - Data protection through preventing credential exposure
- **SOC 2** - Security monitoring and access controls
- **ISO 27001** - Information security management

## Next Steps

1. **Enable GitHub Advanced Security** for enhanced secret scanning features
2. **Set up secret rotation policies** for any detected historical secrets
3. **Train development team** on secure coding practices
4. **Regular audits** of the gitleaks configuration and rules
