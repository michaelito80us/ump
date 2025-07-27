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

// Simple compilation test - no test framework needed
async function testGraphQLCodeGeneration() {
  try {
    // Import the generated module to verify it exists and compiles
    const generated = await import('../generated');

    // Import the GraphQL module to verify hooks and types exist
    const graphqlGenerated = await import('../generated/graphql');

    // Verify that the generated modules export expected items
    if (!generated) {
      throw new Error('Generated index module not found');
    }

    if (!graphqlGenerated) {
      throw new Error('Generated GraphQL module not found');
    }

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
    typeTest();

    console.log(
      '✅ GraphQL codegen test passed - types are properly generated'
    );
    return true;
  } catch (error) {
    // If this fails, it means codegen needs to be run
    console.warn(
      '⚠️ GraphQL types not yet generated. Run `pnpm codegen` first.'
    );
    console.error('Error details:', error);
    throw new Error('GraphQL codegen required. Run: pnpm codegen');
  }
}

// Export for potential use
export { testGraphQLCodeGeneration };

// Run the test if this file is executed directly
if (require.main === module) {
  testGraphQLCodeGeneration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
