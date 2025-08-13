/**
 * RBAC Middleware Tests
 * Tests for role-based access control functionality
 */

import {
  requireRole,
  validateUserRoles,
  hasAnyRole,
  hasAllRoles,
  createRBACContext,
  validatePluginSystemRole,
  type UserRole,
  type RBACContext,
} from '../rbac';
import { PluginExecutionError } from '../errors';
import { PluginExecutionContext } from '../sandbox/types';

describe('RBAC Middleware', () => {
  // Mock plugin execution context
  const mockPluginContext: PluginExecutionContext = {
    pluginId: 'test-plugin',
    version: '1.0.0',
    permissions: ['read', 'write'],
    eventBus: {},
    shared: {},
  };

  // Mock user roles
  const mockUserRoles: UserRole[] = [
    {
      role: 'TournamentAdmin',
      scope: { tournamentId: 'tournament-1' },
      userId: 'user-1',
    },
    {
      role: 'TeamManager',
      scope: { teamId: 'team-1', tournamentId: 'tournament-1' },
      userId: 'user-1',
    },
    {
      role: 'OrgAdmin',
      scope: { organizationId: 'org-1' },
      userId: 'user-1',
    },
  ];

  const mockRBACContext: RBACContext = {
    ...mockPluginContext,
    userId: 'user-1',
    userRoles: mockUserRoles,
  };

  describe('validateUserRoles', () => {
    it('should validate single role successfully', () => {
      const result = validateUserRoles(mockUserRoles, 'TournamentAdmin');
      expect(result).toBe(true);
    });

    it('should validate multiple roles with ANY logic', () => {
      const result = validateUserRoles(mockUserRoles, [
        'TournamentAdmin',
        'Referee',
      ]);
      expect(result).toBe(true);
    });

    it('should validate multiple roles with ALL logic', () => {
      const result = validateUserRoles(
        mockUserRoles,
        ['TournamentAdmin', 'TeamManager'],
        { requireAll: true }
      );
      expect(result).toBe(true);
    });

    it('should fail validation when user lacks required role', () => {
      const result = validateUserRoles(mockUserRoles, 'Referee');
      expect(result).toBe(false);
    });

    it('should fail ALL validation when user lacks one required role', () => {
      const result = validateUserRoles(
        mockUserRoles,
        ['TournamentAdmin', 'Referee'],
        { requireAll: true }
      );
      expect(result).toBe(false);
    });

    it('should validate roles within specific scope', () => {
      const result = validateUserRoles(mockUserRoles, 'TournamentAdmin', {
        scope: { tournamentId: 'tournament-1' },
      });
      expect(result).toBe(true);
    });

    it('should fail validation when role exists but scope does not match', () => {
      const result = validateUserRoles(mockUserRoles, 'TournamentAdmin', {
        scope: { tournamentId: 'tournament-2' },
      });
      expect(result).toBe(false);
    });

    it('should validate organization scope correctly', () => {
      const result = validateUserRoles(mockUserRoles, 'OrgAdmin', {
        scope: { organizationId: 'org-1' },
      });
      expect(result).toBe(true);
    });

    it('should validate team scope correctly', () => {
      const result = validateUserRoles(mockUserRoles, 'TeamManager', {
        scope: { teamId: 'team-1' },
      });
      expect(result).toBe(true);
    });
  });

  describe('hasAnyRole', () => {
    it('should return true when user has any of the specified roles', () => {
      const result = hasAnyRole(mockRBACContext, [
        'Referee',
        'TournamentAdmin',
      ]);
      expect(result).toBe(true);
    });

    it('should return false when user has none of the specified roles', () => {
      const result = hasAnyRole(mockRBACContext, ['Referee', 'Player']);
      expect(result).toBe(false);
    });

    it('should work with scope validation', () => {
      const result = hasAnyRole(mockRBACContext, 'TournamentAdmin', {
        tournamentId: 'tournament-1',
      });
      expect(result).toBe(true);
    });
  });

  describe('hasAllRoles', () => {
    it('should return true when user has all specified roles', () => {
      const result = hasAllRoles(mockRBACContext, [
        'TournamentAdmin',
        'TeamManager',
      ]);
      expect(result).toBe(true);
    });

    it('should return false when user lacks one of the specified roles', () => {
      const result = hasAllRoles(mockRBACContext, [
        'TournamentAdmin',
        'Referee',
      ]);
      expect(result).toBe(false);
    });
  });

  describe('createRBACContext', () => {
    it('should create RBAC context from plugin context', () => {
      const rbacContext = createRBACContext(
        mockPluginContext,
        'user-1',
        mockUserRoles
      );

      expect(rbacContext.pluginId).toBe('test-plugin');
      expect(rbacContext.userId).toBe('user-1');
      expect(rbacContext.userRoles).toEqual(mockUserRoles);
    });
  });

  describe('validatePluginSystemRole', () => {
    it('should pass validation when context has PluginSystem role', () => {
      const pluginSystemContext: RBACContext = {
        ...mockPluginContext,
        userId: 'system',
        userRoles: [
          {
            role: 'PluginSystem',
            scope: {},
            userId: 'system',
          },
        ],
      };

      expect(() => validatePluginSystemRole(pluginSystemContext)).not.toThrow();
    });

    it('should throw error when context lacks PluginSystem role', () => {
      expect(() => validatePluginSystemRole(mockRBACContext)).toThrow(
        PluginExecutionError
      );
    });
  });

  describe('requireRole function', () => {
    it('should allow access when user has required role', () => {
      expect(() =>
        requireRole(mockRBACContext, 'TournamentAdmin')
      ).not.toThrow();
    });

    it('should allow access when user has any of the required roles', () => {
      expect(() =>
        requireRole(mockRBACContext, ['Referee', 'TournamentAdmin'])
      ).not.toThrow();
    });

    it('should allow access when user has required role in correct scope', () => {
      expect(() =>
        requireRole(mockRBACContext, 'TournamentAdmin', {
          scope: { tournamentId: 'tournament-1' },
        })
      ).not.toThrow();
    });

    it('should allow access when user has all required roles', () => {
      expect(() =>
        requireRole(mockRBACContext, ['TournamentAdmin', 'TeamManager'], {
          requireAll: true,
        })
      ).not.toThrow();
    });

    it('should throw error when user lacks required role', () => {
      const contextWithoutAdmin: RBACContext = {
        ...mockPluginContext,
        userId: 'user-2',
        userRoles: [
          {
            role: 'Player',
            scope: { teamId: 'team-1' },
            userId: 'user-2',
          },
        ],
      };

      expect(() => requireRole(contextWithoutAdmin, 'TournamentAdmin')).toThrow(
        PluginExecutionError
      );
    });

    it('should throw error when context has no user roles', () => {
      const contextWithoutRoles: RBACContext = {
        ...mockPluginContext,
        userId: 'user-3',
        userRoles: [],
      };

      expect(() => requireRole(contextWithoutRoles, 'TournamentAdmin')).toThrow(
        PluginExecutionError
      );
    });

    it('should throw error when user has role but wrong scope', () => {
      const contextWithWrongScope: RBACContext = {
        ...mockPluginContext,
        userId: 'user-4',
        userRoles: [
          {
            role: 'TournamentAdmin',
            scope: { tournamentId: 'tournament-2' },
            userId: 'user-4',
          },
        ],
      };

      expect(() =>
        requireRole(contextWithWrongScope, 'TournamentAdmin', {
          scope: { tournamentId: 'tournament-1' },
        })
      ).toThrow(PluginExecutionError);
    });

    it('should throw error when user lacks one of multiple required roles', () => {
      const contextWithPartialRoles: RBACContext = {
        ...mockPluginContext,
        userId: 'user-5',
        userRoles: [
          {
            role: 'TournamentAdmin',
            scope: { tournamentId: 'tournament-1' },
            userId: 'user-5',
          },
        ],
      };

      expect(() =>
        requireRole(
          contextWithPartialRoles,
          ['TournamentAdmin', 'TeamManager'],
          { requireAll: true }
        )
      ).toThrow(PluginExecutionError);
    });

    it('should include proper error context in thrown errors', () => {
      const contextWithoutRoles: RBACContext = {
        ...mockPluginContext,
        userId: 'user-6',
        userRoles: [],
      };

      try {
        requireRole(contextWithoutRoles, 'TournamentAdmin');
        throw new Error('Expected PluginExecutionError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(PluginExecutionError);
        expect((error as PluginExecutionError).code).toBe('RBAC_NO_ROLES');
        expect((error as PluginExecutionError).context.pluginId).toBe(
          'test-plugin'
        );
        expect((error as PluginExecutionError).context.requiredRoles).toBe(
          'TournamentAdmin'
        );
      }
    });

    it('should throw error with proper context for insufficient permissions', () => {
      const contextWithWrongRole: RBACContext = {
        ...mockPluginContext,
        userId: 'user-7',
        userRoles: [
          {
            role: 'Player',
            scope: { teamId: 'team-1' },
            userId: 'user-7',
          },
        ],
      };

      try {
        requireRole(contextWithWrongRole, 'TournamentAdmin');
        throw new Error('Expected PluginExecutionError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(PluginExecutionError);
        expect((error as PluginExecutionError).code).toBe(
          'RBAC_INSUFFICIENT_PERMISSIONS'
        );
        expect((error as PluginExecutionError).context.pluginId).toBe(
          'test-plugin'
        );
        expect((error as PluginExecutionError).context.requiredRoles).toBe(
          'TournamentAdmin'
        );
        expect((error as PluginExecutionError).context.userRoles).toEqual([
          'Player',
        ]);
        expect((error as PluginExecutionError).context.userId).toBe('user-7');
      }
    });
  });

  describe('Role hierarchy and edge cases', () => {
    it('should handle empty user roles array', () => {
      const result = validateUserRoles([], 'TournamentAdmin');
      expect(result).toBe(false);
    });

    it('should handle empty required roles array', () => {
      const result = validateUserRoles(mockUserRoles, []);
      expect(result).toBe(true); // No roles required, so validation passes
    });

    it('should handle complex scope matching', () => {
      const complexUserRoles: UserRole[] = [
        {
          role: 'TournamentAdmin',
          scope: {
            organizationId: 'org-1',
            tournamentId: 'tournament-1',
          },
          userId: 'user-1',
        },
      ];

      // Should match when all scope criteria are met
      const result1 = validateUserRoles(complexUserRoles, 'TournamentAdmin', {
        scope: { organizationId: 'org-1', tournamentId: 'tournament-1' },
      });
      expect(result1).toBe(true);

      // Should not match when one scope criterion fails
      const result2 = validateUserRoles(complexUserRoles, 'TournamentAdmin', {
        scope: { organizationId: 'org-2', tournamentId: 'tournament-1' },
      });
      expect(result2).toBe(false);
    });

    it('should handle partial scope matching', () => {
      const result = validateUserRoles(
        mockUserRoles,
        'TournamentAdmin',
        { scope: { tournamentId: 'tournament-1' } } // Only checking tournament, not org
      );
      expect(result).toBe(true);
    });
  });
});
