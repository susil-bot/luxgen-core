const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { authLogger } = require('../utils/logger');

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
        message: 'User with this email already exists'
      });
    }

    // Multi-tenant logic: Find the correct tenant
    let tenant;
    
    if (tenantId) {
      // Direct tenant ID provided
      tenant = await require('../models/Tenant').findOne({ 
        _id: tenantId, 
        status: 'active', 
        isDeleted: false 
      });
    } else if (tenantSlug) {
      // Tenant slug provided
      tenant = await require('../models/Tenant').findOne({ 
        slug: tenantSlug, 
        status: 'active', 
        isDeleted: false 
      });
    } else {
      // Fallback to default tenant (for backward compatibility)
      tenant = await require('../models/Tenant').findOne({ 
        status: 'active', 
        isDeleted: false 
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
      { expiresIn: '24h' }
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
      { expiresIn: '24h' }
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
  authLogger.login(email, false, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  try {
    // Validate required fields
    if (!email || !password) {
      console.log(`❌ Login failed: Missing email or password for ${email}`);
      authLogger.failed(email, 'Missing email or password', {
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
      authLogger.failed(email, 'Invalid email format', {
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
      authLogger.failed(email, 'User not found or inactive', {
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
      authLogger.failed(email, 'Invalid password', {
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
      { expiresIn: '24h' }
    );

    const responseTime = Date.now() - startTime;
    console.log(`🎉 Login successful for ${email} (${responseTime}ms)`);
    
    // Log successful login
    authLogger.login(email, true, {
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
    authLogger.failed(email, 'Server error', {
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