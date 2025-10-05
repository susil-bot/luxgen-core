/**
 * @fileoverview Multi-Tenancy Integration Tests
 * Comprehensive integration tests for multi-tenancy functionality
 * 
 * @module
 */

const request = require('supertest');
const { expect } = require('chai');
const { createServer } = require('../../src/hapi/index');

describe('Multi-Tenancy Integration Tests', () => {
  let server;
  const tenants = ['luxgen', 'test', 'demo'];

  before(async () => {
    server = await createServer();
  });

  after(async () => {
    if (server) {
      await server.stop();
    }
  });

  describe('Tenant Isolation', () => {
    it('should maintain data isolation between tenants', async () => {
      // Create user in luxgen tenant
      const luxgenUser = {
        firstName: 'LuxGen',
        lastName: 'User',
        email: 'luxgen@example.com',
        password: 'password123'
      };

      const luxgenResponse = await request(server.listener)
        .post(`/luxgen/users`)
        .send(luxgenUser)
        .expect(201);

      expect(luxgenResponse.body.data.user.tenantId).to.equal('luxgen');

      // Create user in test tenant
      const testUser = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'password123'
      };

      const testResponse = await request(server.listener)
        .post(`/test/users`)
        .send(testUser)
        .expect(201);

      expect(testResponse.body.data.user.tenantId).to.equal('test');

      // Verify users are isolated
      const luxgenUsers = await request(server.listener)
        .get(`/luxgen/users`)
        .expect(200);

      const testUsers = await request(server.listener)
        .get(`/test/users`)
        .expect(200);

      expect(luxgenUsers.body.data.users).to.have.length(1);
      expect(testUsers.body.data.users).to.have.length(1);
      expect(luxgenUsers.body.data.users[0].tenantId).to.equal('luxgen');
      expect(testUsers.body.data.users[0].tenantId).to.equal('test');
    });

    it('should maintain poll isolation between tenants', async () => {
      // Create poll in luxgen tenant
      const luxgenPoll = {
        title: 'LuxGen Poll',
        description: 'This is a LuxGen poll',
        options: ['Option A', 'Option B'],
        createdBy: 'luxgen_user_id'
      };

      const luxgenResponse = await request(server.listener)
        .post(`/luxgen/polls`)
        .send(luxgenPoll)
        .expect(201);

      expect(luxgenResponse.body.data.poll.tenantId).to.equal('luxgen');

      // Create poll in test tenant
      const testPoll = {
        title: 'Test Poll',
        description: 'This is a test poll',
        options: ['Option 1', 'Option 2'],
        createdBy: 'test_user_id'
      };

      const testResponse = await request(server.listener)
        .post(`/test/polls`)
        .send(testPoll)
        .expect(201);

      expect(testResponse.body.data.poll.tenantId).to.equal('test');

      // Verify polls are isolated
      const luxgenPolls = await request(server.listener)
        .get(`/luxgen/polls`)
        .expect(200);

      const testPolls = await request(server.listener)
        .get(`/test/polls`)
        .expect(200);

      expect(luxgenPolls.body.data.polls).to.have.length(1);
      expect(testPolls.body.data.polls).to.have.length(1);
      expect(luxgenPolls.body.data.polls[0].tenantId).to.equal('luxgen');
      expect(testPolls.body.data.polls[0].tenantId).to.equal('test');
    });

    it('should maintain activity isolation between tenants', async () => {
      // Create activity in luxgen tenant
      const luxgenActivity = {
        type: 'luxgen_action',
        description: 'LuxGen specific activity',
        userId: 'luxgen_user_id'
      };

      const luxgenResponse = await request(server.listener)
        .post(`/luxgen/activities`)
        .send(luxgenActivity)
        .expect(201);

      expect(luxgenResponse.body.data.activity.tenantId).to.equal('luxgen');

      // Create activity in test tenant
      const testActivity = {
        type: 'test_action',
        description: 'Test specific activity',
        userId: 'test_user_id'
      };

      const testResponse = await request(server.listener)
        .post(`/test/activities`)
        .send(testActivity)
        .expect(201);

      expect(testResponse.body.data.activity.tenantId).to.equal('test');

      // Verify activities are isolated
      const luxgenActivities = await request(server.listener)
        .get(`/luxgen/activities`)
        .expect(200);

      const testActivities = await request(server.listener)
        .get(`/test/activities`)
        .expect(200);

      expect(luxgenActivities.body.data.activities).to.have.length(1);
      expect(testActivities.body.data.activities).to.have.length(1);
      expect(luxgenActivities.body.data.activities[0].tenantId).to.equal('luxgen');
      expect(testActivities.body.data.activities[0].tenantId).to.equal('test');
    });

    it('should maintain job isolation between tenants', async () => {
      // Create job in luxgen tenant
      const luxgenJob = {
        title: 'LuxGen Developer',
        description: 'LuxGen specific job',
        company: 'LuxGen Corp',
        location: 'LuxGen Office',
        createdBy: 'luxgen_user_id'
      };

      const luxgenResponse = await request(server.listener)
        .post(`/luxgen/jobs`)
        .send(luxgenJob)
        .expect(201);

      expect(luxgenResponse.body.data.job.tenantId).to.equal('luxgen');

      // Create job in test tenant
      const testJob = {
        title: 'Test Developer',
        description: 'Test specific job',
        company: 'Test Corp',
        location: 'Test Office',
        createdBy: 'test_user_id'
      };

      const testResponse = await request(server.listener)
        .post(`/test/jobs`)
        .send(testJob)
        .expect(201);

      expect(testResponse.body.data.job.tenantId).to.equal('test');

      // Verify jobs are isolated
      const luxgenJobs = await request(server.listener)
        .get(`/luxgen/jobs`)
        .expect(200);

      const testJobs = await request(server.listener)
        .get(`/test/jobs`)
        .expect(200);

      expect(luxgenJobs.body.data.jobs).to.have.length(1);
      expect(testJobs.body.data.jobs).to.have.length(1);
      expect(luxgenJobs.body.data.jobs[0].tenantId).to.equal('luxgen');
      expect(testJobs.body.data.jobs[0].tenantId).to.equal('test');
    });
  });

  describe('Tenant Database Management', () => {
    it('should initialize multiple tenant databases', async () => {
      for (const tenant of tenants) {
        const response = await request(server.listener)
          .post(`/${tenant}/initialize/${tenant}`)
          .expect(201);

        expect(response.body).to.have.property('success', true);
        expect(response.body.data).to.have.property('message');
        expect(response.body.data).to.have.property('databaseName');
      }
    });

    it('should get health status for all tenants', async () => {
      for (const tenant of tenants) {
        const response = await request(server.listener)
          .get(`/${tenant}/health/${tenant}`)
          .expect(200);

        expect(response.body).to.have.property('success', true);
        expect(response.body.data).to.have.property('health');
        expect(response.body.data.health).to.have.property('status');
      }
    });

    it('should get statistics for all tenants', async () => {
      for (const tenant of tenants) {
        const response = await request(server.listener)
          .get(`/${tenant}/stats/${tenant}`)
          .expect(200);

        expect(response.body).to.have.property('success', true);
        expect(response.body.data).to.have.property('stats');
      }
    });

    it('should get configuration for all tenants', async () => {
      for (const tenant of tenants) {
        const response = await request(server.listener)
          .get(`/${tenant}/config/${tenant}`)
          .expect(200);

        expect(response.body).to.have.property('success', true);
        expect(response.body.data).to.have.property('config');
        expect(response.body.data.config).to.have.property('id', tenant);
      }
    });

    it('should get limits for all tenants', async () => {
      for (const tenant of tenants) {
        const response = await request(server.listener)
          .get(`/${tenant}/limits/${tenant}`)
          .expect(200);

        expect(response.body).to.have.property('success', true);
        expect(response.body.data).to.have.property('limits');
      }
    });
  });

  describe('Cross-Tenant Operations', () => {
    it('should not allow cross-tenant data access', async () => {
      // Create user in luxgen tenant
      const luxgenUser = {
        firstName: 'LuxGen',
        lastName: 'User',
        email: 'luxgen@example.com',
        password: 'password123'
      };

      const luxgenResponse = await request(server.listener)
        .post(`/luxgen/users`)
        .send(luxgenUser)
        .expect(201);

      const luxgenUserId = luxgenResponse.body.data.user._id;

      // Try to access luxgen user from test tenant (should fail)
      const testResponse = await request(server.listener)
        .get(`/test/users/${luxgenUserId}`)
        .expect(404);

      expect(testResponse.body).to.have.property('success', false);
      expect(testResponse.body).to.have.property('error', 'User not found');
    });

    it('should not allow cross-tenant poll access', async () => {
      // Create poll in luxgen tenant
      const luxgenPoll = {
        title: 'LuxGen Poll',
        description: 'This is a LuxGen poll',
        options: ['Option A', 'Option B'],
        createdBy: 'luxgen_user_id'
      };

      const luxgenResponse = await request(server.listener)
        .post(`/luxgen/polls`)
        .send(luxgenPoll)
        .expect(201);

      const luxgenPollId = luxgenResponse.body.data.poll._id;

      // Try to access luxgen poll from test tenant (should fail)
      const testResponse = await request(server.listener)
        .get(`/test/polls/${luxgenPollId}`)
        .expect(404);

      expect(testResponse.body).to.have.property('success', false);
      expect(testResponse.body).to.have.property('error', 'Poll not found');
    });

    it('should not allow cross-tenant activity access', async () => {
      // Create activity in luxgen tenant
      const luxgenActivity = {
        type: 'luxgen_action',
        description: 'LuxGen specific activity',
        userId: 'luxgen_user_id'
      };

      const luxgenResponse = await request(server.listener)
        .post(`/luxgen/activities`)
        .send(luxgenActivity)
        .expect(201);

      const luxgenActivityId = luxgenResponse.body.data.activity._id;

      // Try to access luxgen activity from test tenant (should fail)
      const testResponse = await request(server.listener)
        .get(`/test/activities/${luxgenActivityId}`)
        .expect(404);

      expect(testResponse.body).to.have.property('success', false);
      expect(testResponse.body).to.have.property('error', 'Activity not found');
    });

    it('should not allow cross-tenant job access', async () => {
      // Create job in luxgen tenant
      const luxgenJob = {
        title: 'LuxGen Developer',
        description: 'LuxGen specific job',
        company: 'LuxGen Corp',
        location: 'LuxGen Office',
        createdBy: 'luxgen_user_id'
      };

      const luxgenResponse = await request(server.listener)
        .post(`/luxgen/jobs`)
        .send(luxgenJob)
        .expect(201);

      const luxgenJobId = luxgenResponse.body.data.job._id;

      // Try to access luxgen job from test tenant (should fail)
      const testResponse = await request(server.listener)
        .get(`/test/jobs/${luxgenJobId}`)
        .expect(404);

      expect(testResponse.body).to.have.property('success', false);
      expect(testResponse.body).to.have.property('error', 'Job not found');
    });
  });

  describe('Tenant Cleanup', () => {
    it('should cleanup individual tenant resources', async () => {
      for (const tenant of tenants) {
        const response = await request(server.listener)
          .delete(`/${tenant}/cleanup/${tenant}`)
          .expect(200);

        expect(response.body).to.have.property('success', true);
        expect(response.body.data).to.have.property('message');
      }
    });

    it('should cleanup all tenant resources', async () => {
      const response = await request(server.listener)
        .delete(`/luxgen/cleanup`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body.data).to.have.property('message', 'All tenant resources cleaned up');
    });
  });

  describe('Tenant Configuration', () => {
    it('should get all tenants', async () => {
      const response = await request(server.listener)
        .get(`/luxgen/tenants`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body.data).to.have.property('tenants');
      expect(Array.isArray(response.body.data.tenants)).to.be.true;
      expect(response.body.data.tenants.length).to.be.greaterThan(0);
    });

    it('should validate tenant configuration', async () => {
      for (const tenant of tenants) {
        const response = await request(server.listener)
          .get(`/${tenant}/config/${tenant}`)
          .expect(200);

        expect(response.body).to.have.property('success', true);
        expect(response.body.data).to.have.property('config');
        expect(response.body.data.config).to.have.property('id', tenant);
        expect(response.body.data.config).to.have.property('slug', tenant);
      }
    });
  });
});
