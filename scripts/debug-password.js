#!/usr/bin/env node

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Load environment configuration
require('dotenv').config();

// Import models
const User = require('../src/models/User');

async function debugPassword() {
  try {
    console.log('🔍 Debugging Super Admin Password...');
    console.log('='.repeat(50));

    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URL || 'mongodb://localhost:27017/luxgen_trainer_platform';
    console.log('🔌 Connecting to MongoDB...');
    
    await mongoose.connect(mongoUri, {
      dbName: 'luxgen_trainer_platform',
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false
    });

    console.log('✅ MongoDB connected successfully');

    // Find the super admin user
    const superAdmin = await User.findOne({ 
      email: 'susil@luxgen.com',
      role: 'super_admin'
    });

    if (!superAdmin) {
      console.log('❌ Super admin user not found');
      return;
    }

    console.log('👤 Found super admin user:');
    console.log(`   Email: ${superAdmin.email}`);
    console.log(`   Role: ${superAdmin.role}`);
    console.log(`   Password Hash: ${superAdmin.password}`);
    console.log(`   Password Hash Length: ${superAdmin.password.length}`);

    // Test password comparison
    const testPassword = 'Password@123';
    console.log(`\n🔍 Testing password: "${testPassword}"`);
    
    // Generate a new hash for comparison
    const saltRounds = 12;
    const newHash = await bcrypt.hash(testPassword, saltRounds);
    console.log(`   New Hash: ${newHash}`);
    console.log(`   New Hash Length: ${newHash.length}`);

    // Test comparison with stored hash
    const isMatch = await bcrypt.compare(testPassword, superAdmin.password);
    console.log(`   Password Match: ${isMatch}`);

    // Test comparison with new hash
    const isNewMatch = await bcrypt.compare(testPassword, newHash);
    console.log(`   New Hash Match: ${isNewMatch}`);

    if (!isMatch) {
      console.log('\n❌ Password hash mismatch detected!');
      console.log('🔧 Updating password hash...');
      
      // Update the password
      superAdmin.password = newHash;
      await superAdmin.save();
      
      console.log('✅ Password hash updated successfully!');
      
      // Test again
      const isMatchAfterUpdate = await bcrypt.compare(testPassword, superAdmin.password);
      console.log(`   Password Match After Update: ${isMatchAfterUpdate}`);
    } else {
      console.log('\n✅ Password hash is working correctly!');
    }

    console.log('\n📊 Summary:');
    console.log(`   Email: ${superAdmin.email}`);
    console.log(`   Password: ${testPassword}`);
    console.log(`   Login should work: ${isMatch || 'Updated'}`);

  } catch (error) {
    console.error('❌ Error debugging password:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the script
debugPassword(); 