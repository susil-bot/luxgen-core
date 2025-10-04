/**
 * LUXGEN SIMPLE HEALTH CHECK
 * Essential health checks before backend startup
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const mongoose = require('mongoose');

const execAsync = promisify(exec);

class SimpleHealthChecker {
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

  async runEssentialChecks() {
    console.log('🏥 LUXGEN ESSENTIAL HEALTH CHECK');
    console.log('=================================');

    try {
      // 1. Environment Check
      await this.checkEnvironment();
      
      // 2. Dependencies Check
      await this.checkDependencies();
      
      // 3. Database Connectivity
      await this.checkDatabase();
      
      // 4. Basic File Structure
      await this.checkFileStructure();
      
      // 5. ESLint (non-blocking)
      await this.checkESLint();
      
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
      const requiredEnvVars = ['NODE_ENV'];
      const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
      
      check.status = 'passed';
      check.details = {
        nodeVersion,
        isNodeVersionValid,
        environment: process.env.NODE_ENV || 'development',
        port: process.env.PORT || 5000,
        missingEnvVars: missingEnvVars.length
      };
      
      if (!isNodeVersionValid) {
        check.status = 'failed';
        check.error = 'Node.js version should be 18.0.0 or higher';
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
      const criticalDeps = ['express', 'mongoose', 'cors', 'helmet'];
      const missingDeps = criticalDeps.filter(dep => !packageJson.dependencies[dep]);
      
      check.status = missingDeps.length === 0 ? 'passed' : 'failed';
      check.details = {
        totalDependencies: Object.keys(packageJson.dependencies || {}).length,
        missingDependencies: missingDeps,
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

  async checkDatabase() {
    console.log('🗄️ Checking database connectivity...');
    const check = { name: 'Database', status: 'running' };
    
    try {
      const useLocalDB = process.env.USE_LOCAL_DB === 'true';
      const uri = useLocalDB 
        ? 'mongodb://localhost:27017/luxgen'
        : process.env.MONGODB_URI || process.env.MONGODB_ATLAS_URI;
      
      if (!uri) {
        check.status = 'warning';
        check.warning = 'No MongoDB URI configured - using fallback mode';
        check.details = {
          connection: 'Fallback mode',
          message: 'Server will run without database'
        };
      } else {
        // Test connection with timeout
        await mongoose.connect(uri, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          serverSelectionTimeoutMS: 3000
        });
        
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        
        check.status = 'passed';
        check.details = {
          connection: useLocalDB ? 'Local MongoDB' : 'Atlas MongoDB',
          database: db.databaseName,
          collections: collections.length
        };
        
        await mongoose.disconnect();
      }
      
    } catch (error) {
      check.status = 'warning';
      check.warning = `Database connection failed: ${error.message}`;
      check.details = { 
        connection: process.env.USE_LOCAL_DB === 'true' ? 'Local' : 'Atlas',
        error: error.message,
        fallback: 'Server will run in fallback mode'
      };
    }
    
    this.addCheckResult('database', check);
  }

  async checkFileStructure() {
    console.log('📁 Checking file structure...');
    const check = { name: 'File Structure', status: 'running' };
    
    try {
      const requiredFiles = [
        'src/index.js',
        'src/routes/index.js',
        'package.json'
      ];
      
      const missingFiles = [];
      const existingFiles = [];
      
      for (const file of requiredFiles) {
        const filePath = path.join(process.cwd(), file);
        try {
          await fs.access(filePath);
          existingFiles.push(file);
        } catch {
          missingFiles.push(file);
        }
      }
      
      check.status = missingFiles.length === 0 ? 'passed' : 'failed';
      check.details = {
        requiredFiles: requiredFiles.length,
        existingFiles: existingFiles.length,
        missingFiles: missingFiles.length,
        missing: missingFiles
      };
      
      if (missingFiles.length > 0) {
        check.error = `Missing required files: ${missingFiles.join(', ')}`;
      }
      
    } catch (error) {
      check.status = 'failed';
      check.error = error.message;
    }
    
    this.addCheckResult('fileStructure', check);
  }

  async checkESLint() {
    console.log('🔍 Running ESLint check...');
    const check = { name: 'ESLint', status: 'running' };
    
    try {
      const { stdout, stderr } = await execAsync('npm run lint 2>&1');
      
      if (stderr && stderr.includes('error')) {
        check.status = 'warning';
        check.warning = 'ESLint found errors';
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
        check.status = 'warning';
        check.warning = 'ESLint check could not be completed';
        check.details = { error: error.message };
      }
    }
    
    this.addCheckResult('eslint', check);
  }

  // Helper methods
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
module.exports = SimpleHealthChecker;

// Run if called directly
if (require.main === module) {
  const healthChecker = new SimpleHealthChecker();
  healthChecker.runEssentialChecks()
    .then(results => {
      console.log('\n🏥 Health check completed');
      process.exit(results.overall === 'failed' ? 1 : 0);
    })
    .catch(error => {
      console.error('💥 Health check crashed:', error);
      process.exit(1);
    });
}
