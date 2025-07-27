# 🧪 API Testing Guide - LuxGen Trainer Platform

## 📋 Overview

This guide provides comprehensive instructions for testing all API endpoints of the LuxGen Trainer Platform using Postman and automated testing scripts.

## 📊 Test Coverage

### **140 Test Cases** covering:

- ✅ **Authentication** (14 tests) - Registration, login, verification, password reset
- ✅ **User Management** (10 tests) - CRUD operations, bulk actions, health monitoring
- ✅ **Tenant Management** (15 tests) - Multi-tenant operations, analytics, bulk operations
- ✅ **Group Management** (9 tests) - Group CRUD, member management, performance
- ✅ **AI Services** (13 tests) - Content generation, knowledge base, specialized content
- ✅ **Polls** (6 tests) - Poll creation, responses, results analytics
- ✅ **Training** (29 tests) - Sessions, courses, modules, assessments, progress tracking
- ✅ **Presentations** (19 tests) - Live presentations, polls, slides, statistics
- ✅ **System Management** (6 tests) - Health checks, configuration, error handling
- ✅ **Performance & Error Handling** (19 tests) - Rate limiting, validation, edge cases

## 🚀 Quick Start

### 1. Prerequisites

```bash
# Install dependencies
npm install

# Start the server
npm run dev

# Verify server is running
curl http://localhost:3001/api/v1/health
```

### 2. Automated Testing

```bash
# Run all tests
npm run api:test:all

# Run specific category
npm run api:test:auth
npm run api:test:users
npm run api:test:tenants
npm run api:test:ai
npm run api:test:training
npm run api:test:presentations

# Run with custom options
node scripts/run-api-tests.js --help
```

### 3. Postman Testing

1. Import `API_TEST_CASES.csv` into Postman
2. Import `postman_environment.json` as environment
3. Set up environment variables
4. Run tests manually or via Postman Runner

## 📁 Files Structure

```
├── API_TEST_CASES.csv              # Complete test cases (140 tests)
├── postman_environment.json        # Postman environment variables
├── POSTMAN_SETUP_GUIDE.md          # Detailed Postman setup guide
├── scripts/run-api-tests.js        # Automated testing script
└── API_TESTING_README.md           # This file
```

## 🧪 Test Categories Details

### 🔐 Authentication Tests (TC001-TC014)

**Endpoints Covered:**
- User registration and login
- Email verification
- Password reset functionality
- Token refresh mechanism
- Profile management

**Key Test Scenarios:**
- Valid user registration
- Invalid email formats
- Password strength validation
- Token expiration handling
- Profile updates

### 👥 User Management Tests (TC015-TC024)

**Endpoints Covered:**
- Complete CRUD operations
- Bulk user operations
- User health monitoring
- User suspension/activation
- Password reset by admin

**Key Test Scenarios:**
- Create users with different roles
- Bulk activate/deactivate users
- User health metrics
- Role-based access control
- User data validation

### 🏢 Tenant Management Tests (TC025-TC040)

**Endpoints Covered:**
- Tenant creation and management
- Multi-tenant operations
- Analytics and statistics
- Bulk operations
- Tenant settings

**Key Test Scenarios:**
- Tenant creation with validation
- Multi-tenant data isolation
- Tenant analytics
- Bulk tenant operations
- Tenant configuration

### 👥 Group Management Tests (TC041-TC050)

**Endpoints Covered:**
- Group CRUD operations
- Member management
- Performance tracking
- Role assignments

**Key Test Scenarios:**
- Group creation and management
- Member addition/removal
- Performance analytics
- Role-based permissions

### 🤖 AI Services Tests (TC051-TC063)

**Endpoints Covered:**
- Content generation
- Knowledge base management
- Specialized content creation
- Translation services
- Health monitoring

**Key Test Scenarios:**
- AI content generation
- Knowledge base operations
- Training material creation
- Content improvement
- Translation accuracy

### 📊 Polls Tests (TC064-TC069)

**Endpoints Covered:**
- Poll creation and management
- Response collection
- Results analytics

**Key Test Scenarios:**
- Poll creation with questions
- Response submission
- Results calculation
- Poll statistics

### 📚 Training Tests (TC072-TC101)

**Endpoints Covered:**
- Training sessions management
- Course management
- Module and assessment systems
- Progress tracking
- Statistics

**Key Test Scenarios:**
- Session creation and management
- Course enrollment
- Module completion
- Assessment submission
- Progress tracking

### 🎯 Presentations Tests (TC102-TC121)

**Endpoints Covered:**
- Presentation management
- Live session handling
- Poll integration
- Slide management

**Key Test Scenarios:**
- Presentation creation
- Live session management
- Real-time polls
- Slide navigation
- Session statistics

## 🔧 Automated Testing Script

### Usage

```bash
# Basic usage
node scripts/run-api-tests.js

# Run specific category
node scripts/run-api-tests.js -c "Authentication"

# Run in parallel
node scripts/run-api-tests.js -p

# Custom configuration
node scripts/run-api-tests.js \
  --base-url "http://localhost:3001/api/v1" \
  --timeout 15000 \
  --retries 5 \
  --delay 200 \
  -p
```

### Options

- `-f, --file <path>` - CSV test file path (default: API_TEST_CASES.csv)
- `-c, --category <category>` - Run tests for specific category
- `-p, --parallel` - Run tests in parallel
- `-d, --delay <ms>` - Delay between requests (default: 100ms)
- `-t, --timeout <ms>` - Request timeout (default: 10000ms)
- `-r, --retries <count>` - Number of retries (default: 3)
- `--base-url <url>` - API base URL

### Features

- ✅ **Sequential and parallel execution**
- ✅ **Automatic retry on failure**
- ✅ **Environment variable extraction**
- ✅ **Comprehensive reporting**
- ✅ **Category filtering**
- ✅ **Performance monitoring**

## 📊 Test Reports

### Automated Script Reports

The automated testing script generates:

1. **Console Output** - Real-time test progress
2. **JSON Report** - Detailed test results (`test-report.json`)
3. **Error Details** - Failed test information
4. **Performance Metrics** - Response times and success rates

### Sample Report

```json
{
  "summary": {
    "total": 140,
    "passed": 135,
    "failed": 5,
    "skipped": 0,
    "successRate": 96.43,
    "duration": 45000
  },
  "errors": [
    {
      "testCase": "TC015",
      "description": "Get All Users",
      "error": "Authentication failed",
      "expected": { "status": 200 },
      "actual": { "status": 401 }
    }
  ],
  "timestamp": "2025-01-27T10:00:00.000Z"
}
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Server Not Running
```bash
# Check if server is running
curl http://localhost:3001/api/v1/health

# Start server if needed
npm run dev
```

#### 2. Database Connection Issues
```bash
# Check database health
curl http://localhost:3001/api/v1/health/db

# Reset database if needed
npm run db:reset
```

#### 3. Authentication Issues
- Verify JWT token format
- Check token expiration
- Ensure proper authentication flow

#### 4. Test Data Issues
- Clear test data between runs
- Use unique test data
- Check environment variables

### Debug Steps

1. **Check Server Logs**
   ```bash
   npm run dev
   # Monitor console output for errors
   ```

2. **Verify Environment**
   ```bash
   # Check environment variables
   echo $API_BASE_URL
   ```

3. **Test Individual Endpoints**
   ```bash
   # Test health endpoint
   curl http://localhost:3001/api/v1/health
   
   # Test authentication
   curl -X POST http://localhost:3001/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{"firstName":"Test","lastName":"User","email":"test@example.com","password":"TestPass123!"}'
   ```

## 📈 Performance Testing

### Load Testing

```bash
# Run performance tests
npm run performance:test

# Custom load test
artillery run tests/performance/load-test.yml
```

### Monitoring

Track these metrics:
- Response times
- Success rates
- Error rates
- Throughput
- Resource usage

## 🔒 Security Testing

### Security Scenarios

1. **Authentication Bypass**
   - Test endpoints without authentication
   - Verify proper authorization

2. **Input Validation**
   - Test with malicious input
   - Verify sanitization

3. **Rate Limiting**
   - Test rate limit enforcement
   - Verify proper error responses

4. **Data Validation**
   - Test with invalid data types
   - Verify proper error handling

## 📚 Best Practices

### 1. Test Organization
- Group related tests together
- Use descriptive test names
- Maintain test data consistency

### 2. Environment Management
- Use separate environments for different stages
- Keep sensitive data secure
- Version control environment files

### 3. Test Data
- Use unique test data
- Clean up after tests
- Avoid hardcoded values

### 4. Error Handling
- Test error scenarios
- Verify proper error responses
- Test edge cases

## 🚀 CI/CD Integration

### GitHub Actions Example

```yaml
name: API Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run db:reset
      - run: npm run dev &
      - run: sleep 10
      - run: npm run api:test:all
```

### Jenkins Pipeline Example

```groovy
pipeline {
    agent any
    stages {
        stage('Setup') {
            steps {
                sh 'npm install'
                sh 'npm run db:reset'
            }
        }
        stage('Start Server') {
            steps {
                sh 'npm run dev &'
                sh 'sleep 10'
            }
        }
        stage('Run Tests') {
            steps {
                sh 'npm run api:test:all'
            }
        }
    }
}
```

## 📞 Support

### Getting Help

1. **Check Documentation**
   - Review this README
   - Check API documentation
   - Review error messages

2. **Debug Issues**
   - Enable debug logging
   - Check server logs
   - Verify configuration

3. **Report Issues**
   - Create detailed bug reports
   - Include test cases
   - Provide error logs

---

## 🎯 Quick Reference

### Common Commands

```bash
# Start server
npm run dev

# Run all API tests
npm run api:test:all

# Run specific category
npm run api:test:auth

# Run with Postman
# Import API_TEST_CASES.csv and postman_environment.json

# Check server health
curl http://localhost:3001/api/v1/health

# Reset database
npm run db:reset
```

### Test Categories

- `Authentication` - User auth and tokens
- `User Management` - User CRUD operations
- `Tenant Management` - Multi-tenant operations
- `Group Management` - Group and member management
- `AI Services` - AI content generation
- `Polls` - Poll creation and responses
- `Training` - Training sessions and courses
- `Presentations` - Live presentation management

### Environment Variables

- `base_url` - API base URL
- `auth_token` - JWT authentication token
- `user_id` - Test user ID
- `tenant_id` - Test tenant ID
- And many more...

---

**Happy Testing! 🧪✨** 