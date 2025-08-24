/**
 * Test for secret scanning functionality
 * This test verifies that gitleaks can detect secrets in the codebase
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('Secret Scanning', () => {
  const tempDir = path.join(os.tmpdir(), 'gitleaks-test-' + Date.now());
  const testFile = path.join(tempDir, 'test-secrets.js');
  let gitleaksAvailable = false;

  beforeAll(() => {
    // Check if gitleaks binary is available
    try {
      execSync('gitleaks version', { stdio: 'pipe' });
      gitleaksAvailable = true;
    } catch (_error) {
      console.warn(
        'Gitleaks binary not available - skipping secret scanning tests'
      );
      return;
    }

    // Create a temporary directory for testing
    fs.mkdirSync(tempDir, { recursive: true });

    // Initialize a git repo in temp directory
    execSync('git init', { cwd: tempDir });
    execSync('git config user.email "test@example.com"', { cwd: tempDir });
    execSync('git config user.name "Test User"', { cwd: tempDir });

    // Copy gitleaks config to temp directory
    const configSource = path.join(__dirname, '..', '.gitleaks.toml');
    const configDest = path.join(tempDir, '.gitleaks.toml');
    fs.copyFileSync(configSource, configDest);
  });

  afterAll(() => {
    // Clean up temp directory
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('should detect AWS access key in committed file', () => {
    if (!gitleaksAvailable) {
      console.log(
        'Skipping gitleaks test - binary not available. Install from https://github.com/gitleaks/gitleaks/releases'
      );
      return;
    }

    // Create a file with a dummy AWS access key
    const secretContent = `
// This is a test file with secrets
const config = {
  awsAccessKey: 'AKIAIOSFODNN7EXAMPLE',
  awsSecretKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
};
`;

    fs.writeFileSync(testFile, secretContent);

    // Add and commit the file
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Add test file with secrets"', { cwd: tempDir });

    // Run gitleaks and expect it to find secrets
    expect(() => {
      execSync('gitleaks detect --config .gitleaks.toml', {
        cwd: tempDir,
        stdio: 'pipe',
      });
    }).toThrow();
  });

  test('should not detect secrets in allowlisted files', () => {
    if (!gitleaksAvailable) {
      console.log(
        'Skipping gitleaks test - binary not available. Install from https://github.com/gitleaks/gitleaks/releases'
      );
      return;
    }

    // Create a test file (which should be allowlisted)
    const testFileAllowlisted = path.join(tempDir, 'secrets.test.js');
    const secretContent = `
// This is a test file with secrets that should be ignored
const testConfig = {
  awsAccessKey: 'AKIAIOSFODNN7EXAMPLE',
  awsSecretKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
};
`;

    fs.writeFileSync(testFileAllowlisted, secretContent);

    // Add and commit the file
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Add allowlisted test file with secrets"', {
      cwd: tempDir,
    });

    // Run gitleaks and expect it to pass (no secrets found in allowlisted files)
    expect(() => {
      execSync('gitleaks detect --config .gitleaks.toml', {
        cwd: tempDir,
        stdio: 'pipe',
      });
    }).not.toThrow();
  });

  test('should detect Clerk secret keys', () => {
    if (!gitleaksAvailable) {
      console.log(
        'Skipping gitleaks test - binary not available. Install from https://github.com/gitleaks/gitleaks/releases'
      );
      return;
    }

    // Create a file with Clerk secret key
    const clerkSecretFile = path.join(tempDir, 'clerk-config.js');
    const clerkContent = `
const clerkConfig = {
  secretKey: 'sk_test_abcdefghijklmnopqrstuvwxyz1234567890123456',
  publishableKey: 'pk_test_abcdefghijklmnopqrstuvwxyz1234567890123456'
};
`;

    fs.writeFileSync(clerkSecretFile, clerkContent);

    // Add and commit the file
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Add Clerk config with secrets"', { cwd: tempDir });

    // Run gitleaks and expect it to find Clerk secrets
    expect(() => {
      execSync('gitleaks detect --config .gitleaks.toml', {
        cwd: tempDir,
        stdio: 'pipe',
      });
    }).toThrow();
  });

  test('should detect database URLs with credentials', () => {
    if (!gitleaksAvailable) {
      console.log(
        'Skipping gitleaks test - binary not available. Install from https://github.com/gitleaks/gitleaks/releases'
      );
      return;
    }

    // Create a file with database URL containing credentials
    const dbConfigFile = path.join(tempDir, 'database-config.js');
    const dbContent = `
const dbConfig = {
  url: 'postgres://username:password123@localhost:5432/mydb'
};
`;

    fs.writeFileSync(dbConfigFile, dbContent);

    // Add and commit the file
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Add database config with credentials"', {
      cwd: tempDir,
    });

    // Run gitleaks and expect it to find database credentials
    expect(() => {
      execSync('gitleaks detect --config .gitleaks.toml', {
        cwd: tempDir,
        stdio: 'pipe',
      });
    }).toThrow();
  });

  test('should pass when no secrets are present', () => {
    if (!gitleaksAvailable) {
      console.log(
        'Skipping gitleaks test - binary not available. Install from https://github.com/gitleaks/gitleaks/releases'
      );
      return;
    }

    // Create a clean file with no secrets
    const cleanFile = path.join(tempDir, 'clean-config.js');
    const cleanContent = `
const config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
  retries: 3
};
`;

    fs.writeFileSync(cleanFile, cleanContent);

    // Add and commit the file
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Add clean config file"', { cwd: tempDir });

    // Run gitleaks and expect it to pass
    expect(() => {
      execSync('gitleaks detect --config .gitleaks.toml', {
        cwd: tempDir,
        stdio: 'pipe',
      });
    }).not.toThrow();
  });
});
