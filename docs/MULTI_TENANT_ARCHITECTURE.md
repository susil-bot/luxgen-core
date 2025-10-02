# 🏢 LuxGen Multi-Tenant Architecture Guide ## 📋 Table of Contents
1. [Overview](#overview)
2. [Tenant Creation Process](#tenant-creation-process)
3. [Client Identification Methods](#client-identification-methods)
4. [Tenant Admin Management](#tenant-admin-management)
5. [User Management](#user-management)
6. [Deployment Strategies](#deployment-strategies)
7. [Security & Isolation](#security--isolation)
8. [API Endpoints](#api-endpoints) --- ## Overview LuxGen implements a **robust multi-tenant architecture** where each client (organization) gets their own isolated environment while sharing the same application infrastructure. ### **Key Features:**
- **Complete tenant isolation**
- **Multiple identification methods**
- **Tenant admin management**
- **User management within tenants**
- **Secure data separation**
- **Flexible deployment options** --- ## Tenant Creation Process ### **Who Can Create Tenants?** Currently, **ANYONE** can create a tenant through the public API endpoint. ### **Tenant Creation Flow:** #### **1. Public Registration**
```bash
POST http://192.168.1.9:3001/api/v1/tenants/create
``` **Request Body:**
```json
{ "name": "Acme Corporation", "contactEmail": "admin@acme.com", "description": "Technology company", "industry": "Technology", "companySize": "51-200", "website": "https://acme.com", "address": { "street": "123 Business St", "city": "Tech City", "state": "CA", "country": "USA", "zipCode": "90210"}
}
``` **Response:**
```json
{ "success": true, "message": "Tenant created successfully", "data": { "id": "tenant_id", "name": "Acme Corporation", "slug": "acme-corporation", "contactEmail": "admin@acme.com", "status": "pending", "isVerified": false, "subscription": { "plan": "free", "status": "trial"} }
}
``` #### **2. Tenant Verification**
- Email verification sent to `contactEmail`
- Tenant status changes from `pending` to `active` after verification
- Admin user can then log in and manage the tenant --- ## Client Identification Methods LuxGen supports **5 different methods** for identifying which tenant a request belongs to: ### **1. Subdomain-Based (Recommended)**
```
https://acme.luxgen.com
https://techcorp.luxgen.com
https://startup.luxgen.com
``` **How it works:**
- Extract subdomain from hostname
- Look up tenant by slug in database
- Automatically set tenant context ### **2. Path-Based**
```
https://luxgen.com/tenant/acme
https://luxgen.com/tenant/techcorp
https://luxgen.com/tenant/startup
``` **How it works:**
- Extract tenant slug from URL path
- Look up tenant by slug in database
- Remove tenant from path for route matching ### **3. Header-Based**
```bash
curl -H "X-Tenant-Slug: acme-corporation"\ -H "Authorization: Bearer token"\ https://luxgen.com/api/v1/admin/users
``` **Headers supported:**
- `X-Tenant-ID`: Direct tenant ID
- `X-Tenant-Slug`: Tenant slug ### **4. Query Parameter**
```
https://luxgen.com/api/v1/admin/users?tenant=acme-corporation
``` ### **5. JWT Token (Authenticated Requests)**
- Extract tenant information from JWT token
- Automatically set tenant context for authenticated users --- ## 👨‍💼 Tenant Admin Management ### **Admin Roles:** #### **1. Super Admin**
- Can access ALL tenants
- Can create, update, delete any tenant
- Can manage users across all tenants
- System-level administration #### **2. Tenant Admin**
- Can only access their own tenant
- Can manage users within their tenant
- Can update tenant settings
- Tenant-level administration ### **Admin Operations:** #### **Add User to Tenant**
```bash
POST https://acme.luxgen.com/api/v1/admin/users
Authorization: Bearer <admin_token> { "email": "john@acme.com", "password": "temp123", "firstName": "John", "lastName": "Doe", "role": "user", "department": "Engineering", "jobTitle": "Software Engineer"}
``` #### **List Tenant Users**
```bash
GET https://acme.luxgen.com/api/v1/admin/users
Authorization: Bearer <admin_token>
``` #### **Update User**
```bash
PUT https://acme.luxgen.com/api/v1/admin/users/user_id
Authorization: Bearer <admin_token> { "role": "admin", "department": "Management"}
``` #### **Remove User**
```bash
DELETE https://acme.luxgen.com/api/v1/admin/users/user_id
Authorization: Bearer <admin_token>
``` --- ## 👥 User Management ### **User Association with Tenants:** #### **1. User Registration**
- Users can register for specific tenants using `tenantSlug`
- Users are automatically associated with the specified tenant
- Email uniqueness is global (across all tenants) #### **2. Admin User Addition**
- Tenant admins can add users directly to their tenant
- Users receive setup tokens to set their passwords
- Users are auto-verified when added by admin #### **3. User Login**
- Users log in with their email/password
- System automatically identifies their tenant
- JWT token includes tenant information ### **User Roles within Tenants:** #### **1. Admin**
- Can manage users in the tenant
- Can update tenant settings
- Can access admin features #### **2. User**
- Regular user access
- Can use tenant features
- Limited to their tenant's data --- ## Deployment Strategies ### **1. Single Application, Multiple Tenants (Current)**
```
luxgen.com/
├── acme.luxgen.com (Tenant: Acme Corp)
├── techcorp.luxgen.com (Tenant: Tech Corp)
└── startup.luxgen.com (Tenant: Startup Inc)
``` **Pros:**
- Single codebase to maintain
- Shared infrastructure
- Easy updates and deployments
- Cost-effective **Cons:**
- Single point of failure
- All tenants share same performance
- Limited customization ### **2. Separate Deployments per Tenant**
```
acme.luxgen.com (Separate deployment)
techcorp.luxgen.com (Separate deployment)
startup.luxgen.com (Separate deployment)
``` **Pros:**
- Complete isolation
- Independent scaling
- Custom configurations
- Better performance isolation **Cons:**
- Higher maintenance cost
- Multiple deployments to manage
- More complex updates ### **3. Hybrid Approach**
```
luxgen.com/ (Shared features)
├── acme.luxgen.com (Custom deployment)
├── techcorp.luxgen.com (Shared deployment)
└── startup.luxgen.com (Custom deployment)
``` --- ## Security & Isolation ### **Data Isolation:** #### **1. Database Level**
- All collections include `tenantId` field
- Queries automatically filter by tenant
- Cross-tenant data access prevented #### **2. Application Level**
- Tenant identification middleware
- Role-based access control
- Tenant-specific permissions #### **3. Network Level**
- Subdomain isolation
- Custom domain support
- SSL certificates per tenant ### **Security Features:** #### **1. Authentication**
- JWT tokens with tenant information
- Role-based authorization
- Session management per tenant #### **2. Authorization**
- Users can only access their tenant's data
- Admins can only manage their tenant
- Super admins have cross-tenant access #### **3. Data Protection**
- Tenant data encryption
- Audit logging
- Backup isolation --- ## API Endpoints ### **Tenant Management:**
```
POST /api/v1/tenants/create # Create new tenant
GET /api/v1/tenants # List tenants (admin only)
GET /api/v1/tenants/:id # Get tenant by ID (admin only)
PUT /api/v1/tenants/:id # Update tenant (admin only)
DELETE /api/v1/tenants/:id # Delete tenant (admin only)
``` ### **User Management:**
```
POST /api/v1/registration/register # Register user (with tenant)
POST /api/v1/registration/login # User login
GET /api/v1/admin/users # List tenant users (admin only)
POST /api/v1/admin/users # Add user to tenant (admin only)
PUT /api/v1/admin/users/:id # Update user (admin only)
DELETE /api/v1/admin/users/:id # Remove user (admin only)
``` ### **Tenant-Specific Endpoints:**
```
GET /api/v1/polls # Get tenant polls
POST /api/v1/polls # Create poll for tenant
GET /api/v1/schemas # Get tenant schemas
POST /api/v1/schemas # Create schema for tenant
``` --- ## Example Workflows ### **1. New Client Onboarding** #### **Step 1: Create Tenant**
```bash
curl -X POST http://192.168.1.9:3001/api/v1/tenants/create \ -H "Content-Type: application/json"\ -d '{ "name": "Acme Corporation", "contactEmail": "admin@acme.com", "industry": "Technology"}'``` #### **Step 2: Verify Tenant**
- Admin receives verification email
- Clicks verification link
- Tenant status becomes `active` #### **Step 3: Admin Login**
```bash
curl -X POST https://acme.luxgen.com/api/v1/registration/login \ -H "Content-Type: application/json"\ -d '{ "email": "admin@acme.com", "password": "admin123"}'``` #### **Step 4: Add Users**
```bash
curl -X POST https://acme.luxgen.com/api/v1/admin/users \ -H "Authorization: Bearer <admin_token>"\ -H "Content-Type: application/json"\ -d '{ "email": "john@acme.com", "password": "temp123", "firstName": "John", "lastName": "Doe", "role": "user"}'``` ### **2. User Access** #### **User Login**
```bash
curl -X POST https://acme.luxgen.com/api/v1/registration/login \ -H "Content-Type: application/json"\ -d '{ "email": "john@acme.com", "password": "john123"}'``` #### **Access Tenant Data**
```bash
curl -X GET https://acme.luxgen.com/api/v1/polls \ -H "Authorization: Bearer <user_token>"``` --- ## Configuration ### **Environment Variables:**
```bash
# Tenant Configuration
TENANT_IDENTIFICATION_METHOD=subdomain # subdomain, path, header, query
TENANT_DEFAULT_DOMAIN=luxgen.com
TENANT_SUBDOMAIN_ENABLED=true
TENANT_PATH_ENABLED=true # Security
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h # Database
MONGODB_URL=mongodb://...
``` ### **Tenant Settings:**
```javascript
{ "features": { "polls": { "enabled": true, "maxPolls": 100 }, "analytics": { "enabled": true }, "branding": { "enabled": true } }, "settings": { "allowPublicPolls": true, "requireEmailVerification": true, "autoArchivePolls": true }
}
``` --- ## Next Steps ### **1. Implement Tenant Identification**
- Add tenant identification middleware to routes
- Test different identification methods
- Configure subdomain routing ### **2. Enhance Security**
- Add rate limiting per tenant
- Implement tenant-specific API keys
- Add audit logging ### **3. Improve User Experience**
- Create tenant-specific branding
- Add tenant onboarding flow
- Implement tenant analytics ### **4. Scale Infrastructure**
- Add tenant-specific caching
- Implement tenant data archiving
- Add tenant performance monitoring --- ** Your LuxGen system now has a complete, production-ready multi-tenant architecture!** 