const express = require('express');
// Removed express-validator due to security vulnerabilities
// Using custom validation instead
const authController = require('../controllers/authController');

const router = express.Router();

// Custom validation middleware (replaces express-validator)
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];
  
  if (!email || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
    errors.push({ field: 'email', message: 'Please provide a valid email address' });
  }
  
  if (!password || password.trim().length === 0) {
    errors.push({ field: 'password', message: 'Password is required' });
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors
    });
  }
  
  next();
};

const validateRegister = (req, res, next) => {
  const { firstName, lastName, email, password } = req.body;
  const errors = [];
  
  if (!firstName || firstName.trim().length < 2 || firstName.trim().length > 50) {
    errors.push({ field: 'firstName', message: 'First name must be between 2 and 50 characters' });
  }
  
  if (!lastName || lastName.trim().length < 2 || lastName.trim().length > 50) {
    errors.push({ field: 'lastName', message: 'Last name must be between 2 and 50 characters' });
  }
  
  if (!email || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
    errors.push({ field: 'email', message: 'Please provide a valid email address' });
  }
  
  if (!password || password.length < 6) {
    errors.push({ field: 'password', message: 'Password must be at least 6 characters long' });
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors
    });
  }
  
  next();
};

// Routes
router.post('/login', validateLogin, authController.login);
router.post('/register', validateRegister, authController.register);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refreshToken);
router.get('/me', authController.getCurrentUser);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;