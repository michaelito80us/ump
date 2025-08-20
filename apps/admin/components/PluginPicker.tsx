'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Button,
} from '@ump/ui';
import type { SportPlugin, BasePluginMeta } from '@ump/engine';
import {
  RugbyPlugin,
  SingleEliminationPlugin,
  RoundRobinPlugin,
} from '@ump/plugins';

export interface PluginPickerProps {
  category: 'sports' | 'phases' | 'seeding' | 'scheduling';
  selectedPluginId?: string;
  onPluginSelect: (pluginId: string) => void;
  requiredCapabilities?: string[];
  statTier?: number;
  className?: string;
}

interface PluginCardData {
  plugin: BasePluginMeta;
  isCompatible: boolean;
  incompatibilityReasons: string[];
}

// Real plugin registry using actual plugins
export const pluginRegistry = {
  sports: [
    RugbyPlugin,
    // Additional sports plugins will be added as they're implemented
    {
      id: 'football',
      name: 'Football (Soccer)',
      version: '1.0.0',
      description: 'Association football scoring system',
      author: 'UMP Core Team',
      supportedLanguages: ['en', 'es', 'fr'],
      capabilities: ['statTier:2'],
      statSchema: ['goals', 'assists'],
      i18n: {
        en: { name: 'Football (Soccer)' },
        es: { name: 'Fútbol' },
        fr: { name: 'Football' },
      } as Record<string, Record<string, string>>,
    },
    {
      id: 'basketball',
      name: 'Basketball',
      version: '1.0.0',
      description:
        'Basketball scoring with field goals, free throws, and three-pointers',
      author: 'UMP Core Team',
      supportedLanguages: ['en'],
      capabilities: ['statTier:3'],
      statSchema: [
        'fieldGoals',
        'freeThrows',
        'threePointers',
        'rebounds',
        'assists',
      ],
      i18n: {
        en: { name: 'Basketball' },
      } as Record<string, Record<string, string>>,
    },
  ],
  phases: [
    SingleEliminationPlugin,
    RoundRobinPlugin,
    // Additional phase plugins will be added as they're implemented
    {
      id: 'double-elimination',
      name: 'Double Elimination',
      version: '1.0.0',
      description: 'Teams must lose twice to be eliminated',
      author: 'UMP Core Team',
      supportedLanguages: ['en'],
      capabilities: ['teams:4-32'],
      i18n: {
        en: { name: 'Double Elimination' },
      } as Record<string, Record<string, string>>,
    },
  ],
  seeding: [
    {
      id: 'random',
      name: 'Random Seeding',
      version: '1.0.0',
      description: 'Randomly assign team positions',
      author: 'UMP Core Team',
      supportedLanguages: ['en', 'es'],
      capabilities: [],
      i18n: {
        en: { name: 'Random Seeding' },
        es: { name: 'Siembra Aleatoria' },
      } as Record<string, Record<string, string>>,
    },
    {
      id: 'ranked',
      name: 'Ranked Seeding',
      version: '1.0.0',
      description: 'Seed teams based on ranking or rating',
      author: 'UMP Core Team',
      supportedLanguages: ['en', 'es'],
      capabilities: ['ranking:required'],
      i18n: {
        en: { name: 'Ranked Seeding' },
        es: { name: 'Siembra por Ranking' },
      } as Record<string, Record<string, string>>,
    },
  ],
  scheduling: [
    {
      id: 'greedy',
      name: 'Greedy Scheduler',
      version: '1.0.0',
      description: 'Fast earliest-slot first-fit scheduling',
      author: 'UMP Core Team',
      supportedLanguages: ['en', 'es'],
      capabilities: ['matches:unlimited'],
      i18n: {
        en: { name: 'Greedy Scheduler' },
        es: { name: 'Programador Codicioso' },
      } as Record<string, Record<string, string>>,
    },
    {
      id: 'ilp_v1',
      name: 'ILP Optimizer',
      version: '1.0.0',
      description: 'Integer Linear Programming for optimal scheduling',
      author: 'UMP Core Team',
      supportedLanguages: ['en'],
      capabilities: ['matches:200'],
      i18n: {
        en: { name: 'ILP Optimizer' },
      } as Record<string, Record<string, string>>,
    },
    {
      id: 'day_bucket',
      name: 'Day Bucket Scheduler',
      version: '1.0.0',
      description:
        'Groups matches by day then applies greedy scheduling within each day',
      author: 'UMP Core Team',
      supportedLanguages: ['en', 'es'],
      capabilities: ['matches:unlimited'],
      i18n: {
        en: { name: 'Day Bucket Scheduler' },
        es: { name: 'Programador de Cubetas por Día' },
      } as Record<string, Record<string, string>>,
    },
  ],
};

function validatePluginCompatibility(
  plugin: BasePluginMeta,
  requiredCapabilities: string[] = [],
  statTier?: number
): { isCompatible: boolean; reasons: string[] } {
  const reasons: string[] = [];

  // Check stat tier compatibility for sport plugins
  if (statTier && 'statSchema' in plugin) {
    const sportPlugin = plugin as SportPlugin;
    if (sportPlugin.statSchema.length < statTier) {
      reasons.push(
        `Plugin supports stat tier ${sportPlugin.statSchema.length}, but ${statTier} is required`
      );
    }
  }

  // Check required capabilities
  const pluginCapabilities = plugin.capabilities || [];
  for (const required of requiredCapabilities) {
    if (!pluginCapabilities.some((cap) => cap.startsWith(required))) {
      reasons.push(`Missing required capability: ${required}`);
    }
  }

  return {
    isCompatible: reasons.length === 0,
    reasons,
  };
}

export function PluginPicker({
  category,
  selectedPluginId,
  onPluginSelect,
  requiredCapabilities = [],
  statTier,
  className = '',
}: PluginPickerProps) {
  const [plugins, setPlugins] = useState<PluginCardData[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setError(null);

      const categoryPlugins = pluginRegistry[category] || [];

      const pluginData: PluginCardData[] = categoryPlugins.map((plugin) => {
        const validation = validatePluginCompatibility(
          plugin,
          requiredCapabilities,
          statTier
        );
        return {
          plugin,
          isCompatible: validation.isCompatible,
          incompatibilityReasons: validation.reasons,
        };
      });

      setPlugins(pluginData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch plugins');
    }
  }, [category, requiredCapabilities, statTier]);

  if (error) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="text-center py-8">
          <div className="text-red-500 mb-4">⚠️</div>
          <p className="text-red-600 font-medium">Error loading plugins</p>
          <p className="text-gray-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (plugins.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="text-center py-8">
          <p className="text-gray-600">No {category} plugins available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plugins.map(({ plugin, isCompatible, incompatibilityReasons }) => (
          <Card
            key={plugin.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
              selectedPluginId === plugin.id
                ? 'ring-2 ring-primary border-primary'
                : isCompatible
                  ? 'hover:border-primary/50'
                  : 'opacity-60 cursor-not-allowed'
            }`}
            onClick={() => {
              if (isCompatible) {
                onPluginSelect(plugin.id);
              }
            }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg font-semibold">
                    {plugin.name}
                  </CardTitle>
                  {plugin.version && (
                    <Badge variant="outline" className="mt-1 text-xs">
                      v{plugin.version}
                    </Badge>
                  )}
                </div>
                {selectedPluginId === plugin.id && (
                  <div className="text-primary">
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm mb-3">{plugin.description}</p>

              {plugin.author && (
                <p className="text-xs text-gray-500 mb-2">by {plugin.author}</p>
              )}

              {plugin.capabilities && plugin.capabilities.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-700 mb-1">
                    Capabilities:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {plugin.capabilities.map((capability, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs"
                      >
                        {capability}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {plugin.supportedLanguages &&
                plugin.supportedLanguages.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-700 mb-1">
                      Languages:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {plugin.supportedLanguages.map((lang, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs"
                        >
                          {lang.toUpperCase()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

              {!isCompatible && incompatibilityReasons.length > 0 && (
                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                  <p className="text-xs font-medium text-red-700 mb-1">
                    Incompatible:
                  </p>
                  <ul className="text-xs text-red-600 space-y-1">
                    {incompatibilityReasons.map((reason, index) => (
                      <li key={index}>• {reason}</li>
                    ))}
                  </ul>
                </div>
              )}

              {isCompatible && (
                <Button
                  variant={
                    selectedPluginId === plugin.id ? 'default' : 'outline'
                  }
                  size="sm"
                  className="w-full mt-3"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPluginSelect(plugin.id);
                  }}
                >
                  {selectedPluginId === plugin.id ? 'Selected' : 'Select'}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
