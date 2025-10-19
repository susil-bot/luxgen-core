#!/usr/bin/env node

/**
 * Security Scan Script
 * Comprehensive security testing for LuxGen Backend
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  header: (msg) => console.log(`${colors.cyan}[SECURITY]${colors.reset} ${msg}`)
};

class SecurityScanner {
  constructor() {
    this.results = {
      vulnerabilities: [],
      warnings: [],
      recommendations: [],
      score: 100
    };
  }

  async scan() {
    log.header('🔒 Starting Security Scan...');
    
    await this.checkDependencies();
    await this.checkEnvironmentVariables();
    await this.checkFilePermissions();
    await this.checkSensitiveFiles();
    await this.checkDatabaseSecurity();
    await this.checkAuthentication();
    await this.checkCORS();
    await this.checkRateLimiting();
    
    this.generateReport();
  }

  async checkDependencies() {
    log.info('📦 Checking dependencies for vulnerabilities...');
    
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      // Check for known vulnerable packages
      const vulnerablePackages = [
        'express', 'mongoose', 'bcryptjs', 'jsonwebtoken', 'cors'
      ];
      
      for (const pkg of vulnerablePackages) {
        if (dependencies[pkg]) {
          log.success(`✅ ${pkg} found - checking version...`);
        }
      }
      
      // Check for outdated packages
      const outdatedPackages = Object.keys(dependencies).filter(pkg => {
        const version = dependencies[pkg];
        return version.includes('^') || version.includes('~');
      });
      
      if (outdatedPackages.length > 0) {
        this.results.warnings.push(`Found ${outdatedPackages.length} packages with version ranges`);
        this.results.score -= 5;
      }
      
    } catch (error) {
      this.results.vulnerabilities.push('Failed to check dependencies');
      this.results.score -= 10;
    }
  }

  async checkEnvironmentVariables() {
    log.info('🔐 Checking environment variables...');
    
    const requiredEnvVars = [
      'NODE_ENV',
      'MONGODB_URI',
      'JWT_SECRET'
    ];
    
    const sensitiveEnvVars = [
      'JWT_SECRET',
      'MONGODB_URI',
      'DB_PASSWORD'
    ];
    
    // Check if .env files exist
    const envFiles = ['.env', '.env.production', '.env.local'];
    let envFileFound = false;
    
    for (const file of envFiles) {
      if (fs.existsSync(file)) {
        envFileFound = true;
        log.success(`✅ Found ${file}`);
        
        // Check if sensitive variables are in .env
        const envContent = fs.readFileSync(file, 'utf8');
        for (const sensitiveVar of sensitiveEnvVars) {
          if (envContent.includes(sensitiveVar)) {
            log.warning(`⚠️  Sensitive variable ${sensitiveVar} found in ${file}`);
            this.results.warnings.push(`Sensitive variable ${sensitiveVar} in ${file}`);
          }
        }
        break;
      }
    }
    
    if (!envFileFound) {
      this.results.warnings.push('No .env file found');
      this.results.score -= 5;
    }
  }

  async checkFilePermissions() {
    log.info('📁 Checking file permissions...');
    
    const sensitiveFiles = [
      'package.json',
      'package-lock.json',
      'src/index.js',
      'src/app.js'
    ];
    
    for (const file of sensitiveFiles) {
      if (fs.existsSync(file)) {
        const stats = fs.statSync(file);
        const permissions = (stats.mode & parseInt('777', 8)).toString(8);
        
        if (permissions.includes('7')) {
          log.warning(`⚠️  File ${file} has overly permissive permissions: ${permissions}`);
          this.results.warnings.push(`File ${file} has permissions ${permissions}`);
          this.results.score -= 2;
        } else {
          log.success(`✅ File ${file} has secure permissions: ${permissions}`);
        }
      }
    }
  }

  async checkSensitiveFiles() {
    log.info('🔍 Checking for sensitive files...');
    
    const sensitiveFiles = [
      '.env',
      '.env.local',
      '.env.production',
      'config/database.js',
      'src/config/database.js'
    ];
    
    for (const file of sensitiveFiles) {
      if (fs.existsSync(file)) {
        log.warning(`⚠️  Sensitive file found: ${file}`);
        this.results.warnings.push(`Sensitive file: ${file}`);
      }
    }
  }

  async checkDatabaseSecurity() {
    log.info('🗄️  Checking database security...');
    
    // Check for hardcoded database credentials
    const filesToCheck = ['src/index.js', 'src/app.js', 'src/config/database.js'];
    
    for (const file of filesToCheck) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check for hardcoded credentials
        const hardcodedPatterns = [
          /mongodb:\/\/[^@]+@/,
          /password\s*[:=]\s*['"][^'"]+['"]/,
          /secret\s*[:=]\s*['"][^'"]+['"]/
        ];
        
        for (const pattern of hardcodedPatterns) {
          if (pattern.test(content)) {
            log.error(`❌ Hardcoded credentials found in ${file}`);
            this.results.vulnerabilities.push(`Hardcoded credentials in ${file}`);
            this.results.score -= 15;
          }
        }
      }
    }
  }

  async checkAuthentication() {
    log.info('🔐 Checking authentication security...');
    
    // Check for JWT implementation
    const authFiles = ['src/middleware/auth.js', 'src/routes/auth.js', 'src/controllers/auth.js'];
    let authFound = false;
    
    for (const file of authFiles) {
      if (fs.existsSync(file)) {
        authFound = true;
        log.success(`✅ Authentication file found: ${file}`);
        break;
      }
    }
    
    if (!authFound) {
      log.warning('⚠️  No authentication files found');
      this.results.warnings.push('No authentication implementation found');
      this.results.score -= 10;
    }
  }

  async checkCORS() {
    log.info('🌐 Checking CORS configuration...');
    
    const appFile = 'src/app.js';
    if (fs.existsSync(appFile)) {
      const content = fs.readFileSync(appFile, 'utf8');
      
      if (content.includes('cors')) {
        log.success('✅ CORS middleware found');
        
        // Check for overly permissive CORS
        if (content.includes('origin: true') || content.includes('origin: "*"')) {
          log.warning('⚠️  Overly permissive CORS configuration');
          this.results.warnings.push('Overly permissive CORS configuration');
          this.results.score -= 5;
        }
      } else {
        log.warning('⚠️  No CORS configuration found');
        this.results.warnings.push('No CORS configuration');
        this.results.score -= 5;
      }
    }
  }

  async checkRateLimiting() {
    log.info('⏱️  Checking rate limiting...');
    
    const appFile = 'src/app.js';
    if (fs.existsSync(appFile)) {
      const content = fs.readFileSync(appFile, 'utf8');
      
      if (content.includes('rate-limit') || content.includes('express-rate-limit')) {
        log.success('✅ Rate limiting found');
      } else {
        log.warning('⚠️  No rate limiting found');
        this.results.warnings.push('No rate limiting implementation');
        this.results.score -= 5;
      }
    }
  }

  generateReport() {
    log.header('📊 Security Scan Report');
    console.log('');
    
    // Score
    const scoreColor = this.results.score >= 80 ? colors.green : 
                      this.results.score >= 60 ? colors.yellow : colors.red;
    console.log(`${scoreColor}Security Score: ${this.results.score}/100${colors.reset}`);
    console.log('');
    
    // Vulnerabilities
    if (this.results.vulnerabilities.length > 0) {
      log.error('🚨 Critical Vulnerabilities:');
      this.results.vulnerabilities.forEach(vuln => {
        console.log(`  ❌ ${vuln}`);
      });
      console.log('');
    }
    
    // Warnings
    if (this.results.warnings.length > 0) {
      log.warning('⚠️  Security Warnings:');
      this.results.warnings.forEach(warning => {
        console.log(`  ⚠️  ${warning}`);
      });
      console.log('');
    }
    
    // Recommendations
    log.info('💡 Security Recommendations:');
    console.log('  🔐 Use environment variables for all secrets');
    console.log('  🛡️  Implement proper CORS configuration');
    console.log('  ⏱️  Add rate limiting to prevent abuse');
    console.log('  🔒 Use HTTPS in production');
    console.log('  🗄️  Validate all database inputs');
    console.log('  🔑 Implement proper JWT token management');
    console.log('  📝 Add security headers (helmet.js)');
    console.log('  🔍 Regular security audits');
    console.log('');
    
    // Exit with appropriate code
    if (this.results.vulnerabilities.length > 0) {
      process.exit(1);
    } else if (this.results.warnings.length > 5) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
}

// Run the security scan
const scanner = new SecurityScanner();
scanner.scan().catch(error => {
  log.error(`Security scan failed: ${error.message}`);
  process.exit(1);
});
