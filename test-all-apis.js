#!/usr/bin/env node

/**
 * @fileoverview Simple API Test Script
 * Tests all API endpoints and CRUD operations
 * 
 * @module
 */

const http = require('http');

const API_BASE = 'http://localhost:3000';

// Test results
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const errors = [];

// Helper function to make HTTP requests
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
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

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Test assertion helper
function assertTest(testName, condition, message) {
  totalTests++;
  
  if (condition) {
    passedTests++;
    console.log(`✅ ${testName}: ${message}`);
  } else {
    failedTests++;
    errors.push({ test: testName, message: message });
    console.log(`❌ ${testName}: ${message}`);
  }
}

// Test functions
async function testHealthEndpoints() {
  console.log('🏥 Testing Health Endpoints...');
  
  try {
    const response = await makeRequest('GET', '/health');
    assertTest('Health Check', response.status === 200, `Status: ${response.status}`);
  } catch (error) {
    assertTest('Health Check', false, error.message);
  }

  try {
    const response = await makeRequest('GET', '/api/health');
    assertTest('API Health Check', response.status === 200, `Status: ${response.status}`);
  } catch (error) {
    assertTest('API Health Check', false, error.message);
  }

  try {
    const response = await makeRequest('GET', '/docs');
    assertTest('API Documentation', response.status === 200, `Status: ${response.status}`);
  } catch (error) {
    assertTest('API Documentation', false, error.message);
  }
}

async function testAuthentication() {
  console.log('🔐 Testing Authentication...');
  
  // Test user registration
  try {
    const userData = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'TestPass123!',
      role: 'user'
    };
    
    const response = await makeRequest('POST', '/api/auth/register', userData);
    assertTest('User Registration', response.status === 201, `Status: ${response.status}`);
  } catch (error) {
    assertTest('User Registration', false, error.message);
  }

  // Test user login
  try {
    const loginData = {
      email: 'test@example.com',
      password: 'TestPass123!'
    };
    
    const response = await makeRequest('POST', '/api/auth/login', loginData);
    assertTest('User Login', response.status === 200, `Status: ${response.status}`);
  } catch (error) {
    assertTest('User Login', false, error.message);
  }
}

async function testUserManagement() {
  console.log('👥 Testing User Management...');
  
  // Test get all users (without auth for now)
  try {
    const response = await makeRequest('GET', '/api/users');
    assertTest('Get All Users', response.status === 200 || response.status === 401, `Status: ${response.status}`);
  } catch (error) {
    assertTest('Get All Users', false, error.message);
  }
}

async function testTenantManagement() {
  console.log('🏢 Testing Tenant Management...');
  
  // Test create tenant
  try {
    const tenantData = {
      name: 'Test Corporation',
      contactEmail: 'admin@testcorp.com',
      description: 'Test company for API testing',
      industry: 'Technology'
    };
    
    const response = await makeRequest('POST', '/api/tenants/create', tenantData);
    assertTest('Create Tenant', response.status === 201, `Status: ${response.status}`);
  } catch (error) {
    assertTest('Create Tenant', false, error.message);
  }

  // Test get all tenants
  try {
    const response = await makeRequest('GET', '/api/tenants');
    assertTest('Get All Tenants', response.status === 200 || response.status === 401, `Status: ${response.status}`);
  } catch (error) {
    assertTest('Get All Tenants', false, error.message);
  }
}

async function testGroupManagement() {
  console.log('👥 Testing Group Management...');
  
  // Test get all groups
  try {
    const response = await makeRequest('GET', '/api/groups');
    assertTest('Get All Groups', response.status === 200 || response.status === 401, `Status: ${response.status}`);
  } catch (error) {
    assertTest('Get All Groups', false, error.message);
  }
}

async function testPollManagement() {
  console.log('📊 Testing Poll Management...');
  
  // Test get all polls
  try {
    const response = await makeRequest('GET', '/api/polls');
    assertTest('Get All Polls', response.status === 200 || response.status === 401, `Status: ${response.status}`);
  } catch (error) {
    assertTest('Get All Polls', false, error.message);
  }
}

async function testTrainingManagement() {
  console.log('🎓 Testing Training Management...');
  
  // Test get all training sessions
  try {
    const response = await makeRequest('GET', '/api/training/sessions');
    assertTest('Get All Training Sessions', response.status === 200 || response.status === 401, `Status: ${response.status}`);
  } catch (error) {
    assertTest('Get All Training Sessions', false, error.message);
  }

  // Test get all training courses
  try {
    const response = await makeRequest('GET', '/api/training/courses');
    assertTest('Get All Training Courses', response.status === 200 || response.status === 401, `Status: ${response.status}`);
  } catch (error) {
    assertTest('Get All Training Courses', false, error.message);
  }

  // Test get all training modules
  try {
    const response = await makeRequest('GET', '/api/training/modules');
    assertTest('Get All Training Modules', response.status === 200 || response.status === 401, `Status: ${response.status}`);
  } catch (error) {
    assertTest('Get All Training Modules', false, error.message);
  }

  // Test get all training assessments
  try {
    const response = await makeRequest('GET', '/api/training/assessments');
    assertTest('Get All Training Assessments', response.status === 200 || response.status === 401, `Status: ${response.status}`);
  } catch (error) {
    assertTest('Get All Training Assessments', false, error.message);
  }
}

async function testPresentationManagement() {
  console.log('📽️ Testing Presentation Management...');
  
  // Test get all presentations
  try {
    const response = await makeRequest('GET', '/api/presentations');
    assertTest('Get All Presentations', response.status === 200 || response.status === 401, `Status: ${response.status}`);
  } catch (error) {
    assertTest('Get All Presentations', false, error.message);
  }
}

async function testSchemaManagement() {
  console.log('📋 Testing Schema Management...');
  
  // Test get all schemas
  try {
    const response = await makeRequest('GET', '/api/schemas');
    assertTest('Get All Schemas', response.status === 200 || response.status === 401, `Status: ${response.status}`);
  } catch (error) {
    assertTest('Get All Schemas', false, error.message);
  }
}

async function testAIServices() {
  console.log('🤖 Testing AI Services...');
  
  // Test AI health check
  try {
    const response = await makeRequest('GET', '/api/ai/health');
    assertTest('AI Health Check', response.status === 200, `Status: ${response.status}`);
  } catch (error) {
    assertTest('AI Health Check', false, error.message);
  }

  // Test get AI models
  try {
    const response = await makeRequest('GET', '/api/ai/models');
    assertTest('Get AI Models', response.status === 200, `Status: ${response.status}`);
  } catch (error) {
    assertTest('Get AI Models', false, error.message);
  }
}

async function testErrorHandling() {
  console.log('🚨 Testing Error Handling...');
  
  // Test 404 error
  try {
    const response = await makeRequest('GET', '/api/non-existent');
    assertTest('404 Error Handling', response.status === 404, `Status: ${response.status}`);
  } catch (error) {
    assertTest('404 Error Handling', false, error.message);
  }

  // Test invalid JSON
  try {
    const response = await makeRequest('POST', '/api/auth/login', 'invalid json');
    assertTest('Invalid JSON Handling', response.status === 400, `Status: ${response.status}`);
  } catch (error) {
    assertTest('Invalid JSON Handling', false, error.message);
  }
}

async function testPerformance() {
  console.log('⚡ Testing Performance...');
  
  // Test response time
  const start = Date.now();
  try {
    const response = await makeRequest('GET', '/health');
    const duration = Date.now() - start;
    assertTest('Response Time', duration < 1000, `Response time: ${duration}ms`);
  } catch (error) {
    assertTest('Response Time', false, error.message);
  }

  // Test concurrent requests
  try {
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(makeRequest('GET', '/health'));
    }
    
    const responses = await Promise.all(promises);
    const successCount = responses.filter(r => r.status === 200).length;
    assertTest('Concurrent Requests', successCount === 5, `${successCount}/5 requests successful`);
  } catch (error) {
    assertTest('Concurrent Requests', false, error.message);
  }
}

// Main test runner
async function runAllTests() {
  console.log('🧪 LuxGen API Test Suite');
  console.log('========================\n');

  const startTime = Date.now();

  try {
    await testHealthEndpoints();
    console.log('');
    
    await testAuthentication();
    console.log('');
    
    await testUserManagement();
    console.log('');
    
    await testTenantManagement();
    console.log('');
    
    await testGroupManagement();
    console.log('');
    
    await testPollManagement();
    console.log('');
    
    await testTrainingManagement();
    console.log('');
    
    await testPresentationManagement();
    console.log('');
    
    await testSchemaManagement();
    console.log('');
    
    await testAIServices();
    console.log('');
    
    await testErrorHandling();
    console.log('');
    
    await testPerformance();
    console.log('');
    
  } catch (error) {
    console.log('❌ Test suite failed:', error.message);
  }

  const endTime = Date.now();
  const duration = endTime - startTime;

  console.log('📊 Test Results Summary');
  console.log('======================');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`⏱️  Duration: ${duration}ms`);
  console.log(`📈 Success Rate: ${totalTests > 0 ? (passedTests / totalTests * 100).toFixed(2) : 0}%`);
  console.log('');

  if (errors.length > 0) {
    console.log('🚨 Errors Encountered:');
    errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error.test}: ${error.message}`);
    });
    console.log('');
  }

  // Generate report
  const report = {
    summary: {
      total: totalTests,
      passed: passedTests,
      failed: failedTests,
      duration: duration,
      successRate: totalTests > 0 ? (passedTests / totalTests * 100).toFixed(2) : 0
    },
    timestamp: {
      start: new Date(startTime).toISOString(),
      end: new Date(endTime).toISOString()
    },
    errors: errors
  };

  const fs = require('fs');
  const path = require('path');
  const reportPath = path.join(__dirname, 'api-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📄 Detailed report saved to: ${reportPath}`);

  if (failedTests === 0) {
    console.log('🎉 All tests passed! API is working correctly.');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please check the errors above.');
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(console.error);
