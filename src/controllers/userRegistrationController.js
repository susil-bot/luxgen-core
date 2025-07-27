const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const logger = require('../utils/logger');
const emailService = require('../services/emailService');

/**
 * Register a new user with multi-tenant support
 */
exports.registerUser = async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      company,
      role,
      marketingConsent,
      tenantSlug,  // New: Allow tenant selection
      tenantId     // New: Alternative tenant identification
    } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: email, password, firstName, lastName'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Check if user already exists (globally)
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
        errorCode: 'EMAIL_ALREADY_EXISTS',
        suggestion: 'Try logging in instead or use a different email address'
      });
    }

    // Multi-tenant logic: Find the correct tenant
    let tenant;
    
    if (tenantId) {
      // Direct tenant ID provided
      tenant = await require('../models/Tenant').findOne({ 
        _id: tenantId, 
        isActive: true, 
        isDeleted: { $ne: true } 
      });
    } else if (tenantSlug) {
      // Tenant slug provided
      tenant = await require('../models/Tenant').findOne({ 
        slug: tenantSlug, 
        isActive: true, 
        isDeleted: { $ne: true } 
      });
    } else {
      // Fallback to default tenant (for backward compatibility)
      tenant = await require('../models/Tenant').findOne({ 
        isActive: true, 
        isDeleted: { $ne: true } 
      });
    }

    if (!tenant) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or inactive tenant. Please provide a valid tenant slug or contact administrator.'
      });
    }

    // Check if user already exists in this specific tenant
    const existingTenantUser = await User.findOne({ 
      email, 
      tenantId: tenant._id 
    });
    
    if (existingTenantUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists in this organization'
      });
    }

    // Create user with tenant association
    const user = new User({
      tenantId: tenant._id,
      firstName,
      lastName,
      email,
      password,
      role: role || 'user',
      phone,
      company,
      marketingConsent: marketingConsent || false,
      isActive: true,
      isVerified: true, // Skip email verification for now
      lastLogin: new Date(),
      registrationSource: 'api',
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
      deviceType: req.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'desktop'
    });

    await user.save();

    // Generate JWT token with tenant information
    const jwtToken = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        role: user.role, 
        tenantId: user.tenantId,
        tenantSlug: tenant.slug
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { 
        expiresIn: '24h',
        issuer: 'trainer-platform',
        audience: 'trainer-platform-users'
      }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isActive: user.isActive,
          tenant: {
            id: tenant._id,
            name: tenant.name,
            slug: tenant.slug
          }
        },
        token: jwtToken
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};

/**
 * Verify email
 */
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({ emailVerificationToken: token });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    // Verify email
    user.verifyEmail();
    await user.save();

    // Get tenant information
    const tenant = await require('../models/Tenant').findById(user.tenantId);

    // Generate JWT token with tenant information
    const jwtToken = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        role: user.role, 
        tenantId: user.tenantId,
        tenantSlug: tenant?.slug
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { 
        expiresIn: '24h',
        issuer: 'trainer-platform',
        audience: 'trainer-platform-users'
      }
    );

    res.json({
      success: true,
      message: 'Email verified successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isActive: user.isActive
        },
        token: jwtToken
      }
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Email verification failed',
      error: error.message
    });
  }
};

/**
 * Resend verification email
 */
exports.resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Generate new verification token
    user.generateEmailVerificationToken();
    await user.save();

    // Send verification email (implement email service)
    // await sendVerificationEmail(user.email, user.emailVerificationToken);

    res.json({
      success: true,
      message: 'Verification email sent successfully'
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend verification email',
      error: error.message
    });
  }
};

/**
 * Forgot password
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate password reset token
    user.generatePasswordResetToken();
    await user.save();

    // Send password reset email (implement email service)
    // await sendPasswordResetEmail(user.email, user.passwordResetToken);

    res.json({
      success: true,
      message: 'Password reset email sent successfully'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send password reset email',
      error: error.message
    });
  }
};

/**
 * Reset password
 */
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    const user = await User.findOne({ passwordResetToken: token });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Reset password
    user.resetPassword(newPassword);
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: error.message
    });
  }
};

/**
 * Get user profile
 */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
      error: error.message
    });
  }
};

/**
 * Update user profile
 */
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update allowed fields
    const allowedFields = ['firstName', 'lastName', 'phone', 'company', 'jobTitle', 'department', 'bio', 'addresses', 'preferences'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

/**
 * Change password
 */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message
    });
  }
};

/**
 * Login user
 */
exports.loginUser = async (req, res) => {
  const startTime = Date.now();
  const { email, password } = req.body;
  
  // Log login attempt
  console.log(`🔐 Login attempt for email: ${email}`);
  logger.info(`🔐 Login attempt for email: ${email}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  try {
    // Validate required fields
    if (!email || !password) {
      console.log(`❌ Login failed: Missing email or password for ${email}`);
      logger.warn(`❌ Login failed: Missing email or password for ${email}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      });
      
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log(`❌ Login failed: Invalid email format for ${email}`);
      logger.warn(`❌ Login failed: Invalid email format for ${email}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      });
      
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Find user by email
    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      console.log(`❌ Login failed: User not found or inactive for ${email}`);
      logger.warn(`❌ Login failed: User not found or inactive for ${email}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      });
      
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    console.log(`👤 User found: ${user.firstName} ${user.lastName} (${user.role})`);

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log(`❌ Login failed: Invalid password for ${email}`);
      logger.warn(`❌ Login failed: Invalid password for ${email}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: user._id,
        timestamp: new Date().toISOString()
      });
      
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    console.log(`✅ Password verified for user: ${user.email}`);

    // Update last login
    user.lastLogin = new Date();
    await user.save();
    console.log(`📅 Last login updated for user: ${user.email}`);

    // Get tenant information
    const tenant = await require('../models/Tenant').findById(user.tenantId);
    if (tenant) {
      console.log(`🏢 Tenant found: ${tenant.name} (${tenant.slug})`);
    } else {
      console.log(`⚠️ No tenant found for user: ${user.email}`);
    }

    // Generate JWT token with tenant information
    const jwtToken = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        role: user.role, 
        tenantId: user.tenantId,
        tenantSlug: tenant?.slug
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { 
        expiresIn: '24h',
        issuer: 'trainer-platform',
        audience: 'trainer-platform-users'
      }
    );

    const responseTime = Date.now() - startTime;
    console.log(`🎉 Login successful for ${email} (${responseTime}ms)`);
    
    // Log successful login
    logger.info(`🎉 Login successful for ${email}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: user._id,
      role: user.role,
      tenantId: user.tenantId,
      tenantSlug: tenant?.slug,
      responseTime,
      timestamp: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isActive: user.isActive,
          isVerified: user.isVerified,
          tenant: {
            id: tenant?._id,
            name: tenant?.name,
            slug: tenant?.slug
          }
        },
        token: jwtToken
      }
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`💥 Login error for ${email}:`, error.message);
    console.error(`⏱️ Response time: ${responseTime}ms`);
    
    // Log login error
    logger.error(`💥 Login error for ${email}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      error: error.message,
      responseTime,
      timestamp: new Date().toISOString()
    });
    
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

/**
 * Logout user
 */
exports.logout = async (req, res) => {
  try {
    const token = req.token;
    
    if (token) {
      // In a production environment, you would blacklist the token
      // For now, we'll just return success
      console.log(`🔓 Logout successful for user: ${req.user.email}`);
      
      logger.info(`🔓 Logout successful for user: ${req.user.email}`, {
        userId: req.user._id,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('💥 Logout error:', error.message);
    
    logger.error(`💥 Logout error for user: ${req.user?.email}`, {
      userId: req.user?._id,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      error: error.message,
      timestamp: new Date().toISOString()
    });
    
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error.message
    });
  }
};

/**
 * Verify email address
 */
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    // Find user by verification token
    const user = await User.findOne({ 
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    // Update user verification status
    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    user.verifiedAt = new Date();
    await user.save();

    logger.info(`Email verified for user: ${user.email}`, {
      userId: user._id,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    logger.error('Error verifying email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify email',
      error: error.message
    });
  }
};

/**
 * Resend verification email
 */
exports.resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await user.save();

    // Send verification email
    await emailService.sendVerificationEmail(user.email, verificationToken);

    logger.info(`Verification email resent to: ${email}`, {
      userId: user._id,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Verification email sent successfully'
    });
  } catch (error) {
    logger.error('Error resending verification email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend verification email',
      error: error.message
    });
  }
};

/**
 * Forgot password
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent'
      });
    }

    // Generate password reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    // Send password reset email
    await emailService.sendPasswordResetEmail(user.email, resetToken);

    logger.info(`Password reset email sent to: ${email}`, {
      userId: user._id,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent'
    });
  } catch (error) {
    logger.error('Error sending password reset email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send password reset email',
      error: error.message
    });
  }
};

/**
 * Reset password
 */
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Find user by reset token
    const user = await User.findOne({ 
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);
    user.password = hashedPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordChangedAt = new Date();
    await user.save();

    logger.info(`Password reset successful for user: ${user.email}`, {
      userId: user._id,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    logger.error('Error resetting password:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: error.message
    });
  }
};

/**
 * Refresh token
 */
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'your_jwt_secret_key_here_2024');

    // Find user
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Generate new access token
    const newToken = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId
      },
      process.env.JWT_SECRET || 'your-secret-key',
      {
        expiresIn: '24h',
        issuer: 'trainer-platform',
        audience: 'trainer-platform-users'
      }
    );

    logger.info(`Token refreshed for user: ${user.email}`, {
      userId: user._id,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token: newToken
      }
    });
  } catch (error) {
    logger.error('Error refreshing token:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token',
      error: error.message
    });
  }
};