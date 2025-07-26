const mongoose = require('mongoose');
require('dotenv').config();

// Import all models
const User = require('../models/User');
const Tenant = require('../models/Tenant');
const TenantSchema = require('../models/TenantSchema');
const Poll = require('../models/Poll');

class DatabaseCleanup {
  constructor() {
    this.mongoUri = process.env.MONGODB_URL;
    this.dbName = 'luxgen_trainer_platform';
  }

  async connect() {
    try {
      console.log('🔌 Connecting to MongoDB...');
      await mongoose.connect(this.mongoUri, {
        dbName: this.dbName,
        maxPoolSize: 10,
        minPoolSize: 2,
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
        maxIdleTimeMS: 30000,
        retryWrites: true,
        w: 'majority',
        readPreference: 'primary',
        heartbeatFrequencyMS: 10000,
        family: 4
      });
      console.log('✅ Connected to MongoDB successfully');
    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error.message);
      throw error;
    }
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up database...');
    
    try {
      // Get current document counts
      const userCount = await User.countDocuments();
      const tenantCount = await Tenant.countDocuments();
      const pollCount = await Poll.countDocuments();
      const schemaCount = await TenantSchema.countDocuments();
      
      console.log('📊 Current document counts:');
      console.log(`   - Users: ${userCount}`);
      console.log(`   - Tenants: ${tenantCount}`);
      console.log(`   - Polls: ${pollCount}`);
      console.log(`   - Schemas: ${schemaCount}`);
      
      // Delete all documents
      await User.deleteMany({});
      await Tenant.deleteMany({});
      await Poll.deleteMany({});
      await TenantSchema.deleteMany({});
      
      console.log('✅ All documents deleted successfully');
      
      // Verify cleanup
      const newUserCount = await User.countDocuments();
      const newTenantCount = await Tenant.countDocuments();
      const newPollCount = await Poll.countDocuments();
      const newSchemaCount = await TenantSchema.countDocuments();
      
      console.log('\n📊 Document counts after cleanup:');
      console.log(`   - Users: ${newUserCount}`);
      console.log(`   - Tenants: ${newTenantCount}`);
      console.log(`   - Polls: ${newPollCount}`);
      console.log(`   - Schemas: ${newSchemaCount}`);
      
      console.log('🎉 Database cleanup completed successfully');
      
    } catch (error) {
      console.error('❌ Error during cleanup:', error.message);
      throw error;
    }
  }

  async run() {
    try {
      console.log('🚀 Starting database cleanup...\n');
      
      await this.connect();
      await this.cleanup();
      
      console.log('\n🎉 Database cleanup completed successfully!');
      
    } catch (error) {
      console.error('\n💥 Database cleanup failed:', error.message);
      process.exit(1);
    } finally {
      await mongoose.disconnect();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the cleanup if this file is executed directly
if (require.main === module) {
  const cleanup = new DatabaseCleanup();
  cleanup.run();
}

module.exports = DatabaseCleanup; 