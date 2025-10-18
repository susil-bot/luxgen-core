# 🚀 LuxGen Backend

A robust, multi-tenant backend API built with Node.js, Express, and MongoDB Atlas. Features comprehensive authentication, tenant management, and AI-powered content creation.

## 📋 **Table of Contents**

- [Features](#features)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Development](#development)
- [Testing](#testing)
- [Contributing](#contributing)

## ✨ **Features**

### 🔐 **Authentication & Security**
- JWT-based authentication
- Role-based access control (RBAC)
- Password hashing with bcrypt
- Email verification
- Password reset functionality
- Rate limiting and security headers

### 🏢 **Multi-Tenancy**
- Tenant isolation
- Subdomain-based routing
- Tenant-specific configurations
- Feature flags per tenant
- Usage limits and quotas

### 🤖 **AI Integration**
- Content generation
- Smart recommendations
- Natural language processing
- Automated workflows

### 📊 **Analytics & Monitoring**
- Real-time analytics
- Performance monitoring
- Health checks
- Error tracking
- Usage metrics

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+
- MongoDB Atlas account
- Netlify account (for deployment)

### **Installation**
```bash
# Clone repository
git clone https://github.com/susil-bot/luxgen-core.git
cd luxgen-core/luxgen-backend

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

### **Environment Variables**
```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/luxgen

# Server
NODE_ENV=development
PORT=3000

# JWT
JWT_SECRET=your-secure-jwt-secret
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGINS=http://localhost:3000,https://your-frontend.com
CORS_CREDENTIALS=true
```

## 🏗️ **Architecture**

### **Project Structure**
```
luxgen-backend/
├── src/
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Custom middleware
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── utils/          # Utility functions
│   └── index.js        # Application entry point
├── netlify/
│   └── functions/      # Serverless functions
├── docs/               # Documentation
├── scripts/            # Utility scripts
└── tests/             # Test files
```

### **Technology Stack**
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB Atlas
- **Authentication**: JWT
- **Deployment**: Netlify Functions
- **Testing**: Jest
- **Linting**: ESLint

## 📚 **API Documentation**

### **Base URL**
- **Development**: `http://localhost:3000`
- **Production**: `https://luxgen-backend.netlify.app`

### **Authentication Endpoints**
```
POST /api/auth/register     # User registration
POST /api/auth/login        # User login
POST /api/auth/logout       # User logout
POST /api/auth/refresh      # Refresh token
POST /api/auth/forgot-password
POST /api/auth/reset-password
POST /api/auth/verify-email
```

### **User Management**
```
GET  /api/users/me          # Get current user
PUT  /api/users/me          # Update current user
GET  /api/users              # List users (admin)
POST /api/users              # Create user (admin)
GET  /api/users/:id          # Get user by ID
PUT  /api/users/:id          # Update user
DELETE /api/users/:id        # Delete user
```

### **Tenant Management**
```
GET  /api/tenants            # List tenants
POST /api/tenants            # Create tenant
GET  /api/tenants/:id        # Get tenant
PUT  /api/tenants/:id        # Update tenant
DELETE /api/tenants/:id      # Delete tenant
```

### **Health Check**
```
GET  /health                 # Basic health check
GET  /health/detailed        # Detailed health check
GET  /api/database/status    # Database status
```

## 🚀 **Deployment**

### **Netlify Deployment**
1. **Set up MongoDB Atlas**: Follow [MongoDB Setup Guide](docs/deployment/MONGODB_SETUP_INSTRUCTIONS.md)
2. **Configure Netlify**: Follow [Netlify Setup Guide](docs/deployment/NETLIFY_SETUP_INSTRUCTIONS.md)
3. **Deploy**: Push to main branch triggers automatic deployment

### **Environment Variables**
See [Deployment Guide](docs/deployment/SECURE_DEPLOYMENT_GUIDE.md) for complete environment configuration.

### **Monitoring**
- **Health Check**: `https://luxgen-backend.netlify.app/health`
- **API Status**: `https://luxgen-backend.netlify.app/api/database/status`

## 🛠️ **Development**

### **Available Scripts**
```bash
npm start              # Start production server
npm run dev            # Start development server
npm run build          # Build for production
npm test               # Run tests
npm run test:watch     # Run tests in watch mode
npm run lint           # Run ESLint
npm run lint:fix       # Fix ESLint issues
```

### **Code Quality**
- **ESLint**: Configured with strict rules
- **Pre-commit hooks**: Automatic linting and testing
- **Code formatting**: Consistent code style
- **Security**: No hardcoded secrets

### **Database Setup**
```bash
# Run database setup
npm run setup:db

# Seed initial data
npm run seed:data
```

## 🧪 **Testing**

### **Test Structure**
```
tests/
├── integration/        # Integration tests
├── performance/        # Performance tests
└── validation/         # Validation tests
```

### **Running Tests**
```bash
# Run all tests
npm test

# Run specific test suites
npm run test:integration
npm run test:performance
npm run test:validation

# Run tests with coverage
npm run test:coverage
```

### **Test Data**
- **Fixtures**: Predefined test data
- **Mocking**: External service mocking
- **Database**: Test database setup

## 📖 **Documentation**

### **API Documentation**
- [Complete API Reference](docs/api/COMPLETE_API_DOCUMENTATION.md)
- [Authentication Guide](docs/api/AUTHENTICATION_FLOW_GUIDE.md)
- [Multi-tenancy Guide](docs/api/MULTI_TENANCY_ARCHITECTURE.md)

### **Development Guides**
- [Database Setup](docs/DATABASE_SETUP_GUIDE.md)
- [Health Monitoring](docs/HEALTH_CHECK_FEATURE.md)
- [Testing Guide](docs/TESTING_GUIDE.md)

### **Deployment Guides**
- [Secure Deployment](docs/deployment/SECURE_DEPLOYMENT_GUIDE.md)
- [Netlify Deployment](docs/deployment/NETLIFY_DEPLOYMENT_GUIDE.md)
- [MongoDB Setup](docs/deployment/MONGODB_SETUP_INSTRUCTIONS.md)

## 🤝 **Contributing**

### **Development Workflow**
1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes
4. **Run** tests and linting
5. **Commit** with conventional commits
6. **Push** to your fork
7. **Create** a pull request

### **Code Standards**
- **ESLint**: Follow configured rules
- **Testing**: Write tests for new features
- **Documentation**: Update docs for changes
- **Security**: No hardcoded secrets

### **Pre-commit Hooks**
```bash
# Install pre-commit hooks
npm run setup:pre-commit

# Run manually
npm run pre-commit
```

## 📊 **Performance**

### **Optimizations**
- **Database indexing**: Optimized queries
- **Caching**: Redis for session storage
- **Compression**: Gzip compression
- **Rate limiting**: API protection

### **Monitoring**
- **Health checks**: Automated monitoring
- **Error tracking**: Comprehensive logging
- **Performance metrics**: Response time tracking
- **Usage analytics**: API usage statistics

## 🔒 **Security**

### **Security Features**
- **Authentication**: JWT-based auth
- **Authorization**: Role-based access
- **Input validation**: Request validation
- **SQL injection**: MongoDB protection
- **XSS protection**: Security headers
- **CORS**: Configured origins

### **Security Checklist**
- [ ] No hardcoded secrets
- [ ] Environment variables secured
- [ ] Database access restricted
- [ ] CORS properly configured
- [ ] Security headers enabled
- [ ] Rate limiting active

## 📞 **Support**

### **Getting Help**
- **Documentation**: Check the docs folder
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Email**: team@luxgen.com

### **Troubleshooting**
- **Health Check**: `/health` endpoint
- **Database**: `/api/database/status`
- **Logs**: Check Netlify function logs
- **Debug**: Enable debug mode

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 **Roadmap**

### **Upcoming Features**
- [ ] GraphQL API
- [ ] Real-time notifications
- [ ] Advanced analytics
- [ ] Machine learning integration
- [ ] Mobile API support

### **Performance Improvements**
- [ ] Database optimization
- [ ] Caching strategies
- [ ] CDN integration
- [ ] Load balancing

---

**Built with ❤️ by the LuxGen Team**