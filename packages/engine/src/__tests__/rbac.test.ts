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
  type Role,
} from '../rbac';
import { countOrgOwners } from '../rbac/requireRole';
import { PluginExecutionError } from '../errors';
import { PluginExecutionContext } from '../sandbox/types';

describe('RBAC Middleware', () => {
  describe('OrgOwner Role Revocation', () => {
    const orgScope = { organizationId: 'org-1' };

    const mockUserRoles = [
      { role: 'OrgOwner' as Role, scope: orgScope, userId: 'user-1' },
      { role: 'OrgOwner' as Role, scope: orgScope, userId: 'user-2' },
      { role: 'OrgAdmin' as Role, scope: orgScope, userId: 'user-3' },
    ];

    it('should count OrgOwners correctly', () => {
      expect(countOrgOwners(mockUserRoles, orgScope)).toBe(2);
      expect(countOrgOwners(mockUserRoles, { organizationId: 'org-2' })).toBe(
        0
      );
    });

    it('should allow OrgOwner revocation when multiple OrgOwners exist', async () => {
      await expect(
        validateUserRoles(mockUserRoles, ['OrgOwner'], {
          scope: orgScope,
          isRoleRevocation: true,
        })
      ).resolves.not.toThrow();
    });

    it('should prevent removing the last OrgOwner', async () => {
      const singleOwnerRoles = [
        { role: 'OrgOwner' as Role, scope: orgScope, userId: 'user-1' },
        { role: 'OrgAdmin' as Role, scope: orgScope, userId: 'user-3' },
      ];

      await expect(
        validateUserRoles(singleOwnerRoles, ['OrgOwner'], {
          scope: orgScope,
          isRoleRevocation: true,
        })
      ).rejects.toThrow('Cannot remove the last OrgOwner');
    });

    it('should handle role revocation with correct error details', async () => {
      const singleOwnerRoles = [
        { role: 'OrgOwner' as Role, scope: orgScope, userId: 'user-1' },
      ];

      try {
        await validateUserRoles(singleOwnerRoles, ['OrgOwner'], {
          scope: orgScope,
          isRoleRevocation: true,
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(PluginExecutionError);
        expect((error as PluginExecutionError).code).toBe(
          'RBAC_LAST_ORGOWNER_REMOVAL'
        );
        expect((error as PluginExecutionError).context.scope).toEqual(orgScope);
      }
    });
  });

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
    it('should validate single role successfully', async () => {
      const result = await validateUserRoles(mockUserRoles, 'TournamentAdmin');
      expect(result).toBe(true);
    });

    it('should validate multiple roles with ANY logic', async () => {
      const result = await validateUserRoles(mockUserRoles, [
        'TournamentAdmin',
        'Referee',
      ]);
      expect(result).toBe(true);
    });

    it('should validate multiple roles with ALL logic', async () => {
      const result = await validateUserRoles(
        mockUserRoles,
        ['TournamentAdmin', 'TeamManager'],
        { requireAll: true }
      );
      expect(result).toBe(true);
    });

    it('should fail validation when user lacks required role', async () => {
      const result = await validateUserRoles(mockUserRoles, 'Referee');
      expect(result).toBe(false);
    });

    it('should fail ALL validation when user lacks one required role', async () => {
      const result = await validateUserRoles(
        mockUserRoles,
        ['TournamentAdmin', 'Referee'],
        { requireAll: true }
      );
      expect(result).toBe(false);
    });

    it('should validate roles within specific scope', async () => {
      const result = await validateUserRoles(mockUserRoles, 'TournamentAdmin', {
        scope: { tournamentId: 'tournament-1' },
      });
      expect(result).toBe(true);
    });

    it('should fail validation when role exists but scope does not match', async () => {
      const result = await validateUserRoles(mockUserRoles, 'TournamentAdmin', {
        scope: { tournamentId: 'tournament-2' },
      });
      expect(result).toBe(false);
    });

    it('should validate organization scope correctly', async () => {
      const result = await validateUserRoles(mockUserRoles, 'OrgAdmin', {
        scope: { organizationId: 'org-1' },
      });
      expect(result).toBe(true);
    });

    it('should validate team scope correctly', async () => {
      const result = await validateUserRoles(mockUserRoles, 'TeamManager', {
        scope: { teamId: 'team-1' },
      });
      expect(result).toBe(true);
    });
  });

  describe('hasAnyRole', () => {
    it('should return true when user has any of the specified roles', async () => {
      const result = await hasAnyRole(mockRBACContext, [
        'Referee',
        'TournamentAdmin',
      ]);
      expect(result).toBe(true);
    });

    it('should return false when user has none of the specified roles', async () => {
      const result = await hasAnyRole(mockRBACContext, ['Referee', 'Player']);
      expect(result).toBe(false);
    });

    it('should work with scope validation', async () => {
      const result = await hasAnyRole(mockRBACContext, 'TournamentAdmin', {
        tournamentId: 'tournament-1',
      });
      expect(result).toBe(true);
    });
  });

  describe('hasAllRoles', () => {
    it('should return true when user has all specified roles', async () => {
      const result = await hasAllRoles(mockRBACContext, [
        'TournamentAdmin',
        'TeamManager',
      ]);
      expect(result).toBe(true);
    });

    it('should return false when user lacks one of the specified roles', async () => {
      const result = await hasAllRoles(mockRBACContext, [
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
    it('should pass validation when context has PluginSystem role', async () => {
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

      await expect(
        validatePluginSystemRole(pluginSystemContext)
      ).resolves.not.toThrow();
    });

    it('should throw error when context lacks PluginSystem role', async () => {
      await expect(validatePluginSystemRole(mockRBACContext)).rejects.toThrow(
        PluginExecutionError
      );
    });
  });

  describe('requireRole function', () => {
    it('should allow access when user has required role', async () => {
      await expect(
        requireRole(mockRBACContext, 'TournamentAdmin')
      ).resolves.not.toThrow();
    });

    it('should allow access when user has any of the required roles', async () => {
      await expect(
        requireRole(mockRBACContext, ['Referee', 'TournamentAdmin'])
      ).resolves.not.toThrow();
    });

    it('should allow access when user has required role in correct scope', async () => {
      await expect(
        requireRole(mockRBACContext, 'TournamentAdmin', {
          scope: { tournamentId: 'tournament-1' },
        })
      ).resolves.not.toThrow();
    });

    it('should allow access when user has all required roles', async () => {
      await expect(
        requireRole(mockRBACContext, ['TournamentAdmin', 'TeamManager'], {
          requireAll: true,
        })
      ).resolves.not.toThrow();
    });

    it('should throw error when user lacks required role', async () => {
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

      await expect(
        requireRole(contextWithoutAdmin, 'TournamentAdmin')
      ).rejects.toThrow(PluginExecutionError);
    });

    it('should throw error when context has no user roles', async () => {
      const contextWithoutRoles: RBACContext = {
        ...mockPluginContext,
        userId: 'user-3',
        userRoles: [],
      };

      await expect(
        requireRole(contextWithoutRoles, 'TournamentAdmin')
      ).rejects.toThrow(PluginExecutionError);
    });

    it('should throw error when user has role but wrong scope', async () => {
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

      await expect(
        requireRole(contextWithWrongScope, 'TournamentAdmin', {
          scope: { tournamentId: 'tournament-1' },
        })
      ).rejects.toThrow(PluginExecutionError);
    });

    it('should throw error when user lacks one of multiple required roles', async () => {
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

      await expect(
        requireRole(
          contextWithPartialRoles,
          ['TournamentAdmin', 'TeamManager'],
          { requireAll: true }
        )
      ).rejects.toThrow(PluginExecutionError);
    });

    it('should include proper error context in thrown errors', async () => {
      const contextWithoutRoles: RBACContext = {
        ...mockPluginContext,
        userId: 'user-6',
        userRoles: [],
      };

      try {
        await requireRole(contextWithoutRoles, 'TournamentAdmin');
        expect(true).toBe(false); // Should not reach here
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

    it('should throw error with proper context for insufficient permissions', async () => {
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
        await requireRole(contextWithWrongRole, 'TournamentAdmin');
        expect(true).toBe(false); // Should not reach here
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
    it('should handle empty user roles array', async () => {
      const result = await validateUserRoles([], 'TournamentAdmin');
      expect(result).toBe(false);
    });

    it('should handle empty required roles array', async () => {
      const result = await validateUserRoles(mockUserRoles, []);
      expect(result).toBe(true); // No roles required, so validation passes
    });

    it('should handle complex scope matching', async () => {
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
      const result1 = await validateUserRoles(
        complexUserRoles,
        'TournamentAdmin',
        {
          scope: { organizationId: 'org-1', tournamentId: 'tournament-1' },
        }
      );
      expect(result1).toBe(true);

      // Should not match when one scope criterion fails
      const result2 = await validateUserRoles(
        complexUserRoles,
        'TournamentAdmin',
        {
          scope: { organizationId: 'org-2', tournamentId: 'tournament-1' },
        }
      );
      expect(result2).toBe(false);
    });

    it('should handle partial scope matching', async () => {
      const result = await validateUserRoles(
        mockUserRoles,
        'TournamentAdmin',
        { scope: { tournamentId: 'tournament-1' } } // Only checking tournament, not org
      );
      expect(result).toBe(true);
    });
  });
});
