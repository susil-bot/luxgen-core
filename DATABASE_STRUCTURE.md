# 🗄️ LuxGen Database Structure & Standards

## 📊 **Database Architecture Overview**

### **Primary Database: `luxgen`**
- **Purpose**: Production database for LuxGen platform
- **Environment**: Development, Staging, Production
- **Multi-tenancy**: Tenant-aware collections with `tenantId` field
- **Backup Strategy**: Daily automated backups
- **Monitoring**: Real-time performance monitoring

### **Database Collections Structure**

```
luxgen/
├── users/                    # User management
├── tenants/                  # Multi-tenant configuration
├── tenant_configurations/    # Tenant-specific settings
├── brand_identities/         # Brand identity configurations
├── training_courses/         # Training content
├── training_sessions/        # Training sessions
├── training_modules/         # Training modules
├── training_assessments/     # Training assessments
├── presentations/            # Presentation content
├── polls/                    # Polling system
├── groups/                   # Group management
├── notifications/            # Notification system
├── audit_logs/               # System audit trail
├── posts/                    # Social feed posts
├── comments/                 # Post comments
├── likes/                    # Post likes/reactions
├── messages/                 # Direct messages
├── conversations/            # Message conversations
├── jobs/                     # Job postings
├── job_applications/         # Job applications
├── candidate_profiles/       # Candidate profiles
└── sessions/                 # User sessions
```

## 🏗️ **Collection Standards**

### **1. Core Collections**

#### **Users Collection**
```javascript
{
  _id: ObjectId,
  tenantId: String,           // REQUIRED: Tenant identifier
  firstName: String,
  lastName: String,
  email: String,              // UNIQUE per tenant
  password: String,            // Hashed
  roles: [String],            // ['super_admin', 'admin', 'trainer', 'user']
  status: String,             // 'active', 'inactive', 'suspended'
  avatar: String,
  preferences: Object,
  lastLoginAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### **Tenants Collection**
```javascript
{
  _id: ObjectId,
  slug: String,              // UNIQUE: URL-friendly identifier
  name: String,
  domain: String,             // Custom domain
  settings: {
    features: Object,
    limits: Object,
    branding: Object
  },
  status: String,             // 'active', 'inactive', 'suspended'
  createdAt: Date,
  updatedAt: Date
}
```

### **2. Training Collections**

#### **Training Courses**
```javascript
{
  _id: ObjectId,
  tenantId: String,           // REQUIRED
  title: String,
  description: String,
  instructorId: ObjectId,      // Reference to User
  category: String,
  difficulty: String,
  duration: Number,            // in minutes
  modules: [ObjectId],        // References to TrainingModule
  status: String,             // 'draft', 'published', 'archived'
  metadata: Object,
  createdAt: Date,
  updatedAt: Date
}
```

### **3. Social Feed Collections**

#### **Posts Collection**
```javascript
{
  _id: ObjectId,
  tenantId: String,           // REQUIRED
  author: {
    userId: ObjectId,         // Reference to User
    name: String,
    title: String,
    avatar: String,
    verified: Boolean
  },
  content: {
    text: String,
    images: [String],
    videos: [String],
    links: [Object]
  },
  engagement: {
    likes: Number,
    comments: Number,
    shares: Number,
    views: Number
  },
  visibility: {
    type: String,             // 'public', 'connections', 'private'
    audience: [String]
  },
  hashtags: [String],
  mentions: [ObjectId],       // References to User
  status: String,             // 'published', 'draft', 'archived', 'deleted'
  createdAt: Date,
  updatedAt: Date
}
```

### **4. Job Board Collections**

#### **Jobs Collection**
```javascript
{
  _id: ObjectId,
  tenantId: String,           // REQUIRED
  title: String,
  company: String,
  location: String,
  description: String,
  requirements: [String],
  responsibilities: [String],
  benefits: [String],
  salary: {
    min: Number,
    max: Number,
    currency: String,
    isNegotiable: Boolean
  },
  employmentType: String,     // 'full-time', 'part-time', 'contract'
  experienceLevel: String,    // 'entry-level', 'associate', 'mid-senior'
  industry: String,
  skillsRequired: [String],
  status: String,             // 'open', 'closed', 'draft', 'filled'
  postedBy: ObjectId,         // Reference to User
  applicants: [ObjectId],     // References to JobApplication
  createdAt: Date,
  updatedAt: Date
}
```

## 🔧 **Database Standards**

### **1. Naming Conventions**
- **Collections**: `snake_case` (e.g., `training_courses`)
- **Fields**: `camelCase` (e.g., `firstName`, `createdAt`)
- **Indexes**: `field_1_tenantId_1` (e.g., `email_1_tenantId_1`)
- **References**: `fieldId` (e.g., `userId`, `tenantId`)

### **2. Required Fields**
Every collection MUST have:
- `tenantId: String` - For multi-tenancy
- `createdAt: Date` - Creation timestamp
- `updatedAt: Date` - Last update timestamp

### **3. Indexing Strategy**
```javascript
// Primary indexes for performance
{ tenantId: 1, createdAt: -1 }        // Most queries
{ tenantId: 1, status: 1 }             // Status filtering
{ tenantId: 1, userId: 1 }             // User-specific queries
{ tenantId: 1, email: 1 }              // Unique constraints
{ tenantId: 1, slug: 1 }               // Unique slugs
```

### **4. Data Validation**
- **Required Fields**: All required fields must be validated
- **Unique Constraints**: Email per tenant, slug uniqueness
- **Data Types**: Strict type validation
- **Business Rules**: Custom validation rules

## 🚀 **Migration Strategy**

### **Phase 1: Database Setup**
1. **Create luxgen database**
2. **Set up collections with proper schemas**
3. **Create indexes for performance**
4. **Set up data validation**

### **Phase 2: Data Migration**
1. **Migrate existing data from test database**
2. **Validate data integrity**
3. **Update all connections to use luxgen**
4. **Test all functionality**

### **Phase 3: Seeding & Testing**
1. **Create comprehensive seed scripts**
2. **Test all API endpoints**
3. **Validate multi-tenancy**
4. **Performance testing**

## 📋 **Implementation Checklist**

### **Database Setup**
- [ ] Create luxgen database
- [ ] Set up collections with schemas
- [ ] Create performance indexes
- [ ] Set up data validation
- [ ] Configure connection pooling

### **Data Migration**
- [ ] Migrate users from test to luxgen
- [ ] Migrate tenants and configurations
- [ ] Migrate training data
- [ ] Migrate job board data
- [ ] Validate data integrity

### **Application Updates**
- [ ] Update all database connections
- [ ] Update environment variables
- [ ] Update seed scripts
- [ ] Update API endpoints
- [ ] Update frontend connections

### **Testing & Validation**
- [ ] Test all API endpoints
- [ ] Test multi-tenancy
- [ ] Test data integrity
- [ ] Performance testing
- [ ] Load testing

## 🔒 **Security & Compliance**

### **Data Protection**
- **Encryption**: Sensitive data encryption at rest
- **Access Control**: Role-based access control
- **Audit Trail**: Complete audit logging
- **Backup**: Automated daily backups
- **Retention**: Data retention policies

### **Multi-tenancy Security**
- **Tenant Isolation**: Strict tenant data separation
- **Cross-tenant Protection**: Prevent cross-tenant data access
- **API Security**: Tenant-aware API endpoints
- **Authentication**: Tenant-aware authentication

## 📊 **Monitoring & Maintenance**

### **Performance Monitoring**
- **Query Performance**: Monitor slow queries
- **Index Usage**: Monitor index effectiveness
- **Connection Pooling**: Monitor connection usage
- **Memory Usage**: Monitor memory consumption

### **Maintenance Tasks**
- **Daily**: Automated backups
- **Weekly**: Index optimization
- **Monthly**: Data cleanup
- **Quarterly**: Performance review

## 🎯 **Success Criteria**

### **Database Performance**
- ✅ **Query Response**: < 100ms for simple queries
- ✅ **Index Coverage**: 100% of queries use indexes
- ✅ **Connection Pool**: Efficient connection usage
- ✅ **Data Integrity**: 100% data consistency

### **Application Integration**
- ✅ **API Endpoints**: All endpoints working
- ✅ **Multi-tenancy**: Proper tenant isolation
- ✅ **Data Migration**: 100% data migrated
- ✅ **Frontend Integration**: All features working

This structure ensures a robust, scalable, and maintainable database architecture for the LuxGen platform.
