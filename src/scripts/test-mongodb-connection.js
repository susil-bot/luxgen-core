#!/usr/bin/env node
/**
 * MongoDB Native Driver Connection Test Script
 * 
 * This script demonstrates the MongoDB native driver connection
 * as requested by the user. It includes the exact code provided
 * with additional error handling and logging.
 */

const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

// MongoDB Atlas connection URI from environment variables
const uri = process.env.MONGODB_ATLAS_URI || process.env.MONGODB_URI || (() => {
  console.error('No MongoDB URI found in environment variables.');
  console.error('Please set MONGODB_ATLAS_URI or MONGODB_URI environment variable.');
  process.exit(1);
})();

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    console.log('Attempting to connect to MongoDB Atlas...');
    
    // Connect the client to the server (optional starting in v4.7)
    await client.connect();
    
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
    
    // Additional connection information
    const adminDb = client.db("admin");
    const serverStatus = await adminDb.command({ serverStatus: 1 });
    
    console.log('\n🔗 Connection Details:');
    console.log(`- Host: ${client.topology.s.description.servers.get(Array.from(client.topology.s.description.servers.keys())[0]).host}`);
    console.log(`- MongoDB Version: ${serverStatus.version}`);
    console.log(`- Uptime: ${Math.floor(serverStatus.uptime / 60)} minutes`);
    console.log(`- Connections: ${serverStatus.connections.current}/${serverStatus.connections.available}`);
    
    // Test database operations
    const testDb = client.db("test_connection");
    const testCollection = testDb.collection("connection_test");
    
    // Insert a test document
    const testDoc = {
      message: "MongoDB native driver connection test",
      timestamp: new Date(),
      testId: Math.random().toString(36).substring(7)
    };
    
    const insertResult = await testCollection.insertOne(testDoc);
    console.log(`\n✅ Test document inserted with ID: ${insertResult.insertedId}`);
    
    // Find the test document
    const foundDoc = await testCollection.findOne({ _id: insertResult.insertedId });
    console.log(`✅ Test document found: ${foundDoc.message}`);
    
    // Clean up test document
    await testCollection.deleteOne({ _id: insertResult.insertedId });
    console.log('✅ Test document cleaned up');
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
    console.log('🔌 MongoDB connection closed');
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the connection test
console.log('Starting MongoDB Native Driver Connection Test');
console.log('='.repeat(60));
run().catch(console.dir);