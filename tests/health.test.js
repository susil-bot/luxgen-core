// Basic functionality tests
const request = require('supertest');
const app = require('../src/index');

describe('Basic Backend Tests', () => {
  // Test server startup
  test('Server should start without errors', () => {
    expect(app).toBeDefined();
  });

  // Test health endpoint
  test('Health endpoint should return 200', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);
    
    expect(response.body.status).toBe('healthy');
  });

  // Test API endpoint
  test('API endpoint should return 200', async () => {
    const response = await request(app)
      .get('/api')
      .expect(200);
    
    expect(response.body.message).toBeDefined();
  });

  // Test CORS headers
  test('CORS headers should be present', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);
    
    expect(response.headers['access-control-allow-origin']).toBeDefined();
  });

  // Test 404 handling
  test('Non-existent endpoint should return 404', async () => {
    await request(app)
      .get('/non-existent')
      .expect(404);
  });
});

// Mock tests for development
describe('Development Tests', () => {
  test('Environment variables should be loaded', () => {
    expect(process.env.NODE_ENV).toBeDefined();
  });

  test('Package.json should have required scripts', () => {
    const packageJson = require('../package.json');
    expect(packageJson.scripts.start).toBeDefined();
    expect(packageJson.scripts.dev).toBeDefined();
    expect(packageJson.scripts.test).toBeDefined();
  });

  test('Netlify configuration should exist', () => {
    const fs = require('fs');
    expect(fs.existsSync('netlify.toml')).toBe(true);
    expect(fs.existsSync('netlify/functions/api.js')).toBe(true);
    expect(fs.existsSync('netlify/functions/health.js')).toBe(true);
  });
});
