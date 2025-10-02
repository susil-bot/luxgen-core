const authService = require('../services/authService');
const { asyncHandler } = require('../utils/errors');
const logger = require('../utils/logger');

class AuthController {
  /**
   * User login
   */
  async login(req, res) {
    const { email, password } = req.body;

    logger.info(`Login attempt for email: ${email}`);

    try {
      const result = await authService.login(email, password);
      res.json({
        success: true,
        data: result,
        message: 'Login successful'
      });
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  /**
   * User registration
   */
  async register(req, res) {
    const { email, password, firstName, lastName, phone, company, role } = req.body;

    logger.info(`Registration attempt for email: ${email}`);

    try {
      const result = await authService.register({
        email,
        password,
        firstName,
        lastName,
        phone,
        company,
        role
      });

      res.status(201).json({
        success: true,
        data: result,
        message: 'Registration successful'
      });
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * User logout
   */
  async logout(req, res) {
    const { userId } = req.user;

    logger.info(`Logout for user: ${userId}`);

    try {
      await authService.logout(userId);
      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      logger.error('Logout error:', error);
      throw error;
    }
  }

  /**
   * Refresh token
   */
  async refreshToken(req, res) {
    const { refreshToken } = req.body;

    logger.info('Token refresh attempt');

    try {
      const result = await authService.refreshToken(refreshToken);
      res.json({
        success: true,
        data: result,
        message: 'Token refreshed successfully'
      });
    } catch (error) {
      logger.error('Token refresh error:', error);
      throw error;
    }
  }

  /**
   * Forgot password
   */
  async forgotPassword(req, res) {
    const { email } = req.body;

    logger.info(`Forgot password request for email: ${email}`);

    try {
      await authService.forgotPassword(email);
      res.json({
        success: true,
        message: 'Password reset email sent successfully'
      });
    } catch (error) {
      logger.error('Forgot password error:', error);
      throw error;
    }
  }

  /**
   * Reset password
   */
  async resetPassword(req, res) {
    const { token, newPassword } = req.body;

    logger.info('Password reset attempt');

    try {
      await authService.resetPassword(token, newPassword);
      res.json({
        success: true,
        message: 'Password reset successfully'
      });
    } catch (error) {
      logger.error('Password reset error:', error);
      throw error;
    }
  }
}

// Create controller instance
const authController = new AuthController();

// Export wrapped methods with error handling
module.exports = {
  login: asyncHandler(authController.login.bind(authController)),
  register: asyncHandler(authController.register.bind(authController)),
  logout: asyncHandler(authController.logout.bind(authController)),
  refreshToken: asyncHandler(authController.refreshToken.bind(authController)),
  forgotPassword: asyncHandler(authController.forgotPassword.bind(authController)),
  resetPassword: asyncHandler(authController.resetPassword.bind(authController))
};
