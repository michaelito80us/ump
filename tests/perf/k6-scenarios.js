import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';
import { SharedArray } from 'k6/data';

// Custom metrics
const errorRate = new Rate('errors');
const tournamentCreationRate = new Rate('tournament_creation_errors');
const matchScoringRate = new Rate('match_scoring_errors');
const realTimeUpdateRate = new Rate('realtime_update_errors');

// Test configuration for comprehensive scenarios
export const options = {
  scenarios: {
    // Scenario 1: Tournament Creation Load Test
    tournament_creation: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 5 }, // Ramp up to 5 concurrent tournament creators
        { duration: '3m', target: 5 }, // Maintain 5 users creating tournaments
        { duration: '1m', target: 0 }, // Ramp down
      ],
      exec: 'tournamentCreationScenario',
    },

    // Scenario 2: Match Scoring Under Load
    match_scoring: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 10 }, // Ramp up to 10 concurrent scorers
        { duration: '5m', target: 10 }, // Maintain load during peak scoring
        { duration: '1m', target: 0 }, // Ramp down
      ],
      exec: 'matchScoringScenario',
      startTime: '30s', // Start after tournament creation
    },

    // Scenario 3: Real-time Updates Stress Test
    realtime_updates: {
      executor: 'constant-vus',
      vus: 20,
      duration: '4m',
      exec: 'realTimeUpdatesScenario',
      startTime: '1m', // Start after tournaments are created
    },

    // Scenario 4: Spectator Load (Read-heavy)
    spectator_load: {
      executor: 'ramping-arrival-rate',
      startRate: 10,
      timeUnit: '1s',
      preAllocatedVUs: 50,
      maxVUs: 100,
      stages: [
        { duration: '2m', target: 20 }, // Ramp up to 20 requests/sec
        { duration: '3m', target: 50 }, // Peak spectator load
        { duration: '2m', target: 10 }, // Ramp down
      ],
      exec: 'spectatorLoadScenario',
      startTime: '2m',
    },
  },

  thresholds: {
    // Overall performance targets
    http_req_duration: ['p(95)<200'],
    http_req_failed: ['rate<0.05'],

    // Scenario-specific thresholds
    'http_req_duration{scenario:tournament_creation}': ['p(95)<500'], // Tournament creation can be slower
    'http_req_duration{scenario:match_scoring}': ['p(95)<150'], // Match scoring must be fast
    'http_req_duration{scenario:realtime_updates}': ['p(95)<100'], // Real-time updates must be very fast
    'http_req_duration{scenario:spectator_load}': ['p(95)<200'], // Spectator queries

    // Custom error rate thresholds
    tournament_creation_errors: ['rate<0.02'],
    match_scoring_errors: ['rate<0.01'],
    realtime_update_errors: ['rate<0.01'],
  },
};

// Base URL configuration
/* global __ENV */
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_URL = `${BASE_URL}/api/graphql`;
const _WS_URL = __ENV.WS_URL || 'ws://localhost:3000/api/graphql';

// Test data arrays
const tournamentNames = new SharedArray('tournament_names', function () {
  return [
    'Spring Championship 2025',
    'Summer League Tournament',
    'Autumn Classic',
    'Winter Cup',
    'Regional Qualifiers',
    'National Championship',
    'Youth Tournament',
    'Masters Division',
    'Open Tournament',
    'Elite Competition',
  ];
});

const teamNames = new SharedArray('team_names', function () {
  return [
    'Fire Dragons',
    'Thunder Bolts',
    'Lightning Strikes',
    'Storm Riders',
    'Phoenix Rising',
    'Eagle Warriors',
    'Titan Force',
    'Shadow Hunters',
    'Ice Wolves',
    'Golden Hawks',
    'Silver Bullets',
    'Crimson Tigers',
    'Blue Sharks',
    'Green Vipers',
    'Purple Panthers',
    'Orange Crushers',
  ];
});

// GraphQL mutations and queries
const MUTATIONS = {
  CREATE_TOURNAMENT: `
    mutation CreateTournament($input: CreateTournamentInput!) {
      createTournament(input: $input) {
        id
        name
        status
        startDate
        endDate
        maxTeams
      }
    }
  `,

  REGISTER_TEAM: `
    mutation RegisterTeam($tournamentId: ID!, $teamData: TeamInput!) {
      registerTeam(tournamentId: $tournamentId, teamData: $teamData) {
        id
        name
        tournamentId
        registrationTime
      }
    }
  `,

  UPDATE_MATCH_SCORE: `
    mutation UpdateMatchScore($matchId: ID!, $scoreUpdate: ScoreUpdateInput!) {
      updateMatchScore(matchId: $matchId, scoreUpdate: $scoreUpdate) {
        id
        status
        scores {
          teamId
          value
        }
        lastUpdate
      }
    }
  `,

  START_MATCH: `
    mutation StartMatch($matchId: ID!) {
      startMatch(matchId: $matchId) {
        id
        status
        startTime
      }
    }
  `,
};

const QUERIES = {
  GET_LIVE_TOURNAMENTS: `
    query GetLiveTournaments {
      tournaments(status: LIVE) {
        id
        name
        status
        currentMatches {
          id
          status
          teams {
            id
            name
          }
          scores {
            teamId
            value
          }
        }
      }
    }
  `,

  GET_TOURNAMENT_LEADERBOARD: `
    query GetTournamentLeaderboard($tournamentId: ID!) {
      tournament(id: $tournamentId) {
        id
        leaderboard {
          position
          team {
            id
            name
          }
          points
          matchesPlayed
          wins
          losses
        }
      }
    }
  `,

  GET_MATCH_DETAILS: `
    query GetMatchDetails($matchId: ID!) {
      match(id: $matchId) {
        id
        status
        scheduledTime
        startTime
        endTime
        teams {
          id
          name
        }
        scores {
          teamId
          value
          timestamp
        }
        events {
          id
          type
          timestamp
          data
        }
      }
    }
  `,
};

// Helper functions
function makeGraphQLRequest(query, variables = {}, tags = {}) {
  const payload = JSON.stringify({ query, variables });
  const params = {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    tags: tags,
    timeout: '30s',
  };

  return http.post(API_URL, payload, params);
}

function generateTournamentData() {
  const name =
    tournamentNames[Math.floor(Math.random() * tournamentNames.length)];
  const startDate = new Date(
    Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000
  ); // Random date in next 30 days
  const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days later

  return {
    name: `${name} ${Math.floor(Math.random() * 1000)}`,
    description: `Load test tournament created at ${new Date().toISOString()}`,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    maxTeams: 16,
    sport: 'GENERIC',
    format: 'SINGLE_ELIMINATION',
  };
}

function generateTeamData() {
  const name = teamNames[Math.floor(Math.random() * teamNames.length)];
  return {
    name: `${name} ${Math.floor(Math.random() * 1000)}`,
    description: `Load test team created at ${new Date().toISOString()}`,
    contactEmail: `team${Math.floor(Math.random() * 10000)}@loadtest.com`,
  };
}

// Scenario 1: Tournament Creation
export function tournamentCreationScenario() {
  const tournamentData = generateTournamentData();

  const response = makeGraphQLRequest(
    MUTATIONS.CREATE_TOURNAMENT,
    { input: tournamentData },
    { scenario: 'tournament_creation' }
  );

  const success = check(response, {
    'tournament creation status is 200': (r) => r.status === 200,
    'tournament creation response time < 500ms': (r) =>
      r.timings.duration < 500,
    'tournament created successfully': (r) => {
      try {
        const body = JSON.parse(r.body);
        return (
          body.data &&
          body.data.createTournament &&
          body.data.createTournament.id
        );
      } catch (_e) {
        return false;
      }
    },
  });

  tournamentCreationRate.add(!success);
  errorRate.add(!success);

  if (success && response.status === 200) {
    try {
      const tournament = JSON.parse(response.body).data.createTournament;

      // Register 2-4 teams for this tournament
      const numTeams = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < numTeams; i++) {
        const teamData = generateTeamData();
        const teamResponse = makeGraphQLRequest(
          MUTATIONS.REGISTER_TEAM,
          { tournamentId: tournament.id, teamData },
          { scenario: 'tournament_creation' }
        );

        check(teamResponse, {
          'team registration successful': (r) => r.status === 200,
        });

        sleep(0.5);
      }
    } catch (_e) {
      console.error('Error processing tournament creation response:', _e);
    }
  }

  sleep(2);
}

// Scenario 2: Match Scoring
export function matchScoringScenario() {
  // First, get available matches
  const response = makeGraphQLRequest(
    QUERIES.GET_LIVE_TOURNAMENTS,
    {},
    { scenario: 'match_scoring' }
  );

  const success = check(response, {
    'live tournaments query successful': (r) => r.status === 200,
    'match scoring response time < 150ms': (r) => r.timings.duration < 150,
  });

  if (success && response.status === 200) {
    try {
      const tournaments = JSON.parse(response.body).data.tournaments;

      if (tournaments && tournaments.length > 0) {
        const tournament =
          tournaments[Math.floor(Math.random() * tournaments.length)];

        if (tournament.currentMatches && tournament.currentMatches.length > 0) {
          const match =
            tournament.currentMatches[
              Math.floor(Math.random() * tournament.currentMatches.length)
            ];

          // Simulate score update
          const scoreUpdate = {
            teamId:
              match.teams[Math.floor(Math.random() * match.teams.length)].id,
            points: Math.floor(Math.random() * 10) + 1,
            timestamp: new Date().toISOString(),
          };

          const scoreResponse = makeGraphQLRequest(
            MUTATIONS.UPDATE_MATCH_SCORE,
            { matchId: match.id, scoreUpdate },
            { scenario: 'match_scoring' }
          );

          const scoreSuccess = check(scoreResponse, {
            'score update successful': (r) => r.status === 200,
            'score update response time < 150ms': (r) =>
              r.timings.duration < 150,
          });

          matchScoringRate.add(!scoreSuccess);
        }
      }
    } catch (_e) {
      console.error('Error in match scoring scenario:', _e);
      matchScoringRate.add(true);
    }
  }

  errorRate.add(!success);
  sleep(1);
}

// Scenario 3: Real-time Updates
export function realTimeUpdatesScenario() {
  // Simulate rapid polling for real-time updates
  const response = makeGraphQLRequest(
    QUERIES.GET_LIVE_TOURNAMENTS,
    {},
    { scenario: 'realtime_updates' }
  );

  const success = check(response, {
    'realtime updates query successful': (r) => r.status === 200,
    'realtime updates response time < 100ms': (r) => r.timings.duration < 100,
    'realtime updates has valid data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && Array.isArray(body.data.tournaments);
      } catch (_e) {
        return false;
      }
    },
  });

  realTimeUpdateRate.add(!success);
  errorRate.add(!success);

  // Short sleep to simulate real-time polling
  sleep(0.5);
}

// Scenario 4: Spectator Load
export function spectatorLoadScenario() {
  // Simulate spectator browsing behavior
  const actions = [
    () =>
      makeGraphQLRequest(
        QUERIES.GET_LIVE_TOURNAMENTS,
        {},
        { scenario: 'spectator_load' }
      ),
    () => {
      // Get a random tournament leaderboard
      const tournamentId = `tournament-${Math.floor(Math.random() * 100)}`;
      return makeGraphQLRequest(
        QUERIES.GET_TOURNAMENT_LEADERBOARD,
        { tournamentId },
        { scenario: 'spectator_load' }
      );
    },
    () => {
      // Get match details
      const matchId = `match-${Math.floor(Math.random() * 1000)}`;
      return makeGraphQLRequest(
        QUERIES.GET_MATCH_DETAILS,
        { matchId },
        { scenario: 'spectator_load' }
      );
    },
  ];

  // Randomly select an action
  const action = actions[Math.floor(Math.random() * actions.length)];
  const response = action();

  check(response, {
    'spectator query successful': (r) => r.status === 200,
    'spectator query response time < 200ms': (r) => r.timings.duration < 200,
  });

  // Spectators typically browse quickly
  sleep(Math.random() * 2);
}

// Setup function
export function setup() {
  console.log('🚀 Starting comprehensive K6 performance scenarios');
  console.log(`Target: ${BASE_URL}`);
  console.log(
    'Scenarios: Tournament Creation, Match Scoring, Real-time Updates, Spectator Load'
  );

  // Verify API accessibility
  const healthResponse = http.get(`${BASE_URL}/api/health`);
  if (healthResponse.status !== 200) {
    console.error(`❌ Health check failed: ${healthResponse.status}`);
    throw new Error('API not accessible');
  }

  console.log('✅ API health check passed');
  return { baseUrl: BASE_URL };
}

// Teardown function
export function teardown(data) {
  console.log('📊 Comprehensive performance test completed');
  console.log(`Tested scenarios against: ${data.baseUrl}`);
}
