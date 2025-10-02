# Environment Configuration Guide ## Overview This guide explains how to properly configure environment variables for the LuxGen Trainer Platform backend. All hardcoded values have been removed and replaced with configurable environment variables. ## Required Environment Variables ### Database Configuration
```bash
# MongoDB Atlas URI (REQUIRED)
MONGODB_ATLAS_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority&appName=Cluster0 # MongoDB Connection Pool Settings
MONGODB_MAX_POOL_SIZE=20
MONGODB_MIN_POOL_SIZE=5
MONGODB_MAX_IDLE_TIME=30000
MONGODB_SERVER_SELECTION_TIMEOUT=5000
MONGODB_CONNECT_TIMEOUT=10000
MONGODB_SOCKET_TIMEOUT=45000
MONGODB_MAX_RETRIES=3
``` ### Authentication & Security
```bash
# JWT Secret (REQUIRED - must be at least 32 characters)
JWT_SECRET=your_super_secure_jwt_secret_key_here_minimum_32_characters_long
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d # Password Hashing
BCRYPT_ROUNDS=12
``` ### Admin User Configuration
```bash
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=secure_admin_password_here
ADMIN_USERNAME=admin
ADMIN_FIRST_NAME=System
ADMIN_LAST_NAME=Administrator
ADMIN_BIO=System Administrator
ADMIN_THEME=light
ADMIN_NOTIFICATIONS=true
ADMIN_LANGUAGE=en
``` ### Default Tenant Configuration
```bash
DEFAULT_TENANT_NAME=Default Organization
DEFAULT_TENANT_SUBDOMAIN=default
DEFAULT_TENANT_DESCRIPTION=Default organization for the LuxGen Trainer Platform
DEFAULT_TENANT_THEME=default
DEFAULT_FEATURE_AI_ASSISTANT=true
DEFAULT_FEATURE_REAL_TIME=true
DEFAULT_FEATURE_ANALYTICS=true
DEFAULT_FEATURE_MULTI_TENANCY=true
DEFAULT_MAX_USERS=1000
DEFAULT_MAX_STORAGE=10240
DEFAULT_MAX_SESSIONS=500
``` ## Development Environment Create a `.env` file in the root directory with these development settings: ```bash
# Application
NODE_ENV=development
PORT=3001 # Database
MONGODB_ATLAS_URI=mongodb+srv://your_username:your_password@cluster.mongodb.net/database?retryWrites=true&w=majority&appName=Cluster0 # Security (Development)
JWT_SECRET=development_jwt_secret_change_in_production_minimum_32_characters
BCRYPT_ROUNDS=10 # Admin User (Development)
ADMIN_EMAIL=admin@luxgen.com
ADMIN_PASSWORD=admin123
ADMIN_USERNAME=admin
ADMIN_FIRST_NAME=Admin
ADMIN_LAST_NAME=User # Default Tenant (Development)
DEFAULT_TENANT_NAME=Development Tenant
DEFAULT_TENANT_SUBDOMAIN=dev
DEFAULT_MAX_USERS=100
DEFAULT_MAX_STORAGE=1024
DEFAULT_MAX_SESSIONS=50 # CORS (Development)
CORS_ORIGIN=http://localhost:3000,http://localhost:3001 # Logging (Development)
LOG_LEVEL=debug
LOG_FORMAT=combined
``` ## Production Environment For production, use these secure settings: ```bash
# Application
NODE_ENV=production
PORT=3001 # Database
MONGODB_ATLAS_URI=mongodb+srv://your_username:your_password@cluster.mongodb.net/database?retryWrites=true&w=majority&appName=Cluster0 # Security (Production)
JWT_SECRET=your_super_secure_jwt_secret_key_here_minimum_32_characters_long
BCRYPT_ROUNDS=12 # Admin User (Production)
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=secure_admin_password_here
ADMIN_USERNAME=admin
ADMIN_FIRST_NAME=System
ADMIN_LAST_NAME=Administrator # Default Tenant (Production)
DEFAULT_TENANT_NAME=Your Organization
DEFAULT_TENANT_SUBDOMAIN=yourorg
DEFAULT_MAX_USERS=1000
DEFAULT_MAX_STORAGE=10240
DEFAULT_MAX_SESSIONS=500 # CORS (Production)
CORS_ORIGIN=https://yourdomain.com,https://app.yourdomain.com # Logging (Production)
LOG_LEVEL=info
LOG_FORMAT=json # Security Headers
ENABLE_CSP=true
ENABLE_HSTS=true
ENABLE_XSS_PROTECTION=true
ENABLE_CONTENT_TYPE_NOSNIFF=true
``` ## Security Best Practices ### 1. JWT Secret
- Must be at least 32 characters long
- Use a cryptographically secure random string
- Never use the same secret across environments
- Rotate regularly in production ### 2. Database Credentials
- Use strong passwords
- Limit database user permissions
- Enable IP whitelisting in MongoDB Atlas
- Use connection string with SSL/TLS ### 3. Admin Credentials
- Use strong passwords for admin accounts
- Change default credentials immediately
- Use environment-specific credentials
- Never commit credentials to version control ### 4. Environment Variables
- Never commit `.env` files to version control
- Use different values for each environment
- Validate required variables at startup
- Use secure secret management in production ## Validation The application validates environment variables at startup: ```javascript
// JWT Secret validation
if (process.env.NODE_ENV === 'production'&& this.jwtSecret.length < 32) { throw new Error('JWT_SECRET must be at least 32 characters long in production');
} // MongoDB URI validation
if (!uri) { throw new Error('MongoDB URI is required. Please set MONGODB_ATLAS_URI or MONGODB_URI environment variable.');
}
``` ## Troubleshooting ### Common Issues 1. **MongoDB Connection Failed** - Check MONGODB_ATLAS_URI format - Verify credentials and IP whitelisting - Test connection with: `npm run mongodb:test` 2. **JWT Secret Too Short** - Ensure JWT_SECRET is at least 32 characters - Use a secure random string generator 3. **Admin User Creation Failed** - Check ADMIN_EMAIL and ADMIN_PASSWORD - Verify database connection - Check for existing admin user 4. **Environment Variables Not Loading** - Ensure `.env` file is in the root directory - Check file permissions - Verify variable names match exactly ### Debug Commands ```bash
# Test MongoDB connection
npm run mongodb:test # Check environment variables
node -e "console.log(process.env.MONGODB_ATLAS_URI)"# Validate configuration
npm run startup:complete
``` ## Migration from Hardcoded Values If you're upgrading from a version with hardcoded values: 1. **Backup your data** before making changes
2. **Set environment variables** as shown above
3. **Test the connection** with the test scripts
4. **Update your deployment** to use environment variables
5. **Remove hardcoded values** from your codebase ## Examples ### Docker Environment
```bash
# docker-compose.yml
environment: - NODE_ENV=production - MONGODB_ATLAS_URI=mongodb+srv://user:pass@cluster.mongodb.net/db - JWT_SECRET=your_secure_jwt_secret_here - ADMIN_EMAIL=admin@yourdomain.com - ADMIN_PASSWORD=secure_password
``` ### Kubernetes Environment
```yaml
# k8s-secret.yaml
apiVersion: v1
kind: Secret
metadata: name: luxgen-secrets
type: Opaque
data: mongodb-uri: <base64-encoded-uri> jwt-secret: <base64-encoded-secret> admin-password: <base64-encoded-password>
``` This configuration guide ensures your LuxGen Trainer Platform backend is secure, configurable, and production-ready without any hardcoded values.
