# 🚀 LuxGen Backend - Production Ready

A comprehensive, production-ready, multi-tenant backend platform built with Node.js, Express, MongoDB, and Redis.

## 🏗️ Architecture Overview

### Core Features
- **Multi-Tenancy**: Complete data isolation with tenant-specific databases
- **Security**: Advanced security headers, rate limiting, and threat protection
- **Monitoring**: Comprehensive observability with Prometheus, Grafana, and custom metrics
- **Scalability**: Horizontal scaling with Docker and load balancing
- **Performance**: Optimized database connections, caching, and compression
- **Reliability**: Health checks, graceful shutdowns, and automatic recovery

### Technology Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB Atlas with connection pooling
- **Cache**: Redis for sessions and caching
- **Container**: Docker with multi-stage builds
- **Monitoring**: Prometheus, Grafana, Fluentd
- **Security**: Helmet, CORS, Rate Limiting, Input Validation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- MongoDB Atlas account
- Redis (optional, can use Docker)

### Environment Setup

1. **Clone and Install**
```bash
git clone https://github.com/susil-bot/luxgen-core.git
cd luxgen-core
npm install
```

2. **Environment Configuration**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Required Environment Variables**
```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/luxgen
MONGODB_ATLAS_URI=mongodb+srv://username:password@cluster.mongodb.net/luxgen

# Security
JWT_SECRET=your-32-character-secret-key-here
SESSION_SECRET=your-32-character-session-secret-here

# Application
NODE_ENV=production
PORT=3000
CORS_ORIGINS=https://yourdomain.com,https://app.yourdomain.com

# Monitoring
MONITORING_ENABLED=true
METRICS_ENABLED=true
LOG_LEVEL=info
```

### Development

```bash
# Start development server
npm run dev

# Run tests
npm test

# Run all tests
npm run test:all

# Lint code
npm run lint

# Format code
npm run format
```

### Production Deployment

#### Option 1: Docker Compose (Recommended)
```bash
# Start all services
docker-compose -f docker-compose.production.yml up -d

# Check status
docker-compose -f docker-compose.production.yml ps

# View logs
docker-compose -f docker-compose.production.yml logs -f
```

#### Option 2: Production Script
```bash
# Deploy with comprehensive checks
./scripts/deploy-production.sh

# Rollback if needed
./scripts/deploy-production.sh rollback

# Health check
./scripts/deploy-production.sh health
```

#### Option 3: Manual Docker
```bash
# Build production image
docker build -f Dockerfile.prod -t luxgen-backend-prod .

# Run container
docker run -p 3000:3000 --env-file .env luxgen-backend-prod
```

## 🏢 Multi-Tenancy

### Tenant Identification
The system supports multiple tenant identification methods:

1. **Subdomain**: `tenant.luxgen.com`
2. **Custom Domain**: `company.com`
3. **Header**: `X-Tenant-ID: tenant-slug`
4. **Query Parameter**: `?tenant=tenant-slug`
5. **JWT Token**: Tenant ID in JWT claims

### Data Isolation
- **Database-per-tenant**: Each tenant gets isolated database
- **Schema-per-tenant**: Shared database with tenant-specific schemas
- **Shared Database**: Single database with tenant filtering

### Tenant Features
- **Tier-based Access**: Free, Standard, Premium, Enterprise
- **Resource Quotas**: Users, storage, API calls per tenant
- **Feature Flags**: Enable/disable features per tenant
- **Custom Branding**: Tenant-specific themes and configurations

## 🔒 Security

### Security Features
- **Authentication**: JWT-based with refresh tokens
- **Authorization**: Role-based access control (RBAC)
- **Rate Limiting**: Tenant-aware rate limiting
- **Input Validation**: Comprehensive request validation
- **XSS Protection**: Cross-site scripting prevention
- **SQL Injection**: Database injection prevention
- **CORS**: Configurable cross-origin resource sharing
- **Security Headers**: Helmet.js security headers
- **Audit Logging**: Comprehensive security event logging

### Security Configuration
```javascript
// Example security configuration
const securityConfig = {
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: '24h',
    refreshExpiresIn: '7d'
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // requests per window
  },
  cors: {
    origin: ['https://yourdomain.com'],
    credentials: true
  }
};
```

## 📊 Monitoring & Observability

### Metrics Collection
- **Application Metrics**: Request count, response time, error rate
- **System Metrics**: CPU, memory, disk usage
- **Database Metrics**: Connection pool, query performance
- **Tenant Metrics**: Usage per tenant, feature adoption

### Health Checks
```bash
# Application health
curl http://localhost:3000/health

# Metrics endpoint
curl http://localhost:3000/metrics

# Prometheus metrics
curl http://localhost:9090/metrics
```

### Monitoring Stack
- **Prometheus**: Metrics collection and storage
- **Grafana**: Visualization and dashboards
- **Fluentd**: Log aggregation
- **Custom Dashboards**: Application-specific monitoring

## 🚀 Performance Optimization

### Database Optimization
- **Connection Pooling**: Optimized MongoDB connections
- **Query Optimization**: Indexed queries and aggregation
- **Caching**: Redis-based caching for frequently accessed data
- **Read Replicas**: Read scaling for high-traffic scenarios

### Application Optimization
- **Compression**: Gzip compression for responses
- **Clustering**: Multi-process clustering for CPU utilization
- **Memory Management**: Optimized memory usage and garbage collection
- **CDN Integration**: Static asset delivery optimization

## 🔧 Configuration

### Production Configuration
The system uses a comprehensive configuration system:

```javascript
// src/config/production.js
const config = {
  app: {
    name: 'LuxGen Backend',
    version: '1.0.0',
    environment: 'production',
    port: 3000
  },
  database: {
    mongodb: {
      uri: process.env.MONGODB_URI,
      options: {
        maxPoolSize: 10,
        minPoolSize: 2,
        maxIdleTimeMS: 30000
      }
    }
  },
  security: {
    jwt: { /* JWT configuration */ },
    cors: { /* CORS configuration */ },
    rateLimit: { /* Rate limiting */ }
  },
  monitoring: {
    enabled: true,
    metrics: { /* Metrics configuration */ },
    logging: { /* Logging configuration */ }
  }
};
```

### Environment Variables
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `MONGODB_URI` | MongoDB connection string | - | ✅ |
| `JWT_SECRET` | JWT signing secret | - | ✅ |
| `SESSION_SECRET` | Session secret | - | ✅ |
| `NODE_ENV` | Environment | development | ❌ |
| `PORT` | Server port | 3000 | ❌ |
| `CORS_ORIGINS` | Allowed origins | localhost | ❌ |
| `LOG_LEVEL` | Logging level | info | ❌ |
| `MONITORING_ENABLED` | Enable monitoring | false | ❌ |

## 🧪 Testing

### Test Suite
```bash
# Run all tests
npm run test:all

# Run specific test suites
npm run test:api          # API tests
npm run test:integration   # Integration tests
npm run test:performance   # Performance tests
npm run test:security      # Security tests
npm run test:multi-tenant  # Multi-tenancy tests
```

### Test Coverage
- **Unit Tests**: Individual component testing
- **Integration Tests**: API endpoint testing
- **Performance Tests**: Load and stress testing
- **Security Tests**: Vulnerability and penetration testing
- **Multi-tenant Tests**: Tenant isolation verification

## 📈 Scaling

### Horizontal Scaling
```bash
# Scale application instances
docker-compose -f docker-compose.production.yml up -d --scale luxgen-backend=3

# Load balancer configuration
# Use nginx or cloud load balancer for distribution
```

### Vertical Scaling
- **Memory**: Increase container memory limits
- **CPU**: Add more CPU cores
- **Database**: Upgrade MongoDB Atlas tier
- **Cache**: Increase Redis memory allocation

## 🔄 CI/CD Pipeline

### GitHub Actions
The repository includes comprehensive CI/CD pipelines:

- **Security Audits**: Automated security scanning
- **Quality Checks**: Code linting and formatting
- **Testing**: Automated test execution
- **Docker Build**: Multi-architecture image building
- **Deployment**: Automated production deployment
- **Monitoring**: Post-deployment health checks

### Deployment Environments
- **Staging**: Pre-production testing environment
- **Production**: Live production environment
- **Rollback**: Automatic rollback on failure

## 📚 API Documentation

### Core Endpoints
```
GET  /health              # Health check
GET  /metrics             # Application metrics
GET  /api/v1/tenants      # Tenant management
POST /api/v1/auth/login   # Authentication
GET  /api/v1/users        # User management
```

### Multi-tenant Endpoints
```
GET  /api/v1/tenants/:id/users     # Tenant-specific users
POST /api/v1/tenants/:id/groups   # Tenant-specific groups
GET  /api/v1/tenants/:id/analytics # Tenant analytics
```

## 🛠️ Troubleshooting

### Common Issues

1. **Database Connection Issues**
```bash
# Check MongoDB connection
node test-mongodb-atlas.js

# Verify environment variables
echo $MONGODB_URI
```

2. **Memory Issues**
```bash
# Check memory usage
docker stats

# Monitor application logs
docker-compose logs -f luxgen-backend
```

3. **Performance Issues**
```bash
# Check metrics
curl http://localhost:3000/metrics

# View Grafana dashboard
open http://localhost:3001
```

### Logs and Debugging
```bash
# Application logs
docker-compose logs -f luxgen-backend

# All service logs
docker-compose logs -f

# Specific log levels
LOG_LEVEL=debug npm start
```

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

### Code Standards
- **ESLint**: Code linting and style enforcement
- **Prettier**: Code formatting
- **Husky**: Git hooks for quality checks
- **Jest**: Comprehensive testing framework

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [GitHub Wiki](https://github.com/susil-bot/luxgen-core/wiki)
- **Issues**: [GitHub Issues](https://github.com/susil-bot/luxgen-core/issues)
- **Discussions**: [GitHub Discussions](https://github.com/susil-bot/luxgen-core/discussions)

## 🎯 Roadmap

- [ ] GraphQL API support
- [ ] WebSocket real-time features
- [ ] Advanced analytics dashboard
- [ ] Machine learning integration
- [ ] Microservices architecture
- [ ] Kubernetes deployment
- [ ] Advanced security features
- [ ] Performance optimization
- [ ] Mobile SDK
- [ ] Third-party integrations

---

**Built with ❤️ by the LuxGen Team**
