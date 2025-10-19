/**
 * PRODUCTION SERVER ENTRY POINT
 * Production-ready server with comprehensive monitoring, security, and multi-tenancy
 */

require('dotenv').config();
const productionApp = require('./app-production');
const logger = require('./utils/logger');
const productionConfig = require('./config/production');

/**
 * Start production server
 */
async function startProductionServer() {
  try {
    logger.info('Starting LuxGen Production Server...', {
      version: productionConfig.getConfig().app.version,
      environment: productionConfig.getConfig().app.environment,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    });

    // Validate environment
    validateEnvironment();

    // Start the application
    const server = await productionApp.start();
    
    logger.info('Production server started successfully', {
      port: productionConfig.getConfig().app.port,
      host: productionConfig.getConfig().app.host,
      pid: process.pid
    });

    // Setup process monitoring
    setupProcessMonitoring();

    return server;

  } catch (error) {
    logger.error('Failed to start production server', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

/**
 * Validate production environment
 */
function validateEnvironment() {
  const config = productionConfig.getConfig();
  const required = [
    'MONGODB_URI',
    'JWT_SECRET',
    'SESSION_SECRET'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate JWT secret strength
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }

  // Validate MongoDB URI
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required');
  }

  // Production-specific validations
  if (config.app.environment === 'production') {
    if (process.env.NODE_ENV !== 'production') {
      logger.warn('NODE_ENV is not set to production');
    }

    if (config.security.cors.origin.includes('localhost')) {
      logger.warn('localhost origins detected in production CORS configuration');
    }
  }

  logger.info('Environment validation passed');
}

/**
 * Setup process monitoring
 */
function setupProcessMonitoring() {
  // Monitor uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    // Graceful shutdown
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });

  // Monitor unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', {
      reason: reason?.message || reason,
      stack: reason?.stack,
      promise: promise,
      timestamp: new Date().toISOString()
    });
    
    // Graceful shutdown
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });

  // Monitor memory usage
  setInterval(() => {
    const memUsage = process.memoryUsage();
    const memUsageMB = {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024)
    };

    if (memUsageMB.heapUsed > 500) { // 500MB threshold
      logger.warn('High memory usage detected', memUsageMB);
    }
  }, 60000); // Check every minute

  logger.info('Process monitoring setup complete');
}

/**
 * Start server if this file is run directly
 */
if (require.main === module) {
  startProductionServer()
    .then(() => {
      logger.info('Production server is running');
    })
    .catch((error) => {
      logger.error('Production server failed to start', {
        error: error.message
      });
      process.exit(1);
    });
}

module.exports = { startProductionServer };
