/**
 * MongoDB Atlas Configuration Example
 * 
 * To use Atlas:
 * 1. Create a MongoDB Atlas cluster
 * 2. Get your connection string
 * 3. Set environment variables:
 *    - MONGODB_ATLAS_URI=mongodb+srv://username:password@cluster.mongodb.net/luxgen
 *    - USE_ATLAS=true
 *    - USE_LOCAL_DB=false
 * 
 * Example Atlas URI format:
 * mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
 */

// Example environment variables for Atlas
const atlasExample = {
  // Atlas connection string
  MONGODB_ATLAS_URI: 'mongodb+srv://username:password@cluster.mongodb.net/luxgen',
  
  // Enable Atlas
  USE_ATLAS: 'true',
  USE_LOCAL_DB: 'false',
  
  // Atlas-specific options
  MONGODB_MAX_POOL_SIZE: '10',
  MONGODB_MIN_POOL_SIZE: '2',
  MONGODB_MAX_IDLE_TIME: '30000',
  MONGODB_SERVER_SELECTION_TIMEOUT: '10000',
  MONGODB_CONNECT_TIMEOUT: '10000',
  MONGODB_SOCKET_TIMEOUT: '45000',
  
  // Security
  JWT_SECRET: 'your-jwt-secret-key-change-in-production',
  ENCRYPTION_KEY: 'your-encryption-key-change-in-production',
  
  // Multi-tenancy
  ENABLE_MULTI_TENANCY: 'true',
  ENABLE_TENANT_ISOLATION: 'true',
  DEFAULT_TENANT: 'luxgen'
};

console.log('Atlas Configuration Example:');
console.log(JSON.stringify(atlasExample, null, 2));

module.exports = atlasExample;
