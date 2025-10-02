const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Database configuration
const SOURCE_DB = 'mongodb://127.0.0.1:27017/test';
const TARGET_DB = 'mongodb://127.0.0.1:27017/luxgen';

// Collections to migrate
const COLLECTIONS_TO_MIGRATE = [
  'users',
  'tenants',
  'tenantconfigurations',
  'brandidentities',
  'trainingcourses',
  'trainingsessions',
  'trainingmodules',
  'trainingassessments',
  'presentations',
  'polls',
  'groups',
  'notifications',
  'auditlogs',
  'posts',
  'comments',
  'likes',
  'messages',
  'conversations',
  'jobs',
  'jobapplications',
  'candidateprofiles',
  'sessions'
];

class DatabaseMigrator {
  constructor() {
    this.sourceConnection = null;
    this.targetConnection = null;
    this.migrationLog = [];
  }

  async connect() {
    try {
      console.log('🔌 Connecting to source database (test)...');
      this.sourceConnection = await mongoose.createConnection(SOURCE_DB);
      console.log('✅ Connected to source database');

      console.log('🔌 Connecting to target database (luxgen)...');
      this.targetConnection = await mongoose.createConnection(TARGET_DB);
      console.log('✅ Connected to target database');

      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.sourceConnection) {
        await this.sourceConnection.close();
        console.log('🔌 Disconnected from source database');
      }
      if (this.targetConnection) {
        await this.targetConnection.close();
        console.log('🔌 Disconnected from target database');
      }
    } catch (error) {
      console.error('❌ Error disconnecting:', error.message);
    }
  }

  async checkCollections() {
    console.log('\n📊 Checking collections in source database...');
    const sourceCollections = await this.sourceConnection.db.listCollections().toArray();
    const sourceCollectionNames = sourceCollections.map(col => col.name);
    
    console.log('Source collections found:', sourceCollectionNames);
    
    const missingCollections = COLLECTIONS_TO_MIGRATE.filter(
      col => !sourceCollectionNames.includes(col)
    );
    
    if (missingCollections.length > 0) {
      console.log('⚠️  Missing collections in source:', missingCollections);
    }
    
    return sourceCollectionNames;
  }

  async migrateCollection(collectionName) {
    try {
      console.log(`\n🔄 Migrating collection: ${collectionName}`);
      
      // Get source collection
      const sourceCollection = this.sourceConnection.db.collection(collectionName);
      const targetCollection = this.targetConnection.db.collection(collectionName);
      
      // Check if collection exists in source
      const sourceExists = await this.sourceConnection.db.listCollections({ name: collectionName }).hasNext();
      if (!sourceExists) {
        console.log(`⚠️  Collection ${collectionName} does not exist in source database`);
        this.migrationLog.push({
          collection: collectionName,
          status: 'skipped',
          reason: 'Collection does not exist in source',
          count: 0
        });
        return;
      }
      
      // Get document count
      const documentCount = await sourceCollection.countDocuments();
      console.log(`📄 Found ${documentCount} documents in ${collectionName}`);
      
      if (documentCount === 0) {
        console.log(`⚠️  Collection ${collectionName} is empty`);
        this.migrationLog.push({
          collection: collectionName,
          status: 'skipped',
          reason: 'Collection is empty',
          count: 0
        });
        return;
      }
      
      // Check if target collection exists and has data
      const targetExists = await this.targetConnection.db.listCollections({ name: collectionName }).hasNext();
      if (targetExists) {
        const targetCount = await targetCollection.countDocuments();
        if (targetCount > 0) {
          console.log(`⚠️  Collection ${collectionName} already exists in target with ${targetCount} documents`);
          console.log('🔄 Dropping existing collection...');
          await targetCollection.drop();
        }
      }
      
      // Migrate documents
      const documents = await sourceCollection.find({}).toArray();
      let migratedCount = 0;
      let errorCount = 0;
      
      for (const doc of documents) {
        try {
          // Ensure tenantId exists for multi-tenancy
          if (!doc.tenantId) {
            doc.tenantId = 'default'; // Set default tenant for existing data
          }
          
          // Ensure timestamps exist
          if (!doc.createdAt) {
            doc.createdAt = new Date();
          }
          if (!doc.updatedAt) {
            doc.updatedAt = new Date();
          }
          
          await targetCollection.insertOne(doc);
          migratedCount++;
        } catch (error) {
          console.error(`❌ Error migrating document in ${collectionName}:`, error.message);
          errorCount++;
        }
      }
      
      console.log(`✅ Migrated ${migratedCount} documents from ${collectionName}`);
      if (errorCount > 0) {
        console.log(`⚠️  ${errorCount} documents failed to migrate`);
      }
      
      this.migrationLog.push({
        collection: collectionName,
        status: 'completed',
        count: migratedCount,
        errors: errorCount
      });
      
    } catch (error) {
      console.error(`❌ Error migrating collection ${collectionName}:`, error.message);
      this.migrationLog.push({
        collection: collectionName,
        status: 'failed',
        error: error.message,
        count: 0
      });
    }
  }

  async createIndexes() {
    console.log('\n🔧 Creating indexes for performance...');
    
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
        const collection = this.targetConnection.db.collection(collectionName);
        
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

  async validateMigration() {
    console.log('\n🔍 Validating migration...');
    
    for (const collectionName of COLLECTIONS_TO_MIGRATE) {
      try {
        const sourceCollection = this.sourceConnection.db.collection(collectionName);
        const targetCollection = this.targetConnection.db.collection(collectionName);
        
        const sourceCount = await sourceCollection.countDocuments();
        const targetCount = await targetCollection.countDocuments();
        
        if (sourceCount === targetCount) {
          console.log(`✅ ${collectionName}: ${targetCount} documents migrated successfully`);
        } else {
          console.log(`⚠️  ${collectionName}: Source ${sourceCount}, Target ${targetCount} (mismatch)`);
        }
      } catch (error) {
        console.log(`⚠️  Could not validate ${collectionName}:`, error.message);
      }
    }
  }

  async generateReport() {
    console.log('\n📊 Migration Report');
    console.log('==================');
    
    const successful = this.migrationLog.filter(log => log.status === 'completed');
    const failed = this.migrationLog.filter(log => log.status === 'failed');
    const skipped = this.migrationLog.filter(log => log.status === 'skipped');
    
    console.log(`✅ Successful migrations: ${successful.length}`);
    console.log(`❌ Failed migrations: ${failed.length}`);
    console.log(`⚠️  Skipped migrations: ${skipped.length}`);
    
    const totalDocuments = successful.reduce((sum, log) => sum + log.count, 0);
    console.log(`📄 Total documents migrated: ${totalDocuments}`);
    
    if (failed.length > 0) {
      console.log('\n❌ Failed Collections:');
      failed.forEach(log => {
        console.log(`  - ${log.collection}: ${log.error}`);
      });
    }
    
    if (skipped.length > 0) {
      console.log('\n⚠️  Skipped Collections:');
      skipped.forEach(log => {
        console.log(`  - ${log.collection}: ${log.reason}`);
      });
    }
    
    // Save report to file
    const reportPath = path.join(__dirname, 'migration-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.migrationLog, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  }

  async runMigration() {
    try {
      console.log('🚀 Starting database migration from test to luxgen...\n');
      
      // Connect to databases
      await this.connect();
      
      // Check collections
      await this.checkCollections();
      
      // Migrate each collection
      for (const collectionName of COLLECTIONS_TO_MIGRATE) {
        await this.migrateCollection(collectionName);
      }
      
      // Create indexes
      await this.createIndexes();
      
      // Validate migration
      await this.validateMigration();
      
      // Generate report
      await this.generateReport();
      
      console.log('\n🎉 Migration completed successfully!');
      
    } catch (error) {
      console.error('\n❌ Migration failed:', error.message);
      throw error;
    } finally {
      await this.disconnect();
    }
  }
}

// Run migration if called directly
if (require.main === module) {
  const migrator = new DatabaseMigrator();
  migrator.runMigration()
    .then(() => {
      console.log('✅ Migration process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration process failed:', error);
      process.exit(1);
    });
}

module.exports = DatabaseMigrator;
