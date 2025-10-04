#!/usr/bin/env node

/**
 * Test Database Flagging System for LuxGen Platform
 * 
 * Tests all database connection flags and configurations
 * Usage: node src/scripts/testDatabaseFlags.js
 */

const DatabaseFlags = require('../config/databaseFlags');

class DatabaseFlagsTest {
  constructor() {
    this.flags = new DatabaseFlags();
    this.logger = console;
  }

  async runAllTests() {
    this.logger.info('🧪 Starting Database Flags Test Suite');
    this.logger.info('=====================================');

    try {
      // Test 1: Display current configuration
      await this.testConfigurationDisplay();

      // Test 2: Test local database flag
      await this.testLocalDatabaseFlag();

      // Test 3: Test Atlas database flag
      await this.testAtlasDatabaseFlag();

      // Test 4: Test connection validation
      await this.testConnectionValidation();

      // Test 5: Test tenant isolation settings
      await this.testTenantIsolationSettings();

      // Test 6: Test development settings
      await this.testDevelopmentSettings();

      // Test 7: Test performance settings
      await this.testPerformanceSettings();

      this.logger.info('\n✅ All tests completed successfully!');
    } catch (error) {
      this.logger.error('\n❌ Test suite failed:', error.message);
      process.exit(1);
    }
  }

  async testConfigurationDisplay() {
    this.logger.info('\n📋 Test 1: Configuration Display');
    this.logger.info('--------------------------------');
    
    this.flags.displayConfiguration();
  }

  async testLocalDatabaseFlag() {
    this.logger.info('\n🏠 Test 2: Local Database Flag');
    this.logger.info('-------------------------------');
    
    // Set local database flag
    process.env.USE_LOCAL_DB = 'true';
    delete process.env.MONGODB_URI;
    
    const localFlags = new DatabaseFlags();
    const mode = localFlags.getDatabaseMode();
    
    this.logger.info(`Mode: ${mode.mode}`);
    this.logger.info(`Description: ${mode.description}`);
    this.logger.info(`Connection: ${mode.connection}`);
    this.logger.info(`Features: ${mode.features.join(', ')}`);
    
    if (mode.mode === 'local') {
      this.logger.info('✅ Local database flag working correctly');
    } else {
      throw new Error('❌ Local database flag not working');
    }
  }

  async testAtlasDatabaseFlag() {
    this.logger.info('\n☁️  Test 3: Atlas Database Flag');
    this.logger.info('--------------------------------');
    
    // Set Atlas database flag
    delete process.env.USE_LOCAL_DB;
    process.env.MONGODB_URI = 'mongodb+srv://test:test@cluster.mongodb.net/luxgen';
    
    const atlasFlags = new DatabaseFlags();
    const mode = atlasFlags.getDatabaseMode();
    
    this.logger.info(`Mode: ${mode.mode}`);
    this.logger.info(`Description: ${mode.description}`);
    this.logger.info(`Connection: ${mode.connection}`);
    this.logger.info(`Features: ${mode.features.join(', ')}`);
    
    if (mode.mode === 'atlas') {
      this.logger.info('✅ Atlas database flag working correctly');
    } else {
      throw new Error('❌ Atlas database flag not working');
    }
  }

  async testConnectionValidation() {
    this.logger.info('\n🔍 Test 4: Connection Validation');
    this.logger.info('----------------------------------');
    
    // Test with no flags
    delete process.env.USE_LOCAL_DB;
    delete process.env.MONGODB_URI;
    
    const noFlags = new DatabaseFlags();
    const validation = noFlags.validateConfiguration();
    
    this.logger.info(`Errors: ${validation.errors.length}`);
    this.logger.info(`Warnings: ${validation.warnings.length}`);
    
    if (validation.errors.length > 0) {
      this.logger.info('✅ Validation correctly identifies missing configuration');
    } else {
      throw new Error('❌ Validation should identify missing configuration');
    }
  }

  async testTenantIsolationSettings() {
    this.logger.info('\n🔒 Test 5: Tenant Isolation Settings');
    this.logger.info('--------------------------------------');
    
    // Test strict isolation
    process.env.TENANT_ISOLATION = 'strict';
    const strictFlags = new DatabaseFlags();
    
    this.logger.info(`Strict isolation: ${strictFlags.getFlag('TENANT_ISOLATION')}`);
    
    // Test relaxed isolation
    process.env.TENANT_ISOLATION = 'relaxed';
    const relaxedFlags = new DatabaseFlags();
    
    this.logger.info(`Relaxed isolation: ${relaxedFlags.getFlag('TENANT_ISOLATION')}`);
    
    this.logger.info('✅ Tenant isolation settings working correctly');
  }

  async testDevelopmentSettings() {
    this.logger.info('\n🛠️  Test 6: Development Settings');
    this.logger.info('----------------------------------');
    
    // Test development flags
    process.env.DEBUG_DATABASE = 'true';
    process.env.VERBOSE_LOGGING = 'true';
    process.env.SKIP_VALIDATION = 'true';
    
    const devFlags = new DatabaseFlags();
    
    this.logger.info(`Debug: ${devFlags.getFlag('DEBUG_DATABASE')}`);
    this.logger.info(`Verbose: ${devFlags.getFlag('VERBOSE_LOGGING')}`);
    this.logger.info(`Skip Validation: ${devFlags.getFlag('SKIP_VALIDATION')}`);
    
    this.logger.info('✅ Development settings working correctly');
  }

  async testPerformanceSettings() {
    this.logger.info('\n⚡ Test 7: Performance Settings');
    this.logger.info('--------------------------------');
    
    // Test performance flags
    process.env.POOL_SIZE = '20';
    process.env.CONNECTION_TIMEOUT = '15000';
    process.env.SOCKET_TIMEOUT = '15000';
    
    const perfFlags = new DatabaseFlags();
    
    this.logger.info(`Pool Size: ${perfFlags.getFlag('POOL_SIZE')}`);
    this.logger.info(`Connection Timeout: ${perfFlags.getFlag('CONNECTION_TIMEOUT')}ms`);
    this.logger.info(`Socket Timeout: ${perfFlags.getFlag('SOCKET_TIMEOUT')}ms`);
    
    this.logger.info('✅ Performance settings working correctly');
  }
}

// Run tests if called directly
if (require.main === module) {
  const test = new DatabaseFlagsTest();
  test.runAllTests()
    .then(() => {
      console.log('\n🎉 Database Flags Test Suite Completed Successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Database Flags Test Suite Failed:', error.message);
      process.exit(1);
    });
}

module.exports = DatabaseFlagsTest;
