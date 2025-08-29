import ivm from 'isolated-vm';

async function minimalTest() {
  console.log('🧪 Testing minimal isolated-vm...\n');

  try {
    // Create isolate
    const isolate = new ivm.Isolate({ memoryLimit: 128 });
    console.log('✅ Isolate created');

    // Create context
    const context = await isolate.createContext();
    console.log('✅ Context created');

    // Get global reference
    const jail = context.global;
    console.log('✅ Global reference obtained');

    // Set a simple value
    await jail.set('testValue', 42);
    console.log('✅ Simple value set');

    // Compile and run simple script
    const script = await isolate.compileScript('return testValue * 2;');
    console.log('✅ Script compiled');

    const result = await script.run(context, { timeout: 1000 });
    console.log('✅ Script executed, result:', result);

    // Clean up
    isolate.dispose();
    console.log('✅ Isolate disposed');

    console.log('\n🎉 Minimal test passed!');
  } catch (error) {
    console.error('❌ Minimal test failed:', error);
    console.error('Stack:', error.stack);
  }
}

minimalTest();
