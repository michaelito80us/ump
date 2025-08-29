# RBAC Middleware

Role-based access control middleware for the UMP Tournament Plugin System.

## Overview

This module provides role-based access control (RBAC) functionality for plugin execution contexts. It implements the role model defined in the unified specification and provides both decorator and function-based approaches for role validation.

## Role Model

The following roles are supported:

- **OrgOwner**: Full control (billing, users, tournaments, plugins)
- **OrgAdmin**: Manage users & tournaments (no billing)
- **TournamentAdmin**: Configure tournament, edit matches, approve scores & overrides, manage teams
- **TournamentAide**: Day-to-day ops: update venues/time, send invites, close registration
- **Referee**: Submit official scores, start/stop matches, approve needs_approval scores
- **TeamManager**: Manage roster, submit line-ups, accept invites
- **Coach**: View internal data, submit provisional scores, request overrides
- **Player**: View schedule & personal stats
- **Spectator**: Read-only access
- **PluginSystem**: Sandboxed context when a plugin mutates state

## Usage

### Function-based Approach (Recommended)

```typescript
import { requireRole, createRBACContext } from '@ump/engine';

// In your plugin method
function updateTournamentSettings(context: RBACContext, settings: any) {
  // Validate user has required role
  requireRole(context, 'TournamentAdmin');

  // Proceed with the operation
  // ...
}

// Multiple roles (ANY logic)
function submitScore(context: RBACContext, score: any) {
  requireRole(context, ['Referee', 'TournamentAdmin']);
  // ...
}

// Multiple roles (ALL logic)
function approveOverride(context: RBACContext, override: any) {
  requireRole(context, ['TournamentAdmin', 'Referee'], { requireAll: true });
  // ...
}

// Scoped validation
function manageTeam(context: RBACContext, teamId: string) {
  requireRole(context, 'TeamManager', {
    scope: { teamId },
  });
  // ...
}
```

### Decorator Approach

```typescript
import { RequiresRole, RBACContext } from '@ump/engine';

class TournamentPlugin {
  @RequiresRole('TournamentAdmin')
  updateSettings(context: RBACContext, settings: any) {
    // Method implementation
  }

  @RequiresRole(['Referee', 'TournamentAdmin'])
  submitScore(context: RBACContext, score: any) {
    // Method implementation
  }

  @RequiresRole('TournamentAdmin', { scope: { tournamentId: 'tournament-1' } })
  scopedOperation(context: RBACContext) {
    // Method implementation
  }
}
```

### Utility Functions

```typescript
import { hasAnyRole, hasAllRoles, validateUserRoles } from '@ump/engine';

// Check if user has any of the specified roles
if (hasAnyRole(context, ['Referee', 'TournamentAdmin'])) {
  // User can perform action
}

// Check if user has all specified roles
if (hasAllRoles(context, ['TournamentAdmin', 'TeamManager'])) {
  // User has both roles
}

// Manual validation with options
const isValid = validateUserRoles(context.userRoles, 'TournamentAdmin', {
  scope: { tournamentId: 'tournament-1' },
});
```

### Creating RBAC Context

```typescript
import { createRBACContext } from '@ump/engine';

const rbacContext = createRBACContext(pluginExecutionContext, 'user-123', [
  {
    role: 'TournamentAdmin',
    scope: { tournamentId: 'tournament-1' },
    userId: 'user-123',
  },
]);
```

## Scope Validation

Roles can be scoped to specific entities:

- **organizationId**: Organization-level permissions
- **tournamentId**: Tournament-level permissions
- **teamId**: Team-level permissions

When validating roles with scope, the user must have the required role within the specified scope.

## Error Handling

The RBAC middleware throws `PluginExecutionError` with specific error codes:

- **RBAC_NO_ROLES**: No user roles found in execution context
- **RBAC_INSUFFICIENT_PERMISSIONS**: User lacks required permissions
- **RBAC_PLUGIN_SYSTEM_REQUIRED**: Plugin execution requires PluginSystem role

## Integration with Plugin System

The RBAC middleware is designed to work with the plugin execution context. When plugins are executed in the sandbox, they should validate permissions before performing privileged operations.

```typescript
// Plugin system validation
import { validatePluginSystemRole } from '@ump/engine';

// Ensure plugin has system-level permissions
validatePluginSystemRole(context);
```

## Future Enhancements

- Database integration for loading user roles (`loadUserRoles` function)
- Attribute-Based Access Control (ABAC) overlay
- Time-boxed permissions
- Delegated permission bundles
