# K6 Performance Testing Suite - T-17.2

## Overview

This directory contains the K6 performance testing suite for the UMP (Universal Match Platform) project, implementing **T-17.2: Load & Resilience Testing**. The goal is to ensure the platform meets performance requirements with a **P95 response time ≤ 200ms** under load.

## Performance Requirements

- **P95 Response Time**: ≤ 200ms
- **Error Rate**: ≤ 10%
- **Success Rate**: ≥ 90%
- **Target Load**: Up to 20 concurrent users
- **Test Frequency**: Nightly CI runs

## Files Structure

```
tests/perf/
├── README.md                 # This documentation
├── package.json             # NPM scripts and metadata
├── k6-load.js              # Main load testing script
├── k6-scenarios.js         # Comprehensive test scenarios
├── validate-performance.js  # Performance validation script
└── results/                # Test results (generated)
    ├── results.json
    ├── summary.json
    └── performance-validation.json
```

## Prerequisites

### 1. Install K6

**Windows (using Chocolatey):**

```powershell
choco install k6
```

**Windows (using Winget):**

```powershell
winget install k6
```

**macOS (using Homebrew):**

```bash
brew install k6
```

**Linux (using package manager):**

```bash
# Ubuntu/Debian
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

### 2. Verify Installation

```bash
k6 version
```

## Quick Start

### 1. Navigate to Performance Tests Directory

```bash
cd tests/perf
```

### 2. Run Basic Load Test

```bash
npm run test:local
```

### 3. Run Comprehensive Scenarios

```bash
npm run test:scenarios
```

### 4. Validate Results

```bash
npm run validate-p95
```

## Available NPM Scripts

| Script             | Description                       | Usage                      |
| ------------------ | --------------------------------- | -------------------------- |
| `test`             | Run basic load test               | `npm run test`             |
| `test:scenarios`   | Run comprehensive scenarios       | `npm run test:scenarios`   |
| `test:local`       | Test against localhost:3000       | `npm run test:local`       |
| `test:staging`     | Test against staging environment  | `npm run test:staging`     |
| `test:production`  | Test against production           | `npm run test:production`  |
| `test:smoke`       | Quick smoke test (1 user, 30s)    | `npm run test:smoke`       |
| `test:load`        | Standard load test (10 users, 5m) | `npm run test:load`        |
| `test:stress`      | Stress test (50 users, 10m)       | `npm run test:stress`      |
| `test:spike`       | Spike test (100 users, 2m)        | `npm run test:spike`       |
| `test:with-report` | Generate JSON reports             | `npm run test:with-report` |
| `test:dashboard`   | Run with web dashboard            | `npm run test:dashboard`   |
| `validate-p95`     | Validate performance results      | `npm run validate-p95`     |

## Test Scripts

### k6-load.js

Main load testing script that:

- Tests core GraphQL endpoints (GetTournaments, GetMatches, GetLiveScores)
- Tests health check endpoint
- Validates P95 response time ≤ 200ms
- Ramps up to 20 concurrent users
- Includes setup/teardown phases

### k6-scenarios.js

Comprehensive test scenarios covering:

- Tournament creation and management
- Match scoring and updates
- Real-time score updates
- Spectator load simulation
- Different user behavior patterns

### validate-performance.js

Node.js script that:

- Parses K6 JSON results
- Validates against T-17.2 requirements
- Generates performance reports
- Exits with appropriate status codes for CI

## Environment Variables

| Variable                  | Description             | Default                 |
| ------------------------- | ----------------------- | ----------------------- |
| `BASE_URL`                | Target server URL       | `http://localhost:3000` |
| `API_TOKEN`               | Authentication token    | `test-token-123`        |
| `VUS`                     | Number of virtual users | `20`                    |
| `DURATION`                | Test duration           | `5m`                    |
| `K6_WEB_DASHBOARD`        | Enable web dashboard    | `false`                 |
| `K6_WEB_DASHBOARD_EXPORT` | Export dashboard report | `report.html`           |

## Running Tests

### Local Development

```bash
# Start your local server first
cd ../../apps/web
npm run dev

# In another terminal, run performance tests
cd tests/perf
npm run test:local
```

### Custom Configuration

```bash
# Custom URL and load
k6 run --env BASE_URL=https://your-server.com --vus 30 --duration 10m k6-load.js

# With detailed output
k6 run --out json=results.json --summary-export=summary.json k6-load.js

# With web dashboard
k6 run --env K6_WEB_DASHBOARD=true --env K6_WEB_DASHBOARD_EXPORT=report.html k6-load.js
```

### CI/CD Integration

The tests are automatically run in GitHub Actions:

- **Schedule**: Nightly at 2:00 AM UTC
- **Trigger**: Manual via `workflow_dispatch`
- **Workflow**: `.github/workflows/k6-performance.yml`

## Performance Thresholds

The following thresholds are enforced:

```javascript
export let options = {
  thresholds: {
    'http_req_duration{p(95)}': ['p(95)<200'], // P95 < 200ms
    http_req_failed: ['rate<0.1'], // Error rate < 10%
    http_req_duration: ['med<100'], // Median < 100ms
    http_reqs: ['count>100'], // Min 100 requests
  },
};
```

## Interpreting Results

### Success Criteria

✅ **PASSED** when:

- P95 response time ≤ 200ms
- Error rate ≤ 10%
- Success rate ≥ 90%

### Key Metrics to Monitor

- **http_req_duration**: Response time statistics
- **http_req_failed**: Error rate
- **http_reqs**: Total requests per second
- **vus**: Virtual users
- **data_received/sent**: Network throughput

### Sample Output

```
🎯 T-17.2 Performance Validation Report
📅 Timestamp: 2025-01-20T10:30:00.000Z

📊 Performance Metrics:
  • P95 Response Time: 185ms ✅ (threshold: ≤200ms)
  • Error Rate: 2.1% ✅ (threshold: ≤10%)
  • Success Rate: 97.9% ✅ (threshold: ≥90%)
  • Total Requests: 1,247
  • Max Virtual Users: 20

🎉 Overall Result: PASSED ✅

All performance requirements for T-17.2 have been met!
```

## Troubleshooting

### Common Issues

1. **K6 not found**

   ```bash
   npm run install-k6
   # Follow installation instructions above
   ```

2. **Connection refused**

   - Ensure your server is running
   - Check the BASE_URL environment variable
   - Verify network connectivity

3. **High response times**

   - Check server resources (CPU, memory)
   - Review database performance
   - Analyze network latency
   - Consider caching strategies

4. **High error rates**
   - Check server logs for errors
   - Verify API endpoints are accessible
   - Review authentication tokens
   - Check rate limiting settings

### Debug Mode

```bash
# Run with verbose output
k6 run --verbose k6-load.js

# Run with HTTP debug
k6 run --http-debug k6-load.js

# Run single iteration for debugging
k6 run --vus 1 --iterations 1 k6-load.js
```

## Performance Optimization Tips

1. **Database Optimization**

   - Add proper indexes
   - Optimize GraphQL queries
   - Use connection pooling
   - Implement query caching

2. **Application Optimization**

   - Enable response compression
   - Implement CDN for static assets
   - Use Redis for session storage
   - Optimize bundle sizes

3. **Infrastructure Optimization**
   - Scale horizontally with load balancers
   - Use auto-scaling groups
   - Implement health checks
   - Monitor resource utilization

## Contributing

When adding new performance tests:

1. Follow existing patterns in `k6-load.js`
2. Add appropriate thresholds
3. Update this README
4. Test locally before committing
5. Ensure CI passes

## Related Documentation

- [K6 Documentation](https://k6.io/docs/)
- [GraphQL Performance Best Practices](https://graphql.org/learn/best-practices/)
- [UMP API Documentation](../../docs/api/)
- [T-17.2 Implementation Task](../../docs/implementation-task-list.v3.md)

## Support

For questions or issues:

- Check existing GitHub issues
- Review server logs
- Contact the development team
- Refer to K6 community resources
