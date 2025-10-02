const logger = require('./logger');

// Base error class
class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Authentication errors
class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401, true);
    this.name = 'AuthenticationError';
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, true);
    this.name = 'AuthorizationError';
  }
}

// Validation errors
class ValidationError extends AppError {
  constructor(message = 'Validation failed', details = null) {
    super(message, 400, true);
    this.name = 'ValidationError';
    this.details = details;
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, true);
    this.name = 'ConflictError';
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, true);
    this.name = 'NotFoundError';
  }
}

// Database errors
class DatabaseError extends AppError {
  constructor(message = 'Database operation failed') {
    super(message, 500, true);
    this.name = 'DatabaseError';
  }
}

// Rate limiting errors
class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 429, true);
    this.name = 'RateLimitError';
  }
}

// AI service errors
class AIError extends AppError {
  constructor(message = 'AI service error') {
    super(message, 500, true);
    this.name = 'AIError';
  }
}

// Training-specific errors
class TrainingError extends AppError {
  constructor(message = 'Training operation failed') {
    super(message, 500, true);
    this.name = 'TrainingError';
  }
}

// Presentation-specific errors
class PresentationError extends AppError {
  constructor(message = 'Presentation operation failed') {
    super(message, 500, true);
    this.name = 'PresentationError';
  }
}

// Tenant-specific errors
class TenantError extends AppError {
  constructor(message = 'Tenant operation failed') {
    super(message, 500, true);
    this.name = 'TenantError';
  }
}

// File upload errors
class FileUploadError extends AppError {
  constructor(message = 'File upload failed') {
    super(message, 400, true);
    this.name = 'FileUploadError';
  }
}

class FileValidationError extends AppError {
  constructor(message = 'File validation failed') {
    super(message, 400, true);
    this.name = 'FileValidationError';
  }
}

// Enhanced error handler middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Enhanced error logging
  const errorLog = {
    name: err.name,
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    userId: req.user?.id,
    tenantId: req.user?.tenantId,
    requestId: req.headers['x-request-id'],
    correlationId: req.headers['x-correlation-id']
  };

  // Log error with appropriate level
  if (err.statusCode >= 500) {
    logger.error('Server Error:', errorLog);
  } else if (err.statusCode >= 400) {
    logger.warn('Client Error:', errorLog);
  } else {
    logger.info('Info Error:', errorLog);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new ValidationError(message, err.errors);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} already exists`;
    error = new ConflictError(message);
  }

  // Mongoose cast error
  if (err.name === 'CastError') {
    const message = 'Invalid resource ID';
    error = new ValidationError(message);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new AuthenticationError('Invalid token');
  }
  if (err.name === 'TokenExpiredError') {
    error = new AuthenticationError('Token expired');
  }

  // Rate limit errors
  if (err.name === 'RateLimitError') {
    error = new RateLimitError(err.message);
  }

  // Database connection errors
  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    error = new DatabaseError('Database connection failed');
  }

  // MongoDB connection errors
  if (err.name === 'MongoNetworkError' || err.name === 'MongoTimeoutError') {
    error = new DatabaseError('Database connection timeout');
  }

  // Multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = new FileUploadError('File size too large');
  }
  if (err.code === 'LIMIT_FILE_COUNT') {
    error = new FileUploadError('Too many files uploaded');
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error = new FileUploadError('Unexpected file field');
  }

  // AI service errors
  if (err.name === 'AIError' || err.name === 'ContentGenerationError') {
    error = new AIError(err.message);
  }

  // Training-specific errors
  if (err.name === 'TrainingError' || err.name === 'SessionError' || 
      err.name === 'EnrollmentError' || err.name === 'AssessmentError') {
    error = new TrainingError(err.message);
  }

  // Presentation-specific errors
  if (err.name === 'PresentationError' || err.name === 'PollError') {
    error = new PresentationError(err.message);
  }

  // Tenant-specific errors
  if (err.name === 'TenantError' || err.name === 'TenantAccessError') {
    error = new TenantError(err.message);
  }

  // Default error response
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';

  // Development error response
  if (process.env.NODE_ENV === 'development') {
    res.status(statusCode).json({
      success: false,
      error: {
        message,
        statusCode,
        stack: error.stack,
        name: error.name,
        timestamp: error.timestamp,
        path: req.originalUrl,
        method: req.method,
        details: error.details || null,
        requestId: req.headers['x-request-id']
      }
    });
  } else {
    // Production error response
    res.status(statusCode).json({
      success: false,
      error: {
        message: statusCode === 500 ? 'Internal server error' : message,
        statusCode,
        timestamp: error.timestamp,
        path: req.originalUrl,
        method: req.method,
        requestId: req.headers['x-request-id']
      }
    });
  }
};

// Async error wrapper with enhanced logging
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      // Log the error with context
      logger.error('Async Handler Error:', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        userId: req.user?.id,
        tenantId: req.user?.tenantId,
        timestamp: new Date().toISOString()
      });
      next(error);
    });
  };
};

// Enhanced error response helper
const sendErrorResponse = (res, error, context = {}) => {
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';

  // Log error with context
  logger.error('Error Response Sent:', {
    statusCode,
    message,
    context,
    timestamp: new Date().toISOString()
  });

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      statusCode,
      timestamp: new Date().toISOString(),
      ...context
    }
  });
};

// Enhanced success response helper
const sendSuccessResponse = (res, data, message = 'Success', statusCode = 200, context = {}) => {
  // Log success with context
  logger.info('Success Response Sent:', {
    statusCode,
    message,
    context,
    timestamp: new Date().toISOString()
  });

  res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
    ...context
  });
};

// Validation error helper
const createValidationError = (field, message) => {
  return new ValidationError(`${field}: ${message}`);
};

// Not found error helper
const createNotFoundError = (resource, id) => {
  return new NotFoundError(`${resource} with ID ${id} not found`);
};

// Conflict error helper
const createConflictError = (resource, field, value) => {
  return new ConflictError(`${resource} with ${field} '${value}' already exists`);
};

// Authentication error helper
const createAuthenticationError = (message = 'Authentication required') => {
  return new AuthenticationError(message);
};

// Authorization error helper
const createAuthorizationError = (message = 'Insufficient permissions') => {
  return new AuthorizationError(message);
};

// Database error helper
const createDatabaseError = (operation, message = 'Database operation failed') => {
  return new DatabaseError(`${operation}: ${message}`);
};

// Rate limit error helper
const createRateLimitError = (limit, window) => {
  return new RateLimitError(`Rate limit exceeded: ${limit} requests per ${window}`);
};

// AI error helper
const createAIError = (service, message = 'AI service error') => {
  return new AIError(`${service}: ${message}`);
};

// Training error helper
const createTrainingError = (operation, message = 'Training operation failed') => {
  return new TrainingError(`${operation}: ${message}`);
};

// Presentation error helper
const createPresentationError = (operation, message = 'Presentation operation failed') => {
  return new PresentationError(`${operation}: ${message}`);
};

// Tenant error helper
const createTenantError = (operation, message = 'Tenant operation failed') => {
  return new TenantError(`${operation}: ${message}`);
};

// File upload error helper
const createFileUploadError = (message = 'File upload failed') => {
  return new FileUploadError(message);
};

// File validation error helper
const createFileValidationError = (field, message) => {
  return new FileValidationError(`${field}: ${message}`);
};

module.exports = {
  // Error classes
  AppError,
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  ConflictError,
  NotFoundError,
  DatabaseError,
  RateLimitError,
  AIError,
  TrainingError,
  PresentationError,
  TenantError,
  FileUploadError,
  FileValidationError,
  
  // Middleware
  errorHandler,
  asyncHandler,
  
  // Response helpers
  sendErrorResponse,
  sendSuccessResponse,
  
  // Error creation helpers
  createValidationError,
  createNotFoundError,
  createConflictError,
  createAuthenticationError,
  createAuthorizationError,
  createDatabaseError,
  createRateLimitError,
  createAIError,
  createTrainingError,
  createPresentationError,
  createTenantError,
  createFileUploadError,
  createFileValidationError
};