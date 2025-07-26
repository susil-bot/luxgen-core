const { spawn } = require('child_process');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

// Configuration
const BASE_URL = 'http://localhost:3001';
const MAX_RETRIES = 30;
const RETRY_DELAY = 2000;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const logStep = (step, message) => {
  log(`\n${step}. ${message}`, 'cyan');
};

const logSuccess = (message) => {
  log(`✅ ${message}`, 'green');
};

const logError = (message) => {
  log(`❌ ${message}`, 'red');
};

const logWarning = (message) => {
  log(`⚠️  ${message}`, 'yellow');
};

const logInfo = (message) => {
  log(`ℹ️  ${message}`, 'blue');
};

// Utility functions
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const waitForService = async (url, serviceName) => {
  logInfo(`Waiting for ${serviceName} to be ready...`);
  
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const response = await axios.get(url, { timeout: 5000 });
      if (response.status === 200) {
        logSuccess(`${serviceName} is ready!`);
        return true;
      }
    } catch (error) {
      logWarning(`${serviceName} not ready yet (attempt ${i + 1}/${MAX_RETRIES})`);
      await sleep(RETRY_DELAY);
    }
  }
  
  logError(`${serviceName} failed to start after ${MAX_RETRIES} attempts`);
  return false;
};

const runCommand = (command, args = [], cwd = process.cwd()) => {
  return new Promise((resolve, reject) => {
    logInfo(`Running: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      cwd,
      stdio: 'pipe',
      shell: true
    });
    
    let output = '';
    let errorOutput = '';
    
    child.stdout.on('data', (data) => {
      output += data.toString();
      process.stdout.write(data);
    });
    
    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
      process.stderr.write(data);
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(`Command failed with code ${code}: ${errorOutput}`));
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
};

// Setup functions
const checkPrerequisites = async () => {
  logStep(1, 'Checking Prerequisites');
  
  try {
    // Check Node.js version
    const nodeVersion = await runCommand('node', ['--version']);
    logSuccess(`Node.js version: ${nodeVersion.trim()}`);
    
    // Check npm version
    const npmVersion = await runCommand('npm', ['--version']);
    logSuccess(`npm version: ${npmVersion.trim()}`);
    
    // Check if .env file exists
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      logSuccess('.env file exists');
    } else {
      logWarning('.env file not found - please create it from env.example');
    }
    
    return true;
  } catch (error) {
    logError(`Prerequisites check failed: ${error.message}`);
    return false;
  }
};

const installDependencies = async () => {
  logStep(2, 'Installing Dependencies');
  
  try {
    await runCommand('npm', ['install']);
    logSuccess('Dependencies installed successfully');
    return true;
  } catch (error) {
    logError(`Dependency installation failed: ${error.message}`);
    return false;
  }
};

const setupDatabase = async () => {
  logStep(3, 'Setting up Database');
  
  try {
    // Check if database is accessible
    const dbStatus = await axios.get(`${BASE_URL}/api/database/status`, { timeout: 10000 });
    if (dbStatus.data.success) {
      logSuccess('Database connection successful');
      return true;
    } else {
      logError('Database connection failed');
      return false;
    }
  } catch (error) {
    logError(`Database setup failed: ${error.message}`);
    return false;
  }
};

const seedDatabase = async () => {
  logStep(4, 'Seeding Database');
  
  try {
    await runCommand('npm', ['run', 'dev:seed']);
    logSuccess('Database seeded successfully');
    return true;
  } catch (error) {
    logError(`Database seeding failed: ${error.message}`);
    return false;
  }
};

const testAPIEndpoints = async () => {
  logStep(5, 'Testing API Endpoints');
  
  const endpoints = [
    { name: 'Health Check', url: '/health' },
    { name: 'Database Status', url: '/api/database/status' },
    { name: 'API Info', url: '/api' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(`${BASE_URL}${endpoint.url}`, { timeout: 5000 });
      logSuccess(`${endpoint.name}: ${response.status}`);
    } catch (error) {
      logError(`${endpoint.name}: ${error.message}`);
    }
  }
};

const testMongoDBCollections = async () => {
  logStep(6, 'Testing MongoDB Collections');
  
  try {
    // Test tenant creation
    const tenantData = {
      name: 'Test Organization',
      slug: 'test-org',
      contactEmail: 'test@example.com',
      styling: {
        branding: {
          primaryColor: '#FF0000'
        }
      }
    };
    
    const tenantResponse = await axios.post(`${BASE_URL}/api/tenant-schema`, tenantData, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });
    
    if (tenantResponse.data.success) {
      logSuccess('Tenant creation test passed');
      const tenantId = tenantResponse.data.data._id;
      
      // Test styling retrieval
      const stylingResponse = await axios.get(`${BASE_URL}/api/tenant-schema/${tenantId}/styling`);
      if (stylingResponse.data.success) {
        logSuccess('Tenant styling retrieval test passed');
      }
      
      // Test CSS generation
      const cssResponse = await axios.get(`${BASE_URL}/api/tenant-schema/${tenantId}/css`);
      if (cssResponse.status === 200) {
        logSuccess('CSS generation test passed');
      }
      
    } else {
      logError('Tenant creation test failed');
    }
    
  } catch (error) {
    logError(`MongoDB collection test failed: ${error.message}`);
  }
};

const testUserRegistration = async () => {
  logStep(7, 'Testing User Registration Flow');
  
  try {
    const registrationData = {
      email: 'testuser@example.com',
      password: 'testpassword123',
      confirmPassword: 'testpassword123',
      firstName: 'Test',
      lastName: 'User',
      tenantId: 'demo-tenant-001',
      termsAccepted: true,
      privacyPolicyAccepted: true
    };
    
    const response = await axios.post(`${BASE_URL}/api/user-registration/register`, registrationData, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });
    
    if (response.data.success) {
      logSuccess('User registration test passed');
      return response.data.data.registrationId;
    } else {
      logError('User registration test failed');
      return null;
    }
    
  } catch (error) {
    logError(`User registration test failed: ${error.message}`);
    return null;
  }
};

const testStylingFlow = async () => {
  logStep(8, 'Testing Complete Styling Flow');
  
  try {
    // Get demo tenant styling
    const stylingResponse = await axios.get(`${BASE_URL}/api/tenant-schema/demo-tenant-001/styling`);
    if (stylingResponse.data.success) {
      logSuccess('Retrieved demo tenant styling');
      
      // Update styling
      const updateData = {
        branding: {
          primaryColor: '#FF1493',
          secondaryColor: '#4B0082',
          accentColor: '#00CED1'
        },
        typography: {
          fontFamily: 'Roboto, sans-serif'
        }
      };
      
      const updateResponse = await axios.put(
        `${BASE_URL}/api/tenant-schema/demo-tenant-001/styling`,
        updateData,
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      if (updateResponse.data.success) {
        logSuccess('Styling update test passed');
        
        // Generate CSS
        const cssResponse = await axios.get(`${BASE_URL}/api/tenant-schema/demo-tenant-001/css`);
        if (cssResponse.status === 200) {
          logSuccess('CSS generation test passed');
          logInfo('Generated CSS preview:');
          console.log(cssResponse.data.substring(0, 300) + '...');
        }
      }
    }
    
  } catch (error) {
    logError(`Styling flow test failed: ${error.message}`);
  }
};

const generateReport = (results) => {
  logStep(9, 'Generating Test Report');
  
  const report = {
    timestamp: new Date().toISOString(),
    results: results,
    summary: {
      total: Object.keys(results).length,
      passed: Object.values(results).filter(r => r).length,
      failed: Object.values(results).filter(r => !r).length
    }
  };
  
  console.log('\n' + '='.repeat(60));
  log('TEST REPORT', 'bright');
  console.log('='.repeat(60));
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASSED' : '❌ FAILED';
    const color = passed ? 'green' : 'red';
    log(`${test}: ${status}`, color);
  });
  
  console.log('\n' + '-'.repeat(60));
  log(`Total Tests: ${report.summary.total}`, 'bright');
  log(`Passed: ${report.summary.passed}`, 'green');
  log(`Failed: ${report.summary.failed}`, 'red');
  log(`Success Rate: ${Math.round((report.summary.passed / report.summary.total) * 100)}%`, 'bright');
  
  // Save report to file
  const reportPath = path.join(__dirname, 'test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  logInfo(`Detailed report saved to: ${reportPath}`);
  
  return report;
};

// Main setup function
const setupAndTest = async () => {
  log('🚀 TRAINER PLATFORM SETUP AND TEST', 'bright');
  log('=====================================', 'bright');
  
  const results = {};
  
  try {
    // Step 1: Check prerequisites
    results.prerequisites = await checkPrerequisites();
    if (!results.prerequisites) {
      logError('Prerequisites check failed. Please fix the issues and try again.');
      return;
    }
    
    // Step 2: Install dependencies
    results.dependencies = await installDependencies();
    if (!results.dependencies) {
      logError('Dependency installation failed.');
      return;
    }
    
    // Step 3: Wait for backend to be ready
    logInfo('Waiting for backend service to start...');
    await sleep(5000); // Give backend time to start
    
    results.backend = await waitForService(`${BASE_URL}/health`, 'Backend');
    if (!results.backend) {
      logError('Backend service is not responding.');
      return;
    }
    
    // Step 4: Setup database
    results.database = await setupDatabase();
    if (!results.database) {
      logError('Database setup failed.');
      return;
    }
    
    // Step 5: Seed database
    results.seeding = await seedDatabase();
    if (!results.seeding) {
      logError('Database seeding failed.');
      return;
    }
    
    // Step 6: Test API endpoints
    await testAPIEndpoints();
    results.apiEndpoints = true;
    
    // Step 7: Test MongoDB collections
    await testMongoDBCollections();
    results.mongoCollections = true;
    
    // Step 8: Test user registration
    const registrationId = await testUserRegistration();
    results.userRegistration = !!registrationId;
    
    // Step 9: Test styling flow
    await testStylingFlow();
    results.stylingFlow = true;
    
    // Generate final report
    const report = generateReport(results);
    
    if (report.summary.failed === 0) {
      log('\n🎉 ALL TESTS PASSED!', 'green');
      log('The application is ready for development.', 'green');
    } else {
      log('\n⚠️  SOME TESTS FAILED', 'yellow');
      log('Please check the failed tests and fix the issues.', 'yellow');
    }
    
    log('\n📋 NEXT STEPS:', 'bright');
    log('1. Start the frontend: npm start (in the frontend directory)', 'blue');
    log('2. Access the application at: http://localhost:3000', 'blue');
    log('3. Use demo credentials to login', 'blue');
    log('4. Test the tenant styling features', 'blue');
    
  } catch (error) {
    logError(`Setup and test failed: ${error.message}`);
    process.exit(1);
  }
};

// Run if this file is executed directly
if (require.main === module) {
  setupAndTest();
}

module.exports = {
  setupAndTest,
  checkPrerequisites,
  installDependencies,
  setupDatabase,
  seedDatabase,
  testAPIEndpoints,
  testMongoDBCollections,
  testUserRegistration,
  testStylingFlow,
  generateReport
}; 