const axios = require('axios');
const jwt = require('jsonwebtoken');

// Configuration
const BASE_URL = 'http://localhost:3001/api/v1';
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here_change_in_production_min_32_chars';

// Test user data
const testUser = {
  userId: 'test-user-id-123',
  email: 'test@example.com',
  role: 'admin',
  tenantId: 'test-tenant-123'
};

// Generate a valid JWT token
function generateTestToken() {
  const payload = {
    ...testUser,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour
    iss: 'trainer-platform',
    aud: 'trainer-platform-users'
  };
  
  return jwt.sign(payload, JWT_SECRET);
}

// Test function
async function testEndpoint(method, endpoint, data = null, description, token) {
  console.log(`\n🧪 Testing: ${description}`);
  console.log(`Endpoint: ${method} ${BASE_URL}${endpoint}`);
  
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    
    console.log('✅ Success');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2).substring(0, 300) + '...');
    
    return true;
  } catch (error) {
    console.log('❌ Failed');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Error:', error.message);
    }
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 AI API Testing with Authentication');
  console.log('=====================================');
  console.log('Base URL:', BASE_URL);
  console.log('Test User:', testUser.email);
  
  const token = generateTestToken();
  console.log('Token generated successfully');
  
  let successCount = 0;
  let totalCount = 0;
  
  // Test health endpoint (no auth required)
  console.log('\n📊 Testing Health Endpoint (No Auth)');
  try {
    const response = await axios.get(`${BASE_URL}/ai/health`);
    console.log('✅ Health check passed');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    successCount++;
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }
  totalCount++;
  
  // Test content generation
  successCount += await testEndpoint('POST', '/ai/generate/content', {
    type: 'text',
    prompt: 'Write a short introduction to artificial intelligence',
    options: { tone: 'professional', length: 'short' }
  }, 'Generate General Content', token) ? 1 : 0;
  totalCount++;
  
  // Test training material generation
  successCount += await testEndpoint('POST', '/ai/generate/training-material', {
    topic: 'Project Management',
    options: { type: 'course', difficulty: 'beginner', duration: 60 }
  }, 'Generate Training Material', token) ? 1 : 0;
  totalCount++;
  
  // Test assessment questions
  successCount += await testEndpoint('POST', '/ai/generate/assessment-questions', {
    topic: 'JavaScript Fundamentals',
    questionCount: 5,
    options: { types: ['multiple_choice', 'true_false'], difficulty: 'beginner' }
  }, 'Generate Assessment Questions', token) ? 1 : 0;
  totalCount++;
  
  // Test presentation outline
  successCount += await testEndpoint('POST', '/ai/generate/presentation-outline', {
    topic: 'Digital Marketing Strategies',
    options: { duration: 'medium', style: 'educational', slideCount: 8 }
  }, 'Generate Presentation Outline', token) ? 1 : 0;
  totalCount++;
  
  // Test content improvement
  successCount += await testEndpoint('POST', '/ai/improve/content', {
    content: 'This is a test content that needs improvement.',
    improvement: 'grammar',
    options: { tone: 'professional' }
  }, 'Improve Content', token) ? 1 : 0;
  totalCount++;
  
  // Test translation
  successCount += await testEndpoint('POST', '/ai/translate/content', {
    content: 'Hello, how are you?',
    targetLanguage: 'spanish',
    preserveTone: true,
    options: { formality: 'formal' }
  }, 'Translate Content', token) ? 1 : 0;
  totalCount++;
  
  // Test blog post generation
  successCount += await testEndpoint('POST', '/ai/generate/blog-post', {
    topic: 'The Future of Remote Work',
    options: { length: 'medium', tone: 'professional', targetAudience: 'business professionals' }
  }, 'Generate Blog Post', token) ? 1 : 0;
  totalCount++;
  
  // Test social media content
  successCount += await testEndpoint('POST', '/ai/generate/social-media', {
    platform: 'linkedin',
    topic: 'Leadership Skills',
    options: { tone: 'professional', includeHashtags: true }
  }, 'Generate Social Media Content', token) ? 1 : 0;
  totalCount++;
  
  // Test email generation
  successCount += await testEndpoint('POST', '/ai/generate/email', {
    type: 'newsletter',
    topic: 'Monthly Company Updates',
    options: { recipientType: 'colleague', tone: 'friendly' }
  }, 'Generate Email Content', token) ? 1 : 0;
  totalCount++;
  
  // Test product description
  successCount += await testEndpoint('POST', '/ai/generate/product-description', {
    productName: 'Smart Fitness Tracker',
    features: ['Heart rate monitor', 'GPS tracking', 'Sleep analysis'],
    targetAudience: 'Fitness enthusiasts',
    options: { style: 'marketing', length: 'medium' }
  }, 'Generate Product Description', token) ? 1 : 0;
  totalCount++;
  
  // Test image prompt generation
  successCount += await testEndpoint('POST', '/ai/generate/image-prompt', {
    description: 'A modern office workspace with natural lighting',
    style: 'realistic',
    options: { aspectRatio: '16:9', mood: 'professional' }
  }, 'Generate Image Prompt', token) ? 1 : 0;
  totalCount++;
  
  // Test video script generation
  successCount += await testEndpoint('POST', '/ai/generate/video-script', {
    topic: 'Customer Service Best Practices',
    duration: 'short',
    style: 'educational',
    options: { includeVisuals: true, targetAudience: 'customer service representatives' }
  }, 'Generate Video Script', token) ? 1 : 0;
  totalCount++;
  
  // Test audio script generation
  successCount += await testEndpoint('POST', '/ai/generate/audio-script', {
    topic: 'Mindfulness Meditation',
    type: 'podcast',
    duration: 10,
    options: { tone: 'calm', includeMusic: true }
  }, 'Generate Audio Script', token) ? 1 : 0;
  totalCount++;
  
  // Test conversation creation
  successCount += await testEndpoint('POST', '/ai/chat/conversations', {
    niche: 'Technology',
    title: 'AI Discussion',
    initialMessage: 'Tell me about artificial intelligence'
  }, 'Create Conversation', token) ? 1 : 0;
  totalCount++;
  
  // Test conversation retrieval
  successCount += await testEndpoint('GET', '/ai/chat/conversations', null, 'Get Conversations', token) ? 1 : 0;
  totalCount++;
  
  // Test AI response generation
  successCount += await testEndpoint('POST', '/ai/chat/generate-response', {
    message: 'How can I implement AI in my business?',
    context: { niche: 'business', userPreferences: { tone: 'professional' } }
  }, 'Generate AI Response', token) ? 1 : 0;
  totalCount++;
  
  // Test content performance analytics
  successCount += await testEndpoint('GET', '/ai/analytics/content-performance?contentId=test-content&dateRange=last30days', null, 'Get Content Performance', token) ? 1 : 0;
  totalCount++;
  
  // Test usage analytics
  successCount += await testEndpoint('GET', '/ai/analytics/usage?dateRange=last30days', null, 'Get Usage Analytics', token) ? 1 : 0;
  totalCount++;
  
  // Test training module generation
  successCount += await testEndpoint('POST', '/ai/training/generate-module', {
    topic: 'Data Analysis Fundamentals',
    options: { duration: 4, difficulty: 'intermediate', format: 'interactive', includeAssessment: true }
  }, 'Generate Training Module', token) ? 1 : 0;
  totalCount++;
  
  // Test exercises generation
  successCount += await testEndpoint('POST', '/ai/training/generate-exercises', {
    topic: 'Python Programming',
    options: { type: 'hands-on', duration: 45, difficulty: 'beginner', materials: ['computer', 'python_ide'] }
  }, 'Generate Exercises', token) ? 1 : 0;
  totalCount++;
  
  // Test case studies generation
  successCount += await testEndpoint('POST', '/ai/training/generate-case-studies', {
    topic: 'Supply Chain Management',
    options: { industry: 'manufacturing', complexity: 'moderate', includeSolutions: true }
  }, 'Generate Case Studies', token) ? 1 : 0;
  totalCount++;
  
  // Test quiz generation
  successCount += await testEndpoint('POST', '/ai/training/generate-quiz', {
    topic: 'Cybersecurity Basics',
    options: { questionCount: 10, types: ['multiple_choice', 'true_false'], difficulty: 'beginner', timeLimit: 20 }
  }, 'Generate Quiz', token) ? 1 : 0;
  totalCount++;
  
  // Test scenarios generation
  successCount += await testEndpoint('POST', '/ai/training/generate-scenarios', {
    topic: 'Conflict Resolution',
    options: { scenarioCount: 3, complexity: 'moderate', includeMultipleChoice: true, includeEssay: true }
  }, 'Generate Scenarios', token) ? 1 : 0;
  totalCount++;
  
  // Test content saving
  successCount += await testEndpoint('POST', '/ai/content/save', {
    title: 'AI in Business Guide',
    content: 'This is a comprehensive guide about AI in business...',
    type: 'guide',
    category: 'business',
    tags: ['ai', 'business', 'guide'],
    metadata: { generatedBy: 'ai', prompt: 'Write about AI in business' }
  }, 'Save Content to Library', token) ? 1 : 0;
  totalCount++;
  
  // Test content library retrieval
  successCount += await testEndpoint('GET', '/ai/content/library?type=guide&page=1&limit=10', null, 'Get Content Library', token) ? 1 : 0;
  totalCount++;
  
  // Test templates retrieval
  successCount += await testEndpoint('GET', '/ai/templates', null, 'Get Templates', token) ? 1 : 0;
  totalCount++;
  
  // Test template creation
  successCount += await testEndpoint('POST', '/ai/templates', {
    name: 'Sales Email Template',
    description: 'Template for sales emails',
    type: 'email',
    platform: 'email',
    prompt: 'Write a sales email about {product} for {audience}',
    variables: ['product', 'audience']
  }, 'Create Template', token) ? 1 : 0;
  totalCount++;
  
  // Test preferences retrieval
  successCount += await testEndpoint('GET', '/ai/preferences', null, 'Get Preferences', token) ? 1 : 0;
  totalCount++;
  
  // Test preferences update
  successCount += await testEndpoint('PUT', '/ai/preferences', {
    defaultTone: 'professional',
    preferredLanguage: 'english',
    contentStyle: 'informative',
    autoSave: true,
    notifications: { contentReady: true, insights: true }
  }, 'Update Preferences', token) ? 1 : 0;
  totalCount++;
  
  // Test niches retrieval
  successCount += await testEndpoint('GET', '/ai/niches', null, 'Get Niches', token) ? 1 : 0;
  totalCount++;
  
  // Test niche setting
  successCount += await testEndpoint('POST', '/ai/niches', {
    niche: 'Technology',
    description: 'Technology and software development',
    keywords: ['tech', 'software', 'development', 'ai']
  }, 'Set Niche', token) ? 1 : 0;
  totalCount++;
  
  // Test rate limits
  successCount += await testEndpoint('GET', '/ai/rate-limits', null, 'Get Rate Limits', token) ? 1 : 0;
  totalCount++;
  
  // Summary
  console.log('\n📊 Test Summary');
  console.log('===============');
  console.log(`Total tests: ${totalCount}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${totalCount - successCount}`);
  console.log(`Success rate: ${((successCount / totalCount) * 100).toFixed(1)}%`);
  
  if (successCount === totalCount) {
    console.log('\n🎉 All AI endpoints are working correctly!');
  } else {
    console.log('\n⚠️  Some endpoints failed. Check the logs above for details.');
  }
}

// Run the tests
runTests().catch(console.error); 