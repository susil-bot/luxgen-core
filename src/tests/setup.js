/**
 * Test Setup Configuration
 * Configures Jest and test environment
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// Setup before all tests
beforeAll(async () => {
  // Start in-memory MongoDB server
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Connect to test database
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  
  console.log('✅ Test database connected');
});

// Cleanup after each test
afterEach(async () => {
  // Clear all collections
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany();
  }
});

// Cleanup after all tests
afterAll(async () => {
  // Disconnect from test database
  await mongoose.disconnect();
  
  // Stop in-memory MongoDB server
  if (mongoServer) {
    await mongoServer.stop();
  }
  
  console.log('✅ Test database disconnected');
});

// Global test utilities
global.testUtils = {
  // Create test user
  createTestUser: async (userData = {}) => {
    const User = require('../models/User');
    const Tenant = require('../models/Tenant');
    
    // Create test tenant if not provided
    let tenant = userData.tenantId;
    if (!tenant) {
      tenant = await Tenant.create({
        name: 'Test Tenant',
        slug: 'test-tenant',
        contactEmail: 'test@tenant.com',
        status: 'active'
      });
    }
    
    const defaultUserData = {
      tenantId: tenant._id || tenant,
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'password123',
      role: 'user',
      isActive: true,
      isVerified: true
    };
    
    return await User.create({ ...defaultUserData, ...userData });
  },
  
  // Create test tenant
  createTestTenant: async (tenantData = {}) => {
    const Tenant = require('../models/Tenant');
    
    const defaultTenantData = {
      name: 'Test Tenant',
      slug: 'test-tenant',
      contactEmail: 'test@tenant.com',
      status: 'active',
      isVerified: true
    };
    
    return await Tenant.create({ ...defaultTenantData, ...tenantData });
  },
  
  // Generate JWT token
  generateTestToken: (user) => {
    const jwt = require('jsonwebtoken');
    const secret = process.env.JWT_SECRET || 'test-secret';
    
    return jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId
      },
      secret,
      { expiresIn: '1h' }
    );
  },
  
  // Mock request object
  mockRequest: (data = {}) => ({
    body: data.body || {},
    query: data.query || {},
    params: data.params || {},
    headers: data.headers || {},
    user: data.user || null,
    ip: data.ip || '127.0.0.1',
    method: data.method || 'GET',
    url: data.url || '/test',
    originalUrl: data.originalUrl || '/test'
  }),
  
  // Mock response object
  mockResponse: () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
  },
  
  // Mock next function
  mockNext: () => jest.fn()
};

// Environment setup for tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes-only';
process.env.MONGODB_URL = 'mongodb://localhost:27017/test';
process.env.REDIS_URL = 'redis://localhost:6379/1'; 