#!/usr/bin/env node

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Load environment configuration
require('dotenv').config();

// Import models
const User = require('../src/models/User');

async function updateSuperAdminPassword() {
  try {
    console.log('🔧 Updating Super Admin Password...');
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
      console.log('Please run: npm run create:super-admin');
      return;
    }

    console.log('👤 Found super admin user:');
    console.log(`   Email: ${superAdmin.email}`);
    console.log(`   Role: ${superAdmin.role}`);
    console.log(`   Created: ${superAdmin.createdAt}`);

    // Hash the new password
    const saltRounds = 12;
    const newPassword = 'Password@123';
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update the password
    superAdmin.password = hashedPassword;
    await superAdmin.save();

    console.log('✅ Super Admin Password Updated Successfully!');
    console.log('='.repeat(50));
    console.log('📧 Email: susil@luxgen.com');
    console.log('🔑 New Password: Password@123');
    console.log('👤 Role: super_admin');
    console.log('📅 Updated: ' + new Date().toISOString());
    console.log('='.repeat(50));
    console.log('🔐 You can now login with these credentials');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Error updating super admin password:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the script
updateSuperAdminPassword(); 