/**
 * Environment Configuration Manager
 * Centralized configuration management with validation and defaults
 */

const Joi = require('joi');

// Environment validation schema
const envSchema = Joi.object({
  // Application
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().port().default(3001),
  APP_NAME: Joi.string().default('Trainer Platform'),
  APP_VERSION: Joi.string().default('1.0.0'),

  // Database
  MONGODB_URL: Joi.string().uri().required(),
  REDIS_URL: Joi.string().uri().default('redis://127.0.0.1:6379'),

  // Authentication
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('24h'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  BCRYPT_ROUNDS: Joi.number().integer().min(10).max(16).default(12),

  // CORS
  CORS_ORIGIN: Joi.string().default('http://localhost:3000'),

  // Email
  SMTP_HOST: Joi.string().default('smtp.gmail.com'),
  SMTP_PORT: Joi.number().port().default(587),
  SMTP_USER: Joi.string().email().optional(),
  SMTP_PASS: Joi.string().optional(),
  EMAIL_FROM: Joi.string().email().default('noreply@trainerplatform.com'),

  // Security
  SESSION_SECRET: Joi.string().min(32).default('your_session_secret_here_2024_change_in_production'),
  ENABLE_CSP: Joi.boolean().default(true),
  ENABLE_HSTS: Joi.boolean().default(true),

  // Rate Limiting
  RATE_LIMIT_WINDOW: Joi.string().default('15m'),
  RATE_LIMIT_MAX_REQUESTS: Joi.number().integer().min(1).default(100),

  // Logging
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
  LOG_FORMAT: Joi.string().valid('json', 'simple').default('json'),

  // Performance
  CACHE_TTL: Joi.number().integer().min(60).default(3600),
  ENABLE_COMPRESSION: Joi.boolean().default(true),

  // Feature Flags
  ENABLE_AI_ASSISTANT: Joi.boolean().default(false),
  ENABLE_REAL_TIME_COLLABORATION: Joi.boolean().default(true),
  ENABLE_ADVANCED_ANALYTICS: Joi.boolean().default(true),
  ENABLE_MULTI_TENANCY: Joi.boolean().default(true),
  ENABLE_SSO: Joi.boolean().default(false),

  // Development
  ENABLE_SWAGGER: Joi.boolean().default(true),
  ENABLE_GRAPHQL_PLAYGROUND: Joi.boolean().default(false),
}).unknown();

class EnvironmentConfig {
  constructor() {
    this.config = this.loadAndValidate();
  }

  loadAndValidate() {
    try {
      const { error, value } = envSchema.validate(process.env, {
        allowUnknown: true,
        stripUnknown: true,
      });

      if (error) {
        console.error('❌ Environment validation failed:', error.details);
        throw new Error(`Environment validation failed: ${error.message}`);
      }

      // Parse CORS origins
      if (value.CORS_ORIGIN) {
        value.CORS_ORIGINS = value.CORS_ORIGIN.split(',').map(origin => origin.trim());
      }

      // Parse rate limit window
      value.RATE_LIMIT_WINDOW_MS = this.parseTimeString(value.RATE_LIMIT_WINDOW);

      console.log('✅ Environment configuration loaded successfully');
      return value;
    } catch (error) {
      console.error('💥 Failed to load environment configuration:', error.message);
      process.exit(1);
    }
  }

  parseTimeString(timeString) {
    const units = {
      's': 1000,
      'm': 60 * 1000,
      'h': 60 * 60 * 1000,
      'd': 24 * 60 * 60 * 1000,
    };

    const match = timeString.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error(`Invalid time string: ${timeString}`);
    }

    const [, value, unit] = match;
    return parseInt(value) * units[unit];
  }

  get(key, defaultValue = undefined) {
    return this.config[key] !== undefined ? this.config[key] : defaultValue;
  }

  isDevelopment() {
    return this.config.NODE_ENV === 'development';
  }

  isProduction() {
    return this.config.NODE_ENV === 'production';
  }

  isTest() {
    return this.config.NODE_ENV === 'test';
  }

  // Database configuration
  getDatabaseConfig() {
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
            deprecationErrors: true,
          }
        }
      },
      redis: {
        url: this.config.REDIS_URL,
        options: {
          socket: {
            connectTimeout: 10000,
            lazyConnect: true
          }
        }
      }
    };
  }

  // JWT configuration
  getJWTConfig() {
    return {
      secret: this.config.JWT_SECRET,
      expiresIn: this.config.JWT_EXPIRES_IN,
      refreshExpiresIn: this.config.JWT_REFRESH_EXPIRES_IN,
      issuer: 'trainer-platform',
      audience: 'trainer-platform-users',
    };
  }

  // CORS configuration
  getCORSConfig() {
    return {
      origin: this.config.CORS_ORIGINS,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'X-Requested-With', 
        'Content-Length', 
        'Accept',
        'X-Tenant-ID',
        'X-Tenant-Slug'
      ]
    };
  }

  // Rate limiting configuration
  getRateLimitConfig() {
    return {
      windowMs: this.config.RATE_LIMIT_WINDOW_MS,
      max: this.config.RATE_LIMIT_MAX_REQUESTS,
      message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: this.config.RATE_LIMIT_WINDOW
      },
      standardHeaders: true,
      legacyHeaders: false,
    };
  }

  // Security configuration
  getSecurityConfig() {
    return {
      helmet: {
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
          },
        },
        crossOriginEmbedderPolicy: false,
        enableCSP: this.config.ENABLE_CSP,
        enableHSTS: this.config.ENABLE_HSTS,
      }
    };
  }

  // Email configuration
  getEmailConfig() {
    return {
      host: this.config.SMTP_HOST,
      port: this.config.SMTP_PORT,
      user: this.config.SMTP_USER,
      pass: this.config.SMTP_PASS,
      from: this.config.EMAIL_FROM,
      secure: this.config.SMTP_PORT === 465,
    };
  }

  // Feature flags
  getFeatureFlags() {
    return {
      aiAssistant: this.config.ENABLE_AI_ASSISTANT,
      realTimeCollaboration: this.config.ENABLE_REAL_TIME_COLLABORATION,
      advancedAnalytics: this.config.ENABLE_ADVANCED_ANALYTICS,
      multiTenancy: this.config.ENABLE_MULTI_TENANCY,
      sso: this.config.ENABLE_SSO,
      swagger: this.config.ENABLE_SWAGGER,
      graphqlPlayground: this.config.ENABLE_GRAPHQL_PLAYGROUND,
    };
  }

  // Logging configuration
  getLoggingConfig() {
    return {
      level: this.config.LOG_LEVEL,
      format: this.config.LOG_FORMAT,
      timestamp: true,
    };
  }

  // Performance configuration
  getPerformanceConfig() {
    return {
      cacheTTL: this.config.CACHE_TTL,
      enableCompression: this.config.ENABLE_COMPRESSION,
      bcryptRounds: this.config.BCRYPT_ROUNDS,
    };
  }

  // Get all configuration
  getAll() {
    return this.config;
  }
}

// Create singleton instance
const environmentConfig = new EnvironmentConfig();

module.exports = environmentConfig; 