# LuxGen Core - Trainer Platform Backend API

A robust Node.js/Express backend API for the Trainer Platform, featuring multi-tenancy, user management, polling systems, and real-time analytics.

## 🚀 Features

- **Multi-Tenant Architecture**: Complete tenant isolation and management
- **User Management**: Authentication, authorization, and profile management
- **Polling System**: Create, distribute, and analyze polls and surveys
- **Real-time Analytics**: Live data processing and insights
- **MongoDB Integration**: NoSQL database with optimized schemas
- **Redis Caching**: High-performance caching layer
- **JWT Authentication**: Secure token-based authentication
- **Email Integration**: Automated email notifications
- **File Upload**: Secure file handling and storage
- **API Documentation**: Comprehensive API documentation

## 🏗️ Architecture

```
├── src/
│   ├── config/          # Database and app configuration
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Custom middleware
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   └── utils/           # Helper functions
├── scripts/             # Database setup and utilities
├── logs/               # Application logs
└── tests/              # Test files
```

## 📋 Prerequisites

- Node.js 18+ 
- MongoDB Atlas account
- Redis (optional, for caching)
- npm or yarn

## 🔧 Installation

1. **Clone the repository**
```bash
git clone https://github.com/susil-bot/luxgen-core.git
cd luxgen-core
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp env.development .env
# Edit .env with your configuration
```

4. **Configure MongoDB**
```bash
# Update MONGODB_URL in .env with your Atlas connection string
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/trainer_platform
```

5. **Set up the database**
```bash
node scripts/setup-mongodb.js
```

## 🚀 Quick Start

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Testing
```bash
npm test
```

## 📊 Database Collections

- **tenants**: Multi-tenant organizations
- **users**: User accounts and authentication
- **userdetails**: Extended user profiles
- **userregistrations**: Registration process
- **polls**: Polling and feedback system
- **tenantschemas**: Styling and branding

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh token

### Tenants
- `GET /api/tenants` - List tenants
- `POST /api/tenants` - Create tenant
- `GET /api/tenants/:id` - Get tenant details
- `PUT /api/tenants/:id` - Update tenant
- `DELETE /api/tenants/:id` - Delete tenant

### Users
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Polls
- `GET /api/polls` - List polls
- `POST /api/polls` - Create poll
- `GET /api/polls/:id` - Get poll details
- `PUT /api/polls/:id` - Update poll
- `DELETE /api/polls/:id` - Delete poll
- `POST /api/polls/:id/responses` - Submit poll response

### User Details
- `GET /api/user-details/:userId` - Get user details
- `PUT /api/user-details/:userId` - Update user details
- `POST /api/user-details/:userId/skills` - Add skill

## 🔒 Security

- JWT token authentication
- Role-based access control (RBAC)
- Multi-tenant data isolation
- Input validation and sanitization
- Rate limiting
- CORS configuration

## 📈 Performance

- Connection pooling
- Redis caching
- Optimized database queries
- Compression middleware
- CDN integration

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test
npm test -- --grep "user registration"

# Run with coverage
npm run test:coverage
```

## 📝 Environment Variables

```bash
# Application
NODE_ENV=development
PORT=3001
APP_NAME=LuxGen Core Backend

# Database
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/trainer_platform
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=trainer_platform
POSTGRES_USER=trainer_user
POSTGRES_PASSWORD=trainer_password_2024

# Redis
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# CORS
CORS_ORIGIN=http://localhost:3000
```

## 🚀 Deployment

### Docker
```bash
docker build -t luxgen-core .
docker run -p 3001:3001 luxgen-core
```

### Render
```bash
# Deploy to Render using render.yaml
```

### Manual Deployment
```bash
npm run build
npm start
```

## 📊 Monitoring

- Health check endpoint: `GET /health`
- Detailed health: `GET /health/detailed`
- Database status: `GET /api/database/status`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email support@luxgen.com or create an issue in the repository.
