/**
 * AI Service Module
 * Handles content generation using Groq API with RAG capabilities
 */

const Groq = require('groq-sdk');
const OpenAI = require('openai');
const crypto = require('crypto');
const logger = require('../utils/logger');

class AIService {
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
    
    // RAG Configuration
    this.ragEnabled = process.env.RAG_ENABLED === 'true';
    this.ragChunkSize = parseInt(process.env.RAG_CHUNK_SIZE) || 1000;
    this.ragChunkOverlap = parseInt(process.env.RAG_CHUNK_OVERLAP) || 200;
    this.ragMaxResults = parseInt(process.env.RAG_MAX_RESULTS) || 5;
    this.ragSimilarityThreshold = parseFloat(process.env.RAG_SIMILARITY_THRESHOLD) || 0.7;
    
    // In-memory knowledge base for RAG (in production, use a proper vector database)
    this.knowledgeBase = new Map();
    this.vectorIndex = new Map();
  }

  /**
   * Initialize AI service with API keys
   */
  async initialize() {
    try {
      logger.info('🤖 Initializing AI Service...');

      // Initialize Groq client
      if (process.env.GROQ_API_KEY) {
        this.groqClient = new Groq({
          apiKey: process.env.GROQ_API_KEY,
        });
        logger.info('✅ Groq client initialized');
      } else {
        logger.warn('⚠️ GROQ_API_KEY not found - Groq features disabled');
      }

      // Initialize OpenAI client (for embeddings)
      if (process.env.OPENAI_API_KEY) {
        this.openaiClient = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });
        logger.info('✅ OpenAI client initialized');
      } else {
        logger.warn('⚠️ OPENAI_API_KEY not found - RAG features disabled');
        this.ragEnabled = false;
      }

      this.isInitialized = true;
      logger.info('🎉 AI Service initialized successfully');
      
      return true;
    } catch (error) {
      logger.error('❌ Failed to initialize AI Service:', error.message);
      throw error;
    }
  }

  /**
   * Generate content using Groq API
   */
  async generateContent(prompt, options = {}) {
    try {
      if (!this.isInitialized) {
        throw new Error('AI Service not initialized');
      }

      if (!this.groqClient) {
        throw new Error('Groq client not available');
      }

      const {
        model = this.defaultModel,
        maxTokens = this.maxTokens,
        temperature = this.temperature,
        topP = this.topP,
        frequencyPenalty = this.frequencyPenalty,
        presencePenalty = this.presencePenalty,
        systemPrompt = null,
        context = null
      } = options;

      // Build messages array
      const messages = [];
      
      if (systemPrompt) {
        messages.push({
          role: 'system',
          content: systemPrompt
        });
      }

      // Add context if provided
      if (context) {
        messages.push({
          role: 'user',
          content: `Context: ${context}\n\nUser Request: ${prompt}`
        });
      } else {
        messages.push({
          role: 'user',
          content: prompt
        });
      }

      logger.info(`🤖 Generating content with model: ${model}`);

      const completion = await this.groqClient.chat.completions.create({
        messages,
        model,
        max_tokens: maxTokens,
        temperature,
        top_p: topP,
        frequency_penalty: frequencyPenalty,
        presence_penalty: presencePenalty,
        stream: false
      });

      const response = completion.choices[0].message.content;
      
      logger.info(`✅ Content generated successfully (${response.length} characters)`);
      
      return {
        success: true,
        content: response,
        model,
        usage: completion.usage,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('❌ Content generation failed:', error.message);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Generate embeddings for text (using OpenAI)
   */
  async generateEmbeddings(text) {
    try {
      if (!this.openaiClient) {
        throw new Error('OpenAI client not available for embeddings');
      }

      const response = await this.openaiClient.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
        encoding_format: 'float'
      });

      return response.data[0].embedding;
    } catch (error) {
      logger.error('❌ Embedding generation failed:', error.message);
      throw error;
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  calculateCosineSimilarity(vectorA, vectorB) {
    if (vectorA.length !== vectorB.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i];
      normA += vectorA[i] * vectorA[i];
      normB += vectorB[i] * vectorB[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Add document to knowledge base for RAG
   */
  async addToKnowledgeBase(documentId, content, metadata = {}) {
    try {
      if (!this.ragEnabled) {
        throw new Error('RAG is not enabled');
      }

      // Split content into chunks
      const chunks = this.chunkText(content, this.ragChunkSize, this.ragChunkOverlap);
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const chunkId = `${documentId}_chunk_${i}`;
        
        // Generate embedding for chunk
        const embedding = await this.generateEmbeddings(chunk);
        
        // Store in knowledge base
        this.knowledgeBase.set(chunkId, {
          content: chunk,
          embedding,
          metadata: {
            ...metadata,
            documentId,
            chunkIndex: i,
            totalChunks: chunks.length
          }
        });
        
        // Store in vector index for quick lookup
        this.vectorIndex.set(chunkId, embedding);
      }

      logger.info(`📚 Added document ${documentId} to knowledge base (${chunks.length} chunks)`);
      return chunks.length;
    } catch (error) {
      logger.error('❌ Failed to add document to knowledge base:', error.message);
      throw error;
    }
  }

  /**
   * Search knowledge base for relevant content
   */
  async searchKnowledgeBase(query, maxResults = this.ragMaxResults) {
    try {
      if (!this.ragEnabled) {
        throw new Error('RAG is not enabled');
      }

      if (this.knowledgeBase.size === 0) {
        return [];
      }

      // Generate embedding for query
      const queryEmbedding = await this.generateEmbeddings(query);
      
      // Calculate similarities
      const similarities = [];
      
      for (const [chunkId, embedding] of this.vectorIndex.entries()) {
        const similarity = this.calculateCosineSimilarity(queryEmbedding, embedding);
        
        if (similarity >= this.ragSimilarityThreshold) {
          similarities.push({
            chunkId,
            similarity,
            content: this.knowledgeBase.get(chunkId)
          });
        }
      }

      // Sort by similarity and return top results
      similarities.sort((a, b) => b.similarity - a.similarity);
      
      return similarities.slice(0, maxResults);
    } catch (error) {
      logger.error('❌ Knowledge base search failed:', error.message);
      throw error;
    }
  }

  /**
   * Generate content with RAG (Retrieval-Augmented Generation)
   */
  async generateContentWithRAG(prompt, options = {}) {
    try {
      if (!this.ragEnabled) {
        // Fall back to regular generation
        return await this.generateContent(prompt, options);
      }

      // Search knowledge base for relevant context
      const relevantChunks = await this.searchKnowledgeBase(prompt);
      
      if (relevantChunks.length === 0) {
        logger.info('🔍 No relevant context found, using regular generation');
        return await this.generateContent(prompt, options);
      }

      // Build context from relevant chunks
      const context = relevantChunks
        .map(chunk => chunk.content.content)
        .join('\n\n');

      // Generate content with context
      const systemPrompt = `You are a helpful AI assistant. Use the provided context to answer the user's question accurately and comprehensively. If the context doesn't contain enough information to answer the question, say so clearly.`;

      return await this.generateContent(prompt, {
        ...options,
        systemPrompt,
        context
      });

    } catch (error) {
      logger.error('❌ RAG content generation failed:', error.message);
      // Fall back to regular generation
      return await this.generateContent(prompt, options);
    }
  }

  /**
   * Split text into chunks for RAG
   */
  chunkText(text, chunkSize, overlap) {
    const chunks = [];
    let start = 0;
    
    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      const chunk = text.substring(start, end);
      chunks.push(chunk);
      
      start = end - overlap;
      if (start >= text.length) break;
    }
    
    return chunks;
  }

  /**
   * Clear knowledge base
   */
  clearKnowledgeBase() {
    this.knowledgeBase.clear();
    this.vectorIndex.clear();
    logger.info('🗑️ Knowledge base cleared');
  }

  /**
   * Get knowledge base statistics
   */
  getKnowledgeBaseStats() {
    return {
      totalDocuments: this.knowledgeBase.size,
      totalChunks: this.vectorIndex.size,
      ragEnabled: this.ragEnabled,
      chunkSize: this.ragChunkSize,
      chunkOverlap: this.ragChunkOverlap,
      similarityThreshold: this.ragSimilarityThreshold
    };
  }

  /**
   * Check AI service health
   */
  async checkHealth() {
    try {
      if (!this.isInitialized) {
        return {
          healthy: false,
          error: 'AI Service not initialized',
          timestamp: new Date().toISOString()
        };
      }

      // Test Groq connection
      if (this.groqClient) {
        try {
          const testResponse = await this.groqClient.chat.completions.create({
            model: this.defaultModel,
            messages: [{ role: 'user', content: 'Hello' }],
            max_tokens: 10,
            temperature: 0
          });
          
          return {
            healthy: true,
            model: this.defaultModel,
            groq: 'connected',
            openai: this.openaiClient ? 'connected' : 'not configured',
            rag: this.ragEnabled ? 'enabled' : 'disabled',
            timestamp: new Date().toISOString()
          };
        } catch (error) {
          return {
            healthy: false,
            error: `Groq connection failed: ${error.message}`,
            timestamp: new Date().toISOString()
          };
        }
      } else {
        return {
          healthy: false,
          error: 'Groq client not available',
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get AI content library
   */
  async getContentLibrary() {
    try {
      const stats = this.getKnowledgeBaseStats();
      
      // Return a structured content library
      return {
        totalDocuments: stats.totalDocuments,
        totalChunks: stats.totalChunks,
        categories: this.getContentCategories(),
        recentContent: this.getRecentContent(),
        popularContent: this.getPopularContent(),
        templates: this.getContentTemplates(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('❌ Error getting content library:', error.message);
      throw error;
    }
  }

  /**
   * Get content categories
   */
  getContentCategories() {
    const categories = new Set();
    
    for (const [_, metadata] of this.knowledgeBase) {
      if (metadata.category) {
        categories.add(metadata.category);
      }
    }
    
    return Array.from(categories);
  }

  /**
   * Get recent content
   */
  getRecentContent() {
    const recent = [];
    
    for (const [documentId, metadata] of this.knowledgeBase) {
      recent.push({
        id: documentId,
        title: metadata.title || 'Untitled',
        category: metadata.category || 'General',
        createdAt: metadata.createdAt || new Date().toISOString(),
        updatedAt: metadata.updatedAt || new Date().toISOString()
      });
    }
    
    // Sort by creation date (newest first)
    return recent.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10);
  }

  /**
   * Get popular content
   */
  getPopularContent() {
    const popular = [];
    
    for (const [documentId, metadata] of this.knowledgeBase) {
      popular.push({
        id: documentId,
        title: metadata.title || 'Untitled',
        category: metadata.category || 'General',
        usageCount: metadata.usageCount || 0,
        lastUsed: metadata.lastUsed || null
      });
    }
    
    // Sort by usage count (highest first)
    return popular.sort((a, b) => b.usageCount - a.usageCount).slice(0, 10);
  }

  /**
   * Get content templates
   */
  getContentTemplates() {
    return [
      {
        id: 'training-material',
        name: 'Training Material',
        description: 'Create comprehensive training materials',
        category: 'Training',
        prompt: 'Create training material for {topic} at {level} level'
      },
      {
        id: 'assessment-questions',
        name: 'Assessment Questions',
        description: 'Generate assessment questions',
        category: 'Assessment',
        prompt: 'Create {count} {difficulty} assessment questions for {topic}'
      },
      {
        id: 'presentation-outline',
        name: 'Presentation Outline',
        description: 'Generate presentation outlines',
        category: 'Presentation',
        prompt: 'Create a presentation outline for {topic} targeting {audience}'
      },
      {
        id: 'email-template',
        name: 'Email Template',
        description: 'Generate professional email templates',
        category: 'Communication',
        prompt: 'Create a {tone} email template for {purpose}'
      },
      {
        id: 'feedback-template',
        name: 'Feedback Template',
        description: 'Generate feedback templates',
        category: 'Feedback',
        prompt: 'Create a feedback template for {context}'
      }
    ];
  }

  /**
   * Health check (legacy method)
   */
  async healthCheck() {
    try {
      const status = {
        initialized: this.isInitialized,
        groqAvailable: !!this.groqClient,
        openaiAvailable: !!this.openaiClient,
        ragEnabled: this.ragEnabled,
        knowledgeBaseSize: this.knowledgeBase.size,
        timestamp: new Date().toISOString()
      };

      // Test Groq connection if available
      if (this.groqClient) {
        try {
          await this.generateContent('Test connection', { maxTokens: 10 });
          status.groqHealthy = true;
        } catch (error) {
          status.groqHealthy = false;
          status.groqError = error.message;
        }
      }

      return status;
    } catch (error) {
      logger.error('❌ AI service health check failed:', error.message);
      return {
        initialized: this.isInitialized,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Create singleton instance
const aiService = new AIService();

module.exports = aiService; 