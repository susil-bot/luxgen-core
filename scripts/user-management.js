#!/usr/bin/env node

/**
 * User Management Script
 * Comprehensive user management for the luxgen tenant
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

// Command line argument parsing
const command = process.argv[2];
const args = process.argv.slice(3);

async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/luxgen';
  console.log('🔗 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');
}

async function disconnectDB() {
  await mongoose.disconnect();
  console.log('✅ Disconnected from MongoDB');
}

async function createUser(email, password, firstName, lastName, role = 'user') {
  try {
    await connectDB();

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('⚠️  User already exists with this email');
      console.log('📧 Email:', existingUser.email);
      console.log('🏢 Tenant:', existingUser.tenantId);
      console.log('👤 Role:', existingUser.role);
      return;
    }

    // Create user
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      tenantId: 'luxgen',
      role,
      status: 'active',
      isEmailVerified: true
    });

    await user.save();
    console.log('✅ User created successfully!');
    console.log('📧 Email:', user.email);
    console.log('👤 Name:', user.firstName, user.lastName);
    console.log('🏢 Tenant:', user.tenantId);
    console.log('👤 Role:', user.role);
    console.log('📅 Created:', user.createdAt);

  } catch (error) {
    console.error('❌ Error creating user:', error);
  } finally {
    await disconnectDB();
  }
}

async function listUsers() {
  try {
    await connectDB();

    const users = await User.find({ tenantId: 'luxgen' }).sort({ createdAt: -1 });
    
    console.log(`📊 Found ${users.length} users in luxgen tenant:`);
    console.log('');

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   👤 Role: ${user.role}`);
      console.log(`   📊 Status: ${user.status}`);
      console.log(`   📅 Created: ${user.createdAt.toISOString()}`);
      console.log(`   🔄 Last Login: ${user.lastLogin ? user.lastLogin.toISOString() : 'Never'}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error listing users:', error);
  } finally {
    await disconnectDB();
  }
}

async function verifyUser(email, password) {
  try {
    await connectDB();

    const user = await User.findOne({ email, tenantId: 'luxgen' });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('✅ User found!');
    console.log('📧 Email:', user.email);
    console.log('👤 Name:', user.firstName, user.lastName);
    console.log('🏢 Tenant:', user.tenantId);
    console.log('👤 Role:', user.role);
    console.log('📊 Status:', user.status);

    // Test password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (isPasswordValid) {
      console.log('✅ Password verification successful');
      
      // Update last login
      user.lastLogin = new Date();
      await user.save();
      console.log('✅ Last login updated');
    } else {
      console.log('❌ Password verification failed');
    }

  } catch (error) {
    console.error('❌ Error verifying user:', error);
  } finally {
    await disconnectDB();
  }
}

async function deleteUser(email) {
  try {
    await connectDB();

    const user = await User.findOneAndDelete({ email, tenantId: 'luxgen' });
    
    if (user) {
      console.log('✅ User deleted successfully!');
      console.log('📧 Email:', user.email);
      console.log('👤 Name:', user.firstName, user.lastName);
    } else {
      console.log('❌ User not found');
    }

  } catch (error) {
    console.error('❌ Error deleting user:', error);
  } finally {
    await disconnectDB();
  }
}

// Main execution
async function main() {
  switch (command) {
    case 'create':
      if (args.length < 4) {
        console.log('Usage: node user-management.js create <email> <password> <firstName> <lastName> [role]');
        process.exit(1);
      }
      await createUser(args[0], args[1], args[2], args[3], args[4] || 'user');
      break;

    case 'list':
      await listUsers();
      break;

    case 'verify':
      if (args.length < 2) {
        console.log('Usage: node user-management.js verify <email> <password>');
        process.exit(1);
      }
      await verifyUser(args[0], args[1]);
      break;

    case 'delete':
      if (args.length < 1) {
        console.log('Usage: node user-management.js delete <email>');
        process.exit(1);
      }
      await deleteUser(args[0]);
      break;

    default:
      console.log('LuxGen User Management Script');
      console.log('');
      console.log('Usage:');
      console.log('  node user-management.js create <email> <password> <firstName> <lastName> [role]');
      console.log('  node user-management.js list');
      console.log('  node user-management.js verify <email> <password>');
      console.log('  node user-management.js delete <email>');
      console.log('');
      console.log('Examples:');
      console.log('  node user-management.js create user@example.com password123 John Doe admin');
      console.log('  node user-management.js list');
      console.log('  node user-management.js verify user@example.com password123');
      console.log('  node user-management.js delete user@example.com');
      break;
  }
}

main();
