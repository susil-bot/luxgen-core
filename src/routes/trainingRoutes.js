const express = require('express');
const router = express.Router();
const trainingController = require('../controllers/trainingController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');


// ==================== TRAINING SESSIONS ====================

/**
 * @route GET /api/v1/training/sessions
 * @desc Get all training sessions
 * @access Private
 */
router.get('/sessions',
  authenticateToken,
  trainingController.getTrainingSessions
);

/**
 * @route GET /api/v1/training/sessions/:sessionId
 * @desc Get training session by ID
 * @access Private
 */
router.get('/sessions/:sessionId',
  authenticateToken,
  trainingController.getTrainingSession
);

/**
 * @route POST /api/v1/training/sessions
 * @desc Create new training session
 * @access Private (Admin/Trainer)
 */
router.post('/sessions',
  authenticateToken,
  authorizeRoles('admin', 'trainer'),
  validateRequest,
  trainingController.createTrainingSession
);

/**
 * @route PUT /api/v1/training/sessions/:sessionId
 * @desc Update training session
 * @access Private (Admin/Trainer)
 */
router.put('/sessions/:sessionId',
  authenticateToken,
  authorizeRoles('admin', 'trainer'),
  validateRequest,
  trainingController.updateTrainingSession
);

/**
 * @route DELETE /api/v1/training/sessions/:sessionId
 * @desc Delete training session
 * @access Private (Admin)
 */
router.delete('/sessions/:sessionId',
  authenticateToken,
  authorizeRoles('admin'),
  trainingController.deleteTrainingSession
);

/**
 * @route POST /api/v1/training/sessions/:sessionId/participants
 * @desc Add participant to training session
 * @access Private (Admin/Trainer)
 */
router.post('/sessions/:sessionId/participants',
  authenticateToken,
  authorizeRoles('admin', 'trainer'),
  validateRequest,
  trainingController.addSessionParticipant
);

/**
 * @route DELETE /api/v1/training/sessions/:sessionId/participants/:userId
 * @desc Remove participant from training session
 * @access Private (Admin/Trainer)
 */
router.delete('/sessions/:sessionId/participants/:userId',
  authenticateToken,
  authorizeRoles('admin', 'trainer'),
  trainingController.removeSessionParticipant
);

/**
 * @route POST /api/v1/training/sessions/:sessionId/attendance/:userId
 * @desc Mark attendance for participant
 * @access Private (Admin/Trainer)
 */
router.post('/sessions/:sessionId/attendance/:userId',
  authenticateToken,
  authorizeRoles('admin', 'trainer'),
  trainingController.markAttendance
);

/**
 * @route POST /api/v1/training/sessions/:sessionId/complete
 * @desc Complete training session
 * @access Private (Admin/Trainer)
 */
router.post('/sessions/:sessionId/complete',
  authenticateToken,
  authorizeRoles('admin', 'trainer'),
  trainingController.completeSession
);


// ==================== TRAINING COURSES ====================

/**
 * @route GET /api/v1/training/courses
 * @desc Get all training courses
 * @access Private
 */
router.get('/courses',
  authenticateToken,
  trainingController.getTrainingCourses
);

/**
 * @route GET /api/v1/training/courses/:courseId
 * @desc Get training course by ID
 * @access Private
 */
router.get('/courses/:courseId',
  authenticateToken,
  trainingController.getTrainingCourse
);

/**
 * @route POST /api/v1/training/courses
 * @desc Create new training course
 * @access Private (Admin/Trainer)
 */
router.post('/courses',
  authenticateToken,
  authorizeRoles('admin', 'trainer'),
  validateRequest,
  trainingController.createTrainingCourse
);

/**
 * @route PUT /api/v1/training/courses/:courseId
 * @desc Update training course
 * @access Private (Admin/Trainer)
 */
router.put('/courses/:courseId',
  authenticateToken,
  authorizeRoles('admin', 'trainer'),
  validateRequest,
  trainingController.updateTrainingCourse
);

/**
 * @route DELETE /api/v1/training/courses/:courseId
 * @desc Delete training course
 * @access Private (Admin)
 */
router.delete('/courses/:courseId',
  authenticateToken,
  authorizeRoles('admin'),
  trainingController.deleteTrainingCourse
);

/**
 * @route POST /api/v1/training/courses/:courseId/enroll
 * @desc Enroll user in course
 * @access Private
 */
router.post('/courses/:courseId/enroll',
  authenticateToken,
  validateRequest,
  trainingController.enrollInCourse
);

/**
 * @route GET /api/v1/training/courses/:courseId/participants/:participantId/progress
 * @desc Get participant progress
 * @access Private
 */
router.get('/courses/:courseId/participants/:participantId/progress',
  authenticateToken,
  trainingController.getParticipantProgress
);

/**
 * @route POST /api/v1/training/courses/:courseId/modules/:moduleId/complete
 * @desc Complete module
 * @access Private
 */
router.post('/courses/:courseId/modules/:moduleId/complete',
  authenticateToken,
  validateRequest,
  trainingController.completeModule
);


// ==================== TRAINING MODULES ====================

/**
 * @route GET /api/v1/training/modules
 * @desc Get all training modules
 * @access Private
 */
router.get('/modules',
  authenticateToken,
  trainingController.getTrainingModules
);

/**
 * @route GET /api/v1/training/modules/:moduleId
 * @desc Get training module by ID
 * @access Private
 */
router.get('/modules/:moduleId',
  authenticateToken,
  trainingController.getTrainingModule
);

/**
 * @route POST /api/v1/training/modules
 * @desc Create new training module
 * @access Private (Admin/Trainer)
 */
router.post('/modules',
  authenticateToken,
  authorizeRoles('admin', 'trainer'),
  validateRequest,
  trainingController.createTrainingModule
);

/**
 * @route PUT /api/v1/training/modules/:moduleId
 * @desc Update training module
 * @access Private (Admin/Trainer)
 */
router.put('/modules/:moduleId',
  authenticateToken,
  authorizeRoles('admin', 'trainer'),
  validateRequest,
  trainingController.updateTrainingModule
);

/**
 * @route DELETE /api/v1/training/modules/:moduleId
 * @desc Delete training module
 * @access Private (Admin)
 */
router.delete('/modules/:moduleId',
  authenticateToken,
  authorizeRoles('admin'),
  trainingController.deleteTrainingModule
);


// ==================== TRAINING ASSESSMENTS ====================

/**
 * @route GET /api/v1/training/assessments
 * @desc Get all training assessments
 * @access Private
 */
router.get('/assessments',
  authenticateToken,
  trainingController.getTrainingAssessments
);

/**
 * @route GET /api/v1/training/assessments/:assessmentId
 * @desc Get training assessment by ID
 * @access Private
 */
router.get('/assessments/:assessmentId',
  authenticateToken,
  trainingController.getTrainingAssessment
);

/**
 * @route POST /api/v1/training/assessments
 * @desc Create new training assessment
 * @access Private (Admin/Trainer)
 */
router.post('/assessments',
  authenticateToken,
  authorizeRoles('admin', 'trainer'),
  validateRequest,
  trainingController.createTrainingAssessment
);

/**
 * @route PUT /api/v1/training/assessments/:assessmentId
 * @desc Update training assessment
 * @access Private (Admin/Trainer)
 */
router.put('/assessments/:assessmentId',
  authenticateToken,
  authorizeRoles('admin', 'trainer'),
  validateRequest,
  trainingController.updateTrainingAssessment
);

/**
 * @route DELETE /api/v1/training/assessments/:assessmentId
 * @desc Delete training assessment
 * @access Private (Admin)
 */
router.delete('/assessments/:assessmentId',
  authenticateToken,
  authorizeRoles('admin'),
  trainingController.deleteTrainingAssessment
);

/**
 * @route POST /api/v1/training/assessments/:assessmentId/submit
 * @desc Submit assessment answers
 * @access Private
 */
router.post('/assessments/:assessmentId/submit',
  authenticateToken,
  validateRequest,
  trainingController.submitAssessment
);


// ==================== TRAINING STATISTICS ====================

/**
 * @route GET /api/v1/training/trainers/:trainerId/stats
 * @desc Get trainer statistics
 * @access Private (Admin/Trainer)
 */
router.get('/trainers/:trainerId/stats',
  authenticateToken,
  authorizeRoles('admin', 'trainer'),
  trainingController.getTrainerStats
);

/**
 * @route GET /api/v1/training/participants/:participantId/stats
 * @desc Get participant statistics
 * @access Private
 */
router.get('/participants/:participantId/stats',
  authenticateToken,
  trainingController.getParticipantStats
);

module.exports = router;
