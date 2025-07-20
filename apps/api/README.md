# Prahok API

Express.js backend API for the Prahok recipe sharing platform.

## 🏗️ Architecture

- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis for session management
- **Authentication**: JWT with access and refresh tokens
- **Security**: Helmet, CORS, rate limiting, bcrypt

## 📁 Project Structure

```
apps/api/
├── prisma/
│   └── schema.prisma    # Database schema
├── src/
│   ├── config/          # Configuration management
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Express middleware
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   └── server.ts        # Application entry point
├── uploads/             # File uploads directory
└── logs/                # Application logs
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 16
- Redis 7
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.local .env
# Edit .env with your configuration
```

3. Run database migrations:
```bash
npx prisma migrate dev
```

4. Start the development server:
```bash
npm run dev
```

## 🔧 Available Scripts

```bash
# Development
npm run dev           # Start with hot reload
npm run build         # Build for production
npm start             # Start production server

# Database
npm run db:push       # Push schema changes
npm run db:migrate    # Run migrations
npm run db:studio     # Open Prisma Studio
npm run db:seed       # Seed database

# Testing
npm test              # Run tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Generate coverage report
```

## 📝 API Endpoints

### Authentication

#### POST /api/auth/signup
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "securepassword",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "user": {
    "id": "cuid",
    "email": "user@example.com",
    "username": "johndoe"
  },
  "accessToken": "jwt.token",
  "refreshToken": "jwt.refresh"
}
```

#### POST /api/auth/login
Authenticate a user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password"
}
```

#### POST /api/auth/refresh
Refresh access token.

**Request Body:**
```json
{
  "refreshToken": "jwt.refresh.token"
}
```

#### POST /api/auth/logout
Logout user and invalidate session.

#### GET /api/auth/me
Get current authenticated user.

**Headers:**
```
Authorization: Bearer <access_token>
```

### Health Check

#### GET /health
Check API and service health.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": {
    "database": "connected",
    "redis": "connected"
  }
}
```

## 🔐 Authentication Flow

1. User registers or logs in → receives access and refresh tokens
2. Access token (7 days) used for API requests
3. Refresh token (30 days) used to get new access token
4. Tokens stored securely in httpOnly cookies
5. Session tracked in database with device info

## 🛡️ Security Features

- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: Configurable per endpoint
- **Input Validation**: express-validator
- **SQL Injection Protection**: Prisma ORM
- **XSS Protection**: Helmet security headers
- **CORS**: Configured for allowed origins

## 🗄️ Database Schema

The database schema includes:
- **Users**: User accounts with roles
- **Sessions**: Active user sessions
- **Recipes**: Recipe content and metadata
- **Categories**: Recipe categories
- **Ratings**: User ratings for recipes
- **Comments**: User comments on recipes

See `prisma/schema.prisma` for full schema.

## 🔧 Configuration

Environment variables are managed through the `config` module:

```typescript
import { config } from './config';

// Access configuration
config.server.port
config.jwt.secret
config.database.url
```

## 📊 Logging

Uses Winston for structured logging:

```typescript
import logger from './utils/logger';

logger.info('Server started');
logger.error('Error occurred', error);
logger.debug('Debug information');
```

## 🧪 Testing

Tests are written using Jest:

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Generate coverage report
npm run test:coverage
```

## 🚀 Production Deployment

1. Build the application:
```bash
npm run build
```

2. Set production environment variables
3. Run migrations:
```bash
npx prisma migrate deploy
```

4. Start with PM2:
```bash
pm2 start ecosystem.config.js
```

## 🤝 Contributing

1. Follow TypeScript best practices
2. Write tests for new features
3. Use conventional commit messages
4. Run linter before committing
5. Update documentation as needed

## 📄 License

MIT License - see LICENSE file for details.