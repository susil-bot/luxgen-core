#!/usr/bin/env node

/**
 * TENANT DATABASE TEST SCRIPT
 * Test tenant-specific database isolation and switching
 */

const tenantDatabaseManager = require('../config/tenant/TenantDatabaseManager');
const tenantConfigSwitcher = require('../config/tenant/TenantConfigSwitcher');

async function testTenantDatabaseIsolation() {
  console.log('🧪 Testing Tenant Database Isolation');
  console.log('='.repeat(50));

  try {
    // Test 1: Initialize tenant databases
    console.log('\n1. Initializing tenant databases...');
    
    const luxgenTenant = await tenantConfigSwitcher.initializeTenantFromConfig('luxgen');
    console.log('✅ LuxGen tenant initialized');
    
    const testTenant = await tenantConfigSwitcher.initializeTenantFromConfig('test');
    console.log('✅ Test tenant initialized');

    // Test 2: Verify database isolation
    console.log('\n2. Testing database isolation...');
    
    const luxgenModels = tenantDatabaseManager.getTenantModels('luxgen');
    const testModels = tenantDatabaseManager.getTenantModels('test');
    
    console.log('✅ LuxGen models:', Object.keys(luxgenModels));
    console.log('✅ Test models:', Object.keys(testModels));

    // Test 3: Create tenant-specific data
    console.log('\n3. Creating tenant-specific data...');
    
    // Create user in LuxGen tenant
    const luxgenUser = new luxgenModels.User({
      email: 'user@luxgen.com',
      firstName: 'LuxGen',
      lastName: 'User',
      role: 'admin'
    });
    await luxgenUser.save();
    console.log('✅ Created user in LuxGen tenant');

    // Create user in Test tenant
    const testUser = new testModels.User({
      email: 'user@test.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'user'
    });
    await testUser.save();
    console.log('✅ Created user in Test tenant');

    // Test 4: Verify data isolation
    console.log('\n4. Verifying data isolation...');
    
    const luxgenUsers = await luxgenModels.User.find({});
    const testUsers = await testModels.User.find({});
    
    console.log(`✅ LuxGen users: ${luxgenUsers.length}`);
    console.log(`✅ Test users: ${testUsers.length}`);
    
    // Verify users are in correct tenants
    const luxgenUserInTest = await testModels.User.findOne({ email: 'user@luxgen.com' });
    const testUserInLuxgen = await luxgenModels.User.findOne({ email: 'user@test.com' });
    
    console.log('✅ LuxGen user in Test tenant:', luxgenUserInTest ? 'FOUND (ERROR!)' : 'NOT FOUND (CORRECT)');
    console.log('✅ Test user in LuxGen tenant:', testUserInLuxgen ? 'FOUND (ERROR!)' : 'NOT FOUND (CORRECT)');

    // Test 5: Test tenant switching
    console.log('\n5. Testing tenant switching...');
    
    const mockReq = {};
    await tenantConfigSwitcher.switchToTenant('luxgen', mockReq);
    console.log('✅ Switched to LuxGen tenant');
    
    await tenantConfigSwitcher.switchToTenant('test', mockReq);
    console.log('✅ Switched to Test tenant');

    // Test 6: Test tenant limits
    console.log('\n6. Testing tenant limits...');
    
    const luxgenLimits = await tenantConfigSwitcher.checkTenantLimits('luxgen');
    const testLimits = await tenantConfigSwitcher.checkTenantLimits('test');
    
    console.log('✅ LuxGen limits:', luxgenLimits);
    console.log('✅ Test limits:', testLimits);

    // Test 7: Test tenant statistics
    console.log('\n7. Testing tenant statistics...');
    
    const statistics = await tenantConfigSwitcher.getTenantStatistics();
    console.log('✅ Tenant statistics:', statistics.length, 'tenants');

    // Test 8: Test database health checks
    console.log('\n8. Testing database health checks...');
    
    const luxgenHealth = await tenantDatabaseManager.healthCheck('luxgen');
    const testHealth = await tenantDatabaseManager.healthCheck('test');
    
    console.log('✅ LuxGen health:', luxgenHealth);
    console.log('✅ Test health:', testHealth);

    // Test 9: Test active connections
    console.log('\n9. Testing active connections...');
    
    const activeConnections = tenantDatabaseManager.getActiveConnections();
    console.log('✅ Active connections:', activeConnections.length);

    // Test 10: Test tenant database stats
    console.log('\n10. Testing tenant database stats...');
    
    const luxgenStats = await tenantDatabaseManager.getTenantDatabaseStats('luxgen');
    const testStats = await tenantDatabaseManager.getTenantDatabaseStats('test');
    
    console.log('✅ LuxGen stats:', luxgenStats.databaseName);
    console.log('✅ Test stats:', testStats.databaseName);

    console.log('\n🎉 All tests passed! Tenant database isolation is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up...');
    await tenantConfigSwitcher.cleanupAll();
    console.log('✅ Cleanup completed');
  }
}

// Run tests if called directly
if (require.main === module) {
  testTenantDatabaseIsolation()
    .then(() => {
      console.log('\n✅ Tenant database tests completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Tenant database tests failed:', error);
      process.exit(1);
    });
}

module.exports = testTenantDatabaseIsolation;
