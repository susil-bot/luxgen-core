# 🗄️ LuxGen Database Setup Guide

## 🚀 **Quick Start**

### **1. Start MongoDB**
```bash
# Start MongoDB service
sudo systemctl start mongod

# Or if using Homebrew on macOS
brew services start mongodb-community

# Or start manually
mongod --dbpath /var/lib/mongodb
```

### **2. Setup LuxGen Database**
```bash
# Navigate to backend directory
cd /Users/susil/Documents/Workspcae/luxgen-idea/luxgen-core

# Complete database setup (clear + seed + indexes)
npm run db:setup

# Or step by step:
npm run db:status    # Check database status
npm run db:clear     # Clear existing data
npm run db:seed      # Seed with sample data
npm run db:indexes   # Create performance indexes
```

### **3. Verify Setup**
```bash
# Check database status
npm run db:status

# Should show:
# - Status: connected
# - Database: luxgen
# - Collections with document counts
```

## 📊 **Database Structure**

### **Collections in luxgen Database:**
```
luxgen/
├── users/                    # User accounts
├── tenants/                  # Multi-tenant configuration
├── tenantconfigurations/    # Tenant-specific settings
├── brandidentities/         # Brand identity configurations
├── trainingcourses/         # Training content
├── trainingmodules/         # Training modules
├── trainingsessions/        # Training sessions
├── trainingassessments/     # Training assessments
├── presentations/           # Presentation content
├── polls/                   # Polling system
├── groups/                  # Group management
├── notifications/           # Notification system
├── auditlogs/              # System audit trail
├── posts/                  # Social feed posts
├── comments/               # Post comments
├── likes/                  # Post likes/reactions
├── messages/               # Direct messages
├── conversations/          # Message conversations
├── jobs/                   # Job postings
├── jobapplications/        # Job applications
├── candidateprofiles/      # Candidate profiles
└── sessions/               # User sessions
```

## 🔧 **Database Management Commands**

### **Status & Monitoring**
```bash
npm run db:status     # Check database connection and stats
```

### **Data Management**
```bash
npm run db:clear      # Clear all data from luxgen database
npm run db:seed       # Seed database with sample data
npm run db:setup      # Complete setup (clear + seed + indexes)
```

### **Migration**
```bash
npm run db:migrate    # Migrate data from test database to luxgen
```

### **Performance**
```bash
npm run db:indexes    # Create database indexes for performance
```

### **Backup & Restore**
```bash
npm run db:backup     # Create database backup
```

## 🏗️ **Database Standards**

### **1. Multi-tenancy**
- **Every collection MUST have `tenantId` field**
- **All queries MUST filter by `tenantId`**
- **No cross-tenant data access allowed**

### **2. Required Fields**
Every document MUST have:
```javascript
{
  tenantId: String,     // REQUIRED: Tenant identifier
  createdAt: Date,     // REQUIRED: Creation timestamp
  updatedAt: Date      // REQUIRED: Last update timestamp
}
```

### **3. Indexing Strategy**
```javascript
// Primary indexes for all collections
{ tenantId: 1, createdAt: -1 }        // Most common query pattern
{ tenantId: 1, status: 1 }             // Status filtering
{ tenantId: 1, userId: 1 }             // User-specific queries
```

### **4. Data Validation**
- **Required Fields**: All required fields validated
- **Unique Constraints**: Email per tenant, slug uniqueness
- **Data Types**: Strict type validation
- **Business Rules**: Custom validation rules

## 🔒 **Security & Compliance**

### **Data Protection**
- **Encryption**: Sensitive data encrypted at rest
- **Access Control**: Role-based access control
- **Audit Trail**: Complete audit logging
- **Backup**: Automated daily backups
- **Retention**: Data retention policies

### **Multi-tenancy Security**
- **Tenant Isolation**: Strict tenant data separation
- **Cross-tenant Protection**: Prevent cross-tenant data access
- **API Security**: Tenant-aware API endpoints
- **Authentication**: Tenant-aware authentication

## 📊 **Sample Data**

### **Users Created:**
- **Admin**: admin@luxgen.com (super_admin)
- **Trainer**: sarah@luxgen.com (trainer)
- **User**: mike@luxgen.com (user)
- **Demo User**: demo@demo.com (user)

### **Tenants Created:**
- **LuxGen Main**: luxgen (main platform)
- **Demo Company**: demo (demo tenant)

### **Content Created:**
- **Training Courses**: React Fundamentals, Node.js Backend
- **Feed Posts**: Sample social media posts
- **Job Postings**: Senior React Developer, Frontend Developer
- **Conversations**: Sample messaging data

## 🚨 **Troubleshooting**

### **MongoDB Connection Issues**
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Start MongoDB if not running
sudo systemctl start mongod

# Check MongoDB logs
sudo journalctl -u mongod
```

### **Database Permission Issues**
```bash
# Check MongoDB user permissions
mongo --eval "db.runCommand({connectionStatus: 1})"

# Create MongoDB user if needed
mongo --eval "db.createUser({user: 'luxgen', pwd: 'password', roles: ['readWrite']})"
```

### **Port Conflicts**
```bash
# Check if port 27017 is in use
lsof -i :27017

# Kill process if needed
sudo kill -9 <PID>
```

### **Database Lock Issues**
```bash
# Check for lock files
ls -la /var/lib/mongodb/mongod.lock

# Remove lock file if corrupted
sudo rm /var/lib/mongodb/mongod.lock
```

## 📈 **Performance Monitoring**

### **Database Metrics**
```bash
# Check database stats
mongo luxgen --eval "db.stats()"

# Check collection stats
mongo luxgen --eval "db.users.stats()"

# Check index usage
mongo luxgen --eval "db.users.aggregate([{$indexStats: {}}])"
```

### **Query Performance**
```bash
# Enable query profiling
mongo luxgen --eval "db.setProfilingLevel(2, {slowms: 100})"

# Check slow queries
mongo luxgen --eval "db.system.profile.find().sort({ts: -1}).limit(5)"
```

## 🎯 **Success Criteria**

### **Database Setup**
- ✅ **MongoDB Running**: Service is active and accessible
- ✅ **LuxGen Database**: Database created and accessible
- ✅ **Collections Created**: All required collections exist
- ✅ **Indexes Created**: Performance indexes in place
- ✅ **Sample Data**: Test data seeded successfully

### **Application Integration**
- ✅ **API Endpoints**: All endpoints working with luxgen database
- ✅ **Multi-tenancy**: Proper tenant isolation working
- ✅ **Data Integrity**: All data properly structured
- ✅ **Performance**: Queries executing efficiently

## 📚 **Additional Resources**

### **MongoDB Documentation**
- [MongoDB Manual](https://docs.mongodb.com/manual/)
- [MongoDB Indexes](https://docs.mongodb.com/manual/indexes/)
- [MongoDB Multi-tenancy](https://docs.mongodb.com/manual/core/multi-tenancy/)

### **LuxGen Documentation**
- [Database Structure](./DATABASE_STRUCTURE.md)
- [API Documentation](./API_DOCUMENTATION.md)
- [Deployment Guide](./DEPLOYMENT.md)

---

**🎉 Your LuxGen database is now ready for production use!**
