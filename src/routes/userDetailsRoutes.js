const express = require('express');
const router = express.Router();
const userDetailsController = require('../controllers/userDetailsController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// User details management
router.get('/:userId', userDetailsController.getUserDetails);
router.put('/:userId', userDetailsController.updateUserDetails);

// Profile components
router.post('/:userId/skills', userDetailsController.addSkill);
router.post('/:userId/certifications', userDetailsController.addCertification);
router.post('/:userId/work-experience', userDetailsController.addWorkExperience);
router.post('/:userId/education', userDetailsController.addEducation);

// Preferences
router.put('/:userId/preferences', userDetailsController.updatePreferences);

// Public profile (no authentication required for viewing)
router.get('/public/:userId', userDetailsController.getPublicProfile);

// Activity tracking
router.post('/:userId/activity', userDetailsController.updateLastActivity);

// Search and discovery (admin only)
router.get('/search/skills', requireAdmin, userDetailsController.searchBySkills);
router.get('/complete-profiles', requireAdmin, userDetailsController.getCompleteProfiles);

module.exports = router; 