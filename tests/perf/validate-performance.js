#!/usr/bin/env node

/**
 * Performance Validation Script for T-17.2
 * Validates k6 test results against performance requirements
 * P95 response time must be <= 200ms
 */

const fs = require('fs');

// Performance thresholds
const THRESHOLDS = {
  P95_RESPONSE_TIME_MS: 200,
  ERROR_RATE_PERCENT: 10,
  MIN_SUCCESS_RATE_PERCENT: 90,
};

/**
 * Parse k6 JSON results and validate against thresholds
 * @param {string} resultsPath - Path to k6 results JSON file
 * @returns {Object} Validation results
 */
function validatePerformance(resultsPath = 'results.json') {
  try {
    if (!fs.existsSync(resultsPath)) {
      throw new Error(`Results file not found: ${resultsPath}`);
    }

    const resultsData = fs.readFileSync(resultsPath, 'utf8');
    const results = JSON.parse(resultsData);

    // Extract metrics from k6 results
    const metrics = results.metrics || {};

    // Get P95 response time (http_req_duration)
    const httpReqDuration = metrics.http_req_duration || {};
    const p95ResponseTime = httpReqDuration.values?.['p(95)'] || 0;

    // Get error rate
    const httpReqFailed = metrics.http_req_failed || {};
    const errorRate = (httpReqFailed.values?.rate || 0) * 100;

    // Get success rate
    const successRate = 100 - errorRate;

    // Get total requests
    const httpReqs = metrics.http_reqs || {};
    const totalRequests = httpReqs.values?.count || 0;

    // Get VUs
    const vus = metrics.vus || {};
    const maxVUs = vus.values?.max || 0;

    // Validation results
    const validation = {
      timestamp: new Date().toISOString(),
      metrics: {
        p95ResponseTime: Math.round(p95ResponseTime),
        errorRate: Math.round(errorRate * 100) / 100,
        successRate: Math.round(successRate * 100) / 100,
        totalRequests,
        maxVUs,
      },
      thresholds: THRESHOLDS,
      passed: {
        p95ResponseTime: p95ResponseTime <= THRESHOLDS.P95_RESPONSE_TIME_MS,
        errorRate: errorRate <= THRESHOLDS.ERROR_RATE_PERCENT,
        successRate: successRate >= THRESHOLDS.MIN_SUCCESS_RATE_PERCENT,
      },
    };

    validation.overallPassed = Object.values(validation.passed).every(Boolean);

    return validation;
  } catch (error) {
    return {
      error: error.message,
      timestamp: new Date().toISOString(),
      overallPassed: false,
    };
  }
}

/**
 * Generate performance report
 * @param {Object} validation - Validation results
 * @returns {string} Formatted report
 */
function generateReport(validation) {
  if (validation.error) {
    return `❌ Performance Validation Failed\n\nError: ${validation.error}\n`;
  }

  const { metrics, thresholds, passed, overallPassed } = validation;

  let report = `\n🎯 T-17.2 Performance Validation Report\n`;
  report += `📅 Timestamp: ${validation.timestamp}\n\n`;

  report += `📊 Performance Metrics:\n`;
  report += `  • P95 Response Time: ${metrics.p95ResponseTime}ms ${passed.p95ResponseTime ? '✅' : '❌'} (threshold: ≤${thresholds.P95_RESPONSE_TIME_MS}ms)\n`;
  report += `  • Error Rate: ${metrics.errorRate}% ${passed.errorRate ? '✅' : '❌'} (threshold: ≤${thresholds.ERROR_RATE_PERCENT}%)\n`;
  report += `  • Success Rate: ${metrics.successRate}% ${passed.successRate ? '✅' : '❌'} (threshold: ≥${thresholds.MIN_SUCCESS_RATE_PERCENT}%)\n`;
  report += `  • Total Requests: ${metrics.totalRequests}\n`;
  report += `  • Max Virtual Users: ${metrics.maxVUs}\n\n`;

  if (overallPassed) {
    report += `🎉 Overall Result: PASSED ✅\n`;
    report += `\nAll performance requirements for T-17.2 have been met!\n`;
  } else {
    report += `❌ Overall Result: FAILED\n`;
    report += `\nPerformance requirements not met. Please review and optimize.\n`;

    const failedChecks = Object.entries(passed)
      .filter(([_, passed]) => !passed)
      .map(([check]) => check);

    report += `\nFailed checks: ${failedChecks.join(', ')}\n`;
  }

  return report;
}

/**
 * Save validation results to file
 * @param {Object} validation - Validation results
 * @param {string} outputPath - Output file path
 */
function saveResults(validation, outputPath = 'performance-validation.json') {
  try {
    fs.writeFileSync(outputPath, JSON.stringify(validation, null, 2));
    console.log(`📁 Results saved to: ${outputPath}`);
  } catch (error) {
    console.error(`❌ Failed to save results: ${error.message}`);
  }
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2);
  const resultsFile = args[0] || 'results.json';
  const outputFile = args[1] || 'performance-validation.json';

  console.log(`🔍 Validating performance results from: ${resultsFile}`);

  const validation = validatePerformance(resultsFile);
  const report = generateReport(validation);

  console.log(report);

  // Save detailed results
  saveResults(validation, outputFile);

  // Exit with appropriate code
  process.exit(validation.overallPassed ? 0 : 1);
}

// Export for testing
module.exports = {
  validatePerformance,
  generateReport,
  saveResults,
  THRESHOLDS,
};

// Run if called directly
if (require.main === module) {
  main();
}
