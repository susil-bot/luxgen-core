#!/usr/bin/env node

/**
 * Rate Limiting Test Script
 * Tests rate limiting implementation for LuxGen Backend
 */

const http = require('http');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  header: (msg) => console.log(`${colors.cyan}[RATE LIMITING]${colors.reset} ${msg}`)
};

class RateLimitingTester {
  constructor() {
    this.port = process.env.PORT || 4004;
    this.host = process.env.HOST || 'localhost';
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      tests: []
    };
  }

  async test() {
    log.header('⏱️  Testing Rate Limiting...');
    
    try {
      await this.testServer();
      await this.testRateLimiting();
      this.generateReport();
    } catch (error) {
      log.error(`Rate limiting test failed: ${error.message}`);
      process.exit(1);
    }
  }

  async testServer() {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.host,
        port: this.port,
        path: '/health',
        method: 'GET',
        timeout: 5000
      };

      const req = http.request(options, (res) => {
        log.success(`✅ Server responding on ${this.host}:${this.port}`);
        resolve(res);
      });

      req.on('error', (error) => {
        log.error(`❌ Server not responding: ${error.message}`);
        reject(error);
      });

      req.end();
    });
  }

  async testRateLimiting() {
    log.info('🚦 Testing rate limiting implementation...');
    
    // Test different endpoints for rate limiting
    const endpoints = [
      { path: '/api/auth/login', method: 'POST', name: 'Login endpoint' },
      { path: '/api/auth/register', method: 'POST', name: 'Register endpoint' },
      { path: '/api/users', method: 'GET', name: 'Users endpoint' },
      { path: '/health', method: 'GET', name: 'Health endpoint' }
    ];

    for (const endpoint of endpoints) {
      await this.testEndpointRateLimit(endpoint);
    }
  }

  async testEndpointRateLimit(endpoint) {
    log.info(`🔍 Testing rate limiting for ${endpoint.name}...`);
    
    const requests = [];
    const maxRequests = 10; // Try to exceed rate limit
    
    // Make multiple requests quickly
    for (let i = 0; i < maxRequests; i++) {
      requests.push(this.makeRequest(endpoint));
    }
    
    try {
      const responses = await Promise.all(requests);
      const rateLimited = responses.some(res => res.statusCode === 429);
      
      if (rateLimited) {
        log.success(`✅ ${endpoint.name}: Rate limiting working`);
        this.results.passed++;
      } else {
        log.warning(`⚠️  ${endpoint.name}: No rate limiting detected`);
        this.results.warnings++;
      }
      
      this.results.tests.push({
        name: endpoint.name,
        path: endpoint.path,
        rateLimited,
        responses: responses.length
      });
      
    } catch (error) {
      log.error(`❌ ${endpoint.name}: Test failed - ${error.message}`);
      this.results.failed++;
    }
  }

  async makeRequest(endpoint) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.host,
        port: this.port,
        path: endpoint.path,
        method: endpoint.method,
        timeout: 2000,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const req = http.request(options, (res) => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.end();
    });
  }

  generateReport() {
    log.header('📊 Rate Limiting Report');
    console.log('');

    const totalTests = this.results.passed + this.results.failed + this.results.warnings;
    const successRate = totalTests > 0 ? (this.results.passed / totalTests * 100).toFixed(1) : 0;

    console.log(`📈 Test Results:`);
    console.log(`  ✅ Passed: ${this.results.passed}`);
    console.log(`  ❌ Failed: ${this.results.failed}`);
    console.log(`  ⚠️  Warnings: ${this.results.warnings}`);
    console.log(`  📊 Success Rate: ${successRate}%`);
    console.log('');

    // Recommendations
    log.info('💡 Rate Limiting Recommendations:');
    console.log('  🚦 Implement rate limiting on all endpoints');
    console.log('  🔐 Stricter limits on authentication endpoints');
    console.log('  ⏰ Different limits for different user types');
    console.log('  🛡️  IP-based and user-based rate limiting');
    console.log('  📊 Monitor and log rate limit violations');
    console.log('  🔄 Implement exponential backoff');
    console.log('  🚫 Block suspicious IP addresses');
    console.log('');

    // Implementation example
    console.log('📝 Rate Limiting Implementation Example:');
    console.log(`
const rateLimit = require('express-rate-limit');

// General rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

// Strict rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts',
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting
app.use('/api/', generalLimiter);
app.use('/api/auth/', authLimiter);
    `);

    // Exit with appropriate code
    if (this.results.failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
}

// Run the rate limiting test
const tester = new RateLimitingTester();
tester.test().catch(error => {
  log.error(`Rate limiting test failed: ${error.message}`);
  process.exit(1);
});
