// Create a proper mock that matches the actual PluginRegistry interface
const mockPluginRegistry = {
  // Storage for registered plugins
  _plugins: {
    sports: new Map(),
    phases: new Map(),
    seeding: new Map(),
    scheduling: new Map(),
    tournaments: new Map(),
  },

  // Registry methods
  register: jest.fn((category, plugin) => {
    mockPluginRegistry._plugins[category].set(plugin.id, plugin);
  }),

  list: jest.fn((category) => {
    return Array.from(mockPluginRegistry._plugins[category].values());
  }),

  get: jest.fn((category, pluginId) => {
    const plugin = mockPluginRegistry._plugins[category].get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found in category ${category}`);
    }
    return plugin;
  }),

  has: jest.fn((category, pluginId) => {
    return mockPluginRegistry._plugins[category].has(pluginId);
  }),

  clear: jest.fn((category) => {
    if (category) {
      mockPluginRegistry._plugins[category].clear();
    } else {
      // Clear all categories
      Object.values(mockPluginRegistry._plugins).forEach((map) => map.clear());
    }
  }),

  unregister: jest.fn((category, pluginId) => {
    return mockPluginRegistry._plugins[category].delete(pluginId);
  }),

  getStats: jest.fn(() => ({
    sports: mockPluginRegistry._plugins.sports.size,
    phases: mockPluginRegistry._plugins.phases.size,
    seeding: mockPluginRegistry._plugins.seeding.size,
    scheduling: mockPluginRegistry._plugins.scheduling.size,
    tournaments: mockPluginRegistry._plugins.tournaments.size,
  })),

  // Legacy methods for backward compatibility
  getAvailablePlugins: jest.fn(() => Promise.resolve([])),
  installPlugin: jest.fn(() => Promise.resolve({ success: true })),
  uninstallPlugin: jest.fn(() => Promise.resolve({ success: true })),
  getInstalledPlugins: jest.fn(() => Promise.resolve([])),
};

module.exports = {
  pluginRegistry: mockPluginRegistry,
  registerPlugin: jest.fn((category, plugin) => {
    mockPluginRegistry.register(category, plugin);
  }),
  EventBus: jest.fn().mockImplementation(() => ({
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
  })),
  SharedStore: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  })),
  SandboxExecutor: jest.fn().mockImplementation(() => ({
    execute: jest.fn(() => Promise.resolve({ success: true })),
  })),
  ENGINE_VERSION: '0.1.0',
};
