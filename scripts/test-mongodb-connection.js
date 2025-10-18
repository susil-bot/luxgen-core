// MongoDB Connection Test Script
// Tests MongoDB connection with secure credentials

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.secure' });

async function testMongoDBConnection() {
  console.log('🔍 Testing MongoDB Connection...');
  console.log('================================');
  
  try {
    // Get MongoDB URI from environment
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      console.error('❌ MONGODB_URI not found in environment variables');
      console.log('Please set MONGODB_URI in .env.secure file');
      process.exit(1);
    }
    
    console.log('📡 Connecting to MongoDB...');
    console.log('URI:', mongoURI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')); // Hide credentials
    
    // Connect to MongoDB
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // 5 second timeout
    });
    
    console.log('✅ MongoDB Connected Successfully!');
    console.log('Host:', conn.connection.host);
    console.log('Database:', conn.connection.name);
    console.log('Ready State:', conn.connection.readyState);
    
    // Test database operations
    console.log('\n🧪 Testing Database Operations...');
    
    // Test collection access
    const collections = await conn.connection.db.listCollections().toArray();
    console.log('📋 Available Collections:', collections.length);
    
    // Test basic query
    const testCollection = conn.connection.db.collection('test');
    const testDoc = { 
      test: true, 
      timestamp: new Date(),
      message: 'MongoDB connection test successful'
    };
    
    const insertResult = await testCollection.insertOne(testDoc);
    console.log('✅ Insert Test:', insertResult.insertedId);
    
    const findResult = await testCollection.findOne({ _id: insertResult.insertedId });
    console.log('✅ Find Test:', findResult ? 'Success' : 'Failed');
    
    // Clean up test document
    await testCollection.deleteOne({ _id: insertResult.insertedId });
    console.log('✅ Cleanup Test: Success');
    
    // Test connection health
    const pingResult = await conn.connection.db.admin().ping();
    console.log('✅ Ping Test:', pingResult.ok === 1 ? 'Success' : 'Failed');
    
    console.log('\n🎉 All MongoDB tests passed!');
    console.log('Your database is ready for deployment.');
    
  } catch (error) {
    console.error('❌ MongoDB Connection Failed!');
    console.error('Error:', error.message);
    
    if (error.name === 'MongoNetworkError') {
      console.log('\n🔧 Troubleshooting:');
      console.log('1. Check if MongoDB Atlas cluster is running');
      console.log('2. Verify network access is configured (0.0.0.0/0)');
      console.log('3. Check if database user exists and has correct permissions');
      console.log('4. Verify connection string format');
    }
    
    if (error.name === 'MongoServerError') {
      console.log('\n🔧 Troubleshooting:');
      console.log('1. Check database user credentials');
      console.log('2. Verify user has read/write permissions');
      console.log('3. Check if database exists');
    }
    
    process.exit(1);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('\n🔌 Connection closed');
    process.exit(0);
  }
}

// Run the test
testMongoDBConnection();
