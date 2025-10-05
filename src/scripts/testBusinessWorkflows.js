/**
 * LUXGEN BUSINESS WORKFLOW TESTER
 * Test script for all business workflows
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const API_BASE = `${BASE_URL}/api/v1`;

// Test data
const testData = {
  jobPost: {
    title: 'Senior Software Engineer',
    description: 'We are looking for a senior software engineer to join our team. The ideal candidate will have experience with React, Node.js, and MongoDB.',
    company: {
      name: 'LuxGen Technologies',
      logo: 'https://luxgen.com/logo.png',
      website: 'https://luxgen.com'
    },
    location: {
      city: 'San Francisco',
      country: 'USA',
      remote: true
    },
    salary: {
      min: 120000,
      max: 180000,
      currency: 'USD',
      period: 'yearly'
    },
    requirements: [
      '5+ years of software development experience',
      'Experience with React and Node.js',
      'Strong problem-solving skills',
      'Excellent communication skills'
    ]
  },
  user: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@luxgen.com',
    role: 'admin',
    department: 'Engineering',
    phone: '+1-555-0123'
  },
  feedContent: {
    content: 'Exciting news! We are hiring for multiple positions. Check out our latest job openings.',
    type: 'announcement',
    visibility: 'public',
    attachments: []
  }
};

// Test functions
async function testWorkflowHealth() {
  console.log('🏥 Testing Workflow Health...');
  try {
    const response = await axios.get(`${API_BASE}/workflows/health`);
    console.log('✅ Workflow Health:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Workflow Health Test Failed:', error.message);
    return false;
  }
}

async function testWorkflowStatistics() {
  console.log('📊 Testing Workflow Statistics...');
  try {
    const response = await axios.get(`${API_BASE}/workflows/statistics`);
    console.log('✅ Workflow Statistics:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Workflow Statistics Test Failed:', error.message);
    return false;
  }
}

async function testAvailableWorkflows() {
  console.log('📋 Testing Available Workflows...');
  try {
    const response = await axios.get(`${API_BASE}/workflows`);
    console.log('✅ Available Workflows:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Available Workflows Test Failed:', error.message);
    return false;
  }
}

async function testJobPostWorkflow() {
  console.log('💼 Testing Job Post Workflow...');
  try {
    const response = await axios.post(`${API_BASE}/jobs`, testData.jobPost, {
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': 'luxgen',
        'X-User-ID': 'admin-user-123',
        'X-User-Role': 'admin'
      }
    });
    console.log('✅ Job Post Created:', response.data);
    return response.data.data?.jobId;
  } catch (error) {
    console.error('❌ Job Post Workflow Test Failed:', error.response?.data || error.message);
    return null;
  }
}

async function testUserManagementWorkflow() {
  console.log('👤 Testing User Management Workflow...');
  try {
    const response = await axios.post(`${API_BASE}/users`, testData.user, {
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': 'luxgen',
        'X-User-ID': 'admin-user-123',
        'X-User-Role': 'admin'
      }
    });
    console.log('✅ User Created:', response.data);
    return response.data.data?.userId;
  } catch (error) {
    console.error('❌ User Management Workflow Test Failed:', error.response?.data || error.message);
    return null;
  }
}

async function testFeedManagementWorkflow() {
  console.log('📰 Testing Feed Management Workflow...');
  try {
    const response = await axios.post(`${API_BASE}/feed`, testData.feedContent, {
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': 'luxgen',
        'X-User-ID': 'admin-user-123',
        'X-User-Role': 'admin'
      }
    });
    console.log('✅ Feed Content Created:', response.data);
    return response.data.data?.feedId;
  } catch (error) {
    console.error('❌ Feed Management Workflow Test Failed:', error.response?.data || error.message);
    return null;
  }
}

async function testWorkflowDocumentation() {
  console.log('📚 Testing Workflow Documentation...');
  try {
    const workflows = ['job-post-management', 'user-management', 'feed-management'];
    
    for (const workflowId of workflows) {
      const response = await axios.get(`${API_BASE}/workflows/${workflowId}/documentation`);
      console.log(`✅ ${workflowId} Documentation:`, response.data);
    }
    return true;
  } catch (error) {
    console.error('❌ Workflow Documentation Test Failed:', error.message);
    return false;
  }
}

async function testTenantWorkflows() {
  console.log('🏢 Testing Tenant Workflows...');
  try {
    const response = await axios.get(`${API_BASE}/workflows/tenant/luxgen`);
    console.log('✅ Tenant Workflows:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Tenant Workflows Test Failed:', error.message);
    return false;
  }
}

async function testWorkflowExecutionStatus(executionId) {
  console.log('⏳ Testing Workflow Execution Status...');
  try {
    const response = await axios.get(`${API_BASE}/workflows/${executionId}/status`);
    console.log('✅ Workflow Execution Status:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Workflow Execution Status Test Failed:', error.message);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 LUXGEN BUSINESS WORKFLOW TESTER');
  console.log('=====================================');
  console.log(`Testing against: ${BASE_URL}`);
  console.log('');

  const results = {
    health: false,
    statistics: false,
    workflows: false,
    jobPost: false,
    userManagement: false,
    feedManagement: false,
    documentation: false,
    tenantWorkflows: false
  };

  let executionIds = [];

  try {
    // Test workflow health
    results.health = await testWorkflowHealth();
    console.log('');

    // Test workflow statistics
    results.statistics = await testWorkflowStatistics();
    console.log('');

    // Test available workflows
    results.workflows = await testAvailableWorkflows();
    console.log('');

    // Test job post workflow
    const jobId = await testJobPostWorkflow();
    if (jobId) {
      results.jobPost = true;
      executionIds.push(jobId);
    }
    console.log('');

    // Test user management workflow
    const userId = await testUserManagementWorkflow();
    if (userId) {
      results.userManagement = true;
      executionIds.push(userId);
    }
    console.log('');

    // Test feed management workflow
    const feedId = await testFeedManagementWorkflow();
    if (feedId) {
      results.feedManagement = true;
      executionIds.push(feedId);
    }
    console.log('');

    // Test workflow documentation
    results.documentation = await testWorkflowDocumentation();
    console.log('');

    // Test tenant workflows
    results.tenantWorkflows = await testTenantWorkflows();
    console.log('');

    // Test workflow execution status for created items
    if (executionIds.length > 0) {
      for (const executionId of executionIds) {
        await testWorkflowExecutionStatus(executionId);
      }
    }

  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
  }

  // Print results
  console.log('📊 TEST RESULTS');
  console.log('===============');
  console.log(`Health Check: ${results.health ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Statistics: ${results.statistics ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Available Workflows: ${results.workflows ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Job Post Workflow: ${results.jobPost ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`User Management Workflow: ${results.userManagement ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Feed Management Workflow: ${results.feedManagement ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Documentation: ${results.documentation ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Tenant Workflows: ${results.tenantWorkflows ? '✅ PASS' : '❌ FAIL'}`);

  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  const successRate = (passedTests / totalTests) * 100;

  console.log('');
  console.log(`🎯 Overall Success Rate: ${successRate.toFixed(1)}% (${passedTests}/${totalTests})`);
  
  if (successRate === 100) {
    console.log('🎉 All tests passed! Business workflows are working correctly.');
  } else if (successRate >= 80) {
    console.log('⚠️ Most tests passed. Some workflows may need attention.');
  } else {
    console.log('❌ Multiple test failures. Please check the workflow implementation.');
  }

  console.log('');
  console.log('🔗 Useful Endpoints:');
  console.log(`   Health: ${BASE_URL}/api/v1/workflows/health`);
  console.log(`   Statistics: ${BASE_URL}/api/v1/workflows/statistics`);
  console.log(`   Available: ${BASE_URL}/api/v1/workflows`);
  console.log(`   Tenant: ${BASE_URL}/api/v1/workflows/tenant/luxgen`);
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  testWorkflowHealth,
  testWorkflowStatistics,
  testAvailableWorkflows,
  testJobPostWorkflow,
  testUserManagementWorkflow,
  testFeedManagementWorkflow,
  testWorkflowDocumentation,
  testTenantWorkflows,
  testWorkflowExecutionStatus
};
