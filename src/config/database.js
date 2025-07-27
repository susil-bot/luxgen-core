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
      retryCount += 1;
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
};


// Create database indexes for performance
const createIndexes = async () => {
  try {
    logger.info('📊 Creating database indexes for performance...');

    const { User, TrainingSession, TrainingCourse, Poll, Presentation } = require('../models');


    // Create indexes one by one to avoid configuration issues
    if (User && User.collection) {
      await User.collection.createIndex({ email: 1, tenantId: 1 });
      await User.collection.createIndex({ tenantId: 1, role: 1 });
      await User.collection.createIndex({ tenantId: 1, status: 1 });
      await User.collection.createIndex({ createdAt: -1 });
    }

    if (TrainingSession && TrainingSession.collection) {
      await TrainingSession.collection.createIndex({ tenantId: 1, scheduledAt: 1 });
      await TrainingSession.collection.createIndex({ tenantId: 1, status: 1 });
      await TrainingSession.collection.createIndex({ trainerId: 1, tenantId: 1 });
    }

    if (TrainingCourse && TrainingCourse.collection) {
      await TrainingCourse.collection.createIndex({ tenantId: 1, status: 1 });
      await TrainingCourse.collection.createIndex({ instructorId: 1, tenantId: 1 });
      await TrainingCourse.collection.createIndex({ category: 1, tenantId: 1 });
    }

    if (Poll && Poll.collection) {
      await Poll.collection.createIndex({ tenantId: 1, status: 1 });
      await Poll.collection.createIndex({ createdBy: 1, tenantId: 1 });
      await Poll.collection.createIndex({ createdAt: -1 });
    }

    if (Presentation && Presentation.collection) {
      await Presentation.collection.createIndex({ tenantId: 1, status: 1 });
      await Presentation.collection.createIndex({ createdBy: 1, tenantId: 1 });
      await Presentation.collection.createIndex({ tags: 1, tenantId: 1 });
    }

    logger.info('✅ Database indexes created successfully');
  } catch (error) {
    logger.error('❌ Error creating database indexes:', error);

    // Don't throw error as indexes are optional for functionality
  }
};


// Enhanced query optimization helper
const optimizeQuery = (query, options = {}) => {
  const {
    lean = true,
    // Use lean queries for better performance
    limit = 50,
    // Default limit
    select = null,
    // Fields to select
    populate = null,
    // Fields to populate
    sort = null
    // Sort options
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
const createPaginationOptions = (req) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
  const skip = ((page - 1) * limit);

  return {
    page,
    limit,
    skip,
    sort: req.query.sort || { createdAt: -1 }
  };
};

module.exports = {
  connectToDatabase,
  createIndexes,
  optimizeQuery,
  createPaginationOptions,
  databaseConfig
};
