/**
 * Unified LuxGen Backend Configuration
 * Supports both development and production environments
 */

const config = {
  // Environment
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT) || 3000,
  host: process.env.HOST || '0.0.0.0',

  // Database Configuration
  database: {
    // MongoDB Atlas (Production)
    uri: process.env.MONGODB_URI || process.env.MONGODB_ATLAS_URI,
    atlasUri: process.env.MONGODB_ATLAS_URI,
    
    // Local MongoDB (Development)
    local: {
      host: process.env.LOCAL_MONGODB_HOST || 'localhost',
      port: parseInt(process.env.LOCAL_MONGODB_PORT) || 27017,
      database: process.env.LOCAL_MONGODB_DATABASE || 'luxgen'
    },
    
    // Connection Options
    options: {
      maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE) || 10,
      minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE) || 2,
      maxIdleTimeMS: parseInt(process.env.MONGODB_MAX_IDLE_TIME) || 30000,
      serverSelectionTimeoutMS: parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT) || 5000,
      connectTimeoutMS: parseInt(process.env.MONGODB_CONNECT_TIMEOUT) || 10000,
      socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT) || 45000,
      retryWrites: true,
      w: 'majority',
      readPreference: 'primary'
    }
  },

  // Security
  security: {
    jwtSecret: process.env.JWT_SECRET || 'your-jwt-secret-key-change-this-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    encryptionKey: process.env.ENCRYPTION_KEY || 'your-encryption-key-change-this-in-production',
    sessionSecret: process.env.SESSION_SECRET || 'your-session-secret-change-this-in-production'
  },

  // CORS Configuration
  cors: {
    origins: process.env.CORS_ORIGINS ? 
      process.env.CORS_ORIGINS.split(',').map(o => o.trim()) : 
      [
        'http://localhost:3000',
        'https://luxgen-lac.vercel.app',
        'https://luxgen-frontend.vercel.app',
        'https://luxgen-multi-tenant.vercel.app',
        'https://demo.luxgen.com',
        'https://luxgen.com'
      ],
    credentials: process.env.CORS_CREDENTIALS === 'true',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Tenant-ID', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID', 'X-Response-Time', 'X-Rate-Limit-Remaining'],
    maxAge: 86400 // 24 hours
  },

  // Features
  features: {
    tenantIsolation: process.env.ENABLE_TENANT_ISOLATION === 'true',
    analytics: process.env.ENABLE_ANALYTICS === 'true',
    notifications: process.env.ENABLE_NOTIFICATIONS === 'true',
    rateLimiting: process.env.ENABLE_RATE_LIMITING === 'true',
    securityHeaders: process.env.ENABLE_SECURITY_HEADERS === 'true',
    monitoring: process.env.ENABLE_MONITORING === 'true'
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    skipSuccessfulRequests: process.env.RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS === 'true'
  },

  // Upload Configuration
  upload: {
    maxSize: process.env.UPLOAD_MAX_SIZE || '10mb',
    allowedTypes: process.env.UPLOAD_ALLOWED_TYPES ? 
      process.env.UPLOAD_ALLOWED_TYPES.split(',') : 
      ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain']
  },

  // Monitoring
  monitoring: {
    enabled: process.env.ENABLE_MONITORING === 'true',
    port: parseInt(process.env.MONITORING_PORT) || 9090,
    prometheus: {
      enabled: process.env.PROMETHEUS_ENABLED === 'true'
    }
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined',
    enableRequestLogging: process.env.ENABLE_REQUEST_LOGGING === 'true'
  },

  // Default Tenant
  defaultTenant: process.env.DEFAULT_TENANT || 'luxgen',

  // Development Flags
  development: {
    useLocalDb: process.env.USE_LOCAL_DB === 'true',
    enableDebugLogs: process.env.ENABLE_DEBUG_LOGS === 'true',
    skipAuthForDev: process.env.SKIP_AUTH_FOR_DEV === 'true'
  },

  // Environment-specific overrides
  get isDevelopment() {
    return this.env === 'development';
  },

  get isProduction() {
    return this.env === 'production';
  },

  get isTest() {
    return this.env === 'test';
  },

  // Get database URI based on environment
  getDatabaseUri() {
    if (this.development.useLocalDb && this.isDevelopment) {
      return `mongodb://${this.database.local.host}:${this.database.local.port}/${this.database.local.database}`;
    }
    return this.database.uri;
  },

  // Get CORS origins based on environment
  getCorsOrigins() {
    if (this.isDevelopment) {
      return [
        'http://localhost:3000',
        'http://localhost:3001',
        'https://luxgen-lac.vercel.app',
        'https://luxgen-frontend.vercel.app',
        'https://luxgen-multi-tenant.vercel.app',
        'https://demo.luxgen.com',
        'https://luxgen.com'
      ];
    }
    return this.cors.origins;
  }
};

module.exports = config;
