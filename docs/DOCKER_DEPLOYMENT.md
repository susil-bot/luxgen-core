# 🐳 Docker Deployment Guide

## Table of Contents
- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Development Environment](#development-environment)
- [Production Deployment](#production-deployment)
- [Monitoring & Observability](#monitoring--observability)
- [Troubleshooting](#troubleshooting)
- [Security Considerations](#security-considerations)

## Overview

This guide covers the comprehensive Docker setup for the Trainer Platform Backend, featuring:

- **Multi-stage Docker builds** for optimized production images
- **Development and production environments** with separate configurations
- **Complete monitoring stack** (Prometheus, Grafana, ELK)
- **Database and caching** (MongoDB, Redis)
- **Reverse proxy** (Nginx) with SSL support
- **Health checks and auto-scaling** capabilities

## Prerequisites

### Required Software
- Docker Desktop 4.0+ (Windows/Mac) or Docker Engine 20.10+ (Linux)
- Docker Compose 2.0+
- At least 4GB RAM available for Docker
- 10GB free disk space

### Environment Variables
Create a `.env` file in the project root:

```bash
# Database Configuration
MONGODB_URL=mongodb://mongodb:27017/trainer_platform
REDIS_URL=redis://redis:6379

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars

# AI Service Keys
GROQ_API_KEY=your-groq-api-key
OPENAI_API_KEY=your-openai-api-key

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Monitoring
GRAFANA_PASSWORD=admin
REDIS_PASSWORD=redispassword

# Database Credentials
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=password
```

## Quick Start

### 1. Development Environment

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop services
docker-compose -f docker-compose.dev.yml down
```

### 2. Production Environment

```bash
# Start production environment
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 3. Run Tests

```bash
# Run the comprehensive test suite
./scripts/test-docker.sh

# Validate configurations only
./scripts/test-docker.sh --validate-only

# Run tests without cleanup
./scripts/test-docker.sh --no-cleanup
```

## Configuration

### Dockerfile Stages

The Dockerfile includes multiple stages for different purposes:

#### Base Stage
```dockerfile
FROM node:18-alpine AS base
```
- Common dependencies and configurations
- Security updates and system packages
- Non-root user setup

#### Dependencies Stage
```dockerfile
FROM base AS dependencies
```
- Production dependency installation
- Security audit integration
- Cache optimization

#### Testing Stage
```dockerfile
FROM dependencies AS testing
```
- Development dependencies
- Test execution
- Security scanning

#### Build Stage
```dockerfile
FROM dependencies AS build
```
- Application building
- Asset optimization
- Production preparation

#### Production Stage
```dockerfile
FROM base AS production
```
- Minimal production image
- Security hardening
- Health checks

#### Development Stage
```dockerfile
FROM base AS development
```
- Development tools
- Hot reloading
- Debugging capabilities

### Docker Compose Services

#### Backend Service
- **Image**: Multi-stage build with production target
- **Ports**: 3001 (API), 3002 (Grafana), 9091 (Prometheus)
- **Volumes**: Code mounting, logs, uploads
- **Health Checks**: HTTP endpoint monitoring
- **Resource Limits**: CPU and memory constraints

#### Database Services
- **MongoDB**: Document database with authentication
- **Redis**: In-memory cache with persistence
- **Health Checks**: Connection and query testing

#### Monitoring Stack
- **Prometheus**: Metrics collection and storage
- **Grafana**: Visualization and dashboards
- **Elasticsearch**: Log aggregation
- **Kibana**: Log visualization

#### Development Tools
- **Mongo Express**: Database administration
- **Redis Commander**: Cache management
- **Hot Reloading**: Code changes without restart

## Development Environment

### Features
- **Hot Reloading**: Code changes reflect immediately
- **Volume Mounting**: Local development with containerized services
- **Debugging Tools**: Full development toolchain
- **Database Management**: Web-based admin interfaces

### Access Points
- **Application**: http://localhost:3001
- **Grafana**: http://localhost:3002 (admin/admin)
- **Prometheus**: http://localhost:9091
- **Mongo Express**: http://localhost:8081 (admin/password)
- **Redis Commander**: http://localhost:8082

### Development Workflow

```bash
# 1. Start development environment
docker-compose -f docker-compose.dev.yml up -d

# 2. Make code changes (hot reloading enabled)

# 3. Run tests
docker-compose -f docker-compose.dev.yml run --rm test

# 4. Check logs
docker-compose -f docker-compose.dev.yml logs -f backend

# 5. Access database
docker-compose -f docker-compose.dev.yml exec mongodb mongosh

# 6. Stop environment
docker-compose -f docker-compose.dev.yml down
```

## Production Deployment

### Features
- **Optimized Images**: Minimal production footprint
- **Security Hardening**: Non-root users, security headers
- **Load Balancing**: Nginx reverse proxy
- **SSL/TLS**: HTTPS encryption
- **Monitoring**: Comprehensive observability

### Deployment Steps

#### 1. Environment Setup
```bash
# Create production environment file
cp .env.example .env.production

# Edit production variables
nano .env.production
```

#### 2. SSL Certificate Setup
```bash
# Generate self-signed certificates (development)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem

# Or use Let's Encrypt for production
```

#### 3. Production Deployment
```bash
# Build and start production services
docker-compose --env-file .env.production up -d

# Verify deployment
docker-compose ps
docker-compose logs backend
```

#### 4. Health Monitoring
```bash
# Check service health
curl -f http://localhost/health

# Monitor metrics
curl -f http://localhost/metrics

# View Grafana dashboards
open http://localhost/grafana
```

### Production Considerations

#### Resource Management
```yaml
deploy:
  resources:
    limits:
      memory: 1G
      cpus: '0.5'
    reservations:
      memory: 512M
      cpus: '0.25'
```

#### Security Hardening
- Non-root user execution
- Security headers configuration
- Input validation and sanitization
- Rate limiting and DDoS protection

#### Backup Strategy
```bash
# Database backup
docker-compose exec mongodb mongodump --out /backup

# Volume backup
docker run --rm -v backend_mongodb_data:/data -v $(pwd):/backup alpine tar czf /backup/mongodb-backup.tar.gz /data
```

## Monitoring & Observability

### Metrics Collection
- **Application Metrics**: Request rates, response times, error rates
- **System Metrics**: CPU, memory, disk usage
- **Database Metrics**: Query performance, connection pools
- **Cache Metrics**: Hit rates, memory usage

### Logging Strategy
- **Structured Logging**: JSON format for easy parsing
- **Log Aggregation**: Centralized log collection
- **Log Retention**: Configurable retention policies
- **Log Analysis**: Real-time log monitoring

### Alerting
- **Health Checks**: Automatic service monitoring
- **Performance Alerts**: Response time thresholds
- **Error Alerts**: Error rate monitoring
- **Resource Alerts**: Memory and CPU thresholds

### Dashboard Examples
- **Application Overview**: Key performance indicators
- **Database Performance**: Query analysis and optimization
- **System Resources**: Infrastructure monitoring
- **Error Tracking**: Error rates and debugging

## Troubleshooting

### Common Issues

#### 1. Docker Daemon Not Running
```bash
# Start Docker Desktop
open -a Docker

# Or start Docker service (Linux)
sudo systemctl start docker
```

#### 2. Port Conflicts
```bash
# Check port usage
lsof -i :3001

# Change ports in docker-compose.yml
ports:
  - "3002:3001"  # Use different host port
```

#### 3. Database Connection Issues
```bash
# Check MongoDB status
docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"

# Check Redis status
docker-compose exec redis redis-cli ping

# View database logs
docker-compose logs mongodb
docker-compose logs redis
```

#### 4. Memory Issues
```bash
# Check container resource usage
docker stats

# Increase Docker memory allocation
# Docker Desktop > Settings > Resources > Memory
```

#### 5. Build Failures
```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache
```

### Debug Commands

```bash
# View all container logs
docker-compose logs

# Follow specific service logs
docker-compose logs -f backend

# Execute commands in containers
docker-compose exec backend sh
docker-compose exec mongodb mongosh

# Check container health
docker-compose ps

# View resource usage
docker stats

# Inspect container configuration
docker inspect trainer-platform-backend
```

### Performance Optimization

#### 1. Build Optimization
```dockerfile
# Use .dockerignore to exclude unnecessary files
# Leverage Docker layer caching
# Use multi-stage builds for smaller images
```

#### 2. Runtime Optimization
```yaml
# Configure resource limits
# Use health checks for automatic recovery
# Implement proper logging levels
```

#### 3. Database Optimization
```javascript
// Use connection pooling
// Implement query optimization
// Configure proper indexes
```

## Security Considerations

### Container Security
- **Non-root Users**: All containers run as non-root
- **Image Scanning**: Regular security vulnerability scans
- **Secrets Management**: Environment variables for sensitive data
- **Network Isolation**: Separate networks for different services

### Application Security
- **Input Validation**: Comprehensive request validation
- **Authentication**: JWT-based authentication
- **Authorization**: Role-based access control
- **Rate Limiting**: API rate limiting and DDoS protection

### Infrastructure Security
- **SSL/TLS**: HTTPS encryption for all communications
- **Security Headers**: Comprehensive security headers
- **Access Control**: Network-level access restrictions
- **Monitoring**: Security event monitoring and alerting

### Best Practices
1. **Regular Updates**: Keep base images and dependencies updated
2. **Security Scanning**: Regular vulnerability assessments
3. **Access Control**: Implement proper authentication and authorization
4. **Monitoring**: Comprehensive security monitoring
5. **Backup**: Regular data backups and disaster recovery planning

## Advanced Topics

### Customization
- **Environment-specific configurations**
- **Custom monitoring dashboards**
- **Integration with external services**
- **Custom health checks**

### Scaling
- **Horizontal scaling with load balancers**
- **Database clustering and replication**
- **Cache distribution strategies**
- **Auto-scaling configurations**

### CI/CD Integration
- **Automated testing in containers**
- **Multi-environment deployments**
- **Rollback strategies**
- **Blue-green deployments**

---

## Support

For additional support:
- Check the troubleshooting section above
- Review the application logs
- Consult the monitoring dashboards
- Contact the development team

**Last Updated**: July 2025
**Version**: 1.0.0 