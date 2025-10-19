#!/usr/bin/env node

/**
 * Verify User Script
 * Verifies the created user and tests login credentials
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  tenantId: { type: String, required: true, default: 'luxgen' },
  role: { type: String, default: 'user' },
  status: { type: String, default: 'active' },
  isEmailVerified: { type: Boolean, default: false },
  lastLogin: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function verifyUser() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/luxgen';
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the user
    const user = await User.findOne({ email: 'sobhanasusil064@gmail.com' });
    
    if (!user) {
      console.log('❌ User not found');
      await mongoose.disconnect();
      return;
    }

    console.log('✅ User found!');
    console.log('📧 Email:', user.email);
    console.log('👤 Name:', user.firstName, user.lastName);
    console.log('🏢 Tenant:', user.tenantId);
    console.log('👤 Role:', user.role);
    console.log('📊 Status:', user.status);
    console.log('📧 Email Verified:', user.isEmailVerified);
    console.log('📅 Created:', user.createdAt);
    console.log('🔄 Updated:', user.updatedAt);

    // Test password
    const testPassword = 'opentheapp';
    const isPasswordValid = await bcrypt.compare(testPassword, user.password);
    
    if (isPasswordValid) {
      console.log('✅ Password verification successful');
    } else {
      console.log('❌ Password verification failed');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();
    console.log('✅ Last login updated');

    // Disconnect
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error verifying user:', error);
    process.exit(1);
  }
}

// Run the script
verifyUser();
