# LuxGen Health Check System

## Overview

The LuxGen health check system provides comprehensive validation of all functionality, specs, ESLint, and API endpoints before starting the backend server. This ensures that the backend is in a healthy state before accepting requests.

## Health Check Types

### 1. Simple Health Check (`simpleHealthCheck.js`)
**Recommended for development and production**

Essential checks that ensure the backend can start safely:
- ✅ Environment validation (Node.js version, environment variables)
- ✅ Dependencies verification (critical packages)
- ✅ Database connectivity (MongoDB local/Atlas)
- ✅ File structure validation (required files)
- ✅ ESLint check (code quality)

### 2. Full Health Check (`healthCheck.js`)
**For comprehensive validation**

Advanced checks including:
- ✅ All simple health check features
- ✅ TypeScript compilation validation
- ✅ Complete test suite execution
- ✅ API endpoint validation (180+ endpoints)
- ✅ Security vulnerability scanning
- ✅ Performance metrics validation
- ✅ File structure deep analysis

### 3. API Endpoint Validator (`validateAPIEndpoints.js`)
**Standalone API validation**

Specialized validation for API endpoints:
- ✅ Endpoint structure validation
- ✅ Middleware usage verification
- ✅ Authentication requirements
- ✅ Error handling validation
- ✅ Response format consistency
- ✅ CORS configuration
- ✅ Rate limiting checks

## Usage

### Quick Start (Recommended)
```bash
# Run backend with essential health checks
npm run start:health

# Run development with health checks
npm run dev:health
```

### Manual Health Checks
```bash
# Simple health check (fast, recommended)
npm run health

# Full health check (comprehensive, slower)
npm run health:full

# API endpoint validation only
node src/scripts/validateAPIEndpoints.js
```

### Direct Script Execution
```bash
# Simple health check
node src/scripts/simpleHealthCheck.js

# Full health check
node src/scripts/healthCheck.js

# Startup with health check
node src/scripts/startWithHealthCheck.js
```

## Health Check Results

### Status Levels
- ✅ **PASSED**: All checks successful
- ⚠️ **WARNING**: Checks passed with warnings (backend can start)
- ❌ **FAILED**: Critical issues found (backend startup aborted)

### Example Output
```
🏥 LUXGEN ESSENTIAL HEALTH CHECK
=================================
🔧 Checking environment...
📦 Checking dependencies...
🗄️ Checking database connectivity...
📁 Checking file structure...
🔍 Running ESLint check...

📊 HEALTH CHECK REPORT
======================
Overall Status: ⚠️ WARNING
Total Checks: 5
✅ Passed: 3
❌ Failed: 0
⚠️  Warnings: 2

📋 Detailed Results:
✅ Environment: passed
✅ Dependencies: passed
⚠️ Database: warning
   ⚠️  Warning: No MongoDB URI configured - using fallback mode
✅ File Structure: passed
⚠️ ESLint: warning
   ⚠️  Warning: ESLint found warnings

==================================================
⚠️  HEALTH CHECK PASSED WITH WARNINGS - Backend will start
```

## Configuration

### Environment Variables
```bash
# Database configuration
USE_LOCAL_DB=true                    # Use local MongoDB
MONGODB_URI=mongodb://localhost:27017/luxgen
MONGODB_ATLAS_URI=mongodb+srv://...

# Node.js configuration
NODE_ENV=development
PORT=5000
```

### Health Check Behavior
- **Database unavailable**: Server runs in fallback mode
- **ESLint warnings**: Non-blocking, server starts with warnings
- **Missing dependencies**: Blocks startup
- **File structure issues**: Blocks startup
- **Environment issues**: Blocks startup

## Integration

### Pre-commit Hooks
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run health && lint-staged",
      "pre-push": "npm run health:full"
    }
  }
}
```

### CI/CD Pipeline
```yaml
# GitHub Actions example
- name: Health Check
  run: npm run health:full
  
- name: Start Backend
  run: npm run start:health
```

### Docker Integration
```dockerfile
# Dockerfile
COPY package*.json ./
RUN npm install
RUN npm run health
CMD ["npm", "run", "start:health"]
```

## Troubleshooting

### Common Issues

#### Database Connection Failed
```
⚠️ Database: warning
   ⚠️ Warning: Database connection failed: read ECONNRESET
```
**Solution**: Check MongoDB is running or configure `USE_LOCAL_DB=true`

#### ESLint Warnings
```
⚠️ ESLint: warning
   ⚠️ Warning: ESLint found warnings
```
**Solution**: Run `npm run lint:fix` to auto-fix issues

#### Missing Dependencies
```
❌ Dependencies: failed
   ❌ Error: Missing critical dependencies: express, mongoose
```
**Solution**: Run `npm install` to install missing packages

#### File Structure Issues
```
❌ File Structure: failed
   ❌ Error: Missing required files: src/index.js
```
**Solution**: Ensure all required files exist in the project

### Debug Mode
```bash
# Enable debug logging
DEBUG=health:* npm run health

# Verbose output
npm run health -- --verbose
```

## Performance

### Simple Health Check
- ⚡ **Fast**: ~2-3 seconds
- 🎯 **Focused**: Essential checks only
- 🚀 **Production-ready**: Safe for production use

### Full Health Check
- 🐌 **Slower**: ~10-15 seconds
- 🔍 **Comprehensive**: All validations
- 🧪 **Development**: Best for development/testing

## Best Practices

### Development
1. Use `npm run dev:health` for development
2. Run `npm run health` before committing
3. Fix warnings before pushing

### Production
1. Use `npm run start:health` for production
2. Monitor health check results
3. Set up alerts for failed health checks

### CI/CD
1. Run full health check in CI
2. Block deployment on health check failure
3. Include health check in monitoring

## Monitoring

### Health Check Endpoints
```bash
# Basic health check
curl http://localhost:5000/health

# Database health
curl http://localhost:5000/health/db

# Detailed metrics
curl http://localhost:5000/health/metrics
```

### Logging
Health check results are logged with timestamps and can be integrated with monitoring systems like:
- Prometheus
- Grafana
- DataDog
- New Relic

## Contributing

### Adding New Checks
1. Add check method to `SimpleHealthChecker` class
2. Call method in `runEssentialChecks()`
3. Update documentation
4. Add tests

### Example New Check
```javascript
async checkNewFeature() {
  console.log('🔍 Checking new feature...');
  const check = { name: 'New Feature', status: 'running' };
  
  try {
    // Your check logic here
    check.status = 'passed';
    check.details = { message: 'New feature is working' };
  } catch (error) {
    check.status = 'failed';
    check.error = error.message;
  }
  
  this.addCheckResult('newFeature', check);
}
```

## Support

For issues or questions about the health check system:
1. Check the troubleshooting section
2. Review the logs for specific error messages
3. Run individual health checks to isolate issues
4. Create an issue with detailed error information

---

**LuxGen Health Check System** - Ensuring robust backend startup and operation.
