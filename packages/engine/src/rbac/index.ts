/**
 * RBAC Module - Role-based access control for plugin execution
 */

export {
  RequiresRole,
  requireRole,
  validateUserRoles,
  hasAnyRole,
  hasAllRoles,
  createRBACContext,
  loadUserRoles,
  validatePluginSystemRole,
  type Role,
  type RoleScope,
  type UserRole,
  type RBACContext,
  type RoleValidationOptions,
} from './requireRole';
