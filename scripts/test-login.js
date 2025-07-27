#!/usr/bin/env node

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Load environment configuration
require('dotenv').config();

// Import models
const User = require('../src/models/User');

async function testLogin() {
  try {
    console.log('🧪 Testing Login Process...');
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

    // Test credentials
    const email = 'susil@luxgen.com';
    const password = 'Password@123';

    console.log(`\n🔍 Testing login for: ${email}`);
    console.log(`🔑 Password: ${password}`);

    // Step 1: Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log(`✅ User found: ${user.firstName} ${user.lastName} (${user.role})`);
    console.log(`🔐 Stored password hash: ${user.password}`);
    console.log(`📏 Hash length: ${user.password.length}`);

    // Step 2: Test password comparison
    console.log('\n🔍 Testing password comparison...');
    
    // Test with bcrypt.compare
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log(`✅ bcrypt.compare result: ${isPasswordValid}`);

    // Test with different password
    const wrongPassword = 'WrongPassword123';
    const isWrongPasswordValid = await bcrypt.compare(wrongPassword, user.password);
    console.log(`❌ Wrong password test: ${isWrongPasswordValid}`);

    // Step 3: Generate new hash and test
    console.log('\n🔍 Testing with new hash...');
    const saltRounds = 12;
    const newHash = await bcrypt.hash(password, saltRounds);
    console.log(`🆕 New hash: ${newHash}`);
    
    const isNewHashValid = await bcrypt.compare(password, newHash);
    console.log(`✅ New hash test: ${isNewHashValid}`);

    // Step 4: Update user password and test again
    if (!isPasswordValid) {
      console.log('\n🔧 Updating password hash...');
      user.password = newHash;
      await user.save();
      
      console.log('✅ Password updated');
      
      // Test again
      const isUpdatedPasswordValid = await bcrypt.compare(password, user.password);
      console.log(`✅ Updated password test: ${isUpdatedPasswordValid}`);
    }

    console.log('\n📊 Final Results:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Login should work: ${isPasswordValid || 'Updated'}`);
    console.log(`   User role: ${user.role}`);
    console.log(`   User active: ${user.isActive}`);

  } catch (error) {
    console.error('❌ Error testing login:', error.message);
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
testLogin(); 