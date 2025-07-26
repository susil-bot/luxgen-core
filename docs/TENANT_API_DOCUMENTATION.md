# Tenant API Documentation

This document describes the complete tenant management API endpoints with soft deletion functionality.

## Base URL
```
http://localhost:3000/api/tenants
```

## Authentication
Most endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints Overview

### 1. Tenant Creation
- **POST** `/create` - Create a new tenant

### 2. Tenant Listing & Retrieval
- **GET** `/` - Get all tenants (with pagination and filtering)
- **GET** `/deleted` - Get all deleted tenants
- **GET** `/:id` - Get tenant by ID
- **GET** `/slug/:slug` - Get tenant by slug

### 3. Tenant Updates
- **PUT** `/:id` - Update tenant information

### 4. Tenant Deletion & Restoration
- **DELETE** `/:id` - Soft delete tenant (or permanent delete with query param)
- **POST** `/:id/restore` - Restore deleted tenant

### 5. Bulk Operations
- **POST** `/bulk/update` - Bulk update tenants
- **POST** `/bulk/delete` - Bulk soft delete tenants
- **POST** `/bulk/restore` - Bulk restore deleted tenants

### 6. Statistics & Analytics
- **GET** `/stats` - Get overall tenant statistics
- **GET** `/:id/stats` - Get individual tenant statistics

### 7. Verification
- **GET** `/verify/:token` - Verify tenant email
- **POST** `/:id/resend-verification` - Resend verification email

### 8. Subscription & Features
- **PUT** `/:id/subscription` - Update tenant subscription
- **PUT** `/:id/features` - Update tenant features

### 9. Export & Search
- **GET** `/export/csv` - Export tenants to CSV
- **GET** `/search/advanced` - Advanced tenant search
- **GET** `/analytics/overview` - Tenant analytics

## Detailed Endpoint Documentation

### 1. Create Tenant
**POST** `/create`

Create a new tenant account.

**Request Body:**
```json
{
  "name": "Company Name",
  "contactEmail": "contact@company.com",
  "description": "Company description",
  "industry": "Technology",
  "companySize": "11-50",
  "website": "https://company.com",
  "address": {
    "street": "123 Main St",
    "city": "City",
    "state": "State",
    "country": "Country",
    "zipCode": "12345"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tenant created successfully",
  "data": {
    "id": "tenant_id",
    "name": "Company Name",
    "slug": "company-name",
    "contactEmail": "contact@company.com",
    "status": "pending",
    "isVerified": false,
    "subscription": {
      "plan": "free",
      "status": "trial"
    }
  }
}
```

### 2. Get All Tenants
**GET** `/`

Get all tenants with pagination and filtering.

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 10) - Items per page
- `status` (string) - Filter by status (active, inactive, suspended, pending)
- `subscriptionStatus` (string) - Filter by subscription status
- `industry` (string) - Filter by industry
- `companySize` (string) - Filter by company size
- `search` (string) - Search in name, email, or slug
- `sortBy` (string, default: createdAt) - Sort field
- `sortOrder` (string, default: desc) - Sort order (asc/desc)
- `includeDeleted` (boolean, default: false) - Include deleted tenants

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "tenant_id",
      "name": "Company Name",
      "slug": "company-name",
      "contactEmail": "contact@company.com",
      "status": "active",
      "isVerified": true,
      "isDeleted": false,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### 3. Get Deleted Tenants
**GET** `/deleted`

Get all soft-deleted tenants.

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 10) - Items per page
- `sortBy` (string, default: deletedAt) - Sort field
- `sortOrder` (string, default: desc) - Sort order

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "tenant_id",
      "name": "Deleted Company",
      "slug": "deleted-company",
      "contactEmail": "contact@deleted.com",
      "isDeleted": true,
      "deletedAt": "2024-01-01T00:00:00.000Z",
      "deletedBy": {
        "id": "user_id",
        "name": "Admin User",
        "email": "admin@example.com"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

### 4. Get Tenant by ID
**GET** `/:id`

Get a specific tenant by ID.

**Query Parameters:**
- `includeDeleted` (boolean, default: false) - Include deleted tenants

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "tenant_id",
    "name": "Company Name",
    "slug": "company-name",
    "contactEmail": "contact@company.com",
    "description": "Company description",
    "status": "active",
    "isVerified": true,
    "isDeleted": false,
    "subscription": {
      "plan": "professional",
      "status": "active",
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-02-01T00:00:00.000Z"
    },
    "features": {
      "polls": { "enabled": true, "maxPolls": 100 },
      "analytics": { "enabled": true },
      "branding": { "enabled": true }
    },
    "usage": {
      "pollsCreated": 15,
      "totalRecipients": 500,
      "totalResponses": 350,
      "lastActivity": "2024-01-15T00:00:00.000Z"
    }
  }
}
```

### 5. Update Tenant
**PUT** `/:id`

Update tenant information.

**Request Body:**
```json
{
  "name": "Updated Company Name",
  "description": "Updated description",
  "industry": "Updated Industry",
  "status": "active"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tenant updated successfully",
  "data": {
    "id": "tenant_id",
    "name": "Updated Company Name",
    "description": "Updated description",
    "industry": "Updated Industry",
    "status": "active"
  }
}
```

### 6. Soft Delete Tenant
**DELETE** `/:id`

Soft delete a tenant (sets isDeleted flag).

**Query Parameters:**
- `permanent` (boolean, default: false) - Permanently delete if true

**Response:**
```json
{
  "success": true,
  "message": "Tenant soft deleted successfully",
  "data": {
    "id": "tenant_id",
    "name": "Company Name",
    "deletedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 7. Restore Tenant
**POST** `/:id/restore`

Restore a soft-deleted tenant.

**Response:**
```json
{
  "success": true,
  "message": "Tenant restored successfully",
  "data": {
    "id": "tenant_id",
    "name": "Company Name",
    "slug": "company-name",
    "isDeleted": false
  }
}
```

### 8. Bulk Operations

#### Bulk Update
**POST** `/bulk/update`

**Request Body:**
```json
{
  "tenantIds": ["id1", "id2", "id3"],
  "updates": {
    "status": "active",
    "industry": "Technology"
  }
}
```

#### Bulk Delete
**POST** `/bulk/delete`

**Request Body:**
```json
{
  "tenantIds": ["id1", "id2", "id3"],
  "permanent": false
}
```

#### Bulk Restore
**POST** `/bulk/restore`

**Request Body:**
```json
{
  "tenantIds": ["id1", "id2", "id3"]
}
```

### 9. Get Statistics
**GET** `/stats`

Get overall tenant statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalTenants": 100,
      "activeTenants": 85,
      "verifiedTenants": 90,
      "deletedTenants": 5,
      "totalPolls": 1500,
      "totalRecipients": 50000,
      "totalResponses": 35000,
      "avgResponseRate": 0.7
    },
    "subscriptions": [
      { "_id": "free", "count": 20 },
      { "_id": "basic", "count": 30 },
      { "_id": "professional", "count": 40 },
      { "_id": "enterprise", "count": 10 }
    ],
    "industries": [
      { "_id": "Technology", "count": 25 },
      { "_id": "Healthcare", "count": 15 },
      { "_id": "Finance", "count": 10 }
    ]
  }
}
```

## Soft Deletion Features

### Key Features:
1. **Soft Delete Flag**: Tenants are marked as deleted using `isDeleted: true` instead of being removed from the database
2. **Deletion Metadata**: Tracks who deleted the tenant and when (`deletedAt`, `deletedBy`)
3. **Automatic Filtering**: All queries automatically exclude deleted tenants unless explicitly requested
4. **Restoration**: Deleted tenants can be restored with all their data intact
5. **Permanent Deletion**: Option to permanently delete tenants when needed

### Benefits:
- **Data Recovery**: Accidental deletions can be reversed
- **Audit Trail**: Track who deleted what and when
- **Data Integrity**: Maintains relationships with other entities
- **Compliance**: Meets data retention requirements
- **Analytics**: Can analyze deletion patterns

### Usage Examples:

#### Include Deleted Tenants in Search
```bash
GET /api/tenants?includeDeleted=true
```

#### Get Only Deleted Tenants
```bash
GET /api/tenants/deleted
```

#### Restore a Deleted Tenant
```bash
POST /api/tenants/{id}/restore
```

#### Permanent Deletion (Use with caution)
```bash
DELETE /api/tenants/{id}?permanent=true
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

## Testing

Use the provided test script to verify all endpoints:

```bash
node test-tenant-endpoints.js
```

This will test the complete CRUD cycle with soft deletion functionality. 