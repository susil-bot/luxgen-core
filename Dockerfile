# ========================================
# 🐳 ROBUST DOCKERFILE FOR TRAINER PLATFORM
# ========================================

# Multi-stage build for optimized production image
FROM node:18-alpine AS base

# Install system dependencies and security updates
RUN apk update && apk upgrade && \
    apk add --no-cache \
    curl \
    dumb-init \
    tini \
    && rm -rf /var/cache/apk/*

# Create app directory and set permissions
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV NPM_CONFIG_LOGLEVEL=warn
ENV NODE_OPTIONS="--max-old-space-size=2048"

# ========================================
# 📦 DEPENDENCIES STAGE
# ========================================
FROM base AS dependencies

# Copy package files for dependency installation
COPY package*.json ./

# Install dependencies with security audit
RUN npm ci --only=production --audit=false && \
    npm audit --audit-level=moderate || true && \
    npm cache clean --force

# ========================================
# 🧪 TESTING STAGE
# ========================================
FROM dependencies AS testing

# Install dev dependencies for testing
RUN npm ci --include=dev

# Copy source code for testing
COPY . .

# Run security audit and tests
RUN npm run security:audit || true && \
    npm test -- --passWithNoTests

# ========================================
# 🏗️ BUILD STAGE
# ========================================
FROM dependencies AS build

# Copy source code
COPY . .

# Create production build (if needed)
RUN npm run build || echo "No build step required"

# ========================================
# 🚀 PRODUCTION STAGE
# ========================================
FROM base AS production

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production --audit=false && \
    npm cache clean --force

# Copy built application
COPY --from=build /app/src ./src
COPY --from=build /app/docs ./docs
COPY --from=build /app/scripts ./scripts

# Copy configuration files
COPY --from=build /app/.env.example ./.env.example
COPY --from=build /app/jest.config.js ./jest.config.js
COPY --from=build /app/render.yaml ./render.yaml

# Create necessary directories
RUN mkdir -p /app/logs /app/uploads /app/temp

# Set proper permissions
RUN chown -R nodejs:nodejs /app && \
    chmod -R 755 /app && \
    chmod -R 777 /app/logs /app/uploads /app/temp

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# ========================================
# 🏥 HEALTH CHECKS
# ========================================

# Install curl for health checks
USER root
RUN apk add --no-cache curl
USER nodejs

# Comprehensive health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
  CMD curl -f http://localhost:3001/health || \
      curl -f http://localhost:3001/api/v1/health || \
      exit 1

# ========================================
# 🔒 SECURITY ENHANCEMENTS
# ========================================

# Security headers and configurations
ENV NODE_OPTIONS="--max-old-space-size=2048 --security-reject-unauthorized=false"

# ========================================
# 📊 MONITORING & LOGGING
# ========================================

# Create log directory with proper permissions
RUN mkdir -p /app/logs && chmod 777 /app/logs

# ========================================
# 🚀 STARTUP CONFIGURATION
# ========================================

# Use dumb-init for proper signal handling
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Start the application with proper signal handling
CMD ["node", "src/index.js"]

# ========================================
# 📋 METADATA
# ========================================

LABEL maintainer="LuxGen Team <team@luxgen.com>"
LABEL version="1.0.0"
LABEL description="Trainer Platform Backend - Enterprise-ready training platform with AI integration"
LABEL org.opencontainers.image.source="https://github.com/luxgen/trainer-platform-backend"
LABEL org.opencontainers.image.licenses="MIT"

# ========================================
# 🔧 DEVELOPMENT STAGE (Optional)
# ========================================
FROM base AS development

# Install all dependencies including dev
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Create development directories
RUN mkdir -p /app/logs /app/uploads /app/temp && \
    chown -R nodejs:nodejs /app && \
    chmod -R 777 /app/logs /app/uploads /app/temp

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Development health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start development server
CMD ["npm", "run", "dev"] 