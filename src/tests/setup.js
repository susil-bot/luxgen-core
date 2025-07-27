/**
 * Test Setup Configuration
 * Configures Jest and test environment
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

let mongoServer;

// Test configuration
const testConfig = {
  // Database
  database: {
    uri: null, // Will be set to in-memory database
    options: {
      maxPoolSize: 1,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      bufferMaxEntries: 0
    }
  },
  
  // JWT
  jwt: {
    secret: 'test-secret-key',
    expiresIn: '1h'
  },
  
  // Test data
  testUsers: [
    {
      _id: new mongoose.Types.ObjectId(),
      email: 'admin@test.com',
      password: 'TestPass123!',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      tenantId: 'test-tenant-1',
      status: 'active'
    },
    {
      _id: new mongoose.Types.ObjectId(),
      email: 'trainer@test.com',
      password: 'TestPass123!',
      firstName: 'Trainer',
      lastName: 'User',
      role: 'trainer',
      tenantId: 'test-tenant-1',
      status: 'active'
    },
    {
      _id: new mongoose.Types.ObjectId(),
      email: 'participant@test.com',
      password: 'TestPass123!',
      firstName: 'Participant',
      lastName: 'User',
      role: 'participant',
      tenantId: 'test-tenant-1',
      status: 'active'
    }
  ],
  
  testTenants: [
    {
      _id: new mongoose.Types.ObjectId(),
      name: 'Test Tenant 1',
      slug: 'test-tenant-1',
      domain: 'test1.example.com',
      status: 'active',
      settings: {
        features: ['training', 'polls', 'ai'],
        branding: {
          primaryColor: '#007bff',
          logo: 'test-logo.png'
        }
      }
    }
  ]
};

/**
 * Setup test database
 */
async function setupTestDatabase() {
  try {
    // Start in-memory MongoDB server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Connect to test database
    await mongoose.connect(mongoUri, testConfig.database.options);
    
    console.log('✅ Test database connected');
    
    return mongoUri;
  } catch (error) {
    console.error('❌ Failed to setup test database:', error);
    throw error;
  }
}

/**
 * Teardown test database
 */
async function teardownTestDatabase() {
  try {
    // Disconnect from database
    await mongoose.disconnect();
    
    // Stop in-memory server
    if (mongoServer) {
      await mongoServer.stop();
    }
    
    console.log('✅ Test database disconnected');
  } catch (error) {
    console.error('❌ Failed to teardown test database:', error);
    throw error;
  }
}

/**
 * Clear all collections
 */
async function clearCollections() {
  try {
    const collections = mongoose.connection.collections;
    
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
    
    console.log('🧹 Collections cleared');
  } catch (error) {
    console.error('❌ Failed to clear collections:', error);
    throw error;
  }
}

/**
 * Seed test data
 */
async function seedTestData() {
  try {
    const { User, Tenant } = require('../models');
    
    // Create test tenants
    await Tenant.insertMany(testConfig.testTenants);
    
    // Create test users
    await User.insertMany(testConfig.testUsers);
    
    console.log('🌱 Test data seeded');
  } catch (error) {
    console.error('❌ Failed to seed test data:', error);
    throw error;
  }
}

/**
 * Generate test JWT token
 */
function generateTestToken(user = testConfig.testUsers[0]) {
  return jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      tenantId: user.tenantId
    },
    testConfig.jwt.secret,
    { expiresIn: testConfig.jwt.expiresIn }
  );
}

/**
 * Create test request object
 */
function createTestRequest(options = {}) {
  const {
    method = 'GET',
    url = '/test',
    body = {},
    query = {},
    params = {},
    headers = {},
    user = testConfig.testUsers[0]
  } = options;
  
  return {
    method,
    url,
    body,
    query,
    params,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${generateTestToken(user)}`,
      ...headers
    },
    user: {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      tenantId: user.tenantId
    }
  };
}

/**
 * Create test response object
 */
function createTestResponse() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis()
  };
  
  return res;
}

/**
 * Create test next function
 */
function createTestNext() {
  return jest.fn();
}

/**
 * Test utilities
 */
const testUtils = {
  // Database utilities
  setupTestDatabase,
  teardownTestDatabase,
  clearCollections,
  seedTestData,
  
  // Authentication utilities
  generateTestToken,
  
  // Request/Response utilities
  createTestRequest,
  createTestResponse,
  createTestNext,
  
  // Test data
  testConfig,
  
  // Helper functions
  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
  
  createMockModel(mockData = []) {
    return {
      find: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            skip: jest.fn().mockResolvedValue(mockData)
          })
        })
      }),
      findById: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockData[0] || null)
      }),
      findOne: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockData[0] || null)
      }),
      create: jest.fn().mockResolvedValue(mockData[0] || {}),
      findByIdAndUpdate: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockData[0] || null)
      }),
      findByIdAndDelete: jest.fn().mockResolvedValue(mockData[0] || null),
      countDocuments: jest.fn().mockResolvedValue(mockData.length),
      deleteMany: jest.fn().mockResolvedValue({ deletedCount: mockData.length })
    };
  },
  
  createMockService(mockData = {}) {
    return {
      initialize: jest.fn().mockResolvedValue(true),
      generateContent: jest.fn().mockResolvedValue(mockData),
      checkHealth: jest.fn().mockResolvedValue({ healthy: true }),
      getContentLibrary: jest.fn().mockResolvedValue(mockData)
    };
  }
};

module.exports = testUtils; 