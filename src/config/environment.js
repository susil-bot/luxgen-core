/**
 * Environment Configuration Manager
 * Simple configuration management with defaults
 */

class EnvironmentConfig {
  constructor () {
    this.config = this.loadConfiguration();
  }

  loadConfiguration () {
    try {
      
// Load environment variables with defaults
      const config = {
        
// Application
        NODE_ENV: process.env.NODE_ENV || 'development',
        PORT: parseInt(process.env.PORT) || 3001,
        APP_NAME: process.env.APP_NAME || 'Trainer Platform',
        APP_VERSION: process.env.APP_VERSION || '1.0.0',

        
// Database
        MONGODB_URL: process.env.MONGODB_URL || 'mongodb:
//127.0.0.1:27017/luxgen_trainer_platform',
        REDIS_URL: process.env.REDIS_URL || 'redis:
//127.0.0.1:6379',

        
// Authentication
        JWT_SECRET: process.env.JWT_SECRET || 'your_jwt_secret_key_here_change_in_production_min_32_chars',
        JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
        JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
        BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || 12,

        
// CORS
        CORS_ORIGIN: process.env.CORS_ORIGIN || 'http:
//localhost:3000',
        CORS_CREDENTIALS: process.env.CORS_CREDENTIALS !== 'false',

        
// Email
        SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
        SMTP_PORT: parseInt(process.env.SMTP_PORT) || 587,
        SMTP_USER: process.env.SMTP_USER,
        SMTP_PASS: process.env.SMTP_PASS,
        EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@trainerplatform.com',
        EMAIL_PROVIDER: process.env.EMAIL_PROVIDER || 'smtp',

        
// Security
        SESSION_SECRET: process.env.SESSION_SECRET || 'your_session_secret_here_change_in_production_min_32_chars',
        ENABLE_CSP: process.env.ENABLE_CSP !== 'false',
        ENABLE_HSTS: process.env.ENABLE_HSTS !== 'false',
        ENABLE_XSS_PROTECTION: process.env.ENABLE_XSS_PROTECTION !== 'false',
        ENABLE_CONTENT_TYPE_NOSNIFF: process.env.ENABLE_CONTENT_TYPE_NOSNIFF !== 'false',

        
// Rate Limiting
        RATE_LIMIT_WINDOW: process.env.RATE_LIMIT_WINDOW || '15m',
        RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
        RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS: process.env.RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS === 'true',

        
// Logging
        LOG_LEVEL: process.env.LOG_LEVEL || 'info',
        LOG_FORMAT: process.env.LOG_FORMAT || 'json',

        
// Performance
        CACHE_TTL: parseInt(process.env.CACHE_TTL) || 3600,
        CACHE_MAX_SIZE: parseInt(process.env.CACHE_MAX_SIZE) || 1000,
        ENABLE_COMPRESSION: process.env.ENABLE_COMPRESSION !== 'false',
        UPLOAD_MAX_SIZE: process.env.UPLOAD_MAX_SIZE || '50MB',

        
// Feature Flags
        ENABLE_AI_ASSISTANT: process.env.ENABLE_AI_ASSISTANT === 'true',
        ENABLE_REAL_TIME_COLLABORATION: process.env.ENABLE_REAL_TIME_COLLABORATION !== 'false',
        ENABLE_ADVANCED_ANALYTICS: process.env.ENABLE_ADVANCED_ANALYTICS !== 'false',
        ENABLE_MULTI_TENANCY: process.env.ENABLE_MULTI_TENANCY !== 'false',
        ENABLE_SSO: process.env.ENABLE_SSO === 'true',
        ENABLE_SWAGGER: process.env.ENABLE_SWAGGER !== 'false',
        ENABLE_GRAPHQL_PLAYGROUND: process.env.ENABLE_GRAPHQL_PLAYGROUND === 'true',

        
// Redis Connection Pool
        REDIS_POOL_MIN: parseInt(process.env.REDIS_POOL_MIN) || 2,
        REDIS_POOL_MAX: parseInt(process.env.REDIS_POOL_MAX) || 10,
        REDIS_POOL_ACQUIRE: parseInt(process.env.REDIS_POOL_ACQUIRE) || 30000,
        REDIS_POOL_IDLE: parseInt(process.env.REDIS_POOL_IDLE) || 10000,

        
// AI Assistant Configuration
        AI_PROVIDER: process.env.AI_PROVIDER || 'openai',
        OPENAI_API_KEY: process.env.OPENAI_API_KEY,

        
// Storage
        STORAGE_PROVIDER: process.env.STORAGE_PROVIDER || 'local',
        STORAGE_PATH: process.env.STORAGE_PATH || './uploads',

        
// Session Management
        SESSION_STORE: process.env.SESSION_STORE || 'redis',
        SESSION_TTL: parseInt(process.env.SESSION_TTL) || 86400,

        
// Redis Configuration
        REDIS_HOST: process.env.REDIS_HOST || '127.0.0.1',
        REDIS_PORT: parseInt(process.env.REDIS_PORT) || 6379,
        REDIS_PASSWORD: process.env.REDIS_PASSWORD
      };

      
// Parse CORS origins
      if (config.CORS_ORIGIN) {
        config.CORS_ORIGINS = config.CORS_ORIGIN.split(',').map(origin => origin.trim());
      }

      
// Parse rate limit window
      config.RATE_LIMIT_WINDOW_MS = this.parseTimeString(config.RATE_LIMIT_WINDOW);

      
// Add security warnings for development
      if (config.NODE_ENV === 'development') {
        this.checkDevelopmentSecurity(config);
      }

      console.log('✅ Environment configuration loaded successfully');
      return config;
    } catch (error) {
      console.error('💥 Failed to load environment configuration:', error.message);
      process.exit(1);
    }
  }

  checkDevelopmentSecurity (config) {
    const warnings = [];

    if (config.JWT_SECRET.includes('your_jwt_secret_key_here')) {
      warnings.push('⚠️  Using default JWT secret - change in production');
    }

    if (config.SESSION_SECRET.includes('your_session_secret_here')) {
      warnings.push('⚠️  Using default session secret - change in production');
    }

    if (config.MONGODB_URL.includes('127.0.0.1')) {
      warnings.push('⚠️  Using local MongoDB - ensure MongoDB is running locally');
    }

    if (warnings.length > 0) {
      console.log('\n🔒 Development Security Warnings:');
      warnings.forEach(warning => console.log(`   ${warning}`));
      console.log('');
    }
  }

  parseTimeString (timeString) {
    const units = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000
    };

    const match = timeString.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error(`Invalid time string: ${timeString}`);
    }

    const [, value, unit] = match;
    return parseInt(value) * units[unit];
  }

  
// Get configuration value
  get (key, defaultValue = undefined) {
    return this.config[key] !== undefined ? this.config[key] : defaultValue;
  }

  
// Environment checks
  isDevelopment () {
    return this.config.NODE_ENV === 'development';
  }

  isProduction () {
    return this.config.NODE_ENV === 'production';
  }

  isTest () {
    return this.config.NODE_ENV === 'test';
  }

  
// Database configuration
  getDatabaseConfig () {
    return {
      mongodb: {
        url: this.config.MONGODB_URL,
        options: {
          maxPoolSize: 5,
          minPoolSize: 1,
          serverSelectionTimeoutMS: 60000,
          socketTimeoutMS: 60000,
          bufferCommands: false,
          maxIdleTimeMS: 60000,
          retryWrites: true,
          w: 'majority',
          readPreference: 'primary',
          heartbeatFrequencyMS: 30000,
          family: 4,
          connectTimeoutMS: 60000,
          serverApi: {
            version: '1',
            strict: true,
            deprecationErrors: true
          }
        }
      },
      redis: {
        url: this.config.REDIS_URL,
        password: this.config.REDIS_PASSWORD || undefined,
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            return new Error('The server refused the connection');
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            return new Error('Retry time exhausted');
          }
          if (options.attempt > 10) {
            return undefined;
          }
          return Math.min(options.attempt * 100, 3000);
        }
      }
    };
  }

  
// JWT configuration
  getJWTConfig () {
    return {
      secret: this.config.JWT_SECRET,
      expiresIn: this.config.JWT_EXPIRES_IN,
      refreshExpiresIn: this.config.JWT_REFRESH_EXPIRES_IN,
      issuer: 'trainer-platform',
      audience: 'trainer-platform-users'
    };
  }

  
// CORS configuration
  getCORSConfig () {
    return {
      origin: this.config.CORS_ORIGINS || [this.config.CORS_ORIGIN],
      credentials: this.config.CORS_CREDENTIALS,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-Tenant-Slug'
      ],
      exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
      maxAge: 86400
    };
  }

  
// Rate limiting configuration
  getRateLimitConfig () {
    return {
      windowMs: this.config.RATE_LIMIT_WINDOW_MS,
      max: this.config.RATE_LIMIT_MAX_REQUESTS,
      skipSuccessfulRequests: this.config.RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS,
      message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil(this.config.RATE_LIMIT_WINDOW_MS / 1000)
      },
      standardHeaders: true,
      legacyHeaders: false
    };
  }

  
// Security configuration
  getSecurityConfig () {
    return {
      helmet: {
        contentSecurityPolicy: this.config.ENABLE_CSP ? {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"]
          }
        } : false,
        hsts: this.config.ENABLE_HSTS ? {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true
        } : false,
        xssFilter: this.config.ENABLE_XSS_PROTECTION,
        noSniff: this.config.ENABLE_CONTENT_TYPE_NOSNIFF,
        frameguard: { action: 'deny' },
        hidePoweredBy: true,
        ieNoOpen: true,
        noCache: false,
        referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
      }
    };
  }

  
// Email configuration
  getEmailConfig () {
    return {
      provider: this.config.EMAIL_PROVIDER,
      host: this.config.SMTP_HOST,
      port: this.config.SMTP_PORT,
      user: this.config.SMTP_USER,
      pass: this.config.SMTP_PASS,
      from: this.config.EMAIL_FROM,
      secure: this.config.SMTP_PORT === 465
    };
  }

  
// Feature flags
  getFeatureFlags () {
    return {
      aiAssistant: this.config.ENABLE_AI_ASSISTANT,
      realTimeCollaboration: this.config.ENABLE_REAL_TIME_COLLABORATION,
      advancedAnalytics: this.config.ENABLE_ADVANCED_ANALYTICS,
      multiTenancy: this.config.ENABLE_MULTI_TENANCY,
      sso: this.config.ENABLE_SSO,
      swagger: this.config.ENABLE_SWAGGER,
      graphqlPlayground: this.config.ENABLE_GRAPHQL_PLAYGROUND
    };
  }

  
// Logging configuration
  getLoggingConfig () {
    return {
      level: this.config.LOG_LEVEL,
      format: this.config.LOG_FORMAT,
      transports: ['console', 'file'],
      filename: 'logs/app.log',
      maxsize: 5242880, 
// 5MB
      maxFiles: 5
    };
  }

  
// Performance configuration
  getPerformanceConfig () {
    return {
      cacheTTL: this.config.CACHE_TTL,
      cacheMaxSize: this.config.CACHE_MAX_SIZE,
      enableCompression: this.config.ENABLE_COMPRESSION,
      uploadMaxSize: this.config.UPLOAD_MAX_SIZE
    };
  }

  
// Get all configuration
  getAll () {
    return this.config;
  }
}

module.exports = new EnvironmentConfig();
