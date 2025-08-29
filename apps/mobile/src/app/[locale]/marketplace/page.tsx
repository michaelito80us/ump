'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Input,
} from '@ump/ui';
import {
  pluginRegistry,
  type AnyPlugin,
  type PluginCategory,
} from '@ump/engine';

const categories: PluginCategory[] = [
  'sports',
  'phases',
  'seeding',
  'scheduling',
  'tournaments',
];

interface PluginWithCategory {
  plugin: AnyPlugin;
  category: PluginCategory;
}

export default function MarketplacePage() {
  const t = useTranslations();
  const [plugins, setPlugins] = useState<PluginWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [installingPlugins, setInstallingPlugins] = useState<Set<string>>(
    new Set()
  );

  const loadPlugins = () => {
    try {
      setLoading(true);
      const allPlugins: Array<{ plugin: AnyPlugin; category: PluginCategory }> =
        [];

      // Query registry for all plugin categories
      categories.forEach((category) => {
        const categoryPlugins = pluginRegistry.list(category);
        categoryPlugins.forEach((plugin) => {
          allPlugins.push({ plugin, category });
        });
      });

      setPlugins(allPlugins);
    } catch (err) {
      console.error('Failed to load plugins:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlugins();
  }, []);

  const handleInstall = async (pluginId: string, pluginName: string) => {
    try {
      setInstallingPlugins((prev) => new Set(prev).add(pluginId));

      // Simulate installation process
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Show success message using plugin name for better UX
      window.alert(t('installSuccess', { pluginName }));
    } catch (err) {
      console.error('Failed to install plugin:', err);
      window.alert(t('installError', { pluginName }));
    } finally {
      setInstallingPlugins((prev) => {
        const newSet = new Set(prev);
        newSet.delete(pluginId);
        return newSet;
      });
    }
  };

  // Filter plugins based on search and category
  const filteredPlugins = plugins.filter(({ plugin, category }) => {
    const matchesSearch =
      plugin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plugin.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p>{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Main heading */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
        <p className="text-gray-600">{t('description')}</p>
      </header>

      {/* Search and filter controls */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            type="search"
            placeholder={t('searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
            aria-label={t('searchPlaceholder')}
          />
        </div>
        <div className="sm:w-48">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            aria-label={t('categoryFilter')}
          >
            <option value="all">{t('allCategories')}</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {t(`category.${category}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Plugin count */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          {t('pluginCount', {
            count: filteredPlugins.length,
            total: plugins.length,
          })}
        </p>
      </div>

      {/* Plugin grid or empty state */}
      {filteredPlugins.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">{t('noPluginsFound')}</p>
          <Button type="button" onClick={loadPlugins} variant="outline">
            {t('refresh')}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlugins.map(({ plugin, category }) => (
            <Card
              key={`${category}-${plugin.id}`}
              className="h-full flex flex-col"
              role="article"
            >
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <CardTitle className="text-lg">{plugin.name}</CardTitle>
                  <Badge variant="secondary" className="ml-2">
                    {t(`category.${category}`)}
                  </Badge>
                </div>
                <CardDescription className="text-sm text-gray-600">
                  {plugin.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">{t('author')}:</span>{' '}
                    {plugin.author}
                  </div>
                  <div>
                    <span className="font-medium">{t('version')}:</span>{' '}
                    {plugin.version}
                  </div>
                  {plugin.supportedLanguages &&
                    plugin.supportedLanguages.length > 0 && (
                      <div>
                        <span className="font-medium">{t('languages')}:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {plugin.supportedLanguages.map((language, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs"
                            >
                              {language}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  {plugin.capabilities && plugin.capabilities.length > 0 && (
                    <div>
                      <span className="font-medium">{t('capabilities')}:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {plugin.capabilities.map((capability, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs"
                          >
                            {capability}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  type="button"
                  onClick={() => handleInstall(plugin.id, plugin.name)}
                  disabled={installingPlugins.has(plugin.id)}
                  className="w-full"
                >
                  {installingPlugins.has(plugin.id)
                    ? t('installing')
                    : t('install')}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
