# Internationalization (i18n) Audit Report - Mobile App

## Executive Summary

This report provides a comprehensive analysis of the internationalization status of the UMP Tournament Manager mobile application. The audit identified existing translation patterns, hardcoded text that needs internationalization, and provides recommendations for improving the i18n implementation.

## Current i18n Implementation Status

### Translation Framework

- **Framework**: `next-intl` with Next.js App Router
- **Translation Files Location**: `src/i18n/messages/`
- **Supported Languages**: English (en), Spanish (es)
- **Translation Hook**: `useTranslations()` function

### Translation File Analysis

#### English Translation File (`en.json`) - 53 lines

```json
{
  "match": {
    /* 19 keys */
  },
  "archive": {
    /* 12 keys */
  },
  "common": {
    /* 13 keys */
  }
}
```

#### Spanish Translation File (`es.json`) - 130 lines

```json
{
  "common": {
    /* 22 keys */
  },
  "test": {
    /* 7 keys */
  },
  "navigation": {
    /* 9 keys */
  },
  "tournament": {
    /* 8 keys */
  },
  "match": {
    /* 11 keys */
  },
  "team": {
    /* 5 keys */
  },
  "player": {
    /* 5 keys */
  },
  "auth": {
    /* 7 keys */
  },
  "errors": {
    /* 5 keys */
  },
  "marketplace": {
    /* 21 keys */
  }
}
```

### Translation Key Mismatch Issues

**Critical Issue**: The Spanish translation file has significantly more keys (130 lines) than the English file (53 lines), indicating:

1. Missing English translations for 21 Spanish keys
2. Inconsistent key structure between languages
3. Validation script failures due to missing English keys

## Existing Translation Usage Patterns

### Components Using Translations

1. **TournamentArchiveView.tsx**

   - Uses: `useTranslations('archive')`, `useTranslations('common')`
   - Keys: `noTournaments`, `noTournamentsDescription`, `filterByYear`, `allYears`, `totalTournaments`, `totalMatches`, `totalTeams`, `winner`, `teams`, `matches`, `days`

2. **MyScheduleView.tsx**

   - Uses: `useTranslations('schedule')`, `useTranslations('common')`
   - Keys: `today`, `tomorrow`, `noMatches`, `upcomingMatches`, `status.live`

3. **LiveScoresView.tsx**

   - Uses: `useTranslations('live')`, `useTranslations('common')`
   - Keys: `noLiveMatches`, `checkBackLater`, `live`, `viewDetails`, `followMatch`, `scores`

4. **LeaderboardView.tsx**

   - Uses: `useTranslations('standings')`, `useTranslations('common')`
   - Keys: `leaderboard`, `rank`, `team`, `played`, `wins`, `draws`, `losses`, `goalDiff`, `points`

5. **LiveMatchCard.tsx**
   - Uses: `useTranslations()` (namespace not specified in search results)

## Hardcoded Text Requiring Internationalization

### High Priority - User-Facing UI Text

#### App Pages (`app/[locale]/` directory)

**Test PWA Page** (`[locale]/test-pwa/page.tsx`):

- 'PWA Test Page', 'Network Status', 'Online', 'Syncing', 'Pending Actions'
- 'Failed Actions', 'Service Worker Status', 'Supported', 'Registered'
- 'Update Available', 'Version', 'Unknown', 'Tournament saved offline successfully!'
- 'Sync completed!', 'Offline data cleared!', 'Sport', 'ID'

**GraphQL Test Page** (`[locale]/test-graphql/page.tsx`):

- 'GraphQL Client Test', 'Auth Status:', 'Loading...', 'GraphQL Status:'
- 'Initializing...', 'If Gateway is Running: Should show "Connected"'
- 'If Gateway is Down: Should show "Error" status with'
- 'Authentication: Should show current Clerk auth'

**Main Page** (`[locale]/page.tsx`):

- 'PWA Features to Test:', 'Debug Info:', 'Locale:', 'Messages loaded:'
- 'YES', 'NO', 'Navigation'

**Realtime Demo Page** (`[locale]/demo/realtime/page.tsx`):

- Team names: 'Thunder Hawks', 'Lightning Bolts', 'Storm Riders', 'Wind Runners', 'Fire Dragons', 'Ice Phoenix'
- UI labels: 'Score:', 'Team A', 'Team B', 'Event:', 'Match event occurred'
- Controls: 'Live Match Simulation', 'Simulation Controls', 'Show Debug Info', 'Hide Debug Info'
- Status: 'Start Simulation', 'Stop Simulation', 'Simulation Status:', 'Active', 'Inactive'
- Connection: 'Connection Status:', 'Connected', 'Disconnected'
- Parameters: 'Match Simulation Parameters', 'Match Update Interval', 'Event Probability'

**Layout** (`[locale]/layout.tsx`):

- 'UMP Tournament Manager', 'Unified Management Platform for Tournament Management'

**Debug Page** (`[locale]/debug/page.tsx`):

- 'Runtime Debug Page', 'Runtime Errors', 'No errors detected'
- 'Runtime Warnings', 'No warnings detected', 'Runtime Information'
- 'User Agent:', 'N/A', 'Window defined:', 'Yes', 'No', 'Document defined:'
- 'Navigator online:', 'Trigger Error', 'Trigger Warning', 'Clear Logs'

**Offline Page** (`[locale]/offline/page.tsx`):

- 'Back Online!', "You're Offline", 'Your connection has been restored.'
- 'No internet connection detected. Some features may be limited.'
- 'Connected', 'Disconnected', 'Go to Home', 'Reload Page', 'Offline Capabilities'

#### Components (`src/components/` directory)

**PWAInstaller.tsx**:

- 'Install UMP Tournament Manager', 'Get the full app experience'

**ServiceWorkerRegistration.tsx**:

- 'App Update Available', 'A new version is available.'

**OfflineIndicator.tsx**:

- 'Back online', 'You are offline. Some features may be limited.'

**LiveMatchCard.tsx**:

- 'Live', 'Connecting...', 'Offline', 'VS', 'Match ID:', 'Update Count:'
- 'Has Updated:', 'Yes', 'No', 'Connection:', 'Active Animations:', 'Error:'

### Medium Priority - Status and Type Constants

#### Status Enums (from `types.ts` and component usage):

- Tournament Status: 'DRAFT', 'PUBLISHED', 'ACTIVE', 'COMPLETED', 'CANCELLED'
- Match Status: 'PENDING', 'LIVE', 'FINAL', 'NEEDS_APPROVAL'
- Event Types: 'GOAL', 'CARD', 'SUBSTITUTION'
- Connection Status: 'connecting', 'connected', 'error'

#### API Response Messages (`api/tournaments/route.ts`):

- 'Failed to create tournament:', 'Tournament synced successfully'
- 'Failed to sync tournament:'

### Low Priority - Development/Debug Text

#### Test Files and Development Components:

- Various test descriptions and debug information
- Console log messages
- Development-only status indicators

## Missing Translation Keys Analysis

### Keys Present in Spanish but Missing in English:

1. **Common Section Extensions**:

   - `appName`, `appDescription`, `graphqlSetupComplete`, `apolloClientIntegration`
   - `welcome`, `success`, `create`, `submit`, `confirm`, `search`, `filter`, `sort`

2. **Complete Missing Sections**:

   - `test` (7 keys)
   - `navigation` (9 keys)
   - `tournament` (8 keys)
   - `team` (5 keys)
   - `player` (5 keys)
   - `auth` (7 keys)
   - `errors` (5 keys)
   - `marketplace` (21 keys)

3. **Match Section Differences**:
   - Spanish has more comprehensive status translations
   - Missing status mappings in English

## Recommended Translation Key Structure

### Suggested New Keys for Hardcoded Text

```json
{
  "pwa": {
    "install": {
      "title": "Install UMP Tournament Manager",
      "description": "Get the full app experience",
      "install": "Install",
      "dismiss": "Dismiss"
    },
    "update": {
      "title": "App Update Available",
      "description": "A new version is available.",
      "update": "Update",
      "later": "Later"
    },
    "test": {
      "title": "PWA Test Page",
      "networkStatus": "Network Status",
      "online": "Online",
      "syncing": "Syncing",
      "pendingActions": "Pending Actions",
      "failedActions": "Failed Actions",
      "serviceWorkerStatus": "Service Worker Status",
      "supported": "Supported",
      "registered": "Registered",
      "updateAvailable": "Update Available",
      "version": "Version",
      "unknown": "Unknown",
      "tournamentSavedOffline": "Tournament saved offline successfully!",
      "syncCompleted": "Sync completed!",
      "offlineDataCleared": "Offline data cleared!",
      "sport": "Sport",
      "id": "ID"
    }
  },
  "connection": {
    "status": {
      "connected": "Connected",
      "connecting": "Connecting...",
      "disconnected": "Disconnected",
      "offline": "Offline",
      "error": "Error"
    },
    "messages": {
      "backOnline": "Back Online!",
      "youreOffline": "You're Offline",
      "connectionRestored": "Your connection has been restored. You can now access all features.",
      "noConnection": "No internet connection detected. Some features may be limited, but you can still view cached tournaments and matches.",
      "limitedFeatures": "You are offline. Some features may be limited."
    }
  },
  "simulation": {
    "title": "Live Match Simulation",
    "controls": "Simulation Controls",
    "showDebug": "Show Debug Info",
    "hideDebug": "Hide Debug Info",
    "start": "Start Simulation",
    "stop": "Stop Simulation",
    "status": {
      "label": "Simulation Status:",
      "active": "Active",
      "inactive": "Inactive"
    },
    "teams": {
      "thunderHawks": "Thunder Hawks",
      "lightningBolts": "Lightning Bolts",
      "stormRiders": "Storm Riders",
      "windRunners": "Wind Runners",
      "fireDragons": "Fire Dragons",
      "icePhoenix": "Ice Phoenix",
      "teamA": "Team A",
      "teamB": "Team B"
    },
    "events": {
      "matchEventOccurred": "Match event occurred",
      "matchUpdated": "Match updated"
    },
    "parameters": {
      "title": "Match Simulation Parameters",
      "updateInterval": "Match Update Interval",
      "eventProbability": "Event Probability",
      "scoreChangeProbability": "Score Change Probability",
      "statusChangeProbability": "Status Change Probability",
      "matchEventProbability": "Match Event Probability"
    }
  },
  "debug": {
    "title": "Runtime Debug Page",
    "errors": "Runtime Errors",
    "warnings": "Runtime Warnings",
    "information": "Runtime Information",
    "noErrors": "No errors detected",
    "noWarnings": "No warnings detected",
    "userAgent": "User Agent:",
    "notAvailable": "N/A",
    "windowDefined": "Window defined:",
    "documentDefined": "Document defined:",
    "navigatorOnline": "Navigator online:",
    "triggerError": "Trigger Error",
    "triggerWarning": "Trigger Warning",
    "clearLogs": "Clear Logs"
  },
  "graphql": {
    "test": {
      "title": "GraphQL Client Test",
      "authStatus": "Auth Status:",
      "graphqlStatus": "GraphQL Status:",
      "initializing": "Initializing...",
      "gatewayRunning": "If Gateway is Running: Should show \"Connected\"",
      "gatewayDown": "If Gateway is Down: Should show \"Error\" status with",
      "authentication": "Authentication: Should show current Clerk auth"
    }
  },
  "pages": {
    "home": {
      "pwaFeatures": "PWA Features to Test:",
      "debugInfo": "Debug Info:",
      "locale": "Locale:",
      "messagesLoaded": "Messages loaded:",
      "yes": "YES",
      "no": "NO",
      "navigation": "Navigation"
    },
    "simple": {
      "title": "Simple Test Page",
      "description": "This page has no client-side JavaScript or complex components."
    },
    "test": {
      "action": "Action:",
      "navigation": "Navigation:"
    }
  },
  "schedule": {
    "mySchedule": "My Schedule",
    "upcomingMatches": "Upcoming Matches",
    "today": "Today",
    "tomorrow": "Tomorrow",
    "noMatches": "No matches scheduled",
    "vs": "vs"
  },
  "live": {
    "liveScores": "Live Scores",
    "currentMatches": "Current Matches",
    "noLiveMatches": "No live matches",
    "checkBackLater": "Check back later",
    "live": "Live",
    "viewDetails": "View Details",
    "followMatch": "Follow Match",
    "scores": "Scores"
  },
  "standings": {
    "standings": "Standings",
    "currentRankings": "Current Rankings",
    "leaderboard": "Leaderboard",
    "rank": "Rank",
    "team": "Team",
    "played": "Played",
    "wins": "Wins",
    "draws": "Draws",
    "losses": "Losses",
    "goalDiff": "Goal Diff",
    "points": "Points"
  },
  "archive": {
    "tournamentArchive": "Tournament Archive",
    "pastTournaments": "Past Tournaments"
  },
  "actions": {
    "goToHome": "Go to Home",
    "reloadPage": "Reload Page"
  },
  "capabilities": {
    "offlineCapabilities": "Offline Capabilities"
  },
  "match": {
    "details": {
      "matchId": "Match ID:",
      "updateCount": "Update Count:",
      "hasUpdated": "Has Updated:",
      "connection": "Connection:",
      "activeAnimations": "Active Animations:",
      "error": "Error:"
    }
  }
}
```

## Implementation Recommendations

### Immediate Actions (High Priority)

1. **Fix Translation Key Mismatch**

   - Add missing English translations for all Spanish keys
   - Ensure both `en.json` and `es.json` have identical key structures
   - Fix validation script failures

2. **Internationalize High-Priority UI Text**

   - PWA installer and update notifications
   - Connection status messages
   - Main navigation and page titles
   - Error and success messages

3. **Standardize Translation Usage**
   - Ensure all components use `useTranslations()` consistently
   - Remove hardcoded text from user-facing components
   - Implement proper namespace organization

### Medium-Term Actions

1. **Expand Translation Coverage**

   - Add translations for all status enums
   - Internationalize debug and test pages
   - Add proper error message translations

2. **Improve Translation Organization**
   - Reorganize keys into logical namespaces
   - Create consistent naming conventions
   - Add translation comments for context

### Long-Term Actions

1. **Add More Languages**

   - Prepare infrastructure for additional languages
   - Implement language detection and switching
   - Add RTL language support if needed

2. **Implement Translation Management**
   - Set up translation validation in CI/CD
   - Create translation update workflows
   - Add missing translation detection

## File Locations Summary

### Files with Existing Translations

- `src/components/TournamentArchiveView.tsx`
- `src/components/MyScheduleView.tsx`
- `src/components/LiveScoresView.tsx`
- `src/components/LeaderboardView.tsx`
- `src/components/LiveMatchCard.tsx`

### Files Requiring Internationalization

- `app/[locale]/test-pwa/page.tsx`
- `app/[locale]/test-graphql/page.tsx`
- `app/[locale]/page.tsx`
- `app/[locale]/demo/realtime/page.tsx`
- `app/[locale]/layout.tsx`
- `app/[locale]/debug/page.tsx`
- `app/[locale]/offline/page.tsx`
- `app/[locale]/(spectator)/schedule/page.tsx`
- `app/[locale]/(spectator)/live/page.tsx`
- `app/[locale]/(spectator)/standings/page.tsx`
- `app/[locale]/(spectator)/archive/page.tsx`
- `app/[locale]/simple/page.tsx`
- `app/[locale]/test/page.tsx`
- `src/components/PWAInstaller.tsx`
- `src/components/ServiceWorkerRegistration.tsx`
- `src/components/OfflineIndicator.tsx`
- `src/types.ts` (status enums)
- `app/api/tournaments/route.ts`

### Translation Files

- `src/i18n/messages/en.json` (needs expansion)
- `src/i18n/messages/es.json` (needs English counterparts)
- `scripts/validate-translations.ts` (validation script)

---

**Report Generated**: $(date)
**Total Hardcoded Strings Identified**: ~150+
**Translation Coverage**: ~30% (estimated)
**Priority Level**: High - Significant i18n gaps identified
