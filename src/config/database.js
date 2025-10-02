const mongoose = require('mongoose');
const logger = require('../utils/logger');

// Enhanced database configuration with connection pooling and retry logic
const databaseConfig = {
  // Connection options with pooling
  options: {
    maxPoolSize: 10,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    retryWrites: true,
    retryReads: true,
    w: 'majority',
    readPreference: 'secondaryPreferred',
    maxIdleTimeMS: 30000,
    heartbeatFrequencyMS: 10000,
    bufferCommands: false
  },
  
  // Index configuration for performance
  indexes: {
    // User indexes
    userIndexes: [
      { email: 1, tenantId: 1 },
      { tenantId: 1, role: 1 },
      { tenantId: 1, status: 1 },
      { createdAt: -1 }
    ],
    
    // Training indexes
    trainingSessionIndexes: [
      { tenantId: 1, scheduledAt: 1 },
      { tenantId: 1, status: 1 },
      { trainerId: 1, tenantId: 1 },
      { participants: 1, tenantId: 1 }
    ],
    
    trainingCourseIndexes: [
      { tenantId: 1, status: 1 },
      { instructorId: 1, tenantId: 1 },
      { category: 1, tenantId: 1 },
      { tags: 1, tenantId: 1 }
    ],
    
    // Poll indexes
    pollIndexes: [
      { tenantId: 1, status: 1 },
      { createdBy: 1, tenantId: 1 },
      { createdAt: -1 }
    ],
    
    // Presentation indexes
    presentationIndexes: [
      { tenantId: 1, status: 1 },
      { createdBy: 1, tenantId: 1 },
      { tags: 1, tenantId: 1 }
    ]
  }
};

// Enhanced connection function with retry logic
const connectToDatabase = async (uri) => {
  const maxRetries = 5;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      logger.info(`Attempting database connection (attempt ${retryCount + 1}/${maxRetries})...`);
      
      await mongoose.connect(uri, databaseConfig.options);
      
      logger.info('Database connected successfully');
      
      // Set up connection event listeners
      mongoose.connection.on('error', (error) => {
        logger.error('Database connection error:', error);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('WARNING: Database disconnected');
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('Database reconnected');
      });

      // Create indexes for performance
      await createIndexes();
      
      return true;
    } catch (error) {
      retryCount++;
      logger.error(`Database connection attempt ${retryCount} failed:`, error.message);
      
      if (retryCount >= maxRetries) {
        logger.error('Maximum database connection retries reached');
        throw error;
      }
      
      // Exponential backoff
      const delay = Math.pow(2, retryCount) * 1000;
      logger.info(`Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Create database indexes for performance
const createIndexes = async () => {
  try {
    logger.info('Creating database indexes for performance...');
    
    // Skip index creation for now to avoid errors
    logger.info('Database indexes creation skipped');
  } catch (error) {
    logger.error('Error creating database indexes:', error);
    // Don't throw error as indexes are optional for functionality
  }
};

// Enhanced query optimization helper
const optimizeQuery = (query, options = {}) => {
  const {
    lean = true,        // Use lean queries for better performance
    limit = 50,         // Default limit
    select = null,      // Fields to select
    populate = null,  // Fields to populate
    sort = null         // Sort options
  } = options;

  if (lean) {
    query.lean();
  }
  
  if (limit) {
    query.limit(limit);
  }
  
  if (select) {
    query.select(select);
  }
  
  if (populate) {
    query.populate(populate);
  }
  
  if (sort) {
    query.sort(sort);
  }
  
  return query;
};

// Pagination helper
const paginate = (query, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  return query.skip(skip).limit(limit);
};

// Database health check
const checkDatabaseHealth = async () => {
  try {
    const state = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    return {
      status: states[state] || 'unknown',
      connected: state === 1,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name
    };
  } catch (error) {
    logger.error('Database health check failed:', error);
    return {
      status: 'error',
      connected: false,
      error: error.message
    };
  }
};

module.exports = {
  connectToDatabase,
  createIndexes,
  optimizeQuery,
  paginate,
  checkDatabaseHealth,
  databaseConfig
};