/**
 * AI Routes
 * Defines API endpoints for AI functionality
 */

const express = require('express');
const { body } = require('express-validator');
const aiController = require('../controllers/aiController');
const { authenticateToken } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limiting for AI endpoints
const aiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  message: {
    success: false,
    error: 'Too many AI requests, please try again later',
    message: 'Rate limit exceeded'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all AI routes
router.use(aiRateLimit);

// Validation schemas
const generateContentValidation = [
  body('prompt')
    .trim()
    .isLength({ min: 1, max: 10000 })
    .withMessage('Prompt must be between 1 and 10000 characters'),
  body('model')
    .optional()
    .isString()
    .withMessage('Model must be a string'),
  body('maxTokens')
    .optional()
    .isInt({ min: 1, max: 8192 })
    .withMessage('Max tokens must be between 1 and 8192'),
  body('temperature')
    .optional()
    .isFloat({ min: 0, max: 2 })
    .withMessage('Temperature must be between 0 and 2'),
  body('topP')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('Top P must be between 0 and 1'),
  body('frequencyPenalty')
    .optional()
    .isFloat({ min: -2, max: 2 })
    .withMessage('Frequency penalty must be between -2 and 2'),
  body('presencePenalty')
    .optional()
    .isFloat({ min: -2, max: 2 })
    .withMessage('Presence penalty must be between -2 and 2'),
  body('systemPrompt')
    .optional()
    .isString()
    .isLength({ max: 5000 })
    .withMessage('System prompt must be less than 5000 characters'),
  body('useRAG')
    .optional()
    .isBoolean()
    .withMessage('useRAG must be a boolean')
];

const knowledgeBaseValidation = [
  body('documentId')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Document ID must be between 1 and 255 characters'),
  body('content')
    .trim()
    .isLength({ min: 1, max: 100000 })
    .withMessage('Content must be between 1 and 100000 characters'),
  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object')
];

const searchValidation = [
  body('query')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Query must be between 1 and 1000 characters'),
  body('maxResults')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Max results must be between 1 and 20')
];

const specializedContentValidation = [
  body('type')
    .isIn(['training_material', 'assessment_questions', 'feedback_template', 'presentation_outline', 'email_template'])
    .withMessage('Type must be one of: training_material, assessment_questions, feedback_template, presentation_outline, email_template'),
  body('prompt')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Prompt must be between 1 and 5000 characters'),
  body('context')
    .optional()
    .isString()
    .isLength({ max: 10000 })
    .withMessage('Context must be less than 10000 characters'),
  body('options')
    .optional()
    .isObject()
    .withMessage('Options must be an object')
];

// Enhanced AI validation schemas
const enhancedContentValidation = [
  body('prompt')
    .trim()
    .isLength({ min: 1, max: 10000 })
    .withMessage('Prompt must be between 1 and 10000 characters'),
  body('contentType')
    .optional()
    .isIn(['article', 'blog', 'email', 'report', 'presentation', 'training'])
    .withMessage('Content type must be one of: article, blog, email, report, presentation, training'),
  body('targetAudience')
    .optional()
    .isString()
    .isLength({ max: 200 })
    .withMessage('Target audience must be less than 200 characters'),
  body('tone')
    .optional()
    .isIn(['professional', 'casual', 'formal', 'friendly', 'technical'])
    .withMessage('Tone must be one of: professional, casual, formal, friendly, technical'),
  body('style')
    .optional()
    .isString()
    .isLength({ max: 200 })
    .withMessage('Style must be less than 200 characters'),
  body('length')
    .optional()
    .isIn(['short', 'medium', 'long'])
    .withMessage('Length must be one of: short, medium, long'),
  body('useRAG')
    .optional()
    .isBoolean()
    .withMessage('useRAG must be a boolean')
];

const trainingMaterialValidation = [
  body('topic')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Topic must be between 1 and 500 characters'),
  body('level')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Level must be one of: beginner, intermediate, advanced'),
  body('duration')
    .optional()
    .isInt({ min: 15, max: 480 })
    .withMessage('Duration must be between 15 and 480 minutes'),
  body('format')
    .optional()
    .isIn(['workshop', 'lecture', 'hands-on', 'video', 'document'])
    .withMessage('Format must be one of: workshop, lecture, hands-on, video, document'),
  body('learningObjectives')
    .optional()
    .isArray()
    .withMessage('Learning objectives must be an array'),
  body('targetAudience')
    .optional()
    .isString()
    .isLength({ max: 200 })
    .withMessage('Target audience must be less than 200 characters')
];

const assessmentQuestionsValidation = [
  body('topic')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Topic must be between 1 and 500 characters'),
  body('questionType')
    .optional()
    .isIn(['multiple-choice', 'single-choice', 'true-false', 'fill-blank', 'essay'])
    .withMessage('Question type must be one of: multiple-choice, single-choice, true-false, fill-blank, essay'),
  body('difficulty')
    .optional()
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('Difficulty must be one of: easy, medium, hard'),
  body('count')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Count must be between 1 and 50'),
  body('learningObjectives')
    .optional()
    .isArray()
    .withMessage('Learning objectives must be an array')
];

const presentationOutlineValidation = [
  body('topic')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Topic must be between 1 and 500 characters'),
  body('duration')
    .optional()
    .isInt({ min: 5, max: 120 })
    .withMessage('Duration must be between 5 and 120 minutes'),
  body('targetAudience')
    .optional()
    .isString()
    .isLength({ max: 200 })
    .withMessage('Target audience must be less than 200 characters'),
  body('style')
    .optional()
    .isIn(['formal', 'casual', 'technical', 'creative'])
    .withMessage('Style must be one of: formal, casual, technical, creative'),
  body('includeSlides')
    .optional()
    .isBoolean()
    .withMessage('includeSlides must be a boolean')
];

const contentImprovementValidation = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 50000 })
    .withMessage('Content must be between 1 and 50000 characters'),
  body('improvementType')
    .isIn(['grammar', 'clarity', 'tone', 'structure', 'style', 'comprehensive'])
    .withMessage('Improvement type must be one of: grammar, clarity, tone, structure, style, comprehensive'),
  body('targetAudience')
    .optional()
    .isString()
    .isLength({ max: 200 })
    .withMessage('Target audience must be less than 200 characters'),
  body('style')
    .optional()
    .isString()
    .isLength({ max: 200 })
    .withMessage('Style must be less than 200 characters')
];

const translationValidation = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 50000 })
    .withMessage('Content must be between 1 and 50000 characters'),
  body('sourceLanguage')
    .isString()
    .isLength({ min: 2, max: 10 })
    .withMessage('Source language must be between 2 and 10 characters'),
  body('targetLanguage')
    .isString()
    .isLength({ min: 2, max: 10 })
    .withMessage('Target language must be between 2 and 10 characters'),
  body('preserveFormatting')
    .optional()
    .isBoolean()
    .withMessage('preserveFormatting must be a boolean')
];

// ==================== BASIC AI ENDPOINTS ====================

/**
 * @route GET /api/v1/ai/health
 * @desc Check AI service health
 * @access Public
 */
router.get('/health', aiController.checkAIHealth);

/**
 * @route POST /api/v1/ai/generate
 * @desc Generate AI content
 * @access Private
 */
router.post('/generate', 
  authenticateToken, 
  generateContentValidation, 
  validateRequest, 
  aiController.generateContent
);

/**
 * @route POST /api/v1/ai/generate/specialized
 * @desc Generate specialized content
 * @access Private
 */
router.post('/generate/specialized', 
  authenticateToken, 
  specializedContentValidation, 
  validateRequest, 
  aiController.generateSpecializedContent
);

/**
 * @route GET /api/v1/ai/knowledge-base/stats
 * @desc Get knowledge base statistics
 * @access Private
 */
router.get('/knowledge-base/stats', 
  authenticateToken, 
  aiController.getKnowledgeBaseStats
);

// ==================== KNOWLEDGE BASE & CONTENT LIBRARY ====================

/**
 * @route GET /api/v1/ai/content/library
 * @desc Get AI content library
 * @access Private
 */
router.get('/content/library', 
  authenticateToken, 
  aiController.getContentLibrary
);

/**
 * @route POST /api/v1/ai/knowledge-base/add
 * @desc Add content to knowledge base
 * @access Private
 */
router.post('/knowledge-base/add', 
  authenticateToken, 
  knowledgeBaseValidation, 
  validateRequest, 
  aiController.addToKnowledgeBase
);

/**
 * @route POST /api/v1/ai/knowledge-base/search
 * @desc Search knowledge base
 * @access Private
 */
router.post('/knowledge-base/search', 
  authenticateToken, 
  searchValidation, 
  validateRequest, 
  aiController.searchKnowledgeBase
);

/**
 * @route DELETE /api/v1/ai/knowledge-base/clear
 * @desc Clear knowledge base
 * @access Private
 */
router.delete('/knowledge-base/clear', 
  authenticateToken, 
  aiController.clearKnowledgeBase
);

// ==================== ENHANCED AI ENDPOINTS ====================
router.post('/generate/content', authenticateToken, enhancedContentValidation, aiController.generateEnhancedContent);
router.post('/generate/training-material', authenticateToken, trainingMaterialValidation, aiController.generateTrainingMaterial);
router.post('/generate/assessment-questions', authenticateToken, assessmentQuestionsValidation, aiController.generateAssessmentQuestions);
router.post('/generate/presentation-outline', authenticateToken, presentationOutlineValidation, aiController.generatePresentationOutline);
router.post('/improve/content', authenticateToken, contentImprovementValidation, aiController.improveContent);
router.post('/translate/content', authenticateToken, translationValidation, aiController.translateContent);

module.exports = router; 