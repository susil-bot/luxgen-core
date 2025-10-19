#!/usr/bin/env node

/**
 * Create User Script
 * Creates a user for the luxgen tenant with the provided credentials
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User Schema (matching the backend model)
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

async function createUser() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/luxgen';
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // User data
    const userData = {
      email: 'sobhanasusil064@gmail.com',
      firstName: 'Sobhana',
      lastName: 'Susil',
      tenantId: 'luxgen',
      role: 'admin', // Making this user an admin
      status: 'active',
      isEmailVerified: true
    };

    // Check if user already exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      console.log('⚠️  User already exists with this email');
      console.log('📧 Email:', existingUser.email);
      console.log('🏢 Tenant:', existingUser.tenantId);
      console.log('👤 Role:', existingUser.role);
      console.log('📅 Created:', existingUser.createdAt);
      
      // Update password if needed
      const password = 'opentheapp';
      const hashedPassword = await bcrypt.hash(password, 12);
      existingUser.password = hashedPassword;
      existingUser.updatedAt = new Date();
      await existingUser.save();
      console.log('✅ Password updated successfully');
      
      await mongoose.disconnect();
      return;
    }

    // Hash password
    const password = 'opentheapp';
    const hashedPassword = await bcrypt.hash(password, 12);
    userData.password = hashedPassword;

    // Create user
    const user = new User(userData);
    await user.save();

    console.log('✅ User created successfully!');
    console.log('📧 Email:', user.email);
    console.log('🏢 Tenant:', user.tenantId);
    console.log('👤 Role:', user.role);
    console.log('📅 Created:', user.createdAt);
    console.log('🔐 Password: opentheapp');

    // Disconnect
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error creating user:', error);
    process.exit(1);
  }
}

// Run the script
createUser();
