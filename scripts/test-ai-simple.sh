#!/bin/bash

# Simple AI API Testing Script
# Tests AI endpoints that don't require authentication

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="http://localhost:3001/api/v1"

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
        response=$(curl -s -w "\n%{http_code}" -H "Content-Type: application/json" \
            "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -H "Content-Type: application/json" \
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

echo -e "${BLUE}🧪 Simple AI API Testing Script${NC}"
echo -e "${BLUE}================================${NC}"
echo "Base URL: $BASE_URL"
echo ""

# Test health endpoint (no auth required)
test_endpoint "GET" "/ai/health" "" "AI Health Check"

# Test rate limits endpoint (no auth required)
test_endpoint "GET" "/ai/rate-limits" "" "AI Rate Limits"

echo -e "\n${GREEN}🎉 Simple AI API Testing Completed!${NC}"
echo -e "${BLUE}Note: Most AI endpoints require authentication.${NC}" 