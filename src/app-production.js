/**
 * PRODUCTION APPLICATION SETUP
 * Production-ready Express application with comprehensive security, monitoring, and multi-tenancy
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');

// Import production configurations and middleware
const productionConfig = require('./config/production');
const ProductionSecurity = require('./middleware/productionSecurity');
const AdvancedMultiTenancy = require('./middleware/advancedMultiTenancy');
const productionMonitoring = require('./monitoring/productionMonitoring');
const logger = require('./utils/logger');

// Import existing middleware
const errorHandler = require('./middleware/errorHandling');
const requestLogger = require('./middleware/errorHandling').requestLogger;

class ProductionApp {
  constructor() {
    this.app = express();
    this.config = productionConfig.getConfig();
    this.setupApplication();
  }

  /**
   * Setup production application
   */
  setupApplication() {
    this.setupSecurity();
    this.setupMiddleware();
    this.setupDatabase();
    this.setupRoutes();
    this.setupErrorHandling();
    this.setupMonitoring();
  }

  /**
   * Setup security middleware
   */
  setupSecurity() {
    // Security headers
    this.app.use(ProductionSecurity.createSecurityHeaders());
    
    // CORS configuration
    this.app.use(ProductionSecurity.createCorsMiddleware());
    
    // Request sanitization
    this.app.use(ProductionSecurity.sanitizeRequest());
    
    // XSS protection
    this.app.use(ProductionSecurity.preventXSS());
    
    // SQL injection protection
    this.app.use(ProductionSecurity.preventSQLInjection());
    
    // Request size limiting
    this.app.use(ProductionSecurity.limitRequestSize());
    
    // Security audit logging
    this.app.use(ProductionSecurity.auditSecurityEvents());
  }

  /**
   * Setup core middleware
   */
  setupMiddleware() {
    // Trust proxy (for rate limiting and IP detection)
    this.app.set('trust proxy', 1);
    
    // Body parsing
    this.app.use(express.json({ 
      limit: this.config.fileUpload.maxSize,
      verify: (req, res, buf) => {
        // Additional body verification if needed
      }
    }));
    this.app.use(express.urlencoded({ extended: true, limit: this.config.fileUpload.maxSize }));
    
    // Compression
    if (this.config.performance.compression.enabled) {
      this.app.use(compression({
        level: this.config.performance.compression.level,
        threshold: this.config.performance.compression.threshold
      }));
    }
    
    // Session configuration
    this.app.use(session({
      secret: this.config.security.session.secret,
      name: this.config.security.session.name,
      resave: this.config.security.session.resave,
      saveUninitialized: this.config.security.session.saveUninitialized,
      store: MongoStore.create({
        mongoUrl: this.config.database.mongodb.uri,
        touchAfter: 24 * 3600 // lazy session update
      }),
      cookie: this.config.security.session.cookie
    }));
    
    // Request logging
    this.app.use(requestLogger);
    
    // Performance monitoring
    this.app.use((req, res, next) => {
      const startTime = Date.now();
      
      res.on('finish', () => {
        const responseTime = Date.now() - startTime;
        productionMonitoring.recordRequest(req, res, responseTime);
      });
      
      next();
    });
  }

  /**
   * Setup database connections
   */
  setupDatabase() {
    // Main database connection
    mongoose.connect(this.config.database.mongodb.uri, this.config.database.mongodb.options)
      .then(() => {
        logger.info('Main database connected successfully');
      })
      .catch((error) => {
        logger.error('Main database connection failed', { error: error.message });
        process.exit(1);
      });

    // Database connection monitoring
    mongoose.connection.on('error', (error) => {
      logger.error('Database connection error', { error: error.message });
      productionMonitoring.recordError(error, { type: 'database' });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('Database disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('Database reconnected');
    });
  }

  /**
   * Setup routes
   */
  setupRoutes() {
    // Health check routes (no authentication required)
    this.app.get('/health', (req, res) => {
      const health = productionMonitoring.getHealthStatus();
      res.status(health.status === 'healthy' ? 200 : 503).json(health);
    });

    this.app.get('/metrics', (req, res) => {
      if (this.config.monitoring.metrics.enabled) {
        res.json(productionMonitoring.getMetrics());
      } else {
        res.status(404).json({ error: 'Metrics not enabled' });
      }
    });

    // API routes with multi-tenancy
    this.app.use(this.config.api.prefix, [
      // Multi-tenancy middleware
      AdvancedMultiTenancy.identifyTenant(),
      AdvancedMultiTenancy.enforceDataIsolation(),
      AdvancedMultiTenancy.auditTenantAccess(),
      
      // Rate limiting
      ProductionSecurity.createRateLimit(),
      ProductionSecurity.createTenantRateLimit(),
      
      // Resource quotas
      AdvancedMultiTenancy.enforceResourceQuotas(),
      
      // API routes
      require('./routes/index')
    ]);

    // Root route
    this.app.get('/', (req, res) => {
      res.json({
        message: 'LuxGen Backend API',
        version: this.config.app.version,
        environment: this.config.app.environment,
        timestamp: new Date().toISOString(),
        status: 'running'
      });
    });

    // API documentation route
    this.app.get('/docs', (req, res) => {
      res.json({
        message: 'LuxGen API Documentation',
        version: this.config.app.version,
        endpoints: {
          health: '/health',
          metrics: '/metrics',
          api: this.config.api.prefix,
          docs: '/docs'
        },
        documentation: 'https://docs.luxgen.com'
      });
    });
  }

  /**
   * Setup error handling
   */
  setupErrorHandling() {
    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Route ${req.originalUrl} not found`,
        timestamp: new Date().toISOString()
      });
    });

    // Global error handler
    this.app.use((error, req, res, next) => {
      // Record error in monitoring
      productionMonitoring.recordError(error, {
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        tenantId: req.tenantId,
        userId: req.user?.id
      });

      // Use existing error handler
      errorHandler.genericErrorHandler(error, req, res, next);
    });
  }

  /**
   * Setup monitoring
   */
  setupMonitoring() {
    if (this.config.monitoring.enabled) {
      // Start monitoring
      productionMonitoring.startMonitoring();
      
      // Graceful shutdown
      process.on('SIGTERM', () => {
        logger.info('SIGTERM received, shutting down gracefully');
        this.gracefulShutdown();
      });

      process.on('SIGINT', () => {
        logger.info('SIGINT received, shutting down gracefully');
        this.gracefulShutdown();
      });
    }
  }

  /**
   * Graceful shutdown
   */
  gracefulShutdown() {
    logger.info('Starting graceful shutdown...');
    
    // Stop monitoring
    productionMonitoring.stopMonitoring();
    
    // Close database connections
    mongoose.connection.close(() => {
      logger.info('Database connection closed');
    });
    
    // Close server
    if (this.server) {
      this.server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  }

  /**
   * Start the application
   */
  start() {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(this.config.app.port, this.config.app.host, () => {
          logger.info('Production server started', {
            port: this.config.app.port,
            host: this.config.app.host,
            environment: this.config.app.environment,
            version: this.config.app.version
          });
          resolve(this.server);
        });

        this.server.on('error', (error) => {
          logger.error('Server error', { error: error.message });
          reject(error);
        });

      } catch (error) {
        logger.error('Failed to start server', { error: error.message });
        reject(error);
      }
    });
  }

  /**
   * Get application instance
   */
  getApp() {
    return this.app;
  }

  /**
   * Get server instance
   */
  getServer() {
    return this.server;
  }
}

// Create and export production app
const productionApp = new ProductionApp();

module.exports = productionApp;
