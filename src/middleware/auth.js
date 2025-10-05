const jwt = require('jsonwebtoken');
const { AuthenticationError, AuthorizationError } = require('../utils/errors');
const { getUserById } = require('../services/userService');

// Simple JWT configuration
const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || 'your-jwt-secret-key',
  issuer: 'luxgen',
  audience: 'luxgen-users'
};

// Rate limiting for authentication attempts
const authAttempts = new Map();
const MAX_AUTH_ATTEMPTS = 5;
const AUTH_ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes

// Clean up old auth attempts
setInterval(() => {
  const now = Date.now();
  for (const [key, attempts] of authAttempts.entries()) {
    if (now - attempts.timestamp > AUTH_ATTEMPT_WINDOW) {
      authAttempts.delete(key);
    }
  }
}, 60000); // Clean up every minute

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      throw new AuthenticationError('Access token is required');
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_CONFIG.secret);

    // Get user from database using the id from our JWT
    const user = await getUserById(decoded.id);
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    // Token validation passed

    // Add user to request object
    req.user = user;
    req.token = token;
    req.tokenPayload = decoded;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AuthenticationError('Invalid token'));
    } else if (error.name === 'TokenExpiredError') {
      return next(new AuthenticationError('Token has expired'));
    } else {
      return next(new AuthenticationError('Authentication failed'));
    }
  }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, JWT_CONFIG.secret, {
        issuer: JWT_CONFIG.issuer,
        audience: JWT_CONFIG.audience,
      });

      const user = await getUserById(decoded.userId);
      if (user && user.isActive) {
        req.user = user;
        req.token = token;
        req.tokenPayload = decoded;
      }
    }

    next();
  } catch (error) {
    // Don't fail for optional auth, just continue without user
    next();
  }
};

// Role-based authorization middleware
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthenticationError('Authentication required'));
    }


    if (!allowedRoles.includes(req.user.role)) {
      return next(new AuthorizationError(`Access denied. Required roles: ${allowedRoles.join(', ')}`));
    }

    next();
  };
};

// Admin-only middleware
const requireAdminMiddleware = (req, res, next) => {
  if (!req.user) {
    return next(new AuthenticationError('Authentication required'));
  }

  if (req.user.role !== 'admin') {
    return next(new AuthorizationError('Admin access required'));
  }

  next();
};

// Tenant-based authorization middleware
const authorizeTenant = (req, res, next) => {
  if (!req.user) {
    return next(new AuthenticationError('Authentication required'));
  }

  // Admin can access any tenant
  if (req.user.role === 'admin') {
    return next();
  }

  // Check if user belongs to the requested tenant
  const requestedTenantId = req.params.tenantId || req.body.tenantId || req.query.tenantId;
  if (requestedTenantId && req.user.tenantId !== requestedTenantId) {
    return next(new AuthorizationError('Access denied to this tenant'));
  }

  next();
};

// Resource ownership middleware
const authorizeResource = (resourceUserIdField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthenticationError('Authentication required'));
    }

    // Admin can access any resource
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user owns the resource
    const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
    if (resourceUserId && req.user.id !== resourceUserId) {
      return next(new AuthorizationError('Access denied to this resource'));
    }

    next();
  };
};

// Rate limiting for authentication attempts
const rateLimitAuth = (req, res, next) => {
  const clientId = req.ip;
  const now = Date.now();

  if (authAttempts.has(clientId)) {
    const attempts = authAttempts.get(clientId);
    
    if (attempts.count >= MAX_AUTH_ATTEMPTS) {
      const timeRemaining = AUTH_ATTEMPT_WINDOW - (now - attempts.timestamp);
      if (timeRemaining > 0) {
        return res.status(429).json({
          success: false,
          error: {
            message: 'Too many authentication attempts. Please try again later.',
            retryAfter: Math.ceil(timeRemaining / 1000)
          }
        });
      } else {
        // Reset attempts after window expires
        authAttempts.delete(clientId);
      }
    }
  }

  next();
};

// Track authentication attempts
const trackAuthAttempt = (req, res, next) => {
  const clientId = req.ip;
  const now = Date.now();

  if (!authAttempts.has(clientId)) {
    authAttempts.set(clientId, { count: 0, timestamp: now });
  }

  const attempts = authAttempts.get(clientId);
  attempts.count++;
  attempts.timestamp = now;

  next();
};

// Check if token is blacklisted (placeholder - implement with Redis in production)
const checkTokenBlacklist = async (token) => {
  // In production, check against Redis blacklist
  // For now, return false (no blacklist)
  return false;
};

// Blacklist token (placeholder - implement with Redis in production)
const blacklistToken = async (token) => {
  // In production, add token to Redis blacklist with expiration
  // For now, just return success
  return true;
};

// Combined authentication and authorization
const requireAuth = [authenticateToken];
const requireAdmin = [authenticateToken, authorizeRoles('admin')];
const requireUser = [authenticateToken, authorizeRoles('user', 'admin')];
const requireTrainer = [authenticateToken, authorizeRoles('trainer', 'admin')];

module.exports = {
  authenticateToken,
  optionalAuth,
  authorizeRoles,
  requireAdmin,
  authorizeTenant,
  authorizeResource,
  rateLimitAuth,
  trackAuthAttempt,
  checkTokenBlacklist,
  blacklistToken,
  requireAuth,
  requireUser,
  requireTrainer
}; 