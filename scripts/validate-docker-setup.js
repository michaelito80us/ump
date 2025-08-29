#!/usr/bin/env node

/**
 * Docker Compose Setup Validation Script
 *
 * This script validates that the Docker Compose setup is working correctly
 * by checking service health, connectivity, and basic functionality.
 */

const { execSync } = require('child_process');
const http = require('http');
const _https = require('https');

const SERVICES = {
  postgres: { port: 5432, type: 'tcp' },
  redis: { port: 6379, type: 'tcp' },
  backend: { port: 4001, type: 'http', path: '/health' },
  gateway: { port: 3000, type: 'http', path: '/health' },
  admin: { port: 3002, type: 'http', path: '/api/health' },
  mobile: { port: 3001, type: 'http', path: '/api/health' },
};

const COLORS = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function checkDockerCompose() {
  try {
    execSync('docker compose version', { stdio: 'pipe' });
    log('✓ Docker Compose is available', 'green');
    return true;
  } catch (_error) {
    log('✗ Docker Compose is not available', 'red');
    log(
      'Please install Docker Desktop: https://www.docker.com/products/docker-desktop/',
      'yellow'
    );
    return false;
  }
}

function checkServicesRunning() {
  try {
    const output = execSync('docker compose ps --format json', {
      encoding: 'utf8',
    });
    const services = output
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line));

    log('\nService Status:', 'blue');
    let allRunning = true;

    for (const service of services) {
      const isRunning = service.State === 'running';
      const isHealthy = service.Health === 'healthy' || service.Health === '';

      if (isRunning && isHealthy) {
        log(
          `✓ ${service.Service}: ${service.State} (${service.Health || 'no health check'})`,
          'green'
        );
      } else {
        log(
          `✗ ${service.Service}: ${service.State} (${service.Health || 'no health check'})`,
          'red'
        );
        allRunning = false;
      }
    }

    return allRunning;
  } catch (_error) {
    log('✗ Failed to check service status', 'red');
    log('Run: docker compose ps', 'yellow');
    return false;
  }
}

function checkHttpEndpoint(port, path = '/') {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: port,
      path: path,
      method: 'GET',
      timeout: 5000,
    };

    const req = http.request(options, (res) => {
      resolve({ success: true, status: res.statusCode });
    });

    req.on('error', (error) => {
      resolve({ success: false, error: error.message });
    });

    req.on('timeout', () => {
      resolve({ success: false, error: 'Timeout' });
    });

    req.end();
  });
}

function checkTcpPort(port) {
  return new Promise((resolve) => {
    const net = require('net');
    const socket = new net.Socket();

    socket.setTimeout(5000);

    socket.on('connect', () => {
      socket.destroy();
      resolve({ success: true });
    });

    socket.on('error', (error) => {
      resolve({ success: false, error: error.message });
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve({ success: false, error: 'Timeout' });
    });

    socket.connect(port, 'localhost');
  });
}

async function checkServiceConnectivity() {
  log('\nConnectivity Tests:', 'blue');
  let allConnected = true;

  for (const [serviceName, config] of Object.entries(SERVICES)) {
    let result;

    if (config.type === 'http') {
      result = await checkHttpEndpoint(config.port, config.path);
    } else {
      result = await checkTcpPort(config.port);
    }

    if (result.success) {
      const status = result.status ? ` (${result.status})` : '';
      log(
        `✓ ${serviceName}:${config.port}${config.path || ''}${status}`,
        'green'
      );
    } else {
      log(
        `✗ ${serviceName}:${config.port}${config.path || ''} - ${result.error}`,
        'red'
      );
      allConnected = false;
    }
  }

  return allConnected;
}

async function checkGraphQLEndpoints() {
  log('\nGraphQL Endpoints:', 'blue');

  const endpoints = [
    { name: 'Backend GraphQL', port: 4001, path: '/graphql' },
    { name: 'Gateway GraphQL', port: 3000, path: '/graphql' },
  ];

  let allWorking = true;

  for (const endpoint of endpoints) {
    const result = await checkHttpEndpoint(endpoint.port, endpoint.path);

    if (result.success) {
      log(
        `✓ ${endpoint.name}: http://localhost:${endpoint.port}${endpoint.path}`,
        'green'
      );
    } else {
      log(`✗ ${endpoint.name}: ${result.error}`, 'red');
      allWorking = false;
    }
  }

  return allWorking;
}

function printSummary(results) {
  log('\n' + '='.repeat(50), 'blue');
  log('VALIDATION SUMMARY', 'blue');
  log('='.repeat(50), 'blue');

  const allPassed = results.every((r) => r.passed);

  for (const result of results) {
    const status = result.passed ? '✓' : '✗';
    const color = result.passed ? 'green' : 'red';
    log(`${status} ${result.name}`, color);
  }

  log('\n' + '='.repeat(50), 'blue');

  if (allPassed) {
    log(
      '🎉 All checks passed! Your Docker setup is working correctly.',
      'green'
    );
    log('\nYou can now access:', 'blue');
    log('• Admin App: http://localhost:3002', 'yellow');
    log('• Mobile App: http://localhost:3001', 'yellow');
    log('• API Gateway: http://localhost:3000/graphql', 'yellow');
    log('• Backend API: http://localhost:4001/graphql', 'yellow');
  } else {
    log('❌ Some checks failed. Please review the errors above.', 'red');
    log('\nTroubleshooting tips:', 'yellow');
    log('• Run: docker compose ps', 'yellow');
    log('• Run: docker compose logs [service-name]', 'yellow');
    log('• Try: docker compose down && docker compose up -d', 'yellow');
  }
}

async function main() {
  log('🐳 Docker Compose Setup Validation', 'blue');
  log('='.repeat(50), 'blue');

  const results = [];

  // Check Docker Compose availability
  const dockerAvailable = checkDockerCompose();
  results.push({ name: 'Docker Compose Available', passed: dockerAvailable });

  if (!dockerAvailable) {
    printSummary(results);
    process.exit(1);
  }

  // Check if services are running
  const servicesRunning = checkServicesRunning();
  results.push({ name: 'All Services Running', passed: servicesRunning });

  // Check service connectivity
  const connectivity = await checkServiceConnectivity();
  results.push({ name: 'Service Connectivity', passed: connectivity });

  // Check GraphQL endpoints
  const graphql = await checkGraphQLEndpoints();
  results.push({ name: 'GraphQL Endpoints', passed: graphql });

  printSummary(results);

  const allPassed = results.every((r) => r.passed);
  process.exit(allPassed ? 0 : 1);
}

if (require.main === module) {
  main().catch((error) => {
    log(`\n❌ Validation failed: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = {
  main,
  checkDockerCompose,
  checkServicesRunning,
  checkServiceConnectivity,
};
