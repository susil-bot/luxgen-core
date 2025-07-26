const axios = require('axios');
const mongoose = require('mongoose');

// Test configuration
const BASE_URL = 'http://localhost:3001';
const TEST_TENANT_ID = 'demo-tenant-001';
const TEST_USER_EMAIL = 'testuser@example.com';

// Test data
const testTenantData = {
  name: 'Test Training Organization',
  slug: 'test-org',
  description: 'A test organization for flow testing',
  contactEmail: 'admin@test-org.com',
  contactPhone: '+1234567890',
  website: 'https://test-org.com',
  industry: 'Technology',
  companySize: '11-50',
  styling: {
    branding: {
      primaryColor: '#FF0000',
      secondaryColor: '#CC0000',
      accentColor: '#00FF00'
    }
  }
};

const testUserRegistration = {
  email: TEST_USER_EMAIL,
  password: 'testpassword123',
  confirmPassword: 'testpassword123',
  firstName: 'Test',
  lastName: 'User',
  phone: '+1234567890',
  company: 'Test Company',
  jobTitle: 'Software Engineer',
  department: 'Engineering',
  industry: 'Technology',
  companySize: '11-50',
  tenantId: TEST_TENANT_ID,
  marketingConsent: true,
  termsAccepted: true,
  privacyPolicyAccepted: true
};

const testUserDetails = {
  dateOfBirth: '1990-01-01',
  gender: 'male',
  nationality: 'US',
  bio: 'A passionate software engineer with expertise in full-stack development.',
  skills: [
    {
      name: 'JavaScript',
      level: 'expert',
      yearsOfExperience: 5
    },
    {
      name: 'React',
      level: 'advanced',
      yearsOfExperience: 3
    }
  ],
  workExperience: [
    {
      company: 'Tech Corp',
      position: 'Senior Developer',
      location: 'San Francisco, CA',
      startDate: '2020-01-01',
      isCurrent: true,
      description: 'Leading development of web applications'
    }
  ]
};

// Test utilities
const log = (message, data = null) => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`🧪 ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
  console.log(`${'='.repeat(50)}`);
};

const testEndpoint = async (method, endpoint, data = null, token = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message, 
      status: error.response?.status 
    };
  }
};

// Test functions
const testHealthCheck = async () => {
  log('Testing Health Check');
  const result = await testEndpoint('GET', '/health');
  console.log(result.success ? '✅ Health check passed' : '❌ Health check failed');
  return result;
};

const testDatabaseStatus = async () => {
  log('Testing Database Status');
  const result = await testEndpoint('GET', '/api/database/status');
  console.log(result.success ? '✅ Database status check passed' : '❌ Database status check failed');
  return result;
};

const testTenantCreation = async () => {
  log('Testing Tenant Creation');
  const result = await testEndpoint('POST', '/api/tenant-schema', testTenantData);
  console.log(result.success ? '✅ Tenant creation passed' : '❌ Tenant creation failed');
  return result;
};

const testTenantStyling = async () => {
  log('Testing Tenant Styling');
  
  // Get tenant styling
  const getResult = await testEndpoint('GET', `/api/tenant-schema/${TEST_TENANT_ID}/styling`);
  console.log(getResult.success ? '✅ Get tenant styling passed' : '❌ Get tenant styling failed');
  
  // Update tenant styling
  const updateData = {
    branding: {
      primaryColor: '#FF6600',
      secondaryColor: '#FF4400'
    }
  };
  const updateResult = await testEndpoint('PUT', `/api/tenant-schema/${TEST_TENANT_ID}/styling`, updateData);
  console.log(updateResult.success ? '✅ Update tenant styling passed' : '❌ Update tenant styling failed');
  
  // Get CSS
  const cssResult = await testEndpoint('GET', `/api/tenant-schema/${TEST_TENANT_ID}/css`);
  console.log(cssResult.success ? '✅ Get tenant CSS passed' : '❌ Get tenant CSS failed');
  
  return { getResult, updateResult, cssResult };
};

const testUserRegistrationFlow = async () => {
  log('Testing User Registration');
  const result = await testEndpoint('POST', '/api/user-registration/register', testUserRegistration);
  console.log(result.success ? '✅ User registration passed' : '❌ User registration failed');
  return result;
};

const testUserDetailsFlow = async (userId) => {
  log('Testing User Details');
  
  // Create user details
  const createResult = await testEndpoint('PUT', `/api/user-details/${userId}`, testUserDetails);
  console.log(createResult.success ? '✅ Create user details passed' : '❌ Create user details failed');
  
  // Get user details
  const getResult = await testEndpoint('GET', `/api/user-details/${userId}`);
  console.log(getResult.success ? '✅ Get user details passed' : '❌ Get user details failed');
  
  // Add skill
  const skillData = {
    name: 'Node.js',
    level: 'advanced',
    yearsOfExperience: 4
  };
  const skillResult = await testEndpoint('POST', `/api/user-details/${userId}/skills`, skillData);
  console.log(skillResult.success ? '✅ Add skill passed' : '❌ Add skill failed');
  
  return { createResult, getResult, skillResult };
};

const testCompleteFlow = async () => {
  log('🚀 Starting Complete Flow Test');
  
  try {
    // 1. Health checks
    await testHealthCheck();
    await testDatabaseStatus();
    
    // 2. Tenant management
    await testTenantCreation();
    await testTenantStyling();
    
    // 3. User registration
    const registrationResult = await testUserRegistrationFlow();
    
    if (registrationResult.success) {
      const registrationId = registrationResult.data.data.registrationId;
      
      // 4. Get registration status
      log('Testing Registration Status');
      const statusResult = await testEndpoint('GET', `/api/user-registration/status/${registrationId}`);
      console.log(statusResult.success ? '✅ Registration status check passed' : '❌ Registration status check failed');
      
      // 5. Simulate email verification (in real app, this would be done via email)
      log('Testing Email Verification (Simulated)');
      // Note: In a real scenario, you would get the token from the email
      // For testing, we'll assume the user is verified and create a user account
      
      // 6. Test user details (assuming user is created)
      // In a real scenario, you would get the user ID from the verification process
      const mockUserId = '507f1f77bcf86cd799439011'; // Mock ObjectId
      await testUserDetailsFlow(mockUserId);
    }
    
    log('🎉 Complete Flow Test Finished');
    
  } catch (error) {
    console.error('❌ Flow test failed:', error.message);
  }
};

const testStylingFlow = async () => {
  log('🎨 Testing Styling Flow');
  
  try {
    // 1. Get current tenant styling
    const currentStyling = await testEndpoint('GET', `/api/tenant-schema/${TEST_TENANT_ID}/styling`);
    console.log('Current styling:', currentStyling.success ? '✅ Retrieved' : '❌ Failed');
    
    // 2. Update styling with new colors
    const newStyling = {
      branding: {
        primaryColor: '#FF1493', // Deep pink
        secondaryColor: '#4B0082', // Indigo
        accentColor: '#00CED1' // Dark turquoise
      },
      typography: {
        fontFamily: 'Roboto, sans-serif'
      },
      spacing: {
        lg: '2rem',
        xl: '3rem'
      }
    };
    
    const updateResult = await testEndpoint('PUT', `/api/tenant-schema/${TEST_TENANT_ID}/styling`, newStyling);
    console.log(updateResult.success ? '✅ Styling update passed' : '❌ Styling update failed');
    
    // 3. Get updated styling
    const updatedStyling = await testEndpoint('GET', `/api/tenant-schema/${TEST_TENANT_ID}/styling`);
    console.log(updatedStyling.success ? '✅ Updated styling retrieved' : '❌ Failed to get updated styling');
    
    // 4. Generate CSS
    const cssResult = await testEndpoint('GET', `/api/tenant-schema/${TEST_TENANT_ID}/css`);
    if (cssResult.success) {
      console.log('✅ CSS generated successfully');
      console.log('Generated CSS preview:');
      console.log(cssResult.data.substring(0, 200) + '...');
    } else {
      console.log('❌ CSS generation failed');
    }
    
    log('🎨 Styling Flow Test Completed');
    
  } catch (error) {
    console.error('❌ Styling flow test failed:', error.message);
  }
};

// Main test runner
const runTests = async () => {
  console.log('🚀 Starting Trainer Platform Flow Tests');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Test Tenant ID: ${TEST_TENANT_ID}`);
  
  try {
    // Run complete flow test
    await testCompleteFlow();
    
    // Run styling flow test
    await testStylingFlow();
    
    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
  }
};

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  testHealthCheck,
  testDatabaseStatus,
  testTenantCreation,
  testTenantStyling,
  testUserRegistrationFlow,
  testUserDetailsFlow,
  testCompleteFlow,
  testStylingFlow,
  runTests
}; 