# 🏗️ Directory-Based Tenant Configuration System

## 📋 Table of Contents
1. [Overview](#overview)
2. [Directory Structure](#directory-structure)
3. [How It Works](#how-it-works)
4. [Tenant Mapping Process](#tenant-mapping-process)
5. [Configuration Files](#configuration-files)
6. [Frontend Integration](#frontend-integration)
7. [Backend Integration](#backend-integration)
8. [Adding New Tenants](#adding-new-tenants)
9. [Example Workflows](#example-workflows)
10. [API Endpoints](#api-endpoints)

---

## 🎯 Overview

The **Directory-Based Tenant Configuration System** is a robust and scalable approach where each tenant has its own directory containing all configuration files, assets, and customizations. This system provides:

- ✅ **Organized Structure**: Each tenant has its own directory
- ✅ **Easy Management**: Simple file-based configuration
- ✅ **Version Control**: All tenant configs tracked in Git
- ✅ **Scalability**: Easy to add/remove tenants
- ✅ **Customization**: Tenant-specific assets and branding
- ✅ **Isolation**: Complete separation of tenant configurations

---

## 📁 Directory Structure

```
src/
├── tenants/                          # Main tenants directory
│   ├── demo-tenant/                  # Demo tenant directory
│   │   ├── config.js                 # Main tenant configuration
│   │   ├── README.md                 # Tenant documentation
│   │   └── branding/                 # Branding assets
│   │       ├── logo.png              # Company logo
│   │       ├── favicon.ico           # Favicon
│   │       └── custom.css            # Custom CSS styles
│   │
│   ├── acme-corporation/             # ACME Corporation tenant
│   │   ├── config.js                 # ACME configuration
│   │   ├── README.md                 # ACME documentation
│   │   └── branding/                 # ACME branding
│   │       ├── logo.png
│   │       ├── favicon.ico
│   │       └── custom.css
│   │
│   └── tech-startup/                 # Tech Startup tenant
│       ├── config.js                 # Startup configuration
│       ├── README.md                 # Startup documentation
│       └── branding/                 # Startup branding
│           ├── logo.png
│           ├── favicon.ico
│           └── custom.css
│
├── config/
│   ├── tenantLoader.js               # Dynamic tenant loader
│   └── tenants.js                    # Main tenant configuration system
│
└── middleware/
    └── tenantIdentification.js       # Tenant identification middleware
```

---

## 🔧 How It Works

### **1. Dynamic Loading Process**

```javascript
// src/config/tenantLoader.js
function loadAllTenants() {
  const tenantsDir = path.join(__dirname, '..', 'tenants');
  const tenants = {};

  // Read all tenant directories
  const tenantDirs = fs.readdirSync(tenantsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  // Load each tenant configuration
  tenantDirs.forEach(tenantDir => {
    const configPath = path.join(tenantsDir, tenantDir, 'config.js');
    const tenantConfig = require(configPath);
    tenants[tenantConfig.slug] = tenantConfig;
  });

  return tenants;
}
```

### **2. Tenant Identification**

When a user accesses the application, the system identifies the tenant through:

1. **Subdomain**: `demo-tenant.luxgen.com`
2. **Path**: `luxgen.com/tenant/demo-tenant`
3. **Header**: `X-Tenant-Slug: demo-tenant`
4. **Query**: `?tenant=demo-tenant`
5. **JWT Token**: Contains tenant information

### **3. Configuration Loading**

```javascript
// src/middleware/tenantIdentification.js
const identifyTenant = async (req, res, next) => {
  let tenantSlug = null;
  
  // Extract tenant slug from various sources
  if (req.hostname.includes('.')) {
    const subdomain = req.hostname.split('.')[0];
    tenantSlug = subdomain;
  }
  
  // Load tenant configuration
  if (tenantSlug) {
    const tenantConfig = getTenantConfig(tenantSlug);
    req.tenant = tenantConfig;
    req.tenantSlug = tenantSlug;
  }
  
  next();
};
```

---

## 🔄 Tenant Mapping Process

### **Step 1: User Access**
```
User visits: https://demo-tenant.luxgen.com
```

### **Step 2: Tenant Identification**
```javascript
// Extract subdomain
const subdomain = 'demo-tenant';

// Look up in tenant directories
const configPath = 'src/tenants/demo-tenant/config.js';
const tenantConfig = require(configPath);
```

### **Step 3: Configuration Loading**
```javascript
// Load tenant configuration
const config = {
  name: 'Demo Company',
  slug: 'demo-tenant',
  status: 'active',
  features: { /* feature flags */ },
  branding: { /* branding config */ },
  limits: { /* usage limits */ }
};

// Set tenant context
req.tenant = config;
```

### **Step 4: Feature Gates & Limits**
```javascript
// Check if feature is enabled
if (!req.tenant.features.polls.enabled) {
  return res.status(403).json({ message: 'Polls feature disabled' });
}

// Check usage limits
const limits = req.tenant.limits;
if (userPollCount >= limits.maxPollsPerUser) {
  return res.status(403).json({ message: 'Poll limit reached' });
}
```

---

## 📄 Configuration Files

### **1. Main Configuration (`config.js`)**

```javascript
// src/tenants/demo-tenant/config.js
module.exports = {
  // Basic information
  name: 'Demo Company',
  slug: 'demo-tenant',
  status: 'active',
  contactEmail: 'admin@democompany.com',
  
  // Features configuration
  features: {
    polls: { 
      enabled: true, 
      maxPolls: 50,
      allowAnonymous: true
    },
    analytics: { 
      enabled: true,
      retention: '30days'
    },
    branding: { 
      enabled: true,
      allowCustomLogo: true
    }
  },

  // Tenant settings
  settings: {
    allowPublicPolls: true,
    requireEmailVerification: false,
    maxUsers: 25,
    sessionTimeout: 12
  },

  // Branding configuration
  branding: {
    logo: '/branding/demo-tenant/logo.png',
    primaryColor: '#007bff',
    secondaryColor: '#6c757d',
    customCss: '/branding/demo-tenant/custom.css',
    favicon: '/branding/demo-tenant/favicon.ico'
  },

  // Third-party integrations
  integrations: {
    email: { 
      provider: 'smtp', 
      config: { /* email config */ }
    },
    storage: { 
      provider: 'local', 
      config: { /* storage config */ }
    }
  },

  // Usage limits
  limits: {
    maxPollsPerUser: 25,
    maxResponsesPerPoll: 500,
    maxFileSize: 10485760, // 10MB
    maxStoragePerUser: 1073741824 // 1GB
  }
};
```

### **2. Custom CSS (`custom.css`)**

```css
/* src/tenants/demo-tenant/branding/custom.css */
:root {
  --demo-primary-color: #007bff;
  --demo-secondary-color: #6c757d;
  --demo-accent-color: #28a745;
}

.demo-header {
  background: linear-gradient(135deg, var(--demo-primary-color) 0%, var(--demo-accent-color) 100%);
  color: white;
  padding: 1rem 0;
}

.demo-btn-primary {
  background-color: var(--demo-primary-color);
  border-color: var(--demo-primary-color);
  color: white;
  border-radius: 8px;
  transition: all 0.3s ease;
}
```

### **3. Documentation (`README.md`)**

```markdown
# Demo Tenant Configuration

This directory contains all configuration files for the **Demo Company** tenant.

## Tenant Information
- **Name**: Demo Company
- **Slug**: demo-tenant
- **Status**: Active
- **Industry**: Technology

## Features Enabled
- ✅ Polls (max 50)
- ✅ Analytics (30-day retention)
- ✅ Branding customization

## Access URLs
- Subdomain: https://demo-tenant.luxgen.com
- Path: https://luxgen.com/tenant/demo-tenant
- API: https://luxgen.com/api/v1/config/config/demo-tenant
```

---

## 🎨 Frontend Integration

### **1. Tenant Detection**

```javascript
// utils/tenantDetection.js
class TenantDetector {
  static getTenantFromUrl() {
    const hostname = window.location.hostname;
    
    // Subdomain detection
    if (hostname.includes('.')) {
      const subdomain = hostname.split('.')[0];
      if (subdomain !== 'www' && subdomain !== 'api') {
        return subdomain;
      }
    }
    
    // Path detection
    const path = window.location.pathname;
    if (path.startsWith('/tenant/')) {
      const pathParts = path.split('/');
      return pathParts[2];
    }
    
    return null;
  }

  static async loadTenantConfig(tenantSlug) {
    const response = await fetch(`/api/v1/config/config/${tenantSlug}`);
    const { data } = await response.json();
    return data;
  }
}
```

### **2. Branding Application**

```javascript
// components/TenantBranding.jsx
import React, { useEffect, useState } from 'react';
import { TenantDetector } from '../utils/tenantDetection';

const TenantBranding = () => {
  const [tenantConfig, setTenantConfig] = useState(null);

  useEffect(() => {
    const applyTenantBranding = async () => {
      const tenantSlug = TenantDetector.getTenantFromUrl();
      if (tenantSlug) {
        const config = await TenantDetector.loadTenantConfig(tenantSlug);
        setTenantConfig(config);
        
        // Apply branding
        if (config.branding) {
          // Set document title
          document.title = config.name;
          
          // Apply CSS variables
          document.documentElement.style.setProperty(
            '--primary-color', 
            config.branding.primaryColor
          );
          
          // Load custom CSS
          if (config.branding.customCss) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = config.branding.customCss;
            document.head.appendChild(link);
          }
          
          // Set favicon
          if (config.branding.favicon) {
            const favicon = document.querySelector('link[rel="icon"]');
            if (favicon) {
              favicon.href = config.branding.favicon;
            }
          }
        }
      }
    };

    applyTenantBranding();
  }, []);

  return null; // This component only applies branding
};
```

### **3. Feature Gates**

```javascript
// components/FeatureGate.jsx
import React, { useState, useEffect } from 'react';
import { TenantDetector } from '../utils/tenantDetection';

const FeatureGate = ({ feature, children, fallback = null }) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkFeature = async () => {
      try {
        const tenantSlug = TenantDetector.getTenantFromUrl();
        const config = await TenantDetector.loadTenantConfig(tenantSlug);
        const enabled = config.features[feature]?.enabled || false;
        setIsEnabled(enabled);
      } catch (error) {
        console.error('Feature check failed:', error);
        setIsEnabled(false);
      } finally {
        setLoading(false);
      }
    };

    checkFeature();
  }, [feature]);

  if (loading) return <div>Loading...</div>;
  return isEnabled ? children : fallback;
};

// Usage
<FeatureGate feature="polls" fallback={<div>Polls feature not available</div>}>
  <PollsComponent />
</FeatureGate>
```

---

## 🔧 Backend Integration

### **1. Middleware Integration**

```javascript
// routes/polls.js
const express = require('express');
const router = express.Router();
const { requireFeature } = require('../middleware/tenantIdentification');

// Protect routes with feature gates
router.get('/', requireFeature('polls'), pollsController.getPolls);
router.post('/', requireFeature('polls'), pollsController.createPoll);
```

### **2. Controller Integration**

```javascript
// controllers/pollsController.js
const { getTenantLimits } = require('../config/tenants');

exports.createPoll = async (req, res) => {
  try {
    const tenantSlug = req.tenant.slug;
    const limits = getTenantLimits(tenantSlug);

    // Check user's poll count
    const userPollCount = await Poll.countDocuments({ 
      createdBy: req.user._id,
      tenantId: req.user.tenantId
    });

    if (userPollCount >= limits.maxPollsPerUser) {
      return res.status(403).json({
        success: false,
        message: `Maximum polls limit reached (${limits.maxPollsPerUser})`
      });
    }

    // Create poll with tenant context
    const poll = new Poll({
      ...req.body,
      tenantId: req.user.tenantId,
      createdBy: req.user._id
    });

    await poll.save();
    res.status(201).json({ success: true, data: poll });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

---

## ➕ Adding New Tenants

### **Step 1: Create Tenant Directory**

```bash
mkdir -p src/tenants/new-company
mkdir -p src/tenants/new-company/branding
```

### **Step 2: Create Configuration File**

```javascript
// src/tenants/new-company/config.js
module.exports = {
  name: 'New Company',
  slug: 'new-company',
  status: 'active',
  contactEmail: 'admin@newcompany.com',
  industry: 'Technology',
  companySize: '11-50',
  
  features: {
    polls: { enabled: true, maxPolls: 50 },
    analytics: { enabled: true },
    branding: { enabled: true }
  },
  
  settings: {
    allowPublicPolls: true,
    requireEmailVerification: true,
    maxUsers: 25
  },
  
  branding: {
    logo: '/branding/new-company/logo.png',
    primaryColor: '#007bff',
    secondaryColor: '#6c757d',
    customCss: '/branding/new-company/custom.css',
    favicon: '/branding/new-company/favicon.ico'
  },
  
  limits: {
    maxPollsPerUser: 25,
    maxResponsesPerPoll: 500,
    maxFileSize: 10485760,
    maxStoragePerUser: 1073741824
  }
};
```

### **Step 3: Add Branding Assets**

```bash
# Add logo
cp company-logo.png src/tenants/new-company/branding/logo.png

# Add favicon
cp favicon.ico src/tenants/new-company/branding/favicon.ico

# Create custom CSS
touch src/tenants/new-company/branding/custom.css
```

### **Step 4: Create Documentation**

```markdown
# src/tenants/new-company/README.md
# New Company Configuration

This directory contains all configuration files for **New Company**.

## Tenant Information
- **Name**: New Company
- **Slug**: new-company
- **Status**: Active

## Features
- Polls (max 50)
- Analytics
- Branding customization

## Access URLs
- https://new-company.luxgen.com
- https://luxgen.com/tenant/new-company
```

### **Step 5: Deploy**

```bash
# Commit changes
git add src/tenants/new-company/
git commit -m "Add new-company tenant configuration"
git push

# Restart application
pm2 restart luxgen-backend
```

---

## 🎯 Example Workflows

### **1. New Client Onboarding**

#### **Frontend Process:**
```javascript
// 1. Client accesses their subdomain
// https://demo-tenant.luxgen.com

// 2. Frontend detects tenant
const tenantSlug = TenantDetector.getTenantFromUrl(); // 'demo-tenant'

// 3. Load tenant configuration
const tenantConfig = await TenantDetector.loadTenantConfig(tenantSlug);

// 4. Apply branding
document.title = tenantConfig.name;
document.documentElement.style.setProperty('--primary-color', tenantConfig.branding.primaryColor);

// 5. Show/hide features based on configuration
if (tenantConfig.features.polls.enabled) {
  showPollsFeature();
}
```

#### **Backend Process:**
```javascript
// 1. Request comes in with subdomain
// Host: demo-tenant.luxgen.com

// 2. Middleware identifies tenant
const subdomain = req.hostname.split('.')[0]; // 'demo-tenant'
const tenantConfig = getTenantConfig(subdomain);

// 3. Validate tenant is active
if (!isTenantActive(subdomain)) {
  return res.status(400).json({ message: 'Tenant not active' });
}

// 4. Set tenant context
req.tenant = tenantConfig;

// 5. Apply feature gates and limits
if (!req.tenant.features.polls.enabled) {
  return res.status(403).json({ message: 'Polls feature disabled' });
}
```

### **2. Feature Toggle**

#### **Enable New Feature:**
```javascript
// 1. Update tenant configuration
// src/tenants/demo-tenant/config.js
features: {
  polls: { enabled: true, maxPolls: 50 },
  analytics: { enabled: true },
  // NEW FEATURE
  advancedAnalytics: { enabled: true, retention: '90days' }
}

// 2. Deploy configuration
git commit -m "Enable advanced analytics for demo-tenant"
git push && deploy

// 3. Frontend automatically shows new feature
<FeatureGate feature="advancedAnalytics">
  <AdvancedAnalyticsComponent />
</FeatureGate>
```

### **3. Tenant-Specific Customization**

#### **Custom Branding:**
```javascript
// Frontend applies tenant branding
const applyTenantBranding = (tenantConfig) => {
  // Logo
  if (tenantConfig.branding.logo) {
    document.getElementById('logo').src = tenantConfig.branding.logo;
  }
  
  // Colors
  document.documentElement.style.setProperty('--primary-color', tenantConfig.branding.primaryColor);
  document.documentElement.style.setProperty('--secondary-color', tenantConfig.branding.secondaryColor);
  
  // Custom CSS
  if (tenantConfig.branding.customCss) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = tenantConfig.branding.customCss;
    document.head.appendChild(link);
  }
};
```

---

## 📡 API Endpoints

### **Tenant Configuration Endpoints:**

#### **1. Get All Tenant Configs**
```bash
GET /api/v1/config/configs
```
**Response:**
```json
{
  "success": true,
  "data": {
    "demo-tenant": { /* tenant config */ },
    "acme-corporation": { /* tenant config */ },
    "new-company": { /* tenant config */ }
  }
}
```

#### **2. Get Specific Tenant Config**
```bash
GET /api/v1/config/config/demo-tenant
```
**Response:**
```json
{
  "success": true,
  "data": {
    "name": "Demo Company",
    "slug": "demo-tenant",
    "status": "active",
    "features": { /* features */ },
    "branding": { /* branding */ },
    "limits": { /* limits */ }
  }
}
```

#### **3. Get Tenant Branding**
```bash
GET /api/v1/config/config/demo-tenant/branding
```
**Response:**
```json
{
  "success": true,
  "data": {
    "tenant": "demo-tenant",
    "branding": {
      "logo": "/branding/demo-tenant/logo.png",
      "primaryColor": "#007bff",
      "secondaryColor": "#6c757d",
      "customCss": "/branding/demo-tenant/custom.css",
      "favicon": "/branding/demo-tenant/favicon.ico"
    }
  }
}
```

#### **4. Check Feature Status**
```bash
GET /api/v1/config/config/demo-tenant/feature/polls
```
**Response:**
```json
{
  "success": true,
  "data": {
    "tenant": "demo-tenant",
    "feature": "polls",
    "enabled": true,
    "config": {
      "enabled": true,
      "maxPolls": 50
    }
  }
}
```

---

## 🔒 Security Considerations

### **1. Configuration Security**
- ✅ **Environment Variables**: Sensitive data in `.env` files
- ✅ **Access Control**: Admin-only configuration endpoints
- ✅ **Validation**: Configuration validation before loading
- ✅ **Backup**: Version-controlled configurations

### **2. Tenant Isolation**
- ✅ **Data Separation**: All queries filtered by `tenantId`
- ✅ **Feature Gates**: Features controlled by configuration
- ✅ **Rate Limiting**: Tenant-specific rate limits
- ✅ **Access Control**: Users can only access their tenant

### **3. Deployment Security**
- ✅ **Git Tracking**: All changes tracked in version control
- ✅ **Review Process**: Configuration changes reviewed before deployment
- ✅ **Rollback**: Easy rollback to previous configurations
- ✅ **Monitoring**: Configuration changes logged and monitored

---

## 🎯 **Summary**

The **Directory-Based Tenant Configuration System** provides:

1. **📁 Organized Structure**: Each tenant has its own directory with all configs
2. **🚀 Easy Management**: Simple file-based configuration management
3. **🔄 Version Control**: All tenant configs tracked in Git
4. **📈 Scalability**: Easy to add/remove tenants
5. **🎨 Customization**: Tenant-specific assets and branding
6. **🔒 Isolation**: Complete separation of tenant configurations
7. **⚡ Dynamic Loading**: Automatic loading of tenant configurations
8. **🛡️ Security**: Configuration-driven access control

**This is the most robust and scalable approach for multi-tenant applications!** 🎉 