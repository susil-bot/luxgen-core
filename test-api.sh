#!/bin/bash

# LuxGen API E2E Testing Script
# This script tests all authentication endpoints

echo "🧪 LuxGen API E2E Testing"
echo "========================="
echo ""

BASE_URL="https://luxgen-backend.netlify.app"
TEST_EMAIL="test-$(date +%s)@example.com"
TEST_PASSWORD="password123"

echo "📋 Test Configuration:"
echo "Base URL: $BASE_URL"
echo "Test Email: $TEST_EMAIL"
echo "Test Password: $TEST_PASSWORD"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=0

# Function to run a test
run_test() {
    local test_name="$1"
    local command="$2"
    local expected_status="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -e "${BLUE}Testing: $test_name${NC}"
    
    # Run the command and capture response
    response=$(eval "$command" 2>/dev/null)
    status_code=$(eval "$command" -w "%{http_code}" -o /dev/null -s 2>/dev/null)
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC} - Status: $status_code"
        echo "Response: $response" | head -c 100
        echo ""
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}❌ FAIL${NC} - Expected: $expected_status, Got: $status_code"
        echo "Response: $response" | head -c 100
        echo ""
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    echo ""
}

echo "🚀 Starting API Tests..."
echo ""

# Test 1: Health Check
run_test "Health Check" "curl -s -X GET $BASE_URL/health" "200"

# Test 2: API Health
run_test "API Health Check" "curl -s -X GET $BASE_URL/api/health" "200"

# Test 3: User Registration
run_test "User Registration" "curl -s -X POST $BASE_URL/api/auth/register -H 'Content-Type: application/json' -d '{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"firstName\":\"John\",\"lastName\":\"Doe\"}'" "201"

# Test 4: User Login
run_test "User Login" "curl -s -X POST $BASE_URL/api/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}'" "200"

# Test 5: User Logout
run_test "User Logout" "curl -s -X POST $BASE_URL/api/auth/logout -H 'Content-Type: application/json'" "200"

# Test 6: Forgot Password
run_test "Forgot Password" "curl -s -X POST $BASE_URL/api/auth/forgot-password -H 'Content-Type: application/json' -d '{\"email\":\"$TEST_EMAIL\"}'" "200"

# Test 7: Reset Password
run_test "Reset Password" "curl -s -X POST $BASE_URL/api/auth/reset-password -H 'Content-Type: application/json' -d '{\"token\":\"test-token\",\"newPassword\":\"newpassword123\"}'" "200"

# Test 8: Invalid Login (Wrong Password)
run_test "Invalid Login (Wrong Password)" "curl -s -X POST $BASE_URL/api/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"$TEST_EMAIL\",\"password\":\"wrongpassword\"}'" "401"

# Test 9: Invalid Login (Non-existent User)
run_test "Invalid Login (Non-existent User)" "curl -s -X POST $BASE_URL/api/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"nonexistent@example.com\",\"password\":\"password123\"}'" "401"

# Test 10: Duplicate Registration
run_test "Duplicate Registration" "curl -s -X POST $BASE_URL/api/auth/register -H 'Content-Type: application/json' -d '{\"email\":\"$TEST_EMAIL\",\"password\":\"password123\",\"firstName\":\"Jane\",\"lastName\":\"Smith\"}'" "400"

# Test 11: Invalid Registration (Missing Fields)
run_test "Invalid Registration (Missing Fields)" "curl -s -X POST $BASE_URL/api/auth/register -H 'Content-Type: application/json' -d '{\"email\":\"invalid-email\",\"password\":\"123\"}'" "400"

# Test 12: Invalid JSON
run_test "Invalid JSON" "curl -s -X POST $BASE_URL/api/auth/login -H 'Content-Type: application/json' -d 'invalid json'" "400"

# Test 13: Empty Request Body
run_test "Empty Request Body" "curl -s -X POST $BASE_URL/api/auth/login -H 'Content-Type: application/json' -d '{}'" "400"

# Test 14: Missing Content-Type Header
run_test "Missing Content-Type Header" "curl -s -X POST $BASE_URL/api/auth/login -d '{\"email\":\"test@example.com\",\"password\":\"password123\"}'" "400"

# Test 15: Non-existent Endpoint
run_test "Non-existent Endpoint" "curl -s -X GET $BASE_URL/api/nonexistent" "404"

echo "📊 Test Results Summary"
echo "======================"
echo -e "${GREEN}Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Tests Failed: $TESTS_FAILED${NC}"
echo -e "${BLUE}Total Tests: $TOTAL_TESTS${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! API is working correctly.${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please check the API implementation.${NC}"
    exit 1
fi
