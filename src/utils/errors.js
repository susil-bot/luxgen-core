/**
 * Centralized Error Handling System
 * Provides consistent error classes and handling across the application
 */

const logger = require('./logger');

class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }
}

// Specific error classes
class ValidationError extends AppError {
  constructor(message = 'Validation failed', details = null) {
    super(message, 400, true);
    this.name = 'ValidationError';
    this.details = details;
  }
}

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

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, true);
    this.name = 'NotFoundError';
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, true);
    this.name = 'ConflictError';
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429, true);
    this.name = 'RateLimitError';
  }
}

class DatabaseError extends AppError {
  constructor(message = 'Database operation failed') {
    super(message, 500, true);
    this.name = 'DatabaseError';
  }
}

class ExternalServiceError extends AppError {
  constructor(service, message = 'External service error') {
    super(`${service}: ${message}`, 502, true);
    this.name = 'ExternalServiceError';
    this.service = service;
  }
}

// Training-specific errors
class TrainingError extends AppError {
  constructor(message = 'Training operation failed') {
    super(message, 400, true);
    this.name = 'TrainingError';
  }
}

class SessionError extends AppError {
  constructor(message = 'Session operation failed') {
    super(message, 400, true);
    this.name = 'SessionError';
  }
}

class EnrollmentError extends AppError {
  constructor(message = 'Enrollment operation failed') {
    super(message, 400, true);
    this.name = 'EnrollmentError';
  }
}

class AssessmentError extends AppError {
  constructor(message = 'Assessment operation failed') {
    super(message, 400, true);
    this.name = 'AssessmentError';
  }
}

// Presentation-specific errors
class PresentationError extends AppError {
  constructor(message = 'Presentation operation failed') {
    super(message, 400, true);
    this.name = 'PresentationError';
  }
}

class PollError extends AppError {
  constructor(message = 'Poll operation failed') {
    super(message, 400, true);
    this.name = 'PollError';
  }
}

// AI-specific errors
class AIError extends AppError {
  constructor(message = 'AI operation failed') {
    super(message, 500, true);
    this.name = 'AIError';
  }
}

class ContentGenerationError extends AppError {
  constructor(message = 'Content generation failed') {
    super(message, 500, true);
    this.name = 'ContentGenerationError';
  }
}

// Tenant-specific errors
class TenantError extends AppError {
  constructor(message = 'Tenant operation failed') {
    super(message, 400, true);
    this.name = 'TenantError';
  }
}

class TenantAccessError extends AppError {
  constructor(message = 'Tenant access denied') {
    super(message, 403, true);
    this.name = 'TenantAccessError';
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
    logger.error('🚨 Server Error:', errorLog);
  } else if (err.statusCode >= 400) {
    logger.warn('⚠️ Client Error:', errorLog);
  } else {
    logger.info('ℹ️ Info Error:', errorLog);
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
      logger.error('🚨 Async Handler Error:', {
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
  logger.error('📤 Error Response Sent:', {
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
  logger.info('📤 Success Response Sent:', {
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

// Authorization error helper
const createAuthorizationError = (action, resource) => {
  return new AuthorizationError(`Cannot ${action} ${resource}`);
};

// Training error helpers
const createTrainingError = (operation, details = '') => {
  return new TrainingError(`Training ${operation} failed${details ? `: ${details}` : ''}`);
};

const createSessionError = (operation, details = '') => {
  return new SessionError(`Session ${operation} failed${details ? `: ${details}` : ''}`);
};

const createEnrollmentError = (operation, details = '') => {
  return new EnrollmentError(`Enrollment ${operation} failed${details ? `: ${details}` : ''}`);
};

const createAssessmentError = (operation, details = '') => {
  return new AssessmentError(`Assessment ${operation} failed${details ? `: ${details}` : ''}`);
};

// Presentation error helpers
const createPresentationError = (operation, details = '') => {
  return new PresentationError(`Presentation ${operation} failed${details ? `: ${details}` : ''}`);
};

const createPollError = (operation, details = '') => {
  return new PollError(`Poll ${operation} failed${details ? `: ${details}` : ''}`);
};

// AI error helpers
const createAIError = (operation, details = '') => {
  return new AIError(`AI ${operation} failed${details ? `: ${details}` : ''}`);
};

const createContentGenerationError = (type, details = '') => {
  return new ContentGenerationError(`${type} generation failed${details ? `: ${details}` : ''}`);
};

// Tenant error helpers
const createTenantError = (operation, details = '') => {
  return new TenantError(`Tenant ${operation} failed${details ? `: ${details}` : ''}`);
};

const createTenantAccessError = (resource, action = 'access') => {
  return new TenantAccessError(`Cannot ${action} ${resource} in this tenant`);
};

// File error helpers
const createFileUploadError = (operation, details = '') => {
  return new FileUploadError(`File upload ${operation} failed${details ? `: ${details}` : ''}`);
};

const createFileValidationError = (field, details = '') => {
  return new FileValidationError(`${field} validation failed${details ? `: ${details}` : ''}`);
};

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  ExternalServiceError,
  TrainingError,
  SessionError,
  EnrollmentError,
  AssessmentError,
  PresentationError,
  PollError,
  AIError,
  ContentGenerationError,
  TenantError,
  TenantAccessError,
  FileUploadError,
  FileValidationError,
  errorHandler,
  asyncHandler,
  sendErrorResponse,
  sendSuccessResponse,
  createValidationError,
  createNotFoundError,
  createAuthorizationError,
  createTrainingError,
  createSessionError,
  createEnrollmentError,
  createAssessmentError,
  createPresentationError,
  createPollError,
  createAIError,
  createContentGenerationError,
  createTenantError,
  createTenantAccessError,
  createFileUploadError,
  createFileValidationError
}; 