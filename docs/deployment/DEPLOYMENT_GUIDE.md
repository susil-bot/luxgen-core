# 🚀 LuxGen Backend Deployment Guide

## 📋 **Free Deployment Process**

### **Services Used (All FREE)**
- **MongoDB Atlas**: Free M0 cluster (512MB)
- **Railway**: $5/month credit (500 hours)
- **GitHub Actions**: 2,000 minutes/month
- **Total Cost**: $0/month

---

## 🗄️ **Step 1: MongoDB Atlas Setup**

### **1.1 Create Atlas Account**
1. Go to: https://cloud.mongodb.com/
2. Sign up with Google/GitHub
3. Create project: "LuxGen"

### **1.2 Create Free Cluster**
1. Click "Create Cluster"
2. Choose **M0 Sandbox** (FREE)
3. Select region: **US East** (closest to Railway)
4. Cluster name: `luxgen-cluster`
5. Click "Create Cluster"

### **1.3 Configure Database Access**
1. **Database Access**:
   - Click "Database Access"
   - Click "Add New Database User"
   - Username: `luxgen-user`
   - Password: `[YOUR_SECURE_PASSWORD]`
   - Database User Privileges: "Read and write to any database"
   - Click "Add User"

2. **Network Access**:
   - Click "Network Access"
   - Click "Add IP Address"
   - Choose "Allow access from anywhere" (0.0.0.0/0)
   - Click "Confirm"

### **1.4 Get Connection String**
1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Driver: Node.js
4. Version: 4.1 or later
5. Copy connection string:
   ```
   mongodb+srv://luxgen-user:[YOUR_SECURE_PASSWORD]@luxgen-cluster.xxxxx.mongodb.net/luxgen?retryWrites=true&w=majority
   ```

---

## 🚂 **Step 2: Railway Deployment**

### **2.1 Connect to Railway**
1. Go to: https://railway.app/
2. Sign up with GitHub
3. Click "New Project"
4. Choose "Deploy from GitHub repo"
5. Select: `susil-bot/luxgen`
6. Choose: `luxgen-backend` folder

### **2.2 Configure Environment Variables**
In Railway dashboard, go to "Variables" tab and add:

```bash
# Database
MONGODB_URI=mongodb+srv://luxgen-user:[YOUR_SECURE_PASSWORD]@luxgen-cluster.xxxxx.mongodb.net/luxgen?retryWrites=true&w=majority

# Server
PORT=3000
NODE_ENV=production

# CORS
CORS_ORIGINS=https://luxgen-frontend.vercel.app,https://luxgen-multi-tenant.vercel.app
CORS_CREDENTIALS=true

# JWT
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
JWT_EXPIRES_IN=7d

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# API
API_VERSION=v1
API_PREFIX=/api
```

### **2.3 Deploy**
1. Railway will automatically detect Node.js
2. Install dependencies: `npm install`
3. Build application: `npm run build` (if needed)
4. Start server: `npm start`
5. Get deployment URL: `https://luxgen-core-production.up.railway.app`

---

## 🗃️ **Step 3: Database Schema Setup**

### **3.1 Create Collections**
```javascript
// Users Collection
{
  _id: ObjectId,
  email: String (unique),
  password: String (bcrypt hashed),
  firstName: String,
  lastName: String,
  role: String (admin, user, trainer),
  tenantId: String,
  isEmailVerified: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}

// Tenants Collection
{
  _id: ObjectId,
  name: String,
  slug: String (unique),
  domain: String,
  status: String (active, suspended, expired),
  settings: {
    theme: String,
    language: String,
    timezone: String
  },
  features: {
    analytics: Boolean,
    notifications: Boolean,
    chat: Boolean,
    reports: Boolean
  },
  limits: {
    maxUsers: Number,
    maxStorage: Number,
    maxApiCalls: Number
  },
  branding: {
    logo: String,
    primaryColor: String,
    secondaryColor: String
  },
  createdAt: Date,
  updatedAt: Date
}

// Jobs Collection
{
  _id: ObjectId,
  title: String,
  company: String,
  location: String,
  type: String (full-time, part-time, contract),
  description: String,
  requirements: [String],
  benefits: [String],
  salary: {
    min: Number,
    max: Number,
    currency: String
  },
  status: String (active, closed, draft),
  createdBy: String (userId),
  tenantId: String,
  createdAt: Date,
  updatedAt: Date
}

// Content Collection
{
  _id: ObjectId,
  type: String (post, training, assessment, notification),
  title: String,
  content: String,
  metadata: Object,
  author: String (userId),
  tenantId: String,
  status: String (draft, published, archived),
  createdAt: Date,
  updatedAt: Date
}
```

### **3.2 Seed Initial Data**
```javascript
// Create default tenant
{
  name: "LuxGen",
  slug: "luxgen",
  domain: "luxgen.com",
  status: "active",
  settings: {
    theme: "light",
    language: "en",
    timezone: "UTC"
  },
  features: {
    analytics: true,
    notifications: true,
    chat: true,
    reports: true
  },
  limits: {
    maxUsers: 1000,
    maxStorage: 10000,
    maxApiCalls: 100000
  },
  branding: {
    logo: "/assets/logos/luxgen-logo.svg",
    primaryColor: "#2563eb",
    secondaryColor: "#1e40af"
  }
}

// Create admin user
{
  email: "admin@luxgen.com",
  password: "$2b$10$...", // bcrypt hash
  firstName: "Admin",
  lastName: "User",
  role: "admin",
  tenantId: "luxgen",
  isEmailVerified: true
}
```

---

## 🔧 **Step 4: Backend Configuration**

### **4.1 Update CORS Settings**
```javascript
// In your backend server.js or app.js
const cors = require('cors');

app.use(cors({
  origin: [
    'https://luxgen-frontend.vercel.app',
    'https://luxgen-multi-tenant.vercel.app',
    'https://luxgen-frontend-luxgens-projects.vercel.app',
    'http://localhost:3000' // For development
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
```

### **4.2 Database Connection**
```javascript
// In your database connection file
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
```

### **4.3 API Routes Structure**
```
/api/auth/
  ├── POST /login
  ├── POST /register
  ├── POST /logout
  ├── POST /refresh
  ├── POST /forgot-password
  ├── POST /reset-password
  └── POST /verify-email

/api/users/
  ├── GET /me
  ├── PUT /me
  ├── POST /change-password
  ├── GET / (admin)
  ├── GET /:id
  ├── POST / (admin)
  ├── PUT /:id (admin)
  └── DELETE /:id (admin)

/api/tenants/
  ├── GET /
  ├── GET /:id
  ├── POST / (admin)
  ├── PUT /:id (admin)
  └── DELETE /:id (admin)

/api/jobs/
  ├── GET /
  ├── GET /:id
  ├── POST /
  ├── PUT /:id
  ├── DELETE /:id
  └── POST /:id/apply

/api/content/
  ├── GET /
  ├── GET /:id
  ├── POST /
  ├── PUT /:id
  └── DELETE /:id

/api/analytics/
  ├── GET /dashboard
  ├── GET /performance
  ├── GET /users/:id
  ├── GET /training
  └── POST /reports

/api/health/
  ├── GET /
  ├── GET /database
  └── GET /connection
```

---

## 🧪 **Step 5: Testing & Verification**

### **5.1 Health Check**
```bash
# Test API health
curl https://luxgen-core-production.up.railway.app/api/health

# Expected response:
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-15T10:30:00Z",
    "services": {
      "database": "connected",
      "redis": "connected",
      "storage": "connected"
    },
    "uptime": 3600,
    "version": "1.0.0"
  }
}
```

### **5.2 Database Connection Test**
```bash
# Test database connection
curl https://luxgen-core-production.up.railway.app/api/health/database

# Expected response:
{
  "success": true,
  "data": {
    "status": "connected",
    "connection": "mongodb+srv://...",
    "responseTime": 150,
    "lastCheck": "2024-01-15T10:30:00Z"
  }
}
```

### **5.3 CORS Test**
```bash
# Test CORS from frontend
curl -H "Origin: https://luxgen-frontend.vercel.app" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://luxgen-core-production.up.railway.app/api/auth/login
```

---

## 📊 **Step 6: Monitoring & Maintenance**

### **6.1 Railway Dashboard**
- **URL**: https://railway.app/project/luxgen-core-production
- **Features**: Logs, metrics, environment variables, deployments
- **Monitoring**: CPU, memory, network usage

### **6.2 MongoDB Atlas Dashboard**
- **URL**: https://cloud.mongodb.com/
- **Features**: Database metrics, connection monitoring, alerts
- **Monitoring**: Storage usage, query performance, connections

### **6.3 GitHub Actions**
- **URL**: https://github.com/susil-bot/luxgen/actions
- **Features**: Automated testing, deployment logs
- **Monitoring**: Build status, test results, deployment history

---

## 🎯 **Expected Results**

### **After Successful Deployment:**
- ✅ **Backend API**: `https://luxgen-core-production.up.railway.app`
- ✅ **Database**: MongoDB Atlas cluster connected
- ✅ **CORS**: Frontend can communicate with backend
- ✅ **Authentication**: Login/register functionality works
- ✅ **Multi-tenancy**: Tenant switching works
- ✅ **All 68 API endpoints**: Fully functional

### **Performance Metrics:**
- **Response Time**: < 200ms average
- **Uptime**: > 99.9%
- **Database**: < 100ms query time
- **CORS**: No blocking errors

---

## 🚀 **Deployment Checklist**

### **Pre-Deployment:**
- [ ] MongoDB Atlas cluster created
- [ ] Database user configured
- [ ] Network access configured
- [ ] Connection string obtained

### **Deployment:**
- [ ] Railway project created
- [ ] Environment variables set
- [ ] GitHub repository connected
- [ ] Automatic deployment triggered

### **Post-Deployment:**
- [ ] Health check passes
- [ ] Database connection works
- [ ] CORS configuration correct
- [ ] Frontend can communicate with backend
- [ ] All API endpoints functional

---

## 💰 **Cost Summary**

| Service | Free Tier | Usage | Cost |
|---------|-----------|-------|------|
| **MongoDB Atlas** | M0 Cluster | 512MB storage | $0/month |
| **Railway** | $5 credit | 500 hours | $0/month |
| **GitHub Actions** | 2,000 minutes | CI/CD | $0/month |
| **Vercel** | Free tier | Frontend hosting | $0/month |
| **Total** | | | **$0/month** |

---

**🎉 Your LuxGen backend will be fully deployed and functional for FREE!**
