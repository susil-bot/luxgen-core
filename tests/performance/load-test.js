/**
 * @fileoverview Performance and Load Tests
 * Comprehensive performance tests for the Hapi.js multi-tenant API
 * 
 * @module
 */

const request = require('supertest');
const { expect } = require('chai');
const { createServer } = require('../../src/hapi/index');

describe('Performance and Load Tests', () => {
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

  describe('Response Time Tests', () => {
    it('should respond to health check within 100ms', async () => {
      const startTime = Date.now();
      
      const response = await request(server.listener)
        .get(`${baseUrl}/health`)
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).to.be.lessThan(100);
      expect(response.body).to.have.property('success', true);
    });

    it('should respond to stats endpoint within 200ms', async () => {
      const startTime = Date.now();
      
      const response = await request(server.listener)
        .get(`${baseUrl}/stats`)
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).to.be.lessThan(200);
      expect(response.body).to.have.property('success', true);
    });

    it('should respond to user list within 300ms', async () => {
      const startTime = Date.now();
      
      const response = await request(server.listener)
        .get(`${baseUrl}/users`)
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).to.be.lessThan(300);
      expect(response.body).to.have.property('success', true);
    });

    it('should respond to poll list within 300ms', async () => {
      const startTime = Date.now();
      
      const response = await request(server.listener)
        .get(`${baseUrl}/polls`)
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).to.be.lessThan(300);
      expect(response.body).to.have.property('success', true);
    });

    it('should respond to activity list within 300ms', async () => {
      const startTime = Date.now();
      
      const response = await request(server.listener)
        .get(`${baseUrl}/activities`)
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).to.be.lessThan(300);
      expect(response.body).to.have.property('success', true);
    });

    it('should respond to job list within 300ms', async () => {
      const startTime = Date.now();
      
      const response = await request(server.listener)
        .get(`${baseUrl}/jobs`)
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).to.be.lessThan(300);
      expect(response.body).to.have.property('success', true);
    });
  });

  describe('Concurrent Request Tests', () => {
    it('should handle 10 concurrent health check requests', async () => {
      const promises = Array(10).fill().map(() => 
        request(server.listener)
          .get(`${baseUrl}/health`)
          .expect(200)
      );

      const startTime = Date.now();
      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(responses).to.have.length(10);
      responses.forEach(response => {
        expect(response.body).to.have.property('success', true);
      });

      // All requests should complete within 1 second
      expect(totalTime).to.be.lessThan(1000);
    });

    it('should handle 20 concurrent user creation requests', async () => {
      const promises = Array(20).fill().map((_, index) => {
        const userData = {
          firstName: `User${index}`,
          lastName: 'Test',
          email: `user${index}@example.com`,
          password: 'password123'
        };

        return request(server.listener)
          .post(`${baseUrl}/users`)
          .send(userData)
          .expect(201);
      });

      const startTime = Date.now();
      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(responses).to.have.length(20);
      responses.forEach(response => {
        expect(response.body).to.have.property('success', true);
        expect(response.body.data).to.have.property('user');
      });

      // All requests should complete within 5 seconds
      expect(totalTime).to.be.lessThan(5000);
    });

    it('should handle 15 concurrent poll creation requests', async () => {
      const promises = Array(15).fill().map((_, index) => {
        const pollData = {
          title: `Poll ${index}`,
          description: `This is poll number ${index}`,
          options: [`Option A${index}`, `Option B${index}`],
          createdBy: 'user_id_1'
        };

        return request(server.listener)
          .post(`${baseUrl}/polls`)
          .send(pollData)
          .expect(201);
      });

      const startTime = Date.now();
      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(responses).to.have.length(15);
      responses.forEach(response => {
        expect(response.body).to.have.property('success', true);
        expect(response.body.data).to.have.property('poll');
      });

      // All requests should complete within 5 seconds
      expect(totalTime).to.be.lessThan(5000);
    });

    it('should handle 25 concurrent activity creation requests', async () => {
      const promises = Array(25).fill().map((_, index) => {
        const activityData = {
          type: `activity_${index}`,
          description: `Activity number ${index}`,
          userId: 'user_id_1'
        };

        return request(server.listener)
          .post(`${baseUrl}/activities`)
          .send(activityData)
          .expect(201);
      });

      const startTime = Date.now();
      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(responses).to.have.length(25);
      responses.forEach(response => {
        expect(response.body).to.have.property('success', true);
        expect(response.body.data).to.have.property('activity');
      });

      // All requests should complete within 5 seconds
      expect(totalTime).to.be.lessThan(5000);
    });

    it('should handle 10 concurrent job creation requests', async () => {
      const promises = Array(10).fill().map((_, index) => {
        const jobData = {
          title: `Job ${index}`,
          description: `Job description ${index}`,
          company: `Company ${index}`,
          location: `Location ${index}`,
          createdBy: 'user_id_1'
        };

        return request(server.listener)
          .post(`${baseUrl}/jobs`)
          .send(jobData)
          .expect(201);
      });

      const startTime = Date.now();
      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(responses).to.have.length(10);
      responses.forEach(response => {
        expect(response.body).to.have.property('success', true);
        expect(response.body.data).to.have.property('job');
      });

      // All requests should complete within 5 seconds
      expect(totalTime).to.be.lessThan(5000);
    });
  });

  describe('Memory Usage Tests', () => {
    it('should not exceed memory limits during bulk operations', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Create 100 users
      const userPromises = Array(100).fill().map((_, index) => {
        const userData = {
          firstName: `BulkUser${index}`,
          lastName: 'Test',
          email: `bulkuser${index}@example.com`,
          password: 'password123'
        };

        return request(server.listener)
          .post(`${baseUrl}/users`)
          .send(userData);
      });

      await Promise.all(userPromises);

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).to.be.lessThan(50 * 1024 * 1024);
    });

    it('should handle pagination efficiently', async () => {
      const startTime = Date.now();

      // Test pagination with different page sizes
      const pageSizes = [5, 10, 20, 50];
      const promises = pageSizes.map(size => 
        request(server.listener)
          .get(`${baseUrl}/users?page=1&limit=${size}`)
          .expect(200)
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(responses).to.have.length(4);
      responses.forEach(response => {
        expect(response.body).to.have.property('success', true);
        expect(response.body.data).to.have.property('pagination');
      });

      // All pagination requests should complete within 1 second
      expect(totalTime).to.be.lessThan(1000);
    });
  });

  describe('Error Handling Performance', () => {
    it('should handle 404 errors efficiently', async () => {
      const startTime = Date.now();

      const promises = Array(20).fill().map(() => 
        request(server.listener)
          .get(`${baseUrl}/users/non-existent-id`)
          .expect(404)
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(responses).to.have.length(20);
      responses.forEach(response => {
        expect(response.body).to.have.property('success', false);
        expect(response.body).to.have.property('error', 'User not found');
      });

      // All 404 responses should complete within 1 second
      expect(totalTime).to.be.lessThan(1000);
    });

    it('should handle invalid request data efficiently', async () => {
      const startTime = Date.now();

      const promises = Array(10).fill().map(() => 
        request(server.listener)
          .post(`${baseUrl}/users`)
          .send({}) // Invalid data
          .expect(400)
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(responses).to.have.length(10);
      responses.forEach(response => {
        expect(response.body).to.have.property('success', false);
      });

      // All error responses should complete within 1 second
      expect(totalTime).to.be.lessThan(1000);
    });
  });

  describe('Database Performance', () => {
    it('should handle database initialization efficiently', async () => {
      const startTime = Date.now();

      const response = await request(server.listener)
        .post(`${baseUrl}/initialize/${tenantSlug}`)
        .expect(201);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.body).to.have.property('success', true);
      expect(responseTime).to.be.lessThan(2000); // Should complete within 2 seconds
    });

    it('should handle database health checks efficiently', async () => {
      const startTime = Date.now();

      const response = await request(server.listener)
        .get(`${baseUrl}/health/${tenantSlug}`)
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.body).to.have.property('success', true);
      expect(responseTime).to.be.lessThan(500); // Should complete within 500ms
    });

    it('should handle database statistics efficiently', async () => {
      const startTime = Date.now();

      const response = await request(server.listener)
        .get(`${baseUrl}/stats/${tenantSlug}`)
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.body).to.have.property('success', true);
      expect(responseTime).to.be.lessThan(1000); // Should complete within 1 second
    });
  });

  describe('Tenant Switching Performance', () => {
    it('should switch between tenants efficiently', async () => {
      const tenants = ['luxgen', 'test', 'demo'];
      const startTime = Date.now();

      const promises = tenants.map(tenant => 
        request(server.listener)
          .get(`/${tenant}/health/${tenant}`)
          .expect(200)
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(responses).to.have.length(3);
      responses.forEach(response => {
        expect(response.body).to.have.property('success', true);
      });

      // All tenant switches should complete within 2 seconds
      expect(totalTime).to.be.lessThan(2000);
    });

    it('should maintain tenant isolation during concurrent operations', async () => {
      const tenants = ['luxgen', 'test'];
      const startTime = Date.now();

      // Create users in different tenants concurrently
      const luxgenPromise = request(server.listener)
        .post('/luxgen/users')
        .send({
          firstName: 'LuxGen',
          lastName: 'User',
          email: 'luxgen@example.com',
          password: 'password123'
        })
        .expect(201);

      const testPromise = request(server.listener)
        .post('/test/users')
        .send({
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(201);

      const [luxgenResponse, testResponse] = await Promise.all([luxgenPromise, testPromise]);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(luxgenResponse.body.data.user.tenantId).to.equal('luxgen');
      expect(testResponse.body.data.user.tenantId).to.equal('test');

      // Concurrent operations should complete within 2 seconds
      expect(totalTime).to.be.lessThan(2000);
    });
  });
});
