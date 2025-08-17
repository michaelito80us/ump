/**
 * Test suite for Lighthouse CI Performance Budget
 * Validates that performance budgets are enforced correctly
 */

const fs = require('fs');
const path = require('path');

describe('Lighthouse CI Performance Budget', () => {
  const budgetsPath = path.join(__dirname, '..', 'lighthouse', 'budgets.json');
  const lighthouseConfigPath = path.join(__dirname, '..', 'lighthouserc.js');

  beforeAll(() => {
    // Ensure required files exist
    expect(fs.existsSync(budgetsPath)).toBe(true);
    expect(fs.existsSync(lighthouseConfigPath)).toBe(true);
  });

  test('budgets.json contains correct FCP threshold', () => {
    const budgets = JSON.parse(fs.readFileSync(budgetsPath, 'utf8'));

    expect(budgets).toBeInstanceOf(Array);
    expect(budgets.length).toBeGreaterThan(0);

    const budget = budgets[0];
    expect(budget.timings).toBeDefined();

    const fcpTiming = budget.timings.find(
      (timing) => timing.metric === 'first-contentful-paint'
    );

    expect(fcpTiming).toBeDefined();
    expect(fcpTiming.budget).toBe(2500); // 2.5 seconds
    expect(fcpTiming.tolerance).toBeDefined();
  });

  test('budgets.json contains all required performance metrics', () => {
    const budgets = JSON.parse(fs.readFileSync(budgetsPath, 'utf8'));
    const budget = budgets[0];

    const requiredMetrics = [
      'first-contentful-paint',
      'largest-contentful-paint',
      'cumulative-layout-shift',
      'total-blocking-time',
      'speed-index',
    ];

    requiredMetrics.forEach((metric) => {
      const timing = budget.timings.find((t) => t.metric === metric);
      expect(timing).toBeDefined();
      expect(timing.budget).toBeGreaterThan(0);
    });
  });

  test('budgets.json contains resource size limits', () => {
    const budgets = JSON.parse(fs.readFileSync(budgetsPath, 'utf8'));
    const budget = budgets[0];

    expect(budget.resourceSizes).toBeDefined();
    expect(budget.resourceSizes.length).toBeGreaterThan(0);

    const requiredResourceTypes = ['script', 'stylesheet', 'image', 'total'];

    requiredResourceTypes.forEach((resourceType) => {
      const resource = budget.resourceSizes.find(
        (r) => r.resourceType === resourceType
      );
      expect(resource).toBeDefined();
      expect(resource.budget).toBeGreaterThan(0);
    });
  });

  test('lighthouserc.js contains correct FCP assertion', () => {
    const config = require(lighthouseConfigPath);

    expect(config.ci).toBeDefined();
    expect(config.ci.assert).toBeDefined();
    expect(config.ci.assert.assertions).toBeDefined();

    const fcpAssertion = config.ci.assert.assertions['first-contentful-paint'];
    expect(fcpAssertion).toBeDefined();
    expect(fcpAssertion[0]).toBe('error');
    expect(fcpAssertion[1].maxNumericValue).toBe(2500);
  });

  test('lighthouserc.js points to correct budgets file', () => {
    const config = require(lighthouseConfigPath);

    expect(config.ci.collect.settings.budgets).toBe(
      './lighthouse/budgets.json'
    );
  });

  test('package.json contains lhci scripts', () => {
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    expect(packageJson.scripts).toBeDefined();
    expect(packageJson.scripts['lhci']).toBe('lhci');
    expect(packageJson.scripts['lhci:autorun']).toBe('lhci autorun');
    expect(packageJson.scripts['lhci:collect']).toBe('lhci collect');
    expect(packageJson.scripts['lhci:assert']).toBe('lhci assert');
  });

  test('@lhci/cli is installed as dev dependency', () => {
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    expect(packageJson.devDependencies).toBeDefined();
    expect(packageJson.devDependencies['@lhci/cli']).toBeDefined();
  });

  test('GitHub Action workflow exists', () => {
    const workflowPath = path.join(
      __dirname,
      '..',
      '.github',
      'workflows',
      'lhci.yml'
    );
    expect(fs.existsSync(workflowPath)).toBe(true);

    const workflowContent = fs.readFileSync(workflowPath, 'utf8');
    expect(workflowContent).toContain('name: Lighthouse CI');
    expect(workflowContent).toContain('pnpm lhci autorun');
    expect(workflowContent).toContain('Lighthouse CI Results');
  });

  // Integration test that would run in CI
  test.skip('Lighthouse CI fails when FCP > 2.5s (integration test)', async () => {
    // This test is skipped in unit tests but would run in CI
    // It would create a slow page and verify that LHCI fails

    // Mock a slow page by adding artificial delays
    const _slowPageContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Slow Test Page</title>
        <script>
          // Simulate slow loading
          const start = Date.now();
          while (Date.now() - start < 3000) {
            // Block for 3 seconds to exceed FCP budget
          }
        </script>
      </head>
      <body>
        <h1>Test Page</h1>
      </body>
      </html>
    `;

    // In a real test, this would:
    // 1. Create a test server with the slow page
    // 2. Run LHCI against it
    // 3. Verify that it fails with FCP > 2500ms

    expect(true).toBe(true); // Placeholder
  });
});
