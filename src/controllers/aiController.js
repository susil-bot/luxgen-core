/**
 * AI Controller
 * Handles AI-related API endpoints
 */

const aiService = require('../services/aiService');
const { asyncHandler } = require('../utils/errors');
const logger = require('../utils/logger');
const cacheManager = require('../utils/cache');

class AIController {
// ==================== CONTENT GENERATION ====================

  /**
   * Generate general content based on type and prompt
   */
  async generateContent (req, res) {
    // TODO: Add await statements
    const { type, prompt, context, options } = req.body;
    const userId = req.user.id;
    const { tenantId } = req;

    logger.info('AI Content Generation Request', {
      userId,
      tenantId,
      type,
      promptLength: prompt?.length,
      options
    });

    try {
      const result = await aiService.generateContent({
        type,
        prompt,
        context,
        options,
        userId,
        tenantId
      });


      // Cache the generated content
      const cacheKey = `ai:content:${userId}:${Date.now()}`;
      await cacheManager.set(cacheKey, result, 86400);
      // 24 hours

      res.json({
        success: true,
        data: result,
        message: 'Content generated successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('AI Content Generation Error', {
        error: error.message, userId, tenantId
      });
      throw error;
    } }
  /**
   * Generate training materials for specific topics
   */
  async generateTrainingMaterial (req, res) {
    // TODO: Add await statements
    const { topic, context, options } = req.body;
    const userId = req.user.id;
    const { tenantId } = req;

    logger.info('AI Training Material Generation Request', {
      userId,
      tenantId,
      topic,
      options
    });

    try {
      const result = await aiService.generateTrainingMaterial({
        topic,
        context,
        options,
        userId,
        tenantId
      });

      res.json({
        success: true,
        data: result,
        message: 'Training material generated successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('AI Training Material Generation Error', {
        error: error.message, userId, tenantId
      });
      throw error;
    } }
  /**
   * Generate assessment questions for training topics
   */
  async generateAssessmentQuestions (req, res) {
    // TODO: Add await statements
    const { topic, questionCount, options } = req.body;
    const userId = req.user.id;
    const { tenantId } = req;

    logger.info('AI Assessment Questions Generation Request', {
      userId,
      tenantId,
      topic,
      questionCount,
      options
    });

    try {
      const result = await aiService.generateAssessmentQuestions({
        topic,
        questionCount,
        options,
        userId,
        tenantId
      });

      res.json({
        success: true,
        data: result,
        message: 'Assessment questions generated successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('AI Assessment Questions Generation Error', {
        error: error.message, userId, tenantId
      });
      throw error;
    } }
  /**
   * Generate presentation outlines and slides
   */
  async generatePresentationOutline (req, res) {
    // TODO: Add await statements
    const { topic, options } = req.body;
    const userId = req.user.id;
    const { tenantId } = req;

    logger.info('AI Presentation Outline Generation Request', {
      userId,
      tenantId,
      topic,
      options
    });

    try {
      const result = await aiService.generatePresentationOutline({
        topic,
        options,
        userId,
        tenantId
      });

      res.json({
        success: true,
        data: result,
        message: 'Presentation outline generated successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('AI Presentation Outline Generation Error', {
        error: error.message, userId, tenantId
      });
      throw error;
    } }
  // ==================== CONTENT IMPROVEMENT ====================

  /**
   * Improve existing content based on specified criteria
   */
  async improveContent (req, res) {
    // TODO: Add await statements
    const { content, improvement, options } = req.body;
    const userId = req.user.id;
    const { tenantId } = req;

    logger.info('AI Content Improvement Request', {
      userId,
      tenantId,
      improvement,
      contentLength: content?.length,
      options
    });

    try {
      const result = await aiService.improveContent({
        content,
        improvement,
        options,
        userId,
        tenantId
      });

      res.json({
        success: true,
        data: result,
        message: 'Content improved successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('AI Content Improvement Error', {
        error: error.message, userId, tenantId
      });
      throw error;
    } }
  /**
   * Translate content to different languages
   */
  async translateContent (req, res) {
    // TODO: Add await statements
    const { content, targetLanguage, preserveTone, options } = req.body;
    const userId = req.user.id;
    const { tenantId } = req;

    logger.info('AI Content Translation Request', {
      userId,
      tenantId,
      targetLanguage,
      preserveTone,
      contentLength: content?.length
    });

    try {
      const result = await aiService.translateContent({
        content,
        targetLanguage,
        preserveTone,
        options,
        userId,
        tenantId
      });

      res.json({
        success: true,
        data: result,
        message: 'Content translated successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('AI Content Translation Error', {
        error: error.message, userId, tenantId
      });
      throw error;
    } }
  // ==================== SPECIALIZED CONTENT GENERATION ====================

  /**
   * Generate blog posts and articles
   */
  async generateBlogPost (req, res) {
    // TODO: Add await statements
    const { topic, options } = req.body;
    const userId = req.user.id;
    const { tenantId } = req;

    logger.info('AI Blog Post Generation Request', {
      userId,
      tenantId,
      topic,
      options
    });

    try {
      const result = await aiService.generateBlogPost({
        topic,
        options,
        userId,
        tenantId
      });

      res.json({
        success: true,
        data: result,
        message: 'Blog post generated successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('AI Blog Post Generation Error', {
        error: error.message, userId, tenantId
      });
      throw error;
    } }
  /**
   * Generate social media content for different platforms
   */
  async generateSocialMedia (req, res) {
    // TODO: Add await statements
    const { platform, topic, options } = req.body;
    const userId = req.user.id;
    const { tenantId } = req;

    logger.info('AI Social Media Generation Request', {
      userId,
      tenantId,
      platform,
      topic,
      options
    });

    try {
      const result = await aiService.generateSocialMedia({
        platform,
        topic,
        options,
        userId,
        tenantId
      });

      res.json({
        success: true,
        data: result,
        message: 'Social media content generated successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('AI Social Media Generation Error', {
        error: error.message, userId, tenantId
      });
      throw error;
    } }
  /**
   * Generate email content for different purposes
   */
  async generateEmail (req, res) {
    // TODO: Add await statements
    const { type, topic, options } = req.body;
    const userId = req.user.id;
    const { tenantId } = req;

    logger.info('AI Email Generation Request', {
      userId,
      tenantId,
      type,
      topic,
      options
    });

    try {
      const result = await aiService.generateEmail({
        type,
        topic,
        options,
        userId,
        tenantId
      });

      res.json({
        success: true,
        data: result,
        message: 'Email content generated successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('AI Email Generation Error', {
        error: error.message, userId, tenantId
      });
      throw error;
    } }
  /**
   * Generate product descriptions and marketing copy
   */
  async generateProductDescription (req, res) {
    // TODO: Add await statements
    const { productName, features, targetAudience, options } = req.body;
    const userId = req.user.id;
    const { tenantId } = req;

    logger.info('AI Product Description Generation Request', {
      userId,
      tenantId,
      productName,
      featuresCount: features?.length,
      targetAudience,
      options
    });

    try {
      const result = await aiService.generateProductDescription({
        productName,
        features,
        targetAudience,
        options,
        userId,
        tenantId
      });

      res.json({
        success: true,
        data: result,
        message: 'Product description generated successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('AI Product Description Generation Error', {
        error: error.message, userId, tenantId
      });
      throw error;
    } }
  // ==================== MEDIA CONTENT GENERATION ====================

  /**
   * Generate prompts for image generation
   */
  async generateImagePrompt (req, res) {
    // TODO: Add await statements
    const { description, style, options } = req.body;
    const userId = req.user.id;
    const { tenantId } = req;

    logger.info('AI Image Prompt Generation Request', {
      userId,
      tenantId,
      description,
      style,
      options
    });

    try {
      const result = await aiService.generateImagePrompt({
        description,
        style,
        options,
        userId,
        tenantId
      });

      res.json({
        success: true,
        data: result,
        message: 'Image prompt generated successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('AI Image Prompt Generation Error', {
        error: error.message, userId, tenantId
      });
      throw error;
    } }
  /**
   * Generate video scripts and storyboards
   */
  async generateVideoScript (req, res) {
    // TODO: Add await statements
    const { topic, duration, style, options } = req.body;
    const userId = req.user.id;
    const { tenantId } = req;

    logger.info('AI Video Script Generation Request', {
      userId,
      tenantId,
      topic,
      duration,
      style,
      options
    });

    try {
      const result = await aiService.generateVideoScript({
        topic,
        duration,
        style,
        options,
        userId,
        tenantId
      });

      res.json({
        success: true,
        data: result,
        message: 'Video script generated successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('AI Video Script Generation Error', {
        error: error.message, userId, tenantId
      });
      throw error;
    } }
  /**
   * Generate audio content scripts
   */
  async generateAudioScript (req, res) {
    // TODO: Add await statements
    const { topic, type, duration, options } = req.body;
    const userId = req.user.id;
    const { tenantId } = req;

    logger.info('AI Audio Script Generation Request', {
      userId,
      tenantId,
      topic,
      type,
      duration,
      options
    });

    try {
      const result = await aiService.generateAudioScript({
        topic,
        type,
        duration,
        options,
        userId,
        tenantId
      });

      res.json({
        success: true,
        data: result,
        message: 'Audio script generated successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('AI Audio Script Generation Error', {
        error: error.message, userId, tenantId
      });
      throw error;
    } }
  // ==================== AI CHATBOT ENDPOINTS ====================

  /**
   * Create a new conversation
   */
  async createConversation (req, res) {
    // TODO: Add await statements
    const { niche, title, initialMessage } = req.body;
    const userId = req.user.id;
    const { tenantId } = req;

    logger.info('AI Conversation Creation Request', {
      userId,
      tenantId,
      niche,
      title,
      hasInitialMessage: !!initialMessage
    });

    try {
      const result = await aiService.createConversation({
        niche,
        title,
        initialMessage,
        userId,
        tenantId
      });

      res.json({
        success: true,
        data: result,
        message: 'Conversation created successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('AI Conversation Creation Error', {
        error: error.message, userId, tenantId
      });
      throw error;
    } }
  /**
   * Get user's conversations
   */
  async getConversations (req, res) {
    // TODO: Add await statements
    const { page = 1, limit = 10, niche } = req.query;
    const userId = req.user.id;
    const { tenantId } = req;

    logger.info('AI Conversations Fetch Request', {
      userId,
      tenantId,
      page,
      limit,
      niche
    });

    try {
      const result = await aiService.getConversations({
        userId,
        tenantId,
        page: parseInt(page),
        limit: parseInt(limit),
        niche
      });

      res.json({
        success: true,
        data: result,
        message: 'Conversations retrieved successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('AI Conversations Fetch Error', {
        error: error.message, userId, tenantId
      });
      throw error;
    } }
  /**
   * Get specific conversation with messages
   */
  async getConversation (req, res) {
    // TODO: Add await statements
    const { conversationId } = req.params;
    const userId = req.user.id;
    const { tenantId } = req;

    logger.info('AI Conversation Fetch Request', {
      userId,
      tenantId,
      conversationId
    });

    try {
      const result = await aiService.getConversation({
        conversationId,
        userId,
        tenantId
      });

      res.json({
        success: true,
        data: result,
        message: 'Conversation retrieved successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('AI Conversation Fetch Error', {
        error: error.message, userId, tenantId, conversationId
      });
      throw error;
    } }
  /**
   * Delete a conversation
   */
  async deleteConversation (req, res) {
    // TODO: Add await statements
    const { conversationId } = req.params;
    const userId = req.user.id;
    const { tenantId } = req;

    logger.info('AI Conversation Deletion Request', {
      userId,
      tenantId,
      conversationId
    });

    try {
      await aiService.deleteConversation({
        conversationId,
        userId,
        tenantId
      });

      res.json({
        success: true,
        message: 'Conversation deleted successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('AI Conversation Deletion Error', {
        error: error.message, userId, tenantId, conversationId
      });
      throw error;
    } }
  /**
   * Send a message in a conversation
   */
  async sendMessage (req, res) {
    // TODO: Add await statements
    const { conversationId } = req.params;
    const { content, type, metadata } = req.body;
    const userId = req.user.id;
    const { tenantId } = req;

    logger.info('AI Message Send Request', {
      userId,
      tenantId,
      conversationId,
      type,
      contentLength: content?.length
    });

    try {
      const result = await aiService.sendMessage({
        conversationId,
        content,
        type,
        metadata,
        userId,
        tenantId
      });

      res.json({
        success: true,
        data: result,
        message: 'Message sent successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('AI Message Send Error', {
        error: error.message, userId, tenantId, conversationId
      });
      throw error;
    } }
  /**
   * Generate AI response for chat messages
   */
  async generateResponse (req, res) {
    // TODO: Add await statements
    const { message, conversationId, context } = req.body;
    const userId = req.user.id;
    const { tenantId } = req;

    logger.info('AI Response Generation Request', {
      userId,
      tenantId,
      conversationId,
      messageLength: message?.length
    });

    try {
      const result = await aiService.generateResponse({
        message,
        conversationId,
        context,
        userId,
        tenantId
      });

      res.json({
        success: true,
        data: result,
        message: 'AI response generated successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('AI Response Generation Error', {
        error: error.message, userId, tenantId, conversationId
      });
      throw error;
    } }
  // ==================== ANALYTICS & INSIGHTS ====================

  /**
   * Get analytics for generated content
   */
  async getContentPerformance (req, res) {
    // TODO: Add await statements
    const { contentId, dateRange, metrics } = req.query;
    const userId = req.user.id;
    const { tenantId } = req;

    logger.info('AI Content Performance Request', {
      userId,
      tenantId,
      contentId,
      dateRange,
      metrics
    });

    try {
      const result = await aiService.getContentPerformance({
        contentId,
        dateRange,
        metrics: metrics ? metrics.split(',') : undefined,
        userId,
        tenantId
      });

      res.json({
        success: true,
        data: result,
        message: 'Content performance retrieved successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('AI Content Performance Error', {
        error: error.message, userId, tenantId, contentId
      });
      throw error;
    } }
  /**
   * Get insights from AI conversations
   */
  async getConversationInsights (req, res) {
    // TODO: Add await statements
    const { conversationId, dateRange } = req.query;
    const userId = req.user.id;
    const { tenantId } = req;

    logger.info('AI Conversation Insights Request', {
      userId,
      tenantId,
      conversationId,
      dateRange
    });

    try {
      const result = await aiService.getConversationInsights({
        conversationId,
        dateRange,
        userId,
        tenantId
      });

      res.json({
        success: true,
        data: result,
        message: 'Conversation insights retrieved successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('AI Conversation Insights Error', {
        error: error.message, userId, tenantId, conversationId
      });
      throw error;
    } }
  /**
   * Get AI usage statistics
   */
  async getUsageAnalytics (req, res) {
    // TODO: Add await statements
    const { userId: targetUserId, dateRange, type } = req.query;
    const userId = req.user.id;
    const { tenantId } = req;

    logger.info('AI Usage Analytics Request', {
      userId,
      tenantId,
      targetUserId,
      dateRange,
      type
    });

    try {
      const result = await aiService.getUsageAnalytics({
        userId: targetUserId || userId,
        dateRange,
        type,
        tenantId
      });

      res.json({
        success: true,
        data: result,
        message: 'Usage analytics retrieved successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('AI Usage Analytics Error', {
        error: error.message, userId, tenantId
      });
      throw error;
    } }
  // ==================== TRAINING-SPECIFIC AI ENDPOINTS ====================

  /**
   * Generate complete training modules
   */
  async generateTrainingModule (req, res) {
    // TODO: Add await statements
    const { topic, options } = req.body;
    const userId = req.user.id;
    const { tenantId } = req;

    logger.info('AI Training Module Generation Request', {
      userId,
      tenantId,
      topic,
      options
    });

    try {
      const result = await aiService.generateTrainingModule({
        topic,
        options,
        userId,
        tenantId
      });

      res.json({
        success: true,
        data: result,
        message: 'Training module generated successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('AI Training Module Generation Error', {
        error: error.message, userId, tenantId
      });
      throw error;
    } }
  /**
   * Generate practical exercises and activities
   */
  async generateExercises (req, res) {
    // TODO: Add await statements
    const { topic, options } = req.body;
    const userId = req.user.id;
    const { tenantId } = req;

    logger.info('AI Exercises Generation Request', {
      userId,
      tenantId,
      topic,
      options
    });

    try {
      const result = await aiService.generateExercises({
        topic,
        options,
        userId,
        tenantId
      });

      res.json({
        success: true,
        data: result,
        message: 'Exercises generated successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('AI Exercises Generation Error', {
        error: error.message, userId, tenantId
      });
      throw error;
    } }
  /**
   * Generate case studies and scenarios
   */
  async generateCaseStudies (req, res) {
    // TODO: Add await statements
    const { topic, options } = req.body;
    const userId = req.user.id;
    const { tenantId } = req;

    logger.info('AI Case Studies Generation Request', {
      userId,
      tenantId,
      topic,
      options
    });

    try {
      const result = await aiService.generateCaseStudies({
        topic,
        options,
        userId,
        tenantId
      });

      res.json({
        success: true,
        data: result,
        message: 'Case studies generated successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('AI Case Studies Generation Error', {
        error: error.message, userId, tenantId
      });
      throw error;
    } }
  /**
   * Generate quizzes and assessments
   */
  async generateQuiz (req, res) {
    // TODO: Add await statements
    const { topic, options } = req.body;
    const userId = req.user.id;
    const { tenantId } = req;

    logger.info('AI Quiz Generation Request', {
      userId,
      tenantId,
      topic,
      options
    });

    try {
      const result = await aiService.generateQuiz({
        topic,
        options,
        userId,
        tenantId
      });

      res.json({
        success: true,
        data: result,
        message: 'Quiz generated successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('AI Quiz Generation Error', {
        error: error.message, userId, tenantId
      });
      throw error;
    } }
  /**
   * Generate scenario-based assessments
   */
  async generateScenarios (req, res) {
    // TODO: Add await statements
    const { topic, options } = req.body;
    const userId = req.user.id;
    const { tenantId } = req;

    logger.info('AI Scenarios Generation Request', {
      userId,
      tenantId,
      topic,
      options
    });

    try {
      const result = await aiService.generateScenarios({
        topic,
        options,
        userId,
        tenantId
      });

      res.json({
        success: true,
        data: result,
        message: 'Scenarios generated successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('AI Scenarios Generation Error', {
        error: error.message, userId, tenantId
      });
      throw error;
    } }
  // ==================== CONTENT MANAGEMENT ====================

  /**
   * Save generated content to library
   */
  async saveContent (req, res) {
    // TODO: Add await statements
    const { title, content, type, category, tags, metadata } = req.body;
    const userId = req.user.id;
    const { tenantId } = req;

    logger.info('AI Content Save Request', {
      userId,
      tenantId,
      title,
      type,
      category,
      tagsCount: tags?.length
    });

    try {
      const result = await aiService.saveContent({
        title,
        content,
        type,
        category,
        tags,
        metadata,
        userId,
        tenantId
      });

      res.json({
        success: true,
        data: result,
        message: 'Content saved successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('AI Content Save Error', {
        error: error.message, userId, tenantId
      });
      throw error;
    } }
  /**
   * Get saved content from library
   */
  async getContentLibrary (req, res) {
    // TODO: Add await statements
    const { type, category, status, search, page = 1, limit = 10 } = req.query;
    const userId = req.user.id;
    const { tenantId } = req;

    logger.info('AI Content Library Request', {
      userId,
      tenantId,
      type,
      category,
      status,
      search,
      page,
      limit
    });

    try {
      const result = await aiService.getContentLibrary({
        userId,
        tenantId,
        type,
        category,
        status,
        search,
        page: parseInt(page),
        limit: parseInt(limit)
      });

      res.json({
        success: true,
        data: result,
        message: 'Content library retrieved successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('AI Content Library Error', {
        error: error.message, userId, tenantId
      });
      throw error;
    } }
  /**
   * Update saved content
   */
  async updateContent (req, res) {
    // TODO: Add await statements
    const { contentId } = req.params;
    const updateData = req.body;
    const userId = req.user.id;
    const { tenantId } = req;

    logger.info('AI Content Update Request', {
      userId,
      tenantId,
      contentId,
      updateFields: Object.keys(updateData)
    });

    try {
      const result = await aiService.updateContent({
        contentId,
        updateData,
        userId,
        tenantId
      });

      res.json({
        success: true,
        data: result,
        message: 'Content updated successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('AI Content Update Error', {
        error: error.message, userId, tenantId, contentId
      });
      throw error;
    } }
  /**
   * Delete content from library
   */
  async deleteContent (req, res) {
    // TODO: Add await statements
    const { contentId } = req.params;
    const userId = req.user.id;
    const { tenantId } = req;

    logger.info('AI Content Deletion Request', {
      userId,
      tenantId,
      contentId
    });

    try {
      await aiService.deleteContent({
        contentId,
        userId,
        tenantId
      });

      res.json({
        success: true,
        message: 'Content deleted successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('AI Content Deletion Error', {
        error: error.message, userId, tenantId, contentId
      });
      throw error;
    } }
  /**
   * Get available content templates
   */
  async getTemplates (req, res) {
    // TODO: Add await statements
    const userId = req.user.id;
    const { tenantId } = req;

    logger.info('AI Templates Request', {
      userId,
      tenantId
    });

    try {
      const result = await aiService.getTemplates({
        userId,
        tenantId
      });

      res.json({
        success: true,
        data: result,
        message: 'Templates retrieved successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('AI Templates Error', {
        error: error.message, userId, tenantId
      });
      throw error;
    } }
  /**
   * Create custom content template
   */
  async createTemplate (req, res) {
    // TODO: Add await statements
    const { name, description, type, platform, prompt, variables } = req.body;
    const userId = req.user.id;
    const { tenantId } = req;

    logger.info('AI Template Creation Request', {
      userId,
      tenantId,
      name,
      type,
      platform
    });

    try {
      const result = await aiService.createTemplate({
        name,
        description,
        type,
        platform,
        prompt,
        variables,
        userId,
        tenantId
      });

      res.json({
        success: true,
        data: result,
        message: 'Template created successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('AI Template Creation Error', {
        error: error.message, userId, tenantId
      });
      throw error;
    } }
  // ==================== PERSONALIZATION & PREFERENCES ====================

  /**
   * Get user's AI preferences
   */
  async getPreferences (req, res) {
    // TODO: Add await statements
    const userId = req.user.id;
    const { tenantId } = req;

    logger.info('AI Preferences Request', {
      userId,
      tenantId
    });

    try {
      const result = await aiService.getPreferences({
        userId,
        tenantId
      });

      res.json({
        success: true,
        data: result,
        message: 'Preferences retrieved successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('AI Preferences Error', {
        error: error.message, userId, tenantId
      });
      throw error;
    } }
  /**
   * Update AI preferences
   */
  async updatePreferences (req, res) {
    // TODO: Add await statements
    const preferences = req.body;
    const userId = req.user.id;
    const { tenantId } = req;

    logger.info('AI Preferences Update Request', {
      userId,
      tenantId,
      preferenceFields: Object.keys(preferences)
    });

    try {
      const result = await aiService.updatePreferences({
        preferences,
        userId,
        tenantId
      });

      res.json({
        success: true,
        data: result,
        message: 'Preferences updated successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('AI Preferences Update Error', {
        error: error.message, userId, tenantId
      });
      throw error;
    } }
  /**
   * Get available niches and suggestions
   */
  async getNiches (req, res) {
    // TODO: Add await statements
    const userId = req.user.id;
    const { tenantId } = req;

    logger.info('AI Niches Request', {
      userId,
      tenantId
    });

    try {
      const result = await aiService.getNiches({
        userId,
        tenantId
      });

      res.json({
        success: true,
        data: result,
        message: 'Niches retrieved successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('AI Niches Error', {
        error: error.message, userId, tenantId
      });
      throw error;
    } }
  /**
   * Set user's primary niche
   */
  async setNiche (req, res) {
    // TODO: Add await statements
    const { niche, description, keywords } = req.body;
    const userId = req.user.id;
    const { tenantId } = req;

    logger.info('AI Niche Setting Request', {
      userId,
      tenantId,
      niche,
      keywordsCount: keywords?.length
    });

    try {
      const result = await aiService.setNiche({
        niche,
        description,
        keywords,
        userId,
        tenantId
      });

      res.json({
        success: true,
        data: result,
        message: 'Niche set successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('AI Niche Setting Error', {
        error: error.message, userId, tenantId
      });
      throw error;
    } }
  // ==================== PERFORMANCE & MONITORING ====================

  /**
   * Check AI service health
   */
  async getHealth (req, res) {
    // TODO: Add await statements
    const userId = req.user.id;
    const { tenantId } = req;

    logger.info('AI Health Check Request', {
      userId,
      tenantId
    });

    try {
      const result = await aiService.getHealth({
        userId,
        tenantId
      });

      res.json({
        success: true,
        data: result,
        message: 'AI service health check completed',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('AI Health Check Error', {
        error: error.message, userId, tenantId
      });
      throw error;
    } }
  /**
   * Get current rate limit status
   */
  async getRateLimits (req, res) {
    // TODO: Add await statements
    const userId = req.user.id;
    const { tenantId } = req;

    logger.info('AI Rate Limits Request', {
      userId,
      tenantId
    });

    try {
      const result = await aiService.getRateLimits({
        userId,
        tenantId
      });

      res.json({
        success: true,
        data: result,
        message: 'Rate limits retrieved successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('AI Rate Limits Error', {
        error: error.message, userId, tenantId
      });
      throw error;
    } }
}
// Create controller instance
const aiController = new AIController();


// Export wrapped methods with error handling
module.exports = {

  // Content Generation
  generateContent: asyncHandler(aiController.generateContent.bind(aiController)),
  generateTrainingMaterial: asyncHandler(aiController.generateTrainingMaterial.bind(aiController)),
  generateAssessmentQuestions: asyncHandler(aiController.generateAssessmentQuestions.bind(aiController)),
  generatePresentationOutline: asyncHandler(aiController.generatePresentationOutline.bind(aiController)),


  // Content Improvement
  improveContent: asyncHandler(aiController.improveContent.bind(aiController)),
  translateContent: asyncHandler(aiController.translateContent.bind(aiController)),


  // Specialized Content Generation
  generateBlogPost: asyncHandler(aiController.generateBlogPost.bind(aiController)),
  generateSocialMedia: asyncHandler(aiController.generateSocialMedia.bind(aiController)),
  generateEmail: asyncHandler(aiController.generateEmail.bind(aiController)),
  generateProductDescription: asyncHandler(aiController.generateProductDescription.bind(aiController)),


  // Media Content Generation
  generateImagePrompt: asyncHandler(aiController.generateImagePrompt.bind(aiController)),
  generateVideoScript: asyncHandler(aiController.generateVideoScript.bind(aiController)),
  generateAudioScript: asyncHandler(aiController.generateAudioScript.bind(aiController)),


  // AI Chatbot
  createConversation: asyncHandler(aiController.createConversation.bind(aiController)),
  getConversations: asyncHandler(aiController.getConversations.bind(aiController)),
  getConversation: asyncHandler(aiController.getConversation.bind(aiController)),
  deleteConversation: asyncHandler(aiController.deleteConversation.bind(aiController)),
  sendMessage: asyncHandler(aiController.sendMessage.bind(aiController)),
  generateResponse: asyncHandler(aiController.generateResponse.bind(aiController)),


  // Analytics & Insights
  getContentPerformance: asyncHandler(aiController.getContentPerformance.bind(aiController)),
  getConversationInsights: asyncHandler(aiController.getConversationInsights.bind(aiController)),
  getUsageAnalytics: asyncHandler(aiController.getUsageAnalytics.bind(aiController)),


  // Training-Specific AI
  generateTrainingModule: asyncHandler(aiController.generateTrainingModule.bind(aiController)),
  generateExercises: asyncHandler(aiController.generateExercises.bind(aiController)),
  generateCaseStudies: asyncHandler(aiController.generateCaseStudies.bind(aiController)),
  generateQuiz: asyncHandler(aiController.generateQuiz.bind(aiController)),
  generateScenarios: asyncHandler(aiController.generateScenarios.bind(aiController)),


  // Content Management
  saveContent: asyncHandler(aiController.saveContent.bind(aiController)),
  getContentLibrary: asyncHandler(aiController.getContentLibrary.bind(aiController)),
  updateContent: asyncHandler(aiController.updateContent.bind(aiController)),
  deleteContent: asyncHandler(aiController.deleteContent.bind(aiController)),
  getTemplates: asyncHandler(aiController.getTemplates.bind(aiController)),
  createTemplate: asyncHandler(aiController.createTemplate.bind(aiController)),


  // Personalization & Preferences
  getPreferences: asyncHandler(aiController.getPreferences.bind(aiController)),
  updatePreferences: asyncHandler(aiController.updatePreferences.bind(aiController)),
  getNiches: asyncHandler(aiController.getNiches.bind(aiController)),
  setNiche: asyncHandler(aiController.setNiche.bind(aiController)),


  // Performance & Monitoring
  getHealth: asyncHandler(aiController.getHealth.bind(aiController)),
  getRateLimits: asyncHandler(aiController.getRateLimits.bind(aiController))
}