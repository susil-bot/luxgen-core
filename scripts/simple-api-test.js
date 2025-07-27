#!/usr/bin/env node

/**
 * 🧪 Simple API Test Script for LuxGen Trainer Platform
 * 
 * This script tests the API endpoints without relying on CSV parsing
 */

const axios = require('axios');

// Configuration
const CONFIG = {
  baseUrl: process.env.API_BASE_URL || 'http://localhost:3001',
  timeout: 10000,
  delay: 100
};

// Test results
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

// Environment variables
const env = {
  auth_token: '',
  user_id: '',
  tenant_id: ''
};

// Test cases
const testCases = [
  // Health checks
  {
    id: 'TC001',
    name: 'Health Check',
    method: 'GET',
    url: '/health',
    expectedStatus: 200,
    auth: false
  },
  {
    id: 'TC002',
    name: 'API Health Check',
    method: 'GET',
    url: '/health',
    expectedStatus: 200,
    auth: false
  },
  {
    id: 'TC003',
    name: 'API Documentation',
    method: 'GET',
    url: '/docs',
    expectedStatus: 200,
    auth: false
  },
  
  // Authentication tests
  {
    id: 'TC004',
    name: 'User Registration',
    method: 'POST',
    url: '/api/v1/auth/register',
    body: {
      firstName: 'Test',
      lastName: 'User',
      email: 'testuser123@example.com',
      password: 'TestPass123!',
      role: 'user'
    },
    expectedStatus: 201,
    auth: false
  },
  {
    id: 'TC005',
    name: 'User Login',
    method: 'POST',
    url: '/api/v1/auth/login',
    body: {
      email: 'testuser123@example.com',
      password: 'TestPass123!'
    },
    expectedStatus: 200,
    auth: false,
    extractToken: true
  },
  {
    id: 'TC006',
    name: 'Get Profile (Authenticated)',
    method: 'GET',
    url: '/api/v1/auth/profile',
    expectedStatus: 200,
    auth: true
  },
  
  // User management tests
  {
    id: 'TC007',
    name: 'Get All Users',
    method: 'GET',
    url: '/api/v1/users',
    expectedStatus: 200,
    auth: true
  },
  {
    id: 'TC008',
    name: 'Create User',
    method: 'POST',
    url: '/api/v1/users',
    body: {
      firstName: 'New',
      lastName: 'User',
      email: 'newuser123@example.com',
      password: 'TestPass123!',
      role: 'user'
    },
    expectedStatus: 201,
    auth: true
  },
  
  // Tenant management tests
  {
    id: 'TC009',
    name: 'Create Tenant',
    method: 'POST',
    url: '/api/v1/tenants/create',
    body: {
      name: 'Test Corporation',
      contactEmail: 'admin@testcorp.com',
      description: 'Test company',
      industry: 'Technology'
    },
    expectedStatus: 201,
    auth: false
  },
  {
    id: 'TC010',
    name: 'Get All Tenants',
    method: 'GET',
    url: '/api/v1/tenants',
    expectedStatus: 200,
    auth: true
  },
  
  // AI services tests
  {
    id: 'TC011',
    name: 'AI Health Check',
    method: 'GET',
    url: '/api/v1/ai/health',
    expectedStatus: 200,
    auth: false
  },
  {
    id: 'TC012',
    name: 'Get AI Models',
    method: 'GET',
    url: '/api/v1/ai/models',
    expectedStatus: 200,
    auth: false
  },
  
  // Polls tests
  {
    id: 'TC013',
    name: 'Get All Polls',
    method: 'GET',
    url: '/api/v1/polls',
    expectedStatus: 200,
    auth: true
  },
  {
    id: 'TC014',
    name: 'Create Poll',
    method: 'POST',
    url: '/api/v1/polls',
    body: {
      title: 'Test Poll',
      questions: [
        {
          type: 'rating',
          text: 'Rate this test'
        }
      ],
      status: 'active'
    },
    expectedStatus: 201,
    auth: true
  }
];

/**
 * Make HTTP request
 */
async function makeRequest(testCase) {
  const url = `${CONFIG.baseUrl}${testCase.url}`;
  const headers = {
    'Content-Type': 'application/json'
  };
  
  // Add authentication if required
  if (testCase.auth && env.auth_token) {
    headers['Authorization'] = `Bearer ${env.auth_token}`;
  }
  
  const config = {
    method: testCase.method.toLowerCase(),
    url,
    headers,
    timeout: CONFIG.timeout,
    validateStatus: () => true
  };
  
  if (testCase.body) {
    config.data = testCase.body;
  }
  
  try {
    const response = await axios(config);
    return { success: true, response };
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * Extract environment variables from response
 */
function extractEnvVars(testCase, result) {
  if (!result.success || !result.response) return;
  
  const { response } = result;
  const data = response.data;
  
  // Extract token from login response
  if (testCase.extractToken && data.success && data.data && data.data.token) {
    env.auth_token = data.data.token;
    console.log(`  🔑 Token extracted: ${data.data.token.substring(0, 20)}...`);
  }
  
  // Extract user ID from registration/login
  if (data.success && data.data && data.data.user && data.data.user.id) {
    env.user_id = data.data.user.id;
    console.log(`  👤 User ID extracted: ${data.data.user.id}`);
  }
  
  // Extract tenant ID from tenant creation
  if (data.success && data.data && data.data.tenant && data.data.tenant.id) {
    env.tenant_id = data.data.tenant.id;
    console.log(`  🏢 Tenant ID extracted: ${data.data.tenant.id}`);
  }
}

/**
 * Run single test case
 */
async function runTest(testCase) {
  console.log(`🧪 Running ${testCase.id}: ${testCase.name}`);
  
  const result = await makeRequest(testCase);
  
  // Extract environment variables
  extractEnvVars(testCase, result);
  
  // Update test results
  results.total++;
  
  if (result.success) {
    const { response } = result;
    const statusMatch = response.status === testCase.expectedStatus;
    
    if (statusMatch) {
      results.passed++;
      console.log(`  ✅ PASSED (${response.status})`);
    } else {
      results.failed++;
      console.log(`  ❌ FAILED: Expected ${testCase.expectedStatus}, got ${response.status}`);
      
      results.errors.push({
        testCase: testCase.id,
        name: testCase.name,
        expected: testCase.expectedStatus,
        actual: response.status,
        response: response.data
      });
    }
  } else {
    results.failed++;
    console.log(`  ❌ FAILED: ${result.error.message}`);
    
    results.errors.push({
      testCase: testCase.id,
      name: testCase.name,
      error: result.error.message
    });
  }
  
  // Add delay between requests
  if (CONFIG.delay > 0) {
    await new Promise(resolve => setTimeout(resolve, CONFIG.delay));
  }
}

/**
 * Generate test report
 */
function generateReport() {
  const successRate = ((results.passed / results.total) * 100).toFixed(2);
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST EXECUTION REPORT');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${results.total}`);
  console.log(`Passed: ${results.passed} ✅`);
  console.log(`Failed: ${results.failed} ❌`);
  console.log(`Success Rate: ${successRate}%`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.errors.forEach(error => {
      console.log(`\n  ${error.testCase}: ${error.name}`);
      if (error.error) {
        console.log(`    Error: ${error.error}`);
      } else {
        console.log(`    Expected: ${error.expected}, Got: ${error.actual}`);
      }
    });
  }
  
  console.log('\n' + '='.repeat(60));
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 LuxGen Trainer Platform - Simple API Test');
  console.log('='.repeat(60));
  console.log(`Base URL: ${CONFIG.baseUrl}`);
  console.log(`Total Tests: ${testCases.length}`);
  
  try {
    // Run tests sequentially
    for (const testCase of testCases) {
      await runTest(testCase);
    }
    
    // Generate report
    generateReport();
    
    // Exit with appropriate code
    process.exit(results.failed > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  runTest,
  testCases,
  results
}; 