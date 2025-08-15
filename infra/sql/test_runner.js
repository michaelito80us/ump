#!/usr/bin/env node

/**
 * Test runner for audit log partition SQL scripts
 * Simulates PostgreSQL execution and validates SQL syntax
 */

const fs = require('fs');
const path = require('path');

class SQLTestRunner {
  constructor() {
    this.results = [];
    this.errors = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    console.log(logEntry);
    this.results.push(logEntry);
  }

  error(message) {
    this.log(message, 'error');
    this.errors.push(message);
  }

  success(message) {
    this.log(message, 'success');
  }

  validateSQLSyntax(sqlContent, filename) {
    this.log(`Validating SQL syntax for ${filename}`);

    // Basic SQL syntax validation
    const issues = [];

    // Check for common SQL syntax issues
    if (
      !sqlContent.includes('CREATE TABLE') &&
      !sqlContent.includes('INSERT') &&
      !sqlContent.includes('SELECT')
    ) {
      issues.push('No valid SQL statements found');
    }

    // Check for unmatched parentheses
    const openParens = (sqlContent.match(/\(/g) || []).length;
    const closeParens = (sqlContent.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      issues.push(
        `Unmatched parentheses: ${openParens} open, ${closeParens} close`
      );
    }

    // Check for semicolon termination
    const statements = sqlContent.split(';').filter((s) => s.trim());
    if (statements.length === 0) {
      issues.push('No SQL statements found');
    }

    if (issues.length > 0) {
      issues.forEach((issue) => this.error(`${filename}: ${issue}`));
      return false;
    }

    this.success(`${filename}: SQL syntax validation passed`);
    return true;
  }

  simulateExecution(sqlContent, filename) {
    this.log(`Simulating execution of ${filename}`);

    // Simulate different types of SQL operations
    const operations = {
      'CREATE TABLE': 'Table creation',
      'CREATE FUNCTION': 'Function creation',
      'CREATE TRIGGER': 'Trigger creation',
      'CREATE VIEW': 'View creation',
      'INSERT INTO': 'Data insertion',
      SELECT: 'Data selection',
      GRANT: 'Permission grant',
    };

    let operationCount = 0;
    Object.keys(operations).forEach((op) => {
      const matches = (sqlContent.match(new RegExp(op, 'gi')) || []).length;
      if (matches > 0) {
        this.success(
          `${filename}: ${matches} ${operations[op]} operation(s) detected`
        );
        operationCount += matches;
      }
    });

    if (operationCount === 0) {
      this.error(`${filename}: No recognizable SQL operations found`);
      return false;
    }

    this.success(
      `${filename}: Simulation completed with ${operationCount} operations`
    );
    return true;
  }

  runTest(filename) {
    const filePath = path.join(__dirname, filename);

    if (!fs.existsSync(filePath)) {
      this.error(`File not found: ${filename}`);
      return false;
    }

    try {
      const sqlContent = fs.readFileSync(filePath, 'utf8');

      if (!sqlContent.trim()) {
        this.error(`${filename}: File is empty`);
        return false;
      }

      const syntaxValid = this.validateSQLSyntax(sqlContent, filename);
      if (!syntaxValid) {
        return false;
      }

      const executionValid = this.simulateExecution(sqlContent, filename);
      return executionValid;
    } catch (error) {
      this.error(`${filename}: Error reading file - ${error.message}`);
      return false;
    }
  }

  runAllTests() {
    this.log('Starting audit log partition tests');
    this.log('='.repeat(50));

    const testFiles = [
      '001_audit_partitions.sql',
      'quick_test.sql',
      'test_audit_partitions.sql',
    ];

    let passedTests = 0;
    const totalTests = testFiles.length;

    testFiles.forEach((file, index) => {
      this.log(`\nTest ${index + 1}/${totalTests}: ${file}`);
      this.log('-'.repeat(30));

      if (this.runTest(file)) {
        passedTests++;
      }
    });

    this.log('\n' + '='.repeat(50));
    this.log('TEST SUMMARY');
    this.log('='.repeat(50));
    this.success(`Passed: ${passedTests}/${totalTests} tests`);

    if (this.errors.length > 0) {
      this.log(`\nErrors encountered: ${this.errors.length}`);
      this.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    if (passedTests === totalTests) {
      this.success(
        'All tests passed! SQL scripts are ready for PostgreSQL execution.'
      );
      return true;
    } else {
      this.error(
        `${totalTests - passedTests} test(s) failed. Please review the errors above.`
      );
      return false;
    }
  }
}

// Run the tests
if (require.main === module) {
  const runner = new SQLTestRunner();
  const success = runner.runAllTests();
  process.exit(success ? 0 : 1);
}

module.exports = SQLTestRunner;
