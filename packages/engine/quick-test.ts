// Quick test for sandbox implementation
import { SandboxExecutor } from './src/sandbox';

async function quickTest() {
  console.log('🧪 Testing Sandbox Executor...\n');

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
    console.log('✅ Success:', result1.success);
    console.log('📊 Result:', result1.result);
    console.log('⏱️  Time:', result1.executionTime + 'ms\n');

    // Test 2: Context access
    console.log('Test 2: Context access');
    const result2 = await sandbox.execute(
      `
      return {
        pluginId: __pluginId,
        version: __version,
        hasMath: typeof Math !== 'undefined'
      };
    `,
      mockContext
    );
    console.log('✅ Success:', result2.success);
    console.log('📊 Result:', result2.result);
    console.log('⏱️  Time:', result2.executionTime + 'ms\n');

    // Test 3: SharedStore debug
    console.log('Test 3: SharedStore debug');
    const result3 = await sandbox.execute(
      `
      try {
        console.log('Testing shared object existence:', typeof shared);
        console.log('Testing shared.set existence:', typeof shared.set);
        
        shared.set('test-key', 'test-value');
        console.log('Set operation completed');
        
        const retrieved = shared.get('test-key');
        console.log('Get operation completed, value:', retrieved);
        
        const exists = shared.has('test-key');
        console.log('Has operation completed, exists:', exists);
        
        return { retrieved, exists, success: true };
      } catch (error) {
        console.error('SharedStore error:', error.message);
        return { error: error.message, success: false };
      }
    `,
      mockContext
    );

    console.log('✅ Success:', result3.success);
    console.log('📊 Result:', result3.result);
    console.log('❌ Error:', result3.error);
    console.log('⏱️  Time:', result3.executionTime + 'ms\n');

    // Test 4: External SharedStore access
    console.log('Test 4: External SharedStore access');
    const sharedStore = sandbox.getSharedStore();
    console.log('External get:', sharedStore.get('test-plugin:test-key'));
    console.log('External has:', sharedStore.has('test-plugin:test-key'));

    console.log('\n🎉 Quick test completed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

quickTest();
