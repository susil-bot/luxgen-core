#!/bin/bash

# LuxGen Multi-Tenant Setup Script
# ==================================

echo "🚀 Setting up LuxGen Multi-Tenant System..."

# Set MongoDB Atlas connection string (replace with your actual connection string)
export MONGODB_URI="mongodb+srv://luxgen:luxgen123@cluster0.mongodb.net/luxgen?retryWrites=true&w=majority"

# Set production environment variables
export NODE_ENV="production"
export JWT_SECRET="your-production-jwt-secret-key-change-this-in-production"
export JWT_EXPIRES_IN="7d"
export JWT_REFRESH_EXPIRES_IN="30d"
export CORS_ORIGINS="https://demo.luxgen.com,https://luxgen.com,https://luxgen-lac.vercel.app,https://luxgen-frontend.vercel.app,http://localhost:3000"
export CORS_CREDENTIALS="true"

echo "📡 Environment variables set:"
echo "  MONGODB_URI: $MONGODB_URI"
echo "  NODE_ENV: $NODE_ENV"
echo "  JWT_SECRET: [HIDDEN]"
echo "  CORS_ORIGINS: $CORS_ORIGINS"

# Run the multi-tenant database setup script
echo "🏗️ Running multi-tenant database setup..."
node src/scripts/setup-multi-tenant.js

if [ $? -eq 0 ]; then
    echo "✅ Multi-tenant setup completed successfully!"
    echo ""
    echo "📋 System Configuration:"
    echo "========================"
    echo "Demo Tenant:"
    echo "  - Domain: demo.luxgen.com"
    echo "  - Admin: admin@demo.luxgen.com / DemoPassword123!"
    echo "  - User: user@demo.luxgen.com / DemoUser123!"
    echo ""
    echo "LuxGen Tenant:"
    echo "  - Domain: luxgen.com"
    echo "  - Admin: admin@luxgen.com / LuxGenPassword123!"
    echo "  - User: user@luxgen.com / LuxGenUser123!"
    echo ""
    echo "🔗 API Endpoints:"
    echo "  - Health: https://luxgen-backend.netlify.app/health"
    echo "  - Tenant Info: https://luxgen-backend.netlify.app/api/tenant"
    echo "  - Auth: https://luxgen-backend.netlify.app/api/auth/*"
    echo ""
    echo "🌐 Subdomain Mapping:"
    echo "  - demo.luxgen.com → demo tenant"
    echo "  - luxgen.com → luxgen tenant"
    echo ""
    echo "📋 Next steps:"
    echo "1. Deploy the backend to Netlify with these environment variables"
    echo "2. Set up subdomain DNS records"
    echo "3. Test tenant switching with different subdomains"
    echo "4. Configure frontend for multi-tenant support"
else
    echo "❌ Multi-tenant setup failed!"
    echo ""
    echo "🔧 Troubleshooting:"
    echo "1. Check MongoDB Atlas connection string"
    echo "2. Verify network access in Atlas"
    echo "3. Check firewall settings"
    echo "4. Ensure MongoDB cluster is running"
    exit 1
fi
