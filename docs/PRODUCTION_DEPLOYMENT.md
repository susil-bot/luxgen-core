# 🚀 Production Deployment Guide - Render.com

## 📋 Overview

This guide provides step-by-step instructions for deploying the LuxGen Trainer Platform to Render.com's free tier with a complete CI/CD pipeline.

## 🔧 Prerequisites

### 1. Required Accounts
- [GitHub Account](https://github.com)
- [Render.com Account](https://render.com)
- [MongoDB Atlas Account](https://mongodb.com/atlas) (for database)
- [Redis Cloud Account](https://redis.com/redis-enterprise-cloud) (for caching)

### 2. API Keys Required
- **Groq API Key** - For AI content generation
- **OpenAI API Key** - For AI embeddings and advanced features
- **Email Service API Key** - For email notifications

## 🛠️ Setup Instructions

### Step 1: Environment Variables Setup

Create the following environment variables in your Render.com service:

```bash
# Application
NODE_ENV=production
PORT=3001

# Database (MongoDB Atlas)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/luxgen_trainer_platform?retryWrites=true&w=majority

# Redis Cache (Redis Cloud)
REDIS_URL=redis://username:password@host:port

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key-here-2024
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Session Configuration
SESSION_SECRET=your-super-secure-session-secret-key-here-2024

# AI Services
GROQ_API_KEY=your-groq-api-key-here
OPENAI_API_KEY=your-openai-api-key-here

# Email Service
EMAIL_SERVICE_API_KEY=your-email-service-api-key-here
EMAIL_FROM=noreply@luxgen.com

# Security
CORS_ORIGIN=https://your-frontend-domain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring
ENABLE_MONITORING=true
LOG_LEVEL=info

# Render.com Specific
RENDER=true
RENDER_EXTERNAL_URL=https://your-app-name.onrender.com
```

### Step 2: GitHub Repository Setup

1. **Fork/Clone the Repository**
   ```bash
   git clone https://github.com/susil-bot/luxgen-core.git
   cd luxgen-core
   ```

2. **Add GitHub Secrets**
   Go to your GitHub repository → Settings → Secrets and variables → Actions
   Add the following secrets:
   - `RENDER_API_KEY` - Your Render API key
   - `RENDER_SERVICE_ID` - Your Render service ID
   - `RENDER_STAGING_SERVICE_ID` - Your staging service ID (optional)

### Step 3: Render.com Service Setup

1. **Create New Web Service**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure Service Settings**
   - **Name**: `luxgen-trainer-platform-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/health`

3. **Environment Variables**
   - Add all environment variables from Step 1
   - Mark sensitive variables as "Secret"

### Step 4: Database Setup

1. **MongoDB Atlas**
   - Create a new cluster
   - Create a database user
   - Get your connection string
   - Add to `MONGODB_URI` environment variable

2. **Redis Cloud**
   - Create a new Redis database
   - Get your connection string
   - Add to `REDIS_URL` environment variable

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

The pipeline includes:

1. **Test & Build Job**
   - Linting and code quality checks
   - Security audits
   - Unit and integration tests
   - API tests
   - Docker image build

2. **Deployment Jobs**
   - Production deployment (main branch)
   - Staging deployment (develop branch)

3. **Security Checks**
   - Vulnerability scanning
   - Code quality analysis

4. **Performance Testing**
   - Load testing
   - Performance benchmarks

### Manual Deployment

```bash
# Deploy to production
git push origin main

# Deploy to staging
git push origin develop
```

## 🚀 Deployment Process

### 1. Initial Deployment
1. Push code to `main` branch
2. GitHub Actions will automatically:
   - Run tests
   - Build the application
   - Deploy to Render.com

### 2. Monitoring Deployment
- Check GitHub Actions for build status
- Monitor Render.com dashboard for deployment progress
- Verify health checks pass

### 3. Post-Deployment Verification
```bash
# Check health endpoint
curl https://your-app-name.onrender.com/health

# Check API documentation
curl https://your-app-name.onrender.com/docs

# Run API tests
npm run api:test:simple
```

## 🔍 Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Check for syntax errors

2. **Database Connection Issues**
   - Verify MongoDB Atlas connection string
   - Check network access settings
   - Ensure database user has correct permissions

3. **Redis Connection Issues**
   - Verify Redis Cloud connection string
   - Check Redis database status
   - Ensure proper authentication

4. **Environment Variable Issues**
   - Verify all required variables are set
   - Check for typos in variable names
   - Ensure sensitive data is marked as secret

### Debug Commands

```bash
# Check application logs
npm run logs

# Check database connection
npm run db:status

# Run health checks
npm run health:check

# Test API endpoints
npm run api:test:simple
```

## 📊 Monitoring & Maintenance

### Health Monitoring
- **Health Endpoint**: `/health`
- **Detailed Health**: `/health/detailed`
- **API Documentation**: `/docs`

### Performance Monitoring
- Monitor response times
- Check memory usage
- Track database performance
- Monitor cache hit rates

### Security Monitoring
- Regular security audits
- Dependency vulnerability checks
- API rate limiting monitoring
- JWT token validation

## 🔒 Security Best Practices

1. **Environment Variables**
   - Never commit secrets to version control
   - Use Render.com's secret management
   - Rotate keys regularly

2. **Database Security**
   - Use MongoDB Atlas with network access controls
   - Enable database encryption
   - Regular backup schedules

3. **API Security**
   - Implement rate limiting
   - Use HTTPS only
   - Validate all inputs
   - Implement proper authentication

## 📈 Scaling Considerations

### Free Tier Limitations
- **Instance Spinning**: Free instances spin down after 15 minutes of inactivity
- **Cold Start**: First request after spin-down may take 30-60 seconds
- **Resource Limits**: Limited CPU and memory

### Upgrade Path
When ready to upgrade:
1. **Paid Plan**: Upgrade to Render's paid plan for always-on instances
2. **Auto-scaling**: Enable auto-scaling for traffic spikes
3. **Load Balancing**: Add load balancer for high availability
4. **CDN**: Add CDN for static assets

## 🎯 Success Metrics

### Deployment Success
- ✅ All tests pass
- ✅ Health checks return 200
- ✅ API endpoints respond correctly
- ✅ Database connections stable
- ✅ Cache system operational

### Performance Targets
- **Response Time**: < 500ms for API calls
- **Uptime**: > 99.9%
- **Error Rate**: < 0.1%
- **Memory Usage**: < 80% of allocated

## 📞 Support

For deployment issues:
1. Check Render.com documentation
2. Review GitHub Actions logs
3. Check application logs in Render dashboard
4. Verify environment variables
5. Test locally with production config

---

**🎉 Congratulations!** Your LuxGen Trainer Platform is now deployed and ready for production use! 