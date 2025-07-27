/**
 * Enhanced AI Service Module
 * Comprehensive AI service supporting all frontend requirements
 */

const Groq = require('groq-sdk');
const OpenAI = require('openai');
const crypto = require('crypto');
const logger = require('../utils/logger');
const cacheManager = require('../utils/cache');

class EnhancedAIService {
  constructor() {
    this.groqClient = null;
    this.openaiClient = null;
    this.isInitialized = false;
    this.defaultModel = process.env.AI_MODEL || 'llama-3.3-70b-versatile';
    this.maxTokens = parseInt(process.env.AI_MAX_TOKENS) || 4096;
    this.temperature = parseFloat(process.env.AI_TEMPERATURE) || 0.7;
    this.topP = parseFloat(process.env.AI_TOP_P) || 0.9;
    this.frequencyPenalty = parseFloat(process.env.AI_FREQUENCY_PENALTY) || 0.0;
    this.presencePenalty = parseFloat(process.env.AI_PRESENCE_PENALTY) || 0.0;
    
    // Rate limiting
    this.rateLimits = {
      standard: { perMinute: 60, perHour: 1000 },
      premium: { perMinute: 120, perHour: 2000 },
      enterprise: { perMinute: 300, perHour: 5000 }
    };
    
    // In-memory storage (in production, use proper databases)
    this.conversations = new Map();
    this.contentLibrary = new Map();
    this.templates = new Map();
    this.userPreferences = new Map();
    this.usageStats = new Map();
  }

  /**
   * Initialize AI service
   */
  async initialize() {
    try {
      logger.info('🤖 Initializing Enhanced AI Service...');

      // Initialize Groq client
      if (process.env.GROQ_API_KEY) {
        this.groqClient = new Groq({
          apiKey: process.env.GROQ_API_KEY,
        });
        logger.info('✅ Groq client initialized');
      } else {
        logger.warn('⚠️ GROQ_API_KEY not found - AI features disabled');
      }

      // Initialize OpenAI client
      if (process.env.OPENAI_API_KEY) {
        this.openaiClient = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });
        logger.info('✅ OpenAI client initialized');
      } else {
        logger.warn('⚠️ OPENAI_API_KEY not found - Some features disabled');
      }

      this.isInitialized = true;
      logger.info('🎉 Enhanced AI Service initialized successfully');
      
      return true;
    } catch (error) {
      logger.error('❌ Failed to initialize Enhanced AI Service:', error.message);
      throw error;
    }
  }

  /**
   * Generate content with enhanced options
   */
  async generateContent({ type, prompt, context, options, userId, tenantId }) {
    try {
      if (!this.isInitialized || !this.groqClient) {
        throw new Error('AI Service not available');
      }

      const {
        maxTokens = this.maxTokens,
        temperature = this.temperature,
        tone = 'professional',
        length = 'medium',
        style = 'informative',
        language = 'english'
      } = options || {};

      // Build system prompt based on type and options
      let systemPrompt = this.buildSystemPrompt(type, { tone, style, length, language });
      
      // Add context if provided
      let enhancedPrompt = prompt;
      if (context) {
        enhancedPrompt = `Context: ${context}\n\nRequest: ${prompt}`;
      }

      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: enhancedPrompt }
      ];

      const completion = await this.groqClient.chat.completions.create({
        model: this.defaultModel,
        messages,
        max_tokens: maxTokens,
        temperature,
        top_p: this.topP,
        frequency_penalty: this.frequencyPenalty,
        presence_penalty: this.presencePenalty,
        stream: false
      });

      const content = completion.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content generated');
      }

      // Track usage
      this.trackUsage(userId, 'content_generation', type);

      return {
        content,
        metadata: {
          tokens: completion.usage?.total_tokens || 0,
          processingTime: Date.now(),
          model: this.defaultModel,
          type,
          options
        }
      };
    } catch (error) {
      logger.error('AI Content Generation Error:', error.message);
      throw error;
    }
  }

  /**
   * Generate training materials
   */
  async generateTrainingMaterial({ topic, context, options, userId, tenantId }) {
    const enhancedOptions = {
      ...options,
      type: 'training_material',
      tone: 'educational',
      style: 'structured'
    };

    const prompt = `Create comprehensive training material about: ${topic}`;
    
    return this.generateContent({
      type: 'training_material',
      prompt,
      context,
      options: enhancedOptions,
      userId,
      tenantId
    });
  }

  /**
   * Generate assessment questions
   */
  async generateAssessmentQuestions({ topic, questionCount, options, userId, tenantId }) {
    const {
      types = ['multiple_choice', 'true_false'],
      difficulty = 'intermediate',
      timeLimit = 30
    } = options || {};

    const prompt = `Create ${questionCount} assessment questions about: ${topic}
    Question types: ${types.join(', ')}
    Difficulty: ${difficulty}
    Time limit: ${timeLimit} minutes`;

    return this.generateContent({
      type: 'assessment',
      prompt,
      options: { ...options, type: 'assessment' },
      userId,
      tenantId
    });
  }

  /**
   * Generate presentation outline
   */
  async generatePresentationOutline({ topic, options, userId, tenantId }) {
    const {
      duration = 'medium',
      style = 'educational',
      slideCount = 10
    } = options || {};

    const prompt = `Create a presentation outline about: ${topic}
    Duration: ${duration}
    Style: ${style}
    Number of slides: ${slideCount}`;

    return this.generateContent({
      type: 'presentation',
      prompt,
      options: { ...options, type: 'presentation' },
      userId,
      tenantId
    });
  }

  /**
   * Improve content
   */
  async improveContent({ content, improvement, options, userId, tenantId }) {
    const {
      targetLength,
      tone = 'professional',
      style = 'academic'
    } = options || {};

    let prompt = `Improve the following content for ${improvement}:`;
    
    if (targetLength) {
      prompt += ` Target length: ${targetLength} words.`;
    }
    
    if (tone) {
      prompt += ` Tone: ${tone}.`;
    }
    
    if (style) {
      prompt += ` Style: ${style}.`;
    }
    
    prompt += `\n\nContent:\n${content}`;

    return this.generateContent({
      type: 'improvement',
      prompt,
      options: { ...options, type: 'improvement' },
      userId,
      tenantId
    });
  }

  /**
   * Translate content
   */
  async translateContent({ content, targetLanguage, preserveTone, options, userId, tenantId }) {
    const {
      formality = 'formal',
      context = 'business'
    } = options || {};

    let prompt = `Translate the following content to ${targetLanguage}`;
    
    if (preserveTone) {
      prompt += ' while preserving the original tone';
    }
    
    prompt += `.\nFormality: ${formality}\nContext: ${context}\n\nContent:\n${content}`;

    return this.generateContent({
      type: 'translation',
      prompt,
      options: { ...options, type: 'translation' },
      userId,
      tenantId
    });
  }

  /**
   * Generate blog post
   */
  async generateBlogPost({ topic, options, userId, tenantId }) {
    const {
      length = 'medium',
      tone = 'professional',
      targetAudience = 'general',
      keywords = []
    } = options || {};

    let prompt = `Write a blog post about: ${topic}`;
    
    if (length) {
      prompt += `\nLength: ${length}`;
    }
    
    if (tone) {
      prompt += `\nTone: ${tone}`;
    }
    
    if (targetAudience) {
      prompt += `\nTarget audience: ${targetAudience}`;
    }
    
    if (keywords.length > 0) {
      prompt += `\nKeywords: ${keywords.join(', ')}`;
    }

    return this.generateContent({
      type: 'blog_post',
      prompt,
      options: { ...options, type: 'blog_post' },
      userId,
      tenantId
    });
  }

  /**
   * Generate social media content
   */
  async generateSocialMedia({ platform, topic, options, userId, tenantId }) {
    const {
      tone = 'engaging',
      includeHashtags = true,
      callToAction = ''
    } = options || {};

    let prompt = `Create ${platform} content about: ${topic}`;
    
    if (tone) {
      prompt += `\nTone: ${tone}`;
    }
    
    if (includeHashtags) {
      prompt += '\nInclude relevant hashtags';
    }
    
    if (callToAction) {
      prompt += `\nCall to action: ${callToAction}`;
    }

    return this.generateContent({
      type: 'social_media',
      prompt,
      options: { ...options, type: 'social_media', platform },
      userId,
      tenantId
    });
  }

  /**
   * Generate email content
   */
  async generateEmail({ type, topic, options, userId, tenantId }) {
    const {
      recipientType = 'client',
      tone = 'professional',
      includeCallToAction = true
    } = options || {};

    let prompt = `Write a ${type} email about: ${topic}`;
    
    if (recipientType) {
      prompt += `\nRecipient: ${recipientType}`;
    }
    
    if (tone) {
      prompt += `\nTone: ${tone}`;
    }
    
    if (includeCallToAction) {
      prompt += '\nInclude a call to action';
    }

    return this.generateContent({
      type: 'email',
      prompt,
      options: { ...options, type: 'email', emailType: type },
      userId,
      tenantId
    });
  }

  /**
   * Generate product description
   */
  async generateProductDescription({ productName, features, targetAudience, options, userId, tenantId }) {
    const {
      style = 'marketing',
      length = 'medium'
    } = options || {};

    let prompt = `Write a product description for: ${productName}`;
    
    if (targetAudience) {
      prompt += `\nTarget audience: ${targetAudience}`;
    }
    
    if (features && features.length > 0) {
      prompt += `\nFeatures: ${features.join(', ')}`;
    }
    
    if (style) {
      prompt += `\nStyle: ${style}`;
    }
    
    if (length) {
      prompt += `\nLength: ${length}`;
    }

    return this.generateContent({
      type: 'product_description',
      prompt,
      options: { ...options, type: 'product_description' },
      userId,
      tenantId
    });
  }

  /**
   * Generate image prompt
   */
  async generateImagePrompt({ description, style, options, userId, tenantId }) {
    const {
      aspectRatio = '16:9',
      mood = 'professional'
    } = options || {};

    let prompt = `Create a detailed image prompt for: ${description}`;
    
    if (style) {
      prompt += `\nStyle: ${style}`;
    }
    
    if (aspectRatio) {
      prompt += `\nAspect ratio: ${aspectRatio}`;
    }
    
    if (mood) {
      prompt += `\nMood: ${mood}`;
    }

    return this.generateContent({
      type: 'image_prompt',
      prompt,
      options: { ...options, type: 'image_prompt' },
      userId,
      tenantId
    });
  }

  /**
   * Generate video script
   */
  async generateVideoScript({ topic, duration, style, options, userId, tenantId }) {
    const {
      includeVisuals = true,
      targetAudience = 'general'
    } = options || {};

    let prompt = `Create a video script about: ${topic}`;
    
    if (duration) {
      prompt += `\nDuration: ${duration}`;
    }
    
    if (style) {
      prompt += `\nStyle: ${style}`;
    }
    
    if (includeVisuals) {
      prompt += '\nInclude visual descriptions';
    }
    
    if (targetAudience) {
      prompt += `\nTarget audience: ${targetAudience}`;
    }

    return this.generateContent({
      type: 'video_script',
      prompt,
      options: { ...options, type: 'video_script' },
      userId,
      tenantId
    });
  }

  /**
   * Generate audio script
   */
  async generateAudioScript({ topic, type, duration, options, userId, tenantId }) {
    const {
      tone = 'professional',
      includeMusic = true
    } = options || {};

    let prompt = `Create an audio script for ${type} about: ${topic}`;
    
    if (duration) {
      prompt += `\nDuration: ${duration} minutes`;
    }
    
    if (tone) {
      prompt += `\nTone: ${tone}`;
    }
    
    if (includeMusic) {
      prompt += '\nInclude music cues';
    }

    return this.generateContent({
      type: 'audio_script',
      prompt,
      options: { ...options, type: 'audio_script' },
      userId,
      tenantId
    });
  }

  // ==================== CONVERSATION MANAGEMENT ====================

  /**
   * Create a new conversation
   */
  async createConversation({ niche, title, initialMessage, userId, tenantId }) {
    const conversationId = crypto.randomUUID();
    const conversation = {
      id: conversationId,
      userId,
      tenantId,
      niche,
      title: title || `Conversation about ${niche}`,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (initialMessage) {
      conversation.messages.push({
        id: crypto.randomUUID(),
        content: initialMessage,
        type: 'user',
        timestamp: new Date()
      });
    }

    this.conversations.set(conversationId, conversation);
    
    return conversation;
  }

  /**
   * Get user's conversations
   */
  async getConversations({ userId, tenantId, page = 1, limit = 10, niche }) {
    const conversations = Array.from(this.conversations.values())
      .filter(conv => conv.userId === userId && conv.tenantId === tenantId)
      .filter(conv => !niche || conv.niche === niche)
      .sort((a, b) => b.updatedAt - a.updatedAt);

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedConversations = conversations.slice(startIndex, endIndex);

    return {
      conversations: paginatedConversations,
      pagination: {
        page,
        limit,
        total: conversations.length,
        pages: Math.ceil(conversations.length / limit)
      }
    };
  }

  /**
   * Get specific conversation
   */
  async getConversation({ conversationId, userId, tenantId }) {
    const conversation = this.conversations.get(conversationId);
    
    if (!conversation || conversation.userId !== userId || conversation.tenantId !== tenantId) {
      throw new Error('Conversation not found');
    }
    
    return conversation;
  }

  /**
   * Delete conversation
   */
  async deleteConversation({ conversationId, userId, tenantId }) {
    const conversation = this.conversations.get(conversationId);
    
    if (!conversation || conversation.userId !== userId || conversation.tenantId !== tenantId) {
      throw new Error('Conversation not found');
    }
    
    this.conversations.delete(conversationId);
    return { success: true };
  }

  /**
   * Send message in conversation
   */
  async sendMessage({ conversationId, content, type, metadata, userId, tenantId }) {
    const conversation = this.conversations.get(conversationId);
    
    if (!conversation || conversation.userId !== userId || conversation.tenantId !== tenantId) {
      throw new Error('Conversation not found');
    }

    const message = {
      id: crypto.randomUUID(),
      content,
      type: type || 'text',
      metadata: metadata || {},
      timestamp: new Date()
    };

    conversation.messages.push(message);
    conversation.updatedAt = new Date();

    return message;
  }

  /**
   * Generate AI response
   */
  async generateResponse({ message, conversationId, context, userId, tenantId }) {
    const conversation = conversationId ? this.conversations.get(conversationId) : null;
    
    let prompt = `User message: ${message}`;
    
    if (conversation) {
      const recentMessages = conversation.messages.slice(-5);
      const conversationContext = recentMessages
        .map(msg => `${msg.type}: ${msg.content}`)
        .join('\n');
      prompt = `Conversation context:\n${conversationContext}\n\nUser message: ${message}`;
    }
    
    if (context) {
      prompt = `Context: ${JSON.stringify(context)}\n\n${prompt}`;
    }

    const response = await this.generateContent({
      type: 'chat_response',
      prompt,
      options: { tone: 'helpful', style: 'conversational' },
      userId,
      tenantId
    });

    if (conversation) {
      const aiMessage = {
        id: crypto.randomUUID(),
        content: response.content,
        type: 'ai',
        timestamp: new Date()
      };
      conversation.messages.push(aiMessage);
      conversation.updatedAt = new Date();
    }

    return response;
  }

  // ==================== TRAINING-SPECIFIC AI ====================

  /**
   * Generate training module
   */
  async generateTrainingModule({ topic, options, userId, tenantId }) {
    const {
      duration = 2,
      difficulty = 'intermediate',
      format = 'interactive',
      includeAssessment = true,
      learningObjectives = []
    } = options || {};

    let prompt = `Create a complete training module about: ${topic}`;
    
    if (duration) {
      prompt += `\nDuration: ${duration} hours`;
    }
    
    if (difficulty) {
      prompt += `\nDifficulty: ${difficulty}`;
    }
    
    if (format) {
      prompt += `\nFormat: ${format}`;
    }
    
    if (includeAssessment) {
      prompt += '\nInclude assessment questions';
    }
    
    if (learningObjectives.length > 0) {
      prompt += `\nLearning objectives: ${learningObjectives.join(', ')}`;
    }

    return this.generateContent({
      type: 'training_module',
      prompt,
      options: { ...options, type: 'training_module' },
      userId,
      tenantId
    });
  }

  /**
   * Generate exercises
   */
  async generateExercises({ topic, options, userId, tenantId }) {
    const {
      type = 'individual',
      duration = 30,
      difficulty = 'intermediate',
      materials = []
    } = options || {};

    let prompt = `Create practical exercises for: ${topic}`;
    
    if (type) {
      prompt += `\nType: ${type}`;
    }
    
    if (duration) {
      prompt += `\nDuration: ${duration} minutes`;
    }
    
    if (difficulty) {
      prompt += `\nDifficulty: ${difficulty}`;
    }
    
    if (materials.length > 0) {
      prompt += `\nMaterials: ${materials.join(', ')}`;
    }

    return this.generateContent({
      type: 'exercises',
      prompt,
      options: { ...options, type: 'exercises' },
      userId,
      tenantId
    });
  }

  /**
   * Generate case studies
   */
  async generateCaseStudies({ topic, options, userId, tenantId }) {
    const {
      industry = 'general',
      complexity = 'moderate',
      includeSolutions = true,
      learningOutcomes = []
    } = options || {};

    let prompt = `Create case studies for: ${topic}`;
    
    if (industry) {
      prompt += `\nIndustry: ${industry}`;
    }
    
    if (complexity) {
      prompt += `\nComplexity: ${complexity}`;
    }
    
    if (includeSolutions) {
      prompt += '\nInclude solutions';
    }
    
    if (learningOutcomes.length > 0) {
      prompt += `\nLearning outcomes: ${learningOutcomes.join(', ')}`;
    }

    return this.generateContent({
      type: 'case_studies',
      prompt,
      options: { ...options, type: 'case_studies' },
      userId,
      tenantId
    });
  }

  /**
   * Generate quiz
   */
  async generateQuiz({ topic, options, userId, tenantId }) {
    const {
      questionCount = 10,
      types = ['multiple_choice', 'true_false'],
      difficulty = 'intermediate',
      timeLimit = 30,
      passingScore = 70
    } = options || {};

    let prompt = `Create a quiz about: ${topic}`;
    
    if (questionCount) {
      prompt += `\nQuestions: ${questionCount}`;
    }
    
    if (types.length > 0) {
      prompt += `\nQuestion types: ${types.join(', ')}`;
    }
    
    if (difficulty) {
      prompt += `\nDifficulty: ${difficulty}`;
    }
    
    if (timeLimit) {
      prompt += `\nTime limit: ${timeLimit} minutes`;
    }
    
    if (passingScore) {
      prompt += `\nPassing score: ${passingScore}%`;
    }

    return this.generateContent({
      type: 'quiz',
      prompt,
      options: { ...options, type: 'quiz' },
      userId,
      tenantId
    });
  }

  /**
   * Generate scenarios
   */
  async generateScenarios({ topic, options, userId, tenantId }) {
    const {
      scenarioCount = 5,
      complexity = 'moderate',
      includeMultipleChoice = true,
      includeEssay = true
    } = options || {};

    let prompt = `Create scenario-based assessments for: ${topic}`;
    
    if (scenarioCount) {
      prompt += `\nNumber of scenarios: ${scenarioCount}`;
    }
    
    if (complexity) {
      prompt += `\nComplexity: ${complexity}`;
    }
    
    if (includeMultipleChoice) {
      prompt += '\nInclude multiple choice questions';
    }
    
    if (includeEssay) {
      prompt += '\nInclude essay questions';
    }

    return this.generateContent({
      type: 'scenarios',
      prompt,
      options: { ...options, type: 'scenarios' },
      userId,
      tenantId
    });
  }

  // ==================== CONTENT MANAGEMENT ====================

  /**
   * Save content to library
   */
  async saveContent({ title, content, type, category, tags, metadata, userId, tenantId }) {
    const contentId = crypto.randomUUID();
    const savedContent = {
      id: contentId,
      title,
      content,
      type,
      category,
      tags: tags || [],
      metadata: metadata || {},
      userId,
      tenantId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.contentLibrary.set(contentId, savedContent);
    
    return savedContent;
  }

  /**
   * Get content library
   */
  async getContentLibrary({ userId, tenantId, type, category, status, search, page = 1, limit = 10 }) {
    let contents = Array.from(this.contentLibrary.values())
      .filter(content => content.userId === userId && content.tenantId === tenantId);

    if (type) {
      contents = contents.filter(content => content.type === type);
    }
    
    if (category) {
      contents = contents.filter(content => content.category === category);
    }
    
    if (search) {
      contents = contents.filter(content => 
        content.title.toLowerCase().includes(search.toLowerCase()) ||
        content.content.toLowerCase().includes(search.toLowerCase())
      );
    }

    contents.sort((a, b) => b.updatedAt - a.updatedAt);

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedContents = contents.slice(startIndex, endIndex);

    return {
      contents: paginatedContents,
      pagination: {
        page,
        limit,
        total: contents.length,
        pages: Math.ceil(contents.length / limit)
      }
    };
  }

  /**
   * Update content
   */
  async updateContent({ contentId, updateData, userId, tenantId }) {
    const content = this.contentLibrary.get(contentId);
    
    if (!content || content.userId !== userId || content.tenantId !== tenantId) {
      throw new Error('Content not found');
    }

    Object.assign(content, updateData, { updatedAt: new Date() });
    
    return content;
  }

  /**
   * Delete content
   */
  async deleteContent({ contentId, userId, tenantId }) {
    const content = this.contentLibrary.get(contentId);
    
    if (!content || content.userId !== userId || content.tenantId !== tenantId) {
      throw new Error('Content not found');
    }

    this.contentLibrary.delete(contentId);
    return { success: true };
  }

  /**
   * Get templates
   */
  async getTemplates({ userId, tenantId }) {
    // Return default templates and user-specific templates
    const defaultTemplates = [
      {
        id: 'social-post',
        name: 'Social Media Post',
        description: 'Template for social media content',
        type: 'social',
        platform: 'general',
        prompt: 'Create an engaging social media post about {topic}',
        variables: ['topic']
      },
      {
        id: 'email-newsletter',
        name: 'Email Newsletter',
        description: 'Template for email newsletters',
        type: 'email',
        platform: 'email',
        prompt: 'Write a newsletter about {topic}',
        variables: ['topic']
      }
    ];

    const userTemplates = Array.from(this.templates.values())
      .filter(template => template.userId === userId && template.tenantId === tenantId);

    return [...defaultTemplates, ...userTemplates];
  }

  /**
   * Create template
   */
  async createTemplate({ name, description, type, platform, prompt, variables, userId, tenantId }) {
    const templateId = crypto.randomUUID();
    const template = {
      id: templateId,
      name,
      description,
      type,
      platform,
      prompt,
      variables: variables || [],
      userId,
      tenantId,
      createdAt: new Date()
    };

    this.templates.set(templateId, template);
    
    return template;
  }

  // ==================== PREFERENCES & PERSONALIZATION ====================

  /**
   * Get user preferences
   */
  async getPreferences({ userId, tenantId }) {
    const preferences = this.userPreferences.get(`${userId}-${tenantId}`) || {
      defaultTone: 'professional',
      preferredLanguage: 'english',
      contentStyle: 'informative',
      autoSave: true,
      notifications: {
        contentReady: true,
        insights: true
      }
    };

    return preferences;
  }

  /**
   * Update preferences
   */
  async updatePreferences({ preferences, userId, tenantId }) {
    const key = `${userId}-${tenantId}`;
    const existingPreferences = this.userPreferences.get(key) || {};
    
    this.userPreferences.set(key, { ...existingPreferences, ...preferences });
    
    return this.userPreferences.get(key);
  }

  /**
   * Get niches
   */
  async getNiches({ userId, tenantId }) {
    const niches = [
      'Technology',
      'Healthcare',
      'Education',
      'Finance',
      'Marketing',
      'Sales',
      'Customer Service',
      'Human Resources',
      'Operations',
      'Strategy',
      'Leadership',
      'Innovation',
      'Sustainability',
      'Digital Transformation',
      'Data Analytics',
      'Cybersecurity',
      'Artificial Intelligence',
      'Blockchain',
      'E-commerce',
      'Content Creation'
    ];

    return niches.map(niche => ({
      name: niche,
      description: `${niche} related content and training`,
      keywords: [niche.toLowerCase(), 'business', 'professional']
    }));
  }

  /**
   * Set user niche
   */
  async setNiche({ niche, description, keywords, userId, tenantId }) {
    const userNiche = {
      niche,
      description,
      keywords: keywords || [],
      userId,
      tenantId,
      setAt: new Date()
    };

    // Store in user preferences
    const key = `${userId}-${tenantId}`;
    const preferences = this.userPreferences.get(key) || {};
    preferences.primaryNiche = userNiche;
    this.userPreferences.set(key, preferences);

    return userNiche;
  }

  // ==================== ANALYTICS & INSIGHTS ====================

  /**
   * Get content performance
   */
  async getContentPerformance({ contentId, dateRange, metrics, userId, tenantId }) {
    // Mock analytics data
    return {
      engagement: {
        views: Math.floor(Math.random() * 2000) + 500,
        likes: Math.floor(Math.random() * 200) + 50,
        shares: Math.floor(Math.random() * 100) + 20,
        comments: Math.floor(Math.random() * 50) + 10
      },
      performance: {
        ctr: (Math.random() * 0.15 + 0.05).toFixed(3),
        conversionRate: (Math.random() * 0.2 + 0.1).toFixed(3),
        bounceRate: (Math.random() * 0.4 + 0.2).toFixed(3)
      },
      audience: {
        demographics: {
          age: { '18-24': 25, '25-34': 35, '35-44': 25, '45+': 15 },
          gender: { male: 45, female: 55 }
        },
        interests: ['technology', 'business', 'education'],
        behavior: { avgTimeOnPage: 120, pagesPerSession: 2.5 }
      }
    };
  }

  /**
   * Get conversation insights
   */
  async getConversationInsights({ conversationId, dateRange, userId, tenantId }) {
    const conversation = this.conversations.get(conversationId);
    
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    return {
      totalMessages: conversation.messages.length,
      userMessages: conversation.messages.filter(m => m.type === 'user').length,
      aiMessages: conversation.messages.filter(m => m.type === 'ai').length,
      averageResponseTime: 2.5,
      topics: [conversation.niche],
      sentiment: 'positive',
      engagement: 'high'
    };
  }

  /**
   * Get usage analytics
   */
  async getUsageAnalytics({ userId, dateRange, type, tenantId }) {
    const userStats = this.usageStats.get(`${userId}-${tenantId}`) || {
      totalRequests: 0,
      contentGenerated: 0,
      conversations: 0
    };

    return {
      totalRequests: userStats.totalRequests + Math.floor(Math.random() * 100) + 50,
      contentGenerated: userStats.contentGenerated + Math.floor(Math.random() * 30) + 20,
      conversations: userStats.conversations + Math.floor(Math.random() * 10) + 5,
      popularFeatures: ['content-generation', 'chat-assistant', 'translation'],
      usageByType: {
        text: Math.floor(Math.random() * 60) + 30,
        image: Math.floor(Math.random() * 25) + 15,
        video: Math.floor(Math.random() * 15) + 10
      }
    };
  }

  // ==================== PERFORMANCE & MONITORING ====================

  /**
   * Get health status
   */
  async getHealth({ userId, tenantId }) {
    return {
      status: 'healthy',
      models: {
        'llama-3.3-70b-versatile': 'available',
        'llama-3.1-8b-instant': 'available',
        'mixtral-8x7b-32768': 'available'
      },
      responseTime: 2.5,
      uptime: 99.9,
      lastCheck: new Date()
    };
  }

  /**
   * Get rate limits
   */
  async getRateLimits({ userId, tenantId }) {
    const userPlan = 'standard'; // In production, get from user profile
    const limits = this.rateLimits[userPlan];
    
    return {
      requestsPerMinute: limits.perMinute,
      requestsPerHour: limits.perHour,
      currentUsage: {
        minute: Math.floor(Math.random() * 20) + 5,
        hour: Math.floor(Math.random() * 100) + 50
      },
      resetTime: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes from now
    };
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Build system prompt based on type and options
   */
  buildSystemPrompt(type, options = {}) {
    const { tone, style, length, language } = options;
    
    let systemPrompt = 'You are a helpful AI assistant. ';
    
    switch (type) {
      case 'training_material':
        systemPrompt += 'Create comprehensive, engaging, and educational training materials. Focus on practical examples, clear explanations, and actionable insights.';
        break;
      case 'assessment':
        systemPrompt += 'Create clear, fair, and comprehensive assessment questions that effectively test understanding and knowledge.';
        break;
      case 'presentation':
        systemPrompt += 'Create well-structured, engaging presentation outlines that effectively communicate key points.';
        break;
      case 'blog_post':
        systemPrompt += 'Create engaging, informative blog posts with clear structure and compelling content.';
        break;
      case 'social_media':
        systemPrompt += 'Create engaging, platform-appropriate social media content that drives engagement.';
        break;
      case 'email':
        systemPrompt += 'Create professional, clear, and effective email content for various business scenarios.';
        break;
      case 'translation':
        systemPrompt += 'Provide accurate translations while preserving the original meaning and tone.';
        break;
      case 'improvement':
        systemPrompt += 'Improve content while maintaining its core message and enhancing clarity, style, and effectiveness.';
        break;
      default:
        systemPrompt += 'Provide clear, accurate, and useful responses.';
    }
    
    if (tone) {
      systemPrompt += ` Maintain a ${tone} tone.`;
    }
    
    if (style) {
      systemPrompt += ` Use a ${style} style.`;
    }
    
    if (length) {
      systemPrompt += ` Keep the content ${length} in length.`;
    }
    
    if (language && language !== 'english') {
      systemPrompt += ` Respond in ${language}.`;
    }
    
    return systemPrompt;
  }

  /**
   * Track usage statistics
   */
  trackUsage(userId, action, type) {
    const key = `${userId}-${Date.now()}`;
    const stats = this.usageStats.get(key) || {
      totalRequests: 0,
      contentGenerated: 0,
      conversations: 0
    };
    
    stats.totalRequests++;
    
    if (action === 'content_generation') {
      stats.contentGenerated++;
    } else if (action === 'conversation') {
      stats.conversations++;
    }
    
    this.usageStats.set(key, stats);
  }
}

// Create and export singleton instance
const enhancedAIService = new EnhancedAIService();

module.exports = enhancedAIService; 