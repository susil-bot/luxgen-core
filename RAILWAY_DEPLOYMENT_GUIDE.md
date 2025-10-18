# 🚂 Railway Deployment Guide

## ✅ **Backend Deployment to Railway**

### **Step 1: Go to Railway**
1. **Open**: https://railway.app/
2. **Sign up/Login** with GitHub account
3. **Click**: "New Project"
4. **Choose**: "Deploy from GitHub repo"

### **Step 2: Connect Repository**
1. **Select Repository**: `susil-bot/luxgen-core`
2. **Choose Root Directory**: `luxgen-backend`
3. **Railway will automatically detect**: Your Dockerfile
4. **Click**: "Deploy Now"

### **Step 3: Set Environment Variables**
In Railway dashboard, go to **Variables** tab and add:

```bash
# Database
MONGODB_URI=mongodb+srv://luxgen-user:LuxGenPassword123!@luxgen-cluster.xxxxx.mongodb.net/luxgen?retryWrites=true&w=majority

# Server
PORT=3001
NODE_ENV=production

# CORS
CORS_ORIGINS=https://luxgen-frontend.vercel.app,https://luxgen-multi-tenant.vercel.app
CORS_CREDENTIALS=true

# JWT
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
JWT_EXPIRES_IN=7d

# API
API_VERSION=v1
API_PREFIX=/api
```

### **Step 4: Deploy**
Railway will automatically:
- ✅ **Detect Dockerfile**: Uses your existing multi-stage Dockerfile
- ✅ **Build Docker image**: Multi-stage build process
- ✅ **Deploy container**: Run the container
- ✅ **Provide URL**: `https://luxgen-core-production.up.railway.app`

---

## 🧪 **Testing After Deployment**

### **Health Check Commands:**
```bash
# Basic health check
curl https://luxgen-core-production.up.railway.app/health

# Detailed health check
curl https://luxgen-core-production.up.railway.app/health/detailed

# Database status
curl https://luxgen-core-production.up.railway.app/api/database/status
```

---

## 🎯 **Why Railway Instead of Netlify?**

| Platform | Purpose | Backend Support | Cost |
|----------|---------|-----------------|------|
| **Netlify** | Frontend static sites | ❌ No backend APIs | Free |
| **Railway** | Backend APIs & Docker | ✅ Full backend support | Free ($5 credit) |

**Railway is the correct platform for backend APIs!**
