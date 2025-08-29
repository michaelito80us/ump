import { PluginConformanceHarness } from '../harness';
import type { SportPlugin } from '../registry';
import { validateGDPRCompliance } from '../privacy/anonymize';

/**
 * Extended harness for testing GDPR consent compliance in plugins
 */
class GDPRConsentHarness extends PluginConformanceHarness {
  /**
   * Test GDPR consent compliance for plugins
   */
  async testGDPRConsent(
    plugin: any,
    type: string
  ): Promise<{
    passed: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Test that plugin has consent handling for data collection
      await this.testConsentCheckboxIntegration(plugin, type, errors, warnings);

      // Test that plugin properly anonymizes personal data
      await this.testDataAnonymization(plugin, type, errors, warnings);

      // Test that plugin respects consent state
      await this.testConsentRespect(plugin, type, errors, warnings);
    } catch (error) {
      errors.push(
        `GDPR consent test failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Test that plugin integrates consent checkbox for personal data collection
   */
  private async testConsentCheckboxIntegration(
    plugin: any,
    type: string,
    errors: string[],
    warnings: string[]
  ): Promise<void> {
    // Check if plugin has UI components that might collect personal data
    const hasUIComponents = this.pluginHasUIComponents(plugin, type);

    if (hasUIComponents) {
      // Test that plugin includes consent checkbox in forms
      const hasConsentIntegration = await this.checkConsentIntegration(
        plugin,
        type
      );

      if (!hasConsentIntegration) {
        errors.push(
          `Plugin type '${type}' has UI components but does not integrate consent checkbox for personal data collection. ` +
            'Plugins that collect personal data must use ConsentCheckbox component from @ump/ui.'
        );
      }
    } else {
      warnings.push(
        `Plugin type '${type}' has no UI components, skipping consent checkbox integration test.`
      );
    }
  }

  /**
   * Test that plugin properly anonymizes personal data
   */
  private async testDataAnonymization(
    plugin: any,
    type: string,
    errors: string[],
    warnings: string[]
  ): Promise<void> {
    // Test plugin methods that might handle personal data
    const dataHandlingMethods = this.getDataHandlingMethods(plugin, type);

    for (const methodName of dataHandlingMethods) {
      try {
        // Create mock data with personal information
        const mockPersonalData = this.createMockPersonalData();

        // Call the method and check if it properly handles personal data
        const result = await this.callMethodSafely(
          plugin,
          methodName,
          mockPersonalData
        );

        if (result && typeof result === 'object') {
          const compliance = validateGDPRCompliance(result);

          if (!compliance.isCompliant) {
            errors.push(
              `Method '${methodName}' in plugin type '${type}' returns non-anonymized personal data. ` +
                `Sensitive fields found: ${compliance.sensitiveFields.join(', ')}. ` +
                'Use ctx.anonymize() to anonymize personal data before returning.'
            );
          }
        }
      } catch (error) {
        warnings.push(
          `Could not test data anonymization for method '${methodName}': ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  }

  /**
   * Test that plugin respects consent state
   */
  private async testConsentRespect(
    plugin: any,
    type: string,
    errors: string[],
    warnings: string[]
  ): Promise<void> {
    // Test that plugin has mechanisms to check consent before processing personal data
    const hasConsentChecks = this.checkConsentValidation(plugin, type);

    if (!hasConsentChecks) {
      warnings.push(
        `Plugin type '${type}' should implement consent validation before processing personal data. ` +
          'Consider using useConsentCheckbox hook to validate consent state.'
      );
    }
  }

  /**
   * Check if plugin has UI components that might collect personal data
   */
  private pluginHasUIComponents(plugin: any, type: string): boolean {
    switch (type) {
      case 'sport':
        return (
          typeof plugin.renderScoreEntry === 'function' ||
          typeof plugin.renderScore === 'function'
        );
      case 'phase':
        return (
          typeof plugin.renderBracketUI === 'function' ||
          typeof plugin.renderStandings === 'function'
        );
      case 'tournament':
        return (
          typeof plugin.renderTournamentSetup === 'function' ||
          typeof plugin.renderTournamentDashboard === 'function'
        );
      default:
        return false;
    }
  }

  /**
   * Check if plugin integrates consent checkbox
   */
  private async checkConsentIntegration(
    plugin: any,
    _type: string
  ): Promise<boolean> {
    // This is a simplified check - in a real implementation, you might:
    // 1. Render the component and check for ConsentCheckbox elements
    // 2. Check plugin source code for ConsentCheckbox imports
    // 3. Test form submissions to ensure consent is validated

    // For now, we'll check if the plugin has a consent-related property or method
    return (
      plugin.hasConsentIntegration === true ||
      typeof plugin.validateConsent === 'function' ||
      typeof plugin.checkConsent === 'function' ||
      plugin.requiresConsent === true
    );
  }

  /**
   * Get methods that might handle personal data
   */
  private getDataHandlingMethods(plugin: any, _type: string): string[] {
    const methods: string[] = [];

    // Common methods that might handle personal data
    const potentialMethods = [
      'processPlayerData',
      'savePlayerInfo',
      'updatePlayerProfile',
      'exportData',
      'generateReport',
      'logActivity',
      'storeResults',
    ];

    potentialMethods.forEach((methodName) => {
      if (typeof plugin[methodName] === 'function') {
        methods.push(methodName);
      }
    });

    return methods;
  }

  /**
   * Create mock personal data for testing
   */
  private createMockPersonalData(): any {
    return {
      id: 'test-123',
      email: 'test.player@example.com',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1-555-0123',
      address: '123 Main St, Anytown, USA',
      dateOfBirth: '1990-01-01',
      score: 85,
      metadata: {
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
        created: '2023-01-01T00:00:00Z',
      },
    };
  }

  /**
   * Safely call a plugin method with mock data
   */
  private async callMethodSafely(
    plugin: any,
    methodName: string,
    data: any
  ): Promise<any> {
    try {
      const method = plugin[methodName];
      if (typeof method === 'function') {
        // Try to call with mock context
        const mockContext = {
          anonymize: (data: any) => data, // Mock anonymize function
          log: () => {}, // Mock log function
        };

        // Try different call patterns
        try {
          return await method.call(plugin, data, mockContext);
        } catch {
          return await method.call(plugin, data);
        }
      }
    } catch (_error) {
      // Method call failed, which is expected for some test scenarios
      return null;
    }
  }

  /**
   * Check if plugin has consent validation mechanisms
   */
  private checkConsentValidation(plugin: any, _type: string): boolean {
    // Check for consent-related methods or properties
    return (
      typeof plugin.validateConsent === 'function' ||
      typeof plugin.checkConsentRequired === 'function' ||
      typeof plugin.requireConsent === 'function' ||
      plugin.consentRequired === true ||
      plugin.gdprCompliant === true
    );
  }
}

// Test cases for GDPR consent harness
describe('GDPR Consent Harness', () => {
  let harness: GDPRConsentHarness;

  beforeEach(() => {
    harness = new GDPRConsentHarness();
  });

  describe('Plugin without consent integration', () => {
    it('should fail GDPR test for sport plugin without consent checkbox', async () => {
      const mockSportPlugin: Partial<SportPlugin> = {
        id: 'test-sport',
        name: 'Test Sport',
        version: '1.0.0',
        renderScoreEntry: () => '<div>Score Entry Form</div>', // Has UI but no consent
        renderScore: () => '<div>Score Display</div>',
        // Missing consent integration
      };

      const result = await harness.testGDPRConsent(mockSportPlugin, 'sport');

      expect(result.passed).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('does not integrate consent checkbox');
    });

    it('should fail GDPR test for plugin that returns non-anonymized data', async () => {
      const mockPlugin = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        // Note: requiresConsent property doesn't exist in SportPlugin interface
        processPlayerData: (data: any) => {
          // Returns personal data without anonymization
          return {
            ...data,
            processed: true,
          };
        },
      };

      const result = await harness.testGDPRConsent(mockPlugin, 'sport');

      expect(result.passed).toBe(false);
      expect(
        result.errors.some((error) =>
          error.includes('non-anonymized personal data')
        )
      ).toBe(true);
    });
  });

  describe('Plugin with proper consent integration', () => {
    it('should pass GDPR test for compliant sport plugin', async () => {
      const mockSportPlugin: any = {
        id: 'compliant-sport',
        name: 'Compliant Sport',
        version: '1.0.0',
        renderScoreEntry: () => '<div>Score Entry with Consent</div>',
        renderScore: () => '<div>Score Display</div>',
        hasConsentIntegration: true, // Indicates proper consent integration
        // Note: requiresConsent property doesn't exist in SportPlugin interface
        // validateConsent property doesn't exist in SportPlugin interface
      };

      const result = await harness.testGDPRConsent(mockSportPlugin, 'sport');

      expect(result.passed).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should pass GDPR test for plugin that properly anonymizes data', async () => {
      const mockPlugin = {
        id: 'anonymizing-plugin',
        name: 'Anonymizing Plugin',
        version: '1.0.0',
        // Note: requiresConsent property doesn't exist in SportPlugin interface
        validateConsent: () => true,
        processPlayerData: (data: any) => {
          // Returns anonymized data
          return {
            id: data.id,
            email: 'anon_a1b2c3d4e5f6g7h8', // Anonymized
            firstName: 'anon_x9y8z7w6v5u4t3s2', // Anonymized
            lastName: 'anon_m1n2o3p4q5r6s7t8', // Anonymized
            score: data.score, // Non-sensitive data preserved
            processed: true,
          };
        },
      };

      const result = await harness.testGDPRConsent(mockPlugin, 'sport');

      expect(result.passed).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Plugin without UI components', () => {
    it('should pass with warnings for plugin without UI', async () => {
      const mockPlugin = {
        id: 'no-ui-plugin',
        name: 'No UI Plugin',
        version: '1.0.0',
        // No UI methods
        processData: (data: any) => data,
      };

      const result = await harness.testGDPRConsent(mockPlugin, 'seeding');

      expect(result.passed).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(
        result.warnings.some((warning) => warning.includes('no UI components'))
      ).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should handle plugin method errors gracefully', async () => {
      const mockPlugin = {
        id: 'error-plugin',
        name: 'Error Plugin',
        version: '1.0.0',
        // Note: requiresConsent property doesn't exist in SportPlugin interface
        processPlayerData: () => {
          throw new Error('Method failed');
        },
      };

      const result = await harness.testGDPRConsent(mockPlugin, 'sport');

      // Should not crash, but may have warnings
      expect(result).toBeDefined();
      expect(typeof result.passed).toBe('boolean');
    });
  });
});

// Integration test with existing harness
describe('Integration with Plugin Conformance Harness', () => {
  it('should integrate GDPR tests with existing conformance tests', async () => {
    const harness = new GDPRConsentHarness();

    const mockPlugin: any = {
      id: 'integration-test',
      name: 'Integration Test Plugin',
      version: '1.0.0',
      description: 'Test plugin for integration',
      author: 'Test Author',
      i18n: {
        en: {
          name: 'Integration Test Plugin',
          description: 'Test plugin for integration',
        },
      },
      calculateTotalScore: (score: any) => score.value || 0,
      validateScore: (score: any) =>
        score.value >= 0 ? null : 'Score must be non-negative',
      renderScoreEntry: () => '<div>Score Entry</div>',
      renderScore: () => '<div>Score</div>',
      // Missing consent integration - should fail GDPR test
    };

    // Run both standard conformance tests and GDPR tests
    const conformanceResult = await harness.runFullSuite(mockPlugin, 'sport');
    const gdprResult = await harness.testGDPRConsent(mockPlugin, 'sport');

    // Standard tests should pass (basic plugin structure is correct)
    expect(conformanceResult.metadata.passed).toBe(true);

    // GDPR tests should fail (no consent integration)
    expect(gdprResult.passed).toBe(false);
    expect(
      gdprResult.errors.some((error) => error.includes('consent checkbox'))
    ).toBe(true);
  });
});
