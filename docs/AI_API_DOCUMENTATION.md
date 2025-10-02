# AI API Documentation ## Overview The AI module provides powerful content generation capabilities using Groq API with RAG (Retrieval-Augmented Generation) support. This module enables trainers to generate various types of content including training materials, assessments, feedback templates, and more. ## Features - 🤖 **Content Generation**: Generate text content using Groq's LLM models
- **RAG Support**: Retrieval-Augmented Generation for context-aware responses
- **Knowledge Base**: Add and search documents for enhanced AI responses
- **Specialized Content**: Pre-configured prompts for training-specific use cases
- **Rate Limiting**: Built-in rate limiting to prevent abuse
- **Authentication**: Secure endpoints with JWT authentication
- **Health Monitoring**: Comprehensive health checks and statistics ## Configuration ### Environment Variables Add these to your `.env` file: ```env
# AI Configuration
GROQ_API_KEY=your-groq-api-key-here
OPENAI_API_KEY=your-openai-api-key-here
AI_MODEL=llama-3.3-70b-versatile
AI_MAX_TOKENS=4096
AI_TEMPERATURE=0.7
AI_TOP_P=0.9
AI_FREQUENCY_PENALTY=0.0
AI_PRESENCE_PENALTY=0.0 # RAG Configuration
RAG_ENABLED=true
RAG_VECTOR_DB=memory
RAG_CHUNK_SIZE=1000
RAG_CHUNK_OVERLAP=200
RAG_MAX_RESULTS=5
RAG_SIMILARITY_THRESHOLD=0.7
``` ### API Keys 1. **Groq API Key**: Get from [Groq Console](https://console.groq.com/)
2. **OpenAI API Key**: Get from [OpenAI Platform](https://platform.openai.com/) (for embeddings) ## API Endpoints ### Base URL
```
http://localhost:3001/api/v1/ai
``` ### Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
``` --- ## Public Endpoints ### 1. Get AI Service Health
**GET** `/health` Check the health status of the AI service. **Response:**
```json
{ "success": true, "data": { "initialized": true, "groqAvailable": true, "openaiAvailable": true, "ragEnabled": true, "knowledgeBaseSize": 5, "groqHealthy": true, "timestamp": "2025-07-26T21:40:24.047Z"}, "message": "AI service health check completed"}
``` ### 2. Get Available Models
**GET** `/models` Get list of available AI models. **Response:**
```json
{ "success": true, "data": [ { "id": "llama-3.3-70b-versatile", "name": "Llama 3.3 70B Versatile", "provider": "Groq", "description": "Most capable model for complex tasks", "maxTokens": 8192, "supportsStreaming": true } ], "message": "Available AI models retrieved"}
``` ### 3. Get Knowledge Base Statistics
**GET** `/knowledge-base/stats` Get statistics about the knowledge base. **Response:**
```json
{ "success": true, "data": { "totalDocuments": 10, "totalChunks": 45, "ragEnabled": true, "chunkSize": 1000, "chunkOverlap": 200, "similarityThreshold": 0.7 }, "message": "Knowledge base statistics retrieved"}
``` --- ## Protected Endpoints ### 1. Generate Content
**POST** `/generate` Generate content using AI. **Request Body:**
```json
{ "prompt": "Create a training module about customer service", "model": "llama-3.3-70b-versatile", "maxTokens": 2048, "temperature": 0.7, "topP": 0.9, "frequencyPenalty": 0.0, "presencePenalty": 0.0, "systemPrompt": "You are an expert training content creator", "useRAG": true
}
``` **Response:**
```json
{ "success": true, "data": { "success": true, "content": "Generated content here...", "model": "llama-3.3-70b-versatile", "usage": { "prompt_tokens": 50, "completion_tokens": 200, "total_tokens": 250 }, "timestamp": "2025-07-26T21:40:24.047Z"}, "message": "Content generated successfully"}
``` ### 2. Generate Specialized Content
**POST** `/generate/specialized` Generate content for specific training use cases. **Request Body:**
```json
{ "type": "training_material", "prompt": "Customer service best practices", "context": "Additional context for the AI", "options": { "maxTokens": 2048, "temperature": 0.7 }
}
``` **Available Types:**
- `training_material`: Training content and materials
- `assessment_questions`: Quiz and assessment questions
- `feedback_template`: Feedback and evaluation templates
- `presentation_outline`: Presentation structure and outlines
- `email_template`: Professional email templates **Response:**
```json
{ "success": true, "data": { "success": true, "content": "Specialized content here...", "model": "llama-3.3-70b-versatile", "usage": { "prompt_tokens": 75, "completion_tokens": 300, "total_tokens": 375 }, "timestamp": "2025-07-26T21:40:24.047Z", "type": "training_material", "originalPrompt": "Customer service best practices"}, "message": "training_material content generated successfully"}
``` ### 3. Add Document to Knowledge Base
**POST** `/knowledge-base/add` Add a document to the knowledge base for RAG. **Request Body:**
```json
{ "documentId": "customer-service-guide-2024", "content": "Complete customer service training guide content...", "metadata": { "title": "Customer Service Best Practices 2024", "author": "Training Team", "category": "customer-service", "version": "1.0"}
}
``` **Response:**
```json
{ "success": true, "data": { "documentId": "customer-service-guide-2024", "chunksCount": 8, "message": "Document added to knowledge base with 8 chunks"}
}
``` ### 4. Search Knowledge Base
**POST** `/knowledge-base/search` Search the knowledge base for relevant content. **Request Body:**
```json
{ "query": "How to handle difficult customers?", "maxResults": 5
}
``` **Response:**
```json
{ "success": true, "data": { "query": "How to handle difficult customers?", "results": [ { "chunkId": "customer-service-guide-2024_chunk_3", "similarity": 0.85, "content": { "content": "Relevant content chunk...", "metadata": { "documentId": "customer-service-guide-2024", "chunkIndex": 3, "totalChunks": 8 } } } ], "count": 1, "message": "Found 1 relevant results"}
}
``` ### 5. Clear Knowledge Base
**DELETE** `/knowledge-base/clear` Clear all documents from the knowledge base. **Response:**
```json
{ "success": true, "message": "Knowledge base cleared successfully"}
``` --- ## Error Responses All endpoints return consistent error responses: ```json
{ "success": false, "error": "Error message", "message": "Human-readable error message"}
``` ### Common Error Codes - `400`: Bad Request - Invalid input data
- `401`: Unauthorized - Missing or invalid JWT token
- `429`: Too Many Requests - Rate limit exceeded
- `500`: Internal Server Error - Server-side error --- ## Rate Limiting AI endpoints are rate-limited to prevent abuse:
- **Limit**: 50 requests per 15 minutes per IP
- **Headers**: Rate limit information included in response headers --- ## Usage Examples ### JavaScript/Node.js ```javascript
const axios = require('axios'); const API_BASE = 'http://localhost:3001/api/v1/ai';
const TOKEN = 'your-jwt-token'; // Generate training content
async function generateTrainingContent() { try { const response = await axios.post(`${API_BASE}/generate/specialized`, { type: 'training_material', prompt: 'Effective communication skills for managers', options: { maxTokens: 2048, temperature: 0.7 } }, { headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json'} }); console.log('Generated content:', response.data.data.content); } catch (error) { console.error('Error:', error.response?.data || error.message); }
} // Add document to knowledge base
async function addToKnowledgeBase() { try { const response = await axios.post(`${API_BASE}/knowledge-base/add`, { documentId: 'manager-guide', content: 'Complete manager training guide...', metadata: { title: 'Manager Training Guide', category: 'leadership'} }, { headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json'} }); console.log('Added to knowledge base:', response.data.data); } catch (error) { console.error('Error:', error.response?.data || error.message); }
}
``` ### cURL Examples ```bash
# Generate content
curl -X POST http://localhost:3001/api/v1/ai/generate \ -H "Authorization: Bearer YOUR_TOKEN"\ -H "Content-Type: application/json"\ -d '{ "prompt": "Create a training module about leadership", "useRAG": true }'# Generate specialized content
curl -X POST http://localhost:3001/api/v1/ai/generate/specialized \ -H "Authorization: Bearer YOUR_TOKEN"\ -H "Content-Type: application/json"\ -d '{ "type": "assessment_questions", "prompt": "Leadership skills assessment"}'# Add to knowledge base
curl -X POST http://localhost:3001/api/v1/ai/knowledge-base/add \ -H "Authorization: Bearer YOUR_TOKEN"\ -H "Content-Type: application/json"\ -d '{ "documentId": "leadership-guide", "content": "Leadership training content...", "metadata": { "title": "Leadership Guide", "category": "management"} }'``` --- ## Best Practices 1. **Use Specialized Endpoints**: Use `/generate/specialized` for training-specific content
2. **Leverage RAG**: Add relevant documents to knowledge base for better responses
3. **Monitor Usage**: Check health endpoint regularly
4. **Handle Errors**: Always handle API errors gracefully
5. **Rate Limiting**: Respect rate limits and implement retry logic
6. **Content Validation**: Validate generated content before using in production --- ## Troubleshooting ### Common Issues 1. **"Groq client not available"** - Check if `GROQ_API_KEY` is set in environment - Verify API key is valid 2. **"RAG features disabled"** - Check if `OPENAI_API_KEY` is set for embeddings - Ensure `RAG_ENABLED=true` 3. **Rate limit exceeded** - Implement exponential backoff - Reduce request frequency 4. **Authentication errors** - Verify JWT token is valid and not expired - Check token format in Authorization header ### Debug Mode Enable debug logging by setting:
```env
LOG_LEVEL=debug
``` --- ## Support For issues and questions:
1. Check the health endpoint: `GET /health`
2. Review server logs for detailed error messages
3. Verify environment configuration
4. Test with minimal requests first 