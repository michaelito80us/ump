import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Mobile App Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the mobile app home page
    await page.goto('/en');
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
    // Wait for any client-side hydration to complete
    await page.waitForTimeout(2000);
    // Ensure the page is stable before running accessibility tests
    await page.waitForFunction(() => document.readyState === 'complete');
  });

  test('should not have any automatically detectable accessibility issues on home page', async ({
    page,
  }) => {
    // Ensure page is stable before analysis
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should not have color contrast violations', async ({ page }) => {
    // Ensure page is stable before analysis
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .analyze();

    // Filter for color contrast violations specifically
    const contrastViolations = accessibilityScanResults.violations.filter(
      (violation) => violation.id === 'color-contrast'
    );

    expect(contrastViolations).toEqual([]);
  });

  test('should have proper touch target sizes for mobile', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['target-size'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper keyboard navigation support', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a'])
      .include('button, a, input, select, textarea, [tabindex]')
      .analyze();

    // Check for keyboard navigation violations
    const keyboardViolations = accessibilityScanResults.violations.filter(
      (violation) =>
        ['focus-order-semantics', 'tabindex', 'focusable-content'].includes(
          violation.id
        )
    );

    expect(keyboardViolations).toEqual([]);
  });

  test('should have proper ARIA labels and roles', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    // Filter for ARIA-related violations
    const ariaViolations = accessibilityScanResults.violations.filter(
      (violation) =>
        violation.id.includes('aria') || violation.id.includes('label')
    );

    expect(ariaViolations).toEqual([]);
  });

  test('should have proper heading structure', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['heading-order'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper form labels', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['label', 'label-title-only'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper image alt text', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['image-alt'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should be responsive and accessible on mobile viewports', async ({
    page,
  }) => {
    // Test on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should pass comprehensive WCAG 2.1 AA compliance', async ({ page }) => {
    // Ensure page is stable before analysis
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    // Log violations for debugging if any exist
    if (accessibilityScanResults.violations.length > 0) {
      console.log('Accessibility violations found:');
      accessibilityScanResults.violations.forEach((violation, index) => {
        console.log(`${index + 1}. ${violation.id}: ${violation.description}`);
        console.log(`   Impact: ${violation.impact}`);
        console.log(`   Help: ${violation.help}`);
        console.log(`   Nodes: ${violation.nodes.length}`);
      });
    }

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  // Test for intentional contrast violation to ensure CI failure detection
  test('should detect contrast violations when present', async ({ page }) => {
    // Inject a div with poor contrast for testing
    await page.addStyleTag({
      content: `
        .test-contrast-violation {
          color: #ccc;
          background-color: #ddd;
          padding: 10px;
          font-size: 16px;
        }
      `,
    });

    await page.evaluate(() => {
      const div = document.createElement('div');
      div.className = 'test-contrast-violation';
      div.textContent = 'This text has poor contrast';
      div.setAttribute('data-testid', 'contrast-test');
      document.body.appendChild(div);
    });

    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[data-testid="contrast-test"]')
      .withRules(['color-contrast'])
      .analyze();

    // This test should find violations - if it doesn't, our detection isn't working
    expect(accessibilityScanResults.violations.length).toBeGreaterThan(0);

    // Clean up the test element
    await page.evaluate(() => {
      const testElement = document.querySelector(
        '[data-testid="contrast-test"]'
      );
      if (testElement) {
        testElement.remove();
      }
    });
  });
});
