# Docker Setup for Prahok.dev

This guide explains how to run Prahok.dev using Docker.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose v2.0+
- Make (optional, for easier commands)

## Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/prahok.dev.git
cd prahok.dev
```

### 2. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your API keys and configuration
```

### 3. Start the application

#### Using Make (recommended):
```bash
# Development mode with hot reload
make up-dev

# Production mode
make build
make up
```

#### Using Docker Compose directly:
```bash
# Development mode
docker-compose -f docker-compose.dev.yml up -d

# Production mode
docker-compose build
docker-compose up -d
```

## Available Services

- **Web Frontend**: http://localhost:3000
- **API Backend**: http://localhost:5000
- **PostgreSQL**: localhost:5432 (dev: 5433)
- **Redis**: localhost:6379 (dev: 6380)

## Common Commands

### View logs
```bash
make logs          # All services
make logs-api      # API only
make logs-web      # Frontend only
```

### Access container shell
```bash
make shell-api     # API container
make shell-web     # Web container
```

### Database operations
```bash
make db-migrate    # Run migrations
make db-seed       # Seed database
make db-studio     # Open Prisma Studio
```

### Stop services
```bash
make down          # Stop all services
make clean         # Remove containers and volumes
```

## Development Workflow

1. **Make changes**: Edit code in your local environment
2. **Hot reload**: Changes are automatically reflected in containers
3. **View logs**: Check `make logs` for any errors
4. **Database changes**: Run `make db-migrate-dev` after schema changes

## Production Deployment

1. **Build images**:
   ```bash
   docker-compose build
   ```

2. **Run containers**:
   ```bash
   docker-compose up -d
   ```

3. **Run migrations**:
   ```bash
   docker-compose exec api npx prisma migrate deploy
   ```

## Troubleshooting

### Container won't start
- Check logs: `docker-compose logs [service-name]`
- Verify environment variables in `.env`
- Ensure ports are not already in use

### Database connection issues
- Verify PostgreSQL is running: `docker-compose ps postgres`
- Check DATABASE_URL in `.env`
- Run `make db-migrate` to ensure schema is up to date

### Hot reload not working
- Ensure volumes are properly mounted
- Check WATCHPACK_POLLING is set to true in docker-compose.dev.yml
- Restart containers: `make down-dev && make up-dev`

## Docker Images

- **prahok-web**: Next.js frontend application
- **prahok-api**: Express.js backend API
- **postgres:16-alpine**: PostgreSQL database
- **redis:7-alpine**: Redis cache

## Security Notes

- Never commit `.env` files
- Use strong passwords for production
- Regularly update base images
- Use secrets management for sensitive data in production