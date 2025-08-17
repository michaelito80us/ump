#!/usr/bin/env node
/**
 * Test script to demonstrate secret scanning functionality
 * This script creates a temporary file with a dummy secret and runs gitleaks to verify detection
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TEMP_FILE = path.join(__dirname, '..', 'temp-secret-demo.js');

function createDummySecretFile() {
  const secretContent = `
// DEMO: This file contains dummy secrets for testing gitleaks
// This file will be automatically deleted after the test

const demoSecrets = {
  // This should trigger AWS access key detection
  awsAccessKey: 'AKIAIOSFODNN7EXAMPLE',
  
  // This should trigger AWS secret key detection  
  awsSecretKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
  
  // This should trigger Clerk secret key detection
  clerkSecretKey: 'sk_test_1234567890abcdefghijklmnopqrstuvwxyz123456',
  
  // This should trigger database URL detection
  databaseUrl: 'postgres://user:password123@localhost:5432/testdb'
};

module.exports = demoSecrets;
`;

  fs.writeFileSync(TEMP_FILE, secretContent);
  console.log('✅ Created temporary file with dummy secrets:', TEMP_FILE);
}

function runGitleaksTest() {
  console.log('🔍 Running gitleaks scan...');

  try {
    execSync(
      `npx gitleaks detect --config .gitleaks.toml --source "${TEMP_FILE}" --verbose`,
      {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..'),
      }
    );

    console.log('❌ UNEXPECTED: Gitleaks did not detect any secrets!');
    console.log(
      'This suggests the configuration may not be working correctly.'
    );
    process.exit(1);
  } catch (_error) {
    console.log('✅ SUCCESS: Gitleaks detected secrets as expected!');
    console.log('The secret scanning is working correctly.');
    return true;
  }
}

function cleanup() {
  if (fs.existsSync(TEMP_FILE)) {
    fs.unlinkSync(TEMP_FILE);
    console.log('🧹 Cleaned up temporary file');
  }
}

function main() {
  console.log('🚀 Testing Secret Scanning Functionality');
  console.log('========================================');

  try {
    // Check if gitleaks config exists
    const configPath = path.join(__dirname, '..', '.gitleaks.toml');
    if (!fs.existsSync(configPath)) {
      console.error('❌ Gitleaks configuration file not found:', configPath);
      process.exit(1);
    }
    console.log('✅ Found gitleaks configuration file');

    // Create dummy secret file
    createDummySecretFile();

    // Run gitleaks test
    runGitleaksTest();

    console.log('\n🎉 Secret scanning test completed successfully!');
    console.log('The CI workflow will now block commits containing secrets.');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  } finally {
    cleanup();
  }
}

if (require.main === module) {
  main();
}

module.exports = { createDummySecretFile, runGitleaksTest, cleanup };
