# 🚀 CI/CD Pipeline Setup Guide

## Quick Start - Deploy to Render.com

### 1. One-Click Deployment

```bash
# Deploy to production (main branch)
npm run deploy:production

# Deploy to staging (develop branch)
npm run deploy:staging

# Quick deploy (just push to main)
npm run deploy:render
```

### 2. Manual Deployment

```bash
# Run deployment script
./scripts/deploy.sh main

# Or with custom branch
./scripts/deploy.sh develop
```

## 🔧 Setup Requirements

### GitHub Secrets (Required)
Add these to your GitHub repository → Settings → Secrets and variables → Actions:

- `RENDER_API_KEY` - Your Render API key
- `RENDER_SERVICE_ID` - Your Render service ID
- `RENDER_STAGING_SERVICE_ID` - Your staging service ID (optional)

### Environment Variables (Render.com)
Add these to your Render.com service environment variables:

```bash
NODE_ENV=production
PORT=3001
MONGODB_URI=your-mongodb-atlas-uri
REDIS_URL=your-redis-cloud-url
JWT_SECRET=your-super-secure-jwt-secret
SESSION_SECRET=your-super-secure-session-secret
GROQ_API_KEY=your-groq-api-key
OPENAI_API_KEY=your-openai-api-key
EMAIL_SERVICE_API_KEY=your-email-service-key
```

## 📋 Deployment Process

### What Happens During Deployment:

1. **Pre-deployment Checks**
   - ✅ Prerequisites verification
   - ✅ Code linting
   - ✅ Security audit
   - ✅ Unit tests
   - ✅ API tests

2. **Build Process**
   - ✅ Install dependencies
   - ✅ Build application
   - ✅ Create Docker image

3. **Deployment**
   - ✅ Push to GitHub
   - ✅ Trigger GitHub Actions
   - ✅ Deploy to Render.com

4. **Verification**
   - ✅ Health check
   - ✅ API documentation test
   - ✅ Service verification

## 🎯 Success Indicators

After deployment, verify:

```bash
# Check health endpoint
curl https://your-app-name.onrender.com/health

# Check API docs
curl https://your-app-name.onrender.com/docs

# Run API tests
npm run api:test:simple
```

## 🔍 Troubleshooting

### Common Issues:

1. **Build Failures**
   ```bash
   # Check logs
   npm run logs
   
   # Run tests locally
   npm run deploy:check
   ```

2. **Environment Variables**
   - Verify all required variables are set in Render.com
   - Check for typos in variable names
   - Ensure sensitive data is marked as secret

3. **Database Connection**
   - Verify MongoDB Atlas connection string
   - Check network access settings
   - Ensure database user has correct permissions

## 📊 Monitoring

### Health Endpoints:
- **Health Check**: `/health`
- **Detailed Health**: `/health/detailed`
- **API Documentation**: `/docs`

### GitHub Actions:
- Check Actions tab for build status
- Review logs for any errors
- Monitor deployment progress

### Render.com Dashboard:
- Monitor service status
- Check logs for runtime errors
- Verify environment variables

## 🚀 Next Steps

1. **Set up monitoring** - Configure alerts for downtime
2. **Enable auto-scaling** - Upgrade to paid plan when ready
3. **Add CDN** - For static assets optimization
4. **Set up backups** - Regular database backups
5. **Security hardening** - Regular security audits

---

**🎉 Your CI/CD pipeline is ready! Deploy with confidence!** 