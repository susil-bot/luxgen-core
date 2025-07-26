const mongoose = require('mongoose');
require('dotenv').config();

async function testMongoDBConnection() {
  console.log('🔌 Testing MongoDB Connection...');
  
  try {
    // Get MongoDB URL from environment
    const mongoUri = process.env.MONGODB_URL || 'mongodb://trainer_admin:mongo_password_2024@localhost:27017/trainer_platform?authSource=admin';
    console.log('MongoDB URI:', mongoUri.replace(/\/\/.*@/, '//***:***@')); // Hide credentials
    
    // Connect to MongoDB
    const connection = await mongoose.connect(mongoUri, {
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
    
    console.log('✅ MongoDB connected successfully');
    
    // Get database info
    const db = mongoose.connection.db;
    const adminDb = db.admin();
    
    // Test ping
    await adminDb.ping();
    console.log('✅ Database ping successful');
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('\n📋 Existing Collections:');
    if (collections.length === 0) {
      console.log('   No collections found');
    } else {
      collections.forEach(collection => {
        console.log(`   - ${collection.name}`);
      });
    }
    
    // Test creating a simple document
    console.log('\n🧪 Testing document creation...');
    
    // Create a test collection
    const testCollection = db.collection('test_connection');
    
    // Insert a test document
    const testDoc = {
      test: true,
      timestamp: new Date(),
      message: 'MongoDB connection test successful'
    };
    
    const insertResult = await testCollection.insertOne(testDoc);
    console.log('✅ Test document created with ID:', insertResult.insertedId);
    
    // Retrieve the document
    const retrievedDoc = await testCollection.findOne({ _id: insertResult.insertedId });
    console.log('✅ Test document retrieved:', retrievedDoc);
    
    // Clean up - remove test document
    await testCollection.deleteOne({ _id: insertResult.insertedId });
    console.log('✅ Test document cleaned up');
    
    // Test Mongoose models
    console.log('\n🔧 Testing Mongoose Models...');
    
    // Import models
    const User = require('./src/models/User');
    const Tenant = require('./src/models/Tenant');
    const Poll = require('./src/models/Poll');
    
    console.log('✅ Models imported successfully');
    
    // Check if collections exist for models
    const userCollection = await db.listCollections({ name: 'users' }).toArray();
    const tenantCollection = await db.listCollections({ name: 'tenants' }).toArray();
    const pollCollection = await db.listCollections({ name: 'polls' }).toArray();
    
    console.log('📊 Model Collections Status:');
    console.log(`   - users: ${userCollection.length > 0 ? '✅ Exists' : '❌ Not found'}`);
    console.log(`   - tenants: ${tenantCollection.length > 0 ? '✅ Exists' : '❌ Not found'}`);
    console.log(`   - polls: ${pollCollection.length > 0 ? '✅ Exists' : '❌ Not found'}`);
    
    // Test creating a model document
    console.log('\n🧪 Testing Model Document Creation...');
    
    const testUser = new User({
      tenantId: 'test-tenant',
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'testpassword123',
      role: 'user'
    });
    
    const savedUser = await testUser.save();
    console.log('✅ Test user created with ID:', savedUser._id);
    
    // Retrieve the user
    const foundUser = await User.findById(savedUser._id);
    console.log('✅ Test user retrieved:', foundUser ? 'Success' : 'Failed');
    
    // Clean up - remove test user
    await User.findByIdAndDelete(savedUser._id);
    console.log('✅ Test user cleaned up');
    
    console.log('\n🎉 MongoDB Connection Test Completed Successfully!');
    
  } catch (error) {
    console.error('❌ MongoDB Connection Test Failed:', error.message);
    console.error('Error details:', error);
  } finally {
    // Close connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('🔌 MongoDB connection closed');
    }
  }
}

// Run the test
testMongoDBConnection(); 