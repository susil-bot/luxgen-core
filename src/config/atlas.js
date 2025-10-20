/**
 * MongoDB Atlas Configuration
 * Handles Atlas connection with proper authentication and fallback
 */

class AtlasConfig {
  constructor() {
    this.config = this.loadAtlasConfiguration();
  }

  loadAtlasConfiguration() {
    // Check for Atlas credentials
    const atlasUri = process.env.MONGODB_ATLAS_URI || process.env.MONGODB_URI;
    const useAtlas = process.env.USE_ATLAS === 'true' || (process.env.USE_LOCAL_DB === 'false' && atlasUri);
    
    if (!useAtlas || !atlasUri) {
      return {
        enabled: false,
        uri: null,
        reason: 'Atlas not configured or disabled'
      };
    }

    // Validate Atlas URI format
    if (!atlasUri.includes('mongodb+srv://') && !atlasUri.includes('mongodb://')) {
      return {
        enabled: false,
        uri: null,
        reason: 'Invalid Atlas URI format'
      };
    }

    return {
      enabled: true,
      uri: atlasUri,
      options: {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        maxPoolSize: 20,
        minPoolSize: 5,
        maxIdleTimeMS: 30000,
        retryWrites: true,
        w: 'majority',
        readPreference: 'primary',
        // Atlas-specific options
        ssl: true,
        authSource: 'admin'
      }
    };
  }

  isEnabled() {
    return this.config.enabled;
  }

  getUri() {
    return this.config.uri;
  }

  getOptions() {
    return this.config.options;
  }

  getReason() {
    return this.config.reason;
  }

  logConfiguration() {
    if (this.config.enabled) {
      console.log('Atlas Configuration:');
      console.log(`   URI: ${this.config.uri}`);
      console.log(`   SSL: ${this.config.options.ssl}`);
      console.log(`   Timeout: ${this.config.options.serverSelectionTimeoutMS}ms`);
    } else {
      console.log('Atlas Configuration:');
      console.log(`   Status: Disabled`);
      console.log(`   Reason: ${this.config.reason}`);
    }
  }

  // Test Atlas connection
  async testConnection() {
    if (!this.config.enabled) {
      return { success: false, reason: this.config.reason };
    }

    try {
      const mongoose = require('mongoose');
      await mongoose.connect(this.config.uri, this.config.options);
      await mongoose.disconnect();
      return { success: true, message: 'Atlas connection successful' };
    } catch (error) {
      return { 
        success: false, 
        error: error.message,
        code: error.code,
        name: error.name
      };
    }
  }
}

module.exports = AtlasConfig;
