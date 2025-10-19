#!/usr/bin/env node

/**
 * MongoDB Connection Test
 * Tests MongoDB Atlas connection and basic operations
 */

const mongoose = require('mongoose');

// MongoDB Atlas connection string (free tier)
const MONGODB_URI = 'mongodb+srv://demo:demo123@cluster0.mongodb.net/luxgen-test?retryWrites=true&w=majority';

// Simple User schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function testMongoDBConnection() {
  console.log('🗄️  Testing MongoDB Connection...');
  
  try {
    // Connect to MongoDB Atlas
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');
    
    // Test basic operations
    console.log('📝 Testing Database Operations...');
    
    // Create a test user
    const testUser = new User({
      email: 'test@luxgen.com',
      password: 'hashedpassword123',
      firstName: 'Test',
      lastName: 'User'
    });
    
    await testUser.save();
    console.log('✅ User created successfully');
    
    // Find the user
    const foundUser = await User.findOne({ email: 'test@luxgen.com' });
    if (foundUser) {
      console.log('✅ User found successfully');
      console.log(`   Name: ${foundUser.firstName} ${foundUser.lastName}`);
      console.log(`   Email: ${foundUser.email}`);
    }
    
    // Update the user
    foundUser.firstName = 'Updated';
    await foundUser.save();
    console.log('✅ User updated successfully');
    
    // Delete the user
    await User.deleteOne({ email: 'test@luxgen.com' });
    console.log('✅ User deleted successfully');
    
    // Test connection status
    const connectionState = mongoose.connection.readyState;
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    console.log(`📊 Connection State: ${states[connectionState]}`);
    
    return true;
    
  } catch (error) {
    console.log(`❌ MongoDB Connection Failed: ${error.message}`);
    return false;
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

async function testMongoDBPerformance() {
  console.log('⚡ Testing MongoDB Performance...');
  
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    const startTime = Date.now();
    
    // Create multiple users
    const users = [];
    for (let i = 0; i < 10; i++) {
      users.push({
        email: `user${i}@luxgen.com`,
        password: 'hashedpassword123',
        firstName: `User${i}`,
        lastName: 'Test'
      });
    }
    
    await User.insertMany(users);
    const insertTime = Date.now() - startTime;
    console.log(`✅ Inserted 10 users in ${insertTime}ms`);
    
    // Query performance
    const queryStart = Date.now();
    const allUsers = await User.find({});
    const queryTime = Date.now() - queryStart;
    console.log(`✅ Queried ${allUsers.length} users in ${queryTime}ms`);
    
    // Clean up
    await User.deleteMany({ email: { $regex: /^user\d@luxgen\.com$/ } });
    console.log('✅ Cleaned up test data');
    
    return true;
    
  } catch (error) {
    console.log(`❌ Performance Test Failed: ${error.message}`);
    return false;
  } finally {
    await mongoose.connection.close();
  }
}

// Main test runner
async function runMongoDBTests() {
  console.log('🧪 MongoDB Connection Test Suite');
  console.log('==================================\n');

  const tests = [
    { name: 'MongoDB Connection', fn: testMongoDBConnection },
    { name: 'MongoDB Performance', fn: testMongoDBPerformance }
  ];

  let passed = 0;
  let total = tests.length;

  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) passed++;
    } catch (error) {
      console.log(`❌ ${test.name} failed: ${error.message}`);
    }
    console.log('');
  }

  console.log('📊 MongoDB Test Results');
  console.log('========================');
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('\n🎉 All MongoDB tests passed! Database is working correctly.');
  } else {
    console.log('\n⚠️  Some MongoDB tests failed. Check the output above for details.');
  }
}

// Run tests
runMongoDBTests().catch(console.error);
