/**
 * LUXGEN API ENDPOINT VALIDATOR
 * Validates all API endpoints for proper structure and functionality
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class APIEndpointValidator {
  constructor() {
    this.endpoints = [];
    this.errors = [];
    this.warnings = [];
    this.results = {
      total: 0,
      valid: 0,
      invalid: 0,
      warnings: 0
    };
  }

  async validateAllEndpoints() {
    console.log('🔗 LUXGEN API ENDPOINT VALIDATION');
    console.log('==================================');

    try {
      // 1. Scan all route files
      await this.scanRouteFiles();
      
      // 2. Validate endpoint structure
      await this.validateEndpointStructure();
      
      // 3. Check for missing middleware
      await this.checkMiddleware();
      
      // 4. Validate error handling
      await this.validateErrorHandling();
      
      // 5. Check authentication requirements
      await this.checkAuthentication();
      
      // 6. Validate response formats
      await this.validateResponseFormats();
      
      // 7. Check for CORS configuration
      await this.checkCORS();
      
      // 8. Validate rate limiting
      await this.checkRateLimiting();
      
      // Generate report
      this.generateReport();
      
      return this.results;
      
    } catch (error) {
      console.error('❌ API validation failed:', error);
      this.results.error = error.message;
      return this.results;
    }
  }

  async scanRouteFiles() {
    console.log('📁 Scanning route files...');
    
    const routesDir = path.join(process.cwd(), 'src', 'routes');
    const routeFiles = await this.getFilesRecursively(routesDir, ['.js']);
    
    for (const file of routeFiles) {
      try {
        const content = await fs.readFile(file, 'utf8');
        const fileEndpoints = this.extractEndpoints(content, file);
        this.endpoints.push(...fileEndpoints);
      } catch (error) {
        this.errors.push(`Error reading ${file}: ${error.message}`);
      }
    }
    
    this.results.total = this.endpoints.length;
    console.log(`Found ${this.endpoints.length} endpoints in ${routeFiles.length} files`);
  }

  extractEndpoints(content, filePath) {
    const endpoints = [];
    const lines = content.split('\n');
    
    // Match various route patterns
    const patterns = [
      /router\.(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/g,
      /app\.(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/g,
      /\.(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/g
    ];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(line)) !== null) {
          const method = match[1].toUpperCase();
          const path = match[2];
          const lineNumber = i + 1;
          
          endpoints.push({
            method,
            path,
            file: filePath,
            line: lineNumber,
            fullLine: line.trim(),
            middleware: this.extractMiddleware(content, i),
            handlers: this.extractHandlers(content, i)
          });
        }
      }
    }
    
    return endpoints;
  }

  extractMiddleware(content, lineIndex) {
    const lines = content.split('\n');
    const middleware = [];
    
    // Look for middleware in the same line or nearby lines
    for (let i = Math.max(0, lineIndex - 2); i <= Math.min(lines.length - 1, lineIndex + 2); i++) {
      const line = lines[i];
      if (line.includes('middleware') || line.includes('auth') || line.includes('validate')) {
        middleware.push(line.trim());
      }
    }
    
    return middleware;
  }

  extractHandlers(content, lineIndex) {
    const lines = content.split('\n');
    const handlers = [];
    
    // Look for handler functions in the same line or nearby lines
    for (let i = lineIndex; i <= Math.min(lines.length - 1, lineIndex + 3); i++) {
      const line = lines[i];
      if (line.includes('Controller.') || line.includes('Service.') || line.includes('Handler')) {
        handlers.push(line.trim());
      }
    }
    
    return handlers;
  }

  async validateEndpointStructure() {
    console.log('🏗️ Validating endpoint structure...');
    
    for (const endpoint of this.endpoints) {
      const issues = [];
      
      // Check for valid HTTP methods
      const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'];
      if (!validMethods.includes(endpoint.method)) {
        issues.push(`Invalid HTTP method: ${endpoint.method}`);
      }
      
      // Check for valid path format
      if (!endpoint.path.startsWith('/')) {
        issues.push(`Path should start with '/': ${endpoint.path}`);
      }
      
      // Check for duplicate endpoints
      const duplicates = this.endpoints.filter(ep => 
        ep.method === endpoint.method && 
        ep.path === endpoint.path && 
        ep !== endpoint
      );
      if (duplicates.length > 0) {
        issues.push(`Duplicate endpoint found`);
      }
      
      // Check for RESTful conventions
      if (this.isRESTfulViolation(endpoint)) {
        issues.push(`RESTful convention violation`);
      }
      
      if (issues.length === 0) {
        this.results.valid++;
      } else {
        this.results.invalid++;
        this.errors.push({
          endpoint: `${endpoint.method} ${endpoint.path}`,
          file: endpoint.file,
          line: endpoint.line,
          issues
        });
      }
    }
  }

  isRESTfulViolation(endpoint) {
    const { method, path } = endpoint;
    
    // Check for common RESTful violations
    if (method === 'GET' && path.includes('/create')) return true;
    if (method === 'POST' && path.includes('/delete')) return true;
    if (method === 'PUT' && path.includes('/update')) return true;
    
    return false;
  }

  async checkMiddleware() {
    console.log('🛡️ Checking middleware usage...');
    
    const criticalEndpoints = this.endpoints.filter(ep => 
      ep.path.includes('/api/') && 
      !ep.path.includes('/health') &&
      !ep.path.includes('/status')
    );
    
    for (const endpoint of criticalEndpoints) {
      const hasAuth = endpoint.middleware.some(mw => 
        mw.includes('auth') || mw.includes('authenticate')
      );
      
      const hasValidation = endpoint.middleware.some(mw => 
        mw.includes('validate') || mw.includes('validator')
      );
      
      if (!hasAuth && !endpoint.path.includes('/public')) {
        this.warnings.push({
          endpoint: `${endpoint.method} ${endpoint.path}`,
          file: endpoint.file,
          line: endpoint.line,
          warning: 'Missing authentication middleware'
        });
        this.results.warnings++;
      }
      
      if (!hasValidation && ['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
        this.warnings.push({
          endpoint: `${endpoint.method} ${endpoint.path}`,
          file: endpoint.file,
          line: endpoint.line,
          warning: 'Missing validation middleware'
        });
        this.results.warnings++;
      }
    }
  }

  async validateErrorHandling() {
    console.log('🚨 Validating error handling...');
    
    for (const endpoint of this.endpoints) {
      const hasErrorHandling = endpoint.handlers.some(handler => 
        handler.includes('try') || 
        handler.includes('catch') || 
        handler.includes('Error') ||
        handler.includes('errorHandler')
      );
      
      if (!hasErrorHandling) {
        this.warnings.push({
          endpoint: `${endpoint.method} ${endpoint.path}`,
          file: endpoint.file,
          line: endpoint.line,
          warning: 'Missing error handling'
        });
        this.results.warnings++;
      }
    }
  }

  async checkAuthentication() {
    console.log('🔐 Checking authentication requirements...');
    
    const publicEndpoints = [
      '/health',
      '/status',
      '/api/v1/auth/login',
      '/api/v1/auth/register',
      '/api/v1/auth/forgot-password',
      '/api/v1/auth/reset-password'
    ];
    
    for (const endpoint of this.endpoints) {
      const isPublic = publicEndpoints.some(publicPath => 
        endpoint.path.includes(publicPath)
      );
      
      if (!isPublic && !endpoint.path.includes('/public')) {
        const hasAuth = endpoint.middleware.some(mw => 
          mw.includes('auth') || mw.includes('authenticate') || mw.includes('jwt')
        );
        
        if (!hasAuth) {
          this.warnings.push({
            endpoint: `${endpoint.method} ${endpoint.path}`,
            file: endpoint.file,
            line: endpoint.line,
            warning: 'Should have authentication for non-public endpoint'
          });
          this.results.warnings++;
        }
      }
    }
  }

  async validateResponseFormats() {
    console.log('📋 Validating response formats...');
    
    // Check for consistent response format
    const responsePatterns = [
      /res\.json\(/g,
      /res\.status\(/g,
      /res\.send\(/g
    ];
    
    for (const endpoint of this.endpoints) {
      const hasResponse = endpoint.handlers.some(handler => 
        responsePatterns.some(pattern => pattern.test(handler))
      );
      
      if (!hasResponse) {
        this.warnings.push({
          endpoint: `${endpoint.method} ${endpoint.path}`,
          file: endpoint.file,
          line: endpoint.line,
          warning: 'No response handling found'
        });
        this.results.warnings++;
      }
    }
  }

  async checkCORS() {
    console.log('🌐 Checking CORS configuration...');
    
    // Check if CORS is properly configured
    try {
      const appFile = path.join(process.cwd(), 'src', 'index.js');
      const content = await fs.readFile(appFile, 'utf8');
      
      if (!content.includes('cors')) {
        this.warnings.push({
          warning: 'CORS middleware not found in main app file'
        });
        this.results.warnings++;
      }
    } catch (error) {
      this.warnings.push({
        warning: 'Could not check CORS configuration'
      });
      this.results.warnings++;
    }
  }

  async checkRateLimiting() {
    console.log('⏱️ Checking rate limiting...');
    
    // Check for rate limiting middleware
    for (const endpoint of this.endpoints) {
      const hasRateLimit = endpoint.middleware.some(mw => 
        mw.includes('rateLimit') || mw.includes('rate-limit')
      );
      
      if (!hasRateLimit && endpoint.path.includes('/api/')) {
        this.warnings.push({
          endpoint: `${endpoint.method} ${endpoint.path}`,
          file: endpoint.file,
          line: endpoint.line,
          warning: 'Consider adding rate limiting'
        });
        this.results.warnings++;
      }
    }
  }

  async getFilesRecursively(dir, extensions) {
    const files = [];
    try {
      const items = await fs.readdir(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = await fs.stat(fullPath);
        if (stat.isDirectory()) {
          files.push(...await this.getFilesRecursively(fullPath, extensions));
        } else if (extensions.some(ext => item.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Directory doesn't exist or can't be read
    }
    return files;
  }

  generateReport() {
    console.log('\n📊 API ENDPOINT VALIDATION REPORT');
    console.log('==================================');
    console.log(`Total Endpoints: ${this.results.total}`);
    console.log(`✅ Valid: ${this.results.valid}`);
    console.log(`❌ Invalid: ${this.results.invalid}`);
    console.log(`⚠️  Warnings: ${this.results.warnings}`);
    
    if (this.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.errors.forEach(error => {
        console.log(`  • ${error.endpoint} (${error.file}:${error.line})`);
        error.issues.forEach(issue => console.log(`    - ${issue}`));
      });
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.warnings.forEach(warning => {
        if (warning.endpoint) {
          console.log(`  • ${warning.endpoint} (${warning.file}:${warning.line})`);
          console.log(`    - ${warning.warning}`);
        } else {
          console.log(`  • ${warning.warning}`);
        }
      });
    }
    
    console.log('\n' + '='.repeat(50));
    
    if (this.results.invalid > 0) {
      console.log('❌ API VALIDATION FAILED - Fix errors before starting backend');
      return false;
    } else if (this.results.warnings > 0) {
      console.log('⚠️  API VALIDATION PASSED WITH WARNINGS - Backend can start');
      return true;
    } else {
      console.log('✅ API VALIDATION PASSED - All endpoints are valid');
      return true;
    }
  }
}

// Export for use in other scripts
module.exports = APIEndpointValidator;

// Run if called directly
if (require.main === module) {
  const validator = new APIEndpointValidator();
  validator.validateAllEndpoints()
    .then(results => {
      const success = validator.generateReport();
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 API validation crashed:', error);
      process.exit(1);
    });
}
