# CI/CD Setup Guide

This document outlines how to configure the Continuous Integration and Continuous Deployment pipeline for the Unified Management Platform.

## Overview

Our CI/CD pipeline consists of:

- **GitHub Actions** for automated testing, linting, and building
- **Vercel** for preview deployments on every pull request
- **Branch protection rules** to ensure code quality

## GitHub Actions Workflows

### 1. CI Workflow (`.github/workflows/ci.yml`)

Runs on every push to `main` and on all pull requests:

- **Lint**: ESLint + Prettier format checking
- **Test**: Jest test suites across all packages
- **Build**: TypeScript compilation and Next.js builds

**Features:**

- Parallel job execution for faster feedback
- PNPM caching for improved performance
- Concurrency control to cancel outdated runs

### 2. Preview Deployment (`.github/workflows/preview.yml`)

Deploys preview environments on pull requests:

- Deploys both mobile and admin apps to Vercel
- Comments on PR with preview URLs
- Updates existing comments on subsequent pushes

## Vercel Setup Instructions

### Prerequisites

1. **Create Vercel account** at [vercel.com](https://vercel.com)
2. **Install Vercel CLI**: `npm install -g vercel`

### Step 1: Create Vercel Projects

1. **Mobile App Project:**

   ```bash
   cd apps/mobile
   vercel --confirm
   # Follow prompts, select your team/org
   # Note the project ID from output
   ```

2. **Admin App Project:**

   ```bash
   cd apps/admin
   vercel --confirm
   # Follow prompts, select same team/org
   # Note the project ID from output
   ```

### Step 2: Get Organization ID

```bash
vercel teams list
# Note your team/org ID
```

### Step 3: Generate Vercel Token

1. Go to [Vercel Account Settings > Tokens](https://vercel.com/account/tokens)
2. Create new token with appropriate scope
3. Copy the token (starts with `vercel_`)

### Step 4: Configure GitHub Secrets

Add these secrets in your GitHub repository settings (`Settings > Secrets and variables > Actions`):

| Secret Name                | Description                 | Example              |
| -------------------------- | --------------------------- | -------------------- |
| `VERCEL_TOKEN`             | Your Vercel API token       | `vercel_abcd1234...` |
| `VERCEL_ORG_ID`            | Your Vercel organization ID | `team_abc123`        |
| `VERCEL_MOBILE_PROJECT_ID` | Mobile app project ID       | `prj_mobile123`      |
| `VERCEL_ADMIN_PROJECT_ID`  | Admin app project ID        | `prj_admin456`       |

## Branch Protection Setup

### Recommended Settings

1. Go to repository `Settings > Branches`
2. Add rule for `main` branch:

**Required status checks:**

- ✅ `Lint`
- ✅ `Test`
- ✅ `Build`

**Additional settings:**

- ✅ Require branches to be up to date before merging
- ✅ Require pull request reviews before merging (1 reviewer)
- ✅ Dismiss stale reviews when new commits are pushed
- ✅ Restrict pushes that create files larger than 100MB

## Deployment Strategy

### Preview Deployments

- **Trigger**: Every pull request
- **Apps**: Both mobile and admin
- **URL Pattern**:
  - Mobile: `https://ump-mobile-{hash}.vercel.app`
  - Admin: `https://ump-admin-{hash}.vercel.app`

### Production Deployments

- **Trigger**: Merge to `main` branch
- **Auto-deploy**: Enabled via Vercel GitHub integration
- **Domains**: Configure custom domains in Vercel dashboard

## Monitoring & Alerts

### Build Status

- GitHub Actions provides email notifications on failure
- Vercel sends deployment notifications via email/Slack

### Performance Monitoring

- Vercel Analytics automatically enabled
- Core Web Vitals tracking included
- Build time and bundle size monitoring

## Troubleshooting

### Common Issues

**Build fails with "Cannot find module '@ump/core'"**

```bash
# Solution: Ensure workspace dependencies are built first
pnpm build --filter=@ump/core
```

**Vercel deployment timeout**

```bash
# Solution: Check build command in vercel.json
# Ensure it builds from monorepo root
```

**PNPM cache issues**

```bash
# Solution: Clear cache and reinstall
pnpm store prune
pnpm install --frozen-lockfile
```

### Performance Optimization

**Faster CI builds:**

- Use `--filter` flags to build only changed packages
- Leverage Turbo's incremental builds
- Cache node_modules effectively

**Faster Vercel deployments:**

- Optimize bundle sizes
- Use proper caching headers
- Enable compression

## Security Considerations

### Secrets Management

- Never commit API tokens or sensitive data
- Use GitHub encrypted secrets
- Rotate tokens regularly (quarterly)

### Deployment Security

- Security headers configured in `vercel.json`
- HTTPS enforced by default
- Environment variable isolation

## Next Steps

After setup completion:

1. **Test the pipeline** by creating a test PR
2. **Configure custom domains** in Vercel dashboard
3. **Set up monitoring** and alerting
4. **Document deployment procedures** for team

## Support

For issues with this setup:

- Check GitHub Actions logs for CI failures
- Review Vercel deployment logs for deployment issues
- Consult [Vercel documentation](https://vercel.com/docs) for platform-specific help
