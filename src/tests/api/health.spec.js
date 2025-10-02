const request = require('supertest');
const app = require('../../index');

describe('Health Check API Tests', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.service).toBe('luxgen-trainer-platform-api');
      expect(response.body.version).toBe('1.0.0');
      expect(response.body.uptime).toBeDefined();
      expect(response.body.timestamp).toBeDefined();
      expect(response.headers['x-api-source']).toBe('luxgen-core');
      expect(response.headers['x-api-version']).toBe('1.0.0');
    });
  });

  describe('GET /health/db', () => {
    it('should return database health status', async () => {
      const response = await request(app)
        .get('/health/db')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.database).toBeDefined();
      expect(response.body.timestamp).toBeDefined();
      expect(response.headers['x-api-source']).toBe('luxgen-core');
      expect(response.headers['x-api-version']).toBe('1.0.0');
    });
  });

  describe('GET /docs', () => {
    it('should return API documentation', async () => {
      const response = await request(app)
        .get('/docs')
        .expect(200);

      expect(response.body.message).toBe('LuxGen Trainer Platform API Documentation');
      expect(response.body.version).toBe('v1');
      expect(response.body.endpoints).toBeDefined();
      expect(response.body.endpoints.health).toBeDefined();
      expect(response.body.endpoints.tenants).toBeDefined();
      expect(response.body.endpoints.auth).toBeDefined();
      expect(response.headers['x-api-source']).toBe('luxgen-core');
      expect(response.headers['x-api-version']).toBe('1.0.0');
    });
  });
});
