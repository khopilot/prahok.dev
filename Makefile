# Prahok.dev Docker Commands
.PHONY: help build up down logs shell clean

# Default target
help:
	@echo "Prahok.dev Docker Commands:"
	@echo "  make build          - Build all Docker images"
	@echo "  make up             - Start all services in production mode"
	@echo "  make up-dev         - Start all services in development mode"
	@echo "  make down           - Stop all services"
	@echo "  make logs           - View logs for all services"
	@echo "  make logs-api       - View API logs"
	@echo "  make logs-web       - View web logs"
	@echo "  make shell-api      - Open shell in API container"
	@echo "  make shell-web      - Open shell in web container"
	@echo "  make db-migrate     - Run database migrations"
	@echo "  make db-seed        - Seed the database"
	@echo "  make clean          - Remove all containers and volumes"

# Build all images
build:
	docker-compose build

# Production commands
up:
	docker-compose up -d

down:
	docker-compose down

# Development commands
up-dev:
	docker-compose -f docker-compose.dev.yml up -d

down-dev:
	docker-compose -f docker-compose.dev.yml down

build-dev:
	docker-compose -f docker-compose.dev.yml build

# Logs
logs:
	docker-compose logs -f

logs-api:
	docker-compose logs -f api

logs-web:
	docker-compose logs -f web

logs-dev:
	docker-compose -f docker-compose.dev.yml logs -f

# Shell access
shell-api:
	docker-compose exec api sh

shell-web:
	docker-compose exec web sh

shell-api-dev:
	docker-compose -f docker-compose.dev.yml exec api sh

shell-web-dev:
	docker-compose -f docker-compose.dev.yml exec web sh

# Database operations
db-migrate:
	docker-compose exec api npx prisma migrate deploy

db-migrate-dev:
	docker-compose -f docker-compose.dev.yml exec api npx prisma migrate dev

db-seed:
	docker-compose exec api npx prisma db seed

db-studio:
	docker-compose -f docker-compose.dev.yml exec api npx prisma studio

# Clean up
clean:
	docker-compose down -v
	docker-compose -f docker-compose.dev.yml down -v
	docker system prune -f

# Full rebuild
rebuild: clean build up

rebuild-dev: clean build-dev up-dev