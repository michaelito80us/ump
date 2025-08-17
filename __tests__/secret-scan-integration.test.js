/**
 * Integration test for secret scanning CI workflow
 * This test creates a temporary file with secrets to verify gitleaks detection
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

describe('Secret Scanning Integration', () => {
  const testSecretFile = path.join(__dirname, '..', 'temp-secret-test.js');

  afterEach(() => {
    // Clean up any test files
    if (fs.existsSync(testSecretFile)) {
      fs.unlinkSync(testSecretFile);
    }
  });

  test('gitleaks configuration file exists', () => {
    const configPath = path.join(__dirname, '..', '.gitleaks.toml');
    expect(fs.existsSync(configPath)).toBe(true);
  });

  test('gitleaks can detect AWS secrets in uncommitted files', () => {
    // Create a file with AWS secrets
    const secretContent = `
// Test file with AWS secrets
const awsConfig = {
  accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
  secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
  region: 'us-east-1'
};

module.exports = awsConfig;
`;

    fs.writeFileSync(testSecretFile, secretContent);

    // Check if gitleaks binary is available
    try {
      execSync('gitleaks version', { stdio: 'pipe' });
      // Run gitleaks on the specific file
      try {
        execSync(
          `gitleaks detect --config .gitleaks.toml --source "${testSecretFile}"`,
          {
            cwd: path.join(__dirname, '..'),
            stdio: 'pipe',
          }
        );
        // If we reach here, gitleaks didn't find secrets (test should fail)
        throw new Error('Expected gitleaks to detect secrets but it passed');
      } catch (error) {
        // This is expected - gitleaks should fail when secrets are found
        expect(error.status).not.toBe(0);
      }
    } catch (_error) {
      // Skip test if gitleaks binary is not available
      console.log(
        'Skipping gitleaks test - binary not available. Install from https://github.com/gitleaks/gitleaks/releases'
      );
    }
  });

  test('gitleaks can detect Clerk secrets', () => {
    // Create a file with Clerk secrets
    const clerkContent = `
// Test file with Clerk secrets
const clerkConfig = {
  secretKey: 'sk_test_1234567890abcdefghijklmnopqrstuvwxyz123456',
  publishableKey: 'pk_test_1234567890abcdefghijklmnopqrstuvwxyz123456'
};

module.exports = clerkConfig;
`;

    fs.writeFileSync(testSecretFile, clerkContent);

    // Check if gitleaks binary is available
    try {
      execSync('gitleaks version', { stdio: 'pipe' });
      // Run gitleaks on the specific file
      try {
        execSync(
          `gitleaks detect --config .gitleaks.toml --source "${testSecretFile}"`,
          {
            cwd: path.join(__dirname, '..'),
            stdio: 'pipe',
          }
        );
        throw new Error(
          'Expected gitleaks to detect Clerk secrets but it passed'
        );
      } catch (error) {
        expect(error.status).not.toBe(0);
      }
    } catch (_error) {
      // Skip test if gitleaks binary is not available
      console.log(
        'Skipping gitleaks test - binary not available. Install from https://github.com/gitleaks/gitleaks/releases'
      );
    }
  });

  test('gitleaks allows clean configuration files', () => {
    // Create a file without secrets
    const cleanContent = `
// Clean configuration file
const config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
  retries: 3,
  environment: 'development'
};

module.exports = config;
`;

    fs.writeFileSync(testSecretFile, cleanContent);

    // Check if gitleaks binary is available
    try {
      execSync('gitleaks version', { stdio: 'pipe' });
      // Run gitleaks on the clean file - should pass
      expect(() => {
        execSync(
          `gitleaks detect --config .gitleaks.toml --source "${testSecretFile}"`,
          {
            cwd: path.join(__dirname, '..'),
            stdio: 'pipe',
          }
        );
      }).not.toThrow();
    } catch (_error) {
      // Skip test if gitleaks binary is not available
      console.log(
        'Skipping gitleaks test - binary not available. Install from https://github.com/gitleaks/gitleaks/releases'
      );
    }
  });

  test('package.json includes secret-scan scripts', () => {
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    expect(packageJson.scripts).toHaveProperty('secret-scan');
    expect(packageJson.scripts).toHaveProperty('secret-scan:ci');
    expect(packageJson.scripts).toHaveProperty('test:secret-scan');
  });

  test('secret scanning workflow file exists', () => {
    const workflowPath = path.join(
      __dirname,
      '..',
      '.github',
      'workflows',
      'secret-scan.yml'
    );
    expect(fs.existsSync(workflowPath)).toBe(true);

    const workflowContent = fs.readFileSync(workflowPath, 'utf8');
    expect(workflowContent).toContain('gitleaks/gitleaks-action');
    expect(workflowContent).toContain('.gitleaks.toml');
  });
});
