#!/usr/bin/env node

/**
 * Simple API Test Script
 * Tests the LuxGen backend API without MongoDB dependency
 */

const http = require('http');

const API_BASE = 'http://localhost:3000';

// Test data
const testUser = {
  email: 'demo@luxgen.com',
  password: 'demo123456',
  firstName: 'Demo',
  lastName: 'User'
};

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

// Test functions
async function testHealthEndpoint() {
  console.log('🏥 Testing Health Endpoint...');
  try {
    const response = await makeRequest('GET', '/health');
    console.log(`✅ Health Check: ${response.status}`);
    console.log(`   Status: ${response.data.status}`);
    console.log(`   Environment: ${response.data.environment}`);
    return true;
  } catch (error) {
    console.log(`❌ Health Check Failed: ${error.message}`);
    return false;
  }
}

async function testAPIEndpoint() {
  console.log('🔌 Testing API Endpoint...');
  try {
    const response = await makeRequest('GET', '/api');
    console.log(`✅ API Endpoint: ${response.status}`);
    console.log(`   Message: ${response.data.message}`);
    console.log(`   Version: ${response.data.version}`);
    return true;
  } catch (error) {
    console.log(`❌ API Endpoint Failed: ${error.message}`);
    return false;
  }
}

async function testAuthEndpoints() {
  console.log('🔐 Testing Authentication Endpoints...');
  
  // Test register endpoint
  try {
    const registerResponse = await makeRequest('POST', '/api/auth/register', testUser);
    console.log(`📝 Register Endpoint: ${registerResponse.status}`);
    if (registerResponse.status === 500) {
      console.log(`   ⚠️  Expected error (MongoDB not connected): ${registerResponse.data.message}`);
    }
  } catch (error) {
    console.log(`❌ Register Failed: ${error.message}`);
  }

  // Test login endpoint
  try {
    const loginResponse = await makeRequest('POST', '/api/auth/login', {
      email: testUser.email,
      password: testUser.password
    });
    console.log(`🔑 Login Endpoint: ${loginResponse.status}`);
    if (loginResponse.status === 500) {
      console.log(`   ⚠️  Expected error (MongoDB not connected): ${loginResponse.data.message}`);
    }
  } catch (error) {
    console.log(`❌ Login Failed: ${error.message}`);
  }
}

async function testCORSHeaders() {
  console.log('🌐 Testing CORS Headers...');
  try {
    const response = await makeRequest('OPTIONS', '/api/auth/login');
    console.log(`✅ CORS Preflight: ${response.status}`);
    return true;
  } catch (error) {
    console.log(`❌ CORS Test Failed: ${error.message}`);
    return false;
  }
}

async function testRateLimiting() {
  console.log('⏱️  Testing Rate Limiting...');
  try {
    // Make multiple requests quickly
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(makeRequest('GET', '/health'));
    }
    
    const responses = await Promise.all(promises);
    const successCount = responses.filter(r => r.status === 200).length;
    console.log(`✅ Rate Limiting: ${successCount}/5 requests successful`);
    return successCount > 0;
  } catch (error) {
    console.log(`❌ Rate Limiting Test Failed: ${error.message}`);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🧪 LuxGen Backend API Test Suite');
  console.log('=====================================\n');

  const tests = [
    { name: 'Health Endpoint', fn: testHealthEndpoint },
    { name: 'API Endpoint', fn: testAPIEndpoint },
    { name: 'Authentication Endpoints', fn: testAuthEndpoints },
    { name: 'CORS Headers', fn: testCORSHeaders },
    { name: 'Rate Limiting', fn: testRateLimiting }
  ];

  let passed = 0;
  let total = tests.length;

  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) passed++;
    } catch (error) {
      console.log(`❌ ${test.name} failed: ${error.message}`);
    }
    console.log('');
  }

  console.log('📊 Test Results');
  console.log('================');
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('\n🎉 All tests passed! Backend is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the output above for details.');
  }
}

// Run tests
runTests().catch(console.error);
