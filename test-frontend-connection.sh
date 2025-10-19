#!/bin/bash

# Frontend-Backend Connection Test
# Tests all API endpoints that the frontend needs

API_BASE_URL="http://localhost:3001"
API_V1_BASE="${API_BASE_URL}/api/v1"

echo "🧪 Frontend-Backend Connection Test"
echo "====================================="
echo ""
echo "🔗 Testing API Base URL: ${API_BASE_URL}"
echo "📊 API Version 1 Base: ${API_V1_BASE}"
echo ""

# Test results
PASSED=0
TOTAL=0

# Function to run a test
run_test() {
    local name="$1"
    local endpoint="$2"
    local method="$3"
    local expected_status="$4"
    local data="$5"
    
    TOTAL=$((TOTAL + 1))
    
    echo "Testing: $name"
    echo "   URL: ${API_BASE_URL}${endpoint}"
    
    if [ "$method" = "POST" ] && [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST \
            -H "Content-Type: application/json" \
            -d "$data" \
            "${API_BASE_URL}${endpoint}")
    else
        response=$(curl -s -w "\n%{http_code}" "${API_BASE_URL}${endpoint}")
    fi
    
    # Extract status code (last line)
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    echo "   Status: $status_code (expected: $expected_status)"
    
    if [ "$status_code" = "$expected_status" ]; then
        echo "   ✅ PASS"
        PASSED=$((PASSED + 1))
    else
        echo "   ❌ FAIL"
    fi
    
    # Check if response has success field
    if echo "$body" | grep -q '"success"'; then
        success_value=$(echo "$body" | grep -o '"success":[^,}]*' | cut -d':' -f2 | tr -d ' ')
        echo "   API Success: $success_value"
    fi
    
    # Check if response has data array
    if echo "$body" | grep -q '"data"'; then
        data_count=$(echo "$body" | grep -o '"data":\[[^]]*\]' | grep -o '\[[^]]*\]' | tr -cd ',' | wc -c)
        data_count=$((data_count + 1))
        echo "   Data Count: $data_count"
    fi
    
    echo ""
}

# Run all tests
run_test "Health Check" "/health" "GET" "200"
run_test "API Status" "/api" "GET" "200"
run_test "Tenants API" "/api/v1/tenants" "GET" "200"
run_test "Training Courses" "/api/v1/training/courses" "GET" "200"
run_test "Jobs API" "/api/v1/jobs" "GET" "200"
run_test "Activities API" "/api/v1/activities" "GET" "200"
run_test "Content API" "/api/v1/content" "GET" "200"
run_test "User Profile" "/api/v1/users/me" "GET" "200"
run_test "Notifications" "/api/v1/notifications" "GET" "200"
run_test "Auth Login (Validation Test)" "/api/v1/auth/login" "POST" "400" '{"email":"test@example.com","password":"weak"}'

# Summary
echo "📊 Test Results Summary"
echo "======================="
echo "✅ Passed: $PASSED/$TOTAL"
echo "❌ Failed: $((TOTAL - PASSED))/$TOTAL"
echo "📈 Success Rate: $(( (PASSED * 100) / TOTAL ))%"

if [ "$PASSED" = "$TOTAL" ]; then
    echo ""
    echo "🎉 All tests passed! Frontend-Backend connection is working perfectly!"
    echo "🚀 Your LuxGen application is ready for development!"
else
    echo ""
    echo "⚠️ Some tests failed. Please check the backend configuration."
fi

echo ""
echo "📝 Frontend Configuration:"
echo "   REACT_APP_API_URL=http://localhost:3001"
echo "   REACT_APP_BACKEND_URL=http://localhost:3001"
echo "   REACT_APP_BACKEND_API_URL=http://localhost:3001/api/v1"
