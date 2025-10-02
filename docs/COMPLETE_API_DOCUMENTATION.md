# LuxGen Trainer Platform - Complete API Documentation ## Overview The LuxGen Trainer Platform provides a comprehensive REST API for managing training sessions, users, tenants, and multi-tenancy features. The API is built with Node.js, Express, and MongoDB Atlas. ## Base Configuration - **Base URL**: `http://localhost:3001` (development)
- **API Version**: `v1`
- **API Prefix**: `/api/v1`
- **Authentication**: JWT Bearer Token
- **Content-Type**: `application/json` ## Authentication ### Register User
```http
POST /api/v1/auth/v2/register
Content-Type: application/json { "email": "user@example.com", "username": "username", "password": "password123", "firstName": "John", "lastName": "Doe"}
``` **Response:**
```json
{ "success": true, "user": { "_id": "user_id", "email": "user@example.com", "username": "username", "firstName": "John", "lastName": "Doe", "role": "user", "status": "active", "createdAt": "2024-01-15T10:30:00.000Z"}
}
``` ### Login User
```http
POST /api/v1/auth/v2/login
Content-Type: application/json { "email": "user@example.com", "password": "password123", "tenantId": "optional_tenant_id"}
``` **Response:**
```json
{ "success": true, "user": { "_id": "user_id", "email": "user@example.com", "username": "username", "role": "user", "tenantId": "tenant_id"}, "tokens": { "accessToken": "jwt_access_token", "refreshToken": "jwt_refresh_token", "expiresIn": "24h"}
}
``` ### Get User Profile
```http
GET /api/v1/auth/v2/profile
Authorization: Bearer <access_token>
``` ### Update User Profile
```http
PUT /api/v1/auth/v2/profile
Authorization: Bearer <access_token>
Content-Type: application/json { "firstName": "John", "lastName": "Doe", "bio": "Updated bio", "preferences": { "theme": "dark", "notifications": true, "language": "en"}
}
``` ### Change Password
```http
POST /api/v1/auth/v2/change-password
Authorization: Bearer <access_token>
Content-Type: application/json { "currentPassword": "old_password", "newPassword": "new_password"}
``` ### Logout
```http
POST /api/v1/auth/v2/logout
Authorization: Bearer <access_token>
Content-Type: application/json { "refreshToken": "refresh_token"}
``` ### Refresh Token
```http
POST /api/v1/auth/v2/refresh
Content-Type: application/json { "refreshToken": "refresh_token"}
``` ## User Management ### Get All Users
```http
GET /api/v1/users/v2?page=1&limit=10&role=user&status=active&search=john
Authorization: Bearer <access_token>
``` **Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `tenantId`: Filter by tenant ID
- `role`: Filter by role (admin, user, trainer, moderator)
- `status`: Filter by status (active, inactive, suspended, pending)
- `search`: Search in name, email, username
- `sortBy`: Sort field (default: createdAt)
- `sortOrder`: Sort order (-1 for desc, 1 for asc) **Response:**
```json
{ "success": true, "users": [ { "_id": "user_id", "email": "user@example.com", "username": "username", "firstName": "John", "lastName": "Doe", "role": "user", "status": "active", "tenantId": "tenant_id", "createdAt": "2024-01-15T10:30:00.000Z"} ], "pagination": { "page": 1, "limit": 10, "total": 25, "pages": 3 }
}
``` ### Get User by ID
```http
GET /api/v1/users/v2/:userId
Authorization: Bearer <access_token>
``` ### Update User
```http
PUT /api/v1/users/v2/:userId
Authorization: Bearer <access_token>
Content-Type: application/json { "firstName": "John", "lastName": "Doe", "role": "trainer", "status": "active"}
``` ### Delete User
```http
DELETE /api/v1/users/v2/:userId
Authorization: Bearer <access_token>
``` ### Change User Status
```http
PATCH /api/v1/users/v2/:userId/status
Authorization: Bearer <access_token>
Content-Type: application/json { "status": "suspended"}
``` ### Change User Role
```http
PATCH /api/v1/users/v2/:userId/role
Authorization: Bearer <access_token>
Content-Type: application/json { "role": "admin"}
``` ### Assign User to Tenant
```http
PATCH /api/v1/users/v2/:userId/tenant
Authorization: Bearer <access_token>
Content-Type: application/json { "tenantId": "tenant_id"}
``` ### Get Users by Tenant
```http
GET /api/v1/users/v2/tenant/:tenantId
Authorization: Bearer <access_token>
``` ### Search Users
```http
GET /api/v1/users/v2/search/query?q=search_term
Authorization: Bearer <access_token>
``` ### Get User Statistics
```http
GET /api/v1/users/v2/stats/overview?tenantId=tenant_id
Authorization: Bearer <access_token>
``` **Response:**
```json
{ "success": true, "stats": { "total": 100, "active": 85, "inactive": 10, "suspended": 5, "admins": 5, "trainers": 20, "users": 75 }
}
``` ### Bulk Update Users
```http
PATCH /api/v1/users/v2/bulk/update
Authorization: Bearer <access_token>
Content-Type: application/json { "userIds": ["user_id_1", "user_id_2"], "updateData": { "status": "active", "role": "user"}
}
``` ### Export Users Data
```http
GET /api/v1/users/v2/export/data?format=json&tenantId=tenant_id
Authorization: Bearer <access_token>
``` ### Get User Activity
```http
GET /api/v1/users/v2/:userId/activity?limit=10
Authorization: Bearer <access_token>
``` ### Get User Sessions
```http
GET /api/v1/users/v2/:userId/sessions
Authorization: Bearer <access_token>
``` ## Tenant Management ### Create Tenant
```http
POST /api/v1/tenants/v2
Authorization: Bearer <access_token>
Content-Type: application/json { "name": "Acme Corporation", "subdomain": "acme", "description": "Training platform for Acme Corp", "theme": "default", "features": { "aiAssistant": true, "realTimeCollaboration": true, "advancedAnalytics": true, "multiTenancy": true }, "branding": { "logo": "logo_url", "primaryColor": "#3B82F6", "secondaryColor": "#1E40AF"}, "limits": { "maxUsers": 100, "maxStorage": 1024, "maxSessions": 50 }
}
``` ### Get All Tenants
```http
GET /api/v1/tenants/v2?page=1&limit=10&status=active&search=acme
Authorization: Bearer <access_token>
``` ### Get Tenant by ID
```http
GET /api/v1/tenants/v2/:tenantId
Authorization: Bearer <access_token>
``` ### Get Tenant by Subdomain
```http
GET /api/v1/tenants/v2/subdomain/:subdomain
``` ### Update Tenant
```http
PUT /api/v1/tenants/v2/:tenantId
Authorization: Bearer <access_token>
Content-Type: application/json { "name": "Updated Name", "description": "Updated description", "status": "active"}
``` ### Delete Tenant
```http
DELETE /api/v1/tenants/v2/:tenantId
Authorization: Bearer <access_token>
``` ### Change Tenant Status
```http
PATCH /api/v1/tenants/v2/:tenantId/status
Authorization: Bearer <access_token>
Content-Type: application/json { "status": "suspended"}
``` ### Update Tenant Settings
```http
PATCH /api/v1/tenants/v2/:tenantId/settings
Authorization: Bearer <access_token>
Content-Type: application/json { "settings": { "theme": "dark", "features": { "aiAssistant": false, "realTimeCollaboration": true } }
}
``` ### Update Tenant Limits
```http
PATCH /api/v1/tenants/v2/:tenantId/limits
Authorization: Bearer <access_token>
Content-Type: application/json { "limits": { "maxUsers": 200, "maxStorage": 2048, "maxSessions": 100 }
}
``` ### Get Tenant Statistics
```http
GET /api/v1/tenants/v2/:tenantId/stats
Authorization: Bearer <access_token>
``` **Response:**
```json
{ "success": true, "stats": { "totalUsers": 50, "activeUsers": 45, "tenant": { "name": "Acme Corporation", "subdomain": "acme", "status": "active", "createdAt": "2024-01-15T10:30:00.000Z", "limits": { "maxUsers": 100, "maxStorage": 1024, "maxSessions": 50 } } }
}
``` ### Get All Tenant Statistics
```http
GET /api/v1/tenants/v2/stats/overview
Authorization: Bearer <access_token>
``` ### Search Tenants
```http
GET /api/v1/tenants/v2/search/query?q=search_term
Authorization: Bearer <access_token>
``` ### Export Tenants Data
```http
GET /api/v1/tenants/v2/export/data?format=csv
Authorization: Bearer <access_token>
``` ### Get Tenant Users
```http
GET /api/v1/tenants/v2/:tenantId/users
Authorization: Bearer <access_token>
``` ### Get Tenant Activity
```http
GET /api/v1/tenants/v2/:tenantId/activity?limit=10
Authorization: Bearer <access_token>
``` ## Health & Status Endpoints ### Service Health Check
```http
GET /health
``` ### Database Status
```http
GET /api/database/status
``` ### MongoDB Status
```http
GET /api/mongodb/status
``` ### Detailed Health Check
```http
GET /health/detailed
``` ## Error Responses All endpoints return consistent error responses: ```json
{ "success": false, "message": "Error description", "errors": [ { "field": "email", "message": "Email is required"} ], "timestamp": "2024-01-15T10:30:00.000Z"}
``` ## HTTP Status Codes - `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `500` - Internal Server Error ## Authentication & Authorization ### JWT Token Structure
```json
{ "userId": "user_id", "email": "user@example.com", "role": "user", "tenantId": "tenant_id", "iat": 1642248000, "exp": 1642334400
}
``` ### Role-Based Access Control - **admin**: Full access to all endpoints
- **trainer**: Access to training-related endpoints
- **moderator**: Limited administrative access
- **user**: Basic user access ### Required Headers ```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
``` ## Rate Limiting - **Default**: 100 requests per 15 minutes per IP
- **Authentication**: 5 attempts per 15 minutes per IP
- **Bulk Operations**: 10 requests per hour per user ## Pagination All list endpoints support pagination: ```http
GET /api/v1/users/v2?page=2&limit=20&sortBy=createdAt&sortOrder=-1
``` **Response:**
```json
{ "success": true, "data": [...], "pagination": { "page": 2, "limit": 20, "total": 100, "pages": 5 }
}
``` ## Search & Filtering ### Text Search
```http
GET /api/v1/users/v2/search/query?q=john
``` ### Advanced Filtering
```http
GET /api/v1/users/v2?role=admin&status=active&createdAt[gte]=2024-01-01
``` ## Data Export ### JSON Export
```http
GET /api/v1/users/v2/export/data?format=json
``` ### CSV Export
```http
GET /api/v1/users/v2/export/data?format=csv
``` ## Webhooks (Future Feature) ```http
POST /api/v1/webhooks/events
Content-Type: application/json { "event": "user.created", "data": { "userId": "user_id", "email": "user@example.com"}, "timestamp": "2024-01-15T10:30:00.000Z"}
``` ## SDK Examples ### JavaScript/Node.js
```javascript
const axios = require('axios'); const api = axios.create({ baseURL: 'http://localhost:3001/api/v1', headers: { 'Content-Type': 'application/json'}
}); // Add auth token
api.defaults.headers.common['Authorization'] = `Bearer ${token}`; // Register user
const user = await api.post('/auth/v2/register', { email: 'user@example.com', username: 'username', password: 'password123', firstName: 'John', lastName: 'Doe'});
``` ### Python
```python
import requests base_url = 'http://localhost:3001/api/v1'headers = { 'Content-Type': 'application/json', 'Authorization': f'Bearer {token}'} # Get users
response = requests.get(f'{base_url}/users/v2', headers=headers)
users = response.json()
``` ### cURL Examples ```bash
# Register user
curl -X POST http://localhost:3001/api/v1/auth/v2/register \ -H "Content-Type: application/json"\ -d '{ "email": "user@example.com", "username": "username", "password": "password123", "firstName": "John", "lastName": "Doe"}'# Login
curl -X POST http://localhost:3001/api/v1/auth/v2/login \ -H "Content-Type: application/json"\ -d '{ "email": "user@example.com", "password": "password123"}'# Get users (with auth)
curl -X GET http://localhost:3001/api/v1/users/v2 \ -H "Authorization: Bearer <token>"``` ## Testing ### Run API Test Suite
```bash
node src/scripts/api-test-suite.js
``` ### Test MongoDB Connection
```bash
node src/scripts/test-mongodb-connection.js
``` ## Deployment ### Environment Variables
```bash
NODE_ENV=production
PORT=3001
JWT_SECRET=your_jwt_secret
MONGODB_ATLAS_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
``` ### Docker Deployment
```bash
docker build -t luxgen-backend .
docker run -p 3001:3001 luxgen-backend
``` ## Support For API support and questions:
- **Documentation**: `/api/docs`
- **Health Check**: `/health`
- **Status**: `/api/database/status` ## Changelog ### v1.0.0 (2024-01-15)
- Initial API release
- User authentication and management
- Tenant management
- Multi-tenancy support
- MongoDB Atlas integration
- Comprehensive testing suite
