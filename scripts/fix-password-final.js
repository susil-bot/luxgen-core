#!/usr/bin/env node

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Load environment configuration
require('dotenv').config();

// Import models
const User = require('../src/models/User');

async function fixPasswordFinal() {
  try {
    console.log('🔧 Final Password Fix...');
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

    console.log(`\n🔍 Fixing password for: ${email}`);
    console.log(`🔑 Password: ${password}`);

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log(`👤 User found: ${user.firstName} ${user.lastName} (${user.role})`);
    console.log(`🔐 Current hash: ${user.password}`);

    // Generate new hash
    const saltRounds = 12;
    const newHash = await bcrypt.hash(password, saltRounds);
    console.log(`🆕 New hash: ${newHash}`);

    // Test the new hash
    const isNewHashValid = await bcrypt.compare(password, newHash);
    console.log(`✅ New hash test: ${isNewHashValid}`);

    // Update password by bypassing pre-save middleware
    console.log('\n🔧 Updating password (bypassing pre-save middleware)...');
    
    // Use updateOne to bypass pre-save middleware
    const result = await User.updateOne(
      { _id: user._id },
      { 
        $set: { 
          password: newHash,
          updatedAt: new Date()
        }
      }
    );

    console.log(`✅ Update result: ${result.modifiedCount} document(s) modified`);

    // Fetch the user again to get the updated password
    const updatedUser = await User.findById(user._id);
    console.log(`🔐 Updated hash: ${updatedUser.password}`);

    // Test the updated password
    const isUpdatedValid = await bcrypt.compare(password, updatedUser.password);
    console.log(`✅ Updated password test: ${isUpdatedValid}`);

    // Test using the instance method
    const isInstanceMethodValid = await updatedUser.comparePassword(password);
    console.log(`✅ Instance method test: ${isInstanceMethodValid}`);

    console.log('\n📊 Final Results:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Login should work: ${isUpdatedValid ? '✅ YES' : '❌ NO'}`);
    console.log(`   Instance method works: ${isInstanceMethodValid ? '✅ YES' : '❌ NO'}`);

    if (isUpdatedValid) {
      console.log('\n🎉 Password fixed successfully!');
      console.log('🔐 You can now login with:');
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${password}`);
    } else {
      console.log('\n❌ Password fix failed!');
    }

  } catch (error) {
    console.error('❌ Error fixing password:', error.message);
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
fixPasswordFinal(); 