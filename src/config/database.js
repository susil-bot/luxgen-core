/**
 * LuxGen Database Configuration
 * 
 * HIGH TECHNICAL STANDARDS: Environment-based configuration
 * Following LuxGen rules: Multi-tenant architecture with proper flagging
 * 
 * Usage:
 * - Local Development: USE_LOCAL_DB=true in .env
 * - Production: USE_LOCAL_DB=false or not set (uses Atlas)
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

class DatabaseConfig {
  constructor() {
    this.config = this.loadConfiguration();
  }

  loadConfiguration() {
    const useLocal = process.env.USE_LOCAL_DB === 'true';
    const atlasUri = process.env.MONGODB_URI;
    const localHost = process.env.LOCAL_MONGODB_HOST || 'localhost';
    const localPort = process.env.LOCAL_MONGODB_PORT || '27017';
    const localDatabase = process.env.LOCAL_MONGODB_DATABASE || 'luxgen';

    // Validate configuration
    if (!useLocal && !atlasUri) {
      throw new Error(`
❌ Database configuration error:
   USE_LOCAL_DB is not set to 'true' and MONGODB_URI is not provided.
   
   For local development:
   - Set USE_LOCAL_DB=true in .env file
   - Or run: USE_LOCAL_DB=true npm start
   
   For production:
   - Set MONGODB_URI=mongodb+srv://... in .env file
   - Or set USE_LOCAL_DB=false
      `);
    }

    return {
      useLocal,
      uri: useLocal
        ? `mongodb://${localHost}:${localPort}/${localDatabase}`
        : atlasUri,
      timeout: 30000,
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 30000,
        connectTimeoutMS: 30000,
        socketTimeoutMS: 30000
      }
    };
  }

  getConnectionString() {
    return this.config.uri;
  }

  getConnectionOptions() {
    return this.config.options;
  }

  isLocal() {
    return this.config.useLocal;
  }

  isAtlas() {
    return !this.config.useLocal;
  }

  getEnvironmentInfo() {
    return {
      mode: this.config.useLocal ? 'LOCAL' : 'ATLAS',
      uri: this.config.uri,
      timeout: this.config.timeout,
      timestamp: new Date().toISOString()
    };
  }

  logConfiguration() {
    const info = this.getEnvironmentInfo();
    console.log('🔧 Database Configuration:');
    console.log(`   Mode: ${info.mode}`);
    console.log(`   URI: ${info.uri}`);
    console.log(`   Timeout: ${info.timeout}ms`);
    console.log(`   Timestamp: ${info.timestamp}`);
  }
}

module.exports = DatabaseConfig;
