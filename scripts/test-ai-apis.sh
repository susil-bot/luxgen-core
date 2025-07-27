#!/bin/bash

# 🧪 AI API Testing Script
# Tests all AI endpoints using curl

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="http://localhost:3001/api/v1"
TEST_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2N2Y5Y2Y5Y2Y5Y2Y5Y2Y5Y2Y5Y2Y5Y2YiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MzU2MjMzNDgsImV4cCI6MTczNTYyNjk0OH0.test-signature"

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Function to test an API endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo -e "\n${BLUE}Testing: $description${NC}"
    echo "Endpoint: $method $BASE_URL$endpoint"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $TEST_TOKEN" \
            -H "Content-Type: application/json" \
            "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $TEST_TOKEN" \
            -H "Content-Type: application/json" \
            -X "$method" \
            -d "$data" \
            "$BASE_URL$endpoint")
    fi
    
    # Extract status code (last line)
    status_code=$(echo "$response" | tail -n1)
    # Extract response body (all lines except last)
    body=$(echo "$response" | head -n -1)
    
    if [ "$status_code" -ge 200 ] && [ "$status_code" -lt 300 ]; then
        print_status "Success ($status_code)"
        echo "Response: $body" | head -c 200
        if [ ${#body} -gt 200 ]; then
            echo "..."
        fi
    else
        print_error "Failed ($status_code)"
        echo "Response: $body"
    fi
}

# Function to test health endpoint (no auth required)
test_health() {
    echo -e "\n${BLUE}Testing: Health Check${NC}"
    echo "Endpoint: GET $BASE_URL/ai/health"
    
    response=$(curl -s -w "\n%{http_code}" -H "Content-Type: application/json" \
        "$BASE_URL/ai/health")
    
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$status_code" -ge 200 ] && [ "$status_code" -lt 300 ]; then
        print_status "Health check passed ($status_code)"
        echo "Response: $body" | head -c 200
        if [ ${#body} -gt 200 ]; then
            echo "..."
        fi
    else
        print_error "Health check failed ($status_code)"
        echo "Response: $body"
    fi
}

echo -e "${BLUE}🧪 AI API Testing Script${NC}"
echo -e "${BLUE}========================${NC}"
echo "Base URL: $BASE_URL"
echo "Test Token: $TEST_TOKEN"
echo ""

# Test health endpoint (no auth required)
test_health

# ==================== CONTENT GENERATION ====================

print_info "Testing Content Generation Endpoints"

# Generate general content
test_endpoint "POST" "/ai/generate/content" \
    '{"type":"text","prompt":"Write a short introduction to artificial intelligence","options":{"tone":"professional","length":"short"}}' \
    "Generate General Content"

# Generate training material
test_endpoint "POST" "/ai/generate/training-material" \
    '{"topic":"Project Management","options":{"type":"course","difficulty":"beginner","duration":60}}' \
    "Generate Training Material"

# Generate assessment questions
test_endpoint "POST" "/ai/generate/assessment-questions" \
    '{"topic":"JavaScript Fundamentals","questionCount":5,"options":{"types":["multiple_choice","true_false"],"difficulty":"beginner"}}' \
    "Generate Assessment Questions"

# Generate presentation outline
test_endpoint "POST" "/ai/generate/presentation-outline" \
    '{"topic":"Digital Marketing Strategies","options":{"duration":"medium","style":"educational","slideCount":8}}' \
    "Generate Presentation Outline"

# ==================== CONTENT IMPROVEMENT ====================

print_info "Testing Content Improvement Endpoints"

# Improve content
test_endpoint "POST" "/ai/improve/content" \
    '{"content":"This is a test content that needs improvement.","improvement":"grammar","options":{"tone":"professional"}}' \
    "Improve Content"

# Translate content
test_endpoint "POST" "/ai/translate/content" \
    '{"content":"Hello, how are you?","targetLanguage":"spanish","preserveTone":true,"options":{"formality":"formal"}}' \
    "Translate Content"

# ==================== SPECIALIZED CONTENT GENERATION ====================

print_info "Testing Specialized Content Generation Endpoints"

# Generate blog post
test_endpoint "POST" "/ai/generate/blog-post" \
    '{"topic":"The Future of Remote Work","options":{"length":"medium","tone":"professional","targetAudience":"business professionals"}}' \
    "Generate Blog Post"

# Generate social media content
test_endpoint "POST" "/ai/generate/social-media" \
    '{"platform":"linkedin","topic":"Leadership Skills","options":{"tone":"professional","includeHashtags":true}}' \
    "Generate Social Media Content"

# Generate email content
test_endpoint "POST" "/ai/generate/email" \
    '{"type":"newsletter","topic":"Monthly Company Updates","options":{"recipientType":"colleague","tone":"friendly"}}' \
    "Generate Email Content"

# Generate product description
test_endpoint "POST" "/ai/generate/product-description" \
    '{"productName":"Smart Fitness Tracker","features":["Heart rate monitor","GPS tracking","Sleep analysis"],"targetAudience":"Fitness enthusiasts","options":{"style":"marketing","length":"medium"}}' \
    "Generate Product Description"

# ==================== MEDIA CONTENT GENERATION ====================

print_info "Testing Media Content Generation Endpoints"

# Generate image prompt
test_endpoint "POST" "/ai/generate/image-prompt" \
    '{"description":"A modern office workspace with natural lighting","style":"realistic","options":{"aspectRatio":"16:9","mood":"professional"}}' \
    "Generate Image Prompt"

# Generate video script
test_endpoint "POST" "/ai/generate/video-script" \
    '{"topic":"Customer Service Best Practices","duration":"short","style":"educational","options":{"includeVisuals":true,"targetAudience":"customer service representatives"}}' \
    "Generate Video Script"

# Generate audio script
test_endpoint "POST" "/ai/generate/audio-script" \
    '{"topic":"Mindfulness Meditation","type":"podcast","duration":10,"options":{"tone":"calm","includeMusic":true}}' \
    "Generate Audio Script"

# ==================== AI CHATBOT ENDPOINTS ====================

print_info "Testing AI Chatbot Endpoints"

# Create conversation
test_endpoint "POST" "/ai/chat/conversations" \
    '{"niche":"Technology","title":"AI Discussion","initialMessage":"Tell me about artificial intelligence"}' \
    "Create Conversation"

# Get conversations
test_endpoint "GET" "/ai/chat/conversations" \
    "" \
    "Get Conversations"

# Send message (assuming conversation ID from previous request)
test_endpoint "POST" "/ai/chat/conversations/test-conversation-id/messages" \
    '{"content":"What are the benefits of AI in business?","type":"text","metadata":{"platform":"web"}}' \
    "Send Message"

# Generate AI response
test_endpoint "POST" "/ai/chat/generate-response" \
    '{"message":"How can I implement AI in my business?","context":{"niche":"business","userPreferences":{"tone":"professional"}}}' \
    "Generate AI Response"

# ==================== ANALYTICS & INSIGHTS ====================

print_info "Testing Analytics & Insights Endpoints"

# Get content performance
test_endpoint "GET" "/ai/analytics/content-performance?contentId=test-content&dateRange=last30days&metrics=engagement,performance" \
    "" \
    "Get Content Performance"

# Get conversation insights
test_endpoint "GET" "/ai/analytics/conversation-insights?conversationId=test-conversation&dateRange=last7days" \
    "" \
    "Get Conversation Insights"

# Get usage analytics
test_endpoint "GET" "/ai/analytics/usage?dateRange=last30days&type=content_generation" \
    "" \
    "Get Usage Analytics"

# ==================== TRAINING-SPECIFIC AI ENDPOINTS ====================

print_info "Testing Training-Specific AI Endpoints"

# Generate training module
test_endpoint "POST" "/ai/training/generate-module" \
    '{"topic":"Data Analysis Fundamentals","options":{"duration":4,"difficulty":"intermediate","format":"interactive","includeAssessment":true}}' \
    "Generate Training Module"

# Generate exercises
test_endpoint "POST" "/ai/training/generate-exercises" \
    '{"topic":"Python Programming","options":{"type":"hands-on","duration":45,"difficulty":"beginner","materials":["computer","python_ide"]}}' \
    "Generate Exercises"

# Generate case studies
test_endpoint "POST" "/ai/training/generate-case-studies" \
    '{"topic":"Supply Chain Management","options":{"industry":"manufacturing","complexity":"moderate","includeSolutions":true}}' \
    "Generate Case Studies"

# Generate quiz
test_endpoint "POST" "/ai/training/generate-quiz" \
    '{"topic":"Cybersecurity Basics","options":{"questionCount":10,"types":["multiple_choice","true_false"],"difficulty":"beginner","timeLimit":20}}' \
    "Generate Quiz"

# Generate scenarios
test_endpoint "POST" "/ai/training/generate-scenarios" \
    '{"topic":"Conflict Resolution","options":{"scenarioCount":3,"complexity":"moderate","includeMultipleChoice":true,"includeEssay":true}}' \
    "Generate Scenarios"

# ==================== CONTENT MANAGEMENT ====================

print_info "Testing Content Management Endpoints"

# Save content to library
test_endpoint "POST" "/ai/content/save" \
    '{"title":"AI in Business Guide","content":"This is a comprehensive guide about AI in business...","type":"guide","category":"business","tags":["ai","business","guide"],"metadata":{"generatedBy":"ai","prompt":"Write about AI in business"}}' \
    "Save Content to Library"

# Get content library
test_endpoint "GET" "/ai/content/library?type=guide&page=1&limit=10" \
    "" \
    "Get Content Library"

# Get templates
test_endpoint "GET" "/ai/templates" \
    "" \
    "Get Templates"

# Create template
test_endpoint "POST" "/ai/templates" \
    '{"name":"Sales Email Template","description":"Template for sales emails","type":"email","platform":"email","prompt":"Write a sales email about {product} for {audience}","variables":["product","audience"]}' \
    "Create Template"

# ==================== PERSONALIZATION & PREFERENCES ====================

print_info "Testing Personalization & Preferences Endpoints"

# Get preferences
test_endpoint "GET" "/ai/preferences" \
    "" \
    "Get Preferences"

# Update preferences
test_endpoint "PUT" "/ai/preferences" \
    '{"defaultTone":"professional","preferredLanguage":"english","contentStyle":"informative","autoSave":true,"notifications":{"contentReady":true,"insights":true}}' \
    "Update Preferences"

# Get niches
test_endpoint "GET" "/ai/niches" \
    "" \
    "Get Niches"

# Set niche
test_endpoint "POST" "/ai/niches" \
    '{"niche":"Technology","description":"Technology and software development","keywords":["tech","software","development","ai"]}' \
    "Set Niche"

# ==================== PERFORMANCE & MONITORING ====================

print_info "Testing Performance & Monitoring Endpoints"

# Get rate limits
test_endpoint "GET" "/ai/rate-limits" \
    "" \
    "Get Rate Limits"

echo -e "\n${GREEN}🎉 AI API Testing Completed!${NC}"
echo -e "${BLUE}Check the results above for any failed endpoints.${NC}" 