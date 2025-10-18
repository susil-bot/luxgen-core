#!/usr/bin/env node
/**
 * Cursor Review Bot Test Script
 * 
 * This script tests the Cursor review bot locally before deploying to GitHub Actions.
 * It simulates the review process and provides feedback on code quality.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Test configuration
const config = {
  // Files to test
  testFiles: [
    'src/app.js',
    'src/index.js',
    'src/routes/health.js',
    'src/services/emailService.js',
    'src/utils/monitoring.js',
    'package.json',
    'README.md'
  ],
  
  // Review criteria
  criteria: {
    codeQuality: true,
    security: true,
    performance: true,
    documentation: true,
    bestPractices: true
  },
  
  // Output format
  outputFormat: 'detailed'
};

/**
 * Log with colors
 */
function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Check if file exists
 */
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

/**
 * Get file size in KB
 */
function getFileSize(filePath) {
  const stats = fs.statSync(filePath);
  return Math.round(stats.size / 1024);
}

/**
 * Read file content
 */
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return null;
  }
}

/**
 * Basic code quality checks
 */
function checkCodeQuality(content, filePath) {
  const issues = [];
  
  // Check for console.log statements
  if (content.includes('console.log(') && !filePath.includes('test')) {
    issues.push({
      type: 'warning',
      message: 'Consider using a proper logger instead of console.log',
      line: content.split('\n').findIndex(line => line.includes('console.log(')) + 1
    });
  }
  
  // Check for TODO comments
  const todoMatches = content.match(/TODO|FIXME|HACK/g);
  if (todoMatches) {
    issues.push({
      type: 'info',
      message: `Found ${todoMatches.length} TODO/FIXME comments`,
      line: content.split('\n').findIndex(line => line.includes('TODO') || line.includes('FIXME')) + 1
    });
  }
  
  // Check for long lines (> 100 characters)
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    if (line.length > 100) {
      issues.push({
        type: 'warning',
        message: 'Line is too long (> 100 characters)',
        line: index + 1
      });
    }
  });
  
  return issues;
}

/**
 * Security checks
 */
function checkSecurity(content, filePath) {
  const issues = [];
  
  // Check for hardcoded secrets
  const secretPatterns = [
    /password\s*=\s*['"][^'"]+['"]/gi,
    /api[_-]?key\s*=\s*['"][^'"]+['"]/gi,
    /secret\s*=\s*['"][^'"]+['"]/gi,
    /token\s*=\s*['"][^'"]+['"]/gi
  ];
  
  secretPatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      issues.push({
        type: 'error',
        message: 'Potential hardcoded secret detected',
        line: content.split('\n').findIndex(line => pattern.test(line)) + 1
      });
    }
  });
  
  // Check for SQL injection patterns
  if (content.includes('query(') && content.includes('$')) {
    issues.push({
      type: 'warning',
      message: 'Potential SQL injection vulnerability - use parameterized queries',
      line: content.split('\n').findIndex(line => line.includes('query(')) + 1
    });
  }
  
  return issues;
}

/**
 * Performance checks
 */
function checkPerformance(content, filePath) {
  const issues = [];
  
  // Check for synchronous file operations
  if (content.includes('fs.readFileSync') || content.includes('fs.writeFileSync')) {
    issues.push({
      type: 'warning',
      message: 'Consider using async file operations for better performance',
      line: content.split('\n').findIndex(line => line.includes('Sync')) + 1
    });
  }
  
  // Check for potential memory leaks
  if (content.includes('setInterval') && !content.includes('clearInterval')) {
    issues.push({
      type: 'warning',
      message: 'setInterval without clearInterval may cause memory leaks',
      line: content.split('\n').findIndex(line => line.includes('setInterval')) + 1
    });
  }
  
  return issues;
}

/**
 * Documentation checks
 */
function checkDocumentation(content, filePath) {
  const issues = [];
  
  // Check for function documentation
  const functionMatches = content.match(/function\s+\w+|const\s+\w+\s*=\s*\(/g);
  const commentMatches = content.match(/\/\*\*[\s\S]*?\*\//g);
  
  if (functionMatches && functionMatches.length > (commentMatches ? commentMatches.length : 0)) {
    issues.push({
      type: 'info',
      message: 'Consider adding JSDoc comments for functions',
      line: 1
    });
  }
  
  return issues;
}

/**
 * Run review on a single file
 */
function reviewFile(filePath) {
  log(`\n🔍 Reviewing: ${filePath}`, 'cyan');
  
  if (!fileExists(filePath)) {
    log(`❌ File not found: ${filePath}`, 'red');
    return null;
  }
  
  const content = readFile(filePath);
  if (!content) {
    log(`❌ Could not read file: ${filePath}`, 'red');
    return null;
  }
  
  const fileSize = getFileSize(filePath);
  log(`📊 File size: ${fileSize}KB`, 'blue');
  
  const issues = [];
  
  // Run different checks based on file type
  if (filePath.endsWith('.js') || filePath.endsWith('.ts')) {
    issues.push(...checkCodeQuality(content, filePath));
    issues.push(...checkSecurity(content, filePath));
    issues.push(...checkPerformance(content, filePath));
    issues.push(...checkDocumentation(content, filePath));
  }
  
  // Display issues
  if (issues.length === 0) {
    log(`✅ No issues found`, 'green');
  } else {
    issues.forEach(issue => {
      const color = issue.type === 'error' ? 'red' : 
                   issue.type === 'warning' ? 'yellow' : 'blue';
      const icon = issue.type === 'error' ? '❌' : 
                  issue.type === 'warning' ? '⚠️' : 'ℹ️';
      
      log(`${icon} ${issue.type.toUpperCase()}: ${issue.message}`, color);
      if (issue.line) {
        log(`   Line ${issue.line}`, 'white');
      }
    });
  }
  
  return {
    file: filePath,
    size: fileSize,
    issues: issues,
    score: Math.max(0, 100 - (issues.length * 10))
  };
}

/**
 * Generate summary report
 */
function generateSummary(results) {
  log(`\n📊 Review Summary`, 'bold');
  log('='.repeat(50), 'blue');
  
  const totalFiles = results.length;
  const totalIssues = results.reduce((sum, result) => sum + result.issues.length, 0);
  const avgScore = results.reduce((sum, result) => sum + result.score, 0) / totalFiles;
  
  log(`📁 Files reviewed: ${totalFiles}`, 'white');
  log(`🐛 Total issues: ${totalIssues}`, 'white');
  log(`📈 Average score: ${avgScore.toFixed(1)}/100`, 'white');
  
  // Issue breakdown
  const issueTypes = {
    error: 0,
    warning: 0,
    info: 0
  };
  
  results.forEach(result => {
    result.issues.forEach(issue => {
      issueTypes[issue.type]++;
    });
  });
  
  log(`\n📋 Issue Breakdown:`, 'bold');
  log(`❌ Errors: ${issueTypes.error}`, 'red');
  log(`⚠️  Warnings: ${issueTypes.warning}`, 'yellow');
  log(`ℹ️  Info: ${issueTypes.info}`, 'blue');
  
  // Recommendations
  log(`\n💡 Recommendations:`, 'bold');
  if (issueTypes.error > 0) {
    log(`• Fix ${issueTypes.error} critical errors first`, 'red');
  }
  if (issueTypes.warning > 0) {
    log(`• Address ${issueTypes.warning} warnings for better code quality`, 'yellow');
  }
  if (avgScore < 70) {
    log(`• Overall code quality needs improvement (score: ${avgScore.toFixed(1)})`, 'yellow');
  } else {
    log(`• Great job! Code quality is good (score: ${avgScore.toFixed(1)})`, 'green');
  }
}

/**
 * Main function
 */
function main() {
  log('🤖 Cursor Review Bot - Local Test', 'bold');
  log('='.repeat(40), 'blue');
  
  const results = [];
  
  // Review each test file
  config.testFiles.forEach(filePath => {
    const result = reviewFile(filePath);
    if (result) {
      results.push(result);
    }
  });
  
  // Generate summary
  if (results.length > 0) {
    generateSummary(results);
  } else {
    log('❌ No files could be reviewed', 'red');
    process.exit(1);
  }
  
  log(`\n🎯 Review complete!`, 'green');
  log('This is a simplified local test. The actual Cursor AI bot will provide more detailed analysis.', 'blue');
}

// Run the test
if (require.main === module) {
  main();
}

module.exports = {
  reviewFile,
  checkCodeQuality,
  checkSecurity,
  checkPerformance,
  checkDocumentation
};
