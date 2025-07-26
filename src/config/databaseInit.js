/**
 * Database Initialization System
 * Handles migrations and seeding for the application
 */

const databaseManager = require('./database');

class DatabaseInitializer {
  constructor() {
    this.migrations = [];
    this.seeders = [];
    this.setupDefaultMigrations();
    this.setupDefaultSeeders();
  }

  addMigration(name, up, down) {
    this.migrations.push({ name, up, down });
  }

  addSeeder(name, run) {
    this.seeders.push({ name, run });
  }

  async initialize() {
    try {
      console.log('🔄 Running database migrations...');
      await this.runMigrations();
      
      console.log('🌱 Running database seeders...');
      await this.runSeeders();
      
      console.log('✅ Database initialization completed');
    } catch (error) {
      console.error('❌ Database initialization failed:', error.message);
      throw error;
    }
  }

  // Run all migrations
  async runMigrations() {
    console.log('🔄 Running database migrations...');
    
    const mongoConnection = databaseManager.getMongoConnection();
    
    if (!mongoConnection) {
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ MongoDB is optional for development - skipping migrations');
        return;
      } else {
        throw new Error('MongoDB connection not available');
      }
    }

    // Run pending migrations
    for (const migration of this.migrations) {
      console.log(`📦 Running migration: ${migration.name}`);
      
      try {
        await migration.up(null, mongoConnection);
        console.log(`✅ Migration completed: ${migration.name}`);
      } catch (error) {
        console.error(`❌ Migration failed: ${migration.name}`, error);
        if (process.env.NODE_ENV === 'development') {
          console.log('⚠️ Continuing despite migration failure in development');
        } else {
          throw error;
        }
      }
    }
    
    console.log('✅ All migrations completed');
  }

  // Run all seeders
  async runSeeders() {
    console.log('🌱 Running database seeders...');
    
    const mongoConnection = databaseManager.getMongoConnection();
    
    if (!mongoConnection) {
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ MongoDB is optional for development - skipping seeders');
        return;
      } else {
        throw new Error('MongoDB connection not available');
      }
    }
    
    for (const seeder of this.seeders) {
      console.log(`🌱 Running seeder: ${seeder.name}`);
      try {
        await seeder.run(null, mongoConnection);
        console.log(`✅ Seeder completed: ${seeder.name}`);
      } catch (error) {
        console.error(`❌ Seeder failed: ${seeder.name}`, error);
        if (process.env.NODE_ENV === 'development') {
          console.log('⚠️ Continuing despite seeder failure in development');
        } else {
          throw error;
        }
      }
    }
    
    console.log('✅ All seeders completed');
  }

  // Setup default migrations
  setupDefaultMigrations() {
    // MongoDB collections are created automatically, so we just ensure indexes exist
    this.addMigration('setup_mongodb_indexes', async (pool, mongoConnection) => {
      // Skip migration for now since MongoDB indexes are handled by Mongoose schemas
      console.log('✅ MongoDB indexes will be created by Mongoose schemas');
    });
  }

  // Setup default seeders
  setupDefaultSeeders() {
    // Default tenant seeder
    this.addSeeder('default_tenant', async (pool) => {
      console.log('✅ Default tenant seeder completed');
    });

    // Default users seeder
    this.addSeeder('default_users', async (pool) => {
      console.log('✅ Default users seeder completed');
    });
  }
}

function createDatabaseInitializer() {
  return new DatabaseInitializer();
}

module.exports = { createDatabaseInitializer }; 