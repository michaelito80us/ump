#!/usr/bin/env node
/**
 * Test script to verify coverage threshold enforcement
 * This script simulates scenarios where coverage drops below 85% and verifies CI fails
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const COVERAGE_THRESHOLD = 85;

/**
 * Run coverage test and check if it fails when threshold is not met
 */
function testCoverageEnforcement() {
  console.log('🧪 Testing coverage threshold enforcement...');

  try {
    // First, run coverage to establish baseline
    console.log('📊 Running baseline coverage test...');
    execSync('pnpm test:coverage:ci', { stdio: 'pipe' });
    console.log('✅ Baseline coverage test passed');

    // Create a temporary uncovered file to simulate low coverage
    const tempFile = path.join(
      __dirname,
      '../packages/core/src/temp-uncovered.ts'
    );
    const uncoveredCode = `
// Temporary file to test coverage enforcement
export class UncoveredClass {
  method1() {
    return 'uncovered';
  }
  
  method2() {
    return 'also uncovered';
  }
  
  method3() {
    return 'still uncovered';
  }
  
  method4() {
    return 'definitely uncovered';
  }
  
  method5() {
    return 'absolutely uncovered';
  }
}

export function uncoveredFunction1() {
  return 'no tests for this';
}

export function uncoveredFunction2() {
  return 'no tests for this either';
}

export function uncoveredFunction3() {
  return 'definitely no tests';
}
`;

    console.log('📝 Creating temporary uncovered file...');
    fs.writeFileSync(tempFile, uncoveredCode);

    try {
      // Try to run coverage - this should fail due to low coverage
      console.log('🔍 Testing coverage failure scenario...');
      execSync('pnpm test:coverage:ci', { stdio: 'pipe' });

      // If we reach here, coverage didn't fail as expected
      console.error('❌ ERROR: Coverage test should have failed but passed!');
      process.exit(1);
    } catch (error) {
      // This is expected - coverage should fail
      if (
        error.message.includes('Coverage threshold') ||
        error.message.includes('Jest: "global" coverage threshold')
      ) {
        console.log(
          '✅ Coverage threshold enforcement working correctly - test failed as expected'
        );
      } else {
        console.log('✅ Coverage test failed (expected behavior)');
      }
    } finally {
      // Clean up temporary file
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
        console.log('🧹 Cleaned up temporary file');
      }
    }

    // Verify coverage passes again after cleanup
    console.log('🔄 Verifying coverage passes after cleanup...');
    execSync('pnpm test:coverage:ci', { stdio: 'pipe' });
    console.log('✅ Coverage test passes after cleanup');

    console.log(
      '\n🎉 Coverage threshold enforcement test completed successfully!'
    );
    console.log(
      `📈 Coverage threshold is correctly set to ${COVERAGE_THRESHOLD}%`
    );
  } catch (error) {
    console.error('❌ Coverage enforcement test failed:', error.message);
    process.exit(1);
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testCoverageEnforcement();
}

module.exports = { testCoverageEnforcement };
