# LuxGen Trainer Platform - Database Setup & API Documentation ## Database Configuration ### MongoDB Atlas Connection
- **Cluster**: `luxgen-ecommerce.bgrskvi.mongodb.net`
- **Database**: `luxgen_trainer_platform`
- **Username**: `dev`
- **Password**: `ZA7Uzfa0m30NaSoE`
- **Connection String**: `mongodb+srv://dev:ZA7Uzfa0m30NaSoE@luxgen-ecommerce.bgrskvi.mongodb.net/?retryWrites=true&w=majority&appName=luxgen-ecommerce` ### Database Collections
1. **users** - User accounts and authentication
2. **tenants** - Multi-tenant organization data
3. **polls** - Survey and feedback forms
4. **tenantschemas** - Custom form schemas
5. **userdetails** - Extended user profile information
6. **userregistrations** - User registration and onboarding ## Setup Scripts ### Database Setup
```bash
# Run complete database setup
node src/scripts/setupDatabase.js # Clean database (remove all data)
node src/scripts/cleanupDatabase.js # Test API endpoints
node test-api-setup.js
``` ### Manual Database Operations
```bash
# Connect to MongoDB shell
mongosh "mongodb+srv://dev:ZA7Uzfa0m30NaSoE@luxgen-ecommerce.bgrskvi.mongodb.net/luxgen_trainer_platform"# Test connection from Node.js
node test-mongodb.js
``` ## Sample Data Created ### Tenant
- **Name**: LuxGen Training Platform
- **Slug**: luxgen-training
- **Email**: admin@luxgen.com
- **Status**: Active
- **Subscription**: Enterprise plan ### Users
1. **Admin User** - Email: admin@luxgen.com - Role: admin - Status: Active 2. **Regular User** - Email: john.doe@luxgen.com - Role: user - Status: Active ### Poll
- **Title**: Training Program Feedback
- **Type**: Multiple choice + Rating
- **Status**: Draft
- **Channels**: Email ## 🔗 API Endpoints ### Base URL
```
http://localhost:3001/api/v1
``` ### Health & Status
- `GET /health` - Service health check
- `GET /health/db` - Database health check
- `GET /docs` - API documentation ### Tenant Management
- `POST /tenants/create` - Create new tenant
- `GET /tenants` - List all tenants
- `GET /tenants/deleted` - List deleted tenants
- `GET /tenants/:id` - Get tenant by ID
- `GET /tenants/slug/:slug` - Get tenant by slug
- `PUT /tenants/:id` - Update tenant
- `DELETE /tenants/:id` - Soft delete tenant
- `POST /tenants/:id/restore` - Restore deleted tenant
- `GET /tenants/stats` - Get tenant statistics ### User Management
- `POST /registration/register` - Register new user
- `GET /users` - List users
- `GET /users/:id` - Get user by ID
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user ### Poll Management
- `POST /polls` - Create new poll
- `GET /polls` - List polls
- `GET /polls/:id` - Get poll by ID
- `PUT /polls/:id` - Update poll
- `DELETE /polls/:id` - Delete poll
- `POST /polls/:id/responses` - Submit poll response
- `GET /polls/:id/results` - Get poll results ### Schema Management
- `POST /schemas` - Create schema
- `GET /schemas` - List schemas
- `GET /schemas/:id` - Get schema by ID
- `PUT /schemas/:id` - Update schema
- `DELETE /schemas/:id` - Delete schema ## 🏗️ Database Models ### Tenant Model
```javascript
{ name: String, slug: String (unique), contactEmail: String, description: String, industry: String, companySize: String, subscription: { plan: String, status: String, startDate: Date, endDate: Date }, features: Object, status: String, isDeleted: Boolean, deletedAt: Date, deletedBy: ObjectId
}
``` ### User Model
```javascript
{ tenantId: ObjectId, firstName: String, lastName: String, email: String (unique), password: String (hashed), role: String, isActive: Boolean, isVerified: Boolean, lastLogin: Date
}
``` ### Poll Model
```javascript
{ tenantId: ObjectId, createdBy: ObjectId, title: String, description: String, niche: String, targetAudience: [String], questions: [QuestionSchema], channels: [String], status: String, recipients: [RecipientSchema], responses: [ResponseSchema], settings: Object, analytics: Object
}
``` ## Authentication & Security ### JWT Authentication
- Token-based authentication
- Role-based access control
- Tenant isolation ### Password Security
- BCrypt hashing
- Salt rounds: 12
- Secure password validation ### API Security
- Rate limiting: 100 requests per 15 minutes
- CORS configuration
- Helmet security headers
- Input validation and sanitization ## Performance Optimizations ### Database Indexes
- **Users**: email, tenantId, role, isActive
- **Tenants**: slug, contactEmail, status, isDeleted, subscription.status
- **Polls**: tenantId, createdBy, status, category, createdAt
- **Schemas**: tenantId, schemaType, isActive
- **UserDetails**: userId, tenantId, phoneNumber
- **UserRegistration**: email, tenantId, status, createdAt ### Connection Pooling
- Max pool size: 10
- Min pool size: 2
- Connection timeout: 30 seconds
- Socket timeout: 45 seconds ## Testing ### Database Connection Test
```bash
node test-mongodb.js
``` ### API Endpoint Test
```bash
node test-api-setup.js
``` ### Manual Testing
```bash
# Start the server
npm start # Test health endpoint
curl http://localhost:3001/health # Test API documentation
curl http://localhost:3001/docs
``` ## Environment Variables ### Required Environment Variables
```bash
# MongoDB Connection
MONGODB_URL=mongodb+srv://dev:ZA7Uzfa0m30NaSoE@luxgen-ecommerce.bgrskvi.mongodb.net/?retryWrites=true&w=majority&appName=luxgen-ecommerce # Server Configuration
PORT=3001
NODE_ENV=development # JWT Configuration
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=24h # CORS Configuration
CORS_ORIGIN=http://localhost:3000
``` ## 📋 Database Maintenance ### Backup Strategy
- MongoDB Atlas automated backups
- Daily snapshots
- Point-in-time recovery ### Monitoring
- Database health checks
- Connection monitoring
- Performance metrics
- Error logging ### Cleanup Procedures
```bash
# Remove all data
node src/scripts/cleanupDatabase.js # Reset specific collection
node -e "require('dotenv').config(); const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URL, { dbName: 'luxgen_trainer_platform'}).then(async () => { const Model = require('./src/models/ModelName'); await Model.deleteMany({}); console.log('Collection cleaned'); mongoose.disconnect(); });"``` ## 🚨 Troubleshooting ### Common Issues 1. **Connection Failed** - Check MongoDB Atlas network access - Verify connection string - Check credentials 2. **Duplicate Key Errors** - Run cleanup script - Check unique constraints - Verify data integrity 3. **Validation Errors** - Check model schemas - Verify required fields - Check enum values 4. **Index Warnings** - Remove duplicate index definitions - Check schema.index() vs index: true ### Debug Commands
```bash
# Check database connection
node -e "require('dotenv').config(); const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URL, { dbName: 'luxgen_trainer_platform'}).then(() => console.log('Connected')).catch(console.error);"# List collections
node -e "require('dotenv').config(); const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URL, { dbName: 'luxgen_trainer_platform'}).then(async () => { const collections = await mongoose.connection.db.listCollections().toArray(); console.log(collections.map(c => c.name)); mongoose.disconnect(); });"``` ## Additional Resources - [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [Express.js Documentation](https://expressjs.com/)
- [JWT Documentation](https://jwt.io/) --- **Last Updated**: July 26, 2025
**Version**: 1.0.0
**Status**: Production Ready 