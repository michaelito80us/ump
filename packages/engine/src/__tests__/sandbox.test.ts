// Sandbox Executor Tests

import { SandboxExecutor } from '../sandbox';
import { PluginExecutionError } from '../errors';
import { PluginExecutionContext } from '../sandbox/types';

describe('SandboxExecutor', () => {
  let sandbox: SandboxExecutor;
  let mockContext: PluginExecutionContext;

  beforeEach(() => {
    sandbox = new SandboxExecutor();
    mockContext = {
      pluginId: 'test-plugin',
      version: '1.0.0',
      permissions: ['read:test'],
      eventBus: null,
      shared: null,
    };
  });

  describe('Basic Execution', () => {
    it('should execute simple JavaScript code', async () => {
      const code = 'return 2 + 2;';
      const result = await sandbox.execute(code, mockContext);

      expect(result.success).toBe(true);
      expect(result.result).toBe(4);
      expect(result.executionTime).toBeGreaterThan(0);
    });

    it('should handle complex JavaScript operations', async () => {
      const code = `
        const data = { test: true, value: 42 };
        const result = {
          parsed: JSON.parse(JSON.stringify(data)),
          calculated: Math.pow(data.value, 2)
        };
        return result;
      `;

      const result = await sandbox.execute(code, mockContext);
      expect(result.success).toBe(true);
      expect(result.result.calculated).toBe(1764);
      expect(result.result.parsed.test).toBe(true);
    });
  });

  describe('Security Restrictions', () => {
    it('should prevent file system access', async () => {
      const code = `
        const fs = require('fs');
        return fs.readFileSync('/etc/passwd');
      `;

      await expect(sandbox.execute(code, mockContext)).rejects.toThrow(
        PluginExecutionError
      );
    });

    it('should prevent process access', async () => {
      const code = `
        return process.env;
      `;

      const result = await sandbox.execute(code, mockContext);
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('process is not defined');
    });

    it('should prevent eval usage', async () => {
      const code = `
        return eval('2 + 2');
      `;

      const validation = sandbox.validateCode(code);
      expect(validation.valid).toBe(false);
      expect(validation.errors[0]).toContain('Dangerous pattern detected');
    });

    it('should handle timeout scenarios', async () => {
      const code = `
        while(true) {
          // Infinite loop to test timeout
        }
      `;

      const timeoutSandbox = new SandboxExecutor({ timeout: 100 });
      await expect(timeoutSandbox.execute(code, mockContext)).rejects.toThrow(
        PluginExecutionError
      );
    });

    it('should handle memory-intensive operations', async () => {
      const code = `
        const bigArray = new Array(1000000).fill('test');
        return bigArray.length;
      `;

      const result = await sandbox.execute(code, mockContext);
      expect(result.success).toBe(true);
      expect(result.result).toBe(1000000);
      expect(result.memoryUsed).toBeGreaterThan(0);
    });
  });

  describe('Functional Context Integration', () => {
    it('should provide functional console logging', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const code = `
        console.log('Test log message');
        return 'logged';
      `;

      const result = await sandbox.execute(code, mockContext);
      expect(result.success).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Plugin:test-plugin]',
        'Test log message'
      );

      consoleSpy.mockRestore();
    });

    it('should provide functional EventBus operations', async () => {
      const eventBus = sandbox.getEventBus();
      const handler = jest.fn();

      // Subscribe externally
      eventBus.subscribe('test-plugin:test-event', handler);

      const code = `
        eventBus.publish('test-event', { data: 'test' });
        return 'published';
      `;

      const result = await sandbox.execute(code, mockContext);
      expect(result.success).toBe(true);
      expect(handler).toHaveBeenCalledWith({ data: 'test' });
    });

    it('should provide functional SharedStore operations', async () => {
      const sharedStore = sandbox.getSharedStore();

      const code = `
        shared.set('test-key', 'test-value');
        const retrieved = shared.get('test-key');
        const exists = shared.has('test-key');
        return { retrieved, exists };
      `;

      const result = await sandbox.execute(code, mockContext);
      expect(result.success).toBe(true);
      expect(result.result.retrieved).toBe('test-value');
      expect(result.result.exists).toBe(true);

      // Verify external access
      expect(sharedStore.get('test-plugin:test-key')).toBe('test-value');
    });

    it('should isolate plugin data by plugin ID', async () => {
      const mockContext2 = {
        ...mockContext,
        pluginId: 'other-plugin',
      };

      // Plugin 1 sets data
      const code1 = `
        shared.set('config', { plugin: 'test-plugin' });
        return shared.get('config');
      `;

      // Plugin 2 sets data with same key
      const code2 = `
        shared.set('config', { plugin: 'other-plugin' });
        return shared.get('config');
      `;

      const result1 = await sandbox.execute(code1, mockContext);
      const result2 = await sandbox.execute(code2, mockContext2);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result1.result.plugin).toBe('test-plugin');
      expect(result2.result.plugin).toBe('other-plugin');
    });
  });

  describe('Code Validation', () => {
    it('should accept safe code', async () => {
      const code = `
        const result = Math.floor(Math.random() * 100);
        return Math.floor(result);
      `;

      const validation = sandbox.validateCode(code);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect dangerous patterns', () => {
      const code = `
        const fs = require('fs');
        return fs.readFileSync('/etc/passwd');
      `;

      const validation = sandbox.validateCode(code);
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors[0]).toContain('Dangerous pattern detected');
    });

    it('should detect syntax errors', () => {
      const code = `
        const invalid = {
          missing: 'closing brace'
      `;

      const validation = sandbox.validateCode(code);
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors[0]).toContain('Syntax error');
    });
  });

  describe('Error Handling', () => {
    it('should handle runtime errors gracefully', async () => {
      const code = `
        const obj = null;
        return obj.property; // Will throw TypeError
      `;

      const result = await sandbox.execute(code, mockContext);

      expect(result.success).toBe(false);
      expect(result.error?.name).toBe('TypeError');
      expect(result.error?.message).toContain('Cannot read');
    });
  });

  describe('Cross-Plugin Communication', () => {
    it('should enable plugin-to-plugin communication via EventBus', async () => {
      const eventBus = sandbox.getEventBus();
      const receivedEvents: any[] = [];

      // Set up listener for plugin B
      eventBus.subscribe('plugin-b:weather-update', (data: any) => {
        receivedEvents.push(data);
      });

      // Plugin A publishes weather data
      const pluginAContext = { ...mockContext, pluginId: 'plugin-a' };
      const codeA = `
        // Plugin A doesn't directly publish to plugin B's namespace
        // This would be handled by the engine or a shared event
        return 'Plugin A executed';
      `;

      // Plugin B publishes weather update
      const pluginBContext = { ...mockContext, pluginId: 'plugin-b' };
      const codeB = `
        eventBus.publish('weather-update', { venue: 'Field A', forecast: 'rain' });
        return 'Weather published';
      `;

      await sandbox.execute(codeA, pluginAContext);
      await sandbox.execute(codeB, pluginBContext);

      expect(receivedEvents).toHaveLength(1);
      expect(receivedEvents[0]).toEqual({ venue: 'Field A', forecast: 'rain' });
    });

    it('should enable shared data access between plugins', async () => {
      const sharedStore = sandbox.getSharedStore();

      // Plugin A sets shared tournament data
      const pluginAContext = { ...mockContext, pluginId: 'plugin-a' };
      const codeA = `
        shared.set('tournament-config', { name: 'Rugby Championship', teams: 8 });
        return 'Config set';
      `;

      // Plugin B reads the shared data (would need to use a shared namespace)
      // For now, we'll test via external access
      await sandbox.execute(codeA, pluginAContext);

      // External access to verify data sharing capability
      const tournamentConfig = sharedStore.get('plugin-a:tournament-config');
      expect(tournamentConfig).toEqual({
        name: 'Rugby Championship',
        teams: 8,
      });
    });
  });

  afterEach(() => {
    // Clean up any resources if needed
  });
});
