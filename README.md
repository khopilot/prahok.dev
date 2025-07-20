# Prahok.dev - Khmer Recipe Sharing Platform

A modern, full-stack recipe sharing platform built with Next.js, Express, and PostgreSQL. Share and discover authentic Khmer recipes with the community.

## 🚀 Tech Stack

- **Frontend**: Next.js 15.4, React 19, TypeScript, Tailwind CSS v4
- **Backend**: Express.js, TypeScript, Prisma ORM
- **Database**: PostgreSQL 16, Redis 7
- **Infrastructure**: Docker, Nginx, PM2
- **Authentication**: JWT with refresh tokens

## 📋 Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- Git

## 🛠️ Local Development Setup

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/prahok.dev.git
cd prahok.dev
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

#### For API (Backend):
```bash
# Copy the local development environment file
cp apps/api/.env.local apps/api/.env
```

#### For Web (Frontend):
```bash
# Next.js automatically reads .env.local
cp apps/web/.env.local apps/web/.env.local
```

### 4. Start local services

```bash
# Start PostgreSQL and Redis (without password for local dev)
docker-compose -f docker-compose.local.yml up -d

# Verify services are running
docker-compose -f docker-compose.local.yml ps
```

### 5. Set up the database

```bash
# Run database migrations
npm run db:migrate

# (Optional) Seed the database with sample data
npm run db:seed

# (Optional) Open Prisma Studio to view database
npm run db:studio
```

### 6. Start the development servers

```bash
# Start both frontend and backend
npm run dev

# Or start them separately:
# Terminal 1 - API
npm run dev:api

# Terminal 2 - Web
npm run dev:web
```

### 7. Access the applications

- Frontend: http://localhost:3000
- API: http://localhost:5000
- API Health: http://localhost:5000/health
- Prisma Studio: http://localhost:5555
- MailDev (if enabled): http://localhost:1080

## 🏗️ Project Structure

```
prahok.dev/
├── apps/
│   ├── api/          # Express.js backend
│   │   ├── prisma/   # Database schema
│   │   └── src/      # API source code
│   └── web/          # Next.js frontend
│       ├── app/      # App Router pages
│       ├── contexts/ # React contexts
│       └── lib/      # Utilities
├── docker/           # Docker configurations
├── nginx/            # Nginx configurations
└── package.json      # Monorepo root
```

## 🔧 Common Commands

```bash
# Database
npm run db:push       # Push schema changes (dev)
npm run db:migrate    # Run migrations
npm run db:studio     # Open Prisma Studio
npm run db:seed       # Seed database

# Development
npm run dev           # Start all services
npm run dev:api       # Start API only
npm run dev:web       # Start frontend only

# Building
npm run build         # Build all apps
npm run build:api     # Build API only
npm run build:web     # Build frontend only

# Docker
docker-compose -f docker-compose.local.yml up -d    # Start services
docker-compose -f docker-compose.local.yml down     # Stop services
docker-compose -f docker-compose.local.yml logs -f  # View logs
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📝 API Documentation

The API documentation is available at http://localhost:5000/api-docs when running in development mode.

### Main Endpoints

- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

## 🔐 Environment Variables

### API Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_REFRESH_SECRET` | Refresh token secret | Required |
| `PORT` | API server port | `5000` |
| `NODE_ENV` | Environment mode | `development` |

### Web Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:5000/api` |

## 🚀 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment instructions.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Your Name** - Full Stack Developer

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Prisma for the excellent ORM
- The open-source community