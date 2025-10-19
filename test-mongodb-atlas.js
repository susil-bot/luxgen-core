#!/usr/bin/env node

/**
 * MongoDB Atlas Connection Test
 * Tests the actual MongoDB Atlas connection with your credentials
 */

const { MongoClient, ServerApiVersion } = require('mongodb');

// Load environment variables
require('dotenv').config();

const uri = process.env.MONGODB_URI || process.env.MONGODB_ATLAS_URI;

if (!uri) {
  console.log('❌ No MongoDB URI found in environment variables');
  console.log('Please set MONGODB_URI or MONGODB_ATLAS_URI in your .env file');
  process.exit(1);
}

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function testMongoDBAtlasConnection() {
  console.log('🗄️  Testing MongoDB Atlas Connection...');
  console.log(`📡 Connection String: ${uri.replace(/\/\/.*@/, '//***:***@')}`);
  
  try {
    // Connect the client to the server
    console.log('🔌 Connecting to MongoDB Atlas...');
    await client.connect();
    
    // Send a ping to confirm a successful connection
    console.log('🏓 Pinging MongoDB Atlas...');
    await client.db("admin").command({ ping: 1 });
    console.log('✅ Successfully connected to MongoDB Atlas!');
    
    // Test database operations
    console.log('📝 Testing database operations...');
    const db = client.db('luxgen');
    const collection = db.collection('test');
    
    // Insert a test document
    const testDoc = {
      message: 'Hello from LuxGen!',
      timestamp: new Date(),
      test: true
    };
    
    const insertResult = await collection.insertOne(testDoc);
    console.log(`✅ Document inserted with ID: ${insertResult.insertedId}`);
    
    // Find the document
    const foundDoc = await collection.findOne({ _id: insertResult.insertedId });
    if (foundDoc) {
      console.log('✅ Document found successfully');
      console.log(`   Message: ${foundDoc.message}`);
      console.log(`   Timestamp: ${foundDoc.timestamp}`);
    }
    
    // Clean up - delete the test document
    await collection.deleteOne({ _id: insertResult.insertedId });
    console.log('✅ Test document cleaned up');
    
    // Get database stats
    const stats = await db.stats();
    console.log(`📊 Database: ${stats.db}`);
    console.log(`📊 Collections: ${stats.collections}`);
    console.log(`📊 Data Size: ${(stats.dataSize / 1024).toFixed(2)} KB`);
    
    return true;
    
  } catch (error) {
    console.log(`❌ MongoDB Atlas Connection Failed: ${error.message}`);
    
    if (error.message.includes('authentication failed')) {
      console.log('🔐 Authentication failed - check your username and password');
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('🌐 Network error - check your internet connection and cluster URL');
    } else if (error.message.includes('timeout')) {
      console.log('⏱️  Connection timeout - check your network and cluster status');
    }
    
    return false;
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
    console.log('🔌 MongoDB connection closed');
  }
}

// Main test runner
async function runMongoDBAtlasTest() {
  console.log('🧪 MongoDB Atlas Connection Test');
  console.log('=================================\n');

  const success = await testMongoDBAtlasConnection();
  
  console.log('\n📊 Test Results');
  console.log('================');
  if (success) {
    console.log('✅ MongoDB Atlas connection successful!');
    console.log('🎉 Your LuxGen backend can now connect to the database');
  } else {
    console.log('❌ MongoDB Atlas connection failed');
    console.log('🔧 Please check your connection string in the .env file');
  }
}

// Run the test
runMongoDBAtlasTest().catch(console.error);
