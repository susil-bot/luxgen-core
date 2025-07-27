# 🛡️ Comprehensive Error Handling System

## 📋 Overview

The Trainer Platform Backend implements a robust, multi-layered error handling system that provides:

- **Centralized error management** with custom error classes
- **Comprehensive request logging** with performance monitoring
- **Detailed error tracking** with context preservation
- **Service-specific error handling** for different components
- **Security-focused error responses** (no sensitive data exposure)
- **Production-ready error handling** with appropriate logging levels

## 🏗️ Architecture

### **Error Handling Layers**

```
┌─────────────────────────────────────┐
│           Client Request            │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│        Request Logging              │
│    (Performance Monitoring)         │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│        Route Processing             │
│    (Validation, Authentication)     │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│        Error Tracking               │
│    (Context Preservation)           │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│    Service-Specific Handlers        │
│  (AI, Training, Presentation, etc.) │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│        Generic Error Handler        │
│    (Catch-all, Production Safe)     │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│        Client Response              │
└─────────────────────────────────────┘
```

## 🔧 Error Classes

### **Base Error Class**
```javascript
class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.timestamp = new Date().toISOString();
  }
}
```

### **Specific Error Classes**

#### **Validation Errors (400)**
```javascript
class ValidationError extends AppError {
  constructor(message = 'Validation failed', details = null) {
    super(message, 400, true);
    this.name = 'ValidationError';
    this.details = details;
  }
}
```

#### **Authentication Errors (401)**
```javascript
class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401, true);
    this.name = 'AuthenticationError';
  }
}
```

#### **Authorization Errors (403)**
```javascript
class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, true);
    this.name = 'AuthorizationError';
  }
}
```

#### **Not Found Errors (404)**
```javascript
class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, true);
    this.name = 'NotFoundError';
  }
}
```

#### **Conflict Errors (409)**
```javascript
class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, true);
    this.name = 'ConflictError';
  }
}
```

#### **Rate Limit Errors (429)**
```javascript
class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429, true);
    this.name = 'RateLimitError';
  }
}
```

#### **Service-Specific Errors**

**Training Errors (400)**
```javascript
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
```

**Presentation Errors (400)**
```javascript
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
```

**AI Errors (500)**
```javascript
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
```

**Tenant Errors (400/403)**
```javascript
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
```

## 🔄 Error Handling Middleware

### **Request Logging**
```javascript
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] || generateRequestId();
  
  req.requestId = requestId;
  
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
  res.json = function(data) {
    const duration = Date.now() - startTime;
    
    logger.info('📤 Response Sent', {
      requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      success: data?.success,
      timestamp: new Date().toISOString()
    });

    res.setHeader('X-Request-ID', requestId);
    res.setHeader('X-Response-Time', `${duration}ms`);

    return originalJson.call(this, data);
  };

  next();
};
```

### **Performance Monitoring**
```javascript
const performanceMonitor = (req, res, next) => {
  const startTime = process.hrtime();
  
  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const duration = seconds * 1000 + nanoseconds / 1000000;
    
    // Log slow requests (> 1 second)
    if (duration > 1000) {
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
```

### **Error Tracking**
```javascript
const errorTracker = (err, req, res, next) => {
  const errorId = generateErrorId();
  
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

  // Log with appropriate level
  if (err.statusCode >= 500) {
    logger.error('🚨 Server Error', errorContext);
  } else if (err.statusCode >= 400) {
    logger.warn('⚠️ Client Error', errorContext);
  } else {
    logger.info('ℹ️ Info Error', errorContext);
  }

  res.setHeader('X-Error-ID', errorId);
  next(err);
};
```

## 🛡️ Service-Specific Error Handlers

### **Database Error Handler**
```javascript
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
```

### **AI Service Error Handler**
```javascript
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
```

### **Training Error Handler**
```javascript
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
```

## 📝 Validation System

### **Express-Validator Integration**
```javascript
const { body, query, param, validationResult } = require('express-validator');
const { ValidationError } = require('../utils/errors');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value,
      type: error.type
    }));

    throw new ValidationError('Validation failed', errorDetails);
  }
  next();
};
```

### **Validation Examples**

#### **User Registration**
```javascript
const userValidations = {
  register: [
    body('email').isEmail().normalizeEmail().withMessage('Invalid email format'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('firstName').trim().isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),
    body('lastName').trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),
    body('role').optional().isIn(['user', 'trainer', 'admin']).withMessage('Invalid role'),
    validateRequest
  ]
};
```

#### **Training Session Creation**
```javascript
const trainingValidations = {
  session: {
    create: [
      body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters'),
      body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
      body('sessionType').isIn(['workshop', 'seminar', 'webinar', 'hands-on', 'lecture', 'assessment']).withMessage('Invalid session type'),
      body('duration').isInt({ min: 15, max: 480 }).withMessage('Duration must be between 15 and 480 minutes'),
      body('scheduledAt').isISO8601().withMessage('Invalid scheduled date'),
      body('endAt').isISO8601().withMessage('Invalid end date'),
      validateRequest
    ]
  }
};
```

## 🔒 Security Features

### **Request Sanitization**
```javascript
function sanitizeRequestBody(body) {
  if (!body) return body;
  
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
```

### **Production vs Development Responses**

#### **Development Response**
```javascript
if (process.env.NODE_ENV === 'development') {
  return res.status(statusCode).json({
    success: false,
    error: {
      message,
      statusCode,
      stack: error.stack,
      name: error.name,
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    }
  });
}
```

#### **Production Response**
```javascript
return res.status(statusCode).json({
  success: false,
  error: {
    message: statusCode === 500 ? 'Internal server error' : message,
    statusCode,
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  }
});
```

## 🚀 Usage Examples

### **Controller Error Handling**
```javascript
const { asyncHandler, createNotFoundError, createValidationError } = require('../utils/errors');

// ✅ Good - Use asyncHandler wrapper
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    throw createNotFoundError('User', req.params.id);
  }
  res.json({ success: true, data: user });
});

// ✅ Good - Use specific error classes
const createUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    throw createValidationError('email/password', 'Email and password are required');
  }
  
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ConflictError('User with this email already exists');
  }
  
  const user = await User.create(req.body);
  res.status(201).json({ success: true, data: user });
});
```

### **Route Error Handling**
```javascript
const { userValidations } = require('../middleware/validation');

// Apply validation middleware
router.post('/register', userValidations.register, userController.registerUser);
router.put('/users/:id', userValidations.update, userController.updateUser);
```

### **Custom Error Creation**
```javascript
const { 
  createTrainingError, 
  createSessionError, 
  createAIError 
} = require('../utils/errors');

// Training errors
if (!session) {
  throw createSessionError('retrieve', 'Session not found');
}

// AI errors
if (!aiResponse) {
  throw createAIError('generate content', 'AI service unavailable');
}
```

## 📊 Error Response Format

### **Standard Error Response**
```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "statusCode": 400,
    "details": [
      {
        "field": "email",
        "message": "Invalid email format",
        "value": "invalid-email",
        "type": "field"
      }
    ],
    "timestamp": "2024-01-15T10:30:00.000Z",
    "requestId": "req_1705312200000_abc123def"
  }
}
```

### **Headers Included**
```
X-Request-ID: req_1705312200000_abc123def
X-Response-Time: 45ms
X-Error-ID: err_1705312200000_xyz789ghi
```

## 🔍 Monitoring and Debugging

### **Log Levels**
- **ERROR (🚨)**: Server errors, database failures, AI service issues
- **WARN (⚠️)**: Client errors, validation failures, rate limiting
- **INFO (ℹ️)**: Normal operations, performance metrics, resource not found

### **Request Tracking**
- **Request ID**: Unique identifier for each request
- **Error ID**: Unique identifier for each error
- **Performance metrics**: Response time tracking
- **Context preservation**: Full request context in error logs

### **Performance Monitoring**
- **Slow request detection**: Logs requests taking > 1 second
- **Response time tracking**: All requests logged with duration
- **Service health monitoring**: Database and AI service status

## 🛠️ Configuration

### **Environment Variables**
```bash
# Error handling configuration
NODE_ENV=production                    # Affects error response detail level
LOG_LEVEL=info                         # Logging level (error, warn, info, debug)
ENABLE_PERFORMANCE_MONITORING=true     # Enable performance tracking
SLOW_REQUEST_THRESHOLD=1000           # Slow request threshold in ms
```

### **Middleware Order**
```javascript
// Apply in this order for optimal error handling
app.use(requestLogger);           // 1. Log incoming requests
app.use(performanceMonitor);      // 2. Monitor performance
app.use(routes);                  // 3. Process routes
app.use(errorTracker);            // 4. Track errors
app.use(serviceSpecificHandlers); // 5. Handle service-specific errors
app.use(genericErrorHandler);     // 6. Generic error handler
```

## 🎯 Best Practices

### **✅ Do's**
- Use `asyncHandler` wrapper for all async controllers
- Use specific error classes for different error types
- Include request ID in all error responses
- Sanitize sensitive data in error logs
- Use appropriate HTTP status codes
- Log errors with sufficient context

### **❌ Don'ts**
- Don't expose stack traces in production
- Don't log sensitive information (passwords, tokens)
- Don't use generic error messages for specific errors
- Don't ignore validation errors
- Don't use try-catch blocks when asyncHandler is available

## 🔧 Troubleshooting

### **Common Issues**

#### **Error Not Being Caught**
```javascript
// ❌ Bad - Error not caught
const badFunction = async (req, res) => {
  const user = await User.findById(req.params.id);
  res.json(user); // Error if user not found
};

// ✅ Good - Use asyncHandler
const goodFunction = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    throw new NotFoundError('User');
  }
  res.json({ success: true, data: user });
});
```

#### **Validation Not Working**
```javascript
// ❌ Bad - No validation
router.post('/users', userController.createUser);

// ✅ Good - With validation
router.post('/users', userValidations.create, userController.createUser);
```

#### **Error Response Format Issues**
```javascript
// ❌ Bad - Inconsistent format
res.status(400).json({ error: 'Bad request' });

// ✅ Good - Consistent format
res.status(400).json({
  success: false,
  error: {
    message: 'Validation failed',
    statusCode: 400,
    timestamp: new Date().toISOString()
  }
});
```

This comprehensive error handling system ensures robust, secure, and maintainable error management across the entire Trainer Platform Backend. 