#!/usr/bin/env node

/**
 * Performance Monitoring and Reporting Script for T-17.2
 * Tracks performance trends, generates reports, and integrates with CI
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  RESULTS_DIR: 'results',
  TRENDS_FILE: 'performance-trends.json',
  REPORT_FILE: 'performance-report.md',
  MAX_HISTORY: 30, // Keep last 30 test runs
  ALERT_THRESHOLDS: {
    P95_DEGRADATION_PERCENT: 20, // Alert if P95 increases by 20%
    ERROR_RATE_INCREASE_PERCENT: 5, // Alert if error rate increases by 5%
    CONSECUTIVE_FAILURES: 3, // Alert after 3 consecutive failures
  },
};

/**
 * Ensure results directory exists
 */
function ensureResultsDir() {
  if (!fs.existsSync(CONFIG.RESULTS_DIR)) {
    fs.mkdirSync(CONFIG.RESULTS_DIR, { recursive: true });
  }
}

/**
 * Load performance trends history
 * @returns {Array} Historical performance data
 */
function loadTrends() {
  const trendsPath = path.join(CONFIG.RESULTS_DIR, CONFIG.TRENDS_FILE);

  if (!fs.existsSync(trendsPath)) {
    return [];
  }

  try {
    const data = fs.readFileSync(trendsPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.warn(`⚠️  Failed to load trends: ${error.message}`);
    return [];
  }
}

/**
 * Save performance trends
 * @param {Array} trends - Performance trends data
 */
function saveTrends(trends) {
  const trendsPath = path.join(CONFIG.RESULTS_DIR, CONFIG.TRENDS_FILE);

  try {
    fs.writeFileSync(trendsPath, JSON.stringify(trends, null, 2));
  } catch (error) {
    console.error(`❌ Failed to save trends: ${error.message}`);
  }
}

/**
 * Extract performance metrics from k6 results
 * @param {string} resultsPath - Path to k6 results JSON
 * @returns {Object} Extracted metrics
 */
function extractMetrics(resultsPath) {
  try {
    const data = fs.readFileSync(resultsPath, 'utf8');
    const results = JSON.parse(data);
    const metrics = results.metrics || {};

    return {
      timestamp: new Date().toISOString(),
      p95ResponseTime: metrics.http_req_duration?.values?.['p(95)'] || 0,
      medianResponseTime: metrics.http_req_duration?.values?.['p(50)'] || 0,
      avgResponseTime: metrics.http_req_duration?.values?.avg || 0,
      errorRate: (metrics.http_req_failed?.values?.rate || 0) * 100,
      totalRequests: metrics.http_reqs?.values?.count || 0,
      requestRate: metrics.http_reqs?.values?.rate || 0,
      maxVUs: metrics.vus?.values?.max || 0,
      dataReceived: metrics.data_received?.values?.count || 0,
      dataSent: metrics.data_sent?.values?.count || 0,
      testDuration: results.state?.testRunDurationMs || 0,
      passed:
        (metrics.http_req_duration?.values?.['p(95)'] || 0) <= 200 &&
        (metrics.http_req_failed?.values?.rate || 0) * 100 <= 10,
    };
  } catch (error) {
    console.error(`❌ Failed to extract metrics: ${error.message}`);
    return null;
  }
}

/**
 * Add new performance data to trends
 * @param {Object} metrics - Current test metrics
 * @returns {Array} Updated trends
 */
function updateTrends(metrics) {
  if (!metrics) return [];

  let trends = loadTrends();

  // Add new data point
  trends.push(metrics);

  // Keep only recent history
  if (trends.length > CONFIG.MAX_HISTORY) {
    trends = trends.slice(-CONFIG.MAX_HISTORY);
  }

  saveTrends(trends);
  return trends;
}

/**
 * Analyze performance trends and detect issues
 * @param {Array} trends - Performance trends data
 * @returns {Object} Analysis results
 */
function analyzeTrends(trends) {
  if (trends.length < 2) {
    return {
      alerts: [],
      summary: 'Insufficient data for trend analysis',
    };
  }

  const current = trends[trends.length - 1];
  const previous = trends[trends.length - 2];
  const alerts = [];

  // Check for P95 degradation
  if (previous.p95ResponseTime > 0) {
    const p95Change =
      ((current.p95ResponseTime - previous.p95ResponseTime) /
        previous.p95ResponseTime) *
      100;
    if (p95Change > CONFIG.ALERT_THRESHOLDS.P95_DEGRADATION_PERCENT) {
      alerts.push({
        type: 'performance_degradation',
        severity: 'warning',
        message: `P95 response time increased by ${p95Change.toFixed(1)}% (${previous.p95ResponseTime.toFixed(0)}ms → ${current.p95ResponseTime.toFixed(0)}ms)`,
      });
    }
  }

  // Check for error rate increase
  const errorRateChange = current.errorRate - previous.errorRate;
  if (errorRateChange > CONFIG.ALERT_THRESHOLDS.ERROR_RATE_INCREASE_PERCENT) {
    alerts.push({
      type: 'error_rate_increase',
      severity: 'warning',
      message: `Error rate increased by ${errorRateChange.toFixed(1)}% (${previous.errorRate.toFixed(1)}% → ${current.errorRate.toFixed(1)}%)`,
    });
  }

  // Check for consecutive failures
  const recentResults = trends.slice(
    -CONFIG.ALERT_THRESHOLDS.CONSECUTIVE_FAILURES
  );
  const consecutiveFailures = recentResults.every((result) => !result.passed);
  if (
    consecutiveFailures &&
    recentResults.length >= CONFIG.ALERT_THRESHOLDS.CONSECUTIVE_FAILURES
  ) {
    alerts.push({
      type: 'consecutive_failures',
      severity: 'critical',
      message: `${CONFIG.ALERT_THRESHOLDS.CONSECUTIVE_FAILURES} consecutive test failures detected`,
    });
  }

  // Calculate trend statistics
  const last7Days = trends.slice(-7);
  const avgP95 =
    last7Days.reduce((sum, t) => sum + t.p95ResponseTime, 0) / last7Days.length;
  const avgErrorRate =
    last7Days.reduce((sum, t) => sum + t.errorRate, 0) / last7Days.length;
  const passRate =
    (last7Days.filter((t) => t.passed).length / last7Days.length) * 100;

  return {
    alerts,
    summary: {
      avgP95Last7Days: Math.round(avgP95),
      avgErrorRateLast7Days: Math.round(avgErrorRate * 100) / 100,
      passRateLast7Days: Math.round(passRate * 100) / 100,
      totalTests: trends.length,
      currentStatus: current.passed ? 'PASSING' : 'FAILING',
    },
  };
}

/**
 * Generate performance report
 * @param {Array} trends - Performance trends data
 * @param {Object} analysis - Trend analysis results
 * @returns {string} Markdown report
 */
function generateReport(trends, analysis) {
  if (trends.length === 0) {
    return '# Performance Report\n\nNo performance data available.\n';
  }

  const current = trends[trends.length - 1];
  const { summary, alerts } = analysis;

  let report = `# T-17.2 Performance Monitoring Report\n\n`;
  report += `**Generated:** ${new Date().toISOString()}\n\n`;

  // Current Status
  report += `## 🎯 Current Status\n\n`;
  report += `| Metric | Value | Status |\n`;
  report += `|--------|-------|--------|\n`;
  report += `| P95 Response Time | ${Math.round(current.p95ResponseTime)}ms | ${current.p95ResponseTime <= 200 ? '✅' : '❌'} |\n`;
  report += `| Error Rate | ${current.errorRate.toFixed(1)}% | ${current.errorRate <= 10 ? '✅' : '❌'} |\n`;
  report += `| Overall Status | ${current.passed ? 'PASSING' : 'FAILING'} | ${current.passed ? '✅' : '❌'} |\n`;
  report += `| Test Date | ${new Date(current.timestamp).toLocaleString()} | ℹ️ |\n\n`;

  // Alerts
  if (alerts.length > 0) {
    report += `## 🚨 Alerts\n\n`;
    alerts.forEach((alert) => {
      const icon = alert.severity === 'critical' ? '🔴' : '⚠️';
      report += `${icon} **${alert.type.replace('_', ' ').toUpperCase()}**: ${alert.message}\n\n`;
    });
  } else {
    report += `## ✅ No Active Alerts\n\nAll performance metrics are within acceptable ranges.\n\n`;
  }

  // Trend Summary
  if (summary.totalTests > 1) {
    report += `## 📊 7-Day Trend Summary\n\n`;
    report += `| Metric | Average |\n`;
    report += `|--------|---------|\n`;
    report += `| P95 Response Time | ${summary.avgP95Last7Days}ms |\n`;
    report += `| Error Rate | ${summary.avgErrorRateLast7Days}% |\n`;
    report += `| Pass Rate | ${summary.passRateLast7Days}% |\n`;
    report += `| Total Tests | ${summary.totalTests} |\n\n`;
  }

  // Recent Test History
  report += `## 📈 Recent Test History\n\n`;
  const recentTests = trends.slice(-10).reverse();
  report += `| Date | P95 (ms) | Error Rate | Status |\n`;
  report += `|------|----------|------------|--------|\n`;
  recentTests.forEach((test) => {
    const date = new Date(test.timestamp).toLocaleDateString();
    const status = test.passed ? '✅ PASS' : '❌ FAIL';
    report += `| ${date} | ${Math.round(test.p95ResponseTime)} | ${test.errorRate.toFixed(1)}% | ${status} |\n`;
  });

  report += `\n## 🔗 Links\n\n`;
  report += `- [Performance Test Scripts](./k6-load.js)\n`;
  report += `- [Test Scenarios](./k6-scenarios.js)\n`;
  report += `- [Validation Script](./validate-performance.js)\n`;
  report += `- [CI Workflow](../../.github/workflows/k6-performance.yml)\n`;

  return report;
}

/**
 * Save performance report
 * @param {string} report - Markdown report content
 */
function saveReport(report) {
  const reportPath = path.join(CONFIG.RESULTS_DIR, CONFIG.REPORT_FILE);

  try {
    fs.writeFileSync(reportPath, report);
    console.log(`📊 Performance report saved: ${reportPath}`);
  } catch (error) {
    console.error(`❌ Failed to save report: ${error.message}`);
  }
}

/**
 * Generate GitHub Actions summary
 * @param {Object} current - Current test metrics
 * @param {Object} analysis - Trend analysis
 */
function generateGitHubSummary(current, analysis) {
  if (!process.env.GITHUB_STEP_SUMMARY) {
    return;
  }

  let summary = `## 🎯 T-17.2 Performance Test Results\n\n`;

  if (current.passed) {
    summary += `### ✅ PASSED\n\n`;
  } else {
    summary += `### ❌ FAILED\n\n`;
  }

  summary += `| Metric | Value | Threshold | Status |\n`;
  summary += `|--------|-------|-----------|--------|\n`;
  summary += `| P95 Response Time | ${Math.round(current.p95ResponseTime)}ms | ≤200ms | ${current.p95ResponseTime <= 200 ? '✅' : '❌'} |\n`;
  summary += `| Error Rate | ${current.errorRate.toFixed(1)}% | ≤10% | ${current.errorRate <= 10 ? '✅' : '❌'} |\n`;
  summary += `| Total Requests | ${current.totalRequests} | - | ℹ️ |\n`;
  summary += `| Max VUs | ${current.maxVUs} | - | ℹ️ |\n\n`;

  if (analysis.alerts.length > 0) {
    summary += `### 🚨 Alerts\n\n`;
    analysis.alerts.forEach((alert) => {
      summary += `- ${alert.message}\n`;
    });
    summary += `\n`;
  }

  try {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
  } catch (error) {
    console.error(`❌ Failed to write GitHub summary: ${error.message}`);
  }
}

/**
 * Main monitoring function
 * @param {string} resultsPath - Path to k6 results JSON
 */
function monitor(resultsPath = 'results.json') {
  console.log(`🔍 Monitoring performance results from: ${resultsPath}`);

  ensureResultsDir();

  // Extract metrics from current test
  const metrics = extractMetrics(resultsPath);
  if (!metrics) {
    console.error('❌ Failed to extract performance metrics');
    process.exit(1);
  }

  // Update trends
  const trends = updateTrends(metrics);

  // Analyze trends
  const analysis = analyzeTrends(trends);

  // Generate and save report
  const report = generateReport(trends, analysis);
  saveReport(report);

  // Generate GitHub Actions summary
  generateGitHubSummary(metrics, analysis);

  // Output summary
  console.log(`\n📊 Performance Monitoring Summary:`);
  console.log(
    `   • P95 Response Time: ${Math.round(metrics.p95ResponseTime)}ms`
  );
  console.log(`   • Error Rate: ${metrics.errorRate.toFixed(1)}%`);
  console.log(`   • Status: ${metrics.passed ? 'PASSING ✅' : 'FAILING ❌'}`);
  console.log(`   • Alerts: ${analysis.alerts.length}`);

  if (analysis.alerts.length > 0) {
    console.log(`\n🚨 Active Alerts:`);
    analysis.alerts.forEach((alert) => {
      console.log(`   • ${alert.message}`);
    });
  }

  // Exit with appropriate code
  const hasCritical = analysis.alerts.some((a) => a.severity === 'critical');
  process.exit(hasCritical ? 1 : 0);
}

/**
 * CLI interface
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'monitor': {
      monitor(args[1]);
      break;
    }
    case 'report': {
      const trends = loadTrends();
      const analysis = analyzeTrends(trends);
      const report = generateReport(trends, analysis);
      console.log(report);
      break;
    }
    case 'trends': {
      console.log(JSON.stringify(loadTrends(), null, 2));
      break;
    }
    default: {
      console.log('Usage:');
      console.log('  node performance-monitor.js monitor [results.json]');
      console.log('  node performance-monitor.js report');
      console.log('  node performance-monitor.js trends');
      process.exit(1);
    }
  }
}

// Export for testing
module.exports = {
  extractMetrics,
  updateTrends,
  analyzeTrends,
  generateReport,
  CONFIG,
};

// Run if called directly
if (require.main === module) {
  main();
}
