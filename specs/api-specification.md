# LuxGen Core API Specification

## Overview
This document defines the comprehensive API specification for the LuxGen Core backend with Hapi.js architecture and multi-tenancy support.

## Base URL
```
http://localhost:3000/{tenantSlug}
```

## Authentication
All API endpoints require tenant context. The tenant is identified by the `{tenantSlug}` in the URL path.

## API Endpoints

### Health & Monitoring

#### GET /{tenantSlug}/health
**Description:** Get health status of all tenant databases
**Response:**
```json
{
  "success": true,
  "data": {
    "healthChecks": [
      {
        "tenantId": "luxgen",
        "databaseName": "tenant_luxgen",
        "status": "healthy",
        "responseTime": 45
      }
    ],
    "totalConnections": 1
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### GET /{tenantSlug}/health/{tenantId}
**Description:** Get health status of specific tenant database
**Parameters:**
- `tenantId` (string): The tenant identifier

**Response:**
```json
{
  "success": true,
  "data": {
    "health": {
      "status": "healthy",
      "responseTime": 45,
      "lastChecked": "2024-01-01T00:00:00.000Z"
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Statistics

#### GET /{tenantSlug}/stats
**Description:** Get statistics for all tenants
**Response:**
```json
{
  "success": true,
  "data": {
    "statistics": {
      "totalTenants": 2,
      "activeConnections": 2,
      "totalDatabases": 2,
      "averageResponseTime": 45
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### GET /{tenantSlug}/stats/{tenantId}
**Description:** Get statistics for specific tenant
**Parameters:**
- `tenantId` (string): The tenant identifier

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "databaseSize": "2.5MB",
      "documentCount": 150,
      "connectionCount": 1,
      "lastActivity": "2024-01-01T00:00:00.000Z"
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Database Management

#### POST /{tenantSlug}/initialize/{tenantId}
**Description:** Initialize tenant database
**Parameters:**
- `tenantId` (string): The tenant identifier

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Tenant database initialized for luxgen",
    "databaseName": "tenant_luxgen"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### DELETE /{tenantSlug}/close/{tenantId}
**Description:** Close tenant database connection
**Parameters:**
- `tenantId` (string): The tenant identifier

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Tenant database connection closed for luxgen"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### DELETE /{tenantSlug}/drop/{tenantId}
**Description:** Drop tenant database
**Parameters:**
- `tenantId` (string): The tenant identifier

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Tenant database dropped for luxgen"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Configuration

#### GET /{tenantSlug}/config/{tenantId}
**Description:** Get tenant configuration
**Parameters:**
- `tenantId` (string): The tenant identifier

**Response:**
```json
{
  "success": true,
  "data": {
    "config": {
      "id": "luxgen",
      "slug": "luxgen",
      "name": "LuxGen",
      "features": ["users", "polls", "activities", "jobs"],
      "limits": {
        "maxUsers": 1000,
        "maxPolls": 100,
        "maxActivities": 5000
      }
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### GET /{tenantSlug}/limits/{tenantId}
**Description:** Get tenant limits
**Parameters:**
- `tenantId` (string): The tenant identifier

**Response:**
```json
{
  "success": true,
  "data": {
    "limits": {
      "maxUsers": 1000,
      "maxPolls": 100,
      "maxActivities": 5000,
      "currentUsers": 25,
      "currentPolls": 5,
      "currentActivities": 150
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### GET /{tenantSlug}/tenants
**Description:** Get all tenants
**Response:**
```json
{
  "success": true,
  "data": {
    "tenants": [
      {
        "id": "luxgen",
        "slug": "luxgen",
        "name": "LuxGen",
        "status": "active"
      },
      {
        "id": "test",
        "slug": "test",
        "name": "Test Tenant",
        "status": "active"
      }
    ]
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Cleanup

#### DELETE /{tenantSlug}/cleanup/{tenantId}
**Description:** Cleanup tenant resources
**Parameters:**
- `tenantId` (string): The tenant identifier

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Tenant resources cleaned up for luxgen"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### DELETE /{tenantSlug}/cleanup
**Description:** Cleanup all tenant resources
**Response:**
```json
{
  "success": true,
  "data": {
    "message": "All tenant resources cleaned up"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### User Management

#### GET /{tenantSlug}/users
**Description:** Get list of users
**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "_id": "user_id_1",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "tenantId": "luxgen",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### GET /{tenantSlug}/users/{userId}
**Description:** Get specific user
**Parameters:**
- `userId` (string): The user identifier

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "user_id_1",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "tenantId": "luxgen",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### POST /{tenantSlug}/users
**Description:** Create new user
**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "user_id_1",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "tenantId": "luxgen",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### PUT /{tenantSlug}/users/{userId}
**Description:** Update user
**Parameters:**
- `userId` (string): The user identifier

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "user_id_1",
      "firstName": "Jane",
      "lastName": "Doe",
      "email": "john@example.com",
      "tenantId": "luxgen",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### DELETE /{tenantSlug}/users/{userId}
**Description:** Delete user
**Parameters:**
- `userId` (string): The user identifier

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "User deleted successfully"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Poll Management

#### GET /{tenantSlug}/polls
**Description:** Get list of polls
**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "polls": [
      {
        "_id": "poll_id_1",
        "title": "Sample Poll",
        "description": "This is a sample poll",
        "options": ["Option 1", "Option 2"],
        "createdBy": {
          "_id": "user_id_1",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john@example.com"
        },
        "tenantId": "luxgen",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "pages": 1
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### GET /{tenantSlug}/polls/{pollId}
**Description:** Get specific poll
**Parameters:**
- `pollId` (string): The poll identifier

**Response:**
```json
{
  "success": true,
  "data": {
    "poll": {
      "_id": "poll_id_1",
      "title": "Sample Poll",
      "description": "This is a sample poll",
      "options": ["Option 1", "Option 2"],
      "createdBy": {
        "_id": "user_id_1",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com"
      },
      "tenantId": "luxgen",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### POST /{tenantSlug}/polls
**Description:** Create new poll
**Request Body:**
```json
{
  "title": "Sample Poll",
  "description": "This is a sample poll",
  "options": ["Option 1", "Option 2"],
  "createdBy": "user_id_1"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "poll": {
      "_id": "poll_id_1",
      "title": "Sample Poll",
      "description": "This is a sample poll",
      "options": ["Option 1", "Option 2"],
      "createdBy": "user_id_1",
      "tenantId": "luxgen",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### PUT /{tenantSlug}/polls/{pollId}
**Description:** Update poll
**Parameters:**
- `pollId` (string): The poll identifier

**Request Body:**
```json
{
  "title": "Updated Poll Title",
  "description": "Updated description"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "poll": {
      "_id": "poll_id_1",
      "title": "Updated Poll Title",
      "description": "Updated description",
      "options": ["Option 1", "Option 2"],
      "createdBy": "user_id_1",
      "tenantId": "luxgen",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### DELETE /{tenantSlug}/polls/{pollId}
**Description:** Delete poll
**Parameters:**
- `pollId` (string): The poll identifier

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Poll deleted successfully"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Activity Management

#### GET /{tenantSlug}/activities
**Description:** Get list of activities
**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "_id": "activity_id_1",
        "type": "user_login",
        "description": "User logged in",
        "userId": {
          "_id": "user_id_1",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john@example.com"
        },
        "tenantId": "luxgen",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 150,
      "pages": 15
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### GET /{tenantSlug}/activities/{activityId}
**Description:** Get specific activity
**Parameters:**
- `activityId` (string): The activity identifier

**Response:**
```json
{
  "success": true,
  "data": {
    "activity": {
      "_id": "activity_id_1",
      "type": "user_login",
      "description": "User logged in",
      "userId": {
        "_id": "user_id_1",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com"
      },
      "tenantId": "luxgen",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### POST /{tenantSlug}/activities
**Description:** Create new activity
**Request Body:**
```json
{
  "type": "user_login",
  "description": "User logged in",
  "userId": "user_id_1"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "activity": {
      "_id": "activity_id_1",
      "type": "user_login",
      "description": "User logged in",
      "userId": "user_id_1",
      "tenantId": "luxgen",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Job Management

#### GET /{tenantSlug}/jobs
**Description:** Get list of jobs
**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "_id": "job_id_1",
        "title": "Software Engineer",
        "description": "Full-stack developer position",
        "company": "Tech Corp",
        "location": "Remote",
        "createdBy": {
          "_id": "user_id_1",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john@example.com"
        },
        "tenantId": "luxgen",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 10,
      "pages": 1
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### GET /{tenantSlug}/jobs/{jobId}
**Description:** Get specific job
**Parameters:**
- `jobId` (string): The job identifier

**Response:**
```json
{
  "success": true,
  "data": {
    "job": {
      "_id": "job_id_1",
      "title": "Software Engineer",
      "description": "Full-stack developer position",
      "company": "Tech Corp",
      "location": "Remote",
      "createdBy": {
        "_id": "user_id_1",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com"
      },
      "tenantId": "luxgen",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### POST /{tenantSlug}/jobs
**Description:** Create new job
**Request Body:**
```json
{
  "title": "Software Engineer",
  "description": "Full-stack developer position",
  "company": "Tech Corp",
  "location": "Remote",
  "createdBy": "user_id_1"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "job": {
      "_id": "job_id_1",
      "title": "Software Engineer",
      "description": "Full-stack developer position",
      "company": "Tech Corp",
      "location": "Remote",
      "createdBy": "user_id_1",
      "tenantId": "luxgen",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### PUT /{tenantSlug}/jobs/{jobId}
**Description:** Update job
**Parameters:**
- `jobId` (string): The job identifier

**Request Body:**
```json
{
  "title": "Senior Software Engineer",
  "description": "Senior full-stack developer position"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "job": {
      "_id": "job_id_1",
      "title": "Senior Software Engineer",
      "description": "Senior full-stack developer position",
      "company": "Tech Corp",
      "location": "Remote",
      "createdBy": "user_id_1",
      "tenantId": "luxgen",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### DELETE /{tenantSlug}/jobs/{jobId}
**Description:** Delete job
**Parameters:**
- `jobId` (string): The job identifier

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Job deleted successfully"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid request parameters",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Resource not found",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Rate Limiting

All endpoints are rate limited to 100 requests per minute per IP address.

## CORS

All endpoints support CORS with the following configuration:
- Origin: `*`
- Methods: `GET, POST, PUT, DELETE, OPTIONS`
- Headers: `Content-Type, Authorization`
- Credentials: `true`
