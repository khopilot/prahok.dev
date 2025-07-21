#!/bin/bash

# Production deployment script for prahok.dev
# This script follows the VPS deployment guide

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/home/nicolas/projects/development/prahok"
BACKUP_DIR="/home/nicolas/backups/prahok"
LOG_DIR="/home/nicolas/logs/prahok"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo -e "${GREEN}🚀 Starting prahok.dev deployment...${NC}"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Pre-deployment checks
echo -e "${YELLOW}📋 Running pre-deployment checks...${NC}"

# Check required commands
for cmd in docker docker-compose git; do
    if ! command_exists $cmd; then
        echo -e "${RED}❌ Error: $cmd is not installed${NC}"
        exit 1
    fi
done

# Check environment file
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ Error: .env file not found${NC}"
    echo "Please copy .env.production to .env and configure it"
    exit 1
fi

# Check required environment variables
source .env
required_vars=("JWT_SECRET" "JWT_REFRESH_SECRET" "ANTHROPIC_API_KEY")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}❌ Error: $var is not set in .env${NC}"
        exit 1
    fi
done

# Create directories if they don't exist
mkdir -p $BACKUP_DIR
mkdir -p $LOG_DIR

# Backup current deployment
echo -e "${YELLOW}📦 Creating backup...${NC}"
if [ -d "$PROJECT_DIR" ]; then
    # Database backup
    docker exec prahok-postgres pg_dump -U prahok_user prahok_db | gzip > "$BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz" 2>/dev/null || true
    
    # Environment backup
    tar -czf "$BACKUP_DIR/env_backup_$TIMESTAMP.tar.gz" .env docker-compose.prod.yml 2>/dev/null || true
    
    echo -e "${GREEN}✅ Backup created${NC}"
fi

# Pull latest code
echo -e "${YELLOW}📥 Pulling latest code...${NC}"
git pull origin main

# Build Docker images
echo -e "${YELLOW}🔨 Building Docker images...${NC}"
docker-compose -f docker-compose.prod.yml build --no-cache

# Stop current services
echo -e "${YELLOW}🛑 Stopping current services...${NC}"
docker-compose -f docker-compose.prod.yml down

# Start new services
echo -e "${YELLOW}🚀 Starting services...${NC}"
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
sleep 10

# Run database migrations
echo -e "${YELLOW}🔄 Running database migrations...${NC}"
docker-compose -f docker-compose.prod.yml exec -T api npx prisma migrate deploy

# Health checks
echo -e "${YELLOW}🏥 Running health checks...${NC}"

# Check API health
API_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/health || echo "000")
if [ "$API_HEALTH" = "200" ]; then
    echo -e "${GREEN}✅ API health check passed${NC}"
else
    echo -e "${RED}❌ API health check failed (HTTP $API_HEALTH)${NC}"
    echo "Rolling back..."
    docker-compose -f docker-compose.prod.yml down
    exit 1
fi

# Check frontend health
WEB_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "000")
if [ "$WEB_HEALTH" = "200" ]; then
    echo -e "${GREEN}✅ Frontend health check passed${NC}"
else
    echo -e "${RED}❌ Frontend health check failed (HTTP $WEB_HEALTH)${NC}"
    echo "Rolling back..."
    docker-compose -f docker-compose.prod.yml down
    exit 1
fi

# Clean up old images
echo -e "${YELLOW}🧹 Cleaning up old images...${NC}"
docker image prune -f

# Log deployment
echo "[$TIMESTAMP] Deployment completed successfully" >> "$LOG_DIR/deployments.log"

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo ""
echo "📊 Service Status:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "🔗 Access your application at:"
echo "   - Frontend: https://prahok.dev"
echo "   - API Health: https://prahok.dev/api/health"
echo ""
echo "📝 View logs with:"
echo "   docker-compose -f docker-compose.prod.yml logs -f [service_name]"