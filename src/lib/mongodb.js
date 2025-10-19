/**
 * MongoDB Client Connection (Reusable)
 * Prevents multiple connections in development
 */

const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error('MONGODB_URI not set in environment variables');
}

const options = {
  maxPoolSize: 10,                    // Maximum connections
  minPoolSize: 2,                     // Minimum connections
  maxIdleTimeMS: 30000,               // Close connections after 30s idle
  serverSelectionTimeoutMS: 5000,     // Try to select server for 5s
  connectTimeoutMS: 10000,           // Give up initial connection after 10s
  socketTimeoutMS: 45000,             // Close sockets after 45s of inactivity
  retryWrites: true,                  // Retry write operations
  w: 'majority',                      // Write concern
  readPreference: 'primary'           // Read from primary replica
};

let client;
let clientPromise;

// Global variable for development hot reloads
declare global {
  var _mongoClientPromise: Promise<MongoClient>;
}

if (process.env.NODE_ENV === 'development') {
  // Reuse the client in dev to prevent hot reloads creating multiple connections
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
    console.log('🔗 MongoDB client created for development');
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production, always create a new client
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
  console.log('🔗 MongoDB client created for production');
}

// Connection event listeners
clientPromise.then((client) => {
  client.on('error', (error) => {
    console.error('❌ MongoDB client error:', error);
  });

  client.on('close', () => {
    console.warn('⚠️ MongoDB client connection closed');
  });

  client.on('reconnect', () => {
    console.log('🔄 MongoDB client reconnected');
  });
}).catch((error) => {
  console.error('❌ MongoDB client connection failed:', error);
});

module.exports = clientPromise;
