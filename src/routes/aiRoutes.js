/**
 * AI Routes
 * Defines API endpoints for AI functionality
 */

const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validateRequestCustom } = require('../middleware/validation');
const rateLimit = require('express-rate-limit');


// Rate limiting for AI endpoints
const aiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  // 15 minutes
  max: 100,
  // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many AI requests, please try again later.',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false
});


// Apply rate limiting to all AI routes
router.use(aiRateLimit);


// ==================== CONTENT GENERATION ====================

/**
 * Generate general content based on type and prompt
 * POST /api/v1/ai/generate/content
 */
router.post('/generate/content',
  authenticateToken,
  validateRequestCustom([
    {
      field: 'type', type: 'string', required: true, enum: ['text', 'image', 'video', 'audio']
    },
    {
      field: 'prompt', type: 'string', required: true, minLength: 1, maxLength: 2000
    },
    {
      field: 'context', type: 'string', required: false, maxLength: 1000
    },
    {
      field: 'options', type: 'object', required: false
    }
  ]),
  aiController.generateContent
);

/**
 * Generate training materials for specific topics
 * POST /api/v1/ai/(generate/training-material)
 */
router.post('/(generate/training-material)',
  authenticateToken,
  authorizeRoles('admin', 'trainer'),
  validateRequestCustom([
    {
      field: 'topic', type: 'string', required: true, minLength: 1, maxLength: 500
    },
    {
      field: 'context', type: 'string', required: false, maxLength: 1000
    },
    {
      field: 'options', type: 'object', required: false
    }
  ]),
  aiController.generateTrainingMaterial
);

/**
 * Generate assessment questions for training topics
 * POST /api/v1/ai/(generate/assessment-questions)
 */
router.post('/(generate/assessment-questions)',
  authenticateToken,
  authorizeRoles('admin', 'trainer'),
  validateRequestCustom([
    {
      field: 'topic', type: 'string', required: true, minLength: 1, maxLength: 500
    },
    {
      field: 'questionCount', type: 'number', required: true, min: 1, max: 50
    },
    {
      field: 'options', type: 'object', required: false
    }
  ]),
  aiController.generateAssessmentQuestions
);

/**
 * Generate presentation outlines and slides
 * POST /api/v1/ai/(generate/presentation-outline)
 */
router.post('/(generate/presentation-outline)',
  authenticateToken,
  authorizeRoles('admin', 'trainer'),
  validateRequestCustom([
    {
      field: 'topic', type: 'string', required: true, minLength: 1, maxLength: 500
    },
    {
      field: 'options', type: 'object', required: false
    }
  ]),
  aiController.generatePresentationOutline
);


// ==================== CONTENT IMPROVEMENT ====================

/**
 * Improve existing content based on specified criteria
 * POST /api/v1/ai/improve/content
 */
router.post('/improve/content',
  authenticateToken,
  validateRequestCustom([
    {
      field: 'content', type: 'string', required: true, minLength: 1, maxLength: 10000
    },
    {
      field: 'improvement', type: 'string', required: true, enum: ['grammar', 'style', 'tone', 'expand', 'summarize']
    },
    {
      field: 'options', type: 'object', required: false
    }
  ]),
  aiController.improveContent
);

/**
 * Translate content to different languages
 * POST /api/v1/ai/translate/content
 */
router.post('/translate/content',
  authenticateToken,
  validateRequestCustom([
    {
      field: 'content', type: 'string', required: true, minLength: 1, maxLength: 5000
    },
    {
      field: 'targetLanguage', type: 'string', required: true, minLength: 2, maxLength: 10
    },
    {
      field: 'preserveTone', type: 'boolean', required: false
    },
    {
      field: 'options', type: 'object', required: false
    }
  ]),
  aiController.translateContent
);


// ==================== SPECIALIZED CONTENT GENERATION ====================

/**
 * Generate blog posts and articles
 * POST /api/v1/ai/(generate/blog-post)
 */
router.post('/(generate/blog-post)',
  authenticateToken,
  validateRequestCustom([
    {
      field: 'topic', type: 'string', required: true, minLength: 1, maxLength: 500
    },
    {
      field: 'options', type: 'object', required: false
    }
  ]),
  aiController.generateBlogPost
);

/**
 * Generate social media content for different platforms
 * POST /api/v1/ai/(generate/social-media)
 */
router.post('/(generate/social-media)',
  authenticateToken,
  validateRequestCustom([
    {
      field: 'platform', type: 'string', required: true, enum: ['twitter', 'linkedin', 'instagram', 'facebook']
    },
    {
      field: 'topic', type: 'string', required: true, minLength: 1, maxLength: 500
    },
    {
      field: 'options', type: 'object', required: false
    }
  ]),
  aiController.generateSocialMedia
);

/**
 * Generate email content for different purposes
 * POST /api/v1/ai/generate/email
 */
router.post('/generate/email',
  authenticateToken,
  validateRequestCustom([
    {
      field: 'type', type: 'string', required: true, enum: ['newsletter', 'marketing', 'announcement', 'follow-up']
    },
    {
      field: 'topic', type: 'string', required: true, minLength: 1, maxLength: 500
    },
    {
      field: 'options', type: 'object', required: false
    }
  ]),
  aiController.generateEmail
);

/**
 * Generate product descriptions and marketing copy
 * POST /api/v1/ai/(generate/product-description)
 */
router.post('/(generate/product-description)',
  authenticateToken,
  validateRequestCustom([
    {
      field: 'productName', type: 'string', required: true, minLength: 1, maxLength: 200
    },
    {
      field: 'features', type: 'array', required: false
    },
    {
      field: 'targetAudience', type: 'string', required: true, minLength: 1, maxLength: 200
    },
    {
      field: 'options', type: 'object', required: false
    }
  ]),
  aiController.generateProductDescription
);


// ==================== MEDIA CONTENT GENERATION ====================

/**
 * Generate prompts for image generation
 * POST /api/v1/ai/(generate/image-prompt)
 */
router.post('/(generate/image-prompt)',
  authenticateToken,
  validateRequestCustom([
    {
      field: 'description', type: 'string', required: true, minLength: 1, maxLength: 1000
    },
    {
      field: 'style', type: 'string', required: false, enum: ['realistic', 'artistic', 'cartoon', 'photographic']
    },
    {
      field: 'options', type: 'object', required: false
    }
  ]),
  aiController.generateImagePrompt
);

/**
 * Generate video scripts and storyboards
 * POST /api/v1/ai/(generate/video-script)
 */
router.post('/(generate/video-script)',
  authenticateToken,
  validateRequestCustom([
    {
      field: 'topic', type: 'string', required: true, minLength: 1, maxLength: 500
    },
    {
      field: 'duration', type: 'string', required: false, enum: ['short', 'medium', 'long']
    },
    {
      field: 'style', type: 'string', required: false, enum: ['educational', 'entertaining', 'promotional']
    },
    {
      field: 'options', type: 'object', required: false
    }
  ]),
  aiController.generateVideoScript
);

/**
 * Generate audio content scripts
 * POST /api/v1/ai/(generate/audio-script)
 */
router.post('/(generate/audio-script)',
  authenticateToken,
  validateRequestCustom([
    {
      field: 'topic', type: 'string', required: true, minLength: 1, maxLength: 500
    },
    {
      field: 'type', type: 'string', required: true, enum: ['podcast', 'voiceover', 'audio-book']
    },
    {
      field: 'duration', type: 'number', required: true, min: 1, max: 120
    },
    {
      field: 'options', type: 'object', required: false
    }
  ]),
  aiController.generateAudioScript
);


// ==================== AI CHATBOT ENDPOINTS ====================

/**
 * Create a new conversation
 * POST /api/v1/ai/chat/conversations
 */
router.post('/chat/conversations',
  authenticateToken,
  validateRequestCustom([
    {
      field: 'niche', type: 'string', required: true, minLength: 1, maxLength: 100
    },
    {
      field: 'title', type: 'string', required: false, maxLength: 200
    },
    {
      field: 'initialMessage', type: 'string', required: false, maxLength: 1000
    }
  ]),
  aiController.createConversation
);

/**
 * Get user's conversations
 * GET /api/v1/ai/chat/conversations
 */
router.get('/chat/conversations',
  authenticateToken,
  aiController.getConversations
);

/**
 * Get specific conversation with messages
 * GET /api/v1/ai/chat/conversations/:conversationId
 */
router.get('/chat/conversations/:conversationId',
  authenticateToken,
  aiController.getConversation
);

/**
 * Delete a conversation
 * DELETE /api/v1/ai/chat/conversations/:conversationId
 */
router.delete('/chat/conversations/:conversationId',
  authenticateToken,
  aiController.deleteConversation
);

/**
 * Send a message in a conversation
 * POST /api/v1/ai/chat/conversations/:conversationId/messages
 */
router.post('/chat/conversations/:conversationId/messages',
  authenticateToken,
  validateRequestCustom([
    {
      field: 'content', type: 'string', required: true, minLength: 1, maxLength: 2000
    },
    {
      field: 'type', type: 'string', required: false, enum: ['text', 'content', 'followup', 'social']
    },
    {
      field: 'metadata', type: 'object', required: false
    }
  ]),
  aiController.sendMessage
);

/**
 * Generate AI response for chat messages
 * POST /api/v1/ai/(chat/generate-response)
 */
router.post('/(chat/generate-response)',
  authenticateToken,
  validateRequestCustom([
    {
      field: 'message', type: 'string', required: true, minLength: 1, maxLength: 2000
    },
    {
      field: 'conversationId', type: 'string', required: false
    },
    {
      field: 'context', type: 'object', required: false
    }
  ]),
  aiController.generateResponse
);


// ==================== ANALYTICS & INSIGHTS ====================

/**
 * Get analytics for generated content
 * GET /api/v1/ai/(analytics/content-performance)
 */
router.get('/(analytics/content-performance)',
  authenticateToken,
  authorizeRoles('admin', 'trainer'),
  aiController.getContentPerformance
);

/**
 * Get insights from AI conversations
 * GET /api/v1/ai/(analytics/conversation-insights)
 */
router.get('/(analytics/conversation-insights)',
  authenticateToken,
  aiController.getConversationInsights
);

/**
 * Get AI usage statistics
 * GET /api/v1/ai/analytics/usage
 */
router.get('/analytics/usage',
  authenticateToken,
  aiController.getUsageAnalytics
);


// ==================== TRAINING-SPECIFIC AI ENDPOINTS ====================

/**
 * Generate complete training modules
 * POST /api/v1/ai/(training/generate-module)
 */
router.post('/(training/generate-module)',
  authenticateToken,
  authorizeRoles('admin', 'trainer'),
  validateRequestCustom([
    {
      field: 'topic', type: 'string', required: true, minLength: 1, maxLength: 500
    },
    {
      field: 'options', type: 'object', required: false
    }
  ]),
  aiController.generateTrainingModule
);

/**
 * Generate practical exercises and activities
 * POST /api/v1/ai/(training/generate-exercises)
 */
router.post('/(training/generate-exercises)',
  authenticateToken,
  authorizeRoles('admin', 'trainer'),
  validateRequestCustom([
    {
      field: 'topic', type: 'string', required: true, minLength: 1, maxLength: 500
    },
    {
      field: 'options', type: 'object', required: false
    }
  ]),
  aiController.generateExercises
);

/**
 * Generate case studies and scenarios
 * POST /api/v1/ai/(training/generate-case)-studies
 */
router.post('/(training/generate-case)-studies',
  authenticateToken,
  authorizeRoles('admin', 'trainer'),
  validateRequestCustom([
    {
      field: 'topic', type: 'string', required: true, minLength: 1, maxLength: 500
    },
    {
      field: 'options', type: 'object', required: false
    }
  ]),
  aiController.generateCaseStudies
);

/**
 * Generate quizzes and assessments
 * POST /api/v1/ai/(training/generate-quiz)
 */
router.post('/(training/generate-quiz)',
  authenticateToken,
  authorizeRoles('admin', 'trainer'),
  validateRequestCustom([
    {
      field: 'topic', type: 'string', required: true, minLength: 1, maxLength: 500
    },
    {
      field: 'options', type: 'object', required: false
    }
  ]),
  aiController.generateQuiz
);

/**
 * Generate scenario-based assessments
 * POST /api/v1/ai/(training/generate-scenarios)
 */
router.post('/(training/generate-scenarios)',
  authenticateToken,
  authorizeRoles('admin', 'trainer'),
  validateRequestCustom([
    {
      field: 'topic', type: 'string', required: true, minLength: 1, maxLength: 500
    },
    {
      field: 'options', type: 'object', required: false
    }
  ]),
  aiController.generateScenarios
);


// ==================== CONTENT MANAGEMENT ====================

/**
 * Save generated content to library
 * POST /api/v1/ai/content/save
 */
router.post('/content/save',
  authenticateToken,
  validateRequestCustom([
    {
      field: 'title', type: 'string', required: true, minLength: 1, maxLength: 200
    },
    {
      field: 'content', type: 'string', required: true, minLength: 1, maxLength: 10000
    },
    {
      field: 'type', type: 'string', required: true, minLength: 1, maxLength: 50
    },
    {
      field: 'category', type: 'string', required: false, maxLength: 100
    },
    {
      field: 'tags', type: 'array', required: false
    },
    {
      field: 'metadata', type: 'object', required: false
    }
  ]),
  aiController.saveContent
);

/**
 * Get saved content from library
 * GET /api/v1/ai/content/library
 */
router.get('/content/library',
  authenticateToken,
  aiController.getContentLibrary
);

/**
 * Update saved content
 * PUT /api/v1/ai/content/:contentId
 */
router.put('/content/:contentId',
  authenticateToken,
  aiController.updateContent
);

/**
 * Delete content from library
 * DELETE /api/v1/ai/content/:contentId
 */
router.delete('/content/:contentId',
  authenticateToken,
  aiController.deleteContent
);

/**
 * Get available content templates
 * GET /api/v1/ai/templates
 */
router.get('/templates',
  authenticateToken,
  aiController.getTemplates
);

/**
 * Create custom content template
 * POST /api/v1/ai/templates
 */
router.post('/templates',
  authenticateToken,
  authorizeRoles('admin', 'trainer'),
  validateRequestCustom([
    {
      field: 'name', type: 'string', required: true, minLength: 1, maxLength: 100
    },
    {
      field: 'description', type: 'string', required: false, maxLength: 500
    },
    {
      field: 'type', type: 'string', required: true, enum: ['social', 'followup', 'training', 'assessment']
    },
    {
      field: 'platform', type: 'string', required: false, maxLength: 50
    },
    {
      field: 'prompt', type: 'string', required: true, minLength: 1, maxLength: 2000
    },
    {
      field: 'variables', type: 'array', required: false
    }
  ]),
  aiController.createTemplate
);


// ==================== PERSONALIZATION & PREFERENCES ====================

/**
 * Get user's AI preferences
 * GET /api/v1/ai/preferences
 */
router.get('/preferences',
  authenticateToken,
  aiController.getPreferences
);

/**
 * Update AI preferences
 * PUT /api/v1/ai/preferences
 */
router.put('/preferences',
  authenticateToken,
  aiController.updatePreferences
);

/**
 * Get available niches and suggestions
 * GET /api/v1/ai/niches
 */
router.get('/niches',
  authenticateToken,
  aiController.getNiches
);

/**
 * Set user's primary niche
 * POST /api/v1/ai/niches
 */
router.post('/niches',
  authenticateToken,
  validateRequestCustom([
    {
      field: 'niche', type: 'string', required: true, minLength: 1, maxLength: 100
    },
    {
      field: 'description', type: 'string', required: false, maxLength: 500
    },
    {
      field: 'keywords', type: 'array', required: false
    }
  ]),
  aiController.setNiche
);


// ==================== PERFORMANCE & MONITORING ====================

/**
 * Check AI service health
 * GET /api/v1/ai/health
 */
router.get('/health',
  authenticateToken,
  aiController.getHealth
);

/**
 * Get current rate limit status
 * GET /api/v1/(ai/rate-limits)
 */
router.get('/rate-limits',
  authenticateToken,
  aiController.getRateLimits
);

module.exports = router;
