/**
 * Comprehensive Error Handling Middleware
 * Provides request logging, error tracking, and performance monitoring
 */

const logger = require('../utils/logger');
const {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  AIError,
  TrainingError,
  PresentationError,
  TenantError
} = require('../utils/errors');


// Request logging middleware
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] || generateRequestId();

  
// Add request ID to request object
  req.requestId = requestId;

  
// Log incoming request
  logger.info('📥 Incoming Request', {
    requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    tenantId: req.user?.tenantId,
    timestamp: new Date().toISOString()
  });

  
// Override res.json to log response
  const originalJson = res.json;
  res.json = function (data) {
    const duration = Date.now() - startTime;

    
// Log response
    logger.info('📤 Response Sent', {
      requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      success: data?.success,
      timestamp: new Date().toISOString()
    });

    
// Add request ID to response headers
    res.setHeader('X-Request-ID', requestId);
    res.setHeader('X-Response-Time', `${duration}ms`);

    return originalJson.call(this, data);
  };

  next();
};


// Performance monitoring middleware
const performanceMonitor = (req, res, next) => {
  const startTime = process.hrtime();

  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const duration = seconds * (1000 + nanoseconds / 1000000); 
// Convert to milliseconds

    
// Log slow requests
    if (duration > 1000) { 
// Log requests taking more than 1 second
      logger.warn('🐌 Slow Request Detected', {
        requestId: req.requestId,
        method: req.method,
        url: req.originalUrl,
        duration: `${duration.toFixed(2)}ms`,
        statusCode: res.statusCode,
        timestamp: new Date().toISOString()
      });
    }

    
// Log performance metrics
    logger.info('📊 Performance Metric', {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      duration: `${duration.toFixed(2)}ms`,
      statusCode: res.statusCode,
      timestamp: new Date().toISOString()
    });
  });

  next();
};


// Error tracking middleware
const errorTracker = (err, req, res, next) => {
  
// Generate error ID
  const errorId = generateErrorId();

  
// Enhanced error logging with context
  const errorContext = {
    errorId,
    requestId: req.requestId,
    name: err.name,
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    tenantId: req.user?.tenantId,
    requestBody: sanitizeRequestBody(req.body),
    requestQuery: req.query,
    requestParams: req.params,
    timestamp: new Date().toISOString()
  };

  
// Log error with appropriate level
  if (err.statusCode >= 500) {
    logger.error('🚨 Server Error', errorContext);
  } else if (err.statusCode >= 400) {
    logger.warn('⚠️ Client Error', errorContext);
  } else {
    logger.info('ℹ️ Info Error', errorContext);
  }

  
// Add error ID to response
  res.setHeader('X-Error-ID', errorId);

  next(err);
};


// Rate limiting error handler
const rateLimitErrorHandler = (err, req, res, next) => {
  if (err.name === 'RateLimitError') {
    logger.warn('🚫 Rate Limit Exceeded', {
      requestId: req.requestId,
      ip: req.ip,
      url: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString()
    });

    return res.status(429).json({
      success: false,
      error: {
        message: 'Too many requests. Please try again later.',
        statusCode: 429,
        retryAfter: err.retryAfter || 60,
        timestamp: new Date().toISOString()
      }
    });
  }
  next(err);
};


// Database error handler
const databaseErrorHandler = (err, req, res, next) => {
  if (err.name === 'MongoNetworkError' ||
      err.name === 'MongoTimeoutError' ||
      err.code === 'ECONNREFUSED' ||
      err.code === 'ENOTFOUND') {
    logger.error('🗄️ Database Connection Error', {
      requestId: req.requestId,
      error: err.message,
      code: err.code,
      name: err.name,
      timestamp: new Date().toISOString()
    });

    return res.status(503).json({
      success: false,
      error: {
        message: 'Database service temporarily unavailable. Please try again later.',
        statusCode: 503,
        timestamp: new Date().toISOString()
      }
    });
  }
  next(err);
};


// AI service error handler
const aiServiceErrorHandler = (err, req, res, next) => {
  if (err.name === 'AIError' || err.name === 'ContentGenerationError') {
    logger.error('🤖 AI Service Error', {
      requestId: req.requestId,
      error: err.message,
      url: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString()
    });

    return res.status(502).json({
      success: false,
      error: {
        message: 'AI service temporarily unavailable. Please try again later.',
        statusCode: 502,
        timestamp: new Date().toISOString()
      }
    });
  }
  next(err);
};


// Training service error handler
const trainingErrorHandler = (err, req, res, next) => {
  if (err.name === 'TrainingError' ||
      err.name === 'SessionError' ||
      err.name === 'EnrollmentError' ||
      err.name === 'AssessmentError') {
    logger.error('🎓 Training Service Error', {
      requestId: req.requestId,
      error: err.message,
      url: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString()
    });

    return res.status(400).json({
      success: false,
      error: {
        message: err.message || 'Training operation failed',
        statusCode: 400,
        timestamp: new Date().toISOString()
      }
    });
  }
  next(err);
};


// Presentation service error handler
const presentationErrorHandler = (err, req, res, next) => {
  if (err.name === 'PresentationError' || err.name === 'PollError') {
    logger.error('📊 Presentation Service Error', {
      requestId: req.requestId,
      error: err.message,
      url: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString()
    });

    return res.status(400).json({
      success: false,
      error: {
        message: err.message || 'Presentation operation failed',
        statusCode: 400,
        timestamp: new Date().toISOString()
      }
    });
  }
  next(err);
};


// Tenant service error handler
const tenantErrorHandler = (err, req, res, next) => {
  if (err.name === 'TenantError' || err.name === 'TenantAccessError') {
    logger.error('🏢 Tenant Service Error', {
      requestId: req.requestId,
      error: err.message,
      url: req.originalUrl,
      method: req.method,
      tenantId: req.user?.tenantId,
      timestamp: new Date().toISOString()
    });

    return res.status(err.statusCode || 400).json({
      success: false,
      error: {
        message: err.message || 'Tenant operation failed',
        statusCode: err.statusCode || 400,
        timestamp: new Date().toISOString()
      }
    });
  }
  next(err);
};


// Validation error handler
const validationErrorHandler = (err, req, res, next) => {
  if (err.name === 'ValidationError') {
    logger.warn('✅ Validation Error', {
      requestId: req.requestId,
      error: err.message,
      details: err.details,
      url: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString()
    });

    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        statusCode: 400,
        details: err.details || [],
        timestamp: new Date().toISOString()
      }
    });
  }
  next(err);
};


// Authentication error handler
const authenticationErrorHandler = (err, req, res, next) => {
  if (err.name === 'AuthenticationError' ||
      err.name === 'JsonWebTokenError' ||
      err.name === 'TokenExpiredError') {
    logger.warn('🔐 Authentication Error', {
      requestId: req.requestId,
      error: err.message,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });

    return res.status(401).json({
      success: false,
      error: {
        message: 'Authentication failed',
        statusCode: 401,
        timestamp: new Date().toISOString()
      }
    });
  }
  next(err);
};


// Authorization error handler
const authorizationErrorHandler = (err, req, res, next) => {
  if (err.name === 'AuthorizationError') {
    logger.warn('🚫 Authorization Error', {
      requestId: req.requestId,
      error: err.message,
      url: req.originalUrl,
      method: req.method,
      userId: req.user?.id,
      userRole: req.user?.role,
      timestamp: new Date().toISOString()
    });

    return res.status(403).json({
      success: false,
      error: {
        message: 'Access denied',
        statusCode: 403,
        timestamp: new Date().toISOString()
      }
    });
  }
  next(err);
};


// Not found error handler
const notFoundErrorHandler = (err, req, res, next) => {
  if (err.name === 'NotFoundError') {
    logger.info('🔍 Resource Not Found', {
      requestId: req.requestId,
      error: err.message,
      url: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString()
    });

    return res.status(404).json({
      success: false,
      error: {
        message: err.message || 'Resource not found',
        statusCode: 404,
        timestamp: new Date().toISOString()
      }
    });
  }
  next(err);
};


// Conflict error handler
const conflictErrorHandler = (err, req, res, next) => {
  if (err.name === 'ConflictError' || err.code === 11000) {
    logger.warn('⚡ Resource Conflict', {
      requestId: req.requestId,
      error: err.message,
      url: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString()
    });

    return res.status(409).json({
      success: false,
      error: {
        message: err.message || 'Resource conflict',
        statusCode: 409,
        timestamp: new Date().toISOString()
      }
    });
  }
  next(err);
};


// Generic error handler (catch-all)
const genericErrorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  
// Log unexpected errors
  logger.error('💥 Unexpected Error', {
    requestId: req.requestId,
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    statusCode,
    timestamp: new Date().toISOString()
  });

  
// Development error response
  if (process.env.NODE_ENV === 'development') {
    return res.status(statusCode).json({
      success: false,
      error: {
        message,
        statusCode,
        stack: err.stack,
        name: err.name,
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      }
    });
  }

  
// Production error response
  return res.status(statusCode).json({
    success: false,
    error: {
      message: statusCode === 500 ? 'Internal server error' : message,
      statusCode,
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    }
  });
};


// Utility functions
const generateRequestId = () => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const generateErrorId = () => {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const sanitizeRequestBody = (body) => {
  if (!body) {
    return body;
  }

  const sanitized = { ...body };

  
// Remove sensitive fields
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });

  return sanitized;
}


// Export middleware chain
module.exports = {
  requestLogger,
  performanceMonitor,
  errorTracker,
  rateLimitErrorHandler,
  databaseErrorHandler,
  aiServiceErrorHandler,
  trainingErrorHandler,
  presentationErrorHandler,
  tenantErrorHandler,
  validationErrorHandler,
  authenticationErrorHandler,
  authorizationErrorHandler,
  notFoundErrorHandler,
  conflictErrorHandler,
  genericErrorHandler
};
