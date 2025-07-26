const databaseManager = require('./database');

class DatabaseInitializer {
  constructor() {
    this.migrations = [];
    this.seeders = [];
  }

  // Add migration
  addMigration(name, up, down) {
    this.migrations.push({ name, up, down });
  }

  // Add seeder
  addSeeder(name, run) {
    this.seeders.push({ name, run });
  }

  // Initialize database with migrations and seeding
  async initialize() {
    console.log('🚀 Starting database initialization...');
    
    try {
      // Initialize database connections
      await databaseManager.initialize();
      
      // Run migrations
      await this.runMigrations();
      
      // Run seeders if in development
      if (process.env.NODE_ENV === 'development') {
        await this.runSeeders();
      }
      
      console.log('✅ Database initialization completed successfully');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  // Run all migrations
  async runMigrations() {
    console.log('🔄 Running database migrations...');
    
    const mongoConnection = databaseManager.getMongoConnection();
    
    if (!mongoConnection) {
      throw new Error('MongoDB connection not available');
    }

    // Run pending migrations
    for (const migration of this.migrations) {
      console.log(`📦 Running migration: ${migration.name}`);
      
      try {
        await migration.up(null, mongoConnection);
        console.log(`✅ Migration completed: ${migration.name}`);
      } catch (error) {
        console.error(`❌ Migration failed: ${migration.name}`, error);
        throw error;
      }
    }
    
    console.log('✅ All migrations completed');
  }

  // Create migrations table
  async createMigrationsTable(pool) {
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS migrations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } finally {
      client.release();
    }
  }

  // Get applied migrations
  async getAppliedMigrations(pool) {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT name FROM migrations ORDER BY applied_at');
      return result.rows.map(row => row.name);
    } finally {
      client.release();
    }
  }

  // Record migration as applied
  async recordMigration(pool, name) {
    const client = await pool.connect();
    try {
      await client.query('INSERT INTO migrations (name) VALUES ($1)', [name]);
    } finally {
      client.release();
    }
  }

  // Run all seeders
  async runSeeders() {
    console.log('🌱 Running database seeders...');
    
    const mongoConnection = databaseManager.getMongoConnection();
    
    for (const seeder of this.seeders) {
      console.log(`🌱 Running seeder: ${seeder.name}`);
      try {
        await seeder.run(null, mongoConnection);
        console.log(`✅ Seeder completed: ${seeder.name}`);
      } catch (error) {
        console.error(`❌ Seeder failed: ${seeder.name}`, error);
        throw error;
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
      const client = await pool.connect();
      try {
        // Check if default tenant exists
        const existing = await client.query('SELECT id FROM tenants WHERE domain = $1', ['trainer.com']);
        if (existing.rows.length === 0) {
          await client.query(`
            INSERT INTO tenants (name, domain, subdomain, settings) 
            VALUES ($1, $2, $3, $4)
          `, [
            'Default Trainer Platform',
            'trainer.com',
            'default',
            JSON.stringify({
              theme: 'default',
              features: ['polls', 'presentations', 'analytics'],
              maxUsers: 1000
            })
          ]);
          console.log('✅ Default tenant created');
        }
      } finally {
        client.release();
      }
    });

    // Default users seeder
    this.addSeeder('default_users', async (pool) => {
      const client = await pool.connect();
      try {
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('password123', 12);
        
        const users = [
          {
            email: 'superadmin@trainer.com',
            password_hash: hashedPassword,
            first_name: 'Super',
            last_name: 'Admin',
            role: 'super_admin',
            tenant_id: 'default'
          },
          {
            email: 'admin@trainer.com',
            password_hash: hashedPassword,
            first_name: 'Admin',
            last_name: 'User',
            role: 'admin',
            tenant_id: 'default'
          },
          {
            email: 'trainer@trainer.com',
            password_hash: hashedPassword,
            first_name: 'Trainer',
            last_name: 'User',
            role: 'trainer',
            tenant_id: 'default'
          },
          {
            email: 'user@trainer.com',
            password_hash: hashedPassword,
            first_name: 'Regular',
            last_name: 'User',
            role: 'user',
            tenant_id: 'default'
          }
        ];

        for (const user of users) {
          const existing = await client.query('SELECT id FROM users WHERE email = $1', [user.email]);
          if (existing.rows.length === 0) {
            await client.query(`
              INSERT INTO users (email, password_hash, first_name, last_name, role, tenant_id)
              VALUES ($1, $2, $3, $4, $5, $6)
            `, [user.email, user.password_hash, user.first_name, user.last_name, user.role, user.tenant_id]);
          }
        }
        
        console.log('✅ Default users created');
      } finally {
        client.release();
      }
    });
  }
}

// Create database initializer with default migrations and seeders
function createDatabaseInitializer() {
  const initializer = new DatabaseInitializer();
  initializer.setupDefaultMigrations();
  initializer.setupDefaultSeeders();
  return initializer;
}

module.exports = {
  DatabaseInitializer,
  createDatabaseInitializer
}; 