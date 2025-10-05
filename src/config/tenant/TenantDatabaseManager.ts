/**
 * @fileoverview Tenant Database Manager
 * Comprehensive tenant-specific database management with connection pooling and caching
 * 
 * @module
 */

import mongoose, { Connection, Model, Document } from 'mongoose';
import { EventEmitter } from 'events';
import {
  TenantDatabaseConfig,
  TenantDatabaseStats,
  TenantDatabaseHealth,
  TenantDatabaseModels,
  TenantDatabaseContext,
  TenantDatabaseOperationResult,
  TenantDatabaseInitOptions,
  TenantDatabaseCleanupOptions,
  TenantDatabaseError,
  TenantDatabaseErrorType,
  TenantDatabaseEvent,
  TenantDatabaseEventType,
  TenantDatabaseEventHandler,
  ConnectionState
} from '../../types/tenant/TenantDatabaseTypes';

/**
 * TENANT DATABASE MANAGER
 * Complete database isolation per tenant with connection pooling and caching
 * 
 * Features:
 * - Tenant-specific database connections
 * - Connection pooling and caching
 * - Automatic tenantId injection
 * - Health monitoring and statistics
 * - Event-driven architecture
 * - Error handling and recovery
 */
export class TenantDatabaseManager extends EventEmitter {
  private connections: Map<string, Connection> = new Map();
  private models: Map<string, TenantDatabaseModels> = new Map();
  private baseUri: string;
  private connectionOptions: any;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private eventHandlers: Map<TenantDatabaseEventType, TenantDatabaseEventHandler[]> = new Map();

  constructor() {
    super();
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
    
    this.setupEventHandlers();
    this.startHealthCheckInterval();
  }

  /**
   * Get tenant-specific database name
   * Format: tenant_{tenantId}
   * 
   * @param tenantId - The tenant identifier
   * @returns Database name for the tenant
   */
  getTenantDatabaseName(tenantId: string): string {
    return `tenant_${tenantId}`;
  }

  /**
   * Get tenant-specific MongoDB URI
   * 
   * @param tenantId - The tenant identifier
   * @returns MongoDB URI for the tenant database
   */
  getTenantDatabaseUri(tenantId: string): string {
    const dbName = this.getTenantDatabaseName(tenantId);
    return `${this.baseUri}/${dbName}`;
  }

  /**
   * Get tenant database configuration
   * 
   * @param tenantId - The tenant identifier
   * @returns Tenant database configuration
   */
  getTenantDatabaseConfig(tenantId: string): TenantDatabaseConfig {
    return {
      tenantId,
      databaseName: this.getTenantDatabaseName(tenantId),
      uri: this.getTenantDatabaseUri(tenantId),
      connectionOptions: this.connectionOptions
    };
  }

  /**
   * Connect to tenant-specific database with connection pooling
   * 
   * @param tenantId - The tenant identifier
   * @returns Promise resolving to the database connection
   */
  async connectToTenantDatabase(tenantId: string): Promise<Connection> {
    try {
      // Check if already connected
      if (this.connections.has(tenantId)) {
        const connection = this.connections.get(tenantId)!;
        if (connection.readyState === ConnectionState.CONNECTED) {
          this.emitEvent(TenantDatabaseEventType.CONNECTED, tenantId);
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
      
      this.emitEvent(TenantDatabaseEventType.CONNECTED, tenantId, { databaseName: dbName });
      console.log(`✅ Connected to tenant database: ${dbName}`);
      
      return connection;
    } catch (error) {
      const tenantError = this.createTenantDatabaseError(
        TenantDatabaseErrorType.CONNECTION_FAILED,
        tenantId,
        'connectToTenantDatabase',
        error as Error
      );
      
      this.emitEvent(TenantDatabaseEventType.ERROR, tenantId, { error: tenantError });
      console.error(`❌ Failed to connect to tenant database for ${tenantId}:`, error);
      throw tenantError;
    }
  }

  /**
   * Get tenant database connection
   * 
   * @param tenantId - The tenant identifier
   * @returns Database connection or undefined if not found
   */
  getTenantConnection(tenantId: string): Connection | undefined {
    return this.connections.get(tenantId);
  }

  /**
   * Create tenant-specific models with automatic tenantId injection
   * 
   * @param tenantId - The tenant identifier
   * @returns Tenant-specific models
   */
  createTenantModels(tenantId: string): TenantDatabaseModels {
    const connection = this.getTenantConnection(tenantId);
    if (!connection) {
      throw this.createTenantDatabaseError(
        TenantDatabaseErrorType.CONNECTION_FAILED,
        tenantId,
        'createTenantModels',
        new Error('No connection found for tenant')
      );
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
    const models: TenantDatabaseModels = {
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
   * 
   * @param tenantId - The tenant identifier
   * @param options - Initialization options
   * @returns Promise resolving to initialization result
   */
  async initializeTenantDatabase(
    tenantId: string, 
    options: TenantDatabaseInitOptions = {}
  ): Promise<TenantDatabaseOperationResult> {
    try {
      this.emitEvent(TenantDatabaseEventType.OPERATION_START, tenantId, { operation: 'initialize' });
      
      const connection = await this.connectToTenantDatabase(tenantId);
      const models = this.createTenantModels(tenantId);

      // Create indexes for performance if requested
      if (options.createIndexes !== false) {
        await models.User.createIndexes();
        await models.Poll.createIndexes();
        await models.Activity.createIndexes();
        await models.Job.createIndexes();
      }

      // Validate connection if requested
      if (options.validateConnection !== false) {
        await connection.db.admin().ping();
      }

      this.emitEvent(TenantDatabaseEventType.OPERATION_COMPLETE, tenantId, { operation: 'initialize' });
      console.log(`✅ Initialized database for tenant: ${tenantId}`);
      
      return {
        success: true,
        data: { connection, models },
        tenantId,
        operation: 'initialize',
        timestamp: new Date()
      };
    } catch (error) {
      const tenantError = this.createTenantDatabaseError(
        TenantDatabaseErrorType.OPERATION_FAILED,
        tenantId,
        'initializeTenantDatabase',
        error as Error
      );
      
      this.emitEvent(TenantDatabaseEventType.ERROR, tenantId, { error: tenantError });
      console.error(`❌ Failed to initialize database for tenant ${tenantId}:`, error);
      
      return {
        success: false,
        error: tenantError.message,
        tenantId,
        operation: 'initialize',
        timestamp: new Date()
      };
    }
  }

  /**
   * Get tenant-specific models
   * 
   * @param tenantId - The tenant identifier
   * @returns Tenant-specific models
   */
  getTenantModels(tenantId: string): TenantDatabaseModels {
    if (this.models.has(tenantId)) {
      return this.models.get(tenantId)!;
    }
    
    // Initialize if not exists
    return this.createTenantModels(tenantId);
  }

  /**
   * Close tenant database connection
   * 
   * @param tenantId - The tenant identifier
   * @param options - Cleanup options
   * @returns Promise resolving to cleanup result
   */
  async closeTenantConnection(
    tenantId: string, 
    options: TenantDatabaseCleanupOptions = {}
  ): Promise<TenantDatabaseOperationResult> {
    try {
      const connection = this.connections.get(tenantId);
      if (connection) {
        if (options.closeConnections !== false) {
          await connection.close();
        }
        
        if (options.removeFromCache !== false) {
          this.connections.delete(tenantId);
          this.models.delete(tenantId);
        }
        
        this.emitEvent(TenantDatabaseEventType.DISCONNECTED, tenantId);
        console.log(`✅ Closed connection for tenant: ${tenantId}`);
      }
      
      return {
        success: true,
        tenantId,
        operation: 'closeConnection',
        timestamp: new Date()
      };
    } catch (error) {
      const tenantError = this.createTenantDatabaseError(
        TenantDatabaseErrorType.OPERATION_FAILED,
        tenantId,
        'closeTenantConnection',
        error as Error
      );
      
      console.error(`❌ Failed to close connection for tenant ${tenantId}:`, error);
      
      return {
        success: false,
        error: tenantError.message,
        tenantId,
        operation: 'closeConnection',
        timestamp: new Date()
      };
    }
  }

  /**
   * Close all tenant connections
   * 
   * @returns Promise resolving to cleanup result
   */
  async closeAllConnections(): Promise<TenantDatabaseOperationResult> {
    try {
      const closePromises = Array.from(this.connections.keys()).map(tenantId => 
        this.closeTenantConnection(tenantId)
      );
      await Promise.all(closePromises);
      console.log('✅ All tenant connections closed');
      
      return {
        success: true,
        tenantId: 'all',
        operation: 'closeAllConnections',
        timestamp: new Date()
      };
    } catch (error) {
      console.error('❌ Failed to close all connections:', error);
      
      return {
        success: false,
        error: (error as Error).message,
        tenantId: 'all',
        operation: 'closeAllConnections',
        timestamp: new Date()
      };
    }
  }

  /**
   * Get tenant database statistics
   * 
   * @param tenantId - The tenant identifier
   * @returns Promise resolving to database statistics
   */
  async getTenantDatabaseStats(tenantId: string): Promise<TenantDatabaseStats> {
    try {
      const connection = this.getTenantConnection(tenantId);
      if (!connection) {
        throw this.createTenantDatabaseError(
          TenantDatabaseErrorType.CONNECTION_FAILED,
          tenantId,
          'getTenantDatabaseStats',
          new Error('No connection found for tenant')
        );
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
        connectionState: connection.readyState as ConnectionState,
        lastAccessed: new Date()
      };
    } catch (error) {
      const tenantError = this.createTenantDatabaseError(
        TenantDatabaseErrorType.OPERATION_FAILED,
        tenantId,
        'getTenantDatabaseStats',
        error as Error
      );
      
      console.error(`❌ Failed to get stats for tenant ${tenantId}:`, error);
      throw tenantError;
    }
  }

  /**
   * Health check for tenant database
   * 
   * @param tenantId - The tenant identifier
   * @returns Promise resolving to health status
   */
  async healthCheck(tenantId: string): Promise<TenantDatabaseHealth> {
    try {
      const connection = this.getTenantConnection(tenantId);
      if (!connection) {
        return {
          healthy: false,
          tenantId,
          databaseName: this.getTenantDatabaseName(tenantId),
          connectionState: ConnectionState.DISCONNECTED,
          error: 'No connection found',
          lastChecked: new Date()
        };
      }

      const startTime = Date.now();
      const db = connection.db;
      await db.admin().ping();
      const responseTime = Date.now() - startTime;
      
      return {
        healthy: true,
        tenantId,
        databaseName: this.getTenantDatabaseName(tenantId),
        connectionState: connection.readyState as ConnectionState,
        lastChecked: new Date(),
        responseTime
      };
    } catch (error) {
      return {
        healthy: false,
        tenantId,
        databaseName: this.getTenantDatabaseName(tenantId),
        connectionState: ConnectionState.DISCONNECTED,
        error: (error as Error).message,
        lastChecked: new Date()
      };
    }
  }

  /**
   * Get all active tenant connections
   * 
   * @returns Array of active connection information
   */
  getActiveConnections(): Array<{ tenantId: string; databaseName: string; connectionState: ConnectionState }> {
    const activeConnections: Array<{ tenantId: string; databaseName: string; connectionState: ConnectionState }> = [];
    
    for (const [tenantId, connection] of this.connections) {
      if (connection.readyState === ConnectionState.CONNECTED) {
        activeConnections.push({
          tenantId,
          databaseName: this.getTenantDatabaseName(tenantId),
          connectionState: connection.readyState as ConnectionState
        });
      }
    }
    
    return activeConnections;
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    // Setup default event handlers
    this.on(TenantDatabaseEventType.ERROR, (event) => {
      console.error(`Tenant Database Error [${event.tenantId}]:`, event.error);
    });
  }

  /**
   * Start health check interval
   */
  private startHealthCheckInterval(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    this.healthCheckInterval = setInterval(async () => {
      const activeConnections = this.getActiveConnections();
      for (const connection of activeConnections) {
        const health = await this.healthCheck(connection.tenantId);
        this.emitEvent(TenantDatabaseEventType.HEALTH_CHECK, connection.tenantId, { health });
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Emit tenant database event
   */
  private emitEvent(type: TenantDatabaseEventType, tenantId: string, data?: any): void {
    const event: TenantDatabaseEvent = {
      type,
      tenantId,
      timestamp: new Date(),
      data
    };
    
    this.emit(type, event);
  }

  /**
   * Create tenant database error
   */
  private createTenantDatabaseError(
    type: TenantDatabaseErrorType,
    tenantId: string,
    operation: string,
    originalError: Error
  ): TenantDatabaseError {
    const error = new Error(originalError.message) as TenantDatabaseError;
    error.type = type;
    error.tenantId = tenantId;
    error.operation = operation;
    error.timestamp = new Date();
    error.retryable = type === TenantDatabaseErrorType.CONNECTION_FAILED;
    
    return error;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    await this.closeAllConnections();
    this.removeAllListeners();
  }
}

// Create singleton instance
export const tenantDatabaseManager = new TenantDatabaseManager();
