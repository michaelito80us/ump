'use client';

import React, { useState, useMemo } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Badge, Button, Card, Input, Label } from '@ump/ui';
import {
  TournamentTemplate,
  TemplateCategory,
  TOURNAMENT_TEMPLATES,
  getTemplatesByCategory as _getTemplatesByCategory,
  getRecommendedTemplates,
  searchTemplates,
  getTemplateById as _getTemplateById,
} from '../../lib/tournament-templates';
import { cn } from '@ump/ui';

interface TemplateSelectorProps {
  form: UseFormReturn<any>;
  onTemplateSelect: (template: TournamentTemplate | null) => void;
  selectedTemplateId?: string;
}

const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  sports: 'Sports',
  corporate: 'Corporate',
  community: 'Community',
  educational: 'Educational',
};

const CATEGORY_COLORS: Record<TemplateCategory, string> = {
  sports: 'bg-blue-100 text-blue-800',
  corporate: 'bg-purple-100 text-purple-800',
  community: 'bg-green-100 text-green-800',
  educational: 'bg-orange-100 text-orange-800',
};

export function TemplateSelector({
  form,
  onTemplateSelect,
  selectedTemplateId,
}: TemplateSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<
    TemplateCategory | 'all'
  >('all');
  const [showCustom, setShowCustom] = useState(false);

  // Filter templates based on search and category
  const filteredTemplates = useMemo(() => {
    let templates = TOURNAMENT_TEMPLATES;

    // Apply search filter
    if (searchQuery.trim()) {
      templates = searchTemplates(searchQuery);
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      templates = templates.filter(
        (template) => template.category === selectedCategory
      );
    }

    return templates.sort((a, b) => {
      // Recommended templates first, then by popularity
      if (a.isRecommended && !b.isRecommended) return -1;
      if (!a.isRecommended && b.isRecommended) return 1;
      return b.popularity - a.popularity;
    });
  }, [searchQuery, selectedCategory]);

  const recommendedTemplates = useMemo(
    () => getRecommendedTemplates().slice(0, 3),
    []
  );

  const handleTemplateSelect = (template: TournamentTemplate) => {
    onTemplateSelect(template);

    // Auto-fill form with template defaults
    const { defaultConfig } = template;
    form.setValue('sport', template.sport);
    form.setValue('maxTeams', defaultConfig.maxTeams);
    form.setValue('minPlayersPerTeam', defaultConfig.minPlayersPerTeam);
    form.setValue('maxPlayersPerTeam', defaultConfig.maxPlayersPerTeam);
    form.setValue('allowSubstitutes', defaultConfig.allowSubstitutes);
    form.setValue('registrationOpen', defaultConfig.registrationOpen);
    form.setValue('matchDuration', defaultConfig.matchDuration);
    form.setValue('tiebreakerRules', defaultConfig.tiebreakerRules);
    form.setValue('plugins', defaultConfig.plugins);
  };

  const handleCustomSetup = () => {
    setShowCustom(true);
    onTemplateSelect(null);
  };

  if (showCustom) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            Custom Tournament Setup
          </h3>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowCustom(false)}
          >
            ← Back to Templates
          </Button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-blue-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-medium text-blue-800">
                Custom Configuration
              </h4>
              <p className="text-sm text-blue-700 mt-1">
                You've chosen to set up a custom tournament. Continue to the
                next steps to configure your tournament manually.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Choose Tournament Template
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Select a pre-configured template or set up a custom tournament
          </p>
        </div>
        <Button type="button" variant="outline" onClick={handleCustomSetup}>
          Custom Setup
        </Button>
      </div>

      {/* Recommended Templates */}
      {!searchQuery && selectedCategory === 'all' && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900 flex items-center">
            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full mr-2">
              ⭐
            </span>
            Recommended Templates
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendedTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                isSelected={selectedTemplateId === template.id}
                onSelect={() => handleTemplateSelect(template)}
                isRecommended
              />
            ))}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Label htmlFor="template-search">Search Templates</Label>
            <Input
              id="template-search"
              type="text"
              placeholder="Search by name, sport, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="sm:w-48">
            <Label htmlFor="category-filter">Category</Label>
            <select
              id="category-filter"
              value={selectedCategory}
              onChange={(e) =>
                setSelectedCategory(e.target.value as TemplateCategory | 'all')
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="all">All Categories</option>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="space-y-4">
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-gray-900">
              No templates found
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Try adjusting your search or category filter
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                isSelected={selectedTemplateId === template.id}
                onSelect={() => handleTemplateSelect(template)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface TemplateCardProps {
  template: TournamentTemplate;
  isSelected: boolean;
  onSelect: () => void;
  isRecommended?: boolean;
}

function TemplateCard({
  template,
  isSelected,
  onSelect,
  isRecommended,
}: TemplateCardProps) {
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-200 hover:shadow-md',
        isSelected
          ? 'ring-2 ring-blue-500 border-blue-500'
          : 'hover:border-gray-300',
        isRecommended && 'border-yellow-300 bg-yellow-50'
      )}
      onClick={onSelect}
    >
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
              {template.name}
            </h4>
            <p className="text-xs text-gray-600 mt-1">
              {template.estimatedDuration}
            </p>
          </div>
          {isRecommended && (
            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full ml-2">
              ⭐
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 line-clamp-2">
          {template.description}
        </p>

        {/* Metadata */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Teams: {template.recommendedTeams.optimal} (optimal)</span>
            <span>Sport: {template.sport}</span>
          </div>

          <div className="flex items-center justify-between">
            <Badge className={CATEGORY_COLORS[template.category]}>
              {CATEGORY_LABELS[template.category]}
            </Badge>
            <div className="flex items-center text-xs text-gray-500">
              <span className="mr-1">👥</span>
              <span>{template.popularity}% popular</span>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {template.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
            >
              {tag}
            </span>
          ))}
          {template.tags.length > 3 && (
            <span className="inline-block text-gray-500 text-xs px-1">
              +{template.tags.length - 3} more
            </span>
          )}
        </div>

        {/* Selection indicator */}
        {isSelected && (
          <div className="flex items-center text-blue-600 text-sm font-medium">
            <svg
              className="h-4 w-4 mr-1"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Selected
          </div>
        )}
      </div>
    </Card>
  );
}
