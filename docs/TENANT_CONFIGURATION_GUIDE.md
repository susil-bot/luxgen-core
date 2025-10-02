# 🏢 Tenant Configuration System Guide ## 📋 Table of Contents
1. [Overview](#overview)
2. [Tenant Configuration File](#tenant-configuration-file)
3. [How Frontend & Backend Identify Tenants](#how-frontend--backend-identify-tenants)
4. [Tenant Configuration Structure](#tenant-configuration-structure)
5. [API Endpoints](#api-endpoints)
6. [Frontend Integration](#frontend-integration)
7. [Backend Integration](#backend-integration)
8. [Deployment Process](#deployment-process)
9. [Example Workflows](#example-workflows) --- ## Overview The **Tenant Configuration File System** is the standard and most robust approach for multi-tenant applications. This system provides: - **Centralized Configuration**: All tenant settings in one file
- **Easy Deployment**: Simple file-based tenant activation
- **Security**: Configuration-driven access control
- **Scalability**: Easy to add/remove tenants
- **Consistency**: Unified tenant management
- **Audit Trail**: Version-controlled tenant configs --- ## Tenant Configuration File ### **Location:** `src/config/tenants.js` This file contains all tenant configurations and is the **single source of truth** for tenant management. ### **Key Benefits:**
1. **Version Control**: Tenant configs are tracked in Git
2. **Easy Updates**: Modify config and restart application
3. **Environment Specific**: Different configs for dev/staging/prod
4. **Backup & Recovery**: Easy to restore tenant configurations --- ## How Frontend & Backend Identify Tenants ### **1. Subdomain-Based Identification (Recommended)** #### **Frontend Access:**
```
https://acme.luxgen.com → Tenant: acme-corporation
https://techstartup.luxgen.com → Tenant: tech-startup
https://enterprise.luxgen.com → Tenant: enterprise-corp
``` #### **Backend Processing:**
```javascript
// 1. Extract subdomain from hostname
const subdomain = hostname.split('.')[0]; // 'acme'// 2. Look up in tenant configuration
const tenantConfig = getTenantConfig(subdomain); // 3. Validate tenant is active
if (!isTenantActive(subdomain)) { return error('Tenant not active');
} // 4. Set tenant context
req.tenant = tenantConfig;
``` ### **2. 🛣️ Path-Based Identification** #### **Frontend Access:**
```
https://luxgen.com/tenant/acme
https://luxgen.com/tenant/techstartup
https://luxgen.com/tenant/enterprise
``` #### **Backend Processing:**
```javascript
// 1. Extract tenant from path
const pathParts = req.path.split('/');
const tenantSlug = pathParts[2]; // 'acme'// 2. Remove tenant from path for route matching
req.url = req.url.replace(`/tenant/${tenantSlug}`, ''); // 3. Set tenant context
req.tenant = getTenantConfig(tenantSlug);
``` ### **3. 📋 Header-Based Identification** #### **Frontend Request:**
```javascript
// Frontend sends tenant info in headers
fetch('/api/v1/polls', { headers: { 'X-Tenant-Slug': 'acme-corporation', 'Authorization': 'Bearer token'}
});
``` #### **Backend Processing:**
```javascript
// 1. Extract tenant from headers
const tenantSlug = req.headers['x-tenant-slug']; // 2. Set tenant context
req.tenant = getTenantConfig(tenantSlug);
``` ### **4. 🔗 Query Parameter Identification** #### **Frontend Access:**
```
https://luxgen.com/api/v1/polls?tenant=acme-corporation
``` #### **Backend Processing:**
```javascript
// 1. Extract tenant from query
const tenantSlug = req.query.tenant; // 2. Set tenant context
req.tenant = getTenantConfig(tenantSlug);
``` ### **5. JWT Token Identification** #### **Frontend Login:**
```javascript
// User logs in and gets JWT with tenant info
const response = await fetch('/api/v1/registration/login', { method: 'POST', body: JSON.stringify({ email: 'user@acme.com', password: 'password'})
}); // JWT contains tenant information
const { token } = await response.json();
// token payload: { userId, email, role, tenantId, tenantSlug }
``` #### **Backend Processing:**
```javascript
// 1. Decode JWT token
const decoded = jwt.verify(token, secret); // 2. Extract tenant from JWT
const tenantSlug = decoded.tenantSlug; // 3. Set tenant context
req.tenant = getTenantConfig(tenantSlug);
``` --- ## 🏗️ Tenant Configuration Structure ### **Configuration File Structure:**
```javascript
const tenantConfigs = { // Default template default: { name: 'Default Tenant', slug: 'default', status: 'active', features: { /* feature flags */ }, settings: { /* tenant settings */ }, branding: { /* UI customization */ }, integrations: { /* third-party services */ }, limits: { /* usage limits */ } }, // Production tenants 'acme-corporation': { name: 'Acme Corporation', slug: 'acme-corporation', status: 'active', contactEmail: 'admin@acme.com', industry: 'Technology', companySize: '51-200', features: { polls: { enabled: true, maxPolls: 200 }, analytics: { enabled: true }, branding: { enabled: true }, customFields: { enabled: true }, apiAccess: { enabled: true, rateLimit: 2000 }, fileUpload: { enabled: true, maxSize: '20MB'}, notifications: { enabled: true, channels: ['email', 'in-app', 'slack'] } }, settings: { allowPublicPolls: false, requireEmailVerification: true, autoArchivePolls: true, maxUsers: 100, sessionTimeout: 48, passwordPolicy: { minLength: 10, requireUppercase: true, requireLowercase: true, requireNumbers: true, requireSpecialChars: true } }, branding: { logo: '/branding/acme/logo.png', primaryColor: '#e74c3c', secondaryColor: '#2c3e50', customCss: '/branding/acme/custom.css', favicon: '/branding/acme/favicon.ico'}, integrations: { email: { provider: 'sendgrid', config: { apiKey: process.env.ACME_SENDGRID_KEY } }, storage: { provider: 'aws-s3', config: { bucket: 'acme-luxgen-files', region: 'us-east-1'} }, analytics: { provider: 'google-analytics', config: { trackingId: 'GA-ACME-123'} } }, limits: { maxPollsPerUser: 100, maxResponsesPerPoll: 5000, maxFileSize: 20971520, // 20MB maxStoragePerUser: 2147483648 // 2GB } }
};
``` --- ## API Endpoints ### **Tenant Configuration Endpoints:** #### **1. Get All Active Tenant Configs**
```bash
GET /api/v1/config/configs
```
**Response:**
```json
{ "success": true, "data": { "acme-corporation": { /* tenant config */ }, "tech-startup": { /* tenant config */ }, "enterprise-corp": { /* tenant config */ } }
}
``` #### **2. Get Specific Tenant Config**
```bash
GET /api/v1/config/config/acme-corporation
```
**Response:**
```json
{ "success": true, "data": { "name": "Acme Corporation", "slug": "acme-corporation", "status": "active", "features": { /* features */ }, "settings": { /* settings */ }, "branding": { /* branding */ }, "limits": { /* limits */ } }
}
``` #### **3. Get Tenant Branding**
```bash
GET /api/v1/config/config/acme-corporation/branding
```
**Response:**
```json
{ "success": true, "data": { "tenant": "acme-corporation", "branding": { "logo": "/branding/acme/logo.png", "primaryColor": "#e74c3c", "secondaryColor": "#2c3e50", "customCss": "/branding/acme/custom.css", "favicon": "/branding/acme/favicon.ico"} }
}
``` #### **4. Check Feature Status**
```bash
GET /api/v1/config/config/acme-corporation/feature/polls
```
**Response:**
```json
{ "success": true, "data": { "tenant": "acme-corporation", "feature": "polls", "enabled": true, "config": { "enabled": true, "maxPolls": 200 } }
}
``` #### **5. Get Tenant Limits**
```bash
GET /api/v1/config/config/acme-corporation/limits
```
**Response:**
```json
{ "success": true, "data": { "tenant": "acme-corporation", "limits": { "maxPollsPerUser": 100, "maxResponsesPerPoll": 5000, "maxFileSize": 20971520, "maxStoragePerUser": 2147483648 } }
}
``` --- ## 🎨 Frontend Integration ### **1. Frontend Tenant Detection** #### **React/Vue/Angular Implementation:**
```javascript
// utils/tenantDetection.js
class TenantDetector { static getTenantFromUrl() { const hostname = window.location.hostname; // Subdomain detection if (hostname.includes('.')) { const subdomain = hostname.split('.')[0]; if (subdomain !== 'www'&& subdomain !== 'api') { return subdomain; } } // Path detection const path = window.location.pathname; if (path.startsWith('/tenant/')) { const pathParts = path.split('/'); return pathParts[2]; } // Query parameter detection const urlParams = new URLSearchParams(window.location.search); return urlParams.get('tenant'); } static async loadTenantConfig(tenantSlug) { const response = await fetch(`/api/v1/config/config/${tenantSlug}`); const { data } = await response.json(); return data; } static async checkFeature(tenantSlug, feature) { const response = await fetch(`/api/v1/config/config/${tenantSlug}/feature/${feature}`); const { data } = await response.json(); return data.enabled; }
} // Usage in components
const tenantSlug = TenantDetector.getTenantFromUrl();
const tenantConfig = await TenantDetector.loadTenantConfig(tenantSlug);
const pollsEnabled = await TenantDetector.checkFeature(tenantSlug, 'polls');
``` ### **2. Frontend API Client** #### **Axios Configuration:**
```javascript
// api/client.js
import axios from 'axios'; class ApiClient { constructor() { this.client = axios.create({ baseURL: process.env.REACT_APP_API_URL || 'https://luxgen.com/api/v1', timeout: 10000 }); // Add tenant information to all requests this.client.interceptors.request.use((config) => { const tenantSlug = this.getTenantSlug(); if (tenantSlug) { config.headers['X-Tenant-Slug'] = tenantSlug; } return config; }); } getTenantSlug() { // Get from URL, localStorage, or context return localStorage.getItem('tenantSlug') || TenantDetector.getTenantFromUrl(); } async login(email, password) { const response = await this.client.post('/registration/login', { email, password }); // Store tenant info from JWT const { token } = response.data.data; const decoded = jwt_decode(token); localStorage.setItem('tenantSlug', decoded.tenantSlug); return response.data; } async getPolls() { return this.client.get('/polls'); } async createPoll(pollData) { return this.client.post('/polls', pollData); }
} export default new ApiClient();
``` ### **3. Frontend Feature Gates** #### **React Feature Gate Component:**
```javascript
// components/FeatureGate.jsx
import React, { useState, useEffect } from 'react';
import { TenantDetector } from '../utils/tenantDetection'; const FeatureGate = ({ feature, children, fallback = null }) => { const [isEnabled, setIsEnabled] = useState(false); const [loading, setLoading] = useState(true); useEffect(() => { const checkFeature = async () => { try { const tenantSlug = TenantDetector.getTenantFromUrl(); const enabled = await TenantDetector.checkFeature(tenantSlug, feature); setIsEnabled(enabled); } catch (error) { console.error('Feature check failed:', error); setIsEnabled(false); } finally { setLoading(false); } }; checkFeature(); }, [feature]); if (loading) { return <div>Loading...</div>; } return isEnabled ? children: fallback;
}; // Usage
<FeatureGate feature="polls"fallback={<div>Polls feature not available</div>}> <PollsComponent />
</FeatureGate>
``` --- ## Backend Integration ### **1. Middleware Integration** #### **Route Protection with Feature Gates:**
```javascript
// routes/polls.js
const express = require('express');
const router = express.Router();
const { requireFeature } = require('../middleware/tenantIdentification'); // Protect routes with feature gates
router.get('/', requireFeature('polls'), pollsController.getPolls);
router.post('/', requireFeature('polls'), pollsController.createPoll);
router.get('/:id', requireFeature('polls'), pollsController.getPoll);
``` #### **Rate Limiting Based on Tenant:**
```javascript
// middleware/rateLimit.js
const { getTenantConfig } = require('../config/tenants'); const tenantRateLimit = (req, res, next) => { const tenantSlug = req.tenant?.slug; if (!tenantSlug) return next(); const config = getTenantConfig(tenantSlug); const apiConfig = config.features?.apiAccess; if (!apiConfig?.enabled) { return res.status(403).json({ success: false, message: 'API access disabled for this tenant'}); } // Implement rate limiting based on apiConfig.rateLimit // ... rate limiting logic
};
``` ### **2. Controller Integration** #### **Tenant-Aware Controllers:**
```javascript
// controllers/pollsController.js
const { getTenantLimits } = require('../config/tenants'); exports.createPoll = async (req, res) => { try { const tenantSlug = req.tenant.slug; const limits = getTenantLimits(tenantSlug); // Check user's poll count const userPollCount = await Poll.countDocuments({ createdBy: req.user._id, tenantId: req.user.tenantId }); if (userPollCount >= limits.maxPollsPerUser) { return res.status(403).json({ success: false, message: `Maximum polls limit reached (${limits.maxPollsPerUser})` }); } // Create poll with tenant context const poll = new Poll({ ...req.body, tenantId: req.user.tenantId, createdBy: req.user._id }); await poll.save(); res.status(201).json({ success: true, data: poll }); } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};
``` --- ## Deployment Process ### **1. Adding a New Tenant** #### **Step 1: Add Tenant Configuration**
```javascript
// src/config/tenants.js
const tenantConfigs = { // ... existing tenants 'new-company': { name: 'New Company', slug: 'new-company', status: 'active', contactEmail: 'admin@newcompany.com', features: { polls: { enabled: true, maxPolls: 50 }, analytics: { enabled: true }, branding: { enabled: false } }, settings: { allowPublicPolls: true, requireEmailVerification: true, maxUsers: 25 }, limits: { maxPollsPerUser: 25, maxResponsesPerPoll: 500, maxFileSize: 5242880 } }
};
``` #### **Step 2: Deploy Configuration**
```bash
# 1. Update tenant config file
git add src/config/tenants.js
git commit -m "Add new-company tenant configuration"git push # 2. Deploy to server
npm run deploy # 3. Restart application
pm2 restart luxgen-backend
``` #### **Step 3: Create Database Entry (Optional)**
```bash
# If you need database entry for additional data
mongosh "mongodb://..."--eval "db.tenants.insertOne({ name: 'New Company', slug: 'new-company', status: 'active', contactEmail: 'admin@newcompany.com', createdAt: new Date()
})
"``` ### **2. Updating Tenant Configuration** #### **Enable/Disable Features:**
```javascript
// Update in src/config/tenants.js
'acme-corporation': { // ... existing config features: { polls: { enabled: true, maxPolls: 200 }, analytics: { enabled: true }, branding: { enabled: true }, customFields: { enabled: true }, apiAccess: { enabled: true, rateLimit: 2000 }, fileUpload: { enabled: true, maxSize: '20MB'}, notifications: { enabled: true, channels: ['email', 'in-app', 'slack'] }, // NEW FEATURE advancedAnalytics: { enabled: true, retention: '90days'} }
}
``` #### **Update Limits:**
```javascript
'acme-corporation': { // ... existing config limits: { maxPollsPerUser: 150, // Increased from 100 maxResponsesPerPoll: 10000, // Increased from 5000 maxFileSize: 52428800, // Increased to 50MB maxStoragePerUser: 5368709120 // Increased to 5GB }
}
``` --- ## Example Workflows ### **1. New Client Onboarding** #### **Frontend Process:**
```javascript
// 1. Client accesses their subdomain
// https://acme.luxgen.com // 2. Frontend detects tenant
const tenantSlug = TenantDetector.getTenantFromUrl(); // 'acme'// 3. Load tenant configuration
const tenantConfig = await TenantDetector.loadTenantConfig(tenantSlug); // 4. Apply branding
document.title = tenantConfig.name;
document.documentElement.style.setProperty('--primary-color', tenantConfig.branding.primaryColor); // 5. Show/hide features based on configuration
if (tenantConfig.features.polls.enabled) { showPollsFeature();
}
``` #### **Backend Process:**
```javascript
// 1. Request comes in with subdomain
// Host: acme.luxgen.com // 2. Middleware identifies tenant
const subdomain = req.hostname.split('.')[0]; // 'acme'const tenantConfig = getTenantConfig(subdomain); // 3. Validate tenant is active
if (!isTenantActive(subdomain)) { return res.status(400).json({ message: 'Tenant not active'});
} // 4. Set tenant context
req.tenant = tenantConfig; // 5. Apply feature gates and limits
if (!req.tenant.features.polls.enabled) { return res.status(403).json({ message: 'Polls feature disabled'});
}
``` ### **2. Feature Toggle** #### **Enable New Feature:**
```javascript
// 1. Update tenant configuration
'acme-corporation': { features: { // ... existing features advancedAnalytics: { enabled: true, retention: '90days'} }
} // 2. Deploy configuration
git commit -m "Enable advanced analytics for acme-corporation"git push && deploy // 3. Frontend automatically shows new feature
<FeatureGate feature="advancedAnalytics"> <AdvancedAnalyticsComponent />
</FeatureGate>
``` ### **3. Tenant-Specific Customization** #### **Custom Branding:**
```javascript
// Frontend applies tenant branding
const applyTenantBranding = (tenantConfig) => { // Logo if (tenantConfig.branding.logo) { document.getElementById('logo').src = tenantConfig.branding.logo; } // Colors document.documentElement.style.setProperty('--primary-color', tenantConfig.branding.primaryColor); document.documentElement.style.setProperty('--secondary-color', tenantConfig.branding.secondaryColor); // Custom CSS if (tenantConfig.branding.customCss) { const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = tenantConfig.branding.customCss; document.head.appendChild(link); }
};
``` --- ## Security Considerations ### **1. Configuration Security**
- **Environment Variables**: Sensitive data in `.env` files
- **Access Control**: Admin-only configuration endpoints
- **Validation**: Configuration validation before deployment
- **Backup**: Version-controlled configurations ### **2. Tenant Isolation**
- **Data Separation**: All queries filtered by `tenantId`
- **Feature Gates**: Features controlled by configuration
- **Rate Limiting**: Tenant-specific rate limits
- **Access Control**: Users can only access their tenant ### **3. Deployment Security**
- **Git Tracking**: All changes tracked in version control
- **Review Process**: Configuration changes reviewed before deployment
- **Rollback**: Easy rollback to previous configurations
- **Monitoring**: Configuration changes logged and monitored --- ## **Summary** The **Tenant Configuration File System** provides: 1. ** Centralized Management**: All tenant settings in one file
2. ** Easy Deployment**: Simple file updates and restarts
3. ** Security**: Configuration-driven access control
4. ** Scalability**: Easy to add/remove tenants
5. ** Consistency**: Unified tenant management
6. ** Audit Trail**: Version-controlled configurations **This is the standard and most robust approach for multi-tenant applications!** 