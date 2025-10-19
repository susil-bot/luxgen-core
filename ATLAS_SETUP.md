# MongoDB Atlas Setup Guide

## 🚀 Quick Start

### 1. Create MongoDB Atlas Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Sign up or log in to your account
3. Create a new cluster (free tier available)
4. Choose your preferred cloud provider and region
5. Create a database user with read/write permissions

### 2. Get Connection String

1. In Atlas dashboard, click "Connect" on your cluster
2. Choose "Connect your application"
3. Select "Node.js" and version "4.1 or later"
4. Copy the connection string
5. Replace `<password>` with your database user password
6. Replace `<dbname>` with your database name (e.g., `luxgen`)

### 3. Configure Environment Variables

Create a `.env` file in the backend root:

```bash
# Atlas Configuration
MONGODB_ATLAS_URI=mongodb+srv://username:password@cluster.mongodb.net/luxgen
USE_ATLAS=true
USE_LOCAL_DB=false

# Multi-tenancy
ENABLE_MULTI_TENANCY=true
ENABLE_TENANT_ISOLATION=true
DEFAULT_TENANT=luxgen

# Security
JWT_SECRET=your-jwt-secret-key-change-in-production
ENCRYPTION_KEY=your-encryption-key-change-in-production

# Environment
NODE_ENV=production
PORT=3001
```

### 4. Test Atlas Connection

```bash
# Test Atlas connection
node src/scripts/test-atlas-connection.js

# Start server with Atlas
USE_ATLAS=true npm start
```

## 🔧 Advanced Configuration

### Atlas-Specific Options

```javascript
// In your .env file
MONGODB_MAX_POOL_SIZE=10
MONGODB_MIN_POOL_SIZE=2
MONGODB_MAX_IDLE_TIME=30000
MONGODB_SERVER_SELECTION_TIMEOUT=10000
MONGODB_CONNECT_TIMEOUT=10000
MONGODB_SOCKET_TIMEOUT=45000
```

### Connection Fallback

The system automatically falls back to local MongoDB if Atlas fails:

1. **Atlas First**: Tries Atlas connection
2. **Local Fallback**: Falls back to local MongoDB if Atlas fails
3. **Error Handling**: Graceful error handling with detailed logging

### Multi-Tenancy with Atlas

The multi-tenancy system works seamlessly with Atlas:

- **Tenant Isolation**: Each tenant's data is isolated using `tenantId` field
- **Database Switching**: Automatic tenant context switching
- **Type Safety**: Full TypeScript support with `TenantConfig` interface
- **Security**: Comprehensive authentication and authorization

## 🛠️ Troubleshooting

### Common Issues

1. **Authentication Failed**
   ```
   Error: bad auth : authentication failed
   ```
   **Solution**: Check username/password in connection string

2. **Network Timeout**
   ```
   Error: MongoServerSelectionError: connect ECONNREFUSED
   ```
   **Solution**: Check network access and IP whitelist in Atlas

3. **SSL/TLS Issues**
   ```
   Error: SSL handshake failed
   ```
   **Solution**: Ensure SSL is enabled in connection options

### Debug Commands

```bash
# Test Atlas connection
node src/scripts/test-atlas-connection.js

# Test local fallback
USE_LOCAL_DB=true npm start

# Check environment variables
env | grep MONGODB
```

## 📊 Performance Optimization

### Connection Pool Settings

```javascript
// Optimal settings for production
const atlasOptions = {
  maxPoolSize: 10,           // Maximum connections
  minPoolSize: 2,            // Minimum connections
  maxIdleTimeMS: 30000,      // Close idle connections after 30s
  serverSelectionTimeoutMS: 10000,  // Server selection timeout
  connectTimeoutMS: 10000,   // Connection timeout
  socketTimeoutMS: 45000     // Socket timeout
};
```

### Multi-Tenant Performance

- **Indexing**: Ensure `tenantId` is indexed for fast queries
- **Connection Pooling**: Shared connection pool for all tenants
- **Caching**: Implement Redis caching for frequently accessed data

## 🔒 Security Best Practices

1. **Network Access**: Whitelist only necessary IP addresses
2. **Database Users**: Create users with minimal required permissions
3. **Connection String**: Store in environment variables, never in code
4. **SSL/TLS**: Always use encrypted connections
5. **Authentication**: Implement proper JWT authentication

## 🚀 Production Deployment

### Environment Variables

```bash
# Production Atlas Configuration
MONGODB_ATLAS_URI=mongodb+srv://prod-user:secure-password@prod-cluster.mongodb.net/luxgen
USE_ATLAS=true
USE_LOCAL_DB=false
NODE_ENV=production

# Security
JWT_SECRET=your-super-secure-jwt-secret-32-chars-minimum
ENCRYPTION_KEY=your-super-secure-encryption-key-32-chars-minimum

# Multi-tenancy
ENABLE_MULTI_TENANCY=true
ENABLE_TENANT_ISOLATION=true
DEFAULT_TENANT=luxgen
```

### Monitoring

- **Connection Health**: Monitor connection pool status
- **Query Performance**: Track slow queries and optimize
- **Tenant Usage**: Monitor tenant-specific resource usage
- **Error Rates**: Track connection errors and timeouts

## 📈 Scaling Considerations

1. **Connection Limits**: Atlas free tier has connection limits
2. **Data Size**: Monitor database size and upgrade as needed
3. **Tenant Growth**: Plan for increasing number of tenants
4. **Geographic Distribution**: Consider multi-region deployment

## 🎯 Multi-Tenancy Features

### Tenant Identification Methods

1. **Header-based**: `X-Tenant-ID: luxgen`
2. **Query Parameter**: `?tenant=luxgen`
3. **Subdomain**: `luxgen.yourdomain.com`
4. **JWT Claims**: Tenant ID in JWT token

### Database Isolation

- **Single Database**: All tenants share one database
- **Tenant ID Field**: Data isolated using `tenantId` field
- **Automatic Filtering**: All queries automatically filtered by tenant
- **Type Safety**: Full TypeScript support with `TenantConfig` interface

### Configuration Management

```typescript
// TenantConfig interface
interface TenantConfig {
  brandSlug: string;
  humanName: string;
  rootBrand: string;
  copilotCode: string;
  siteDomain: {
    production: string;
    staging?: string;
    development?: string;
  };
  organizationGlobalId: {
    production: string;
    staging?: string;
    development?: string;
  };
  organizationSlug: {
    production: string;
    staging?: string;
    development?: string;
  };
  database: {
    name: string;
    url: string;
    options?: DatabaseOptions;
  };
}
```

## ✅ Verification Checklist

- [ ] Atlas cluster created and accessible
- [ ] Database user created with proper permissions
- [ ] Connection string configured correctly
- [ ] Environment variables set properly
- [ ] Local fallback working
- [ ] Multi-tenancy functioning
- [ ] Type safety implemented
- [ ] Security measures in place
- [ ] Performance optimized
- [ ] Monitoring configured

## 🎉 Success!

Your MongoDB Atlas setup is complete and ready for production use with full multi-tenancy support!
