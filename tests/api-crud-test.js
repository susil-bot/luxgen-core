#!/usr/bin/env node

/**
 * @fileoverview API CRUD Test Suite
 * Tests all CRUD operations for all API endpoints without external dependencies
 * 
 * @module
 */

const http = require('http');

class APICRUDTester {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      errors: [],
      startTime: new Date()
    };
    
    this.authToken = null;
    this.testData = {
      userId: null,
      tenantId: null,
      pollId: null,
      groupId: null,
      sessionId: null,
      courseId: null,
      moduleId: null,
      assessmentId: null,
      presentationId: null,
      schemaId: null
    };
  }

  async runAllTests() {
    console.log('🧪 LuxGen API CRUD Test Suite');
    console.log('==============================\n');
    
    try {
      // Test basic connectivity
      await this.testHealthCheck();
      
      // Test authentication
      await this.testAuthentication();
      
      // Test all CRUD operations
      await this.testUserCRUD();
      await this.testTenantCRUD();
      await this.testGroupCRUD();
      await this.testPollCRUD();
      await this.testTrainingCRUD();
      await this.testPresentationCRUD();
      await this.testSchemaCRUD();
      await this.testAIServices();
      
      // Test error handling
      await this.testErrorHandling();
      
      this.generateReport();
      
    } catch (error) {
      console.log('❌ Test suite failed:', error.message);
      process.exit(1);
    }
  }

  async makeRequest(method, path, data = null, headers = {}) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: path,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      };

      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try {
            const jsonBody = JSON.parse(body);
            resolve({ status: res.statusCode, data: jsonBody, headers: res.headers });
          } catch (e) {
            resolve({ status: res.statusCode, data: body, headers: res.headers });
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

  async testHealthCheck() {
    console.log('🏥 Testing Health Check...');
    try {
      const response = await this.makeRequest('GET', '/health');
      this.assertTest('Health Check', response.status === 200, `Status: ${response.status}`);
      console.log(`   ✅ Health Check: ${response.data.status}`);
    } catch (error) {
      this.assertTest('Health Check', false, error.message);
    }
    console.log('');
  }

  async testAuthentication() {
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
      
      const response = await this.makeRequest('POST', '/api/auth/register', userData);
      this.assertTest('User Registration', response.status === 201, `Status: ${response.status}`);
      console.log(`   ✅ User Registration: ${response.data.message}`);
    } catch (error) {
      this.assertTest('User Registration', false, error.message);
    }

    // Test user login
    try {
      const loginData = {
        email: 'test@example.com',
        password: 'TestPass123!'
      };
      
      const response = await this.makeRequest('POST', '/api/auth/login', loginData);
      this.assertTest('User Login', response.status === 200, `Status: ${response.status}`);
      
      if (response.data.token) {
        this.authToken = response.data.token;
        console.log(`   ✅ User Login: Token received`);
      }
    } catch (error) {
      this.assertTest('User Login', false, error.message);
    }

    // Test get profile
    if (this.authToken) {
      try {
        const response = await this.makeRequest('GET', '/api/auth/profile', null, {
          'Authorization': `Bearer ${this.authToken}`
        });
        this.assertTest('Get Profile', response.status === 200, `Status: ${response.status}`);
        
        if (response.data.user && response.data.user._id) {
          this.testData.userId = response.data.user._id;
          console.log(`   ✅ Get Profile: User ID ${this.testData.userId}`);
        }
      } catch (error) {
        this.assertTest('Get Profile', false, error.message);
      }
    }
    
    console.log('');
  }

  async testUserCRUD() {
    console.log('👥 Testing User CRUD Operations...');
    
    if (!this.authToken) {
      console.log('   ⚠️  Skipping User CRUD tests - No auth token');
      console.log('');
      return;
    }

    const headers = { 'Authorization': `Bearer ${this.authToken}` };

    // Test get all users
    try {
      const response = await this.makeRequest('GET', '/api/users', null, headers);
      this.assertTest('Get All Users', response.status === 200, `Status: ${response.status}`);
      console.log(`   ✅ Get All Users: ${response.data.users ? response.data.users.length : 0} users`);
    } catch (error) {
      this.assertTest('Get All Users', false, error.message);
    }

    // Test get user by ID
    if (this.testData.userId) {
      try {
        const response = await this.makeRequest('GET', `/api/users/${this.testData.userId}`, null, headers);
        this.assertTest('Get User by ID', response.status === 200, `Status: ${response.status}`);
        console.log(`   ✅ Get User by ID: User found`);
      } catch (error) {
        this.assertTest('Get User by ID', false, error.message);
      }
    }

    // Test update user
    if (this.testData.userId) {
      try {
        const updateData = {
          firstName: 'Updated',
          lastName: 'User'
        };
        
        const response = await this.makeRequest('PUT', `/api/users/${this.testData.userId}`, updateData, headers);
        this.assertTest('Update User', response.status === 200, `Status: ${response.status}`);
        console.log(`   ✅ Update User: User updated`);
      } catch (error) {
        this.assertTest('Update User', false, error.message);
      }
    }
    
    console.log('');
  }

  async testTenantCRUD() {
    console.log('🏢 Testing Tenant CRUD Operations...');
    
    if (!this.authToken) {
      console.log('   ⚠️  Skipping Tenant CRUD tests - No auth token');
      console.log('');
      return;
    }

    const headers = { 'Authorization': `Bearer ${this.authToken}` };

    // Test create tenant
    try {
      const tenantData = {
        name: 'Test Corporation',
        contactEmail: 'admin@testcorp.com',
        description: 'Test company for API testing',
        industry: 'Technology'
      };
      
      const response = await this.makeRequest('POST', '/api/tenants/create', tenantData);
      this.assertTest('Create Tenant', response.status === 201, `Status: ${response.status}`);
      
      if (response.data.tenant && response.data.tenant._id) {
        this.testData.tenantId = response.data.tenant._id;
        console.log(`   ✅ Create Tenant: Tenant ID ${this.testData.tenantId}`);
      }
    } catch (error) {
      this.assertTest('Create Tenant', false, error.message);
    }

    // Test get all tenants
    try {
      const response = await this.makeRequest('GET', '/api/tenants', null, headers);
      this.assertTest('Get All Tenants', response.status === 200, `Status: ${response.status}`);
      console.log(`   ✅ Get All Tenants: ${response.data.tenants ? response.data.tenants.length : 0} tenants`);
    } catch (error) {
      this.assertTest('Get All Tenants', false, error.message);
    }

    // Test get tenant by ID
    if (this.testData.tenantId) {
      try {
        const response = await this.makeRequest('GET', `/api/tenants/${this.testData.tenantId}`, null, headers);
        this.assertTest('Get Tenant by ID', response.status === 200, `Status: ${response.status}`);
        console.log(`   ✅ Get Tenant by ID: Tenant found`);
      } catch (error) {
        this.assertTest('Get Tenant by ID', false, error.message);
      }
    }

    // Test update tenant
    if (this.testData.tenantId) {
      try {
        const updateData = {
          name: 'Updated Corporation',
          description: 'Updated description'
        };
        
        const response = await this.makeRequest('PUT', `/api/tenants/${this.testData.tenantId}`, updateData, headers);
        this.assertTest('Update Tenant', response.status === 200, `Status: ${response.status}`);
        console.log(`   ✅ Update Tenant: Tenant updated`);
      } catch (error) {
        this.assertTest('Update Tenant', false, error.message);
      }
    }

    // Test get tenant statistics
    try {
      const response = await this.makeRequest('GET', '/api/tenants/stats', null, headers);
      this.assertTest('Get Tenant Stats', response.status === 200, `Status: ${response.status}`);
      console.log(`   ✅ Get Tenant Stats: Statistics retrieved`);
    } catch (error) {
      this.assertTest('Get Tenant Stats', false, error.message);
    }
    
    console.log('');
  }

  async testGroupCRUD() {
    console.log('👥 Testing Group CRUD Operations...');
    
    if (!this.authToken) {
      console.log('   ⚠️  Skipping Group CRUD tests - No auth token');
      console.log('');
      return;
    }

    const headers = { 'Authorization': `Bearer ${this.authToken}` };

    // Test get all groups
    try {
      const response = await this.makeRequest('GET', '/api/groups', null, headers);
      this.assertTest('Get All Groups', response.status === 200, `Status: ${response.status}`);
      console.log(`   ✅ Get All Groups: ${response.data.groups ? response.data.groups.length : 0} groups`);
    } catch (error) {
      this.assertTest('Get All Groups', false, error.message);
    }

    // Test create group
    try {
      const groupData = {
        name: 'Test Training Group',
        description: 'Group for testing API functionality',
        trainerId: 'trainer_id',
        maxSize: 20
      };
      
      const response = await this.makeRequest('POST', '/api/groups', groupData, headers);
      this.assertTest('Create Group', response.status === 201, `Status: ${response.status}`);
      
      if (response.data.group && response.data.group._id) {
        this.testData.groupId = response.data.group._id;
        console.log(`   ✅ Create Group: Group ID ${this.testData.groupId}`);
      }
    } catch (error) {
      this.assertTest('Create Group', false, error.message);
    }

    // Test get group by ID
    if (this.testData.groupId) {
      try {
        const response = await this.makeRequest('GET', `/api/groups/${this.testData.groupId}`, null, headers);
        this.assertTest('Get Group by ID', response.status === 200, `Status: ${response.status}`);
        console.log(`   ✅ Get Group by ID: Group found`);
      } catch (error) {
        this.assertTest('Get Group by ID', false, error.message);
      }
    }

    // Test update group
    if (this.testData.groupId) {
      try {
        const updateData = {
          name: 'Updated Group',
          description: 'Updated description'
        };
        
        const response = await this.makeRequest('PUT', `/api/groups/${this.testData.groupId}`, updateData, headers);
        this.assertTest('Update Group', response.status === 200, `Status: ${response.status}`);
        console.log(`   ✅ Update Group: Group updated`);
      } catch (error) {
        this.assertTest('Update Group', false, error.message);
      }
    }
    
    console.log('');
  }

  async testPollCRUD() {
    console.log('📊 Testing Poll CRUD Operations...');
    
    if (!this.authToken) {
      console.log('   ⚠️  Skipping Poll CRUD tests - No auth token');
      console.log('');
      return;
    }

    const headers = { 'Authorization': `Bearer ${this.authToken}` };

    // Test get all polls
    try {
      const response = await this.makeRequest('GET', '/api/polls', null, headers);
      this.assertTest('Get All Polls', response.status === 200, `Status: ${response.status}`);
      console.log(`   ✅ Get All Polls: ${response.data.polls ? response.data.polls.length : 0} polls`);
    } catch (error) {
      this.assertTest('Get All Polls', false, error.message);
    }

    // Test create poll
    try {
      const pollData = {
        title: 'Test Poll',
        description: 'This is a test poll for API testing',
        questions: [
          {
            type: 'rating',
            text: 'Rate the training session',
            options: ['1', '2', '3', '4', '5']
          }
        ],
        status: 'active'
      };
      
      const response = await this.makeRequest('POST', '/api/polls', pollData, headers);
      this.assertTest('Create Poll', response.status === 201, `Status: ${response.status}`);
      
      if (response.data.poll && response.data.poll._id) {
        this.testData.pollId = response.data.poll._id;
        console.log(`   ✅ Create Poll: Poll ID ${this.testData.pollId}`);
      }
    } catch (error) {
      this.assertTest('Create Poll', false, error.message);
    }

    // Test get poll by ID
    if (this.testData.pollId) {
      try {
        const response = await this.makeRequest('GET', `/api/polls/${this.testData.pollId}`, null, headers);
        this.assertTest('Get Poll by ID', response.status === 200, `Status: ${response.status}`);
        console.log(`   ✅ Get Poll by ID: Poll found`);
      } catch (error) {
        this.assertTest('Get Poll by ID', false, error.message);
      }
    }

    // Test update poll
    if (this.testData.pollId) {
      try {
        const updateData = {
          title: 'Updated Poll',
          status: 'inactive'
        };
        
        const response = await this.makeRequest('PUT', `/api/polls/${this.testData.pollId}`, updateData, headers);
        this.assertTest('Update Poll', response.status === 200, `Status: ${response.status}`);
        console.log(`   ✅ Update Poll: Poll updated`);
      } catch (error) {
        this.assertTest('Update Poll', false, error.message);
      }
    }
    
    console.log('');
  }

  async testTrainingCRUD() {
    console.log('🎓 Testing Training CRUD Operations...');
    
    if (!this.authToken) {
      console.log('   ⚠️  Skipping Training CRUD tests - No auth token');
      console.log('');
      return;
    }

    const headers = { 'Authorization': `Bearer ${this.authToken}` };

    // Test get all training sessions
    try {
      const response = await this.makeRequest('GET', '/api/training/sessions', null, headers);
      this.assertTest('Get All Training Sessions', response.status === 200, `Status: ${response.status}`);
      console.log(`   ✅ Get All Training Sessions: ${response.data.sessions ? response.data.sessions.length : 0} sessions`);
    } catch (error) {
      this.assertTest('Get All Training Sessions', false, error.message);
    }

    // Test create training session
    try {
      const sessionData = {
        title: 'Test Training Session',
        description: 'Test session for API testing',
        trainerId: 'trainer_id',
        scheduledAt: '2025-08-01T10:00:00Z',
        duration: 120
      };
      
      const response = await this.makeRequest('POST', '/api/training/sessions', sessionData, headers);
      this.assertTest('Create Training Session', response.status === 201, `Status: ${response.status}`);
      
      if (response.data.session && response.data.session._id) {
        this.testData.sessionId = response.data.session._id;
        console.log(`   ✅ Create Training Session: Session ID ${this.testData.sessionId}`);
      }
    } catch (error) {
      this.assertTest('Create Training Session', false, error.message);
    }

    // Test get all training courses
    try {
      const response = await this.makeRequest('GET', '/api/training/courses', null, headers);
      this.assertTest('Get All Training Courses', response.status === 200, `Status: ${response.status}`);
      console.log(`   ✅ Get All Training Courses: ${response.data.courses ? response.data.courses.length : 0} courses`);
    } catch (error) {
      this.assertTest('Get All Training Courses', false, error.message);
    }

    // Test create training course
    try {
      const courseData = {
        title: 'Test Training Course',
        description: 'Test course for API testing',
        instructorId: 'instructor_id',
        duration: 480,
        modules: []
      };
      
      const response = await this.makeRequest('POST', '/api/training/courses', courseData, headers);
      this.assertTest('Create Training Course', response.status === 201, `Status: ${response.status}`);
      
      if (response.data.course && response.data.course._id) {
        this.testData.courseId = response.data.course._id;
        console.log(`   ✅ Create Training Course: Course ID ${this.testData.courseId}`);
      }
    } catch (error) {
      this.assertTest('Create Training Course', false, error.message);
    }

    // Test get all training modules
    try {
      const response = await this.makeRequest('GET', '/api/training/modules', null, headers);
      this.assertTest('Get All Training Modules', response.status === 200, `Status: ${response.status}`);
      console.log(`   ✅ Get All Training Modules: ${response.data.modules ? response.data.modules.length : 0} modules`);
    } catch (error) {
      this.assertTest('Get All Training Modules', false, error.message);
    }

    // Test create training module
    try {
      const moduleData = {
        title: 'Test Training Module',
        description: 'Test module for API testing',
        content: 'Module content for testing',
        duration: 60
      };
      
      const response = await this.makeRequest('POST', '/api/training/modules', moduleData, headers);
      this.assertTest('Create Training Module', response.status === 201, `Status: ${response.status}`);
      
      if (response.data.module && response.data.module._id) {
        this.testData.moduleId = response.data.module._id;
        console.log(`   ✅ Create Training Module: Module ID ${this.testData.moduleId}`);
      }
    } catch (error) {
      this.assertTest('Create Training Module', false, error.message);
    }

    // Test get all training assessments
    try {
      const response = await this.makeRequest('GET', '/api/training/assessments', null, headers);
      this.assertTest('Get All Training Assessments', response.status === 200, `Status: ${response.status}`);
      console.log(`   ✅ Get All Training Assessments: ${response.data.assessments ? response.data.assessments.length : 0} assessments`);
    } catch (error) {
      this.assertTest('Get All Training Assessments', false, error.message);
    }

    // Test create training assessment
    try {
      const assessmentData = {
        title: 'Test Assessment',
        description: 'Test assessment for API testing',
        questions: [],
        timeLimit: 30
      };
      
      const response = await this.makeRequest('POST', '/api/training/assessments', assessmentData, headers);
      this.assertTest('Create Training Assessment', response.status === 201, `Status: ${response.status}`);
      
      if (response.data.assessment && response.data.assessment._id) {
        this.testData.assessmentId = response.data.assessment._id;
        console.log(`   ✅ Create Training Assessment: Assessment ID ${this.testData.assessmentId}`);
      }
    } catch (error) {
      this.assertTest('Create Training Assessment', false, error.message);
    }
    
    console.log('');
  }

  async testPresentationCRUD() {
    console.log('📽️ Testing Presentation CRUD Operations...');
    
    if (!this.authToken) {
      console.log('   ⚠️  Skipping Presentation CRUD tests - No auth token');
      console.log('');
      return;
    }

    const headers = { 'Authorization': `Bearer ${this.authToken}` };

    // Test get all presentations
    try {
      const response = await this.makeRequest('GET', '/api/presentations', null, headers);
      this.assertTest('Get All Presentations', response.status === 200, `Status: ${response.status}`);
      console.log(`   ✅ Get All Presentations: ${response.data.presentations ? response.data.presentations.length : 0} presentations`);
    } catch (error) {
      this.assertTest('Get All Presentations', false, error.message);
    }

    // Test create presentation
    try {
      const presentationData = {
        title: 'Test Presentation',
        description: 'Test presentation for API testing',
        slides: [],
        presenterId: 'presenter_id'
      };
      
      const response = await this.makeRequest('POST', '/api/presentations', presentationData, headers);
      this.assertTest('Create Presentation', response.status === 201, `Status: ${response.status}`);
      
      if (response.data.presentation && response.data.presentation._id) {
        this.testData.presentationId = response.data.presentation._id;
        console.log(`   ✅ Create Presentation: Presentation ID ${this.testData.presentationId}`);
      }
    } catch (error) {
      this.assertTest('Create Presentation', false, error.message);
    }
    
    console.log('');
  }

  async testSchemaCRUD() {
    console.log('📋 Testing Schema CRUD Operations...');
    
    if (!this.authToken) {
      console.log('   ⚠️  Skipping Schema CRUD tests - No auth token');
      console.log('');
      return;
    }

    const headers = { 'Authorization': `Bearer ${this.authToken}` };

    // Test get all schemas
    try {
      const response = await this.makeRequest('GET', '/api/schemas', null, headers);
      this.assertTest('Get All Schemas', response.status === 200, `Status: ${response.status}`);
      console.log(`   ✅ Get All Schemas: ${response.data.schemas ? response.data.schemas.length : 0} schemas`);
    } catch (error) {
      this.assertTest('Get All Schemas', false, error.message);
    }

    // Test create schema
    try {
      const schemaData = {
        name: 'Test Custom Form',
        fields: [],
        tenantId: 'tenant_id'
      };
      
      const response = await this.makeRequest('POST', '/api/schemas', schemaData, headers);
      this.assertTest('Create Schema', response.status === 201, `Status: ${response.status}`);
      
      if (response.data.schema && response.data.schema._id) {
        this.testData.schemaId = response.data.schema._id;
        console.log(`   ✅ Create Schema: Schema ID ${this.testData.schemaId}`);
      }
    } catch (error) {
      this.assertTest('Create Schema', false, error.message);
    }
    
    console.log('');
  }

  async testAIServices() {
    console.log('🤖 Testing AI Services...');
    
    // Test AI health check
    try {
      const response = await this.makeRequest('GET', '/api/ai/health');
      this.assertTest('AI Health Check', response.status === 200, `Status: ${response.status}`);
      console.log(`   ✅ AI Health Check: ${response.data.initialized ? 'Initialized' : 'Not initialized'}`);
    } catch (error) {
      this.assertTest('AI Health Check', false, error.message);
    }

    // Test get AI models
    try {
      const response = await this.makeRequest('GET', '/api/ai/models');
      this.assertTest('Get AI Models', response.status === 200, `Status: ${response.status}`);
      console.log(`   ✅ Get AI Models: ${response.data.models ? response.data.models.length : 0} models`);
    } catch (error) {
      this.assertTest('Get AI Models', false, error.message);
    }

    if (this.authToken) {
      const headers = { 'Authorization': `Bearer ${this.authToken}` };

      // Test get knowledge base stats
      try {
        const response = await this.makeRequest('GET', '/api/ai/knowledge-base/stats', null, headers);
        this.assertTest('Get Knowledge Base Stats', response.status === 200, `Status: ${response.status}`);
        console.log(`   ✅ Get Knowledge Base Stats: Statistics retrieved`);
      } catch (error) {
        this.assertTest('Get Knowledge Base Stats', false, error.message);
      }
    }
    
    console.log('');
  }

  async testErrorHandling() {
    console.log('🚨 Testing Error Handling...');
    
    // Test 404 error
    try {
      const response = await this.makeRequest('GET', '/api/non-existent');
      this.assertTest('404 Error Handling', response.status === 404, `Status: ${response.status}`);
      console.log(`   ✅ 404 Error Handling: Correctly handled`);
    } catch (error) {
      this.assertTest('404 Error Handling', false, error.message);
    }

    // Test invalid authentication
    try {
      const response = await this.makeRequest('GET', '/api/users', null, {
        'Authorization': 'Bearer invalid_token'
      });
      this.assertTest('Invalid Authentication', response.status === 401, `Status: ${response.status}`);
      console.log(`   ✅ Invalid Authentication: Correctly handled`);
    } catch (error) {
      this.assertTest('Invalid Authentication', false, error.message);
    }

    // Test missing required fields
    try {
      const response = await this.makeRequest('POST', '/api/auth/register', {
        firstName: 'John'
      });
      this.assertTest('Missing Required Fields', response.status === 400, `Status: ${response.status}`);
      console.log(`   ✅ Missing Required Fields: Correctly handled`);
    } catch (error) {
      this.assertTest('Missing Required Fields', false, error.message);
    }
    
    console.log('');
  }

  assertTest(testName, condition, message) {
    this.results.total++;
    
    if (condition) {
      this.results.passed++;
    } else {
      this.results.failed++;
      this.results.errors.push({
        test: testName,
        message: message
      });
    }
  }

  generateReport() {
    const endTime = new Date();
    const duration = endTime - this.results.startTime;
    
    console.log('📊 Test Results Summary');
    console.log('======================');
    console.log(`Total Tests: ${this.results.total}`);
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`📈 Success Rate: ${this.results.total > 0 ? (this.results.passed / this.results.total * 100).toFixed(2) : 0}%`);
    console.log('');

    if (this.results.errors.length > 0) {
      console.log('🚨 Errors Encountered:');
      this.results.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error.test}: ${error.message}`);
      });
      console.log('');
    }

    // Generate JSON report
    const report = {
      summary: {
        total: this.results.total,
        passed: this.results.passed,
        failed: this.results.failed,
        duration: duration,
        successRate: this.results.total > 0 ? (this.results.passed / this.results.total * 100).toFixed(2) : 0
      },
      timestamp: {
        start: this.results.startTime.toISOString(),
        end: endTime.toISOString()
      },
      errors: this.results.errors,
      testData: this.testData
    };

    const fs = require('fs');
    const path = require('path');
    const reportPath = path.join(__dirname, 'api-crud-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Detailed report saved to: ${reportPath}`);

    // Final status
    if (this.results.failed === 0) {
      console.log('🎉 All tests passed! API CRUD operations are working correctly.');
      process.exit(0);
    } else {
      console.log('⚠️  Some tests failed. Please check the errors above.');
      process.exit(1);
    }
  }
}

// Run the test suite
const tester = new APICRUDTester();
tester.runAllTests().catch(console.error);
