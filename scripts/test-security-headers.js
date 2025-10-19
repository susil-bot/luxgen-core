#!/usr/bin/env node

/**
 * Security Headers Test Script
 * Tests HTTP security headers for LuxGen Backend
 */

const http = require('http');
const https = require('https');

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
  header: (msg) => console.log(`${colors.cyan}[SECURITY HEADERS]${colors.reset} ${msg}`)
};

class SecurityHeadersTester {
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
    log.header('🛡️  Testing Security Headers...');
    
    try {
      await this.testServer();
      await this.testSecurityHeaders();
      this.generateReport();
    } catch (error) {
      log.error(`Security headers test failed: ${error.message}`);
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
        log.info('💡 Make sure the server is running: npm start');
        reject(error);
      });

      req.on('timeout', () => {
        log.error('❌ Server request timeout');
        reject(new Error('Server timeout'));
      });

      req.end();
    });
  }

  async testSecurityHeaders() {
    const securityHeaders = [
      {
        name: 'X-Content-Type-Options',
        expected: 'nosniff',
        description: 'Prevents MIME type sniffing',
        critical: true
      },
      {
        name: 'X-Frame-Options',
        expected: ['DENY', 'SAMEORIGIN'],
        description: 'Prevents clickjacking attacks',
        critical: true
      },
      {
        name: 'X-XSS-Protection',
        expected: '1; mode=block',
        description: 'Enables XSS filtering',
        critical: true
      },
      {
        name: 'Strict-Transport-Security',
        expected: 'max-age=',
        description: 'Enforces HTTPS',
        critical: false
      },
      {
        name: 'Content-Security-Policy',
        expected: 'default-src',
        description: 'Prevents XSS attacks',
        critical: true
      },
      {
        name: 'Referrer-Policy',
        expected: 'strict-origin-when-cross-origin',
        description: 'Controls referrer information',
        critical: false
      },
      {
        name: 'Permissions-Policy',
        expected: 'geolocation=',
        description: 'Controls browser features',
        critical: false
      }
    ];

    for (const header of securityHeaders) {
      await this.testHeader(header);
    }
  }

  async testHeader(headerConfig) {
    return new Promise((resolve) => {
      const options = {
        hostname: this.host,
        port: this.port,
        path: '/health',
        method: 'GET',
        timeout: 5000
      };

      const req = http.request(options, (res) => {
        const headerValue = res.headers[headerConfig.name.toLowerCase()];
        
        const test = {
          name: headerConfig.name,
          description: headerConfig.description,
          critical: headerConfig.critical,
          found: !!headerValue,
          value: headerValue,
          passed: false
        };

        if (headerValue) {
          if (Array.isArray(headerConfig.expected)) {
            test.passed = headerConfig.expected.some(expected => 
              headerValue.includes(expected)
            );
          } else if (headerConfig.expected.includes('=')) {
            test.passed = headerValue.includes(headerConfig.expected);
          } else {
            test.passed = headerValue === headerConfig.expected;
          }
        }

        if (test.passed) {
          log.success(`✅ ${headerConfig.name}: ${headerValue}`);
          this.results.passed++;
        } else if (headerConfig.critical) {
          log.error(`❌ ${headerConfig.name}: Missing or incorrect`);
          this.results.failed++;
        } else {
          log.warning(`⚠️  ${headerConfig.name}: Missing (recommended)`);
          this.results.warnings++;
        }

        this.results.tests.push(test);
        resolve();
      });

      req.on('error', () => {
        const test = {
          name: headerConfig.name,
          description: headerConfig.description,
          critical: headerConfig.critical,
          found: false,
          value: null,
          passed: false
        };

        this.results.tests.push(test);
        resolve();
      });

      req.end();
    });
  }

  generateReport() {
    log.header('📊 Security Headers Report');
    console.log('');

    const totalTests = this.results.passed + this.results.failed + this.results.warnings;
    const successRate = totalTests > 0 ? (this.results.passed / totalTests * 100).toFixed(1) : 0;

    console.log(`📈 Test Results:`);
    console.log(`  ✅ Passed: ${this.results.passed}`);
    console.log(`  ❌ Failed: ${this.results.failed}`);
    console.log(`  ⚠️  Warnings: ${this.results.warnings}`);
    console.log(`  📊 Success Rate: ${successRate}%`);
    console.log('');

    // Critical failures
    const criticalFailures = this.results.tests.filter(test => 
      test.critical && !test.passed
    );

    if (criticalFailures.length > 0) {
      log.error('🚨 Critical Security Issues:');
      criticalFailures.forEach(test => {
        console.log(`  ❌ ${test.name}: ${test.description}`);
      });
      console.log('');
    }

    // Recommendations
    log.info('💡 Security Header Recommendations:');
    console.log('  🛡️  Add helmet.js middleware for comprehensive security headers');
    console.log('  🔒 Implement HTTPS with proper HSTS headers');
    console.log('  🚫 Configure CSP to prevent XSS attacks');
    console.log('  🖼️  Set X-Frame-Options to prevent clickjacking');
    console.log('  🔍 Add X-Content-Type-Options: nosniff');
    console.log('  🛡️  Configure Referrer-Policy for privacy');
    console.log('  🔐 Set Permissions-Policy for feature control');
    console.log('');

    // Implementation example
    console.log('📝 Example helmet.js implementation:');
    console.log(`
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
    `);

    // Exit with appropriate code
    if (this.results.failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
}

// Run the security headers test
const tester = new SecurityHeadersTester();
tester.test().catch(error => {
  log.error(`Security headers test failed: ${error.message}`);
  process.exit(1);
});
