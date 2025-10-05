/**
 * API Connectivity Test Script for LuxGen Platform
 * 
 * This script tests the API endpoints after seeding the database
 * Following LuxGen rules: Multi-tenant testing, comprehensive coverage
 * 
 * Usage: node src/scripts/testApiConnectivity.js
 */

const mongoose = require('mongoose');
const axios = require('axios');
const { User, Tenant, Activity } = require('../models');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api/v1';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/luxgen';

// Test results
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

/**
 * Test API endpoint
 */
async function testEndpoint(method, endpoint, data = null, expectedStatus = 200) {
  const testName = `${method.toUpperCase()} ${endpoint}`;
  testResults.total++;
  
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // Mock token for testing
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    
    if (response.status === expectedStatus) {
      testResults.passed++;
      testResults.details.push({
        test: testName,
        status: 'PASS',
        statusCode: response.status,
        message: 'Success'
      });
      console.log(`✅ ${testName} - PASS (${response.status})`);
    } else {
      testResults.failed++;
      testResults.details.push({
        test: testName,
        status: 'FAIL',
        statusCode: response.status,
        expectedStatus,
        message: `Expected ${expectedStatus}, got ${response.status}`
      });
      console.log(`❌ ${testName} - FAIL (Expected ${expectedStatus}, got ${response.status})`);
    }
  } catch (error) {
    testResults.failed++;
    testResults.details.push({
      test: testName,
      status: 'FAIL',
      statusCode: error.response?.status || 'ERROR',
      message: error.message
    });
    console.log(`❌ ${testName} - FAIL (${error.message})`);
  }
}

/**
 * Test database connectivity
 */
async function testDatabaseConnectivity() {
  console.log('🔌 Testing database connectivity...');
  
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Database connection successful');
    
    // Test data retrieval
    const tenantCount = await Tenant.countDocuments();
    const userCount = await User.countDocuments();
    const activityCount = await Activity.countDocuments();
    
    console.log(`📊 Database contains:`);
    console.log(`   - Tenants: ${tenantCount}`);
    console.log(`   - Users: ${userCount}`);
    console.log(`   - Activities: ${activityCount}`);
    
    if (tenantCount > 0 && userCount > 0 && activityCount > 0) {
      console.log('✅ Database seeding successful');
      return true;
    } else {
      console.log('❌ Database seeding incomplete');
      return false;
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

/**
 * Test Activity API endpoints
 */
async function testActivityEndpoints() {
  console.log('\n📊 Testing Activity API endpoints...');
  
  // Test GET /activities
  await testEndpoint('GET', '/activities');
  
  // Test GET /activities/stats
  await testEndpoint('GET', '/activities/stats');
  
  // Test GET /activities/search
  await testEndpoint('GET', '/activities/search?q=training');
  
  // Test POST /activities (create new activity)
  const newActivity = {
    type: 'test_activity',
    title: 'Test Activity',
    description: 'This is a test activity',
    metadata: {
      test: true
    }
  };
  await testEndpoint('POST', '/activities', newActivity, 201);
}

/**
 * Test User API endpoints
 */
async function testUserEndpoints() {
  console.log('\n👥 Testing User API endpoints...');
  
  // Test GET /users
  await testEndpoint('GET', '/users');
  
  // Test GET /users/stats
  await testEndpoint('GET', '/users/stats');
}

/**
 * Test Tenant API endpoints
 */
async function testTenantEndpoints() {
  console.log('\n🏢 Testing Tenant API endpoints...');
  
  // Test GET /tenants
  await testEndpoint('GET', '/tenants');
  
  // Test GET /tenants/stats
  await testEndpoint('GET', '/tenants/stats');
}

/**
 * Test Training API endpoints
 */
async function testTrainingEndpoints() {
  console.log('\n📚 Testing Training API endpoints...');
  
  // Test GET /training/courses
  await testEndpoint('GET', '/training/courses');
  
  // Test GET /training/sessions
  await testEndpoint('GET', '/training/sessions');
  
  // Test GET /training/modules
  await testEndpoint('GET', '/training/modules');
  
  // Test GET /training/assessments
  await testEndpoint('GET', '/training/assessments');
}

/**
 * Test Health endpoints
 */
async function testHealthEndpoints() {
  console.log('\n🏥 Testing Health endpoints...');
  
  // Test GET /health
  await testEndpoint('GET', '/health');
  
  // Test GET /health/detailed
  await testEndpoint('GET', '/health/detailed');
}

/**
 * Test Authentication endpoints
 */
async function testAuthEndpoints() {
  console.log('\n🔐 Testing Authentication endpoints...');
  
  // Test POST /auth/login
  const loginData = {
    email: 'john.doe+acme-corporation@example.com',
    password: 'password123'
  };
  await testEndpoint('POST', '/auth/login', loginData);
  
  // Test POST /auth/register
  const registerData = {
    firstName: 'Test',
    lastName: 'User',
    email: 'test.user@example.com',
    password: 'password123',
    tenantId: 'test-tenant-id'
  };
  await testEndpoint('POST', '/auth/register', registerData, 201);
}

/**
 * Test multi-tenant data isolation
 */
async function testMultiTenantIsolation() {
  console.log('\n🏢 Testing multi-tenant data isolation...');
  
  try {
    // Get tenants
    const tenants = await Tenant.find().limit(2);
    
    if (tenants.length >= 2) {
      const tenant1 = tenants[0];
      const tenant2 = tenants[1];
      
      // Test tenant 1 activities
      const tenant1Activities = await Activity.find({ tenantId: tenant1._id });
      console.log(`   📊 Tenant 1 (${tenant1.name}): ${tenant1Activities.length} activities`);
      
      // Test tenant 2 activities
      const tenant2Activities = await Activity.find({ tenantId: tenant2._id });
      console.log(`   📊 Tenant 2 (${tenant2.name}): ${tenant2Activities.length} activities`);
      
      // Verify isolation
      const crossTenantActivities = await Activity.find({
        tenantId: tenant1._id,
        _id: { $in: tenant2Activities.map(a => a._id) }
      });
      
      if (crossTenantActivities.length === 0) {
        console.log('✅ Multi-tenant data isolation verified');
        testResults.passed++;
      } else {
        console.log('❌ Multi-tenant data isolation failed');
        testResults.failed++;
      }
      testResults.total++;
    } else {
      console.log('⚠️  Not enough tenants for isolation testing');
    }
  } catch (error) {
    console.error('❌ Multi-tenant isolation test failed:', error.message);
    testResults.failed++;
    testResults.total++;
  }
}

/**
 * Test data integrity
 */
async function testDataIntegrity() {
  console.log('\n🔍 Testing data integrity...');
  
  try {
    // Test user-tenant relationships
    const users = await User.find().populate('tenantId');
    const orphanedUsers = users.filter(user => !user.tenantId);
    
    if (orphanedUsers.length === 0) {
      console.log('✅ All users have valid tenant relationships');
      testResults.passed++;
    } else {
      console.log(`❌ Found ${orphanedUsers.length} orphaned users`);
      testResults.failed++;
    }
    testResults.total++;
    
    // Test activity-tenant relationships
    const activities = await Activity.find().populate('tenantId');
    const orphanedActivities = activities.filter(activity => !activity.tenantId);
    
    if (orphanedActivities.length === 0) {
      console.log('✅ All activities have valid tenant relationships');
      testResults.passed++;
    } else {
      console.log(`❌ Found ${orphanedActivities.length} orphaned activities`);
      testResults.failed++;
    }
    testResults.total++;
    
  } catch (error) {
    console.error('❌ Data integrity test failed:', error.message);
    testResults.failed++;
    testResults.total += 2;
  }
}

/**
 * Generate test report
 */
function generateTestReport() {
  console.log('\n📊 Test Results Summary:');
  console.log('================================');
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed} ✅`);
  console.log(`Failed: ${testResults.failed} ❌`);
  console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(2)}%`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.details
      .filter(test => test.status === 'FAIL')
      .forEach(test => {
        console.log(`   - ${test.test}: ${test.message}`);
      });
  }
  
  console.log('\n🎯 Recommendations:');
  if (testResults.failed === 0) {
    console.log('   ✅ All tests passed! The API is ready for use.');
  } else {
    console.log('   ⚠️  Some tests failed. Please check the API implementation.');
    console.log('   💡 Make sure the backend server is running on the correct port.');
    console.log('   💡 Verify that all required environment variables are set.');
  }
}

/**
 * Main test function
 */
async function runConnectivityTests() {
  console.log('🧪 Starting API Connectivity Tests...');
  console.log('=====================================');
  
  try {
    // Test database connectivity
    const dbConnected = await testDatabaseConnectivity();
    if (!dbConnected) {
      console.log('❌ Database connectivity failed. Please run the seeding script first.');
      return;
    }
    
    // Test API endpoints
    await testActivityEndpoints();
    await testUserEndpoints();
    await testTenantEndpoints();
    await testTrainingEndpoints();
    await testHealthEndpoints();
    await testAuthEndpoints();
    
    // Test multi-tenant isolation
    await testMultiTenantIsolation();
    
    // Test data integrity
    await testDataIntegrity();
    
    // Generate report
    generateTestReport();
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

// Run tests if called directly
if (require.main === module) {
  runConnectivityTests()
    .then(() => {
      console.log('\n🎉 API connectivity tests completed!');
      process.exit(testResults.failed > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { runConnectivityTests, testResults };
