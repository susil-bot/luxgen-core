const express = require('express');
const router = express.Router();
const userRegistrationController = require('../controllers/userRegistrationController');
const { authenticateToken } = require('../middleware/auth');

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