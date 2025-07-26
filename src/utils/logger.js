const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    if (stack) {
      log += `\n${stack}`;
    }
    
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    
    if (stack) {
      log += `\n${stack}`;
    }
    
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'trainer-platform-backend',
    version: '1.0.0',
  },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: consoleFormat,
      level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
    }),
    
    // File transport for all logs
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true,
    }),
    
    // Error file transport
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true,
    }),
    
    // Access log transport
    new winston.transports.File({
      filename: path.join(logsDir, 'access.log'),
      level: 'info',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true,
    }),
  ],
});

// Add request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request
  logger.info('HTTP Request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    tenantId: req.tenantId || req.user?.tenant_id,
    requestId: req.headers['x-request-id'],
  });
  
  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - start;
    
    logger.info('HTTP Response', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length'),
      userId: req.user?.id,
      tenantId: req.tenantId || req.user?.tenant_id,
      requestId: req.headers['x-request-id'],
    });
    
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

// Database logging
const dbLogger = {
  query: (query, params, duration) => {
    logger.debug('Database Query', {
      query: query.replace(/\s+/g, ' ').trim(),
      params: params || [],
      duration: `${duration}ms`,
    });
  },
  
  error: (error, query, params) => {
    logger.error('Database Error', {
      error: error.message,
      stack: error.stack,
      query: query?.replace(/\s+/g, ' ').trim(),
      params: params || [],
    });
  },
  
  connection: (status, details) => {
    logger.info('Database Connection', {
      status,
      details,
    });
  },
};

// Authentication logging
const authLogger = {
  login: (email, success, details) => {
    logger.info('Authentication Login', {
      email,
      success,
      details,
      ip: details?.ip,
      userAgent: details?.userAgent,
    });
  },
  
  logout: (userId, details) => {
    logger.info('Authentication Logout', {
      userId,
      details,
    });
  },
  
  failed: (email, reason, details) => {
    logger.warn('Authentication Failed', {
      email,
      reason,
      details,
      ip: details?.ip,
      userAgent: details?.userAgent,
    });
  },
  
  tokenRefresh: (userId, success, details) => {
    logger.info('Token Refresh', {
      userId,
      success,
      details,
    });
  },
};

// Business logic logging
const businessLogger = {
  userCreated: (userId, email, role, tenantId) => {
    logger.info('User Created', {
      userId,
      email,
      role,
      tenantId,
    });
  },
  
  userUpdated: (userId, changes, updatedBy) => {
    logger.info('User Updated', {
      userId,
      changes,
      updatedBy,
    });
  },
  
  tenantCreated: (tenantId, name, domain, createdBy) => {
    logger.info('Tenant Created', {
      tenantId,
      name,
      domain,
      createdBy,
    });
  },
  
  pollCreated: (pollId, title, tenantId, createdBy) => {
    logger.info('Poll Created', {
      pollId,
      title,
      tenantId,
      createdBy,
    });
  },
  
  pollResponse: (pollId, userId, tenantId, anonymous) => {
    logger.info('Poll Response', {
      pollId,
      userId: anonymous ? 'anonymous' : userId,
      tenantId,
      anonymous,
    });
  },
};

// Error logging with context
const errorLogger = {
  application: (error, context = {}) => {
    logger.error('Application Error', {
      error: error.message,
      stack: error.stack,
      context,
    });
  },
  
  validation: (errors, data, context = {}) => {
    logger.warn('Validation Error', {
      errors,
      data,
      context,
    });
  },
  
  authorization: (userId, action, resource, reason) => {
    logger.warn('Authorization Error', {
      userId,
      action,
      resource,
      reason,
    });
  },
  
  database: (error, operation, context = {}) => {
    logger.error('Database Error', {
      error: error.message,
      stack: error.stack,
      operation,
      context,
    });
  },
  
  external: (error, service, operation, context = {}) => {
    logger.error('External Service Error', {
      error: error.message,
      stack: error.stack,
      service,
      operation,
      context,
    });
  },
};

// Performance logging
const performanceLogger = {
  slowQuery: (query, duration, threshold = 1000) => {
    if (duration > threshold) {
      logger.warn('Slow Database Query', {
        query: query.replace(/\s+/g, ' ').trim(),
        duration: `${duration}ms`,
        threshold: `${threshold}ms`,
      });
    }
  },
  
  apiResponse: (endpoint, duration, statusCode) => {
    if (duration > 5000) {
      logger.warn('Slow API Response', {
        endpoint,
        duration: `${duration}ms`,
        statusCode,
      });
    }
  },
  
  memoryUsage: (usage) => {
    logger.debug('Memory Usage', {
      rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
      external: `${Math.round(usage.external / 1024 / 1024)}MB`,
    });
  },
};

// Security logging
const securityLogger = {
  suspiciousActivity: (type, details) => {
    logger.warn('Suspicious Activity', {
      type,
      details,
      timestamp: new Date().toISOString(),
    });
  },
  
  bruteForceAttempt: (ip, email, attempts) => {
    logger.warn('Brute Force Attempt', {
      ip,
      email,
      attempts,
      timestamp: new Date().toISOString(),
    });
  },
  
  unauthorizedAccess: (ip, endpoint, userAgent) => {
    logger.warn('Unauthorized Access', {
      ip,
      endpoint,
      userAgent,
      timestamp: new Date().toISOString(),
    });
  },
  
  tokenCompromise: (userId, tokenId, reason) => {
    logger.error('Token Compromise', {
      userId,
      tokenId,
      reason,
      timestamp: new Date().toISOString(),
    });
  },
};

// Audit logging
const auditLogger = {
  dataAccess: (userId, resource, action, details) => {
    logger.info('Data Access', {
      userId,
      resource,
      action,
      details,
      timestamp: new Date().toISOString(),
    });
  },
  
  dataModification: (userId, resource, action, changes, details) => {
    logger.info('Data Modification', {
      userId,
      resource,
      action,
      changes,
      details,
      timestamp: new Date().toISOString(),
    });
  },
  
  configurationChange: (userId, component, changes, details) => {
    logger.info('Configuration Change', {
      userId,
      component,
      changes,
      details,
      timestamp: new Date().toISOString(),
    });
  },
};

// Health check logging
const healthLogger = {
  systemHealth: (status, details) => {
    logger.info('System Health Check', {
      status,
      details,
      timestamp: new Date().toISOString(),
    });
  },
  
  databaseHealth: (status, details) => {
    logger.info('Database Health Check', {
      status,
      details,
      timestamp: new Date().toISOString(),
    });
  },
  
  serviceHealth: (service, status, details) => {
    logger.info('Service Health Check', {
      service,
      status,
      details,
      timestamp: new Date().toISOString(),
    });
  },
};

// Export all logging utilities
module.exports = {
  logger,
  requestLogger,
  dbLogger,
  authLogger,
  businessLogger,
  errorLogger,
  performanceLogger,
  securityLogger,
  auditLogger,
  healthLogger,
}; 