/**
 * Test to verify GraphQL code generation works correctly
 */

// Import types for compile-time checking
import type {
  Tournament,
  Match,
  Team,
  Player,
  Phase,
  MatchStatus,
  PlayerRole,
} from '../generated';

describe('GraphQL Code Generation Tests', () => {
  test('generated modules can be imported', async () => {
    try {
      // Import the generated module to verify it exists and compiles
      const generated = await import('../generated');

      // Import the GraphQL module to verify hooks and types exist
      const graphqlGenerated = await import('../generated/graphql');

      // Verify that the generated modules export expected items
      expect(generated).toBeDefined();
      expect(graphqlGenerated).toBeDefined();
    } catch (_error) {
      // If this fails, it means codegen needs to be run
      console.warn(
        '⚠️ GraphQL types not yet generated. Run `pnpm codegen` first.'
      );
      throw new Error('GraphQL codegen required. Run: pnpm codegen');
    }
  });

  test('generated types compile correctly', () => {
    // Type-only test - this will fail at compile time if types don't exist
    const typeTest = (): void => {
      // These type assertions will fail at compile time if the types don't exist
      const tournament: Tournament = {} as any;
      const match: Match = {} as any;
      const team: Team = {} as any;
      const player: Player = {} as any;
      const phase: Phase = {} as any;

      // Test enum-like types
      const matchStatus: MatchStatus = 'SCHEDULED';
      const playerRole: PlayerRole = 'PLAYER';

      // Suppress unused variable warnings
      void tournament;
      void match;
      void team;
      void player;
      void phase;
      void matchStatus;
      void playerRole;
    };

    // Call the type test function to ensure it compiles
    expect(() => typeTest()).not.toThrow();
  });
});

// Export for potential use
export async function testGraphQLCodeGeneration(): Promise<boolean> {
  try {
    // Import the generated module to verify it exists and compiles
    const generated = await import('../generated');
    const graphqlGenerated = await import('../generated/graphql');

    if (!generated || !graphqlGenerated) {
      throw new Error('Generated modules not found');
    }

    console.log(
      '✅ GraphQL codegen test passed - types are properly generated'
    );
    return true;
  } catch (error) {
    console.warn(
      '⚠️ GraphQL types not yet generated. Run `pnpm codegen` first.'
    );
    console.error('Error details:', error);
    throw new Error('GraphQL codegen required. Run: pnpm codegen');
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testGraphQLCodeGeneration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
