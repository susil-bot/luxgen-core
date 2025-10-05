const mongoose = require('mongoose');

/**
 * TENANT-SPECIFIC DATABASE MANAGER
 * Complete database isolation per tenant with connection pooling and caching
 */

class TenantDatabaseManager {
  constructor() {
    this.connections = new Map(); // Cache tenant connections
    this.models = new Map(); // Cache tenant-specific models
    this.baseUri = process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017';
    this.connectionOptions = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      bufferMaxEntries: 0,
      retryWrites: true,
      retryReads: true
    };
  }

  /**
   * Get tenant-specific database name
   * Format: tenant_{tenantId}
   */
  getTenantDatabaseName(tenantId) {
    return `tenant_${tenantId}`;
  }

  /**
   * Get tenant-specific MongoDB URI
   */
  getTenantDatabaseUri(tenantId) {
    const dbName = this.getTenantDatabaseName(tenantId);
    return `${this.baseUri}/${dbName}`;
  }

  /**
   * Connect to tenant-specific database with connection pooling
   */
  async connectToTenantDatabase(tenantId) {
    try {
      // Check if already connected
      if (this.connections.has(tenantId)) {
        const connection = this.connections.get(tenantId);
        if (connection.readyState === 1) {
          return connection;
        }
      }

      const dbName = this.getTenantDatabaseName(tenantId);
      const connection = await mongoose.createConnection(
        this.getTenantDatabaseUri(tenantId),
        this.connectionOptions
      );

      // Cache the connection
      this.connections.set(tenantId, connection);
      
      console.log(`✅ Connected to tenant database: ${dbName}`);
      return connection;
    } catch (error) {
      console.error(`❌ Failed to connect to tenant database for ${tenantId}:`, error);
      throw error;
    }
  }

  /**
   * Get tenant database connection
   */
  getTenantConnection(tenantId) {
    return this.connections.get(tenantId);
  }

  /**
   * Create tenant-specific models with automatic tenantId injection
   */
  createTenantModels(tenantId) {
    const connection = this.getTenantConnection(tenantId);
    if (!connection) {
      throw new Error(`No connection found for tenant: ${tenantId}`);
    }

    // User Schema with tenant isolation
    const userSchema = new mongoose.Schema({
      tenantId: { 
        type: String, 
        required: true, 
        default: tenantId,
        index: true 
      },
      email: { 
        type: String, 
        required: true, 
        unique: true,
        index: true 
      },
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      role: { 
        type: String, 
        enum: ['user', 'admin', 'super_admin'], 
        default: 'user' 
      },
      isActive: { type: Boolean, default: true },
      lastLogin: Date,
      preferences: mongoose.Schema.Types.Mixed,
      tenantSpecific: mongoose.Schema.Types.Mixed
    }, { 
      timestamps: true,
      toJSON: { virtuals: true },
      toObject: { virtuals: true }
    });

    // Poll Schema with tenant isolation
    const pollSchema = new mongoose.Schema({
      tenantId: { 
        type: String, 
        required: true, 
        default: tenantId,
        index: true 
      },
      title: { type: String, required: true },
      description: String,
      question: { type: String, required: true },
      pollType: { 
        type: String, 
        enum: ['single_choice', 'multiple_choice', 'rating', 'text'], 
        required: true 
      },
      options: [{
        id: String,
        text: String,
        value: mongoose.Schema.Types.Mixed
      }],
      status: { 
        type: String, 
        enum: ['draft', 'active', 'closed'], 
        default: 'draft' 
      },
      createdBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
      },
      settings: {
        isAnonymous: { type: Boolean, default: false },
        allowMultipleResponses: { type: Boolean, default: false },
        showResults: { type: Boolean, default: true },
        maxSelections: { type: Number, default: 1 }
      },
      tenantSpecific: mongoose.Schema.Types.Mixed
    }, { 
      timestamps: true,
      toJSON: { virtuals: true },
      toObject: { virtuals: true }
    });

    // Activity Schema with tenant isolation
    const activitySchema = new mongoose.Schema({
      tenantId: { 
        type: String, 
        required: true, 
        default: tenantId,
        index: true 
      },
      userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
      },
      action: { type: String, required: true },
      resourceType: String,
      resourceId: mongoose.Schema.Types.ObjectId,
      details: mongoose.Schema.Types.Mixed,
      ipAddress: String,
      userAgent: String,
      tenantSpecific: mongoose.Schema.Types.Mixed
    }, { 
      timestamps: true,
      toJSON: { virtuals: true },
      toObject: { virtuals: true }
    });

    // Job Schema with tenant isolation
    const jobSchema = new mongoose.Schema({
      tenantId: { 
        type: String, 
        required: true, 
        default: tenantId,
        index: true 
      },
      title: { type: String, required: true },
      description: String,
      company: String,
      location: String,
      salary: String,
      type: { 
        type: String, 
        enum: ['full-time', 'part-time', 'contract', 'internship'] 
      },
      status: { 
        type: String, 
        enum: ['draft', 'published', 'closed'], 
        default: 'draft' 
      },
      createdBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
      },
      tenantSpecific: mongoose.Schema.Types.Mixed
    }, { 
      timestamps: true,
      toJSON: { virtuals: true },
      toObject: { virtuals: true }
    });

    // Create indexes for performance
    userSchema.index({ tenantId: 1, email: 1 });
    userSchema.index({ tenantId: 1, role: 1 });
    pollSchema.index({ tenantId: 1, status: 1 });
    pollSchema.index({ tenantId: 1, createdBy: 1 });
    activitySchema.index({ tenantId: 1, userId: 1 });
    activitySchema.index({ tenantId: 1, action: 1 });
    jobSchema.index({ tenantId: 1, status: 1 });
    jobSchema.index({ tenantId: 1, createdBy: 1 });

    // Create and return models
    const models = {
      User: connection.model('User', userSchema),
      Poll: connection.model('Poll', pollSchema),
      Activity: connection.model('Activity', activitySchema),
      Job: connection.model('Job', jobSchema)
    };

    // Cache the models
    this.models.set(tenantId, models);
    
    return models;
  }

  /**
   * Initialize tenant database with required collections and indexes
   */
  async initializeTenantDatabase(tenantId) {
    try {
      const connection = await this.connectToTenantDatabase(tenantId);
      const models = this.createTenantModels(tenantId);

      // Create indexes for performance
      await models.User.createIndexes();
      await models.Poll.createIndexes();
      await models.Activity.createIndexes();
      await models.Job.createIndexes();

      console.log(`✅ Initialized database for tenant: ${tenantId}`);
      return { connection, models };
    } catch (error) {
      console.error(`❌ Failed to initialize database for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  /**
   * Get tenant-specific models
   */
  getTenantModels(tenantId) {
    if (this.models.has(tenantId)) {
      return this.models.get(tenantId);
    }
    
    // Initialize if not exists
    return this.createTenantModels(tenantId);
  }

  /**
   * Close tenant database connection
   */
  async closeTenantConnection(tenantId) {
    try {
      const connection = this.connections.get(tenantId);
      if (connection) {
        await connection.close();
        this.connections.delete(tenantId);
        this.models.delete(tenantId);
        console.log(`✅ Closed connection for tenant: ${tenantId}`);
      }
    } catch (error) {
      console.error(`❌ Failed to close connection for tenant ${tenantId}:`, error);
    }
  }

  /**
   * Close all tenant connections
   */
  async closeAllConnections() {
    try {
      const closePromises = Array.from(this.connections.keys()).map(tenantId => 
        this.closeTenantConnection(tenantId)
      );
      await Promise.all(closePromises);
      console.log('✅ All tenant connections closed');
    } catch (error) {
      console.error('❌ Failed to close all connections:', error);
    }
  }

  /**
   * Get tenant database statistics
   */
  async getTenantDatabaseStats(tenantId) {
    try {
      const connection = this.getTenantConnection(tenantId);
      if (!connection) {
        throw new Error(`No connection found for tenant: ${tenantId}`);
      }

      const db = connection.db;
      const stats = await db.stats();
      
      return {
        tenantId,
        databaseName: this.getTenantDatabaseName(tenantId),
        collections: stats.collections,
        dataSize: stats.dataSize,
        storageSize: stats.storageSize,
        indexes: stats.indexes,
        objects: stats.objects,
        connectionState: connection.readyState
      };
    } catch (error) {
      console.error(`❌ Failed to get stats for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  /**
   * List all tenant databases
   */
  async listTenantDatabases() {
    try {
      const adminDb = mongoose.connection.db.admin();
      const databases = await adminDb.listDatabases();
      
      const tenantDatabases = databases.databases.filter(db => 
        db.name.startsWith('tenant_')
      );

      return tenantDatabases.map(db => ({
        name: db.name,
        tenantId: db.name.replace('tenant_', ''),
        size: db.sizeOnDisk
      }));
    } catch (error) {
      console.error('❌ Failed to list tenant databases:', error);
      throw error;
    }
  }

  /**
   * Drop tenant database (for cleanup)
   */
  async dropTenantDatabase(tenantId) {
    try {
      const connection = this.getTenantConnection(tenantId);
      if (connection) {
        await connection.db.dropDatabase();
        await this.closeTenantConnection(tenantId);
        console.log(`✅ Dropped database for tenant: ${tenantId}`);
      }
    } catch (error) {
      console.error(`❌ Failed to drop database for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  /**
   * Health check for tenant database
   */
  async healthCheck(tenantId) {
    try {
      const connection = this.getTenantConnection(tenantId);
      if (!connection) {
        return { healthy: false, error: 'No connection found' };
      }

      const db = connection.db;
      await db.admin().ping();
      
      return {
        healthy: true,
        tenantId,
        databaseName: this.getTenantDatabaseName(tenantId),
        connectionState: connection.readyState
      };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }

  /**
   * Get all active tenant connections
   */
  getActiveConnections() {
    const activeConnections = [];
    for (const [tenantId, connection] of this.connections) {
      if (connection.readyState === 1) {
        activeConnections.push({
          tenantId,
          databaseName: this.getTenantDatabaseName(tenantId),
          connectionState: connection.readyState
        });
      }
    }
    return activeConnections;
  }
}

// Create singleton instance
const tenantDatabaseManager = new TenantDatabaseManager();

module.exports = tenantDatabaseManager;
