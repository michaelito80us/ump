// Tournament Template System
// Predefined tournament configurations for quick setup

import { z } from 'zod';

// Template category types
export type TemplateCategory =
  | 'sports'
  | 'corporate'
  | 'community'
  | 'educational';

// Template interface
export interface TournamentTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  sport: string;
  estimatedDuration: string; // e.g., "2-3 hours", "1 day", "1 week"
  recommendedTeams: {
    min: number;
    max: number;
    optimal: number;
  };
  defaultConfig: {
    // Basic settings
    registrationOpen: boolean;
    maxTeams: number;
    minPlayersPerTeam: number;
    maxPlayersPerTeam: number;
    allowSubstitutes: boolean;

    // Plugin configuration
    plugins: {
      sport: string;
      phases: Array<{
        pluginId: string;
        phaseName: string;
        settings: Record<string, unknown>;
      }>;
      scheduling?: string;
      seeding?: string;
    };

    // Rules and settings
    matchDuration?: number; // in minutes
    tiebreakerRules: string[];
    statTier: number;
  };
  tags: string[];
  popularity: number; // for sorting
  isRecommended: boolean;
}

// Predefined tournament templates
export const TOURNAMENT_TEMPLATES: TournamentTemplate[] = [
  {
    id: 'rugby-knockout-8',
    name: 'Rugby Knockout Tournament',
    description: 'Classic single-elimination rugby tournament for 8 teams',
    category: 'sports',
    sport: 'rugby',
    estimatedDuration: '4-6 hours',
    recommendedTeams: {
      min: 4,
      max: 16,
      optimal: 8,
    },
    defaultConfig: {
      registrationOpen: true,
      maxTeams: 8,
      minPlayersPerTeam: 15,
      maxPlayersPerTeam: 23,
      allowSubstitutes: true,
      plugins: {
        sport: 'rugby',
        phases: [
          {
            pluginId: 'single-elimination',
            phaseName: 'Knockout Stage',
            settings: {
              allowThirdPlace: true,
              byeHandling: 'random',
            },
          },
        ],
        seeding: 'ranked',
      },
      matchDuration: 80,
      tiebreakerRules: ['Extra Time', 'Penalty Shootout'],
      statTier: 2,
    },
    tags: ['rugby', 'knockout', 'single-elimination', 'quick'],
    popularity: 95,
    isRecommended: true,
  },
  {
    id: 'football-league-12',
    name: 'Football Round Robin League',
    description:
      'Round robin football league for 12 teams with home/away matches',
    category: 'sports',
    sport: 'football',
    estimatedDuration: '3-4 months',
    recommendedTeams: {
      min: 6,
      max: 20,
      optimal: 12,
    },
    defaultConfig: {
      registrationOpen: true,
      maxTeams: 12,
      minPlayersPerTeam: 11,
      maxPlayersPerTeam: 25,
      allowSubstitutes: true,
      plugins: {
        sport: 'football',
        phases: [
          {
            pluginId: 'round-robin',
            phaseName: 'League Stage',
            settings: {
              homeAndAway: true,
              pointsForWin: 3,
              pointsForDraw: 1,
              pointsForLoss: 0,
            },
          },
        ],
        scheduling: 'greedy',
        seeding: 'random',
      },
      matchDuration: 90,
      tiebreakerRules: ['Goal Difference', 'Goals Scored', 'Head-to-Head'],
      statTier: 3,
    },
    tags: ['football', 'league', 'round-robin', 'long-term'],
    popularity: 88,
    isRecommended: true,
  },
  {
    id: 'basketball-bracket-16',
    name: 'Basketball March Madness Style',
    description: 'Single-elimination basketball tournament with 16 teams',
    category: 'sports',
    sport: 'basketball',
    estimatedDuration: '2-3 days',
    recommendedTeams: {
      min: 8,
      max: 32,
      optimal: 16,
    },
    defaultConfig: {
      registrationOpen: true,
      maxTeams: 16,
      minPlayersPerTeam: 5,
      maxPlayersPerTeam: 12,
      allowSubstitutes: true,
      plugins: {
        sport: 'basketball',
        phases: [
          {
            pluginId: 'single-elimination',
            phaseName: 'Tournament Bracket',
            settings: {
              allowThirdPlace: false,
              byeHandling: 'seeded',
            },
          },
        ],
        seeding: 'ranked',
        scheduling: 'day-bucket',
      },
      matchDuration: 48,
      tiebreakerRules: ['Overtime'],
      statTier: 2,
    },
    tags: ['basketball', 'bracket', 'march-madness', 'elimination'],
    popularity: 92,
    isRecommended: true,
  },
  {
    id: 'corporate-mixed-sports',
    name: 'Corporate Mixed Sports Day',
    description: 'Multi-sport tournament for corporate team building',
    category: 'corporate',
    sport: 'mixed',
    estimatedDuration: '1 day',
    recommendedTeams: {
      min: 6,
      max: 12,
      optimal: 8,
    },
    defaultConfig: {
      registrationOpen: true,
      maxTeams: 8,
      minPlayersPerTeam: 6,
      maxPlayersPerTeam: 10,
      allowSubstitutes: true,
      plugins: {
        sport: 'mixed',
        phases: [
          {
            pluginId: 'round-robin',
            phaseName: 'Group Stage',
            settings: {
              homeAndAway: false,
              pointsForWin: 3,
              pointsForDraw: 1,
            },
          },
          {
            pluginId: 'single-elimination',
            phaseName: 'Finals',
            settings: {
              allowThirdPlace: true,
              qualifyingTeams: 4,
            },
          },
        ],
        scheduling: 'greedy',
        seeding: 'group-standings',
      },
      matchDuration: 30,
      tiebreakerRules: ['Points Difference', 'Head-to-Head'],
      statTier: 1,
    },
    tags: ['corporate', 'team-building', 'mixed-sports', 'fun'],
    popularity: 75,
    isRecommended: false,
  },
  {
    id: 'community-football-cup',
    name: 'Community Football Cup',
    description:
      'Local community football tournament with group stage and knockouts',
    category: 'community',
    sport: 'football',
    estimatedDuration: '2-3 weeks',
    recommendedTeams: {
      min: 8,
      max: 24,
      optimal: 16,
    },
    defaultConfig: {
      registrationOpen: true,
      maxTeams: 16,
      minPlayersPerTeam: 11,
      maxPlayersPerTeam: 20,
      allowSubstitutes: true,
      plugins: {
        sport: 'football',
        phases: [
          {
            pluginId: 'round-robin',
            phaseName: 'Group Stage',
            settings: {
              groupSize: 4,
              homeAndAway: false,
              pointsForWin: 3,
              pointsForDraw: 1,
            },
          },
          {
            pluginId: 'single-elimination',
            phaseName: 'Knockout Stage',
            settings: {
              allowThirdPlace: true,
              qualifyingTeams: 8,
            },
          },
        ],
        scheduling: 'day-bucket',
        seeding: 'random',
      },
      matchDuration: 90,
      tiebreakerRules: ['Goal Difference', 'Goals Scored', 'Penalty Shootout'],
      statTier: 2,
    },
    tags: ['community', 'football', 'groups', 'knockout', 'local'],
    popularity: 82,
    isRecommended: true,
  },
  {
    id: 'school-inter-house',
    name: 'School Inter-House Competition',
    description: 'Multi-sport inter-house competition for schools',
    category: 'educational',
    sport: 'mixed',
    estimatedDuration: '1 week',
    recommendedTeams: {
      min: 4,
      max: 8,
      optimal: 6,
    },
    defaultConfig: {
      registrationOpen: false,
      maxTeams: 6,
      minPlayersPerTeam: 20,
      maxPlayersPerTeam: 50,
      allowSubstitutes: true,
      plugins: {
        sport: 'mixed',
        phases: [
          {
            pluginId: 'round-robin',
            phaseName: 'All Sports League',
            settings: {
              homeAndAway: false,
              pointsForWin: 3,
              pointsForDraw: 1,
              multiSport: true,
            },
          },
        ],
        scheduling: 'day-bucket',
        seeding: 'house-ranking',
      },
      matchDuration: 45,
      tiebreakerRules: ['Total Points', 'Head-to-Head', 'Spirit Award'],
      statTier: 1,
    },
    tags: ['school', 'inter-house', 'educational', 'multi-sport'],
    popularity: 68,
    isRecommended: false,
  },
];

// Template filtering and search functions
export function getTemplatesByCategory(
  category: TemplateCategory
): TournamentTemplate[] {
  return TOURNAMENT_TEMPLATES.filter(
    (template) => template.category === category
  );
}

export function getRecommendedTemplates(): TournamentTemplate[] {
  return TOURNAMENT_TEMPLATES.filter((template) => template.isRecommended).sort(
    (a, b) => b.popularity - a.popularity
  );
}

export function searchTemplates(query: string): TournamentTemplate[] {
  const lowercaseQuery = query.toLowerCase();
  return TOURNAMENT_TEMPLATES.filter(
    (template) =>
      template.name.toLowerCase().includes(lowercaseQuery) ||
      template.description.toLowerCase().includes(lowercaseQuery) ||
      template.sport.toLowerCase().includes(lowercaseQuery) ||
      template.tags.some((tag) => tag.toLowerCase().includes(lowercaseQuery))
  ).sort((a, b) => b.popularity - a.popularity);
}

export function getTemplateById(id: string): TournamentTemplate | undefined {
  return TOURNAMENT_TEMPLATES.find((template) => template.id === id);
}

// Template validation schema
export const templateSelectionSchema = z.object({
  templateId: z.string().optional(),
  customConfig: z
    .object({
      maxTeams: z.number().min(2).max(128),
      minPlayersPerTeam: z.number().min(1),
      maxPlayersPerTeam: z.number().min(1),
      allowSubstitutes: z.boolean(),
      registrationOpen: z.boolean(),
    })
    .optional(),
});

export type TemplateSelection = z.infer<typeof templateSelectionSchema>;
