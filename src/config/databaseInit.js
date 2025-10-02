const { getDatabase, getCollection } = require('./mongodb');
const logger = require('../utils/logger');

/**
 * Database initialization service for MongoDB Atlas
 * Creates collections, indexes, and initial data
 */
class DatabaseInitializer {
  constructor() {
    this.db = null;
    this.collections = {};
  }

  /**
   * Initialize the database with all required collections and indexes
   */
  async initialize() {
    try {
      logger.info('Starting database initialization...');
      
      // Get database connection
      this.db = getDatabase();
      
      // Create collections
      await this.createCollections();
      
      // Create indexes
      await this.createIndexes();
      
      // Create initial data
      await this.createInitialData();
      
      logger.info('Database initialization completed successfully');
      return true;
    } catch (error) {
      logger.error('Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * Create all required collections
   */
  async createCollections() {
    logger.info('Creating collections...');
    
    const collections = [
      'users',
      'tenants', 
      'sessions',
      'groups',
      'polls',
      'notifications',
      'audit_logs',
      'training_sessions',
      'training_courses',
      'training_modules',
      'training_assessments',
      'presentations',
      'tenant_schemas',
      'tenant_configs',
      'tenant_styling'
    ];

    for (const collectionName of collections) {
      try {
        const collection = this.db.collection(collectionName);
        await collection.createIndex({ _id: 1 }); // Ensure collection exists
        this.collections[collectionName] = collection;
        logger.info(`Collection '${collectionName}' created/verified`);
      } catch (error) {
        logger.warn(`Collection '${collectionName}' creation failed:`, error.message);
      }
    }
  }

  /**
   * Create database indexes for performance
   */
  async createIndexes() {
    logger.info('Creating database indexes...');

    const indexConfigs = {
      users: [
        { email: 1, tenantId: 1 },
        { tenantId: 1, role: 1 },
        { tenantId: 1, status: 1 },
        { createdAt: -1 },
        { email: 1 },
        { username: 1, tenantId: 1 }
      ],
      tenants: [
        { name: 1 },
        { subdomain: 1 },
        { status: 1 },
        { createdAt: -1 },
        { ownerId: 1 }
      ],
      sessions: [
        { userId: 1, tenantId: 1 },
        { token: 1 },
        { expiresAt: 1 },
        { createdAt: -1 }
      ],
      groups: [
        { tenantId: 1, name: 1 },
        { tenantId: 1, status: 1 },
        { createdBy: 1, tenantId: 1 },
        { createdAt: -1 }
      ],
      polls: [
        { tenantId: 1, status: 1 },
        { createdBy: 1, tenantId: 1 },
        { createdAt: -1 },
        { groupId: 1, tenantId: 1 }
      ],
      training_sessions: [
        { tenantId: 1, scheduledAt: 1 },
        { tenantId: 1, status: 1 },
        { trainerId: 1, tenantId: 1 },
        { participants: 1, tenantId: 1 },
        { createdAt: -1 }
      ],
      training_courses: [
        { tenantId: 1, status: 1 },
        { instructorId: 1, tenantId: 1 },
        { category: 1, tenantId: 1 },
        { tags: 1, tenantId: 1 },
        { createdAt: -1 }
      ],
      presentations: [
        { tenantId: 1, status: 1 },
        { createdBy: 1, tenantId: 1 },
        { tags: 1, tenantId: 1 },
        { createdAt: -1 }
      ],
      audit_logs: [
        { tenantId: 1, createdAt: -1 },
        { userId: 1, tenantId: 1 },
        { action: 1, tenantId: 1 },
        { createdAt: -1 }
      ],
      notifications: [
        { userId: 1, tenantId: 1 },
        { tenantId: 1, type: 1 },
        { tenantId: 1, status: 1 },
        { createdAt: -1 }
      ]
    };

    for (const [collectionName, indexes] of Object.entries(indexConfigs)) {
      try {
        const collection = this.collections[collectionName];
        if (collection) {
          for (const index of indexes) {
            await collection.createIndex(index);
          }
          logger.info(`Indexes created for '${collectionName}'`);
        }
      } catch (error) {
        logger.warn(`Index creation failed for '${collectionName}':`, error.message);
      }
    }
  }

  /**
   * Create initial data for the system
   */
  async createInitialData() {
    logger.info('Creating initial data...');

    try {
      // Create default tenant if none exists
      await this.createDefaultTenant();
      
      // Create admin user if none exists
      await this.createAdminUser();
      
      logger.info('Initial data created successfully');
    } catch (error) {
      logger.warn('Initial data creation failed:', error.message);
    }
  }

  /**
   * Create default tenant with configurable settings
   * 
   * Creates a default tenant using environment variables for configuration.
   * This ensures the system has at least one tenant for initial setup
   * and testing, with customizable settings.
   */
  async createDefaultTenant() {
    try {
      const tenantsCollection = this.collections.tenants;
      const defaultTenantName = process.env.DEFAULT_TENANT_NAME || 'Default Tenant';
      
      const existingTenant = await tenantsCollection.findOne({ name: defaultTenantName });
      
      if (!existingTenant) {
        const defaultTenant = {
          name: defaultTenantName,
          subdomain: process.env.DEFAULT_TENANT_SUBDOMAIN || 'default',
          description: process.env.DEFAULT_TENANT_DESCRIPTION || 'Default tenant for the LuxGen Trainer Platform',
          status: 'active',
          settings: {
            theme: process.env.DEFAULT_TENANT_THEME || 'default',
            features: {
              aiAssistant: process.env.DEFAULT_FEATURE_AI_ASSISTANT === 'true',
              realTimeCollaboration: process.env.DEFAULT_FEATURE_REAL_TIME === 'true',
              advancedAnalytics: process.env.DEFAULT_FEATURE_ANALYTICS === 'true',
              multiTenancy: process.env.DEFAULT_FEATURE_MULTI_TENANCY === 'true'
            }
          },
          limits: {
            maxUsers: parseInt(process.env.DEFAULT_MAX_USERS) || 100,
            maxStorage: parseInt(process.env.DEFAULT_MAX_STORAGE) || 1024,
            maxSessions: parseInt(process.env.DEFAULT_MAX_SESSIONS) || 50
          },
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const result = await tenantsCollection.insertOne(defaultTenant);
        logger.info(`Default tenant created with ID: ${result.insertedId}`);
      } else {
        logger.info('Default tenant already exists');
      }
    } catch (error) {
      logger.error('Failed to create default tenant:', error);
    }
  }

  /**
   * Create admin user with configurable credentials
   * 
   * Creates a default admin user using environment variables for credentials
   * and settings. This ensures the system has an admin user for initial
   * setup and testing, with secure default credentials.
   */
  async createAdminUser() {
    try {
      const usersCollection = this.collections.users;
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@luxgen.com';
      
      const existingAdmin = await usersCollection.findOne({ email: adminEmail });
      
      if (!existingAdmin) {
        const bcrypt = require('bcryptjs');
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
        const bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        const hashedPassword = await bcrypt.hash(adminPassword, bcryptRounds);

        const adminUser = {
          email: adminEmail,
          username: process.env.ADMIN_USERNAME || 'admin',
          password: hashedPassword,
          firstName: process.env.ADMIN_FIRST_NAME || 'Admin',
          lastName: process.env.ADMIN_LAST_NAME || 'User',
          role: 'admin',
          status: 'active',
          tenantId: null, // Global admin
          profile: {
            avatar: null,
            bio: process.env.ADMIN_BIO || 'System Administrator',
            preferences: {
              theme: process.env.ADMIN_THEME || 'light',
              notifications: process.env.ADMIN_NOTIFICATIONS === 'true',
              language: process.env.ADMIN_LANGUAGE || 'en'
            }
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLogin: null
        };

        const result = await usersCollection.insertOne(adminUser);
        logger.info(`Admin user created with ID: ${result.insertedId}`);
        
        // Only log credentials in development mode for security
        if (process.env.NODE_ENV === 'development') {
          logger.info(`Admin credentials: ${adminEmail} / ${adminPassword}`);
        } else {
          logger.info(`Admin user created: ${adminEmail}`);
        }
      } else {
        logger.info('Admin user already exists');
      }
    } catch (error) {
      logger.error('Failed to create admin user:', error);
    }
  }

  /**
   * Get collection by name
   */
  getCollection(collectionName) {
    return this.collections[collectionName];
  }

  /**
   * Get all collections
   */
  getAllCollections() {
    return this.collections;
  }

  /**
   * Check if database is properly initialized
   */
  async isInitialized() {
    try {
      const tenantsCollection = this.collections.tenants;
      const usersCollection = this.collections.users;
      
      const tenantCount = await tenantsCollection.countDocuments();
      const userCount = await usersCollection.countDocuments();
      
      return {
        initialized: tenantCount > 0 && userCount > 0,
        tenantCount,
        userCount,
        collections: Object.keys(this.collections).length
      };
    } catch (error) {
      logger.error('Failed to check initialization status:', error);
      return { initialized: false, error: error.message };
    }
  }
}

/**
 * Create and export database initializer instance
 */
function createDatabaseInitializer() {
  return new DatabaseInitializer();
}

module.exports = {
  createDatabaseInitializer,
  DatabaseInitializer
};