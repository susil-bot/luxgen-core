#!/usr/bin/env node

/**
 * 🧪 LuxGen Trainer Platform - API Test Automation Script
 * 
 * This script automates API testing using the test cases defined in API_TEST_CASES.csv
 * It can run tests sequentially, in parallel, or specific categories.
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const csv = require('csv-parser');
const { program } = require('commander');

// Configuration
const CONFIG = {
  baseUrl: process.env.API_BASE_URL || 'http://localhost:3001/api/v1',
  timeout: 10000,
  retries: 3,
  delay: 100, // Delay between requests in ms
  parallel: false,
  maxConcurrent: 5
};

// Test results storage
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  errors: [],
  startTime: null,
  endTime: null
};

// Environment variables (simulating Postman environment)
const environment = {
  auth_token: '',
  refresh_token: '',
  user_id: '',
  tenant_id: '',
  group_id: '',
  poll_id: '',
  session_id: '',
  course_id: '',
  module_id: '',
  assessment_id: '',
  presentation_id: '',
  schema_id: '',
  verification_token: '',
  reset_token: '',
  trainer_id: '',
  participant_id: '',
  instructor_id: '',
  presenter_id: '',
  tenant_slug: '',
  slide_index: '',
  question_id: '',
  document_id: ''
};

/**
 * Parse CSV test cases
 */
function parseTestCases(csvFile) {
  return new Promise((resolve, reject) => {
    const testCases = [];
    
    fs.createReadStream(csvFile)
      .pipe(csv({
        // Handle quoted fields properly
        quote: '"',
        escape: '"',
        // Don't trim fields to preserve JSON formatting
        trim: false
      }))
      .on('data', (row) => {
        testCases.push({
          id: row['Test Case ID'],
          category: row['Category'],
          endpoint: row['Endpoint'],
          method: row['Method'],
          url: row['URL'],
          headers: parseHeaders(row['Headers']),
          body: parseBody(row['Body']),
          expectedStatus: parseInt(row['Expected Status']),
          expectedResponse: row['Expected Response'],
          description: row['Description'],
          authRequired: row['Authentication Required'] === 'Yes',
          testData: row['Test Data']
        });
      })
      .on('end', () => resolve(testCases))
      .on('error', reject);
  });
}

/**
 * Parse headers string into object
 */
function parseHeaders(headersStr) {
  if (!headersStr) return {};
  
  const headers = {};
  const lines = headersStr.split(',');
  
  lines.forEach(line => {
    const [key, value] = line.split(':').map(s => s.trim());
    if (key && value) {
      headers[key] = value;
    }
  });
  
  return headers;
}

/**
 * Parse body string into object
 */
function parseBody(bodyStr) {
  if (!bodyStr) return null;
  
  // Handle CSV parsing issues with JSON content
  try {
    // If it's already a valid JSON string, parse it
    if (bodyStr.trim().startsWith('{') || bodyStr.trim().startsWith('[')) {
      return JSON.parse(bodyStr);
    }
    
    // If it's a simple string, return as is
    return bodyStr;
  } catch (error) {
    console.warn(`Warning: Could not parse body: ${bodyStr}`);
    return null;
  }
}

/**
 * Replace environment variables in string
 */
function replaceEnvVars(str) {
  if (!str) return str;
  
  return str.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return environment[key] || match;
  });
}

/**
 * Make HTTP request
 */
async function makeRequest(testCase) {
  const url = replaceEnvVars(testCase.url);
  const headers = { ...testCase.headers };
  
  // Add authentication if required
  if (testCase.authRequired && environment.auth_token) {
    headers['Authorization'] = `Bearer ${environment.auth_token}`;
  }
  
  // Replace environment variables in headers
  Object.keys(headers).forEach(key => {
    headers[key] = replaceEnvVars(headers[key]);
  });
  
  const config = {
    method: testCase.method.toLowerCase(),
    url,
    headers,
    timeout: CONFIG.timeout,
    validateStatus: () => true // Don't throw on non-2xx status
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
 * Validate test result
 */
function validateTest(testCase, result) {
  if (!result.success) {
    return {
      passed: false,
      error: `Request failed: ${result.error.message}`,
      actual: null
    };
  }
  
  const { response } = result;
  const statusMatch = response.status === testCase.expectedStatus;
  
  let responseMatch = true;
  let actualResponse = null;
  
  try {
    actualResponse = response.data;
    
    // Simple response validation (can be enhanced)
    if (testCase.expectedResponse && testCase.expectedResponse !== '') {
      const expected = JSON.parse(testCase.expectedResponse);
      responseMatch = JSON.stringify(actualResponse).includes(JSON.stringify(expected));
    }
  } catch (error) {
    responseMatch = false;
  }
  
  return {
    passed: statusMatch && responseMatch,
    error: null,
    actual: actualResponse,
    statusMatch,
    responseMatch
  };
}

/**
 * Extract environment variables from response
 */
function extractEnvVars(testCase, result) {
  if (!result.success || !result.response) return;
  
  const { response } = result;
  const data = response.data;
  
  // Extract common IDs from response
  if (data && data.data) {
    const responseData = data.data;
    
    if (responseData.user && responseData.user._id) {
      environment.user_id = responseData.user._id;
    }
    
    if (responseData.tenant && responseData.tenant._id) {
      environment.tenant_id = responseData.tenant._id;
    }
    
    if (responseData.group && responseData.group._id) {
      environment.group_id = responseData.group._id;
    }
    
    if (responseData.poll && responseData.poll._id) {
      environment.poll_id = responseData.poll._id;
    }
    
    if (responseData.session && responseData.session._id) {
      environment.session_id = responseData.session._id;
    }
    
    if (responseData.course && responseData.course._id) {
      environment.course_id = responseData.course._id;
    }
    
    if (responseData.module && responseData.module._id) {
      environment.module_id = responseData.module._id;
    }
    
    if (responseData.assessment && responseData.assessment._id) {
      environment.assessment_id = responseData.assessment._id;
    }
    
    if (responseData.presentation && responseData.presentation._id) {
      environment.presentation_id = responseData.presentation._id;
    }
    
    if (responseData.schema && responseData.schema._id) {
      environment.schema_id = responseData.schema._id;
    }
    
    // Extract tokens
    if (data.token) {
      environment.auth_token = data.token;
    }
    
    if (data.refreshToken) {
      environment.refresh_token = data.refreshToken;
    }
  }
}

/**
 * Run single test case
 */
async function runTest(testCase) {
  console.log(`🧪 Running ${testCase.id}: ${testCase.description}`);
  
  let retries = 0;
  let result;
  
  while (retries < CONFIG.retries) {
    result = await makeRequest(testCase);
    
    if (result.success) {
      break;
    }
    
    retries++;
    if (retries < CONFIG.retries) {
      console.log(`  ⏳ Retry ${retries}/${CONFIG.retries}...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  const validation = validateTest(testCase, result);
  
  // Extract environment variables
  extractEnvVars(testCase, result);
  
  // Update test results
  testResults.total++;
  
  if (validation.passed) {
    testResults.passed++;
    console.log(`  ✅ PASSED`);
  } else {
    testResults.failed++;
    console.log(`  ❌ FAILED: ${validation.error || 'Validation failed'}`);
    
    testResults.errors.push({
      testCase: testCase.id,
      description: testCase.description,
      error: validation.error,
      expected: {
        status: testCase.expectedStatus,
        response: testCase.expectedResponse
      },
      actual: validation.actual
    });
  }
  
  // Add delay between requests
  if (CONFIG.delay > 0) {
    await new Promise(resolve => setTimeout(resolve, CONFIG.delay));
  }
  
  return validation;
}

/**
 * Run tests sequentially
 */
async function runTestsSequentially(testCases) {
  for (const testCase of testCases) {
    await runTest(testCase);
  }
}

/**
 * Run tests in parallel
 */
async function runTestsParallel(testCases) {
  const chunks = [];
  for (let i = 0; i < testCases.length; i += CONFIG.maxConcurrent) {
    chunks.push(testCases.slice(i, i + CONFIG.maxConcurrent));
  }
  
  for (const chunk of chunks) {
    await Promise.all(chunk.map(testCase => runTest(testCase)));
  }
}

/**
 * Generate test report
 */
function generateReport() {
  const duration = testResults.endTime - testResults.startTime;
  const successRate = ((testResults.passed / testResults.total) * 100).toFixed(2);
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST EXECUTION REPORT');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed} ✅`);
  console.log(`Failed: ${testResults.failed} ❌`);
  console.log(`Skipped: ${testResults.skipped} ⏭️`);
  console.log(`Success Rate: ${successRate}%`);
  console.log(`Duration: ${duration}ms`);
  
  if (testResults.errors.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.errors.forEach(error => {
      console.log(`\n  ${error.testCase}: ${error.description}`);
      console.log(`    Error: ${error.error}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
  
  // Save report to file
  const report = {
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      skipped: testResults.skipped,
      successRate: parseFloat(successRate),
      duration
    },
    errors: testResults.errors,
    timestamp: new Date().toISOString()
  };
  
  fs.writeFileSync('test-report.json', JSON.stringify(report, null, 2));
  console.log('📄 Report saved to test-report.json');
}

/**
 * Main function
 */
async function main() {
  program
    .option('-f, --file <path>', 'CSV test file path', 'API_TEST_CASES.csv')
    .option('-c, --category <category>', 'Run tests for specific category')
    .option('-p, --parallel', 'Run tests in parallel')
    .option('-d, --delay <ms>', 'Delay between requests', '100')
    .option('-t, --timeout <ms>', 'Request timeout', '10000')
    .option('-r, --retries <count>', 'Number of retries', '3')
    .option('--base-url <url>', 'API base URL', CONFIG.baseUrl)
    .parse(process.argv);
  
  const options = program.opts();
  
  // Update configuration
  CONFIG.baseUrl = options.baseUrl;
  CONFIG.timeout = parseInt(options.timeout);
  CONFIG.retries = parseInt(options.retries);
  CONFIG.delay = parseInt(options.delay);
  CONFIG.parallel = options.parallel;
  
  console.log('🚀 LuxGen Trainer Platform - API Test Automation');
  console.log('='.repeat(60));
  console.log(`Base URL: ${CONFIG.baseUrl}`);
  console.log(`Test File: ${options.file}`);
  console.log(`Parallel: ${CONFIG.parallel}`);
  console.log(`Delay: ${CONFIG.delay}ms`);
  console.log(`Timeout: ${CONFIG.timeout}ms`);
  console.log(`Retries: ${CONFIG.retries}`);
  
  try {
    // Parse test cases
    console.log('\n📋 Parsing test cases...');
    const testCases = await parseTestCases(options.file);
    
    // Filter by category if specified
    let filteredTestCases = testCases;
    if (options.category) {
      filteredTestCases = testCases.filter(tc => 
        tc.category.toLowerCase() === options.category.toLowerCase()
      );
      console.log(`Filtered to ${filteredTestCases.length} tests in category: ${options.category}`);
    }
    
    if (filteredTestCases.length === 0) {
      console.log('❌ No test cases found!');
      process.exit(1);
    }
    
    // Run tests
    console.log(`\n🧪 Running ${filteredTestCases.length} test cases...`);
    testResults.startTime = Date.now();
    
    if (CONFIG.parallel) {
      await runTestsParallel(filteredTestCases);
    } else {
      await runTestsSequentially(filteredTestCases);
    }
    
    testResults.endTime = Date.now();
    
    // Generate report
    generateReport();
    
    // Exit with appropriate code
    process.exit(testResults.failed > 0 ? 1 : 0);
    
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
  runTestsSequentially,
  runTestsParallel,
  parseTestCases,
  validateTest
}; 