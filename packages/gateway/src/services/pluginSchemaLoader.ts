import { ServiceEndpointDefinition } from '@apollo/gateway';
import { logger } from '../utils/logger';

interface PluginSubgraph {
  name: string;
  url: string;
  schema?: string;
  version?: string;
  enabled: boolean;
}

interface SubgraphRegistry {
  core: ServiceEndpointDefinition;
  plugins: PluginSubgraph[];
}

export class PluginSchemaLoader {
  private coreSubgraphUrl: string;
  private pluginRegistryUrl?: string;

  constructor() {
    this.coreSubgraphUrl =
      process.env.CORE_SUBGRAPH_URL || 'http://localhost:4001/graphql';
    this.pluginRegistryUrl = process.env.PLUGIN_REGISTRY_URL;
  }

  /**
   * Load all subgraphs including core backend and registered plugins
   */
  async loadSubgraphs(): Promise<ServiceEndpointDefinition[]> {
    const subgraphs: ServiceEndpointDefinition[] = [];

    try {
      // Always include the core backend subgraph
      const coreSubgraph: ServiceEndpointDefinition = {
        name: 'core',
        url: this.coreSubgraphUrl,
      };

      subgraphs.push(coreSubgraph);
      logger.info(`Loaded core subgraph: ${this.coreSubgraphUrl}`);

      // Load plugin subgraphs if registry is available
      if (this.pluginRegistryUrl) {
        const pluginSubgraphs = await this.loadPluginSubgraphs();
        subgraphs.push(...pluginSubgraphs);
      } else {
        logger.info(
          'No plugin registry URL configured, skipping plugin subgraphs'
        );
      }

      // Load development/static plugin subgraphs from environment
      const devPluginSubgraphs = this.loadDevPluginSubgraphs();
      subgraphs.push(...devPluginSubgraphs);

      logger.info(`Total subgraphs loaded: ${subgraphs.length}`);
      return subgraphs;
    } catch (error) {
      logger.error('Failed to load subgraphs:', error);

      // Fallback to core subgraph only
      logger.warn('Falling back to core subgraph only');
      return [
        {
          name: 'core',
          url: this.coreSubgraphUrl,
        },
      ];
    }
  }

  /**
   * Load plugin subgraphs from the plugin registry service
   */
  private async loadPluginSubgraphs(): Promise<ServiceEndpointDefinition[]> {
    if (!this.pluginRegistryUrl) {
      return [];
    }

    try {
      logger.info(
        `Fetching plugin subgraphs from registry: ${this.pluginRegistryUrl}`
      );

      const response = await fetch(`${this.pluginRegistryUrl}/subgraphs`);
      if (!response.ok) {
        throw new Error(`Registry responded with status: ${response.status}`);
      }

      const registry: SubgraphRegistry = await response.json();
      const enabledPlugins = registry.plugins.filter(
        (plugin) => plugin.enabled
      );

      const subgraphs: ServiceEndpointDefinition[] = enabledPlugins.map(
        (plugin) => ({
          name: plugin.name,
          url: plugin.url,
        })
      );

      logger.info(`Loaded ${subgraphs.length} plugin subgraphs from registry`);
      return subgraphs;
    } catch (error) {
      logger.error('Failed to load plugin subgraphs from registry:', error);
      return [];
    }
  }

  /**
   * Load development plugin subgraphs from environment variables
   * Format: PLUGIN_SUBGRAPHS=name1:url1,name2:url2
   */
  private loadDevPluginSubgraphs(): ServiceEndpointDefinition[] {
    const envPlugins = process.env.PLUGIN_SUBGRAPHS;
    if (!envPlugins) {
      return [];
    }

    try {
      const subgraphs: ServiceEndpointDefinition[] = [];
      const pluginEntries = envPlugins.split(',');

      for (const entry of pluginEntries) {
        const [name, url] = entry.trim().split(':');
        if (name && url) {
          subgraphs.push({ name: name.trim(), url: url.trim() });
          logger.info(`Loaded dev plugin subgraph: ${name} -> ${url}`);
        }
      }

      return subgraphs;
    } catch (error) {
      logger.error(
        'Failed to parse PLUGIN_SUBGRAPHS environment variable:',
        error
      );
      return [];
    }
  }

  /**
   * Validate that a subgraph is healthy and responding
   */
  async validateSubgraph(
    subgraph: ServiceEndpointDefinition
  ): Promise<boolean> {
    try {
      // Check if URL is defined
      if (!subgraph.url) {
        logger.warn(`Subgraph ${subgraph.name} has no URL defined`);
        return false;
      }

      const healthUrl = `${subgraph.url.replace('/graphql', '')}/health`;
      const response = await fetch(healthUrl, {
        method: 'GET',
        timeout: 5000,
      } as any);

      return response.ok;
    } catch (error) {
      logger.warn(`Subgraph ${subgraph.name} health check failed:`, error);
      return false;
    }
  }

  /**
   * Get the current subgraph configuration for debugging
   */
  async getSubgraphInfo(): Promise<{
    core: ServiceEndpointDefinition;
    plugins: ServiceEndpointDefinition[];
    total: number;
  }> {
    const allSubgraphs = await this.loadSubgraphs();
    const core = allSubgraphs.find((s) => s.name === 'core')!;
    const plugins = allSubgraphs.filter((s) => s.name !== 'core');

    return {
      core,
      plugins,
      total: allSubgraphs.length,
    };
  }
}
