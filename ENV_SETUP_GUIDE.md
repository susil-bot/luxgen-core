# 🎯 **Environment Variables Setup Guide**

## 📋 **Overview**

We've simplified the environment configuration to eliminate confusion. Now you have **only 2 files**:

- **`.env`** - Your actual environment variables (with real values)
- **`.env.example`** - Template for new developers (with placeholder values)

## 🗂️ **File Structure**

```
backend/
├── .env                    # ✅ YOUR ACTUAL CONFIG (with real values)
├── .env.example           # 📋 TEMPLATE (with placeholders)
└── ENV_SETUP_GUIDE.md     # 📖 This guide
```

## 🚀 **Quick Start**

### **For New Developers:**
```bash
# 1. Copy the template
cp .env.example .env

# 2. Edit with your actual values
nano .env

# 3. Start the application
npm start
```

### **For Existing Developers:**
```bash
# Your .env file is already set up correctly
# Just start the application
npm start
```

## 🔧 **Key Sections in .env**

### **📱 Application Settings**
```bash
NODE_ENV=development
PORT=3001
APP_NAME=LuxGen Trainer Platform
```

### **🗄️ Database Configuration**
```bash
MONGODB_URL=mongodb://127.0.0.1:27017/luxgen_trainer_platform
REDIS_URL=redis://127.0.0.1:6379
```

### **🔐 Authentication & Security**
```bash
JWT_SECRET=your_jwt_secret_key_here_change_in_production_min_32_chars
SESSION_SECRET=your_session_secret_here_change_in_production_min_32_chars
```

### **🤖 AI Services**
```bash
AI_PROVIDER=groq
GROQ_API_KEY=your-groq-api-key
OPENAI_API_KEY=your-openai-api-key
```

### **📧 Email Configuration**
```bash
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## 🏢 **Tenant-Specific Configurations**

The `.env` file includes configurations for specific tenants:

### **Demo Tenant**
```bash
DEMO_SMTP_HOST=smtp.gmail.com
DEMO_STRIPE_PUBLISHABLE_KEY=your-demo-stripe-publishable-key
```

### **ACME Corporation Tenant**
```bash
ACME_SENDGRID_KEY=your-acme-sendgrid-key
ACME_AWS_ACCESS_KEY=your-acme-aws-access-key
```

## 🔄 **Environment Switching**

### **Development**
```bash
NODE_ENV=development
PORT=3001
MONGODB_URL=mongodb://127.0.0.1:27017/luxgen_trainer_platform
```

### **Production**
```bash
NODE_ENV=production
PORT=10000
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/trainer_platform
```

## 🛡️ **Security Notes**

### **Required Updates for Production:**
1. **Change NODE_ENV to production**
2. **Update all secrets with strong, unique values**
3. **Use MongoDB Atlas or production database**
4. **Configure proper email service**
5. **Set up SSL/TLS certificates**
6. **Update CORS_ORIGIN with production frontend URL**

### **Example Production Secrets:**
```bash
JWT_SECRET=super-secret-jwt-key-min-32-chars-long-and-random
SESSION_SECRET=another-super-secret-session-key-min-32-chars
GROQ_API_KEY=your-actual-groq-api-key
```

## 📝 **What Was Removed**

We removed these confusing files:
- ❌ `.env.production.template` (merged into main .env)
- ❌ Multiple conflicting .env files
- ❌ Duplicate configurations

## ✅ **Benefits of New Setup**

1. **🎯 Single Source of Truth**: Only one `.env` file to manage
2. **📋 Clear Template**: `.env.example` for new developers
3. **🏷️ Well Organized**: Clear sections with emojis and comments
4. **🔧 Easy to Understand**: All variables in one place
5. **🔄 Simple Switching**: Easy to switch between environments

## 🚨 **Important Notes**

1. **Never commit `.env` to Git** (it's in `.gitignore`)
2. **Always commit `.env.example`** (it's the template)
3. **Update `.env.example`** when adding new variables
4. **Use strong secrets** in production
5. **Keep backups** of your production `.env` file

## 🆘 **Troubleshooting**

### **Application won't start:**
```bash
# Check if .env exists
ls -la .env

# Check if required variables are set
grep "MONGODB_URL\|JWT_SECRET" .env
```

### **Database connection issues:**
```bash
# Verify MongoDB is running
mongosh "mongodb://127.0.0.1:27017/luxgen_trainer_platform"

# Check Redis connection
redis-cli ping
```

### **Missing variables:**
```bash
# Copy from example
cp .env.example .env

# Edit with your values
nano .env
```

---

**🎉 You now have a clean, organized, and confusion-free environment setup!** 