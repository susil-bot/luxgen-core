const express = require('express');
const router = express.Router();
const userRegistrationController = require('../controllers/userRegistrationController');
const { authenticateToken } = require('../middleware/auth');


// Logging middleware for route calls
const logRouteCall = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const { method, path, ip } = req;
  const userAgent = req.get('User-Agent');

  console.log(`🌐 Route called: ${method} ${path}`);
  console.log(`📍 IP: ${ip}`);
  console.log(`🕐 Timestamp: ${timestamp}`);
  console.log(`🔍 User-Agent: ${userAgent}`);


  // Log request body for login attempts (without sensitive data)
  if (path === '/login' && method === 'POST') {
    const { email } = req.body;
    console.log(`🔐 Login request for email: ${email || 'not provided'}`);
  }

  console.log('---');

  next();
};


// Apply logging middleware to all routes
router.use(logRouteCall);


// Public routes (no authentication required)
router.post('/register', userRegistrationController.registerUser);
router.post('/login', userRegistrationController.loginUser);
router.get('/verify/:token', userRegistrationController.verifyEmail);
router.post('/resend-verification', userRegistrationController.resendVerificationEmail);
router.post('/forgot-password', userRegistrationController.forgotPassword);
router.post('/reset-password/:token', userRegistrationController.resetPassword);


// Protected routes (authentication required)
router.get('/profile', authenticateToken, userRegistrationController.getProfile);
router.put('/profile', authenticateToken, userRegistrationController.updateProfile);
router.post('/change-password', authenticateToken, userRegistrationController.changePassword);

module.exports = router;
