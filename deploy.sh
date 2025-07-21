#!/bin/bash

# Prahok.dev Deployment Script
# This script deploys the application to production servers

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[DEPLOY]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Default configuration
DEPLOY_ENV=${1:-production}
DEPLOY_TARGET=${2:-all}  # all, api, web

# Load deployment configuration
if [ -f "deploy.config.sh" ]; then
    source deploy.config.sh
else
    print_warning "No deploy.config.sh found. Creating template..."
    cat > deploy.config.sh << 'EOF'
# Deployment Configuration
# Update these values for your deployment

# API Server Configuration
API_HOST="api.prahok.dev"
API_USER="deploy"
API_PATH="/var/www/prahok-api"
API_PORT="5000"
API_PM2_NAME="prahok-api"

# Web Server Configuration
WEB_HOST="prahok.dev"
WEB_USER="deploy"
WEB_PATH="/var/www/prahok-web"
WEB_PORT="3000"
WEB_PM2_NAME="prahok-web"

# Database Configuration
DB_HOST="localhost"
DB_NAME="prahok_prod"
DB_USER="prahok"

# Redis Configuration
REDIS_HOST="localhost"
REDIS_PORT="6379"

# Cloudflare Configuration (optional)
CF_ZONE_ID=""
CF_API_TOKEN=""

# Deployment method: ssh, docker, k8s
DEPLOY_METHOD="ssh"

# Docker Registry (if using Docker)
DOCKER_REGISTRY=""
DOCKER_IMAGE_API="prahok/api"
DOCKER_IMAGE_WEB="prahok/web"
EOF
    print_error "Please update deploy.config.sh with your deployment configuration"
    exit 1
fi

# Load configuration
source deploy.config.sh

# Start deployment
print_status "Starting deployment to $DEPLOY_ENV environment..."
START_TIME=$(date +%s)

# Check if build artifacts exist
if [ ! -d "dist" ]; then
    print_error "No build artifacts found. Please run ./build.sh first"
    exit 1
fi

# Function to deploy API
deploy_api() {
    print_status "Deploying API to $API_HOST..."
    
    if [ "$DEPLOY_METHOD" = "ssh" ]; then
        # SSH deployment
        print_status "Uploading API artifacts..."
        scp dist/api.tar.gz $API_USER@$API_HOST:/tmp/
        
        print_status "Deploying API on remote server..."
        ssh $API_USER@$API_HOST << 'ENDSSH'
            set -e
            
            # Create backup
            if [ -d "$API_PATH" ]; then
                sudo cp -r $API_PATH $API_PATH.backup.$(date +%Y%m%d_%H%M%S)
            fi
            
            # Create directory if it doesn't exist
            sudo mkdir -p $API_PATH
            sudo chown $API_USER:$API_USER $API_PATH
            
            # Extract new version
            cd $API_PATH
            tar -xzf /tmp/api.tar.gz
            rm /tmp/api.tar.gz
            
            # Install production dependencies
            npm ci --production
            
            # Run database migrations
            npx prisma migrate deploy
            
            # Restart API with PM2
            pm2 restart $API_PM2_NAME || pm2 start dist/server.js --name $API_PM2_NAME
            pm2 save
            
            # Health check
            sleep 5
            curl -f http://localhost:$API_PORT/health || exit 1
ENDSSH
        
        print_success "API deployed successfully"
        
    elif [ "$DEPLOY_METHOD" = "docker" ]; then
        # Docker deployment
        print_status "Building Docker image for API..."
        cd apps/api
        docker build -t $DOCKER_REGISTRY/$DOCKER_IMAGE_API:latest .
        docker push $DOCKER_REGISTRY/$DOCKER_IMAGE_API:latest
        cd ../..
        
        # Deploy to Docker host
        ssh $API_USER@$API_HOST << ENDSSH
            docker pull $DOCKER_REGISTRY/$DOCKER_IMAGE_API:latest
            docker stop prahok-api || true
            docker rm prahok-api || true
            docker run -d --name prahok-api \
                -p $API_PORT:$API_PORT \
                --env-file /opt/prahok/api.env \
                --restart unless-stopped \
                $DOCKER_REGISTRY/$DOCKER_IMAGE_API:latest
ENDSSH
        
        print_success "API deployed via Docker"
    fi
}

# Function to deploy Web
deploy_web() {
    print_status "Deploying Web to $WEB_HOST..."
    
    if [ "$DEPLOY_METHOD" = "ssh" ]; then
        # Determine which artifact to use
        if [ -f "dist/web-static.tar.gz" ]; then
            WEB_ARTIFACT="web-static.tar.gz"
            DEPLOY_MODE="static"
        else
            WEB_ARTIFACT="web-ssr.tar.gz"
            DEPLOY_MODE="ssr"
        fi
        
        print_status "Uploading Web artifacts ($DEPLOY_MODE mode)..."
        scp dist/$WEB_ARTIFACT $WEB_USER@$WEB_HOST:/tmp/
        
        print_status "Deploying Web on remote server..."
        ssh $WEB_USER@$WEB_HOST << ENDSSH
            set -e
            
            # Create backup
            if [ -d "$WEB_PATH" ]; then
                sudo cp -r $WEB_PATH $WEB_PATH.backup.$(date +%Y%m%d_%H%M%S)
            fi
            
            # Create directory if it doesn't exist
            sudo mkdir -p $WEB_PATH
            sudo chown $WEB_USER:$WEB_USER $WEB_PATH
            
            # Extract new version
            cd $WEB_PATH
            tar -xzf /tmp/$WEB_ARTIFACT
            rm /tmp/$WEB_ARTIFACT
            
            if [ "$DEPLOY_MODE" = "ssr" ]; then
                # Install production dependencies for SSR
                npm ci --production
                
                # Restart with PM2
                pm2 restart $WEB_PM2_NAME || pm2 start npm --name $WEB_PM2_NAME -- start
                pm2 save
            else
                # Static files deployed, nginx will serve them
                echo "Static files deployed to $WEB_PATH"
            fi
            
            # Clear CDN cache if configured
            if [ -n "$CF_ZONE_ID" ] && [ -n "$CF_API_TOKEN" ]; then
                curl -X POST "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/purge_cache" \
                    -H "Authorization: Bearer $CF_API_TOKEN" \
                    -H "Content-Type: application/json" \
                    --data '{"purge_everything":true}'
            fi
ENDSSH
        
        print_success "Web deployed successfully"
        
    elif [ "$DEPLOY_METHOD" = "docker" ]; then
        # Docker deployment
        print_status "Building Docker image for Web..."
        cd apps/web
        docker build -t $DOCKER_REGISTRY/$DOCKER_IMAGE_WEB:latest .
        docker push $DOCKER_REGISTRY/$DOCKER_IMAGE_WEB:latest
        cd ../..
        
        # Deploy to Docker host
        ssh $WEB_USER@$WEB_HOST << ENDSSH
            docker pull $DOCKER_REGISTRY/$DOCKER_IMAGE_WEB:latest
            docker stop prahok-web || true
            docker rm prahok-web || true
            docker run -d --name prahok-web \
                -p $WEB_PORT:$WEB_PORT \
                --env-file /opt/prahok/web.env \
                --restart unless-stopped \
                $DOCKER_REGISTRY/$DOCKER_IMAGE_WEB:latest
ENDSSH
        
        print_success "Web deployed via Docker"
    fi
}

# Function to run post-deployment tasks
post_deployment() {
    print_status "Running post-deployment tasks..."
    
    # Health checks
    print_status "Running health checks..."
    
    if [ "$DEPLOY_TARGET" = "all" ] || [ "$DEPLOY_TARGET" = "api" ]; then
        curl -f https://$API_HOST/health || print_warning "API health check failed"
    fi
    
    if [ "$DEPLOY_TARGET" = "all" ] || [ "$DEPLOY_TARGET" = "web" ]; then
        curl -f https://$WEB_HOST || print_warning "Web health check failed"
    fi
    
    # Send deployment notification (optional)
    if [ -n "$SLACK_WEBHOOK" ]; then
        curl -X POST $SLACK_WEBHOOK \
            -H 'Content-type: application/json' \
            --data "{\"text\":\"Prahok.dev deployed to $DEPLOY_ENV successfully!\"}"
    fi
    
    print_success "Post-deployment tasks completed"
}

# Main deployment logic
case $DEPLOY_TARGET in
    api)
        deploy_api
        ;;
    web)
        deploy_web
        ;;
    all)
        deploy_api
        deploy_web
        ;;
    *)
        print_error "Invalid deploy target: $DEPLOY_TARGET"
        echo "Usage: ./deploy.sh [environment] [target]"
        echo "  environment: production (default), staging"
        echo "  target: all (default), api, web"
        exit 1
        ;;
esac

# Run post-deployment tasks
post_deployment

# Calculate deployment time
END_TIME=$(date +%s)
DEPLOY_TIME=$((END_TIME - START_TIME))

print_success "Deployment completed successfully in ${DEPLOY_TIME} seconds!"

# Deployment summary
echo ""
echo "========================================"
echo "       DEPLOYMENT SUMMARY"
echo "========================================"
echo "Environment: $DEPLOY_ENV"
echo "Target: $DEPLOY_TARGET"
echo "Method: $DEPLOY_METHOD"
echo ""
if [ "$DEPLOY_TARGET" = "all" ] || [ "$DEPLOY_TARGET" = "api" ]; then
    echo "✅ API: https://$API_HOST"
fi
if [ "$DEPLOY_TARGET" = "all" ] || [ "$DEPLOY_TARGET" = "web" ]; then
    echo "✅ Web: https://$WEB_HOST"
fi
echo "========================================"