'use client';

import React, { useState } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
// Tournament types will be used in future implementations

// Validation schema for the tournament wizard
const tournamentSchema = z.object({
  // Step 1: Basics
  name: z
    .string()
    .min(1, 'Tournament name is required')
    .max(100, 'Name too long'),
  sport: z.string().min(1, 'Sport selection is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  description: z.string().optional(),

  // Step 2: Format (will be expanded)
  templateId: z.string().optional(),

  // Step 3: Teams & Players (will be expanded)
  registrationOpen: z.boolean().default(true),
  maxTeams: z.number().min(2, 'At least 2 teams required').optional(),

  // Step 4: Plugins (will be expanded)
  sportPluginId: z.string().min(1, 'Sport plugin is required'),
  phasePlugins: z
    .array(
      z.object({
        pluginId: z.string(),
        phaseName: z.string(),
        settings: z.record(z.unknown()).default({}),
      })
    )
    .min(1, 'At least one phase plugin required'),
  schedulingPluginId: z.string().optional(),
  seedingPluginId: z.string().optional(),

  // Step 5: Rules & Stats
  statTier: z.number().min(1).max(3).default(1),
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
    console.log('Publishing tournament:', data);

    // TODO: Implement tournament creation/publication
    // This would involve:
    // 1. Validation
    // 2. Creating tournament record
    // 3. Setting status to 'Published'
    // 4. Generating tournament slug

    console.log('Tournament published successfully!');
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
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Publish Tournament
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
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
      return [];
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
function FormatStep({
  form: _form,
}: {
  form: UseFormReturn<TournamentFormData>;
}) {
  return (
    <div className="text-center py-8">
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Tournament Format
      </h3>
      <p className="text-gray-600">
        Template selection will be implemented in the next batch.
      </p>
    </div>
  );
}

function TeamsStep({
  form: _form,
}: {
  form: UseFormReturn<TournamentFormData>;
}) {
  return (
    <div className="text-center py-8">
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Teams & Players
      </h3>
      <p className="text-gray-600">
        Team registration settings will be implemented in the next batch.
      </p>
    </div>
  );
}

function PluginsStep({
  form: _form,
}: {
  form: UseFormReturn<TournamentFormData>;
}) {
  return (
    <div className="text-center py-8">
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Plugin Configuration
      </h3>
      <p className="text-gray-600">
        Plugin selection interface will be implemented in the next batch.
      </p>
    </div>
  );
}

function RulesStep({
  form: _form,
}: {
  form: UseFormReturn<TournamentFormData>;
}) {
  return (
    <div className="text-center py-8">
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Rules & Statistics
      </h3>
      <p className="text-gray-600">
        Rules configuration will be implemented in the next batch.
      </p>
    </div>
  );
}

function ReviewStep({ form }: { form: UseFormReturn<TournamentFormData> }) {
  const formData = form.watch();

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">
        Review Your Tournament
      </h3>

      <div className="bg-gray-50 p-4 rounded-md">
        <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Name</dt>
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
              {formData.startDate || 'Not set'}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">End Date</dt>
            <dd className="text-sm text-gray-900">
              {formData.endDate || 'Not set'}
            </dd>
          </div>
        </dl>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
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
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Ready to Publish
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                Once published, your tournament will be visible to participants
                and registration will open. You can still make changes after
                publishing, but some fields may become locked once matches
                begin.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
