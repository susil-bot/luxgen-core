/**
 * Database Connection Flagging System for LuxGen Platform
 * 
 * HIGH TECHNICAL STANDARDS: Environment-based configuration
 * Following LuxGen rules: Multi-tenant architecture with flexible database connections
 * 
 * Flags:
 * - USE_LOCAL_DB=true: Use local MongoDB (campus development)
 * - MONGODB_URI: Atlas connection string (production)
 * - DATABASE_MODE: local|atlas|hybrid
 * - TENANT_ISOLATION: strict|relaxed
 */

class DatabaseFlags {
  constructor() {
    this.flags = this.loadFlags();
    this.logger = console;
  }

  /**
   * Load database flags from environment and config files
   */
  loadFlags() {
    const defaultFlags = {
      // Connection flags
      USE_LOCAL_DB: process.env.USE_LOCAL_DB === 'true',
      MONGODB_URI: process.env.MONGODB_URI || null,
      DATABASE_MODE: process.env.DATABASE_MODE || 'auto',
      
      // Connection settings
      CONNECTION_TIMEOUT: parseInt(process.env.CONNECTION_TIMEOUT) || 30000,
      SOCKET_TIMEOUT: parseInt(process.env.SOCKET_TIMEOUT) || 30000,
      SERVER_SELECTION_TIMEOUT: parseInt(process.env.SERVER_SELECTION_TIMEOUT) || 30000,
      
      // Multi-tenant settings
      TENANT_ISOLATION: process.env.TENANT_ISOLATION || 'strict',
      MAX_TENANTS: parseInt(process.env.MAX_TENANTS) || 100,
      
      // Development flags
      DEBUG_DATABASE: process.env.DEBUG_DATABASE === 'true',
      VERBOSE_LOGGING: process.env.VERBOSE_LOGGING === 'true',
      SKIP_VALIDATION: process.env.SKIP_VALIDATION === 'true',
      
      // Security flags
      REQUIRE_SSL: process.env.REQUIRE_SSL === 'true',
      AUTH_SOURCE: process.env.AUTH_SOURCE || 'admin',
      
      // Performance flags
      POOL_SIZE: parseInt(process.env.POOL_SIZE) || 10,
      BUFFER_MAX_ENTRIES: parseInt(process.env.BUFFER_MAX_ENTRIES) || 0,
      
      // Backup and migration flags
      ENABLE_BACKUP: process.env.ENABLE_BACKUP === 'true',
      BACKUP_INTERVAL: process.env.BACKUP_INTERVAL || '24h',
      MIGRATION_MODE: process.env.MIGRATION_MODE || 'safe'
    };

    return defaultFlags;
  }

  /**
   * Get the appropriate database connection string
   */
  getConnectionString() {
    if (this.flags.USE_LOCAL_DB) {
      return 'mongodb://localhost:27017/luxgen';
    }
    
    if (this.flags.MONGODB_URI) {
      return this.flags.MONGODB_URI;
    }
    
    throw new Error('No database connection configured. Set USE_LOCAL_DB=true or MONGODB_URI');
  }

  /**
   * Get MongoDB connection options
   */
  getConnectionOptions() {
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: this.flags.SERVER_SELECTION_TIMEOUT,
      connectTimeoutMS: this.flags.CONNECTION_TIMEOUT,
      socketTimeoutMS: this.flags.SOCKET_TIMEOUT,
      
      
    };

    // Add SSL if required
    if (this.flags.REQUIRE_SSL) {
      options.ssl = true;
      options.sslValidate = true;
    }

    // Add auth source if specified
    if (this.flags.AUTH_SOURCE) {
      options.authSource = this.flags.AUTH_SOURCE;
    }

    return options;
  }

  /**
   * Get database mode description
   */
  getDatabaseMode() {
    if (this.flags.USE_LOCAL_DB) {
      return {
        mode: 'local',
        description: 'Local MongoDB (Campus Development)',
        connection: 'mongodb://localhost:27017/luxgen',
        features: ['fast', 'offline', 'development']
      };
    }
    
    if (this.flags.MONGODB_URI) {
      return {
        mode: 'atlas',
        description: 'MongoDB Atlas (Cloud Production)',
        connection: this.flags.MONGODB_URI.replace(/\/\/.*@/, '//***:***@'), // Hide credentials
        features: ['scalable', 'cloud', 'production']
      };
    }
    
    return {
      mode: 'unknown',
      description: 'No database configured',
      connection: 'none',
      features: []
    };
  }

  /**
   * Validate database configuration
   */
  validateConfiguration() {
    const errors = [];
    const warnings = [];

    // Check required flags
    if (!this.flags.USE_LOCAL_DB && !this.flags.MONGODB_URI) {
      errors.push('Either USE_LOCAL_DB=true or MONGODB_URI must be set');
    }

    // Check connection timeouts
    if (this.flags.CONNECTION_TIMEOUT < 5000) {
      warnings.push('Connection timeout is very low, may cause connection issues');
    }

    // Check pool size
    if (this.flags.POOL_SIZE > 100) {
      warnings.push('Pool size is very high, may cause memory issues');
    }

    // Check tenant isolation
    if (this.flags.TENANT_ISOLATION !== 'strict' && this.flags.TENANT_ISOLATION !== 'relaxed') {
      errors.push('TENANT_ISOLATION must be either "strict" or "relaxed"');
    }

    return { errors, warnings };
  }

  /**
   * Display current configuration
   */
  displayConfiguration() {
    const mode = this.getDatabaseMode();
    const validation = this.validateConfiguration();
    
    this.logger.info('🔧 Database Configuration:');
    this.logger.info(`   Mode: ${mode.mode} (${mode.description})`);
    this.logger.info(`   Connection: ${mode.connection}`);
    this.logger.info(`   Features: ${mode.features.join(', ')}`);
    this.logger.info(`   Tenant Isolation: ${this.flags.TENANT_ISOLATION}`);
    this.logger.info(`   Max Tenants: ${this.flags.MAX_TENANTS}`);
    this.logger.info(`   Pool Size: ${this.flags.POOL_SIZE}`);
    this.logger.info(`   Timeout: ${this.flags.CONNECTION_TIMEOUT}ms`);
    
    if (validation.errors.length > 0) {
      this.logger.error('❌ Configuration Errors:');
      validation.errors.forEach(error => this.logger.error(`   ${error}`));
    }
    
    if (validation.warnings.length > 0) {
      this.logger.warn('⚠️  Configuration Warnings:');
      validation.warnings.forEach(warning => this.logger.warn(`   ${warning}`));
    }
    
    if (validation.errors.length === 0 && validation.warnings.length === 0) {
      this.logger.info('✅ Configuration is valid');
    }
  }

  /**
   * Test database connection
   */
  async testConnection() {
    const mongoose = require('mongoose');
    
    try {
      this.logger.info('🧪 Testing database connection...');
      
      const connectionString = this.getConnectionString();
      const options = this.getConnectionOptions();
      
      await mongoose.connect(connectionString, options);
      
      // Test basic operations
      const db = mongoose.connection.db;
      await db.admin().ping();
      
      this.logger.info('✅ Database connection successful');
      
      return true;
    } catch (error) {
      this.logger.error('❌ Database connection failed:', error.message);
      return false;
    } finally {
      if (mongoose.connection.readyState === 1) {
        await mongoose.disconnect();
      }
    }
  }

  /**
   * Get all flags as object
   */
  getAllFlags() {
    return { ...this.flags };
  }

  /**
   * Set a flag value
   */
  setFlag(key, value) {
    this.flags[key] = value;
  }

  /**
   * Get a specific flag value
   */
  getFlag(key) {
    return this.flags[key];
  }
}

module.exports = DatabaseFlags;
