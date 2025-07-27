const express = require('express');
const router = express.Router();
const presentationController = require('../controllers/presentationController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');


// ==================== PRESENTATIONS ====================

/**
 * @route GET /api/v1/presentations
 * @desc Get all presentations
 * @access Private
 */
router.get('/',
  authenticateToken,
  presentationController.getPresentations
);

/**
 * @route GET /api/v1/presentations/:presentationId
 * @desc Get presentation by ID
 * @access Private
 */
router.get('/:presentationId',
  authenticateToken,
  presentationController.getPresentation
);

/**
 * @route POST /api/v1/presentations
 * @desc Create new presentation
 * @access Private (Admin/Trainer)
 */
router.post('/',
  authenticateToken,
  authorizeRoles('admin', 'trainer'),
  validateRequest,
  presentationController.createPresentation
);

/**
 * @route PUT /api/v1/presentations/:presentationId
 * @desc Update presentation
 * @access Private (Admin/Trainer)
 */
router.put('/:presentationId',
  authenticateToken,
  authorizeRoles('admin', 'trainer'),
  validateRequest,
  presentationController.updatePresentation
);

/**
 * @route DELETE /api/v1/presentations/:presentationId
 * @desc Delete presentation
 * @access Private (Admin)
 */
router.delete('/:presentationId',
  authenticateToken,
  authorizeRoles('admin'),
  presentationController.deletePresentation
);


// ==================== PRESENTATION SESSIONS ====================

/**
 * @route POST /api/v1/presentations/:presentationId/start
 * @desc Start presentation session
 * @access Private (Admin/Trainer)
 */
router.post('/:presentationId/start',
  authenticateToken,
  authorizeRoles('admin', 'trainer'),
  validateRequest,
  presentationController.startPresentation
);

/**
 * @route POST /api/v1/presentations/:presentationId/end/:sessionId
 * @desc End presentation session
 * @access Private (Admin/Trainer)
 */
router.post('/:presentationId/end/:sessionId',
  authenticateToken,
  authorizeRoles('admin', 'trainer'),
  presentationController.endPresentation
);

/**
 * @route POST /api/v1/presentations/:presentationId/sessions/:sessionId/participants
 * @desc Add participant to presentation session
 * @access Private (Admin/Trainer)
 */
router.post('/:presentationId/sessions/:sessionId/participants',
  authenticateToken,
  authorizeRoles('admin', 'trainer'),
  validateRequest,
  presentationController.addSessionParticipant
);

/**
 * @route DELETE /api/v1/presentations/:presentationId/sessions/:sessionId/participants/:userId
 * @desc Remove participant from presentation session
 * @access Private (Admin/Trainer)
 */
router.delete('/:presentationId/sessions/:sessionId/participants/:userId',
  authenticateToken,
  authorizeRoles('admin', 'trainer'),
  presentationController.removeSessionParticipant
);

/**
 * @route POST /api/v1/presentations/:presentationId/sessions/:sessionId/advance
 * @desc Advance to next slide
 * @access Private (Admin/Trainer)
 */
router.post('/:presentationId/sessions/:sessionId/advance',
  authenticateToken,
  authorizeRoles('admin', 'trainer'),
  validateRequest,
  presentationController.advanceSlide
);


// ==================== PRESENTATION POLLS ====================

/**
 * @route POST /api/v1/presentations/:presentationId/polls
 * @desc Add poll to presentation
 * @access Private (Admin/Trainer)
 */
router.post('/:presentationId/polls',
  authenticateToken,
  authorizeRoles('admin', 'trainer'),
  validateRequest,
  presentationController.addPollToPresentation
);

/**
 * @route POST /api/v1/presentations/:presentationId/sessions/:sessionId/polls/:pollId/activate
 * @desc Activate poll in presentation session
 * @access Private (Admin/Trainer)
 */
router.post('/:presentationId/sessions/:sessionId/polls/:pollId/activate',
  authenticateToken,
  authorizeRoles('admin', 'trainer'),
  validateRequest,
  presentationController.activatePoll
);

/**
 * @route POST /api/v1/presentations/:presentationId/sessions/:sessionId/polls/:pollId/deactivate
 * @desc Deactivate poll in presentation session
 * @access Private (Admin/Trainer)
 */
router.post('/:presentationId/sessions/:sessionId/polls/:pollId/deactivate',
  authenticateToken,
  authorizeRoles('admin', 'trainer'),
  presentationController.deactivatePoll
);

/**
 * @route POST /api/v1/presentations/:presentationId/sessions/:sessionId/polls/:pollId/responses
 * @desc Submit poll response in presentation session
 * @access Private
 */
router.post('/:presentationId/sessions/:sessionId/polls/:pollId/responses',
  authenticateToken,
  validateRequest,
  presentationController.submitPollResponse
);

/**
 * @route GET /api/v1/presentations/:presentationId/sessions/:sessionId/polls/:pollId/results
 * @desc Get poll results from presentation session
 * @access Private
 */
router.get('/:presentationId/sessions/:sessionId/polls/:pollId/results',
  authenticateToken,
  presentationController.getPollResults
);


// ==================== PRESENTATION SLIDES ====================

/**
 * @route POST /api/v1/presentations/:presentationId/slides
 * @desc Add slide to presentation
 * @access Private (Admin/Trainer)
 */
router.post('/:presentationId/slides',
  authenticateToken,
  authorizeRoles('admin', 'trainer'),
  validateRequest,
  presentationController.addSlide
);

/**
 * @route PUT /api/v1/presentations/:presentationId/slides/:slideIndex
 * @desc Update slide in presentation
 * @access Private (Admin/Trainer)
 */
router.put('/:presentationId/slides/:slideIndex',
  authenticateToken,
  authorizeRoles('admin', 'trainer'),
  validateRequest,
  presentationController.updateSlide
);

/**
 * @route DELETE /api/v1/presentations/:presentationId/slides/:slideIndex
 * @desc Remove slide from presentation
 * @access Private (Admin/Trainer)
 */
router.delete('/:presentationId/slides/:slideIndex',
  authenticateToken,
  authorizeRoles('admin', 'trainer'),
  presentationController.removeSlide
);


// ==================== PRESENTATION STATISTICS ====================

/**
 * @route GET /api/v1/presentations/:presentationId/stats
 * @desc Get presentation statistics
 * @access Private (Admin/Trainer)
 */
router.get('/:presentationId/stats',
  authenticateToken,
  authorizeRoles('admin', 'trainer'),
  presentationController.getPresentationStats
);

/**
 * @route GET /api/v1/presentations/:presentationId/sessions/:sessionId/stats
 * @desc Get session statistics
 * @access Private (Admin/Trainer)
 */
router.get('/:presentationId/sessions/:sessionId/stats',
  authenticateToken,
  authorizeRoles('admin', 'trainer'),
  presentationController.getSessionStats
);

module.exports = router;
