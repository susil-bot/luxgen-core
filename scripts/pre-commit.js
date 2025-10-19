#!/usr/bin/env node

/**
 * LuxGen Core Pre-Commit Hook
 * 
 * This script runs comprehensive checks before allowing commits:
 * - ESLint code quality checks
 * - Test suite execution
 * - Security vulnerability checks
 * - Code coverage validation
 * - Performance checks
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

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

// Check if command exists
function commandExists(command) {
  return new Promise((resolve) => {
    exec(`which ${command}`, (error) => {
      resolve(!error);
    });
  });
}

// Run command with promise
function runCommand(command, args = [], options = {}) {
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

// Pre-commit checks
class PreCommitChecker {
  constructor() {
    this.checks = [];
    this.results = {
      passed: 0,
      failed: 0,
      total: 0
    };
  }

  async addCheck(name, checkFunction) {
    this.checks.push({ name, check: checkFunction });
  }

  async runAllChecks() {
    logHeader('LuxGen Core Pre-Commit Checks');
    logInfo('Running comprehensive pre-commit validation...\n');

    for (const { name, check } of this.checks) {
      try {
        logInfo(`Running: ${name}`);
        await check();
        logSuccess(`${name} passed`);
        this.results.passed++;
      } catch (error) {
        logError(`${name} failed: ${error.message}`);
        this.results.failed++;
      }
      this.results.total++;
    }

    return this.results;
  }

  async checkPrerequisites() {
    const requiredCommands = ['node', 'npm', 'git'];
    
    for (const command of requiredCommands) {
      if (!(await commandExists(command))) {
        throw new Error(`Required command not found: ${command}`);
      }
    }
    
    logSuccess('All prerequisites available');
  }

  async checkESLint() {
    logInfo('Running ESLint code quality checks...');
    
    // Check if .eslintrc.js exists
    if (!fs.existsSync('.eslintrc.js')) {
      throw new Error('ESLint configuration not found');
    }

    // Run ESLint on staged files
    await runCommand('npx', ['eslint', 'src/', '--ext', '.js', '--max-warnings', '0']);
    logSuccess('ESLint checks passed');
  }

  async checkTests() {
    logInfo('Running test suite...');
    
    // Check if Jest is configured
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    if (!packageJson.devDependencies?.jest) {
      throw new Error('Jest not found in devDependencies');
    }

    // Run tests
    await runCommand('npm', ['test']);
    logSuccess('All tests passed');
  }

  async checkTestCoverage() {
    logInfo('Checking test coverage...');
    
    // Run tests with coverage
    await runCommand('npm', ['run', 'test:coverage']);
    
    // Check if coverage meets minimum threshold
    const coverageFile = 'coverage/coverage-summary.txt';
    if (fs.existsSync(coverageFile)) {
      const coverage = fs.readFileSync(coverageFile, 'utf8');
      const linesMatch = coverage.match(/Lines\s*:\s*(\d+\.?\d*)%/);
      
      if (linesMatch) {
        const coveragePercent = parseFloat(linesMatch[1]);
        const minCoverage = 70; // Minimum 70% coverage
        
        if (coveragePercent < minCoverage) {
          throw new Error(`Coverage ${coveragePercent}% is below minimum ${minCoverage}%`);
        }
        
        logSuccess(`Coverage ${coveragePercent}% meets minimum requirements`);
      }
    }
  }

  async checkSecurity() {
    logInfo('Running security audit...');
    
    // Run npm audit
    await runCommand('npm', ['audit', '--audit-level', 'moderate']);
    logSuccess('Security audit passed');
  }

  async checkDependencies() {
    logInfo('Checking dependencies...');
    
    // Check for outdated packages
    await runCommand('npm', ['outdated']);
    logSuccess('Dependencies check completed');
  }

  async checkCodeStyle() {
    logInfo('Checking code style...');
    
    // Check if Prettier is available
    if (await commandExists('npx prettier')) {
      await runCommand('npx', ['prettier', '--check', 'src/']);
      logSuccess('Code style checks passed');
    } else {
      logWarning('Prettier not found, skipping code style checks');
    }
  }

  async checkGitHooks() {
    logInfo('Checking Git hooks...');
    
    // Check if .git/hooks directory exists
    if (!fs.existsSync('.git/hooks')) {
      throw new Error('Git hooks directory not found');
    }
    
    logSuccess('Git hooks directory exists');
  }

  async checkFileSizes() {
    logInfo('Checking file sizes...');
    
    const maxFileSize = 1024 * 1024; // 1MB
    const files = this.getStagedFiles();
    
    for (const file of files) {
      if (fs.existsSync(file)) {
        const stats = fs.statSync(file);
        if (stats.size > maxFileSize) {
          throw new Error(`File ${file} is too large (${stats.size} bytes)`);
        }
      }
    }
    
    logSuccess('File size checks passed');
  }

  async checkSensitiveData() {
    logInfo('Checking for sensitive data...');
    
    const sensitivePatterns = [
      /password\s*[:=]\s*['"][^'"]+['"]/i,
      /secret\s*[:=]\s*['"][^'"]+['"]/i,
      /api[_-]?key\s*[:=]\s*['"][^'"]+['"]/i,
      /token\s*[:=]\s*['"][^'"]+['"]/i
    ];
    
    const files = this.getStagedFiles();
    
    for (const file of files) {
      if (fs.existsSync(file) && file.endsWith('.js')) {
        const content = fs.readFileSync(file, 'utf8');
        
        for (const pattern of sensitivePatterns) {
          if (pattern.test(content)) {
            throw new Error(`Potential sensitive data found in ${file}`);
          }
        }
      }
    }
    
    logSuccess('Sensitive data checks passed');
  }

  getStagedFiles() {
    try {
      const { execSync } = require('child_process');
      const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf8' });
      return stagedFiles.trim().split('\n').filter(file => file.length > 0);
    } catch (error) {
      return [];
    }
  }
}

// Main execution
async function main() {
  const checker = new PreCommitChecker();
  
  // Add all checks
  await checker.addCheck('Prerequisites', () => checker.checkPrerequisites());
  await checker.addCheck('ESLint', () => checker.checkESLint());
  await checker.addCheck('Tests', () => checker.checkTests());
  await checker.addCheck('Test Coverage', () => checker.checkTestCoverage());
  await checker.addCheck('Security Audit', () => checker.checkSecurity());
  await checker.addCheck('Dependencies', () => checker.checkDependencies());
  await checker.addCheck('Code Style', () => checker.checkCodeStyle());
  await checker.addCheck('Git Hooks', () => checker.checkGitHooks());
  await checker.addCheck('File Sizes', () => checker.checkFileSizes());
  await checker.addCheck('Sensitive Data', () => checker.checkSensitiveData());
  
  // Run all checks
  const results = await checker.runAllChecks();
  
  // Summary
  logHeader('Pre-Commit Check Summary');
  logInfo(`Total checks: ${results.total}`);
  logSuccess(`Passed: ${results.passed}`);
  
  if (results.failed > 0) {
    logError(`Failed: ${results.failed}`);
    logError('Commit blocked due to failed checks');
    process.exit(1);
  } else {
    logSuccess('All checks passed! Commit allowed.');
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    logError(`Pre-commit check failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = PreCommitChecker;
