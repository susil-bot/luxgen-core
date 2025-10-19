/**
 * Test MongoDB Atlas Connection
 * Tests Atlas connection with proper error handling
 */

const AtlasConfig = require('../config/atlas');
const mongoose = require('mongoose');

async function testAtlasConnection() {
  console.log('🧪 Testing MongoDB Atlas Connection...\n');
  
  const atlasConfig = new AtlasConfig();
  atlasConfig.logConfiguration();
  
  if (!atlasConfig.isEnabled()) {
    console.log('❌ Atlas not configured or disabled');
    console.log(`   Reason: ${atlasConfig.getReason()}`);
    return;
  }
  
  try {
    console.log('🌐 Testing Atlas connection...');
    const result = await atlasConfig.testConnection();
    
    if (result.success) {
      console.log('✅ Atlas connection test successful');
      console.log(`   Message: ${result.message}`);
    } else {
      console.log('❌ Atlas connection test failed');
      console.log(`   Error: ${result.error}`);
      console.log(`   Code: ${result.code}`);
      console.log(`   Name: ${result.name}`);
    }
    
  } catch (error) {
    console.error('❌ Atlas connection test error:', error.message);
  }
}

async function testLocalConnection() {
  console.log('\n🏠 Testing Local MongoDB Connection...\n');
  
  try {
    const localUri = 'mongodb://localhost:27017/luxgen';
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      socketTimeoutMS: 45000
    };
    
    await mongoose.connect(localUri, options);
    console.log('✅ Local MongoDB connection successful');
    
    // Test database operations
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log(`   Collections found: ${collections.length}`);
    
    await mongoose.disconnect();
    console.log('✅ Local MongoDB disconnected');
    
  } catch (error) {
    console.error('❌ Local MongoDB connection failed:', error.message);
  }
}

async function main() {
  try {
    await testAtlasConnection();
    await testLocalConnection();
    
    console.log('\n🎯 Connection tests completed');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { testAtlasConnection, testLocalConnection };
