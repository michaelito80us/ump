/**
 * RBAC Middleware - Role-based resolver guard
 * Implements @RequiresRole decorator for plugin execution context
 */

import { PluginExecutionError } from '../errors';
import { PluginExecutionContext } from '../sandbox/types';
import { getLogService } from '../logging';

// Role definitions from unified spec
export type Role =
  | 'OrgOwner'
  | 'OrgAdmin'
  | 'TournamentAdmin'
  | 'TournamentAide'
  | 'Referee'
  | 'TeamManager'
  | 'Coach'
  | 'Player'
  | 'Spectator'
  | 'PluginSystem';

// Scope types for role validation
export interface RoleScope {
  organizationId?: string;
  tournamentId?: string;
  teamId?: string;
}

// User role assignment with scope
export interface UserRole {
  role: Role;
  scope: RoleScope;
  userId: string;
}

// Context with user roles for RBAC validation
export interface RBACContext extends PluginExecutionContext {
  userId?: string;
  userRoles: UserRole[];
}

// Role validation options
export interface RoleValidationOptions {
  requireAll?: boolean; // If true, user must have ALL specified roles (default: false - ANY)
  scope?: RoleScope; // Scope to validate against
  isRoleRevocation?: boolean; // If true, validates role removal instead of role requirement
  userId?: string; // User ID for logging purposes
}

/**
 * Counts the number of OrgOwners in a given set of user roles
 */
export function countOrgOwners(
  userRoles: UserRole[],
  scope?: RoleScope
): number {
  return userRoles.filter((ur) => {
    if (ur.role !== 'OrgOwner') return false;
    if (!scope) return true;

    // Check organization scope
    if (
      scope.organizationId &&
      ur.scope.organizationId !== scope.organizationId
    ) {
      return false;
    }
    return true;
  }).length;
}

/**
 * Validates if a user has the required role(s) within the specified scope
 */
export async function validateUserRoles(
  userRoles: UserRole[],
  requiredRoles: Role | Role[],
  options: RoleValidationOptions = {}
): Promise<boolean> {
  // Handle role revocation validation
  if (
    options.isRoleRevocation &&
    Array.isArray(requiredRoles) &&
    requiredRoles.includes('OrgOwner') &&
    options.scope
  ) {
    // Check if removing this role would leave zero OrgOwners
    const remainingOrgOwners = countOrgOwners(userRoles, options.scope);
    if (remainingOrgOwners <= 1) {
      const error = new PluginExecutionError(
        'Cannot remove the last OrgOwner. A hand-off to another OrgOwner is required.',
        'RBAC_LAST_ORGOWNER_REMOVAL',
        { scope: options.scope }
      );

      // Log the failed revocation attempt
      if (options.userId && options.scope.organizationId) {
        const logService = getLogService();
        await logService.logRoleRevocation(
          options.scope.organizationId,
          'OrgOwner',
          options.userId,
          false,
          {
            actorId: options.userId,
            actorType: 'user',
            organizationId: options.scope.organizationId,
          },
          'Attempted to remove last OrgOwner'
        );
      }

      throw error;
    }

    // Log successful revocation
    if (options.userId && options.scope.organizationId) {
      const logService = getLogService();
      await logService.logRoleRevocation(
        options.scope.organizationId,
        'OrgOwner',
        options.userId,
        true,
        {
          actorId: options.userId,
          actorType: 'user',
          organizationId: options.scope.organizationId,
        },
        undefined
      );
    }
  }
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  const { requireAll = false, scope } = options;

  // If no roles are required, validation passes
  if (roles.length === 0) {
    return true;
  }

  // Filter user roles by scope if specified
  const scopedRoles = scope
    ? userRoles.filter((userRole) => {
        const roleScope = userRole.scope;

        // Check organization scope
        if (
          scope.organizationId &&
          roleScope.organizationId !== scope.organizationId
        ) {
          return false;
        }

        // Check tournament scope
        if (
          scope.tournamentId &&
          roleScope.tournamentId !== scope.tournamentId
        ) {
          return false;
        }

        // Check team scope
        if (scope.teamId && roleScope.teamId !== scope.teamId) {
          return false;
        }

        return true;
      })
    : userRoles;

  const userRoleNames = scopedRoles.map((ur) => ur.role);

  if (requireAll) {
    // User must have ALL required roles
    return roles.every((role) => userRoleNames.includes(role));
  } else {
    // User must have ANY of the required roles
    return roles.some((role) => userRoleNames.includes(role));
  }
}

/**
 * Checks if user has any of the specified roles in the given context
 */
export async function hasAnyRole(
  context: RBACContext,
  roles: Role | Role[],
  scope?: RoleScope
): Promise<boolean> {
  return await validateUserRoles(context.userRoles, roles, {
    requireAll: false,
    scope,
  });
}

/**
 * Checks if user has all of the specified roles in the given context
 */
export async function hasAllRoles(
  context: RBACContext,
  roles: Role | Role[],
  scope?: RoleScope
): Promise<boolean> {
  return await validateUserRoles(context.userRoles, roles, {
    requireAll: true,
    scope,
  });
}

/**
 * Decorator factory for role-based access control
 * Usage: @RequiresRole('TournamentAdmin') or @RequiresRole(['Referee', 'TournamentAdmin'])
 */
export function RequiresRole(
  roles: Role | Role[],
  options: RoleValidationOptions = {}
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (
      this: any,
      context: RBACContext,
      ...args: any[]
    ) {
      // Validate that context has user roles
      if (!context.userRoles || context.userRoles.length === 0) {
        throw new PluginExecutionError(
          'No user roles found in execution context',
          'RBAC_NO_ROLES',
          { requiredRoles: roles, pluginId: context.pluginId }
        );
      }

      // Validate user has required roles
      if (!(await validateUserRoles(context.userRoles, roles, options))) {
        const roleNames = Array.isArray(roles) ? roles.join(', ') : roles;
        throw new PluginExecutionError(
          `Insufficient permissions. Required role(s): ${roleNames}`,
          'RBAC_INSUFFICIENT_PERMISSIONS',
          {
            requiredRoles: roles,
            userRoles: context.userRoles.map((ur) => ur.role),
            scope: options.scope,
            pluginId: context.pluginId,
            userId: context.userId,
          }
        );
      }

      // Call original method if validation passes
      return originalMethod.apply(this, [context, ...args]);
    };

    return descriptor;
  };
}

/**
 * Alternative function-based approach for role validation
 * Can be used when decorators are not suitable
 */
export async function requireRole(
  context: RBACContext,
  roles: Role | Role[],
  options: RoleValidationOptions = {}
): Promise<void> {
  // Validate that context has user roles
  if (!context.userRoles || context.userRoles.length === 0) {
    throw new PluginExecutionError(
      'No user roles found in execution context',
      'RBAC_NO_ROLES',
      { requiredRoles: roles, pluginId: context.pluginId }
    );
  }

  // Validate user has required roles
  if (!(await validateUserRoles(context.userRoles, roles, options))) {
    const roleNames = Array.isArray(roles) ? roles.join(', ') : roles;
    throw new PluginExecutionError(
      `Insufficient permissions. Required role(s): ${roleNames}`,
      'RBAC_INSUFFICIENT_PERMISSIONS',
      {
        requiredRoles: roles,
        userRoles: context.userRoles.map((ur) => ur.role),
        scope: options.scope,
        pluginId: context.pluginId,
        userId: context.userId,
      }
    );
  }
}

/**
 * Utility function to create RBAC context from plugin execution context
 */
export function createRBACContext(
  pluginContext: PluginExecutionContext,
  userId: string,
  userRoles: UserRole[]
): RBACContext {
  return {
    ...pluginContext,
    userId,
    userRoles,
  };
}

/**
 * Loads user roles from database (placeholder for future implementation)
 * This will be implemented when database integration is added
 */
export async function loadUserRoles(
  userId: string,
  scope?: RoleScope
): Promise<UserRole[]> {
  // TODO: Implement database query to load user roles
  // This is a placeholder that will be implemented in future tasks
  throw new PluginExecutionError(
    'Role loading from database not yet implemented',
    'RBAC_NOT_IMPLEMENTED',
    { userId, scope }
  );
}

/**
 * Validates plugin system permissions for sandboxed execution
 */
export async function validatePluginSystemRole(
  context: RBACContext
): Promise<void> {
  // Plugin system should have PluginSystem role when executing in sandbox
  if (!(await hasAnyRole(context, 'PluginSystem'))) {
    throw new PluginExecutionError(
      'Plugin execution requires PluginSystem role',
      'RBAC_PLUGIN_SYSTEM_REQUIRED',
      { pluginId: context.pluginId }
    );
  }
}
