#!/bin/bash

# Prahok Production Deployment Script

set -e

echo "🚀 Starting Prahok deployment..."

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "⚠️  No .env file found. Using .env.prod as template..."
    cp .env.prod .env
    echo "📝 Please edit .env file with your production values and run again."
    exit 1
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker compose -f docker-compose.prod.yml down

# Build and start services
echo "🔨 Building and starting services..."
docker compose -f docker-compose.prod.yml up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Run database migrations
echo "🗃️  Running database migrations..."
docker compose -f docker-compose.prod.yml exec -T api npx prisma migrate deploy

# Check service health
echo "🏥 Checking service health..."
docker compose -f docker-compose.prod.yml ps

# Show logs
echo "📋 Recent logs:"
docker compose -f docker-compose.prod.yml logs --tail=50

echo "✅ Deployment complete!"
echo "🌐 Your application is available at http://${VPS_IP}:8888"
echo ""
echo "Useful commands:"
echo "  View logs: docker compose -f docker-compose.prod.yml logs -f"
echo "  Stop services: docker compose -f docker-compose.prod.yml down"
echo "  Restart services: docker compose -f docker-compose.prod.yml restart"