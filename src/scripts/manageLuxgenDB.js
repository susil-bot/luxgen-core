#!/usr/bin/env node

const mongoose = require('mongoose');
const { exec } = require('child_process');
const path = require('path');

class LuxgenDatabaseManager {
  constructor() {
    this.databaseUrl = process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/luxgen';
    this.scriptsPath = path.join(__dirname);
  }

  async connect() {
    try {
      await mongoose.connect(this.databaseUrl);
      console.log('✅ Connected to luxgen database');
      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
  }

  async disconnect() {
    try {
      await mongoose.disconnect();
      console.log('🔌 Disconnected from database');
    } catch (error) {
      console.error('❌ Error disconnecting:', error.message);
    }
  }

  async checkDatabaseStatus() {
    console.log('\n📊 Database Status Check');
    console.log('========================');
    
    try {
      const state = mongoose.connection.readyState;
      const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
      };
      
      console.log(`Status: ${states[state] || 'unknown'}`);
      console.log(`Host: ${mongoose.connection.host}`);
      console.log(`Port: ${mongoose.connection.port}`);
      console.log(`Database: ${mongoose.connection.name}`);
      
      if (state === 1) {
        // Get collection stats
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(`Collections: ${collections.length}`);
        
        for (const collection of collections) {
          const count = await mongoose.connection.db.collection(collection.name).countDocuments();
          console.log(`  - ${collection.name}: ${count} documents`);
        }
      }
      
      return state === 1;
    } catch (error) {
      console.error('❌ Database status check failed:', error.message);
      return false;
    }
  }

  async migrateFromTest() {
    console.log('\n🔄 Migrating data from test database...');
    
    try {
      const { exec } = require('child_process');
      const migrationScript = path.join(this.scriptsPath, 'migrateToLuxgenDB.js');
      
      return new Promise((resolve, reject) => {
        exec(`node ${migrationScript}`, (error, stdout, stderr) => {
          if (error) {
            console.error('❌ Migration failed:', error.message);
            reject(error);
          } else {
            console.log(stdout);
            if (stderr) console.error(stderr);
            resolve(true);
          }
        });
      });
    } catch (error) {
      console.error('❌ Migration error:', error.message);
      throw error;
    }
  }

  async seedDatabase() {
    console.log('\n🌱 Seeding luxgen database...');
    
    try {
      const { exec } = require('child_process');
      const seedScript = path.join(this.scriptsPath, 'seedLuxgenDatabase.js');
      
      return new Promise((resolve, reject) => {
        exec(`node ${seedScript}`, (error, stdout, stderr) => {
          if (error) {
            console.error('❌ Seeding failed:', error.message);
            reject(error);
          } else {
            console.log(stdout);
            if (stderr) console.error(stderr);
            resolve(true);
          }
        });
      });
    } catch (error) {
      console.error('❌ Seeding error:', error.message);
      throw error;
    }
  }

  async clearDatabase() {
    console.log('\n🧹 Clearing luxgen database...');
    
    try {
      const collections = [
        'users', 'tenants', 'tenantconfigurations', 'brandidentities',
        'trainingcourses', 'trainingmodules', 'trainingsessions', 'trainingassessments',
        'presentations', 'polls', 'groups', 'notifications', 'auditlogs',
        'posts', 'comments', 'likes', 'messages', 'conversations',
        'jobs', 'jobapplications', 'candidateprofiles', 'sessions'
      ];

      for (const collectionName of collections) {
        try {
          const result = await mongoose.connection.db.collection(collectionName).deleteMany({});
          console.log(`✅ Cleared ${collectionName}: ${result.deletedCount} documents`);
        } catch (error) {
          console.log(`⚠️  Could not clear ${collectionName}: ${error.message}`);
        }
      }
      
      console.log('✅ Database cleared successfully');
    } catch (error) {
      console.error('❌ Error clearing database:', error.message);
      throw error;
    }
  }

  async createIndexes() {
    console.log('\n🔧 Creating database indexes...');
    
    const indexConfigurations = {
      users: [
        { email: 1, tenantId: 1 },
        { tenantId: 1, role: 1 },
        { tenantId: 1, status: 1 },
        { createdAt: -1 }
      ],
      tenants: [
        { slug: 1 },
        { domain: 1 },
        { status: 1 },
        { createdAt: -1 }
      ],
      posts: [
        { tenantId: 1, createdAt: -1 },
        { tenantId: 1, 'author.userId': 1 },
        { tenantId: 1, status: 1 },
        { hashtags: 1 },
        { content: 'text' }
      ],
      jobs: [
        { tenantId: 1, status: 1 },
        { tenantId: 1, postedBy: 1 },
        { title: 'text', description: 'text' },
        { skillsRequired: 1 }
      ],
      conversations: [
        { tenantId: 1, 'participants.userId': 1 },
        { tenantId: 1, updatedAt: -1 }
      ],
      messages: [
        { tenantId: 1, conversationId: 1, createdAt: -1 },
        { tenantId: 1, 'sender.userId': 1 }
      ]
    };
    
    for (const [collectionName, indexes] of Object.entries(indexConfigurations)) {
      try {
        const collection = mongoose.connection.db.collection(collectionName);
        
        for (const index of indexes) {
          try {
            await collection.createIndex(index);
            console.log(`✅ Created index for ${collectionName}:`, index);
          } catch (error) {
            console.log(`⚠️  Index creation failed for ${collectionName}:`, error.message);
          }
        }
      } catch (error) {
        console.log(`⚠️  Collection ${collectionName} not found for indexing`);
      }
    }
  }

  async backupDatabase() {
    console.log('\n💾 Creating database backup...');
    
    try {
      const { exec } = require('child_process');
      const backupPath = path.join(__dirname, '..', '..', 'backups');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = `luxgen-backup-${timestamp}`;
      
      // Create backup directory if it doesn't exist
      const fs = require('fs');
      if (!fs.existsSync(backupPath)) {
        fs.mkdirSync(backupPath, { recursive: true });
      }
      
      return new Promise((resolve, reject) => {
        exec(`mongodump --db luxgen --out ${backupPath}/${backupFile}`, (error, stdout, stderr) => {
          if (error) {
            console.error('❌ Backup failed:', error.message);
            reject(error);
          } else {
            console.log(`✅ Backup created: ${backupPath}/${backupFile}`);
            console.log(stdout);
            if (stderr) console.error(stderr);
            resolve(true);
          }
        });
      });
    } catch (error) {
      console.error('❌ Backup error:', error.message);
      throw error;
    }
  }

  async restoreDatabase(backupPath) {
    console.log(`\n🔄 Restoring database from ${backupPath}...`);
    
    try {
      const { exec } = require('child_process');
      
      return new Promise((resolve, reject) => {
        exec(`mongorestore --db luxgen ${backupPath}`, (error, stdout, stderr) => {
          if (error) {
            console.error('❌ Restore failed:', error.message);
            reject(error);
          } else {
            console.log('✅ Database restored successfully');
            console.log(stdout);
            if (stderr) console.error(stderr);
            resolve(true);
          }
        });
      });
    } catch (error) {
      console.error('❌ Restore error:', error.message);
      throw error;
    }
  }

  async runCommand(command) {
    try {
      switch (command) {
        case 'status':
          await this.connect();
          await this.checkDatabaseStatus();
          await this.disconnect();
          break;
          
        case 'migrate':
          await this.migrateFromTest();
          break;
          
        case 'seed':
          await this.connect();
          await this.seedDatabase();
          await this.disconnect();
          break;
          
        case 'clear':
          await this.connect();
          await this.clearDatabase();
          await this.disconnect();
          break;
          
        case 'indexes':
          await this.connect();
          await this.createIndexes();
          await this.disconnect();
          break;
          
        case 'backup':
          await this.backupDatabase();
          break;
          
        case 'setup':
          console.log('🚀 Setting up luxgen database...');
          await this.connect();
          await this.clearDatabase();
          await this.seedDatabase();
          await this.createIndexes();
          await this.disconnect();
          console.log('✅ Database setup completed!');
          break;
          
        default:
          console.log('❌ Unknown command:', command);
          this.showHelp();
      }
    } catch (error) {
      console.error('❌ Command failed:', error.message);
      process.exit(1);
    }
  }

  showHelp() {
    console.log('\n📖 LuxGen Database Manager');
    console.log('==========================');
    console.log('Usage: node manageLuxgenDB.js <command>');
    console.log('\nCommands:');
    console.log('  status    - Check database status');
    console.log('  migrate   - Migrate data from test database');
    console.log('  seed      - Seed database with sample data');
    console.log('  clear     - Clear all data from database');
    console.log('  indexes   - Create database indexes');
    console.log('  backup    - Create database backup');
    console.log('  setup     - Complete database setup (clear + seed + indexes)');
    console.log('\nExamples:');
    console.log('  node manageLuxgenDB.js status');
    console.log('  node manageLuxgenDB.js setup');
    console.log('  node manageLuxgenDB.js backup');
  }
}

// Run command if called directly
if (require.main === module) {
  const command = process.argv[2];
  const manager = new LuxgenDatabaseManager();
  
  if (!command) {
    manager.showHelp();
    process.exit(0);
  }
  
  manager.runCommand(command)
    .then(() => {
      console.log('✅ Command completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Command failed:', error.message);
      process.exit(1);
    });
}

module.exports = LuxgenDatabaseManager;
