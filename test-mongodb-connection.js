/**
 * Test MongoDB Atlas Connection
 * This script tests the MongoDB Atlas connection
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

async function testConnection() {
  console.log('🔍 Testing MongoDB Atlas Connection...');
  
  // Use the connection string from .env file
  const uri = process.env.MONGODB_URI || process.env.MONGODB_ATLAS_URI;
  
  if (!uri) {
    console.error('❌ MONGODB_URI not found in environment variables');
    process.exit(1);
  }
  
  console.log('📡 Connection URI:', uri.replace(/\/\/.*@/, '//***:***@')); // Hide credentials
  
  try {
    const client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    console.log('🔄 Connecting to MongoDB Atlas...');
    await client.connect();
    
    console.log('✅ Successfully connected to MongoDB Atlas!');
    
    // Test database operations
    const db = client.db('luxgen');
    console.log('📊 Database: luxgen');
    
    // List collections
    const collections = await db.listCollections().toArray();
    console.log('📁 Collections:', collections.map(c => c.name));
    
    // Test a simple operation
    const result = await db.collection('test').insertOne({ 
      test: true, 
      timestamp: new Date() 
    });
    console.log('✅ Test document inserted:', result.insertedId);
    
    // Clean up test document
    await db.collection('test').deleteOne({ _id: result.insertedId });
    console.log('🧹 Test document cleaned up');
    
    await client.close();
    console.log('🔌 Connection closed');
    
  } catch (error) {
    console.error('❌ MongoDB Atlas connection failed:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.log('💡 Please check your MongoDB Atlas credentials');
      console.log('💡 Make sure your IP address is whitelisted in MongoDB Atlas');
      console.log('💡 Verify your username and password are correct');
    }
    
    process.exit(1);
  }
}

testConnection();
