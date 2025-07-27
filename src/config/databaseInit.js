/**
 * Database Initialization System
 * Handles comprehensive database setup including models, indexes, and seed data
 */

const DatabaseSetup = require('../scripts/setupDatabase');

class DatabaseInitializer {
  constructor () {
    this.setup = new DatabaseSetup();
  }
  async initialize () {
    try {
      console.log('🚀 Initializing comprehensive database setup...');

      
// Use the comprehensive database setup
      await this.setup.initialize();

      console.log('✅ Database initialization completed');
    } catch (error) {
      console.error('❌ Database initialization failed:', error.message);
      throw error;
    } }
}
const createDatabaseInitializer = () => {
  return new DatabaseInitializer();
}
module.exports = { createDatabaseInitializer }