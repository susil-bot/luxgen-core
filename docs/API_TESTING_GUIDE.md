# LuxGen Core API Testing Guide

## Overview

This guide provides comprehensive testing documentation for the LuxGen Core API backend. The API includes authentication, tenant management, and various other endpoints with robust test coverage.

## API Headers

All API responses include custom headers:
- `X-API-Source: luxgen-core`
- `X-API-Version: 1.0.0`

## Database Setup

**No manual database creation required!** The system automatically:
- Creates the database when first document is inserted
- Creates all required collections
- Sets up indexes for performance
- Creates initial data (default tenant, admin user)

### Automatic Collections Created:
- `users` - User accounts
- `tenants` - Multi-tenant organizations
- `sessions` - Training sessions
- `groups` - User groups
- `polls` - Interactive polls
- `notifications` - System notifications
- `audit_logs` - Activity tracking
- `training_sessions` - Training data
- `training_courses` - Course management
- `training_modules` - Learning modules
- `training_assessments` - Quizzes and tests
- `presentations` - Presentation data
- `tenant_schemas` - Custom schemas
- `tenant_configs` - Tenant configurations
- `tenant_styling` - UI customization

## Test Structure

```
src/tests/
├── api/                    # Unit tests for API endpoints
│   ├── auth.spec.js       # Authentication tests
│   ├── health.spec.js     # Health check tests
│   └── tenants.spec.js    # Tenant management tests
├── integration/           # Integration tests
│   └── api-workflow.spec.js # Complete workflow tests
├── setup.js              # Test setup and configuration
└── run-tests.js          # Test runner
```

## Running Tests

### Prerequisites
```bash
cd luxgen-core
npm install
```

### Run All Tests
```bash
npm test
```

### Run Specific Test Suites
```bash
# Unit tests only
npm run test:api

# Integration tests only
npm run test:integration

# With coverage report
npm run test:coverage

# Watch mode
npm run test:watch
```

### Using the Test Runner
```bash
# Run all tests
node src/tests/run-tests.js

# Run unit tests only
node src/tests/run-tests.js --unit

# Run with coverage
node src/tests/run-tests.js --coverage

# Run specific test
node src/tests/run-tests.js --specific auth
```

## API Endpoints Testing

### 1. Health Check Endpoints

#### GET /health
```bash
curl -H "Accept: application/json" http://localhost:3001/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-02T00:42:46.875Z",
  "service": "luxgen-trainer-platform-api",
  "version": "1.0.0",
  "uptime": 273.203971167
}
```

**Headers:**
- `X-API-Source: luxgen-core`
- `X-API-Version: 1.0.0`

#### GET /health/db
```bash
curl -H "Accept: application/json" http://localhost:3001/health/db
```

#### GET /docs
```bash
curl -H "Accept: application/json" http://localhost:3001/docs
```

### 2. Authentication Endpoints

#### POST /api/v1/auth/register
```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User",
    "tenantSlug": "default"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "68ddca8bdd14d283ed85fe5f",
      "email": "test@example.com",
      "firstName": "Test",
      "lastName": "User",
      "role": "user",
      "isActive": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Registration successful"
}
```

#### POST /api/v1/auth/login
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

#### POST /api/v1/auth/logout
```bash
curl -X POST http://localhost:3001/api/v1/auth/logout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Accept: application/json"
```

#### POST /api/v1/auth/refresh
```bash
curl -X POST http://localhost:3001/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

#### POST /api/v1/auth/forgot-password
```bash
curl -X POST http://localhost:3001/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

#### POST /api/v1/auth/reset-password
```bash
curl -X POST http://localhost:3001/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "token": "RESET_TOKEN",
    "newPassword": "newpassword123"
  }'
```

### 3. Tenant Management Endpoints

#### GET /api/v1/tenants
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Accept: application/json" \
  http://localhost:3001/api/v1/tenants
```

#### POST /api/v1/tenants
```bash
curl -X POST http://localhost:3001/api/v1/tenants \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "name": "New Tenant",
    "slug": "new-tenant",
    "description": "New tenant description",
    "contactEmail": "contact@newtenant.com"
  }'
```

#### GET /api/v1/tenants/:id
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Accept: application/json" \
  http://localhost:3001/api/v1/tenants/TENANT_ID
```

#### PUT /api/v1/tenants/:id
```bash
curl -X PUT http://localhost:3001/api/v1/tenants/TENANT_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "name": "Updated Tenant Name",
    "description": "Updated description"
  }'
```

#### DELETE /api/v1/tenants/:id
```bash
curl -X DELETE http://localhost:3001/api/v1/tenants/TENANT_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Accept: application/json"
```

## Test Scenarios

### 1. Complete User Registration and Login Workflow

1. **Create Tenant** (Admin operation)
2. **Register User** with tenant
3. **Login User** with credentials
4. **Test Authenticated Endpoints**
5. **Logout User**

### 2. Password Reset Workflow

1. **Request Password Reset** for existing user
2. **Reset Password** with token
3. **Login with New Password**

### 3. Token Management

1. **Login** to get token
2. **Refresh Token** before expiration
3. **Use Token** for authenticated requests
4. **Logout** to invalidate token

### 4. Error Handling

1. **Invalid Endpoints** - 404 responses
2. **Malformed JSON** - 400 responses
3. **Rate Limiting** - 429 responses
4. **Authentication Errors** - 401 responses
5. **Authorization Errors** - 403 responses

## Test Data Management

### Automatic Cleanup
- Tests automatically clean up test data
- Uses in-memory MongoDB for testing
- No impact on production database

### Test Data Patterns
- Email addresses: `*@example.com`, `*@test.com`
- Tenant slugs: `test-*`, `workflow-test-*`
- User names: `Test User`, `Admin User`

## Coverage Reports

Run tests with coverage:
```bash
npm run test:coverage
```

Coverage reports are generated in:
- `coverage/lcov-report/index.html` - HTML report
- `coverage/lcov.info` - LCOV format
- `coverage/coverage-summary.txt` - Text summary

## Continuous Integration

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
      - run: npm test
      - run: npm run test:coverage
```

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Ensure MongoDB Atlas connection string is correct
   - Check network connectivity
   - Verify database permissions

2. **Authentication Failures**
   - Check JWT secret configuration
   - Verify token expiration settings
   - Ensure proper password hashing

3. **Test Failures**
   - Check test database setup
   - Verify test data cleanup
   - Check for race conditions in tests

### Debug Mode

Run tests with verbose output:
```bash
npm test -- --verbose
```

### Test Logs

Check test logs for detailed information:
```bash
npm test 2>&1 | tee test-results.log
```

## Performance Testing

### Load Testing with Artillery
```bash
npm install -g artillery
artillery quick --count 10 --num 5 http://localhost:3001/health
```

### Memory Usage Monitoring
```bash
node --inspect src/index.js
# Use Chrome DevTools to monitor memory usage
```

## Security Testing

### Security Headers Verification
```bash
curl -I http://localhost:3001/health
# Check for security headers like X-Frame-Options, CSP, etc.
```

### Input Validation Testing
- Test with malformed JSON
- Test with SQL injection attempts
- Test with XSS payloads
- Test with oversized payloads

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **Data Cleanup**: Always clean up test data
3. **Mock External Services**: Don't call real external APIs in tests
4. **Coverage Goals**: Aim for >80% code coverage
5. **Performance**: Tests should complete in reasonable time
6. **Documentation**: Keep test documentation updated

## Contributing

When adding new tests:
1. Follow existing naming conventions
2. Include both positive and negative test cases
3. Test edge cases and error conditions
4. Update this documentation
5. Ensure tests pass in CI/CD pipeline
