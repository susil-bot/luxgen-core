const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Tenant = require('../models/Tenant');

// Generate JWT token
const generateToken = (userId, tenantId) => {
  return jwt.sign(
    { userId, tenantId },
    process.env.JWT_SECRET || 'your-jwt-secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Generate refresh token
const generateRefreshToken = (userId, tenantId) => {
  return jwt.sign(
    { userId, tenantId, type: 'refresh' },
    process.env.JWT_SECRET || 'your-jwt-secret',
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
  );
};

// User registration
const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role = 'user', tenantId } = req.body;

    // Use detected tenant from middleware, or fallback to provided tenantId
    let tenant = req.tenant;
    let finalTenantId = req.tenantId;

    // If no detected tenant, try to find by provided tenantId
    if (!tenant && tenantId) {
      tenant = await Tenant.findOne({ slug: tenantId }) || await Tenant.findById(tenantId);
      if (tenant) {
        finalTenantId = tenant._id.toString();
      }
    }

    // If still no tenant, use default tenant
    if (!tenant) {
      tenant = await Tenant.findOne({ slug: 'luxgen' });
      if (!tenant) {
        return res.status(400).json({
          success: false,
          error: 'No tenant found',
          message: 'Please specify a valid tenant or contact administrator'
        });
      }
      finalTenantId = tenant._id.toString();
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email, tenantId: finalTenantId });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists',
        message: 'A user with this email already exists in this tenant'
      });
    }

    // Create new user
    const user = new User({
      firstName,
      lastName,
      email,
      password,
      role,
      tenantId: finalTenantId
    });

    await user.save();

    // Generate tokens
    const token = generateToken(user._id, user.tenantId);
    const refreshToken = generateRefreshToken(user._id, user.tenantId);

    // Update tenant stats
    await Tenant.findByIdAndUpdate(tenant._id, {
      $inc: { 'stats.totalUsers': 1, 'stats.activeUsers': 1 }
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: user.getPublicProfile(),
        token,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      message: 'An error occurred during registration'
    });
  }
};

// User login
const login = async (req, res) => {
  try {
    const { email, password, tenantId } = req.body;

    // Use detected tenant from middleware, or fallback to provided tenantId
    let finalTenantId = req.tenantId;
    
    // If no detected tenant, try to find by provided tenantId
    if (!finalTenantId && tenantId) {
      const tenant = await Tenant.findOne({ slug: tenantId }) || await Tenant.findById(tenantId);
      if (tenant) {
        finalTenantId = tenant._id.toString();
      }
    }

    // Find user by email and tenant (or just by email if no tenant specified)
    const user = await User.findOne(finalTenantId ? { email, tenantId: finalTenantId } : { email });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Account disabled',
        message: 'Your account has been disabled'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const token = generateToken(user._id, user.tenantId);
    const refreshToken = generateRefreshToken(user._id, user.tenantId);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.getPublicProfile(),
        token,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
      message: 'An error occurred during login'
    });
  }
};

// User logout
const logout = async (req, res) => {
  try {
    // In a real application, you would blacklist the token
    // For now, we'll just return success
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed',
      message: 'An error occurred during logout'
    });
  }
};

// Refresh token
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token required',
        message: 'Please provide a refresh token'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET || 'your-jwt-secret');
    
    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token type',
        message: 'Invalid refresh token'
      });
    }

    // Find user
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
        message: 'User not found or inactive'
      });
    }

    // Generate new tokens
    const newToken = generateToken(user._id, user.tenantId);
    const newRefreshToken = generateRefreshToken(user._id, user.tenantId);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token: newToken,
        refreshToken: newRefreshToken
      }
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      error: 'Token refresh failed',
      message: 'Invalid or expired refresh token'
    });
  }
};

// Get current user
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user',
      message: 'An error occurred while fetching user data'
    });
  }
};

// Forgot password
const forgotPassword = async (req, res) => {
  try {
    const { email, tenantId } = req.body;

    const user = await User.findOne({ email, tenantId });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'No user found with this email in this tenant'
      });
    }

    // Generate reset token (in a real app, you'd send this via email)
    const resetToken = jwt.sign(
      { userId: user._id, type: 'password-reset' },
      process.env.JWT_SECRET || 'your-jwt-secret',
      { expiresIn: '1h' }
    );

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    res.json({
      success: true,
      message: 'Password reset token generated',
      data: {
        resetToken // In production, this would be sent via email
      }
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      error: 'Password reset failed',
      message: 'An error occurred during password reset'
    });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Verify reset token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret');
    
    if (decoded.type !== 'password-reset') {
      return res.status(400).json({
        success: false,
        error: 'Invalid token',
        message: 'Invalid password reset token'
      });
    }

    // Find user
    const user = await User.findOne({
      _id: decoded.userId,
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired token',
        message: 'Password reset token is invalid or expired'
      });
    }

    // Update password
    user.password = newPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      error: 'Password reset failed',
      message: 'An error occurred during password reset'
    });
  }
};

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  getCurrentUser,
  forgotPassword,
  resetPassword
};