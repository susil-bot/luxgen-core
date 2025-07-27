#!/usr/bin/env node

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Load environment configuration
require('dotenv').config();

// Import models
const User = require('../src/models/User');

async function debugPasswordDetailed() {
  try {
    console.log('🔍 Detailed Password Debug...');
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

    console.log(`\n🔍 Testing password: "${password}"`);
    console.log(`📏 Password length: ${password.length}`);
    console.log(`🔢 Password char codes: ${Array.from(password).map(c => c.charCodeAt(0)).join(', ')}`);
    console.log(`📝 Password bytes: ${Buffer.from(password, 'utf8').toString('hex')}`);

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log(`\n👤 User found: ${user.firstName} ${user.lastName} (${user.role})`);
    console.log(`🔐 Stored hash: ${user.password}`);

    // Test different password variations
    const passwordVariations = [
      password,
      password.trim(),
      password.toLowerCase(),
      password.toUpperCase(),
      'Password@123',
      'password@123',
      'PASSWORD@123',
      'Password@123 ',
      ' Password@123',
      'Password@123\n',
      'Password@123\r',
      'Password@123\t'
    ];

    console.log('\n🧪 Testing password variations...');
    
    for (let i = 0; i < passwordVariations.length; i++) {
      const testPassword = passwordVariations[i];
      const isMatch = await bcrypt.compare(testPassword, user.password);
      console.log(`${i + 1}. "${testPassword}" (${testPassword.length} chars) -> ${isMatch ? '✅ MATCH' : '❌ NO MATCH'}`);
    }

    // Generate a completely new hash
    console.log('\n🆕 Generating new hash...');
    const saltRounds = 12;
    const newHash = await bcrypt.hash(password, saltRounds);
    console.log(`New hash: ${newHash}`);

    // Test the new hash
    const isNewHashMatch = await bcrypt.compare(password, newHash);
    console.log(`New hash match: ${isNewHashMatch ? '✅ YES' : '❌ NO'}`);

    // Update user with new hash
    console.log('\n🔧 Updating user password...');
    user.password = newHash;
    await user.save();

    // Test again
    const isUpdatedMatch = await bcrypt.compare(password, user.password);
    console.log(`Updated password match: ${isUpdatedMatch ? '✅ YES' : '❌ NO'}`);

    // Test with the exact same hash
    console.log('\n🔍 Testing with exact same hash...');
    const isExactMatch = await bcrypt.compare(password, newHash);
    console.log(`Exact hash match: ${isExactMatch ? '✅ YES' : '❌ NO'}`);

    console.log('\n📊 Summary:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: "${password}"`);
    console.log(`   Final result: ${isUpdatedMatch ? '✅ WORKING' : '❌ STILL BROKEN'}`);

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
debugPasswordDetailed(); 