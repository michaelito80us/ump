import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  // Performance thresholds - P95 ≤ 200ms as per T-17.2 requirements
  thresholds: {
    http_req_duration: ['p(95)<200'], // 95th percentile under 200ms
    http_req_failed: ['rate<0.1'], // Error rate under 10%
    errors: ['rate<0.1'], // Custom error rate under 10%
  },

  // Load testing stages
  stages: [
    { duration: '2m', target: 10 }, // Ramp up to 10 users over 2 minutes
    { duration: '5m', target: 10 }, // Stay at 10 users for 5 minutes
    { duration: '2m', target: 20 }, // Ramp up to 20 users over 2 minutes
    { duration: '5m', target: 20 }, // Stay at 20 users for 5 minutes
    { duration: '2m', target: 0 }, // Ramp down to 0 users over 2 minutes
  ],
};

// Base URL - can be overridden via environment variable
/* global __ENV */
const BASE_URL = __ENV.TARGET_URL || 'http://localhost:3000';
const API_URL = `${BASE_URL}/api/graphql`;

// GraphQL queries for testing
const QUERIES = {
  // Tournament listing query
  GET_TOURNAMENTS: `
    query GetTournaments {
      tournaments {
        id
        name
        status
        startDate
        endDate
      }
    }
  `,

  // Match listing query
  GET_MATCHES: `
    query GetMatches($tournamentId: ID!) {
      matches(tournamentId: $tournamentId) {
        id
        status
        scheduledTime
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
  `,

  // Live scores query
  GET_LIVE_SCORES: `
    query GetLiveScores {
      liveMatches {
        id
        status
        currentScore {
          home
          away
        }
        lastUpdate
      }
    }
  `,
};

// Test data
const TEST_TOURNAMENT_ID = 'test-tournament-1';

// Helper function to make GraphQL requests
function makeGraphQLRequest(query, variables = {}) {
  const payload = JSON.stringify({
    query,
    variables,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    timeout: '30s',
  };

  return http.post(API_URL, payload, params);
}

// Main test function
export default function () {
  // Test 1: Get tournaments list
  let response = makeGraphQLRequest(QUERIES.GET_TOURNAMENTS);

  const tournamentsCheck = check(response, {
    'tournaments query status is 200': (r) => r.status === 200,
    'tournaments query response time < 200ms': (r) => r.timings.duration < 200,
    'tournaments query has valid response': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && Array.isArray(body.data.tournaments);
      } catch (_e) {
        return false;
      }
    },
  });

  errorRate.add(!tournamentsCheck);

  sleep(1);

  // Test 2: Get matches for a tournament
  response = makeGraphQLRequest(QUERIES.GET_MATCHES, {
    tournamentId: TEST_TOURNAMENT_ID,
  });

  const matchesCheck = check(response, {
    'matches query status is 200': (r) => r.status === 200,
    'matches query response time < 200ms': (r) => r.timings.duration < 200,
    'matches query has valid response': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && Array.isArray(body.data.matches);
      } catch (_e) {
        return false;
      }
    },
  });

  errorRate.add(!matchesCheck);

  sleep(1);

  // Test 3: Get live scores
  response = makeGraphQLRequest(QUERIES.GET_LIVE_SCORES);

  const liveScoresCheck = check(response, {
    'live scores query status is 200': (r) => r.status === 200,
    'live scores query response time < 200ms': (r) => r.timings.duration < 200,
    'live scores query has valid response': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && Array.isArray(body.data.liveMatches);
      } catch (_e) {
        return false;
      }
    },
  });

  errorRate.add(!liveScoresCheck);

  sleep(1);

  // Test 4: Health check endpoint
  response = http.get(`${BASE_URL}/api/health`);

  const healthCheck = check(response, {
    'health check status is 200': (r) => r.status === 200,
    'health check response time < 100ms': (r) => r.timings.duration < 100,
  });

  errorRate.add(!healthCheck);

  sleep(2);
}

// Setup function - runs once before the test
export function setup() {
  console.log('Starting k6 load test for UMP platform');
  console.log(`Target URL: ${BASE_URL}`);
  console.log('Performance target: P95 ≤ 200ms');

  // Verify the API is accessible
  const healthResponse = http.get(`${BASE_URL}/api/health`);
  if (healthResponse.status !== 200) {
    console.error(`Health check failed: ${healthResponse.status}`);
    console.error(`Response: ${healthResponse.body}`);
  }

  return {
    baseUrl: BASE_URL,
    apiUrl: API_URL,
  };
}

// Teardown function - runs once after the test
export function teardown(data) {
  console.log('k6 load test completed');
  console.log(`Tested against: ${data.baseUrl}`);
}
