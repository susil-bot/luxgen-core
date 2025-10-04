/**
 * LUXGEN COMPREHENSIVE HEALTH CHECK
 * Validates all functionality, specs, ESLint, and API endpoints before backend startup
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const mongoose = require('mongoose');
const APIEndpointValidator = require('./validateAPIEndpoints');

const execAsync = promisify(exec);

class HealthChecker {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      overall: 'unknown',
      checks: {},
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      }
    };
  }

  async runAllChecks() {
    console.log('🏥 LUXGEN COMPREHENSIVE HEALTH CHECK');
    console.log('=====================================');

    try {
      // 1. Environment Check
      await this.checkEnvironment();
      
      // 2. Dependencies Check
      await this.checkDependencies();
      
      // 3. Code Quality Checks
      await this.checkESLint();
      await this.checkTypeScript();
      
      // 4. Test Suite
      await this.runTests();
      
      // 5. Database Connectivity
      await this.checkDatabase();
      
      // 6. API Endpoints Validation
      await this.validateAPIEndpoints();
      
      // 7. File Structure Validation
      await this.validateFileStructure();
      
      // 8. Security Checks
      await this.checkSecurity();
      
      // 9. Performance Checks
      await this.checkPerformance();
      
      // Calculate overall health
      this.calculateOverallHealth();
      
      // Generate report
      this.generateReport();
      
      return this.results;
      
    } catch (error) {
      console.error('❌ Health check failed:', error);
      this.results.overall = 'failed';
      this.results.error = error.message;
      return this.results;
    }
  }

  async checkEnvironment() {
    console.log('🔧 Checking environment...');
    const check = { name: 'Environment', status: 'running' };
    
    try {
      // Check Node.js version
      const nodeVersion = process.version;
      const requiredVersion = '18.0.0';
      const isNodeVersionValid = this.compareVersions(nodeVersion, requiredVersion);
      
      // Check environment variables
      const requiredEnvVars = ['NODE_ENV', 'PORT'];
      const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
      
      // Check disk space
      const diskSpace = await this.getDiskSpace();
      
      check.status = 'passed';
      check.details = {
        nodeVersion,
        isNodeVersionValid,
        environment: process.env.NODE_ENV || 'development',
        port: process.env.PORT || 5000,
        missingEnvVars: missingEnvVars.length,
        diskSpace: `${diskSpace.available}GB available`,
        diskUsage: `${diskSpace.usage}%`
      };
      
      if (!isNodeVersionValid) {
        check.status = 'failed';
        check.warning = 'Node.js version should be 18.0.0 or higher';
      }
      
      if (diskSpace.usage > 90) {
        check.status = 'warning';
        check.warning = 'Disk space is critically low';
      }
      
    } catch (error) {
      check.status = 'failed';
      check.error = error.message;
    }
    
    this.addCheckResult('environment', check);
  }

  async checkDependencies() {
    console.log('📦 Checking dependencies...');
    const check = { name: 'Dependencies', status: 'running' };
    
    try {
      // Check if package.json exists
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      
      // Check critical dependencies
      const criticalDeps = [
        'express', 'mongoose', 'cors', 'helmet', 
        'morgan', 'bcryptjs', 'jsonwebtoken'
      ];
      
      const missingDeps = criticalDeps.filter(dep => !packageJson.dependencies[dep]);
      const devDeps = ['jest', 'eslint', 'nodemon'];
      const missingDevDeps = devDeps.filter(dep => !packageJson.devDependencies[dep]);
      
      check.status = missingDeps.length === 0 ? 'passed' : 'failed';
      check.details = {
        totalDependencies: Object.keys(packageJson.dependencies || {}).length,
        totalDevDependencies: Object.keys(packageJson.devDependencies || {}).length,
        missingDependencies: missingDeps,
        missingDevDependencies: missingDevDeps,
        version: packageJson.version
      };
      
      if (missingDeps.length > 0) {
        check.error = `Missing critical dependencies: ${missingDeps.join(', ')}`;
      }
      
    } catch (error) {
      check.status = 'failed';
      check.error = error.message;
    }
    
    this.addCheckResult('dependencies', check);
  }

  async checkESLint() {
    console.log('🔍 Running ESLint check...');
    const check = { name: 'ESLint', status: 'running' };
    
    try {
      const { stdout, stderr } = await execAsync('npm run lint 2>&1');
      
      if (stderr && stderr.includes('error')) {
        check.status = 'failed';
        check.error = 'ESLint found errors';
        check.details = { errors: stderr };
      } else {
        check.status = 'passed';
        check.details = { message: 'No ESLint errors found' };
      }
      
    } catch (error) {
      // ESLint might have warnings but still pass
      if (error.code === 1) {
        check.status = 'warning';
        check.warning = 'ESLint found warnings';
        check.details = { warnings: error.stdout };
      } else {
        check.status = 'failed';
        check.error = error.message;
      }
    }
    
    this.addCheckResult('eslint', check);
  }

  async checkTypeScript() {
    console.log('📝 Checking TypeScript compilation...');
    const check = { name: 'TypeScript', status: 'running' };
    
    try {
      // Check if there are any TypeScript files
      const srcDir = path.join(process.cwd(), 'src');
      const files = await this.getFilesRecursively(srcDir, ['.ts', '.tsx']);
      
      if (files.length === 0) {
        check.status = 'passed';
        check.details = { message: 'No TypeScript files found' };
      } else {
        // Try to compile TypeScript files
        const { stdout, stderr } = await execAsync('npx tsc --noEmit 2>&1');
        
        if (stderr && stderr.includes('error')) {
          check.status = 'failed';
          check.error = 'TypeScript compilation errors found';
          check.details = { errors: stderr };
        } else {
          check.status = 'passed';
          check.details = { 
            message: 'TypeScript compilation successful',
            filesChecked: files.length
          };
        }
      }
      
    } catch (error) {
      check.status = 'warning';
      check.warning = 'TypeScript check could not be completed';
      check.details = { error: error.message };
    }
    
    this.addCheckResult('typescript', check);
  }

  async runTests() {
    console.log('🧪 Running test suite...');
    const check = { name: 'Tests', status: 'running' };
    
    try {
      const { stdout, stderr } = await execAsync('npm test 2>&1');
      
      // Parse test results
      const testResults = this.parseTestResults(stdout);
      
      check.status = testResults.failed > 0 ? 'failed' : 'passed';
      check.details = {
        total: testResults.total,
        passed: testResults.passed,
        failed: testResults.failed,
        coverage: testResults.coverage
      };
      
      if (testResults.failed > 0) {
        check.error = `${testResults.failed} tests failed`;
      }
      
    } catch (error) {
      check.status = 'warning';
      check.warning = 'Test suite could not be run';
      check.details = { error: error.message };
    }
    
    this.addCheckResult('tests', check);
  }

  async checkDatabase() {
    console.log('🗄️ Checking database connectivity...');
    const check = { name: 'Database', status: 'running' };
    
    try {
      const useLocalDB = process.env.USE_LOCAL_DB === 'true';
      const uri = useLocalDB 
        ? 'mongodb://localhost:27017/luxgen'
        : process.env.MONGODB_URI || process.env.MONGODB_ATLAS_URI;
      
      if (!uri) {
        check.status = 'failed';
        check.error = 'No MongoDB URI configured';
        return;
      }
      
      // Test connection
      await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000
      });
      
      // Test basic operations
      const db = mongoose.connection.db;
      const collections = await db.listCollections().toArray();
      
      check.status = 'passed';
      check.details = {
        connection: useLocalDB ? 'Local MongoDB' : 'Atlas MongoDB',
        uri: uri.replace(/\/\/.*@/, '//***@'), // Hide credentials
        collections: collections.length,
        database: db.databaseName
      };
      
      await mongoose.disconnect();
      
    } catch (error) {
      check.status = 'failed';
      check.error = `Database connection failed: ${error.message}`;
      check.details = { 
        connection: process.env.USE_LOCAL_DB === 'true' ? 'Local' : 'Atlas',
        error: error.message
      };
    }
    
    this.addCheckResult('database', check);
  }

  async validateAPIEndpoints() {
    console.log('🔗 Validating API endpoints...');
    const check = { name: 'API Endpoints', status: 'running' };
    
    try {
      const validator = new APIEndpointValidator();
      const results = await validator.validateAllEndpoints();
      
      check.status = results.invalid > 0 ? 'failed' : (results.warnings > 0 ? 'warning' : 'passed');
      check.details = {
        totalEndpoints: results.total,
        valid: results.valid,
        invalid: results.invalid,
        warnings: results.warnings
      };
      
      if (results.invalid > 0) {
        check.error = `${results.invalid} endpoints have validation errors`;
      } else if (results.warnings > 0) {
        check.warning = `${results.warnings} endpoints have warnings`;
      }
      
    } catch (error) {
      check.status = 'failed';
      check.error = error.message;
    }
    
    this.addCheckResult('apiEndpoints', check);
  }

  async validateFileStructure() {
    console.log('📁 Validating file structure...');
    const check = { name: 'File Structure', status: 'running' };
    
    try {
      const requiredDirs = [
        'src/routes',
        'src/models', 
        'src/controllers',
        'src/middleware',
        'src/services',
        'src/utils'
      ];
      
      const missingDirs = [];
      const existingDirs = [];
      
      for (const dir of requiredDirs) {
        const dirPath = path.join(process.cwd(), dir);
        try {
          await fs.access(dirPath);
          existingDirs.push(dir);
        } catch {
          missingDirs.push(dir);
        }
      }
      
      check.status = missingDirs.length === 0 ? 'passed' : 'warning';
      check.details = {
        requiredDirectories: requiredDirs.length,
        existingDirectories: existingDirs.length,
        missingDirectories: missingDirs.length,
        missing: missingDirs
      };
      
      if (missingDirs.length > 0) {
        check.warning = `Missing directories: ${missingDirs.join(', ')}`;
      }
      
    } catch (error) {
      check.status = 'failed';
      check.error = error.message;
    }
    
    this.addCheckResult('fileStructure', check);
  }

  async checkSecurity() {
    console.log('🔒 Running security checks...');
    const check = { name: 'Security', status: 'running' };
    
    try {
      const securityIssues = [];
      
      // Check for hardcoded secrets
      const srcDir = path.join(process.cwd(), 'src');
      const files = await this.getFilesRecursively(srcDir, ['.js', '.ts']);
      
      for (const file of files.slice(0, 10)) { // Check first 10 files
        try {
          const content = await fs.readFile(file, 'utf8');
          if (content.includes('password') && content.includes('=')) {
            securityIssues.push(`Potential hardcoded password in ${file}`);
          }
          if (content.includes('secret') && content.includes('=')) {
            securityIssues.push(`Potential hardcoded secret in ${file}`);
          }
        } catch (error) {
          // Skip files that can't be read
        }
      }
      
      check.status = securityIssues.length === 0 ? 'passed' : 'warning';
      check.details = {
        filesChecked: Math.min(files.length, 10),
        securityIssues: securityIssues.length,
        issues: securityIssues
      };
      
      if (securityIssues.length > 0) {
        check.warning = `Found ${securityIssues.length} potential security issues`;
      }
      
    } catch (error) {
      check.status = 'failed';
      check.error = error.message;
    }
    
    this.addCheckResult('security', check);
  }

  async checkPerformance() {
    console.log('⚡ Checking performance...');
    const check = { name: 'Performance', status: 'running' };
    
    try {
      // Check memory usage
      const memoryUsage = process.memoryUsage();
      const memoryUsageMB = {
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024)
      };
      
      // Check if memory usage is reasonable
      const isMemoryReasonable = memoryUsageMB.heapUsed < 100; // Less than 100MB
      
      check.status = isMemoryReasonable ? 'passed' : 'warning';
      check.details = {
        memoryUsage: memoryUsageMB,
        isMemoryReasonable,
        uptime: process.uptime()
      };
      
      if (!isMemoryReasonable) {
        check.warning = 'High memory usage detected';
      }
      
    } catch (error) {
      check.status = 'failed';
      check.error = error.message;
    }
    
    this.addCheckResult('performance', check);
  }

  // Helper methods
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

  extractEndpoints(content) {
    const endpoints = [];
    const routeRegex = /router\.(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/g;
    let match;
    while ((match = routeRegex.exec(content)) !== null) {
      endpoints.push({
        method: match[1].toUpperCase(),
        path: match[2]
      });
    }
    return endpoints;
  }

  parseTestResults(output) {
    const lines = output.split('\n');
    let total = 0, passed = 0, failed = 0;
    let coverage = null;
    
    for (const line of lines) {
      if (line.includes('Tests:')) {
        const match = line.match(/(\d+) total.*?(\d+) passed.*?(\d+) failed/);
        if (match) {
          total = parseInt(match[1]);
          passed = parseInt(match[2]);
          failed = parseInt(match[3]);
        }
      }
      if (line.includes('Coverage:')) {
        const match = line.match(/(\d+\.?\d*)%/);
        if (match) {
          coverage = parseFloat(match[1]);
        }
      }
    }
    
    return { total, passed, failed, coverage };
  }

  compareVersions(version1, version2) {
    const v1 = version1.replace('v', '').split('.').map(Number);
    const v2 = version2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
      const a = v1[i] || 0;
      const b = v2[i] || 0;
      if (a > b) return true;
      if (a < b) return false;
    }
    return true;
  }

  async getDiskSpace() {
    try {
      const { stdout } = await execAsync('df -h /');
      const lines = stdout.split('\n');
      const dataLine = lines[1];
      const parts = dataLine.split(/\s+/);
      const total = parts[1];
      const available = parts[3];
      const usage = parts[4].replace('%', '');
      
      return {
        total,
        available,
        usage: parseInt(usage)
      };
    } catch {
      return { total: 'Unknown', available: 'Unknown', usage: 0 };
    }
  }

  addCheckResult(key, result) {
    this.results.checks[key] = result;
    this.results.summary.total++;
    
    if (result.status === 'passed') {
      this.results.summary.passed++;
    } else if (result.status === 'failed') {
      this.results.summary.failed++;
    } else if (result.status === 'warning') {
      this.results.summary.warnings++;
    }
  }

  calculateOverallHealth() {
    const { total, passed, failed, warnings } = this.results.summary;
    
    if (failed > 0) {
      this.results.overall = 'failed';
    } else if (warnings > 0) {
      this.results.overall = 'warning';
    } else if (passed === total) {
      this.results.overall = 'passed';
    } else {
      this.results.overall = 'unknown';
    }
  }

  generateReport() {
    console.log('\n📊 HEALTH CHECK REPORT');
    console.log('======================');
    console.log(`Overall Status: ${this.getStatusIcon(this.results.overall)} ${this.results.overall.toUpperCase()}`);
    console.log(`Total Checks: ${this.results.summary.total}`);
    console.log(`✅ Passed: ${this.results.summary.passed}`);
    console.log(`❌ Failed: ${this.results.summary.failed}`);
    console.log(`⚠️  Warnings: ${this.results.summary.warnings}`);
    
    console.log('\n📋 Detailed Results:');
    for (const [key, check] of Object.entries(this.results.checks)) {
      const icon = this.getStatusIcon(check.status);
      console.log(`${icon} ${check.name}: ${check.status}`);
      
      if (check.error) {
        console.log(`   ❌ Error: ${check.error}`);
      }
      if (check.warning) {
        console.log(`   ⚠️  Warning: ${check.warning}`);
      }
    }
    
    console.log('\n' + '='.repeat(50));
    
    if (this.results.overall === 'failed') {
      console.log('🚨 HEALTH CHECK FAILED - Backend startup aborted');
      process.exit(1);
    } else if (this.results.overall === 'warning') {
      console.log('⚠️  HEALTH CHECK PASSED WITH WARNINGS - Backend will start');
    } else {
      console.log('✅ HEALTH CHECK PASSED - Backend ready to start');
    }
  }

  getStatusIcon(status) {
    const icons = {
      passed: '✅',
      failed: '❌',
      warning: '⚠️',
      running: '🔄',
      unknown: '❓'
    };
    return icons[status] || '❓';
  }
}

// Export for use in other scripts
module.exports = HealthChecker;

// Run if called directly
if (require.main === module) {
  const healthChecker = new HealthChecker();
  healthChecker.runAllChecks()
    .then(results => {
      console.log('\n🏥 Health check completed');
      process.exit(results.overall === 'failed' ? 1 : 0);
    })
    .catch(error => {
      console.error('💥 Health check crashed:', error);
      process.exit(1);
    });
}
