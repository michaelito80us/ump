'use client';

import React, { useState } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { PluginPicker } from '../PluginPicker';
import { TemplateSelector } from './TemplateSelector';
import {
  TournamentTemplate,
  getTemplateById,
} from '../../lib/tournament-templates';
import { pluginRegistry } from '../PluginPicker';
import { GraphQL } from '@ump/core';
import { useToast } from '@ump/ui';
// Tournament types will be used in future implementations

// Validation schema for the tournament wizard
const tournamentSchema = z.object({
  // Basic Information
  name: z
    .string()
    .min(1, 'Tournament name is required')
    .max(100, 'Name too long'),
  sport: z.string().min(1, 'Sport selection is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  description: z.string().optional(),

  // Template and Format
  templateId: z.string().optional(),

  // Registration Settings
  registrationOpen: z.boolean().default(true),
  maxTeams: z.number().min(2, 'At least 2 teams required').max(128),
  minPlayersPerTeam: z.number().min(1),
  maxPlayersPerTeam: z.number().min(1),
  allowSubstitutes: z.boolean().default(true),

  // Plugin Configuration
  sportPluginId: z.string().min(1, 'Sport plugin is required'),
  phasePlugins: z
    .array(
      z.object({
        pluginId: z.string(),
        phaseName: z.string(),
        settings: z.record(z.unknown()).default({}),
      })
    )
    .min(1, 'At least one phase plugin is required'),
  seedingPluginId: z.string().optional(),
  schedulingPluginId: z.string().optional(),

  // Rules and Statistics
  statTier: z.number().min(1).max(5).default(1),
  matchDuration: z.number().min(1).optional(),
  tiebreakerRules: z.array(z.string()).default([]),
});

type TournamentFormData = z.infer<typeof tournamentSchema>;

const WIZARD_STEPS = [
  {
    id: 'basics',
    title: 'Basics',
    description: 'Tournament name, sport, and dates',
  },
  {
    id: 'format',
    title: 'Format',
    description: 'Choose or load a tournament template',
  },
  {
    id: 'teams',
    title: 'Teams & Players',
    description: 'Registration and team management',
  },
  {
    id: 'plugins',
    title: 'Plugins',
    description: 'Sport, phase, and scheduling configuration',
  },
  {
    id: 'rules',
    title: 'Rules & Stats',
    description: 'Scoring rules and statistics settings',
  },
  {
    id: 'review',
    title: 'Review & Publish',
    description: 'Final review and publication',
  },
] as const;

type WizardStepId = (typeof WIZARD_STEPS)[number]['id'];

export function TournamentWizard() {
  const [currentStep, setCurrentStep] = useState<WizardStepId>('basics');
  const [isDraft, setIsDraft] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  // GraphQL data source configuration
  const dataSource = {
    endpoint:
      process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT ||
      'http://localhost:1235/graphql',
    fetchParams: {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  };

  const createTournamentMutation =
    GraphQL.useCreateTournamentMutation(dataSource);

  const form = useForm<TournamentFormData>({
    resolver: zodResolver(tournamentSchema),
    defaultValues: {
      name: '',
      sport: '',
      startDate: '',
      endDate: '',
      description: '',
      registrationOpen: true,
      sportPluginId: '',
      phasePlugins: [],
      statTier: 1,
      tiebreakerRules: [],
    },
    mode: 'onChange',
  });

  const currentStepIndex = WIZARD_STEPS.findIndex(
    (step) => step.id === currentStep
  );
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === WIZARD_STEPS.length - 1;

  const handleNext = async () => {
    const currentStepFields = getCurrentStepFields(currentStep);
    const isValid = await form.trigger(currentStepFields);

    if (isValid && !isLastStep) {
      const nextStep = WIZARD_STEPS[currentStepIndex + 1];
      setCurrentStep(nextStep.id);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      const prevStep = WIZARD_STEPS[currentStepIndex - 1];
      setCurrentStep(prevStep.id);
    }
  };

  const handleSaveDraft = async () => {
    const formData = form.getValues();
    setIsDraft(true);

    // TODO: Implement draft saving to backend
    console.log('Saving draft:', formData);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsDraft(false);
    console.log('Draft saved successfully!');
  };

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await createTournamentMutation.mutateAsync({
        input: {
          name: data.name,
          sport: data.sport,
          startDate: data.startDate,
          endDate: data.endDate,
          description: data.description,
          maxTeams: data.maxTeams,
          settings: {
            templateId: data.templateId,
            registrationOpen: data.registrationOpen,
            minPlayersPerTeam: data.minPlayersPerTeam,
            maxPlayersPerTeam: data.maxPlayersPerTeam,
            allowSubstitutes: data.allowSubstitutes,
            sportPluginId: data.sportPluginId,
            phasePlugins: data.phasePlugins,
            seedingPluginId: data.seedingPluginId,
            schedulingPluginId: data.schedulingPluginId,
            statTier: data.statTier,
            matchDuration: data.matchDuration,
            tiebreakerRules: data.tiebreakerRules,
            status: 'published',
          },
        },
      });

      toast({
        title: 'Tournament Published',
        description:
          'Your tournament has been successfully created and published.',
      });

      // Navigate to the tournament dashboard or list
      router.push('/tournaments');
    } catch (_error) {
      toast({
        title: 'Error',
        description: 'Failed to create tournament. Please try again.',
        variant: 'destructive',
      });
    }
  });

  return (
    <div className="space-y-8">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between">
        {WIZARD_STEPS.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted = index < currentStepIndex;

          return (
            <div key={step.id} className="flex items-center">
              <div
                className={`
                flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : isCompleted
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                }
              `}
              >
                {isCompleted ? '✓' : index + 1}
              </div>

              {index < WIZARD_STEPS.length - 1 && (
                <div
                  className={`
                  w-16 h-0.5 mx-2
                  ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}
                `}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Title */}
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900">
          {WIZARD_STEPS[currentStepIndex].title}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {WIZARD_STEPS[currentStepIndex].description}
        </p>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {renderStepContent(currentStep, form)}

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={isFirstStep}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isDraft}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              {isDraft ? 'Saving...' : 'Save Draft'}
            </button>
          </div>

          <div>
            {isLastStep ? (
              <button
                type="submit"
                data-testid="publish-tournament-button"
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Publish Tournament
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                data-testid="next-button"
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

// Helper function to get fields that should be validated for each step
function getCurrentStepFields(
  step: WizardStepId
): (keyof TournamentFormData)[] {
  switch (step) {
    case 'basics':
      return ['name', 'sport', 'startDate', 'endDate'];
    case 'format':
      return [];
    case 'teams':
      return ['maxTeams', 'minPlayersPerTeam', 'maxPlayersPerTeam'];
    case 'plugins':
      return ['sportPluginId', 'phasePlugins'];
    case 'rules':
      return ['statTier'];
    case 'review':
      return Object.keys(
        {} as TournamentFormData
      ) as (keyof TournamentFormData)[];
    default:
      return [];
  }
}

// Render step-specific content
function renderStepContent(
  step: WizardStepId,
  form: UseFormReturn<TournamentFormData>
) {
  switch (step) {
    case 'basics':
      return <BasicsStep form={form} />;
    case 'format':
      return <FormatStep form={form} />;
    case 'teams':
      return <TeamsStep form={form} />;
    case 'plugins':
      return <PluginsStep form={form} />;
    case 'rules':
      return <RulesStep form={form} />;
    case 'review':
      return <ReviewStep form={form} />;
    default:
      return <div>Unknown step</div>;
  }
}

// Step Components (placeholders for now)
function BasicsStep({ form }: { form: UseFormReturn<TournamentFormData> }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tournament Name *
        </label>
        <input
          {...form.register('name')}
          type="text"
          data-testid="tournament-name-input"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter tournament name"
        />
        {form.formState.errors.name && (
          <p className="text-red-600 text-sm mt-1">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Sport *
        </label>
        <select
          {...form.register('sport')}
          data-testid="sport-select"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select a sport</option>
          <option value="rugby">Rugby</option>
          <option value="football">Football</option>
          <option value="basketball">Basketball</option>
        </select>
        {form.formState.errors.sport && (
          <p className="text-red-600 text-sm mt-1">
            {form.formState.errors.sport.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date *
          </label>
          <input
            {...form.register('startDate')}
            type="date"
            data-testid="start-date-input"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {form.formState.errors.startDate && (
            <p className="text-red-600 text-sm mt-1">
              {form.formState.errors.startDate.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Date *
          </label>
          <input
            {...form.register('endDate')}
            type="date"
            data-testid="end-date-input"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {form.formState.errors.endDate && (
            <p className="text-red-600 text-sm mt-1">
              {form.formState.errors.endDate.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          {...form.register('description')}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Optional tournament description"
        />
      </div>
    </div>
  );
}

// Placeholder step components
function FormatStep({ form }: { form: UseFormReturn<TournamentFormData> }) {
  const { watch, setValue } = form;
  const watchedValues = watch();

  const handleTemplateSelect = (template: TournamentTemplate | null) => {
    if (template) {
      setValue('templateId', template.id, { shouldValidate: true });

      // Auto-populate form fields from template
      const { defaultConfig } = template;

      if (template.sport) {
        setValue('sport', template.sport, { shouldValidate: true });
      }
      if (defaultConfig.plugins.sport) {
        setValue('sportPluginId', defaultConfig.plugins.sport, {
          shouldValidate: true,
        });
      }
      if (
        defaultConfig.plugins.phases &&
        defaultConfig.plugins.phases.length > 0
      ) {
        setValue('phasePlugins', defaultConfig.plugins.phases, {
          shouldValidate: true,
        });
      }
      if (defaultConfig.plugins.seeding) {
        setValue('seedingPluginId', defaultConfig.plugins.seeding, {
          shouldValidate: true,
        });
      }
      if (defaultConfig.plugins.scheduling) {
        setValue('schedulingPluginId', defaultConfig.plugins.scheduling, {
          shouldValidate: true,
        });
      }
      if (defaultConfig.statTier) {
        setValue('statTier', defaultConfig.statTier, { shouldValidate: true });
      }
      if (defaultConfig.maxTeams) {
        setValue('maxTeams', defaultConfig.maxTeams, { shouldValidate: true });
      }
      if (defaultConfig.minPlayersPerTeam) {
        setValue('minPlayersPerTeam', defaultConfig.minPlayersPerTeam, {
          shouldValidate: true,
        });
      }
      if (defaultConfig.maxPlayersPerTeam) {
        setValue('maxPlayersPerTeam', defaultConfig.maxPlayersPerTeam, {
          shouldValidate: true,
        });
      }
      if (defaultConfig.allowSubstitutes !== undefined) {
        setValue('allowSubstitutes', defaultConfig.allowSubstitutes, {
          shouldValidate: true,
        });
      }
      if (defaultConfig.registrationOpen !== undefined) {
        setValue('registrationOpen', defaultConfig.registrationOpen, {
          shouldValidate: true,
        });
      }
      if (defaultConfig.matchDuration) {
        setValue('matchDuration', defaultConfig.matchDuration, {
          shouldValidate: true,
        });
      }
      if (defaultConfig.tiebreakerRules) {
        setValue('tiebreakerRules', defaultConfig.tiebreakerRules, {
          shouldValidate: true,
        });
      }
    } else {
      setValue('templateId', '', { shouldValidate: true });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Tournament Format
        </h3>
        <p className="text-gray-600">
          Choose a template to quickly set up your tournament, or start from
          scratch
        </p>
      </div>

      <TemplateSelector
        form={form}
        selectedTemplateId={watchedValues.templateId}
        onTemplateSelect={handleTemplateSelect}
      />

      {watchedValues.templateId && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
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
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Template Applied
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Your tournament has been pre-configured with the selected
                  template. You can review and modify these settings in the
                  following steps.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TeamsStep({ form }: { form: UseFormReturn<TournamentFormData> }) {
  const {
    register,
    watch,
    formState: { errors },
  } = form;
  const watchedValues = watch();
  const selectedTemplate = watchedValues.templateId
    ? getTemplateById(watchedValues.templateId)
    : null;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Teams & Players
        </h3>
        <p className="text-gray-600">
          Configure team registration and player limits
        </p>
      </div>

      {selectedTemplate && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
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
                Template: {selectedTemplate.name}
              </h4>
              <p className="text-sm text-blue-700 mt-1">
                Recommended: {selectedTemplate.recommendedTeams.optimal} teams (
                {selectedTemplate.recommendedTeams.min}-
                {selectedTemplate.recommendedTeams.max} range)
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Registration Settings */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900">
            Registration Settings
          </h4>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="registrationOpen"
              {...register('registrationOpen')}
              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <label htmlFor="registrationOpen" className="text-sm">
              Open for team registration
            </label>
          </div>

          <div>
            <label
              htmlFor="maxTeams"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Maximum Teams <span className="text-red-500">*</span>
            </label>
            <input
              id="maxTeams"
              type="number"
              min="2"
              max="128"
              data-testid="max-teams-input"
              {...register('maxTeams', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.maxTeams && (
              <p className="text-red-600 text-sm mt-1">
                {errors.maxTeams.message}
              </p>
            )}
          </div>
        </div>

        {/* Player Limits */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900">Player Limits</h4>

          <div>
            <label
              htmlFor="minPlayersPerTeam"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Minimum Players per Team <span className="text-red-500">*</span>
            </label>
            <input
              id="minPlayersPerTeam"
              type="number"
              min="1"
              data-testid="min-players-input"
              {...register('minPlayersPerTeam', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.minPlayersPerTeam && (
              <p className="text-red-600 text-sm mt-1">
                {errors.minPlayersPerTeam.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="maxPlayersPerTeam"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Maximum Players per Team <span className="text-red-500">*</span>
            </label>
            <input
              id="maxPlayersPerTeam"
              type="number"
              min="1"
              data-testid="max-players-input"
              {...register('maxPlayersPerTeam', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.maxPlayersPerTeam && (
              <p className="text-red-600 text-sm mt-1">
                {errors.maxPlayersPerTeam.message}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="allowSubstitutes"
              {...register('allowSubstitutes')}
              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <label htmlFor="allowSubstitutes" className="text-sm">
              Allow substitute players
            </label>
          </div>
        </div>
      </div>

      {/* Team Management Preview */}
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">
          Tournament Capacity
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Max Teams:</span>
            <span className="ml-2 font-medium">
              {watchedValues.maxTeams || 'Not set'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Players per Team:</span>
            <span className="ml-2 font-medium">
              {watchedValues.minPlayersPerTeam || 'Not set'} -{' '}
              {watchedValues.maxPlayersPerTeam || 'Not set'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Total Players:</span>
            <span className="ml-2 font-medium">
              {watchedValues.maxTeams && watchedValues.maxPlayersPerTeam
                ? `Up to ${watchedValues.maxTeams * watchedValues.maxPlayersPerTeam}`
                : 'Not calculated'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Substitutes:</span>
            <span className="ml-2 font-medium">
              {watchedValues.allowSubstitutes ? 'Allowed' : 'Not allowed'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PluginsStep({ form }: { form: UseFormReturn<TournamentFormData> }) {
  const {
    watch,
    setValue,
    formState: { errors },
  } = form;
  const watchedValues = watch();

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Plugin Configuration
        </h3>
        <p className="text-gray-600">
          Select the plugins that will power your tournament
        </p>
      </div>

      {/* Sport Plugin Selection */}
      <div className="space-y-4">
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-2">
            Sport Plugin <span className="text-red-500">*</span>
          </h4>
          <p className="text-sm text-gray-600 mb-4">
            Choose the sport that defines scoring rules and statistics
          </p>
          <PluginPicker
            category="sports"
            selectedPluginId={watchedValues.sportPluginId}
            onPluginSelect={(pluginId) => {
              setValue('sportPluginId', pluginId, { shouldValidate: true });
              // Update sport field to match plugin selection
              setValue('sport', pluginId, { shouldValidate: true });
            }}
            statTier={watchedValues.statTier}
          />
          {errors.sportPluginId && (
            <p className="text-red-500 text-sm mt-2">
              {errors.sportPluginId.message}
            </p>
          )}
        </div>
      </div>

      {/* Phase Plugin Selection */}
      <div className="space-y-4">
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-2">
            Phase Plugins <span className="text-red-500">*</span>
          </h4>
          <p className="text-sm text-gray-600 mb-4">
            Select tournament formats (brackets, groups, etc.)
          </p>
          <PluginPicker
            category="phases"
            selectedPluginId={watchedValues.phasePlugins?.[0]?.pluginId}
            onPluginSelect={(pluginId) => {
              const currentPhases = watchedValues.phasePlugins || [];
              const updatedPhases = [
                {
                  pluginId,
                  phaseName: `Phase 1`,
                  settings: {},
                },
                ...currentPhases.slice(1),
              ];
              setValue('phasePlugins', updatedPhases, { shouldValidate: true });
            }}
          />
          {errors.phasePlugins && (
            <p className="text-red-500 text-sm mt-2">
              {errors.phasePlugins.message}
            </p>
          )}
        </div>
      </div>

      {/* Seeding Plugin Selection */}
      <div className="space-y-4">
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-2">
            Seeding Plugin <span className="text-gray-400">(Optional)</span>
          </h4>
          <p className="text-sm text-gray-600 mb-4">
            Choose how teams are initially ranked or positioned
          </p>
          <PluginPicker
            category="seeding"
            selectedPluginId={watchedValues.seedingPluginId}
            onPluginSelect={(pluginId) => {
              setValue('seedingPluginId', pluginId, { shouldValidate: true });
            }}
          />
        </div>
      </div>

      {/* Scheduling Plugin Selection */}
      <div className="space-y-4">
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-2">
            Scheduling Plugin <span className="text-gray-400">(Optional)</span>
          </h4>
          <p className="text-sm text-gray-600 mb-4">
            Select the algorithm for match time and venue allocation
          </p>
          <PluginPicker
            category="scheduling"
            selectedPluginId={watchedValues.schedulingPluginId}
            onPluginSelect={(pluginId) => {
              setValue('schedulingPluginId', pluginId, {
                shouldValidate: true,
              });
            }}
          />
        </div>
      </div>
    </div>
  );
}

function RulesStep({ form }: { form: UseFormReturn<TournamentFormData> }) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;
  const watchedValues = watch();
  const selectedTemplate = watchedValues.templateId
    ? getTemplateById(watchedValues.templateId)
    : null;

  const addTiebreakerRule = () => {
    const currentRules = watchedValues.tiebreakerRules || [];
    setValue('tiebreakerRules', [...currentRules, ''], {
      shouldValidate: true,
    });
  };

  const removeTiebreakerRule = (index: number) => {
    const currentRules = watchedValues.tiebreakerRules || [];
    const newRules = currentRules.filter((_, i) => i !== index);
    setValue('tiebreakerRules', newRules, { shouldValidate: true });
  };

  const updateTiebreakerRule = (index: number, value: string) => {
    const currentRules = watchedValues.tiebreakerRules || [];
    const newRules = [...currentRules];
    newRules[index] = value;
    setValue('tiebreakerRules', newRules, { shouldValidate: true });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Rules & Statistics
        </h3>
        <p className="text-gray-600">
          Configure scoring rules and statistics tracking
        </p>
      </div>

      {selectedTemplate && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
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
                Template: {selectedTemplate.name}
              </h4>
              <p className="text-sm text-blue-700 mt-1">
                Sport: {selectedTemplate.sport} | Stat Tier:{' '}
                {selectedTemplate.defaultConfig.statTier}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Match Settings */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900">Match Settings</h4>

          <div>
            <label
              htmlFor="matchDuration"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Match Duration (minutes)
            </label>
            <input
              id="matchDuration"
              type="number"
              min="1"
              placeholder="e.g., 90 for football, 80 for rugby"
              {...register('matchDuration', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.matchDuration && (
              <p className="text-red-600 text-sm mt-1">
                {errors.matchDuration.message}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Leave empty if matches don't have a fixed duration
            </p>
          </div>
        </div>

        {/* Statistics Tier */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900">
            Statistics Tracking
          </h4>

          <div>
            <label
              htmlFor="statTier"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Statistics Tier <span className="text-red-500">*</span>
            </label>
            <select
              id="statTier"
              {...register('statTier', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={1}>Tier 1 - Basic (Score only)</option>
              <option value={2}>Tier 2 - Standard (Score + key stats)</option>
              <option value={3}>Tier 3 - Advanced (Detailed statistics)</option>
              <option value={4}>
                Tier 4 - Professional (Comprehensive tracking)
              </option>
              <option value={5}>Tier 5 - Elite (Full analytics)</option>
            </select>
            {errors.statTier && (
              <p className="text-red-600 text-sm mt-1">
                {errors.statTier.message}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Higher tiers track more detailed statistics but require more data
              entry
            </p>
          </div>
        </div>
      </div>

      {/* Tiebreaker Rules */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-md font-medium text-gray-900">
            Tiebreaker Rules
          </h4>
          <button
            type="button"
            onClick={addTiebreakerRule}
            className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100"
          >
            Add Rule
          </button>
        </div>

        <p className="text-sm text-gray-600">
          Define the order of tiebreaker rules when teams have equal
          points/scores
        </p>

        <div className="space-y-3">
          {(watchedValues.tiebreakerRules || []).map((rule, index) => (
            <div key={index} className="flex items-center space-x-3">
              <span className="text-sm text-gray-500 w-8">{index + 1}.</span>
              <input
                type="text"
                value={rule}
                onChange={(e) => updateTiebreakerRule(index, e.target.value)}
                placeholder="e.g., Goal Difference, Head-to-Head, Goals Scored"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => removeTiebreakerRule(index)}
                className="px-3 py-1 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100"
              >
                Remove
              </button>
            </div>
          ))}

          {(!watchedValues.tiebreakerRules ||
            watchedValues.tiebreakerRules.length === 0) && (
            <div className="text-center py-4 text-gray-500 text-sm">
              No tiebreaker rules defined. Click "Add Rule" to add one.
            </div>
          )}
        </div>
      </div>

      {/* Rules Summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">
          Rules Summary
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Match Duration:</span>
            <span className="ml-2 font-medium">
              {watchedValues.matchDuration
                ? `${watchedValues.matchDuration} minutes`
                : 'Not set'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Statistics Tier:</span>
            <span className="ml-2 font-medium">
              Tier {watchedValues.statTier || 1}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Tiebreaker Rules:</span>
            <span className="ml-2 font-medium">
              {watchedValues.tiebreakerRules?.length || 0} defined
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewStep({ form }: { form: UseFormReturn<TournamentFormData> }) {
  const {
    watch,
    formState: { errors, isValid },
  } = form;
  const formData = watch();
  const selectedTemplate = formData.templateId
    ? getTemplateById(formData.templateId)
    : null;

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Review & Publish
        </h3>
        <p className="text-gray-600">
          Review your tournament configuration before publishing
        </p>
      </div>

      {hasErrors && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-medium text-red-800">
                Please fix the following errors:
              </h4>
              <ul className="text-sm text-red-700 mt-1 list-disc list-inside">
                {Object.entries(errors).map(([field, error]) => (
                  <li key={field}>
                    {field}: {error?.message || 'Invalid value'}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">
            Basic Information
          </h4>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Tournament Name
              </dt>
              <dd className="text-sm text-gray-900">
                {formData.name || 'Not set'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Sport</dt>
              <dd className="text-sm text-gray-900">
                {formData.sport || 'Not set'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Start Date</dt>
              <dd className="text-sm text-gray-900">
                {formData.startDate
                  ? new Date(formData.startDate).toLocaleDateString()
                  : 'Not set'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">End Date</dt>
              <dd className="text-sm text-gray-900">
                {formData.endDate
                  ? new Date(formData.endDate).toLocaleDateString()
                  : 'Not set'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Description</dt>
              <dd className="text-sm text-gray-900">
                {formData.description || 'No description'}
              </dd>
            </div>
          </dl>
        </div>

        {/* Template & Format */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">
            Template & Format
          </h4>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Template</dt>
              <dd className="text-sm text-gray-900">
                {selectedTemplate ? (
                  <div>
                    <span className="font-medium">{selectedTemplate.name}</span>
                    <span className="text-gray-500 ml-2">
                      ({selectedTemplate.category})
                    </span>
                  </div>
                ) : (
                  'No template selected'
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Sport Plugin
              </dt>
              <dd className="text-sm text-gray-900">
                {formData.sportPluginId
                  ? pluginRegistry.sports.find(
                      (p: any) => p.id === formData.sportPluginId
                    )?.name || formData.sportPluginId
                  : 'Not selected'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Phase Plugins
              </dt>
              <dd className="text-sm text-gray-900">
                {formData.phasePlugins && formData.phasePlugins.length > 0 ? (
                  <ul className="list-disc list-inside">
                    {formData.phasePlugins.map((plugin, index) => (
                      <li key={index}>
                        {pluginRegistry.phases.find(
                          (p: any) => p.id === plugin.pluginId
                        )?.name || plugin.pluginId}
                      </li>
                    ))}
                  </ul>
                ) : (
                  'None selected'
                )}
              </dd>
            </div>
          </dl>
        </div>

        {/* Teams & Players */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">
            Teams & Players
          </h4>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Registration Open
              </dt>
              <dd className="text-sm text-gray-900">
                {formData.registrationOpen ? 'Yes' : 'No'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Maximum Teams
              </dt>
              <dd className="text-sm text-gray-900">
                {formData.maxTeams || 'Not set'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Players per Team
              </dt>
              <dd className="text-sm text-gray-900">
                {formData.minPlayersPerTeam && formData.maxPlayersPerTeam
                  ? `${formData.minPlayersPerTeam} - ${formData.maxPlayersPerTeam}`
                  : 'Not configured'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Allow Substitutes
              </dt>
              <dd className="text-sm text-gray-900">
                {formData.allowSubstitutes ? 'Yes' : 'No'}
              </dd>
            </div>
          </dl>
        </div>

        {/* Plugins & Rules */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">
            Plugins & Rules
          </h4>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Seeding Plugin
              </dt>
              <dd className="text-sm text-gray-900">
                {formData.seedingPluginId
                  ? pluginRegistry.seeding.find(
                      (p: any) => p.id === formData.seedingPluginId
                    )?.name || formData.seedingPluginId
                  : 'Not selected'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Scheduling Plugin
              </dt>
              <dd className="text-sm text-gray-900">
                {formData.schedulingPluginId
                  ? pluginRegistry.scheduling.find(
                      (p: any) => p.id === formData.schedulingPluginId
                    )?.name || formData.schedulingPluginId
                  : 'Not selected'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Statistics Tier
              </dt>
              <dd className="text-sm text-gray-900">
                Tier {formData.statTier || 1}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Match Duration
              </dt>
              <dd className="text-sm text-gray-900">
                {formData.matchDuration
                  ? `${formData.matchDuration} minutes`
                  : 'Not set'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Tiebreaker Rules
              </dt>
              <dd className="text-sm text-gray-900">
                {formData.tiebreakerRules &&
                formData.tiebreakerRules.length > 0 ? (
                  <ol className="list-decimal list-inside">
                    {formData.tiebreakerRules.map((rule, index) => (
                      <li key={index}>{rule}</li>
                    ))}
                  </ol>
                ) : (
                  'None defined'
                )}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Validation Status */}
      <div
        className={`border rounded-lg p-4 ${
          isValid && !hasErrors
            ? 'bg-green-50 border-green-200'
            : 'bg-yellow-50 border-yellow-200'
        }`}
      >
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {isValid && !hasErrors ? (
              <svg
                className="h-5 w-5 text-green-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                className="h-5 w-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
          <div>
            <h4
              className={`text-sm font-medium ${
                isValid && !hasErrors ? 'text-green-800' : 'text-yellow-800'
              }`}
            >
              {isValid && !hasErrors
                ? 'Tournament Ready to Publish'
                : 'Please Complete Required Fields'}
            </h4>
            <p
              className={`text-sm mt-1 ${
                isValid && !hasErrors ? 'text-green-700' : 'text-yellow-700'
              }`}
            >
              {isValid && !hasErrors
                ? 'All required fields are completed and valid. You can now publish your tournament.'
                : 'Some required fields are missing or contain errors. Please review and complete them before publishing.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
