# 🧪 Postman API Testing Setup Guide

## 📋 Overview

This guide provides comprehensive instructions for setting up and using the API test cases in Postman for the LuxGen Trainer Platform.

## 🚀 Quick Setup

### 1. Import the CSV File
1. Open Postman
2. Click **Import** button
3. Select the `API_TEST_CASES.csv` file
4. Postman will automatically create a collection with all test cases

### 2. Set Up Environment Variables

Create a new environment in Postman with these variables:

```json
{
  "base_url": "http://localhost:3001/api/v1",
  "auth_token": "",
  "refresh_token": "",
  "user_id": "",
  "tenant_id": "",
  "group_id": "",
  "poll_id": "",
  "session_id": "",
  "course_id": "",
  "module_id": "",
  "assessment_id": "",
  "presentation_id": "",
  "schema_id": "",
  "verification_token": "",
  "reset_token": ""
}
```

### 3. Pre-request Scripts

Add this pre-request script to automatically set the base URL:

```javascript
// Set base URL if not already set
if (!pm.environment.get("base_url")) {
    pm.environment.set("base_url", "http://localhost:3001/api/v1");
}
```

## 📊 Test Categories

### 🔐 Authentication (14 test cases)
- User registration and login
- Email verification
- Password reset functionality
- Token refresh
- Profile management

### 👥 User Management (10 test cases)
- CRUD operations for users
- Bulk operations
- User health monitoring
- User suspension/activation

### 🏢 Tenant Management (15 test cases)
- Tenant creation and management
- Multi-tenant operations
- Analytics and statistics
- Bulk operations

### 👥 Group Management (9 test cases)
- Group CRUD operations
- Member management
- Performance tracking

### 🤖 AI Services (13 test cases)
- Content generation
- Knowledge base management
- Specialized content creation
- Translation services

### 📊 Polls (6 test cases)
- Poll creation and management
- Response collection
- Results analytics

### 📚 Training (29 test cases)
- Training sessions management
- Course management
- Module and assessment systems
- Progress tracking
- Statistics

### 🎯 Presentations (19 test cases)
- Presentation management
- Live session handling
- Poll integration
- Slide management

### ⚙️ System (6 test cases)
- Health checks
- Configuration management
- Error handling
- Performance testing

## 🧪 Testing Strategy

### 1. Sequential Testing
Run tests in this order:
1. **Health Checks** (TC001-TC003)
2. **Authentication** (TC004-TC014)
3. **Tenant Management** (TC025-TC040)
4. **User Management** (TC015-TC024)
5. **Group Management** (TC041-TC050)
6. **AI Services** (TC051-TC063)
7. **Polls** (TC064-TC069)
8. **Training** (TC072-TC101)
9. **Presentations** (TC102-TC121)
10. **System Management** (TC122-TC140)

### 2. Data Dependencies
Some tests depend on data created by previous tests:
- User tests require authentication tokens
- Group tests require user IDs
- Training tests require trainer and participant IDs
- Presentation tests require presenter IDs

### 3. Test Data Management
Use Postman's environment variables to store:
- Authentication tokens
- Created entity IDs
- Test data references

## 🔧 Advanced Configuration

### 1. Collection Variables
Set these at the collection level:

```json
{
  "default_headers": {
    "Content-Type": "application/json",
    "Accept": "application/json"
  },
  "timeout": 10000,
  "retry_count": 3
}
```

### 2. Test Scripts
Add validation scripts to each test:

```javascript
// Example test script for successful response
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has success field", function () {
    const response = pm.response.json();
    pm.expect(response).to.have.property('success');
    pm.expect(response.success).to.be.true;
});

pm.test("Response time is less than 1000ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(1000);
});
```

### 3. Pre-request Scripts
Add authentication handling:

```javascript
// Auto-refresh token if needed
const token = pm.environment.get("auth_token");
const tokenExpiry = pm.environment.get("token_expiry");

if (token && tokenExpiry && new Date() > new Date(tokenExpiry)) {
    // Refresh token logic
    pm.sendRequest({
        url: pm.environment.get("base_url") + "/auth/refresh",
        method: "POST",
        header: {
            "Content-Type": "application/json"
        },
        body: {
            mode: "raw",
            raw: JSON.stringify({
                refreshToken: pm.environment.get("refresh_token")
            })
        }
    }, function (err, response) {
        if (response.code === 200) {
            const result = response.json();
            pm.environment.set("auth_token", result.token);
            pm.environment.set("token_expiry", new Date(Date.now() + 3600000));
        }
    });
}
```

## 📈 Performance Testing

### 1. Load Testing
Use Postman's Runner to:
- Run tests with multiple iterations
- Set delays between requests
- Monitor response times
- Generate performance reports

### 2. Stress Testing
Test rate limiting and error handling:
- Send multiple concurrent requests
- Test with invalid data
- Monitor system behavior under load

### 3. Monitoring
Track these metrics:
- Response times
- Success rates
- Error rates
- System resource usage

## 🐛 Troubleshooting

### Common Issues

#### 1. Authentication Errors
- Check if tokens are valid
- Verify token expiration
- Ensure proper token format

#### 2. 404 Errors
- Verify base URL is correct
- Check endpoint paths
- Ensure server is running

#### 3. Validation Errors
- Check request body format
- Verify required fields
- Validate data types

#### 4. Rate Limiting
- Implement delays between requests
- Use different IP addresses
- Monitor rate limit headers

### Debug Steps

1. **Check Server Status**
   ```bash
   curl http://localhost:3001/api/v1/health
   ```

2. **Verify Database Connection**
   ```bash
   curl http://localhost:3001/api/v1/health/db
   ```

3. **Check Logs**
   - Monitor server logs
   - Check Postman console
   - Review error responses

4. **Validate Environment**
   - Verify environment variables
   - Check collection settings
   - Ensure proper authentication

## 📊 Test Reporting

### 1. Postman Reports
- Use Postman's built-in reporting
- Export test results
- Generate performance metrics

### 2. Custom Reporting
- Create custom test scripts
- Log results to external systems
- Generate custom reports

### 3. Integration
- Connect to CI/CD pipelines
- Integrate with monitoring tools
- Set up automated testing

## 🎯 Best Practices

### 1. Test Organization
- Group related tests together
- Use descriptive test names
- Maintain test data consistency

### 2. Environment Management
- Use separate environments for different stages
- Keep sensitive data secure
- Version control environment files

### 3. Documentation
- Document test scenarios
- Maintain test data
- Update test cases regularly

### 4. Automation
- Set up automated test runs
- Integrate with CI/CD
- Monitor test results

## 📚 Additional Resources

### Documentation
- [Postman Learning Center](https://learning.postman.com/)
- [API Testing Best Practices](https://www.postman.com/use-cases/api-testing/)
- [Collection Format](https://schema.getpostman.com/)

### Tools
- [Newman](https://github.com/postmanlabs/newman) - CLI for Postman
- [Postman Monitors](https://monitor.getpostman.com/) - Automated testing
- [Postman Workspaces](https://www.postman.com/workspaces/) - Team collaboration

---

## 🚀 Getting Started Checklist

- [ ] Import API_TEST_CASES.csv into Postman
- [ ] Set up environment variables
- [ ] Configure authentication
- [ ] Run health check tests
- [ ] Execute authentication tests
- [ ] Set up automated testing
- [ ] Configure monitoring
- [ ] Document test results

**Happy Testing! 🧪✨** 