# 🚀 LuxGen Trainer Platform Backend

A robust, scalable multi-tenant backend platform for training and learning management systems.

## 📋 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your actual configuration values

# Start the server
npm start

# Or run in development mode
npm run dev
```

## 🔒 Security Notice

⚠️ **IMPORTANT**: Before running in production:
1. Update all secrets in your `.env` file
2. Use strong, unique passwords for all databases
3. Enable HTTPS in production
4. Review and configure security headers
5. Set up proper logging and monitoring

## 🌐 API Endpoints

- **Health Check**: `http://localhost:3001/health`
- **API Base**: `http://localhost:3001/api/v1`
- **External Access**: `http://192.168.1.9:3001`

## 📚 Documentation

All documentation is organized in the `docs/` directory:

### 🏗️ **Architecture & System Design**
- [📁 Directory-Based Tenant System](./docs/DIRECTORY_BASED_TENANT_SYSTEM.md) - Complete guide to the tenant configuration system
- [🏢 Multi-Tenant Architecture](./docs/MULTI_TENANT_ARCHITECTURE.md) - System architecture and design patterns
- [🗄️ Database Setup](./docs/DATABASE_SETUP.md) - Database configuration and initialization

### 🔧 **Development & Deployment**
- [🚀 Deployment Guide](./docs/DEPLOYMENT.md) - Production deployment instructions
- [📖 Project Documentation](./docs/README.md) - Detailed project overview and setup

### 🎨 **Frontend Integration**
- [🎯 Frontend Setup Guide](./docs/FRONTEND_SETUP_GUIDE.md) - Frontend integration instructions
- [📡 Tenant Configuration Guide](./docs/TENANT_CONFIGURATION_GUIDE.md) - Tenant configuration system
- [🔌 API Documentation](./docs/TENANT_API_DOCUMENTATION.md) - Complete API reference

## 🏢 **Multi-Tenant Features**

### **Directory-Based Configuration**
Each tenant has its own directory with complete configuration:

```
src/tenants/
├── demo-tenant/              # Demo tenant
│   ├── config.js             # Tenant configuration
│   ├── README.md             # Tenant documentation
│   └── branding/             # Branding assets
│       ├── logo.png
│       ├── favicon.ico
│       └── custom.css
└── acme-corporation/         # Enterprise tenant
    ├── config.js
    ├── README.md
    └── branding/
```

### **Tenant Identification Methods**
- **Subdomain**: `demo-tenant.luxgen.com`
- **Path**: `luxgen.com/tenant/demo-tenant`
- **Header**: `X-Tenant-Slug: demo-tenant`
- **Query**: `?tenant=demo-tenant`
- **JWT Token**: Contains tenant information

### **Key Features**
- ✅ **Dynamic Tenant Loading** - Automatic configuration loading
- ✅ **Feature Gates** - Enable/disable features per tenant
- ✅ **Usage Limits** - Tenant-specific limits and quotas
- ✅ **Custom Branding** - Logo, colors, CSS per tenant
- ✅ **API Access Control** - Tenant-specific API access
- ✅ **User Management** - Tenant-specific user administration

## 🔧 **Technology Stack**

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **Authentication**: JWT
- **Validation**: Joi
- **Logging**: Winston
- **Testing**: Jest
- **Documentation**: Markdown

## 🚀 **Getting Started**

1. **Clone the repository**
2. **Install dependencies**: `npm install`
3. **Configure environment**: Copy `.env.example` to `.env` and update values
4. **Set up database**: Follow [Database Setup Guide](./docs/DATABASE_SETUP.md)
5. **Start the server**: `npm start`
6. **Access the API**: `http://localhost:3001/api/v1`

## 📖 **Documentation Index**

| Document | Description |
|----------|-------------|
| [🏗️ Directory-Based Tenant System](./docs/DIRECTORY_BASED_TENANT_SYSTEM.md) | Complete guide to tenant configuration |
| [🏢 Multi-Tenant Architecture](./docs/MULTI_TENANT_ARCHITECTURE.md) | System architecture and design |
| [🗄️ Database Setup](./docs/DATABASE_SETUP.md) | Database configuration and setup |
| [🚀 Deployment Guide](./docs/DEPLOYMENT.md) | Production deployment instructions |
| [📖 Project Documentation](./docs/README.md) | Detailed project overview |
| [🎯 Frontend Setup Guide](./docs/FRONTEND_SETUP_GUIDE.md) | Frontend integration guide |
| [📡 Tenant Configuration Guide](./docs/TENANT_CONFIGURATION_GUIDE.md) | Tenant configuration system |
| [🔌 API Documentation](./docs/TENANT_API_DOCUMENTATION.md) | Complete API reference |

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 **License**

This project is licensed under the MIT License.

---

**For detailed documentation, please refer to the [docs/](./docs/) directory.** 