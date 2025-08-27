# T-22 Resolving Lighthouse Issues - 2025-01-27

## Session Overview

This session focused on resolving Lighthouse CI failures that were blocking Vercel deployments. The primary issue was related to deprecated PWA audits in Lighthouse v12+.

## Issues Identified

### 1. PWA Audit Failure (Primary Issue)

- **Problem**: PWA category scoring 0 despite proper manifest.json and service worker configuration
- **Root Cause**: PWA audits were deprecated in Lighthouse v12+ but still configured in lighthouserc.js
- **Impact**: Causing CI failures and blocking Vercel deployments

### 2. Lighthouse Configuration

- **File**: `apps/mobile/lighthouserc.js`
- **Issue**: Contains deprecated `'categories:pwa'` assertion with minScore requirement
- **URL**: Testing `http://localhost:3000/en/test-pwa`

## Investigation Process

### PWA Manifest Analysis

- Verified `manifest.json` accessibility at `http://localhost:3000/manifest.json`
- Confirmed proper PWA properties:
  - `name`, `short_name`, `description`
  - `start_url`, `display`, `background_color`, `theme_color`
  - Multiple icon sizes and formats (including SVG)
  - Proper `scope`, `id`, `display_override`

### Lighthouse Version Check

- Lighthouse version: `12.8.1`
- Lighthouse CI version: `0.15.1`
- Confirmed PWA audits deprecated in v12+

### Debug Audit

- Ran specific PWA audit: `npx lighthouse http://localhost:3000/en/test-pwa --only-categories=pwa`
- Results showed empty PWA categories object despite request
- URL redirection: `http://localhost:3000/en/test-pwa` → `http://localhost:3000/test-pwa`

## Solution Implemented

### Configuration Update

- **File Modified**: `apps/mobile/lighthouserc.js`
- **Change**: Commented out deprecated PWA assertion:
  ```javascript
  // 'categories:pwa': ['warn', {minScore: 0.3}], // PWA audits deprecated in Lighthouse v12+
  ```

### Verification

- Ran `pnpm lhci autorun` successfully
- Lighthouse CI healthcheck passed
- All 3 audit runs completed without issues
- Cleaned up debug files

## Results

- ✅ Lighthouse CI now passes
- ✅ Vercel deployment blockage resolved
- ✅ PWA functionality remains intact (service worker, manifest, Next.js PWA plugin)
- ✅ Other Lighthouse categories (performance, accessibility, best practices, SEO) continue to be audited

## Technical Notes

- PWA functionality is not affected by removing Lighthouse PWA scoring
- Service worker registration and manifest.json continue to work properly
- Next.js PWA plugin (@ducanh2912/next-pwa) remains configured and functional
- Modern browsers still recognize and install the PWA

## Next Steps

- Monitor Vercel deployments to ensure continued success
- Consider alternative PWA validation tools if needed
- Keep Lighthouse configuration updated with future versions

## Files Modified

- `apps/mobile/lighthouserc.js` - Commented out deprecated PWA assertion

## Commands Used

```bash
# Debug PWA audit
npx lighthouse http://localhost:3000/en/test-pwa --only-categories=pwa --output=json --output-path=lighthouse-pwa-debug.json

# Verify Lighthouse CI
pnpm lhci autorun

# Version checks
npx lighthouse --version
npx lhci --version
```

## Session Outcome

**Status**: ✅ Resolved
**Impact**: Unblocked Vercel deployments while maintaining PWA functionality
**Duration**: ~2 hours
**Complexity**: Medium (required version compatibility research)
