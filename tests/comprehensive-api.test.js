/**
 * @fileoverview Comprehensive API Test Suite
 * Tests all CRUD operations for all API endpoints
 * 
 * @module
 */

const request = require('supertest');
const { expect } = require('chai');
const app = require('../src/index');

describe('Comprehensive API Test Suite', () => {
  let authToken;
  let testUserId;
  let testTenantId;
  let testPollId;
  let testGroupId;
  let testSessionId;
  let testCourseId;
  let testModuleId;
  let testAssessmentId;
  let testPresentationId;
  let testSchemaId;

  // Test data
  const testUser = {
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    password: 'TestPass123!',
    role: 'user'
  };

  const testTenant = {
    name: 'Test Corporation',
    contactEmail: 'admin@testcorp.com',
    description: 'Test company for API testing',
    industry: 'Technology'
  };

  const testPoll = {
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

  const testGroup = {
    name: 'Test Training Group',
    description: 'Group for testing API functionality',
    trainerId: 'trainer_id',
    maxSize: 20
  };

  const testSession = {
    title: 'Test Training Session',
    description: 'Test session for API testing',
    trainerId: 'trainer_id',
    scheduledAt: '2025-08-01T10:00:00Z',
    duration: 120
  };

  const testCourse = {
    title: 'Test Training Course',
    description: 'Test course for API testing',
    instructorId: 'instructor_id',
    duration: 480,
    modules: []
  };

  const testModule = {
    title: 'Test Training Module',
    description: 'Test module for API testing',
    content: 'Module content for testing',
    duration: 60
  };

  const testAssessment = {
    title: 'Test Assessment',
    description: 'Test assessment for API testing',
    questions: [],
    timeLimit: 30
  };

  const testPresentation = {
    title: 'Test Presentation',
    description: 'Test presentation for API testing',
    slides: [],
    presenterId: 'presenter_id'
  };

  const testSchema = {
    name: 'Test Custom Form',
    fields: [],
    tenantId: 'tenant_id'
  };

  describe('Health and System Endpoints', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.body.status).to.equal('healthy');
    });

    it('should return API documentation', async () => {
      const response = await request(app)
        .get('/docs')
        .expect(200);
      
      expect(response.body.message).to.include('LuxGen Trainer Platform API');
    });

    it('should handle 404 for non-existent endpoints', async () => {
      await request(app)
        .get('/non-existent')
        .expect(404);
    });
  });

  describe('Authentication CRUD Operations', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);
      
      expect(response.body.success).to.be.true;
      expect(response.body.message).to.include('registered successfully');
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);
      
      expect(response.body.success).to.be.true;
      expect(response.body.token).to.exist;
      authToken = response.body.token;
    });

    it('should get user profile', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.success).to.be.true;
      expect(response.body.data.user).to.exist;
      testUserId = response.body.data.user._id;
    });

    it('should update user profile', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'Updated',
          lastName: 'User'
        })
        .expect(200);
      
      expect(response.body.success).to.be.true;
      expect(response.body.message).to.include('updated successfully');
    });

    it('should change password', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: testUser.password,
          newPassword: 'NewPass123!'
        })
        .expect(200);
      
      expect(response.body.success).to.be.true;
      expect(response.body.message).to.include('changed successfully');
    });

    it('should logout user', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.success).to.be.true;
      expect(response.body.message).to.include('logged out');
    });
  });

  describe('User Management CRUD Operations', () => {
    it('should get all users', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.success).to.be.true;
      expect(response.body.data.users).to.be.an('array');
    });

    it('should get user by ID', async () => {
      const response = await request(app)
        .get(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.success).to.be.true;
      expect(response.body.data.user).to.exist;
    });

    it('should create a new user', async () => {
      const newUser = {
        firstName: 'New',
        lastName: 'User',
        email: 'newuser@example.com',
        password: 'NewPass123!',
        role: 'user'
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newUser)
        .expect(201);
      
      expect(response.body.success).to.be.true;
      expect(response.body.message).to.include('created successfully');
    });

    it('should update user', async () => {
      const response = await request(app)
        .put(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'Updated',
          lastName: 'User'
        })
        .expect(200);
      
      expect(response.body.success).to.be.true;
      expect(response.body.message).to.include('updated successfully');
    });

    it('should delete user', async () => {
      const response = await request(app)
        .delete(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.success).to.be.true;
      expect(response.body.message).to.include('deleted successfully');
    });
  });

  describe('Tenant Management CRUD Operations', () => {
    it('should create a new tenant', async () => {
      const response = await request(app)
        .post('/api/tenants/create')
        .send(testTenant)
        .expect(201);
      
      expect(response.body.success).to.be.true;
      expect(response.body.message).to.include('created successfully');
      testTenantId = response.body.data.tenant._id;
    });

    it('should get all tenants', async () => {
      const response = await request(app)
        .get('/api/tenants')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.success).to.be.true;
      expect(response.body.data.tenants).to.be.an('array');
    });

    it('should get tenant by ID', async () => {
      const response = await request(app)
        .get(`/api/tenants/${testTenantId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.success).to.be.true;
      expect(response.body.data.tenant).to.exist;
    });

    it('should update tenant', async () => {
      const response = await request(app)
        .put(`/api/tenants/${testTenantId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Corporation',
          description: 'Updated description'
        })
        .expect(200);
      
      expect(response.body.success).to.be.true;
      expect(response.body.message).to.include('updated successfully');
    });

    it('should get tenant statistics', async () => {
      const response = await request(app)
        .get('/api/tenants/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.success).to.be.true;
      expect(response.body.data.stats).to.exist;
    });

    it('should delete tenant', async () => {
      const response = await request(app)
        .delete(`/api/tenants/${testTenantId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.success).to.be.true;
      expect(response.body.message).to.include('deleted successfully');
    });
  });

  describe('Group Management CRUD Operations', () => {
    it('should get all groups', async () => {
      const response = await request(app)
        .get('/api/groups')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.success).to.be.true;
      expect(response.body.data.groups).to.be.an('array');
    });

    it('should create a new group', async () => {
      const response = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testGroup)
        .expect(201);
      
      expect(response.body.success).to.be.true;
      expect(response.body.message).to.include('created successfully');
      testGroupId = response.body.data.group._id;
    });

    it('should get group by ID', async () => {
      const response = await request(app)
        .get(`/api/groups/${testGroupId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.success).to.be.true;
      expect(response.body.data.group).to.exist;
    });

    it('should update group', async () => {
      const response = await request(app)
        .put(`/api/groups/${testGroupId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Group',
          description: 'Updated description'
        })
        .expect(200);
      
      expect(response.body.success).to.be.true;
      expect(response.body.message).to.include('updated successfully');
    });

    it('should get group members', async () => {
      const response = await request(app)
        .get(`/api/groups/${testGroupId}/members`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.success).to.be.true;
      expect(response.body.data.members).to.be.an('array');
    });

    it('should delete group', async () => {
      const response = await request(app)
        .delete(`/api/groups/${testGroupId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.success).to.be.true;
      expect(response.body.message).to.include('deleted successfully');
    });
  });

  describe('Poll Management CRUD Operations', () => {
    it('should get all polls', async () => {
      const response = await request(app)
        .get('/api/polls')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.success).to.be.true;
      expect(response.body.data.polls).to.be.an('array');
    });

    it('should create a new poll', async () => {
      const response = await request(app)
        .post('/api/polls')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testPoll)
        .expect(201);
      
      expect(response.body.success).to.be.true;
      expect(response.body.message).to.include('created successfully');
      testPollId = response.body.data.poll._id;
    });

    it('should get poll by ID', async () => {
      const response = await request(app)
        .get(`/api/polls/${testPollId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.success).to.be.true;
      expect(response.body.data.poll).to.exist;
    });

    it('should update poll', async () => {
      const response = await request(app)
        .put(`/api/polls/${testPollId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Poll',
          status: 'inactive'
        })
        .expect(200);
      
      expect(response.body.success).to.be.true;
      expect(response.body.message).to.include('updated successfully');
    });

    it('should submit poll response', async () => {
      const response = await request(app)
        .post(`/api/polls/${testPollId}/responses`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          responses: [
            {
              questionId: 'q1',
              answer: '5'
            }
          ]
        })
        .expect(200);
      
      expect(response.body.success).to.be.true;
      expect(response.body.message).to.include('submitted successfully');
    });

    it('should get poll results', async () => {
      const response = await request(app)
        .get(`/api/polls/${testPollId}/results`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.success).to.be.true;
      expect(response.body.data.results).to.exist;
    });

    it('should delete poll', async () => {
      const response = await request(app)
        .delete(`/api/polls/${testPollId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.success).to.be.true;
      expect(response.body.message).to.include('deleted successfully');
    });
  });

  describe('Training Session CRUD Operations', () => {
    it('should get all training sessions', async () => {
      const response = await request(app)
        .get('/api/training/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.success).to.be.true;
      expect(response.body.data.sessions).to.be.an('array');
    });

    it('should create a new training session', async () => {
      const response = await request(app)
        .post('/api/training/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testSession)
        .expect(201);
      
      expect(response.body.success).to.be.true;
      expect(response.body.message).to.include('created successfully');
      testSessionId = response.body.data.session._id;
    });

    it('should get training session by ID', async () => {
      const response = await request(app)
        .get(`/api/training/sessions/${testSessionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.success).to.be.true;
      expect(response.body.data.session).to.exist;
    });

    it('should update training session', async () => {
      const response = await request(app)
        .put(`/api/training/sessions/${testSessionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Session',
          duration: 90
        })
        .expect(200);
      
      expect(response.body.success).to.be.true;
      expect(response.body.message).to.include('updated successfully');
    });

    it('should add participant to session', async () => {
      const response = await request(app)
        .post(`/api/training/sessions/${testSessionId}/participants`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userId: testUserId
        })
        .expect(200);
      
      expect(response.body.success).to.be.true;
      expect(response.body.message).to.include('added successfully');
    });

    it('should complete training session', async () => {
      const response = await request(app)
        .post(`/api/training/sessions/${testSessionId}/complete`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.success).to.be.true;
      expect(response.body.message).to.include('completed successfully');
    });

    it('should delete training session', async () => {
      const response = await request(app)
        .delete(`/api/training/sessions/${testSessionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.success).to.be.true;
      expect(response.body.message).to.include('deleted successfully');
    });
  });

  describe('Training Course CRUD Operations', () => {
    it('should get all training courses', async () => {
      const response = await request(app)
        .get('/api/training/courses')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.success).to.be.true;
      expect(response.body.data.courses).to.be.an('array');
    });

    it('should create a new training course', async () => {
      const response = await request(app)
        .post('/api/training/courses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testCourse)
        .expect(201);
      
      expect(response.body.success).to.be.true;
      expect(response.body.message).to.include('created successfully');
      testCourseId = response.body.data.course._id;
    });

    it('should get training course by ID', async () => {
      const response = await request(app)
        .get(`/api/training/courses/${testCourseId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.success).to.be.true;
      expect(response.body.data.course).to.exist;
    });

    it('should update training course', async () => {
      const response = await request(app)
        .put(`/api/training/courses/${testCourseId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Course',
          duration: 600
        })
        .expect(200);
      
      expect(response.body.success).to.be.true;
      expect(response.body.message).to.include('updated successfully');
    });

    it('should enroll in course', async () => {
      const response = await request(app)
        .post(`/api/training/courses/${testCourseId}/enroll`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          participantId: testUserId
        })
        .expect(200);
      
      expect(response.body.success).to.be.true;
      expect(response.body.message).to.include('enrolled successfully');
    });

    it('should delete training course', async () => {
      const response = await request(app)
        .delete(`/api/training/courses/${testCourseId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.success).to.be.true;
      expect(response.body.message).to.include('deleted successfully');
    });
  });

  describe('Training Module CRUD Operations', () => {
    it('should get all training modules', async () => {
      const response = await request(app)
        .get('/api/training/modules')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.success).to.be.true;
      expect(response.body.data.modules).to.be.an('array');
    });

    it('should create a new training module', async () => {
      const response = await request(app)
        .post('/api/training/modules')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testModule)
        .expect(201);
      
      expect(response.body.success).to.be.true;
      expect(response.body.message).to.include('created successfully');
      testModuleId = response.body.data.module._id;
    });

    it('should get training module by ID', async () => {
      const response = await request(app)
        .get(`/api/training/modules/${testModuleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.success).to.be.true;
      expect(response.body.data.module).to.exist;
    });

    it('should update training module', async () => {
      const response = await request(app)
        .put(`/api/training/modules/${testModuleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Module',
          duration: 90
        })
        .expect(200);
      
      expect(response.body.success).to.be.true;
      expect(response.body.message).to.include('updated successfully');
    });

    it('should delete training module', async () => {
      const response = await request(app)
        .delete(`/api/training/modules/${testModuleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.success).to.be.true;
      expect(response.body.message).to.include('deleted successfully');
    });
  });

  describe('Training Assessment CRUD Operations', () => {
    it('should get all training assessments', async () => {
      const response = await request(app)
        .get('/api/training/assessments')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.success).to.be.true;
      expect(response.body.data.assessments).to.be.an('array');
    });

    it('should create a new training assessment', async () => {
      const response = await request(app)
        .post('/api/training/assessments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testAssessment)
        .expect(201);
      
      expect(response.body.success).to.be.true;
      expect(response.body.message).to.include('created successfully');
      testAssessmentId = response.body.data.assessment._id;
    });

    it('should get training assessment by ID', async () => {
      const response = await request(app)
        .get(`/api/training/assessments/${testAssessmentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.success).to.be.true;
      expect(response.body.data.assessment).to.exist;
    });

    it('should update training assessment', async () => {
      const response = await request(app)
        .put(`/api/training/assessments/${testAssessmentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Assessment',
          timeLimit: 45
        })
        .expect(200);
      
      expect(response.body.success).to.be.true;
      expect(response.body.message).to.include('updated successfully');
    });

    it('should submit assessment', async () => {
      const response = await request(app)
        .post(`/api/training/assessments/${testAssessmentId}/submit`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          answers: [
            {
              questionId: 'q1',
              answer: 'A'
            }
          ],
          timeSpent: 25
        })
        .expect(200);
      
      expect(response.body.success).to.be.true;
      expect(response.body.data.score).to.exist;
    });

    it('should delete training assessment', async () => {
      const response = await request(app)
        .delete(`/api/training/assessments/${testAssessmentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.success).to.be.true;
      expect(response.body.message).to.include('deleted successfully');
    });
  });

  describe('Presentation CRUD Operations', () => {
    it('should get all presentations', async () => {
      const response = await request(app)
        .get('/api/presentations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.success).to.be.true;
      expect(response.body.data.presentations).to.be.an('array');
    });

    it('should create a new presentation', async () => {
      const response = await request(app)
        .post('/api/presentations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testPresentation)
        .expect(201);
      
      expect(response.body.success).to.be.true;
      expect(response.body.message).to.include('created successfully');
      testPresentationId = response.body.data.presentation._id;
    });

    it('should get presentation by ID', async () => {
      const response = await request(app)
        .get(`/api/presentations/${testPresentationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.success).to.be.true;
      expect(response.body.data.presentation).to.exist;
    });

    it('should update presentation', async () => {
      const response = await request(app)
        .put(`/api/presentations/${testPresentationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Presentation',
          description: 'Updated description'
        })
        .expect(200);
      
      expect(response.body.success).to.be.true;
      expect(response.body.message).to.include('updated successfully');
    });

    it('should start presentation session', async () => {
      const response = await request(app)
        .post(`/api/presentations/${testPresentationId}/start`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sessionName: 'Test Session'
        })
        .expect(200);
      
      expect(response.body.success).to.be.true;
      expect(response.body.data.sessionId).to.exist;
    });

    it('should delete presentation', async () => {
      const response = await request(app)
        .delete(`/api/presentations/${testPresentationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.success).to.be.true;
      expect(response.body.message).to.include('deleted successfully');
    });
  });

  describe('Schema CRUD Operations', () => {
    it('should get all schemas', async () => {
      const response = await request(app)
        .get('/api/schemas')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.success).to.be.true;
      expect(response.body.data.schemas).to.be.an('array');
    });

    it('should create a new schema', async () => {
      const response = await request(app)
        .post('/api/schemas')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testSchema)
        .expect(201);
      
      expect(response.body.success).to.be.true;
      expect(response.body.message).to.include('created successfully');
      testSchemaId = response.body.data.schema._id;
    });

    it('should get schema by ID', async () => {
      const response = await request(app)
        .get(`/api/schemas/${testSchemaId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.success).to.be.true;
      expect(response.body.data.schema).to.exist;
    });

    it('should update schema', async () => {
      const response = await request(app)
        .put(`/api/schemas/${testSchemaId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Schema',
          fields: []
        })
        .expect(200);
      
      expect(response.body.success).to.be.true;
      expect(response.body.message).to.include('updated successfully');
    });

    it('should delete schema', async () => {
      const response = await request(app)
        .delete(`/api/schemas/${testSchemaId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.success).to.be.true;
      expect(response.body.message).to.include('deleted successfully');
    });
  });

  describe('AI Services CRUD Operations', () => {
    it('should get AI health status', async () => {
      const response = await request(app)
        .get('/api/ai/health')
        .expect(200);
      
      expect(response.body.success).to.be.true;
      expect(response.body.data.initialized).to.exist;
    });

    it('should get AI models', async () => {
      const response = await request(app)
        .get('/api/ai/models')
        .expect(200);
      
      expect(response.body.success).to.be.true;
      expect(response.body.data.models).to.be.an('array');
    });

    it('should generate AI content', async () => {
      const response = await request(app)
        .post('/api/ai/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          prompt: 'Create a training module about leadership',
          model: 'llama-3.3-70b-versatile',
          maxTokens: 2048
        })
        .expect(200);
      
      expect(response.body.success).to.be.true;
      expect(response.body.data.content).to.exist;
    });

    it('should get knowledge base stats', async () => {
      const response = await request(app)
        .get('/api/ai/knowledge-base/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.success).to.be.true;
      expect(response.body.data.stats).to.exist;
    });

    it('should search knowledge base', async () => {
      const response = await request(app)
        .post('/api/ai/knowledge-base/search')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: 'leadership training',
          maxResults: 5
        })
        .expect(200);
      
      expect(response.body.success).to.be.true;
      expect(response.body.data.results).to.be.an('array');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid authentication', async () => {
      await request(app)
        .get('/api/users')
        .set('Authorization', 'Bearer invalid_token')
        .expect(401);
    });

    it('should handle missing required fields', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'John'
        })
        .expect(400);
    });

    it('should handle invalid JSON', async () => {
      await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);
    });

    it('should handle rate limiting', async () => {
      // Make multiple requests quickly to test rate limiting
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          request(app)
            .get('/health')
            .expect(200)
        );
      }
      
      const responses = await Promise.all(promises);
      expect(responses.length).to.equal(10);
    });
  });

  describe('Performance Tests', () => {
    it('should respond to health check within acceptable time', async () => {
      const start = Date.now();
      await request(app)
        .get('/health')
        .expect(200);
      const duration = Date.now() - start;
      
      expect(duration).to.be.lessThan(1000); // Should respond within 1 second
    });

    it('should handle concurrent requests', async () => {
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          request(app)
            .get('/health')
            .expect(200)
        );
      }
      
      const responses = await Promise.all(promises);
      expect(responses.length).to.equal(5);
    });
  });
});
