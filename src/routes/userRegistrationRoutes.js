const express = require('express');
const router = express.Router();
const userRegistrationController = require('../controllers/userRegistrationController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Public routes (no authentication required)
router.post('/register', userRegistrationController.registerUser);
router.get('/verify/:token', userRegistrationController.verifyEmail);
router.post('/resend-verification', userRegistrationController.resendVerificationEmail);
router.get('/status/:registrationId', userRegistrationController.getRegistrationStatus);

// Protected routes (authentication required)
router.put('/step/:registrationId', authenticateToken, userRegistrationController.updateRegistrationStep);

// Admin routes
router.get('/pending/:tenantId', requireAdmin, userRegistrationController.getPendingRegistrations);
router.post('/approve/:registrationId', requireAdmin, userRegistrationController.approveRegistration);
router.post('/reject/:registrationId', requireAdmin, userRegistrationController.rejectRegistration);

module.exports = router; 