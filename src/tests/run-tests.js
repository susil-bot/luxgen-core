#!/usr/bin/env node

/**
 * Comprehensive Test Runner for LuxGen Core API
 * 
 * This script provides a unified way to run all tests with proper setup,
 * cleanup, and reporting for the LuxGen Core backend API.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Test configuration
const testConfig = {
  // Test suites to run
  suites: {
    'unit': 'src/tests/api/*.spec.js',
    'integration': 'src/tests/integration/*.spec.js',
    'all': 'src/tests/**/*.spec.js'
  },
  
  // Test options
  options: {
    'watch': '--watch',
    'coverage': '--coverage',
    'verbose': '--verbose',
    'detectOpenHandles': '--detectOpenHandles',
    'forceExit': '--forceExit'
  }
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Helper functions
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`  ${message}`, 'bright');
  log(`${'='.repeat(60)}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Test runner class
class TestRunner {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      total: 0
    };
  }

  async runCommand(command, args, options = {}) {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        stdio: 'inherit',
        shell: true,
        ...options
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve(code);
        } else {
          reject(new Error(`Command failed with exit code ${code}`));
        }
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  async checkPrerequisites() {
    logHeader('Checking Prerequisites');
    
    try {
      // Check if Node.js is available
      await this.runCommand('node', ['--version']);
      logSuccess('Node.js is available');
      
      // Check if npm is available
      await this.runCommand('npm', ['--version']);
      logSuccess('npm is available');
      
      // Check if Jest is installed
      const packageJson = require('../../package.json');
      if (packageJson.devDependencies.jest) {
        logSuccess('Jest is installed');
      } else {
        logWarning('Jest is not installed. Run: npm install');
        return false;
      }
      
      return true;
    } catch (error) {
      logError(`Prerequisites check failed: ${error.message}`);
      return false;
    }
  }

  async installDependencies() {
    logHeader('Installing Dependencies');
    
    try {
      await this.runCommand('npm', ['install']);
      logSuccess('Dependencies installed successfully');
      return true;
    } catch (error) {
      logError(`Failed to install dependencies: ${error.message}`);
      return false;
    }
  }

  async runTests(suite = 'all', options = []) {
    logHeader(`Running ${suite} Tests`);
    
    const testPattern = testConfig.suites[suite] || testConfig.suites.all;
    const jestArgs = [
      testPattern,
      ...options,
      ...Object.values(testConfig.options)
    ];

    try {
      logInfo(`Running tests with pattern: ${testPattern}`);
      logInfo(`Jest arguments: ${jestArgs.join(' ')}`);
      
      await this.runCommand('npx', ['jest', ...jestArgs]);
      logSuccess(`${suite} tests completed successfully`);
      return true;
    } catch (error) {
      logError(`${suite} tests failed: ${error.message}`);
      return false;
    }
  }

  async runAllTests() {
    logHeader('LuxGen Core API Test Suite');
    logInfo('Starting comprehensive test run...\n');

    // Check prerequisites
    const prerequisitesOk = await this.checkPrerequisites();
    if (!prerequisitesOk) {
      logError('Prerequisites check failed. Exiting.');
      process.exit(1);
    }

    // Install dependencies if needed
    const nodeModulesExists = fs.existsSync('../../node_modules');
    if (!nodeModulesExists) {
      const depsInstalled = await this.installDependencies();
      if (!depsInstalled) {
        logError('Failed to install dependencies. Exiting.');
        process.exit(1);
      }
    }

    // Run different test suites
    const testSuites = ['unit', 'integration'];
    let allPassed = true;

    for (const suite of testSuites) {
      const passed = await this.runTests(suite);
      if (!passed) {
        allPassed = false;
      }
    }

    // Summary
    logHeader('Test Summary');
    if (allPassed) {
      logSuccess('All tests passed! 🎉');
      logInfo('Your LuxGen Core API is working correctly.');
    } else {
      logError('Some tests failed. Please check the output above.');
      process.exit(1);
    }
  }

  async runSpecificTest(testName) {
    logHeader(`Running Specific Test: ${testName}`);
    
    try {
      await this.runCommand('npx', ['jest', testName, ...Object.values(testConfig.options)]);
      logSuccess(`Test ${testName} completed successfully`);
      return true;
    } catch (error) {
      logError(`Test ${testName} failed: ${error.message}`);
      return false;
    }
  }

  async runWithCoverage() {
    logHeader('Running Tests with Coverage');
    
    try {
      await this.runTests('all', ['--coverage']);
      logSuccess('Coverage report generated');
      logInfo('Check the coverage/ directory for detailed reports');
      return true;
    } catch (error) {
      logError(`Coverage tests failed: ${error.message}`);
      return false;
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const runner = new TestRunner();

  if (args.length === 0) {
    // Run all tests
    await runner.runAllTests();
  } else if (args[0] === '--help' || args[0] === '-h') {
    logHeader('LuxGen Core Test Runner Help');
    logInfo('Usage: node run-tests.js [options]');
    logInfo('');
    logInfo('Options:');
    logInfo('  --help, -h          Show this help message');
    logInfo('  --unit              Run unit tests only');
    logInfo('  --integration       Run integration tests only');
    logInfo('  --coverage          Run tests with coverage report');
    logInfo('  --watch             Run tests in watch mode');
    logInfo('  --specific <name>   Run specific test file');
    logInfo('');
    logInfo('Examples:');
    logInfo('  node run-tests.js                    # Run all tests');
    logInfo('  node run-tests.js --unit             # Run unit tests only');
    logInfo('  node run-tests.js --coverage         # Run with coverage');
    logInfo('  node run-tests.js --specific auth    # Run auth tests');
  } else if (args[0] === '--unit') {
    await runner.runTests('unit');
  } else if (args[0] === '--integration') {
    await runner.runTests('integration');
  } else if (args[0] === '--coverage') {
    await runner.runWithCoverage();
  } else if (args[0] === '--watch') {
    await runner.runTests('all', ['--watch']);
  } else if (args[0] === '--specific' && args[1]) {
    await runner.runSpecificTest(args[1]);
  } else {
    logError(`Unknown option: ${args[0]}`);
    logInfo('Use --help for available options');
    process.exit(1);
  }
}

// Run the CLI
if (require.main === module) {
  main().catch((error) => {
    logError(`Test runner failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = TestRunner;
