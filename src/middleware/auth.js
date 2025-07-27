const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const databaseManager = require('../config/database');

// Custom error classes
class AuthenticationError extends Error {
  constructor (message = 'Authentication failed') {
    super(message);
    this.name = 'AuthenticationError';
    this.status = 401;
  }
}

class AuthorizationError extends Error {
  constructor (message = 'Access denied') {
    super(message);
    this.name = 'AuthorizationError';
    this.status = 403;
  }
}

class ValidationError extends Error {
  constructor (message = 'Validation failed') {
    super(message);
    this.name = 'ValidationError';
    this.status = 400;
  }
}

// JWT Configuration
const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || 'your_jwt_secret_key_here_2024',
  expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  issuer: 'trainer-platform',
  audience: 'trainer-platform-users'
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
    const decoded = jwt.verify(token, JWT_CONFIG.secret, {
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience
    });

    // Get user from database
    const user = await getUserById(decoded.userId);
    if (!user || !user.isActive) {
      throw new AuthenticationError('User not found or inactive');
    }

    // Check if token is blacklisted (for logout functionality)
    const isBlacklisted = await checkTokenBlacklist(token);
    if (isBlacklisted) {
      throw new AuthenticationError('Token has been revoked');
    }

    // Add user to request object
    req.user = user;
    req.token = token;
    req.tokenPayload = decoded;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(new AuthenticationError('Invalid token'));
    } else if (error.name === 'TokenExpiredError') {
      next(new AuthenticationError('Token has expired'));
    } else {
      next(error);
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
        audience: JWT_CONFIG.audience
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

// Admin authorization middleware (alias for authorizeRoles)
const requireAdmin = authorizeRoles('admin', 'super_admin');

// Tenant-based authorization middleware
const authorizeTenant = (req, res, next) => {
  if (!req.user) {
    return next(new AuthenticationError('Authentication required'));
  }

  const requestedTenantId = req.params.tenantId || req.body.tenantId || req.query.tenantId;

  if (!requestedTenantId) {
    return next(new ValidationError('Tenant ID is required'));
  }

  // Super admin can access all tenants
  if (req.user.role === 'super_admin') {
    req.tenantId = requestedTenantId;
    return next();
  }

  // Check if user belongs to the requested tenant
  if (req.user.tenant_id !== requestedTenantId) {
    return next(new AuthorizationError('Access denied to this tenant'));
  }

  req.tenantId = requestedTenantId;
  next();
};

// Resource ownership middleware
const authorizeResource = (resourceType, resourceIdField = 'id') => {
  return async (req, res, next) => {
    if (!req.user) {
      return next(new AuthenticationError('Authentication required'));
    }

    const resourceId = req.params[resourceIdField] || req.body[resourceIdField];

    if (!resourceId) {
      return next(new ValidationError(`${resourceIdField} is required`));
    }

    try {
      // Get resource from database
      const resource = await getResourceById(resourceType, resourceId);

      if (!resource) {
        return next(new ValidationError('Resource not found'));
      }

      // Super admin can access all resources
      if (req.user.role === 'super_admin') {
        req.resource = resource;
        return next();
      }

      // Check if user owns the resource or has access to it
      if (resource.user_id !== req.user.id && resource.tenant_id !== req.user.tenant_id) {
        return next(new AuthorizationError('Access denied to this resource'));
      }

      req.resource = resource;
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Rate limiting for authentication attempts
const rateLimitAuth = (req, res, next) => {
  const identifier = req.ip || req.connection.remoteAddress;
  const now = Date.now();

  if (!authAttempts.has(identifier)) {
    authAttempts.set(identifier, { count: 0, timestamp: now });
  }

  const attempts = authAttempts.get(identifier);

  // Reset if window has passed
  if (now - attempts.timestamp > AUTH_ATTEMPT_WINDOW) {
    attempts.count = 0;
    attempts.timestamp = now;
  }

  // Check if limit exceeded
  if (attempts.count >= MAX_AUTH_ATTEMPTS) {
    return res.status(429).json({
      error: 'Too many authentication attempts',
      message: 'Please try again later',
      retryAfter: Math.ceil((AUTH_ATTEMPT_WINDOW - (now - attempts.timestamp)) / 1000)
    });
  }

  // Increment attempt count
  attempts.count++;

  next();
};

// Generate JWT tokens
const generateTokens = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    tenantId: user.tenant_id,
    iat: Math.floor(Date.now() / 1000)
  };

  const accessToken = jwt.sign(payload, JWT_CONFIG.secret, {
    expiresIn: JWT_CONFIG.expiresIn,
    issuer: JWT_CONFIG.issuer,
    audience: JWT_CONFIG.audience
  });

  const refreshToken = jwt.sign(
    { ...payload, type: 'refresh' },
    JWT_CONFIG.secret,
    {
      expiresIn: JWT_CONFIG.refreshExpiresIn,
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience
    }
  );

  return { accessToken, refreshToken };
};

// Refresh token middleware
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new ValidationError('Refresh token is required');
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_CONFIG.secret, {
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience
    });

    if (decoded.type !== 'refresh') {
      throw new AuthenticationError('Invalid refresh token');
    }

    // Get user from database
    const user = await getUserById(decoded.userId);
    if (!user || !user.isActive) {
      throw new AuthenticationError('User not found or inactive');
    }

    // Generate new tokens
    const tokens = generateTokens(user);

    res.json({
      success: true,
      message: 'Tokens refreshed successfully',
      data: tokens
    });
  } catch (error) {
    next(error);
  }
};

// Logout middleware (blacklist token)
const logout = async (req, res, next) => {
  try {
    const { token } = req;

    if (token) {
      await blacklistToken(token);
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Database helper functions
async function getUserById (userId) {
  try {
    const User = require('../models/User');
    const user = await User.findById(userId).select('-password');
    return user;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return null;
  }
}

async function getResourceById (resourceType, resourceId) {
  try {
    // For now, return null as we're using MongoDB, not PostgreSQL
    // This function can be implemented later if needed for PostgreSQL
    return null;
  } catch (error) {
    console.error('Error getting resource by ID:', error);
    return null;
  }
}

async function checkTokenBlacklist (token) {
  try {
    const cacheManager = require('../utils/cache');
    const isBlacklisted = await cacheManager.get(`blacklist:${token}`);
    return !!isBlacklisted;
  } catch (error) {
    console.error('Error checking token blacklist:', error);
    return false;
  }
}

async function blacklistToken (token) {
  try {
    const cacheManager = require('../utils/cache');
    // Decode token to get expiration
    const decoded = jwt.decode(token);
    const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);

    if (expiresIn > 0) {
      await cacheManager.set(`blacklist:${token}`, '1', expiresIn);
    }
  } catch (error) {
    console.error('Error blacklisting token:', error);
  }
}

// Password hashing and verification
const hashPassword = async (password) => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

const verifyPassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

// Export middleware and utilities
module.exports = {
  authenticateToken,
  optionalAuth,
  authorizeRoles,
  requireAdmin,
  authorizeTenant,
  authorizeResource,
  rateLimitAuth,
  generateTokens,
  refreshToken,
  logout,
  hashPassword,
  verifyPassword,
  AuthenticationError,
  AuthorizationError,
  ValidationError
};
