import React from 'react';
import { SportPlugin, SportVariantDefinition } from '@ump/engine';
import { Match, MatchContext } from '@ump/core';
import { RugbyScoreEntry } from './RugbyScoreEntry';
import { RugbyScoreDisplay } from './RugbyScoreDisplay';

export interface RugbyScoreBreakdown {
  tries: number;
  conversions: number;
  penalties: number;
  dropGoals: number;
}

export const rugbyVariants: SportVariantDefinition[] = [
  {
    id: 'rugby-15s',
    name: 'Rugby Union (15s)',
    description: 'Traditional 15-a-side rugby union',
    settings: {
      teamSize: 15,
      substitutions: 8,
      matchDuration: 80, // minutes
      periods: 2,
      periodDuration: 40,
      halfTimeBreak: 15,
      allowExtraTime: true,
      maxExtraTimePeriods: 2,
      extraTimeDuration: 10,
    },
  },
  {
    id: 'rugby-7s',
    name: 'Rugby Sevens (7s)',
    description: 'Fast-paced 7-a-side rugby',
    settings: {
      teamSize: 7,
      substitutions: 5,
      matchDuration: 14, // minutes
      periods: 2,
      periodDuration: 7,
      halfTimeBreak: 2,
      allowExtraTime: true,
      maxExtraTimePeriods: 2,
      extraTimeDuration: 5,
    },
  },
];

export const RugbyPlugin: SportPlugin = {
  // Plugin metadata
  id: 'rugby',
  name: 'Rugby Union',
  version: '1.0.0',
  description: 'Official rugby union scoring and match management',
  author: 'UMP Core Team',

  // Internationalization
  i18n: {
    en: {
      name: 'Rugby Union',
      description: 'Rugby union tournament management',
      tries: 'Tries',
      conversions: 'Conversions',
      penalties: 'Penalties',
      dropGoals: 'Drop Goals',
      scoreEntry: 'Enter Score',
      invalidScore: 'Invalid score: conversions cannot exceed tries',
    },
    fr: {
      name: 'Rugby à XV',
      description: 'Gestion de tournoi de rugby à XV',
      tries: 'Essais',
      conversions: 'Transformations',
      penalties: 'Pénalités',
      dropGoals: 'Drops',
      scoreEntry: 'Saisir le Score',
      invalidScore:
        'Score invalide: les transformations ne peuvent pas dépasser les essais',
    },
  },

  // Plugin capabilities
  capabilities: ['scoreBreakdown', 'liveScoring', 'statistics', 'customRules'],

  // Sport-specific stat schema
  statSchema: ['tries', 'conversions', 'penalties', 'dropGoals'],

  // Sport variants
  variants: rugbyVariants,

  // Core scoring logic
  calculateTotalScore: (breakdown: any, _ctx?: MatchContext): number => {
    const tries = breakdown.tries || 0;
    const conversions = breakdown.conversions || 0;
    const penalties = breakdown.penalties || 0;
    const dropGoals = breakdown.dropGoals || 0;

    return tries * 5 + conversions * 2 + penalties * 3 + dropGoals * 3;
  },

  validateScore: (breakdown: any): string | null => {
    const tries = breakdown.tries || 0;
    const conversions = breakdown.conversions || 0;
    const penalties = breakdown.penalties || 0;
    const dropGoals = breakdown.dropGoals || 0;

    // Validate non-negative values
    if (tries < 0) return 'Tries cannot be negative';
    if (conversions < 0) return 'Conversions cannot be negative';
    if (penalties < 0) return 'Penalties cannot be negative';
    if (dropGoals < 0) return 'Drop goals cannot be negative';

    // Rugby-specific rule: conversions cannot exceed tries
    if (conversions > tries) {
      return 'Cannot have more conversions than tries';
    }

    // Reasonable upper limits
    if (tries > 50) return 'Tries seem unreasonably high';
    if (penalties > 30) return 'Penalties seem unreasonably high';
    if (dropGoals > 20) return 'Drop goals seem unreasonably high';

    return null; // No errors
  },

  // UI Components
  renderScoreEntry: (): React.ReactNode => {
    return React.createElement(RugbyScoreEntry);
  },

  renderScore: (match: Match): React.ReactNode => {
    return React.createElement(RugbyScoreDisplay, { match });
  },
};
