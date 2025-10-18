# LuxGen Backend Dockerfile
# Multi-stage build for production deployment

# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY src/ ./src/
COPY netlify/ ./netlify/
COPY netlify.toml ./

# Production stage
FROM node:18-alpine AS production

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S luxgen -u 1001

WORKDIR /app

# Copy built application from builder stage
COPY --from=builder --chown=luxgen:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=luxgen:nodejs /app/src ./src
COPY --from=builder --chown=luxgen:nodejs /app/netlify ./netlify
COPY --from=builder --chown=luxgen:nodejs /app/netlify.toml ./
COPY --chown=luxgen:nodejs package*.json ./

# Switch to non-root user
USER luxgen

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "src/index.js"]