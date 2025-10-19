#!/bin/bash

# Simple Build Script for LuxGen Backend
# Creates a production-ready build

echo "🏗️ Building LuxGen Backend..."

# Create clean dist directory
rm -rf dist
mkdir -p dist

# Copy essential files
echo "📦 Copying essential files..."
cp -r src dist/
cp package.json dist/
cp package-lock.json dist/

# Create production environment file
cat > dist/.env << EOF
NODE_ENV=production
PORT=3000
EOF

# Create simple start script
cat > dist/start.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting LuxGen Backend..."
node src/index.js
EOF

chmod +x dist/start.sh

# Create Dockerfile for production
cat > dist/Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY src/ ./src/

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S luxgen -u 1001

# Change ownership
RUN chown -R luxgen:nodejs /app
USER luxgen

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start application
CMD ["node", "src/index.js"]
EOF

echo "✅ Build completed successfully!"
echo "📁 Files included:"
echo "  - src/ (application code)"
echo "  - package.json (dependencies)"
echo "  - package-lock.json (lock file)"
echo "  - .env (environment config)"
echo "  - start.sh (start script)"
echo "  - Dockerfile (container config)"
echo ""
echo "🚀 Ready for deployment!"
echo "   - Run locally: cd dist && npm start"
echo "   - Docker: docker build -t luxgen-backend dist/"
echo "   - Docker run: docker run -p 3000:3000 luxgen-backend"
