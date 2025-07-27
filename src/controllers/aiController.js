/**
 * AI Controller
 * Handles AI-related API endpoints
 */

const aiService = require('../services/aiService');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');

class AIController {
  /**
   * Generate content using AI
   */
  async generateContent(req, res) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const {
        prompt,
        model,
        maxTokens,
        temperature,
        topP,
        frequencyPenalty,
        presencePenalty,
        systemPrompt,
        useRAG = false
      } = req.body;

      logger.info(`🤖 AI content generation request: ${prompt.substring(0, 100)}...`);

      // Generate content
      const result = useRAG 
        ? await aiService.generateContentWithRAG(prompt, {
            model,
            maxTokens,
            temperature,
            topP,
            frequencyPenalty,
            presencePenalty,
            systemPrompt
          })
        : await aiService.generateContent(prompt, {
            model,
            maxTokens,
            temperature,
            topP,
            frequencyPenalty,
            presencePenalty,
            systemPrompt
          });

      if (result.success) {
        logger.info(`✅ AI content generated successfully`);
        res.json({
          success: true,
          data: result,
          message: 'Content generated successfully'
        });
      } else {
        logger.error(`❌ AI content generation failed: ${result.error}`);
        res.status(500).json({
          success: false,
          error: result.error,
          message: 'Failed to generate content'
        });
      }

    } catch (error) {
      logger.error('❌ AI controller error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Add document to knowledge base
   */
  async addToKnowledgeBase(req, res) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { documentId, content, metadata = {} } = req.body;

      logger.info(`📚 Adding document to knowledge base: ${documentId}`);

      const chunksCount = await aiService.addToKnowledgeBase(documentId, content, metadata);

      res.json({
        success: true,
        data: {
          documentId,
          chunksCount,
          message: `Document added to knowledge base with ${chunksCount} chunks`
        }
      });

    } catch (error) {
      logger.error('❌ Add to knowledge base error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to add document to knowledge base'
      });
    }
  }

  /**
   * Search knowledge base
   */
  async searchKnowledgeBase(req, res) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { query, maxResults } = req.body;

      logger.info(`🔍 Searching knowledge base: ${query.substring(0, 100)}...`);

      const results = await aiService.searchKnowledgeBase(query, maxResults);

      res.json({
        success: true,
        data: {
          query,
          results,
          count: results.length,
          message: `Found ${results.length} relevant results`
        }
      });

    } catch (error) {
      logger.error('❌ Knowledge base search error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to search knowledge base'
      });
    }
  }

  /**
   * Get AI service health status
   */
  async getHealth(req, res) {
    try {
      const health = await aiService.healthCheck();

      res.json({
        success: true,
        data: health,
        message: 'AI service health check completed'
      });

    } catch (error) {
      logger.error('❌ AI health check error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to get AI service health'
      });
    }
  }

  /**
   * Get knowledge base statistics
   */
  async getKnowledgeBaseStats(req, res) {
    try {
      const stats = aiService.getKnowledgeBaseStats();

      res.json({
        success: true,
        data: stats,
        message: 'Knowledge base statistics retrieved'
      });

    } catch (error) {
      logger.error('❌ Knowledge base stats error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to get knowledge base statistics'
      });
    }
  }

  /**
   * Clear knowledge base
   */
  async clearKnowledgeBase(req, res) {
    try {
      aiService.clearKnowledgeBase();

      res.json({
        success: true,
        message: 'Knowledge base cleared successfully'
      });

    } catch (error) {
      logger.error('❌ Clear knowledge base error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to clear knowledge base'
      });
    }
  }

  /**
   * Get available AI models
   */
  async getAvailableModels(req, res) {
    try {
      const models = [
        {
          id: 'llama-3.3-70b-versatile',
          name: 'Llama 3.3 70B Versatile',
          provider: 'Groq',
          description: 'Most capable model for complex tasks',
          maxTokens: 8192,
          supportsStreaming: true
        },
        {
          id: 'llama-3.1-8b-instant',
          name: 'Llama 3.1 8B Instant',
          provider: 'Groq',
          description: 'Fast and efficient for simple tasks',
          maxTokens: 8192,
          supportsStreaming: true
        },
        {
          id: 'mixtral-8x7b-32768',
          name: 'Mixtral 8x7B',
          provider: 'Groq',
          description: 'Balanced performance and speed',
          maxTokens: 32768,
          supportsStreaming: true
        },
        {
          id: 'gemma-7b-it',
          name: 'Gemma 7B IT',
          provider: 'Groq',
          description: 'Instruction-tuned for better responses',
          maxTokens: 8192,
          supportsStreaming: true
        }
      ];

      res.json({
        success: true,
        data: models,
        message: 'Available AI models retrieved'
      });

    } catch (error) {
      logger.error('❌ Get models error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to get available models'
      });
    }
  }

  /**
   * Generate content for specific use cases
   */
  async generateSpecializedContent(req, res) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { type, prompt, context, options = {} } = req.body;

      let systemPrompt = '';
      let enhancedPrompt = prompt;

      // Define specialized prompts for different use cases
      switch (type) {
        case 'training_material':
          systemPrompt = `You are an expert training content creator. Create comprehensive, engaging, and educational training materials. Focus on practical examples, clear explanations, and actionable insights.`;
          enhancedPrompt = `Create training material about: ${prompt}`;
          break;

        case 'assessment_questions':
          systemPrompt = `You are an expert assessment designer. Create clear, fair, and comprehensive assessment questions that effectively test understanding and knowledge.`;
          enhancedPrompt = `Create assessment questions for: ${prompt}`;
          break;

        case 'feedback_template':
          systemPrompt = `You are an expert feedback specialist. Create constructive, actionable, and professional feedback templates that help improve performance.`;
          enhancedPrompt = `Create a feedback template for: ${prompt}`;
          break;

        case 'presentation_outline':
          systemPrompt = `You are an expert presentation designer. Create well-structured, engaging presentation outlines that effectively communicate key points.`;
          enhancedPrompt = `Create a presentation outline for: ${prompt}`;
          break;

        case 'email_template':
          systemPrompt = `You are an expert communication specialist. Create professional, clear, and effective email templates for various business scenarios.`;
          enhancedPrompt = `Create an email template for: ${prompt}`;
          break;

        default:
          systemPrompt = `You are a helpful AI assistant. Provide clear, accurate, and useful responses.`;
          enhancedPrompt = prompt;
      }

      logger.info(`🎯 Generating specialized content: ${type} - ${prompt.substring(0, 100)}...`);

      const result = await aiService.generateContent(enhancedPrompt, {
        ...options,
        systemPrompt,
        context
      });

      if (result.success) {
        logger.info(`✅ Specialized content generated successfully`);
        res.json({
          success: true,
          data: {
            ...result,
            type,
            originalPrompt: prompt
          },
          message: `${type} content generated successfully`
        });
      } else {
        logger.error(`❌ Specialized content generation failed: ${result.error}`);
        res.status(500).json({
          success: false,
          error: result.error,
          message: 'Failed to generate specialized content'
        });
      }

    } catch (error) {
      logger.error('❌ Specialized content generation error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Internal server error'
      });
    }
  }

  // ==================== ENHANCED AI ENDPOINTS ====================

  /**
   * Enhanced content generation with advanced features
   */
  async generateEnhancedContent(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const {
        prompt,
        contentType,
        targetAudience,
        tone,
        style,
        length,
        model,
        maxTokens,
        temperature,
        useRAG = true
      } = req.body;

      logger.info(`🤖 Enhanced AI content generation request: ${prompt.substring(0, 100)}...`);

      const result = await aiService.generateEnhancedContent(prompt, {
        contentType,
        targetAudience,
        tone,
        style,
        length,
        model,
        maxTokens,
        temperature,
        useRAG
      });

      if (result.success) {
        logger.info(`✅ Enhanced AI content generated successfully`);
        res.json({
          success: true,
          data: result,
          message: 'Enhanced content generated successfully'
        });
      } else {
        logger.error(`❌ Enhanced AI content generation failed: ${result.error}`);
        res.status(500).json({
          success: false,
          error: result.error,
          message: 'Failed to generate enhanced content'
        });
      }

    } catch (error) {
      logger.error('❌ Enhanced AI controller error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Generate training material
   */
  async generateTrainingMaterial(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const {
        topic,
        level,
        duration,
        format,
        learningObjectives,
        targetAudience,
        model,
        maxTokens,
        temperature
      } = req.body;

      logger.info(`🤖 Training material generation request: ${topic}...`);

      const result = await aiService.generateTrainingMaterial(topic, {
        level,
        duration,
        format,
        learningObjectives,
        targetAudience,
        model,
        maxTokens,
        temperature
      });

      if (result.success) {
        logger.info(`✅ Training material generated successfully`);
        res.json({
          success: true,
          data: result,
          message: 'Training material generated successfully'
        });
      } else {
        logger.error(`❌ Training material generation failed: ${result.error}`);
        res.status(500).json({
          success: false,
          error: result.error,
          message: 'Failed to generate training material'
        });
      }

    } catch (error) {
      logger.error('❌ Training material generation error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Generate assessment questions
   */
  async generateAssessmentQuestions(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const {
        topic,
        questionType,
        difficulty,
        count,
        learningObjectives,
        model,
        maxTokens,
        temperature
      } = req.body;

      logger.info(`🤖 Assessment questions generation request: ${topic}...`);

      const result = await aiService.generateAssessmentQuestions(topic, {
        questionType,
        difficulty,
        count,
        learningObjectives,
        model,
        maxTokens,
        temperature
      });

      if (result.success) {
        logger.info(`✅ Assessment questions generated successfully`);
        res.json({
          success: true,
          data: result,
          message: 'Assessment questions generated successfully'
        });
      } else {
        logger.error(`❌ Assessment questions generation failed: ${result.error}`);
        res.status(500).json({
          success: false,
          error: result.error,
          message: 'Failed to generate assessment questions'
        });
      }

    } catch (error) {
      logger.error('❌ Assessment questions generation error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Generate presentation outline
   */
  async generatePresentationOutline(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const {
        topic,
        duration,
        targetAudience,
        style,
        includeSlides,
        model,
        maxTokens,
        temperature
      } = req.body;

      logger.info(`🤖 Presentation outline generation request: ${topic}...`);

      const result = await aiService.generatePresentationOutline(topic, {
        duration,
        targetAudience,
        style,
        includeSlides,
        model,
        maxTokens,
        temperature
      });

      if (result.success) {
        logger.info(`✅ Presentation outline generated successfully`);
        res.json({
          success: true,
          data: result,
          message: 'Presentation outline generated successfully'
        });
      } else {
        logger.error(`❌ Presentation outline generation failed: ${result.error}`);
        res.status(500).json({
          success: false,
          error: result.error,
          message: 'Failed to generate presentation outline'
        });
      }

    } catch (error) {
      logger.error('❌ Presentation outline generation error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Improve existing content
   */
  async improveContent(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const {
        content,
        improvementType,
        targetAudience,
        style,
        model,
        maxTokens,
        temperature
      } = req.body;

      logger.info(`🤖 Content improvement request: ${improvementType}...`);

      const result = await aiService.improveContent(content, {
        improvementType,
        targetAudience,
        style,
        model,
        maxTokens,
        temperature
      });

      if (result.success) {
        logger.info(`✅ Content improved successfully`);
        res.json({
          success: true,
          data: result,
          message: 'Content improved successfully'
        });
      } else {
        logger.error(`❌ Content improvement failed: ${result.error}`);
        res.status(500).json({
          success: false,
          error: result.error,
          message: 'Failed to improve content'
        });
      }

    } catch (error) {
      logger.error('❌ Content improvement error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Translate content
   */
  async translateContent(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const {
        content,
        sourceLanguage,
        targetLanguage,
        preserveFormatting,
        model,
        maxTokens,
        temperature
      } = req.body;

      logger.info(`🤖 Content translation request: ${sourceLanguage} to ${targetLanguage}...`);

      const result = await aiService.translateContent(content, {
        sourceLanguage,
        targetLanguage,
        preserveFormatting,
        model,
        maxTokens,
        temperature
      });

      if (result.success) {
        logger.info(`✅ Content translated successfully`);
        res.json({
          success: true,
          data: result,
          message: 'Content translated successfully'
        });
      } else {
        logger.error(`❌ Content translation failed: ${result.error}`);
        res.status(500).json({
          success: false,
          error: result.error,
          message: 'Failed to translate content'
        });
      }

    } catch (error) {
      logger.error('❌ Content translation error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Check AI service health
   */
  async checkAIHealth(req, res) {
    try {
      logger.info('🤖 AI health check requested');
      
      const healthStatus = await aiService.checkHealth();
      
      if (healthStatus.healthy) {
        logger.info('✅ AI service is healthy');
        res.json({
          success: true,
          data: healthStatus,
          message: 'AI service is healthy'
        });
      } else {
        logger.warn('⚠️ AI service health check failed');
        res.status(503).json({
          success: false,
          error: healthStatus.error,
          message: 'AI service is unhealthy'
        });
      }
    } catch (error) {
      logger.error('❌ AI health check error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to check AI service health'
      });
    }
  }

  /**
   * Get AI content library
   */
  async getContentLibrary(req, res) {
    try {
      logger.info('📚 AI content library requested');
      
      const contentLibrary = await aiService.getContentLibrary();
      
      logger.info('✅ AI content library retrieved successfully');
      res.json({
        success: true,
        data: contentLibrary,
        message: 'Content library retrieved successfully'
      });
    } catch (error) {
      logger.error('❌ AI content library error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to retrieve content library'
      });
    }
  }

  /**
   * Get AI service health (legacy method)
   */
}

module.exports = new AIController(); 