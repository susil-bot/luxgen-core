const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const logger = require('../utils/logger');

class AuthService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
    this.jwtRefreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
    this.bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  }

  /**
   * Register a new user
   */
  async register(userData) {
    try {
      const { email, password, firstName, lastName, phone, company, role } = userData;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Create user (password will be hashed by User model pre-save middleware)
      const user = new User({
        email,
        password: password,
        firstName,
        lastName,
        phone,
        company,
        role: role || 'user',
        isActive: true,
        isEmailVerified: true // Skip email verification for now
      });

      await user.save();

      // Generate JWT token
      const token = this.generateToken(user);

      logger.info(`User registered: ${user.email}`);

      return {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isActive: user.isActive
        },
        token
      };
    } catch (error) {
      logger.error('User registration failed:', error);
      throw error;
    }
  }

  /**
   * User login
   */
  async login(email, password) {
    try {
      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Check if user is active
      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }

      // Verify password using User model method
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate JWT token
      const token = this.generateToken(user);

      logger.info(`User logged in: ${user.email}`);

      return {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isActive: user.isActive
        },
        token
      };
    } catch (error) {
      logger.error('User login failed:', error);
      throw error;
    }
  }

  /**
   * User logout
   */
  async logout(userId) {
    try {
      // In a real application, you might want to blacklist the token
      // For now, we'll just log the logout
      logger.info(`User logged out: ${userId}`);
      return { success: true };
    } catch (error) {
      logger.error('Logout failed:', error);
      throw error;
    }
  }

  /**
   * Refresh token
   */
  async refreshToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, this.jwtSecret);
      
      // Find user
      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        throw new Error('Invalid refresh token');
      }

      // Generate new token
      const newToken = this.generateToken(user);

      return {
        token: newToken,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isActive: user.isActive
        }
      };
    } catch (error) {
      logger.error('Token refresh failed:', error);
      throw error;
    }
  }

  /**
   * Forgot password
   */
  async forgotPassword(email) {
    try {
      const user = await User.findOne({ email });
      if (!user) {
        throw new Error('User not found');
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      user.passwordResetToken = resetToken;
      user.passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour
      await user.save();

      // In a real application, you would send an email here
      logger.info(`Password reset token generated for user: ${user.email}`);

      return { success: true };
    } catch (error) {
      logger.error('Forgot password failed:', error);
      throw error;
    }
  }

  /**
   * Reset password
   */
  async resetPassword(token, newPassword) {
    try {
      const user = await User.findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: new Date() }
      });

      if (!user) {
        throw new Error('Invalid or expired reset token');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, this.bcryptRounds);
      
      // Update user
      user.password = hashedPassword;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      logger.info(`Password reset for user: ${user.email}`);

      return { success: true };
    } catch (error) {
      logger.error('Password reset failed:', error);
      throw error;
    }
  }

  /**
   * Generate JWT token
   */
  generateToken(user) {
    const payload = {
      userId: user._id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId
    };

    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn,
      issuer: 'luxgen-trainer-platform',
      audience: 'luxgen-users'
    });
  }

  /**
   * Verify JWT token
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}

// Create and export singleton instance
const authService = new AuthService();
module.exports = authService;