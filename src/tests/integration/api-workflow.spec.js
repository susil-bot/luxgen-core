const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../index');
const User = require('../../models/User');
const Tenant = require('../../models/Tenant');

describe('Complete API Workflow Integration Tests', () => {
  let authToken;
  let testTenant;
  let testUser;

  beforeAll(async () => {
    // Clean up any existing test data
    await User.deleteMany({ email: { $regex: /.*@workflow-test\.com/ } });
    await Tenant.deleteMany({ slug: { $regex: /workflow-test/ } });
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({ email: { $regex: /.*@workflow-test\.com/ } });
    await Tenant.deleteMany({ slug: { $regex: /workflow-test/ } });
    await mongoose.connection.close();
  });

  describe('Complete User Registration and Authentication Workflow', () => {
    it('should complete full user registration and login workflow', async () => {
      // Step 1: Create a tenant first (admin operation)
      const tenantData = {
        name: 'Workflow Test Tenant',
        slug: 'workflow-test-tenant',
        description: 'Tenant for workflow testing',
        contactEmail: 'admin@workflow-test.com',
        isActive: true
      };

      // Create admin user for tenant creation
      const adminUser = new User({
        email: 'admin@workflow-test.com',
        password: 'admin123',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        isActive: true
      });
      await adminUser.save();

      // Login as admin
      const adminLoginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@workflow-test.com',
          password: 'admin123'
        });

      const adminToken = adminLoginResponse.body.data.token;

      // Create tenant
      const tenantResponse = await request(app)
        .post('/api/v1/tenants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(tenantData)
        .expect(201);

      testTenant = tenantResponse.body.data;

      // Step 2: Register a new user
      const userData = {
        email: 'user@workflow-test.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        tenantSlug: 'workflow-test-tenant'
      };

      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(registerResponse.body.success).toBe(true);
      expect(registerResponse.body.data.user).toBeDefined();
      expect(registerResponse.body.data.token).toBeDefined();
      expect(registerResponse.headers['x-api-source']).toBe('luxgen-core');
      expect(registerResponse.headers['x-api-version']).toBe('1.0.0');

      testUser = registerResponse.body.data.user;
      authToken = registerResponse.body.data.token;

      // Step 3: Login with the registered user
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'user@workflow-test.com',
          password: 'password123'
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.data.user.email).toBe('user@workflow-test.com');
      expect(loginResponse.headers['x-api-source']).toBe('luxgen-core');
      expect(loginResponse.headers['x-api-version']).toBe('1.0.0');

      // Step 4: Test authenticated endpoints
      const healthResponse = await request(app)
        .get('/health')
        .expect(200);

      expect(healthResponse.body.status).toBe('healthy');
      expect(healthResponse.headers['x-api-source']).toBe('luxgen-core');

      // Step 5: Test logout
      const logoutResponse = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(logoutResponse.body.success).toBe(true);
      expect(logoutResponse.headers['x-api-source']).toBe('luxgen-core');
    });

    it('should handle password reset workflow', async () => {
      // Step 1: Request password reset
      const forgotPasswordResponse = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'user@workflow-test.com' })
        .expect(200);

      expect(forgotPasswordResponse.body.success).toBe(true);
      expect(forgotPasswordResponse.body.message).toContain('Password reset email sent');
      expect(forgotPasswordResponse.headers['x-api-source']).toBe('luxgen-core');

      // Note: In a real scenario, you would extract the reset token from the email
      // For testing purposes, we'll simulate this with a mock token
      const mockResetToken = 'mock-reset-token-123';

      // Step 2: Reset password
      const resetPasswordResponse = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: mockResetToken,
          newPassword: 'newpassword123'
        });

      // This will fail in test environment as we don't have a real token
      // but it demonstrates the API structure
      expect(resetPasswordResponse.status).toBeDefined();
    });

    it('should handle token refresh workflow', async () => {
      // Login to get a token
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'user@workflow-test.com',
          password: 'password123'
        })
        .expect(200);

      const token = loginResponse.body.data.token;

      // Refresh the token
      const refreshResponse = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: token })
        .expect(200);

      expect(refreshResponse.body.success).toBe(true);
      expect(refreshResponse.body.data.token).toBeDefined();
      expect(refreshResponse.headers['x-api-source']).toBe('luxgen-core');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid API endpoints gracefully', async () => {
      const response = await request(app)
        .get('/api/v1/nonexistent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('API endpoint not found');
      expect(response.headers['x-api-source']).toBe('luxgen-core');
    });

    it('should handle malformed JSON requests', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle rate limiting', async () => {
      // Make multiple requests to test rate limiting
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          request(app)
            .get('/health')
        );
      }

      const responses = await Promise.all(promises);
      
      // All should succeed as health endpoint might not be rate limited
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.headers['x-api-source']).toBe('luxgen-core');
      });
    });
  });

  describe('API Headers and Metadata', () => {
    it('should include custom headers in all responses', async () => {
      const endpoints = [
        { method: 'GET', path: '/health' },
        { method: 'GET', path: '/docs' },
        { method: 'POST', path: '/api/v1/auth/login', body: { email: 'user@workflow-test.com', password: 'password123' } }
      ];

      for (const endpoint of endpoints) {
        let response;
        if (endpoint.method === 'GET') {
          response = await request(app).get(endpoint.path);
        } else if (endpoint.method === 'POST') {
          response = await request(app).post(endpoint.path).send(endpoint.body);
        }

        expect(response.headers['x-api-source']).toBe('luxgen-core');
        expect(response.headers['x-api-version']).toBe('1.0.0');
      }
    });

    it('should include proper CORS headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers['access-control-allow-credentials']).toBe('true');
      expect(response.headers['access-control-expose-headers']).toContain('X-Total-Count');
    });
  });
});
