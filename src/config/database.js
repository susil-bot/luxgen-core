const mongoose = require('mongoose');
const logger = require('../utils/logger');

// Enhanced database configuration with connection pooling and retry logic
const databaseConfig = {
  // Connection options with pooling
  options: {
    maxPoolSize: 10, // Maximum number of connections in the pool
    minPoolSize: 2,  // Minimum number of connections in the pool
    serverSelectionTimeoutMS: 5000, // Timeout for server selection
    socketTimeoutMS: 45000, // Socket timeout
    connectTimeoutMS: 10000, // Connection timeout
    retryWrites: true, // Enable retry for write operations
    retryReads: true,  // Enable retry for read operations
    w: 'majority', // Write concern
    readPreference: 'secondaryPreferred', // Read preference for better performance
    maxIdleTimeMS: 30000, // Maximum time a connection can remain idle
    heartbeatFrequencyMS: 10000, // Heartbeat frequency
    bufferCommands: false, // Disable mongoose command buffering
  },
  
  // Index configuration for performance
  indexes: {
    // User indexes
    userIndexes: [
      { email: 1, tenantId: 1 }, // Compound index for email lookups
      { tenantId: 1, role: 1 }, // Compound index for role-based queries
      { tenantId: 1, status: 1 }, // Compound index for status queries
      { createdAt: -1 }, // Index for sorting by creation date
    ],
    
    // Training indexes
    trainingSessionIndexes: [
      { tenantId: 1, scheduledAt: 1 }, // Compound index for scheduled sessions
      { tenantId: 1, status: 1 }, // Compound index for status queries
      { trainerId: 1, tenantId: 1 }, // Compound index for trainer queries
      { participants: 1, tenantId: 1 }, // Compound index for participant queries
    ],
    
    trainingCourseIndexes: [
      { tenantId: 1, status: 1 }, // Compound index for course status
      { instructorId: 1, tenantId: 1 }, // Compound index for instructor queries
      { category: 1, tenantId: 1 }, // Compound index for category queries
      { tags: 1, tenantId: 1 }, // Index for tag-based searches
    ],
    
    // Poll indexes
    pollIndexes: [
      { tenantId: 1, status: 1 }, // Compound index for poll status
      { createdBy: 1, tenantId: 1 }, // Compound index for creator queries
      { createdAt: -1 }, // Index for sorting by creation date
    ],
    
    // Presentation indexes
    presentationIndexes: [
      { tenantId: 1, status: 1 }, // Compound index for presentation status
      { createdBy: 1, tenantId: 1 }, // Compound index for creator queries
      { tags: 1, tenantId: 1 }, // Index for tag-based searches
    ]
  }
};

// Enhanced connection function with retry logic
async function connectToDatabase(uri) {
  const maxRetries = 5;
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      logger.info(`🔄 Attempting database connection (attempt ${retryCount + 1}/${maxRetries})...`);
      
      await mongoose.connect(uri, databaseConfig.options);
      
      logger.info('✅ Database connected successfully');
      
      // Set up connection event listeners
      mongoose.connection.on('error', (error) => {
        logger.error('❌ Database connection error:', error);
      });
      
      mongoose.connection.on('disconnected', () => {
        logger.warn('⚠️ Database disconnected');
      });
      
      mongoose.connection.on('reconnected', () => {
        logger.info('🔄 Database reconnected');
      });
      
      // Create indexes for performance
      await createIndexes();
      
      return true;
    } catch (error) {
      retryCount++;
      logger.error(`❌ Database connection attempt ${retryCount} failed:`, error.message);
      
      if (retryCount >= maxRetries) {
        logger.error('💥 Maximum database connection retries reached');
        throw error;
      }
      
      // Exponential backoff
      const delay = Math.pow(2, retryCount) * 1000;
      logger.info(`⏳ Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Create database indexes for performance
async function createIndexes() {
  try {
    logger.info('📊 Creating database indexes for performance...');
    
    const { User, TrainingSession, TrainingCourse, Poll, Presentation } = require('../models');
    
    // User indexes
    await User.collection.createIndexes(databaseConfig.indexes.userIndexes);
    
    // Training indexes
    await TrainingSession.collection.createIndexes(databaseConfig.indexes.trainingSessionIndexes);
    await TrainingCourse.collection.createIndexes(databaseConfig.indexes.trainingCourseIndexes);
    
    // Poll indexes
    await Poll.collection.createIndexes(databaseConfig.indexes.pollIndexes);
    
    // Presentation indexes
    await Presentation.collection.createIndexes(databaseConfig.indexes.presentationIndexes);
    
    logger.info('✅ Database indexes created successfully');
  } catch (error) {
    logger.error('❌ Error creating database indexes:', error);
    // Don't throw error as indexes are optional for functionality
  }
}

// Enhanced query optimization helper
function optimizeQuery(query, options = {}) {
  const {
    lean = true, // Use lean queries for better performance
    limit = 50,  // Default limit
    select = null, // Fields to select
    populate = null, // Fields to populate
    sort = null // Sort options
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
}

// Pagination helper
function createPaginationOptions(req) {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
  const skip = (page - 1) * limit;
  
  return {
    page,
    limit,
    skip,
    sort: req.query.sort || { createdAt: -1 }
  };
}

module.exports = {
  connectToDatabase,
  createIndexes,
  optimizeQuery,
  createPaginationOptions,
  databaseConfig
}; 