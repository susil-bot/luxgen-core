const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../index');
const Tenant = require('../../models/Tenant');
const User = require('../../models/User');

describe('Tenants API Tests', () => {
  let authToken;
  let testTenant;
  let testUser;

  beforeAll(async () => {
    // Create test tenant
    testTenant = new Tenant({
      name: 'Test Tenant',
      slug: 'test-tenant',
      description: 'Test tenant for API testing',
      isActive: true
    });
    await testTenant.save();

    // Create test user with admin role
    testUser = new User({
      email: 'admin@test.com',
      password: 'password123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      tenantId: testTenant._id,
      isActive: true
    });
    await testUser.save();

    // Login to get auth token
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'password123'
      });

    authToken = loginResponse.body.data.token;
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({ email: { $regex: /.*@test\.com/ } });
    await Tenant.deleteMany({ slug: { $regex: /test-tenant/ } });
    await mongoose.connection.close();
  });

  describe('GET /api/v1/tenants', () => {
    it('should get all tenants with admin token', async () => {
      const response = await request(app)
        .get('/api/v1/tenants')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.headers['x-api-source']).toBe('luxgen-core');
      expect(response.headers['x-api-version']).toBe('1.0.0');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/tenants')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token is required');
    });
  });

  describe('POST /api/v1/tenants', () => {
    it('should create new tenant with admin token', async () => {
      const tenantData = {
        name: 'New Test Tenant',
        slug: 'new-test-tenant',
        description: 'New test tenant',
        contactEmail: 'contact@newtest.com',
        isActive: true
      };

      const response = await request(app)
        .post('/api/v1/tenants')
        .set('Authorization', `Bearer ${authToken}`)
        .send(tenantData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(tenantData.name);
      expect(response.body.data.slug).toBe(tenantData.slug);
      expect(response.headers['x-api-source']).toBe('luxgen-core');
      expect(response.headers['x-api-version']).toBe('1.0.0');
    });

    it('should fail to create tenant with duplicate slug', async () => {
      const tenantData = {
        name: 'Duplicate Tenant',
        slug: 'test-tenant', // Same slug as existing tenant
        description: 'Duplicate tenant',
        contactEmail: 'contact@duplicate.com'
      };

      const response = await request(app)
        .post('/api/v1/tenants')
        .set('Authorization', `Bearer ${authToken}`)
        .send(tenantData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail without authentication', async () => {
      const tenantData = {
        name: 'Unauthorized Tenant',
        slug: 'unauthorized-tenant',
        description: 'Unauthorized tenant'
      };

      const response = await request(app)
        .post('/api/v1/tenants')
        .send(tenantData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/tenants/:id', () => {
    it('should get tenant by ID with admin token', async () => {
      const response = await request(app)
        .get(`/api/v1/tenants/${testTenant._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(testTenant._id.toString());
      expect(response.body.data.name).toBe(testTenant.name);
      expect(response.headers['x-api-source']).toBe('luxgen-core');
      expect(response.headers['x-api-version']).toBe('1.0.0');
    });

    it('should fail with invalid tenant ID', async () => {
      const invalidId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/v1/tenants/${invalidId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/tenants/:id', () => {
    it('should update tenant with admin token', async () => {
      const updateData = {
        name: 'Updated Test Tenant',
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/api/v1/tenants/${testTenant._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.description).toBe(updateData.description);
      expect(response.headers['x-api-source']).toBe('luxgen-core');
      expect(response.headers['x-api-version']).toBe('1.0.0');
    });
  });

  describe('DELETE /api/v1/tenants/:id', () => {
    it('should soft delete tenant with admin token', async () => {
      // Create a tenant to delete
      const tenantToDelete = new Tenant({
        name: 'Tenant to Delete',
        slug: 'tenant-to-delete',
        description: 'This tenant will be deleted',
        isActive: true
      });
      await tenantToDelete.save();

      const response = await request(app)
        .delete(`/api/v1/tenants/${tenantToDelete._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');
      expect(response.headers['x-api-source']).toBe('luxgen-core');
      expect(response.headers['x-api-version']).toBe('1.0.0');
    });
  });
});
