/**
 * PRODUCTION CONFIGURATION
 * Comprehensive production-ready configuration for LuxGen Backend
 * Includes security, monitoring, multi-tenancy, and performance optimizations
 */

const path = require('path');
const fs = require('fs');

class ProductionConfig {
  constructor() {
    this.config = this.loadProductionConfiguration();
    this.validateConfiguration();
  }

  loadProductionConfiguration() {
    return {
      // Application Configuration
      app: {
        name: process.env.APP_NAME || 'LuxGen Backend',
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'production',
        port: parseInt(process.env.PORT) || 3000,
        host: process.env.HOST || '0.0.0.0',
        timezone: process.env.TZ || 'UTC',
        locale: process.env.LOCALE || 'en-US'
      },

      // Database Configuration
      database: {
        mongodb: {
          uri: process.env.MONGODB_URI || process.env.MONGODB_ATLAS_URI,
          options: {
            maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE) || 10,
            minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE) || 2,
            maxIdleTimeMS: parseInt(process.env.MONGODB_MAX_IDLE_TIME) || 30000,
            serverSelectionTimeoutMS: parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT) || 5000,
            connectTimeoutMS: parseInt(process.env.MONGODB_CONNECT_TIMEOUT) || 10000,
            socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT) || 45000,
            retryWrites: true,
            w: 'majority',
            readPreference: 'primary',
            maxStalenessSeconds: 90
          }
        },
        redis: {
          url: process.env.REDIS_URL || 'redis://localhost:6379',
          options: {
            maxRetriesPerRequest: 3,
            retryDelayOnFailover: 100,
            enableReadyCheck: true,
            maxRetriesPerRequest: 3,
            lazyConnect: true
          }
        }
      },

      // Security Configuration
      security: {
        jwt: {
          secret: process.env.JWT_SECRET,
          expiresIn: process.env.JWT_EXPIRES_IN || '24h',
          refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
          issuer: process.env.JWT_ISSUER || 'luxgen',
          audience: process.env.JWT_AUDIENCE || 'luxgen-users',
          algorithm: 'HS256'
        },
        bcrypt: {
          rounds: parseInt(process.env.BCRYPT_ROUNDS) || 12
        },
        session: {
          secret: process.env.SESSION_SECRET,
          name: 'luxgen.sid',
          resave: false,
          saveUninitialized: false,
          cookie: {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
            sameSite: 'strict'
          }
        },
        cors: {
          origin: this.parseCorsOrigins(process.env.CORS_ORIGINS),
          credentials: process.env.CORS_CREDENTIALS === 'true',
          methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
          allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Tenant-ID', 'X-Request-ID'],
          exposedHeaders: ['X-Request-ID', 'X-Response-Time', 'X-Rate-Limit-Remaining']
        },
        rateLimit: {
          windowMs: this.parseTimeToMs(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
          max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
          message: 'Too many requests from this IP, please try again later.',
          standardHeaders: true,
          legacyHeaders: false,
          skipSuccessfulRequests: false
        },
        helmet: {
          contentSecurityPolicy: {
            directives: {
              defaultSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              scriptSrc: ["'self'"],
              imgSrc: ["'self'", "data:", "https:"],
              connectSrc: ["'self'"],
              fontSrc: ["'self'"],
              objectSrc: ["'none'"],
              mediaSrc: ["'self'"],
              frameSrc: ["'none'"]
            }
          },
          hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
          }
        }
      },

      // Multi-Tenancy Configuration
      multiTenancy: {
        enabled: process.env.MULTI_TENANCY_ENABLED !== 'false',
        defaultTenant: process.env.DEFAULT_TENANT || 'luxgen',
        tenantIdentification: {
          methods: ['subdomain', 'header', 'query', 'domain'],
          headerName: 'X-Tenant-ID',
          queryParam: 'tenant',
          subdomainPrefix: process.env.TENANT_SUBDOMAIN_PREFIX || ''
        },
        database: {
          strategy: process.env.TENANT_DB_STRATEGY || 'database-per-tenant', // 'database-per-tenant' | 'schema-per-tenant' | 'shared-database'
          prefix: process.env.TENANT_DB_PREFIX || 'luxgen_tenant_',
          maxConnectionsPerTenant: parseInt(process.env.TENANT_MAX_CONNECTIONS) || 5
        },
        isolation: {
          enforceDataIsolation: true,
          allowCrossTenantQueries: false,
          auditTenantAccess: true
        }
      },

      // Monitoring and Observability
      monitoring: {
        enabled: process.env.MONITORING_ENABLED !== 'false',
        metrics: {
          enabled: process.env.METRICS_ENABLED !== 'false',
          port: parseInt(process.env.METRICS_PORT) || 9090,
          path: process.env.METRICS_PATH || '/metrics'
        },
        logging: {
          level: process.env.LOG_LEVEL || 'info',
          format: process.env.LOG_FORMAT || 'json',
          file: {
            enabled: process.env.LOG_FILE_ENABLED === 'true',
            path: process.env.LOG_FILE_PATH || './logs/app.log',
            maxSize: process.env.LOG_MAX_SIZE || '10m',
            maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5
          },
          console: {
            enabled: process.env.LOG_CONSOLE_ENABLED !== 'false',
            colorize: process.env.NODE_ENV !== 'production'
          }
        },
        healthCheck: {
          enabled: process.env.HEALTH_CHECK_ENABLED !== 'false',
          path: process.env.HEALTH_CHECK_PATH || '/health',
          interval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000,
          timeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT) || 5000
        },
        tracing: {
          enabled: process.env.TRACING_ENABLED === 'true',
          serviceName: process.env.TRACING_SERVICE_NAME || 'luxgen-backend',
          jaegerEndpoint: process.env.JAEGER_ENDPOINT
        }
      },

      // Performance Configuration
      performance: {
        compression: {
          enabled: process.env.COMPRESSION_ENABLED !== 'false',
          level: parseInt(process.env.COMPRESSION_LEVEL) || 6,
          threshold: parseInt(process.env.COMPRESSION_THRESHOLD) || 1024
        },
        caching: {
          enabled: process.env.CACHING_ENABLED !== 'false',
          ttl: parseInt(process.env.CACHE_TTL) || 3600,
          maxSize: parseInt(process.env.CACHE_MAX_SIZE) || 1000,
          strategy: process.env.CACHE_STRATEGY || 'lru'
        },
        clustering: {
          enabled: process.env.CLUSTERING_ENABLED === 'true',
          instances: parseInt(process.env.CLUSTER_INSTANCES) || require('os').cpus().length
        }
      },

      // Email Configuration
      email: {
        provider: process.env.EMAIL_PROVIDER || 'smtp',
        smtp: {
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        },
        from: process.env.EMAIL_FROM || 'noreply@luxgen.com',
        templates: {
          path: process.env.EMAIL_TEMPLATES_PATH || './templates/email'
        }
      },

      // File Upload Configuration
      fileUpload: {
        maxSize: this.parseSizeToBytes(process.env.UPLOAD_MAX_SIZE) || 50 * 1024 * 1024, // 50MB
        allowedTypes: (process.env.UPLOAD_ALLOWED_TYPES || 'image/jpeg,image/png,image/gif,application/pdf').split(','),
        storage: {
          provider: process.env.STORAGE_PROVIDER || 'local',
          local: {
            path: process.env.STORAGE_LOCAL_PATH || './uploads'
          },
          s3: {
            bucket: process.env.S3_BUCKET,
            region: process.env.S3_REGION,
            accessKeyId: process.env.S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
          }
        }
      },

      // API Configuration
      api: {
        version: process.env.API_VERSION || 'v1',
        prefix: process.env.API_PREFIX || '/api',
        timeout: parseInt(process.env.API_TIMEOUT) || 30000,
        pagination: {
          defaultLimit: parseInt(process.env.PAGINATION_DEFAULT_LIMIT) || 20,
          maxLimit: parseInt(process.env.PAGINATION_MAX_LIMIT) || 100
        }
      }
    };
  }

  parseCorsOrigins(origins) {
    if (!origins) return ['http://localhost:3000'];
    return origins.split(',').map(origin => origin.trim());
  }

  parseTimeToMs(timeString) {
    if (!timeString) return null;
    
    const timeUnits = {
      's': 1000,
      'm': 60 * 1000,
      'h': 60 * 60 * 1000,
      'd': 24 * 60 * 60 * 1000
    };

    const match = timeString.match(/^(\d+)([smhd])$/);
    if (match) {
      const [, value, unit] = match;
      return parseInt(value) * timeUnits[unit];
    }
    
    return parseInt(timeString);
  }

  parseSizeToBytes(sizeString) {
    if (!sizeString) return null;
    
    const sizeUnits = {
      'B': 1,
      'KB': 1024,
      'MB': 1024 * 1024,
      'GB': 1024 * 1024 * 1024
    };

    const match = sizeString.match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)$/i);
    if (match) {
      const [, value, unit] = match;
      return parseFloat(value) * sizeUnits[unit.toUpperCase()];
    }
    
    return parseInt(sizeString);
  }

  validateConfiguration() {
    const required = [
      'security.jwt.secret',
      'security.session.secret',
      'database.mongodb.uri'
    ];

    const missing = required.filter(path => {
      const keys = path.split('.');
      let current = this.config;
      for (const key of keys) {
        if (!current || !current[key]) return true;
        current = current[key];
      }
      return false;
    });

    if (missing.length > 0) {
      throw new Error(`Missing required configuration: ${missing.join(', ')}`);
    }

    // Validate MongoDB URI
    if (!this.config.database.mongodb.uri) {
      throw new Error('MongoDB URI is required');
    }

    // Validate JWT secret strength
    if (this.config.security.jwt.secret.length < 32) {
      throw new Error('JWT secret must be at least 32 characters long');
    }

    // Validate environment
    if (this.config.app.environment === 'production') {
      if (this.config.security.cors.origin.includes('localhost')) {
        console.warn('Warning: localhost origins detected in production CORS configuration');
      }
    }
  }

  getConfig() {
    return this.config;
  }

  getConfigByPath(path) {
    const keys = path.split('.');
    let current = this.config;
    for (const key of keys) {
      if (!current || !current[key]) return undefined;
      current = current[key];
    }
    return current;
  }

  isProduction() {
    return this.config.app.environment === 'production';
  }

  isDevelopment() {
    return this.config.app.environment === 'development';
  }
}

module.exports = new ProductionConfig();
