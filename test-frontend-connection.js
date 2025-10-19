#!/usr/bin/env node

/**
 * Frontend-Backend Connection Test
 * Tests all API endpoints that the frontend needs
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001';
const API_V1_BASE = `${API_BASE_URL}/api/v1`;

// Test configuration
const tests = [
  {
    name: 'Health Check',
    endpoint: '/health',
    method: 'GET',
    expectedStatus: 200
  },
  {
    name: 'API Status',
    endpoint: '/api',
    method: 'GET',
    expectedStatus: 200
  },
  {
    name: 'Tenants API',
    endpoint: '/api/v1/tenants',
    method: 'GET',
    expectedStatus: 200
  },
  {
    name: 'Training Courses',
    endpoint: '/api/v1/training/courses',
    method: 'GET',
    expectedStatus: 200
  },
  {
    name: 'Jobs API',
    endpoint: '/api/v1/jobs',
    method: 'GET',
    expectedStatus: 200
  },
  {
    name: 'Activities API',
    endpoint: '/api/v1/activities',
    method: 'GET',
    expectedStatus: 200
  },
  {
    name: 'Content API',
    endpoint: '/api/v1/content',
    method: 'GET',
    expectedStatus: 200
  },
  {
    name: 'User Profile',
    endpoint: '/api/v1/users/me',
    method: 'GET',
    expectedStatus: 200
  },
  {
    name: 'Notifications',
    endpoint: '/api/v1/notifications',
    method: 'GET',
    expectedStatus: 200
  },
  {
    name: 'Auth Login (Validation Test)',
    endpoint: '/api/v1/auth/login',
    method: 'POST',
    expectedStatus: 400, // Should fail validation
    data: { email: 'test@example.com', password: 'weak' }
  }
];

async function runTest(test) {
  try {
    const url = `${API_BASE_URL}${test.endpoint}`;
    const config = {
      method: test.method,
      url,
      timeout: 5000,
      validateStatus: () => true // Don't throw on any status
    };

    if (test.data) {
      config.data = test.data;
      config.headers = { 'Content-Type': 'application/json' };
    }

    const response = await axios(config);
    
    const success = response.status === test.expectedStatus;
    const status = success ? '✅ PASS' : '❌ FAIL';
    
    console.log(`${status} ${test.name}`);
    console.log(`   URL: ${url}`);
    console.log(`   Status: ${response.status} (expected: ${test.expectedStatus})`);
    
    if (response.data && typeof response.data === 'object') {
      if (response.data.success !== undefined) {
        console.log(`   API Success: ${response.data.success}`);
      }
      if (response.data.data && Array.isArray(response.data.data)) {
        console.log(`   Data Count: ${response.data.data.length}`);
      }
    }
    
    console.log('');
    
    return success;
  } catch (error) {
    console.log(`❌ FAIL ${test.name}`);
    console.log(`   Error: ${error.message}`);
    console.log('');
    return false;
  }
}

async function runAllTests() {
  console.log('🧪 Frontend-Backend Connection Test');
  console.log('=====================================\n');
  
  console.log(`🔗 Testing API Base URL: ${API_BASE_URL}`);
  console.log(`📊 API Version 1 Base: ${API_V1_BASE}\n`);
  
  let passed = 0;
  let total = tests.length;
  
  for (const test of tests) {
    const success = await runTest(test);
    if (success) passed++;
  }
  
  console.log('📊 Test Results Summary');
  console.log('=======================');
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  console.log(`📈 Success Rate: ${Math.round((passed / total) * 100)}%`);
  
  if (passed === total) {
    console.log('\n🎉 All tests passed! Frontend-Backend connection is working perfectly!');
    console.log('🚀 Your LuxGen application is ready for development!');
  } else {
    console.log('\n⚠️ Some tests failed. Please check the backend configuration.');
  }
  
  console.log('\n📝 Frontend Configuration:');
  console.log('   REACT_APP_API_URL=http://localhost:3001');
  console.log('   REACT_APP_BACKEND_URL=http://localhost:3001');
  console.log('   REACT_APP_BACKEND_API_URL=http://localhost:3001/api/v1');
}

// Run the tests
runAllTests().catch(console.error);
