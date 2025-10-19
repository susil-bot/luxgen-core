#!/usr/bin/env node

/**
 * @fileoverview Comprehensive API Test Runner
 * Executes all API tests and generates detailed reports
 * 
 * @module
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestRunner {
  constructor() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      errors: [],
      startTime: new Date(),
      endTime: null,
      duration: 0
    };
    
    this.testSuites = [
      'simple.test.js',
      'health.test.js',
      'comprehensive-api.test.js',
      'integration/multi-tenancy.test.js',
      'validation/tenant-validation.test.js',
      'performance/load-test.js'
    ];
  }

  async runAllTests() {
    console.log('🧪 LuxGen API Test Suite Runner');
    console.log('=====================================\n');
    
    console.log('📋 Test Suites to Run:');
    this.testSuites.forEach((suite, index) => {
      console.log(`   ${index + 1}. ${suite}`);
    });
    console.log('');

    // Check if backend is running
    await this.checkBackendHealth();
    
    // Run each test suite
    for (const suite of this.testSuites) {
      await this.runTestSuite(suite);
    }
    
    this.results.endTime = new Date();
    this.results.duration = this.results.endTime - this.results.startTime;
    
    this.generateReport();
  }

  async checkBackendHealth() {
    console.log('🏥 Checking Backend Health...');
    try {
      const http = require('http');
      const response = await this.makeRequest('GET', '/health');
      
      if (response.status === 200) {
        console.log('✅ Backend is healthy and running');
        console.log(`   Status: ${response.data.status}`);
        console.log(`   Environment: ${response.data.environment}`);
      } else {
        console.log('⚠️  Backend responded but with unexpected status:', response.status);
      }
    } catch (error) {
      console.log('❌ Backend is not responding:', error.message);
      console.log('   Please ensure the backend is running on port 3000');
      console.log('   Run: npm run dev or npm start');
      process.exit(1);
    }
    console.log('');
  }

  async runTestSuite(suitePath) {
    const fullPath = path.join(__dirname, suitePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  Test suite not found: ${suitePath}`);
      this.results.skipped++;
      return;
    }

    console.log(`🧪 Running Test Suite: ${suitePath}`);
    console.log('----------------------------------------');
    
    try {
      const startTime = Date.now();
      
      // Run the test using Jest
      const command = `npx jest ${fullPath} --verbose --no-coverage`;
      const output = execSync(command, { 
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 300000 // 5 minutes timeout
      });
      
      const duration = Date.now() - startTime;
      
      // Parse Jest output to extract test results
      const lines = output.split('\n');
      let passed = 0;
      let failed = 0;
      
      for (const line of lines) {
        if (line.includes('✓')) {
          passed++;
        } else if (line.includes('✗') || line.includes('FAIL')) {
          failed++;
        }
      }
      
      this.results.total += passed + failed;
      this.results.passed += passed;
      this.results.failed += failed;
      
      console.log(`✅ Test Suite Completed: ${suitePath}`);
      console.log(`   Passed: ${passed}`);
      console.log(`   Failed: ${failed}`);
      console.log(`   Duration: ${duration}ms`);
      
      if (failed > 0) {
        console.log('   ❌ Some tests failed in this suite');
      }
      
    } catch (error) {
      console.log(`❌ Test Suite Failed: ${suitePath}`);
      console.log(`   Error: ${error.message}`);
      this.results.failed++;
      this.results.errors.push({
        suite: suitePath,
        error: error.message
      });
    }
    
    console.log('');
  }

  makeRequest(method, path) {
    return new Promise((resolve, reject) => {
      const http = require('http');
      
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: path,
        method: method,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try {
            const jsonBody = JSON.parse(body);
            resolve({ status: res.statusCode, data: jsonBody });
          } catch (e) {
            resolve({ status: res.statusCode, data: body });
          }
        });
      });

      req.on('error', reject);
      req.end();
    });
  }

  generateReport() {
    console.log('📊 Test Results Summary');
    console.log('======================');
    console.log(`Total Tests: ${this.results.total}`);
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`⏭️  Skipped: ${this.results.skipped}`);
    console.log(`⏱️  Duration: ${this.results.duration}ms`);
    console.log('');

    if (this.results.errors.length > 0) {
      console.log('🚨 Errors Encountered:');
      this.results.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error.suite}: ${error.error}`);
      });
      console.log('');
    }

    // Generate detailed report file
    const reportPath = path.join(__dirname, 'test-report.json');
    const report = {
      summary: {
        total: this.results.total,
        passed: this.results.passed,
        failed: this.results.failed,
        skipped: this.results.skipped,
        duration: this.results.duration,
        successRate: this.results.total > 0 ? (this.results.passed / this.results.total * 100).toFixed(2) : 0
      },
      timestamp: {
        start: this.results.startTime.toISOString(),
        end: this.results.endTime.toISOString()
      },
      errors: this.results.errors,
      testSuites: this.testSuites
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Detailed report saved to: ${reportPath}`);

    // Generate HTML report
    this.generateHTMLReport(report);

    // Final status
    if (this.results.failed === 0) {
      console.log('🎉 All tests passed! API is working correctly.');
      process.exit(0);
    } else {
      console.log('⚠️  Some tests failed. Please check the errors above.');
      process.exit(1);
    }
  }

  generateHTMLReport(report) {
    const htmlReport = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LuxGen API Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .stat-card.success { background: #d4edda; border-left: 4px solid #28a745; }
        .stat-card.failure { background: #f8d7da; border-left: 4px solid #dc3545; }
        .stat-card.warning { background: #fff3cd; border-left: 4px solid #ffc107; }
        .stat-number { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
        .stat-label { color: #666; }
        .errors { margin-top: 30px; }
        .error-item { background: #f8d7da; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #dc3545; }
        .timestamp { color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 LuxGen API Test Report</h1>
            <p class="timestamp">Generated on ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="summary">
            <div class="stat-card ${report.summary.failed === 0 ? 'success' : 'failure'}">
                <div class="stat-number">${report.summary.total}</div>
                <div class="stat-label">Total Tests</div>
            </div>
            <div class="stat-card success">
                <div class="stat-number">${report.summary.passed}</div>
                <div class="stat-label">Passed</div>
            </div>
            <div class="stat-card ${report.summary.failed > 0 ? 'failure' : 'success'}">
                <div class="stat-number">${report.summary.failed}</div>
                <div class="stat-label">Failed</div>
            </div>
            <div class="stat-card warning">
                <div class="stat-number">${report.summary.successRate}%</div>
                <div class="stat-label">Success Rate</div>
            </div>
        </div>
        
        <div class="details">
            <h3>Test Duration</h3>
            <p>${(report.summary.duration / 1000).toFixed(2)} seconds</p>
            
            <h3>Test Suites Executed</h3>
            <ul>
                ${report.testSuites.map(suite => `<li>${suite}</li>`).join('')}
            </ul>
        </div>
        
        ${report.errors.length > 0 ? `
        <div class="errors">
            <h3>🚨 Errors Encountered</h3>
            ${report.errors.map(error => `
                <div class="error-item">
                    <strong>${error.suite}</strong><br>
                    ${error.error}
                </div>
            `).join('')}
        </div>
        ` : ''}
    </div>
</body>
</html>`;

    const htmlReportPath = path.join(__dirname, 'test-report.html');
    fs.writeFileSync(htmlReportPath, htmlReport);
    console.log(`🌐 HTML report saved to: ${htmlReportPath}`);
  }
}

// Run the test suite
const runner = new TestRunner();
runner.runAllTests().catch(console.error);
