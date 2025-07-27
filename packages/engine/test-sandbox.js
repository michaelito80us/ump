// Simple test script to verify sandbox implementation
const { SandboxExecutor } = require('./dist/sandbox/index.js');

async function testSandbox() {
  console.log('🧪 Testing VM2 Sandbox Executor...\n');

  const sandbox = new SandboxExecutor();
  const mockContext = {
    pluginId: 'test-plugin',
    version: '1.0.0',
    permissions: ['read:test'],
    eventBus: null,
    shared: null,
  };

  try {
    // Test 1: Basic execution
    console.log('Test 1: Basic execution');
    const result1 = await sandbox.execute('return 2 + 2;', mockContext);
    console.log('✅ Result:', result1.result);
    console.log('⏱️  Execution time:', result1.executionTime + 'ms\n');

    // Test 2: Safe globals
    console.log('Test 2: Safe globals access');
    const result2 = await sandbox.execute(
      `
      return {
        math: Math.PI,
        date: new Date().getFullYear(),
        json: JSON.stringify({test: true})
      };
    `,
      mockContext
    );
    console.log('✅ Result:', result2.result);
    console.log('⏱️  Execution time:', result2.executionTime + 'ms\n');

    // Test 3: Context access
    console.log('Test 3: Context access');
    const result3 = await sandbox.execute(
      `
      console.log('Hello from plugin!');
      return {
        pluginId: __pluginId,
        version: __version
      };
    `,
      mockContext
    );
    console.log('✅ Result:', result3.result);
    console.log('⏱️  Execution time:', result3.executionTime + 'ms\n');

    // Test 4: Security - should fail
    console.log('Test 4: Security test (should fail)');
    try {
      const result4 = await sandbox.execute('return process.env;', mockContext);
      if (!result4.success) {
        console.log('✅ Security test passed - process access blocked');
        console.log('❌ Error:', result4.error?.message);
      }
    } catch (error) {
      console.log('✅ Security test passed - process access blocked');
      console.log('❌ Error:', error.message);
    }

    console.log('\n🎉 All tests completed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

testSandbox();
