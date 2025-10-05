/**
 * @fileoverview Tenant API Validation Tests
 * Comprehensive validation tests for tenant API endpoints
 * 
 * @module
 */

const request = require('supertest');
const { expect } = require('chai');
const { createServer } = require('../../src/hapi/index');

describe('Tenant API Validation Tests', () => {
  let server;
  const tenantSlug = 'luxgen';
  const baseUrl = `/${tenantSlug}`;

  before(async () => {
    server = await createServer();
  });

  after(async () => {
    if (server) {
      await server.stop();
    }
  });

  describe('Health & Monitoring Endpoints', () => {
    it('should get health status of all tenant databases', async () => {
      const response = await request(server.listener)
        .get(`${baseUrl}/health`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.have.property('healthChecks');
      expect(response.body.data).to.have.property('totalConnections');
      expect(response.body).to.have.property('timestamp');
    });

    it('should get health status of specific tenant database', async () => {
      const response = await request(server.listener)
        .get(`${baseUrl}/health/${tenantSlug}`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.have.property('health');
      expect(response.body).to.have.property('timestamp');
    });
  });

  describe('Statistics Endpoints', () => {
    it('should get statistics for all tenants', async () => {
      const response = await request(server.listener)
        .get(`${baseUrl}/stats`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.have.property('statistics');
      expect(response.body).to.have.property('timestamp');
    });

    it('should get statistics for specific tenant', async () => {
      const response = await request(server.listener)
        .get(`${baseUrl}/stats/${tenantSlug}`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.have.property('stats');
      expect(response.body).to.have.property('timestamp');
    });
  });

  describe('Database Management Endpoints', () => {
    it('should initialize tenant database', async () => {
      const response = await request(server.listener)
        .post(`${baseUrl}/initialize/${tenantSlug}`)
        .expect(201);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.have.property('message');
      expect(response.body.data).to.have.property('databaseName');
      expect(response.body).to.have.property('timestamp');
    });

    it('should close tenant database connection', async () => {
      const response = await request(server.listener)
        .delete(`${baseUrl}/close/${tenantSlug}`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.have.property('message');
      expect(response.body).to.have.property('timestamp');
    });
  });

  describe('Configuration Endpoints', () => {
    it('should get tenant configuration', async () => {
      const response = await request(server.listener)
        .get(`${baseUrl}/config/${tenantSlug}`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.have.property('config');
      expect(response.body).to.have.property('timestamp');
    });

    it('should get tenant limits', async () => {
      const response = await request(server.listener)
        .get(`${baseUrl}/limits/${tenantSlug}`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.have.property('limits');
      expect(response.body).to.have.property('timestamp');
    });

    it('should get all tenants', async () => {
      const response = await request(server.listener)
        .get(`${baseUrl}/tenants`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.have.property('tenants');
      expect(Array.isArray(response.body.data.tenants)).to.be.true;
      expect(response.body).to.have.property('timestamp');
    });
  });

  describe('Cleanup Endpoints', () => {
    it('should cleanup tenant resources', async () => {
      const response = await request(server.listener)
        .delete(`${baseUrl}/cleanup/${tenantSlug}`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.have.property('message');
      expect(response.body).to.have.property('timestamp');
    });

    it('should cleanup all tenant resources', async () => {
      const response = await request(server.listener)
        .delete(`${baseUrl}/cleanup`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.have.property('message');
      expect(response.body).to.have.property('timestamp');
    });
  });

  describe('User Management Endpoints', () => {
    let userId;

    it('should create a new user', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'securepassword'
      };

      const response = await request(server.listener)
        .post(`${baseUrl}/users`)
        .send(userData)
        .expect(201);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.have.property('user');
      expect(response.body.data.user).to.have.property('_id');
      expect(response.body.data.user).to.have.property('firstName', 'John');
      expect(response.body.data.user).to.have.property('lastName', 'Doe');
      expect(response.body.data.user).to.have.property('email', 'john@example.com');
      expect(response.body.data.user).to.have.property('tenantId', tenantSlug);
      expect(response.body).to.have.property('timestamp');

      userId = response.body.data.user._id;
    });

    it('should get list of users', async () => {
      const response = await request(server.listener)
        .get(`${baseUrl}/users`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.have.property('users');
      expect(Array.isArray(response.body.data.users)).to.be.true;
      expect(response.body.data).to.have.property('pagination');
      expect(response.body.data.pagination).to.have.property('page');
      expect(response.body.data.pagination).to.have.property('limit');
      expect(response.body.data.pagination).to.have.property('total');
      expect(response.body.data.pagination).to.have.property('pages');
      expect(response.body).to.have.property('timestamp');
    });

    it('should get specific user', async () => {
      const response = await request(server.listener)
        .get(`${baseUrl}/users/${userId}`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.have.property('user');
      expect(response.body.data.user).to.have.property('_id', userId);
      expect(response.body).to.have.property('timestamp');
    });

    it('should update user', async () => {
      const updateData = {
        firstName: 'Jane',
        lastName: 'Smith'
      };

      const response = await request(server.listener)
        .put(`${baseUrl}/users/${userId}`)
        .send(updateData)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.have.property('user');
      expect(response.body.data.user).to.have.property('firstName', 'Jane');
      expect(response.body.data.user).to.have.property('lastName', 'Smith');
      expect(response.body).to.have.property('timestamp');
    });

    it('should delete user', async () => {
      const response = await request(server.listener)
        .delete(`${baseUrl}/users/${userId}`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.have.property('message', 'User deleted successfully');
      expect(response.body).to.have.property('timestamp');
    });
  });

  describe('Poll Management Endpoints', () => {
    let pollId;

    it('should create a new poll', async () => {
      const pollData = {
        title: 'Sample Poll',
        description: 'This is a sample poll',
        options: ['Option 1', 'Option 2'],
        createdBy: 'user_id_1'
      };

      const response = await request(server.listener)
        .post(`${baseUrl}/polls`)
        .send(pollData)
        .expect(201);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.have.property('poll');
      expect(response.body.data.poll).to.have.property('_id');
      expect(response.body.data.poll).to.have.property('title', 'Sample Poll');
      expect(response.body.data.poll).to.have.property('description', 'This is a sample poll');
      expect(response.body.data.poll).to.have.property('options');
      expect(Array.isArray(response.body.data.poll.options)).to.be.true;
      expect(response.body.data.poll).to.have.property('tenantId', tenantSlug);
      expect(response.body).to.have.property('timestamp');

      pollId = response.body.data.poll._id;
    });

    it('should get list of polls', async () => {
      const response = await request(server.listener)
        .get(`${baseUrl}/polls`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.have.property('polls');
      expect(Array.isArray(response.body.data.polls)).to.be.true;
      expect(response.body.data).to.have.property('pagination');
      expect(response.body).to.have.property('timestamp');
    });

    it('should get specific poll', async () => {
      const response = await request(server.listener)
        .get(`${baseUrl}/polls/${pollId}`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.have.property('poll');
      expect(response.body.data.poll).to.have.property('_id', pollId);
      expect(response.body).to.have.property('timestamp');
    });

    it('should update poll', async () => {
      const updateData = {
        title: 'Updated Poll Title',
        description: 'Updated description'
      };

      const response = await request(server.listener)
        .put(`${baseUrl}/polls/${pollId}`)
        .send(updateData)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.have.property('poll');
      expect(response.body.data.poll).to.have.property('title', 'Updated Poll Title');
      expect(response.body.data.poll).to.have.property('description', 'Updated description');
      expect(response.body).to.have.property('timestamp');
    });

    it('should delete poll', async () => {
      const response = await request(server.listener)
        .delete(`${baseUrl}/polls/${pollId}`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.have.property('message', 'Poll deleted successfully');
      expect(response.body).to.have.property('timestamp');
    });
  });

  describe('Activity Management Endpoints', () => {
    let activityId;

    it('should create a new activity', async () => {
      const activityData = {
        type: 'user_login',
        description: 'User logged in',
        userId: 'user_id_1'
      };

      const response = await request(server.listener)
        .post(`${baseUrl}/activities`)
        .send(activityData)
        .expect(201);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.have.property('activity');
      expect(response.body.data.activity).to.have.property('_id');
      expect(response.body.data.activity).to.have.property('type', 'user_login');
      expect(response.body.data.activity).to.have.property('description', 'User logged in');
      expect(response.body.data.activity).to.have.property('tenantId', tenantSlug);
      expect(response.body).to.have.property('timestamp');

      activityId = response.body.data.activity._id;
    });

    it('should get list of activities', async () => {
      const response = await request(server.listener)
        .get(`${baseUrl}/activities`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.have.property('activities');
      expect(Array.isArray(response.body.data.activities)).to.be.true;
      expect(response.body.data).to.have.property('pagination');
      expect(response.body).to.have.property('timestamp');
    });

    it('should get specific activity', async () => {
      const response = await request(server.listener)
        .get(`${baseUrl}/activities/${activityId}`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.have.property('activity');
      expect(response.body.data.activity).to.have.property('_id', activityId);
      expect(response.body).to.have.property('timestamp');
    });
  });

  describe('Job Management Endpoints', () => {
    let jobId;

    it('should create a new job', async () => {
      const jobData = {
        title: 'Software Engineer',
        description: 'Full-stack developer position',
        company: 'Tech Corp',
        location: 'Remote',
        createdBy: 'user_id_1'
      };

      const response = await request(server.listener)
        .post(`${baseUrl}/jobs`)
        .send(jobData)
        .expect(201);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.have.property('job');
      expect(response.body.data.job).to.have.property('_id');
      expect(response.body.data.job).to.have.property('title', 'Software Engineer');
      expect(response.body.data.job).to.have.property('description', 'Full-stack developer position');
      expect(response.body.data.job).to.have.property('company', 'Tech Corp');
      expect(response.body.data.job).to.have.property('location', 'Remote');
      expect(response.body.data.job).to.have.property('tenantId', tenantSlug);
      expect(response.body).to.have.property('timestamp');

      jobId = response.body.data.job._id;
    });

    it('should get list of jobs', async () => {
      const response = await request(server.listener)
        .get(`${baseUrl}/jobs`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.have.property('jobs');
      expect(Array.isArray(response.body.data.jobs)).to.be.true;
      expect(response.body.data).to.have.property('pagination');
      expect(response.body).to.have.property('timestamp');
    });

    it('should get specific job', async () => {
      const response = await request(server.listener)
        .get(`${baseUrl}/jobs/${jobId}`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.have.property('job');
      expect(response.body.data.job).to.have.property('_id', jobId);
      expect(response.body).to.have.property('timestamp');
    });

    it('should update job', async () => {
      const updateData = {
        title: 'Senior Software Engineer',
        description: 'Senior full-stack developer position'
      };

      const response = await request(server.listener)
        .put(`${baseUrl}/jobs/${jobId}`)
        .send(updateData)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.have.property('job');
      expect(response.body.data.job).to.have.property('title', 'Senior Software Engineer');
      expect(response.body.data.job).to.have.property('description', 'Senior full-stack developer position');
      expect(response.body).to.have.property('timestamp');
    });

    it('should delete job', async () => {
      const response = await request(server.listener)
        .delete(`${baseUrl}/jobs/${jobId}`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.have.property('message', 'Job deleted successfully');
      expect(response.body).to.have.property('timestamp');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent user', async () => {
      const response = await request(server.listener)
        .get(`${baseUrl}/users/non-existent-id`)
        .expect(404);

      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('error', 'User not found');
      expect(response.body).to.have.property('timestamp');
    });

    it('should return 404 for non-existent poll', async () => {
      const response = await request(server.listener)
        .get(`${baseUrl}/polls/non-existent-id`)
        .expect(404);

      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('error', 'Poll not found');
      expect(response.body).to.have.property('timestamp');
    });

    it('should return 404 for non-existent activity', async () => {
      const response = await request(server.listener)
        .get(`${baseUrl}/activities/non-existent-id`)
        .expect(404);

      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('error', 'Activity not found');
      expect(response.body).to.have.property('timestamp');
    });

    it('should return 404 for non-existent job', async () => {
      const response = await request(server.listener)
        .get(`${baseUrl}/jobs/non-existent-id`)
        .expect(404);

      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('error', 'Job not found');
      expect(response.body).to.have.property('timestamp');
    });
  });

  describe('Pagination', () => {
    it('should handle pagination parameters for users', async () => {
      const response = await request(server.listener)
        .get(`${baseUrl}/users?page=1&limit=5`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body.data.pagination).to.have.property('page', 1);
      expect(response.body.data.pagination).to.have.property('limit', 5);
    });

    it('should handle pagination parameters for polls', async () => {
      const response = await request(server.listener)
        .get(`${baseUrl}/polls?page=1&limit=5`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body.data.pagination).to.have.property('page', 1);
      expect(response.body.data.pagination).to.have.property('limit', 5);
    });

    it('should handle pagination parameters for activities', async () => {
      const response = await request(server.listener)
        .get(`${baseUrl}/activities?page=1&limit=5`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body.data.pagination).to.have.property('page', 1);
      expect(response.body.data.pagination).to.have.property('limit', 5);
    });

    it('should handle pagination parameters for jobs', async () => {
      const response = await request(server.listener)
        .get(`${baseUrl}/jobs?page=1&limit=5`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body.data.pagination).to.have.property('page', 1);
      expect(response.body.data.pagination).to.have.property('limit', 5);
    });
  });
});
