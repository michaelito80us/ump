/**
 * Test to verify GraphQL code generation works correctly
 */

// Simple compilation test - no test framework needed
async function testGraphQLCodeGeneration() {
  try {
    // This test will fail if codegen hasn't run or if there are type errors
    const { Tournament, Match, Team } = await import('../generated');

    // Basic type checking - these should exist and be properly typed
    if (typeof Tournament === 'undefined') {
      throw new Error('Tournament type not found');
    }
    if (typeof Match === 'undefined') {
      throw new Error('Match type not found');
    }
    if (typeof Team === 'undefined') {
      throw new Error('Team type not found');
    }

    // Import generated hooks - this will fail if codegen hasn't run
    const generated = await import('../generated/graphql');

    // Verify that the generated module exports expected items
    if (!generated) {
      throw new Error('Generated GraphQL module not found');
    }

    console.log(
      '✅ GraphQL codegen test passed - types are properly generated'
    );
    return true;
  } catch (_error) {
    // If this fails, it means codegen needs to be run
    console.warn(
      '⚠️ GraphQL types not yet generated. Run `pnpm codegen` first.'
    );
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
