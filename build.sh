#!/bin/bash

# Prahok.dev Build Script
# This script builds both the API and Web applications for production

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[BUILD]${NC} $1"
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

# Start build process
print_status "Starting Prahok.dev build process..."
START_TIME=$(date +%s)

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "apps" ]; then
    print_error "Please run this script from the root of the Prahok.dev monorepo"
    exit 1
fi

# Clean previous builds
print_status "Cleaning previous builds..."
rm -rf apps/api/dist
rm -rf apps/web/.next
rm -rf apps/web/out
print_success "Previous builds cleaned"

# Install dependencies
print_status "Installing dependencies..."
npm install --frozen-lockfile
print_success "Dependencies installed"

# Build shared packages (if any)
if [ -d "packages" ]; then
    print_status "Building shared packages..."
    npm run build --workspace=packages/*
    print_success "Shared packages built"
fi

# Build API
print_status "Building API server..."
cd apps/api

# Create production .env if it doesn't exist
if [ ! -f ".env.production" ]; then
    print_warning "No .env.production found for API. Creating from template..."
    cat > .env.production << EOF
# Production Environment Variables for API
NODE_ENV=production
PORT=5000

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/prahok_prod"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-production-jwt-secret-here"
JWT_EXPIRES_IN="7d"

# CORS
CORS_ORIGIN="https://prahok.dev"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL="info"
EOF
    print_warning "Please update .env.production with your production values"
fi

# Build TypeScript
npm run build
print_success "API server built"

cd ../..

# Build Web App
print_status "Building web application..."
cd apps/web

# Create production .env.local if it doesn't exist
if [ ! -f ".env.production.local" ]; then
    print_warning "No .env.production.local found for Web. Creating from template..."
    cat > .env.production.local << EOF
# Production Environment Variables for Web App
NEXT_PUBLIC_API_URL="https://api.prahok.dev"
NEXT_PUBLIC_ENV="production"

# Claude Code SDK Configuration
ANTHROPIC_API_KEY="your-production-anthropic-key"
CLAUDE_CODE_MODEL="claude-3-opus-20240229"

# Daytona SDK Configuration
DAYTONA_API_KEY="your-production-daytona-key"
DAYTONA_API_URL="https://app.daytona.io/api"
DAYTONA_TARGET="us"

# Analytics (optional)
NEXT_PUBLIC_GA_ID=""
NEXT_PUBLIC_POSTHOG_KEY=""
EOF
    print_warning "Please update .env.production.local with your production values"
fi

# Build Next.js app
npm run build

# Generate static files if needed
if grep -q "output.*export" next.config.js; then
    print_status "Generating static export..."
    npm run export
fi

print_success "Web application built"

cd ../..

# Create deployment artifacts
print_status "Creating deployment artifacts..."
mkdir -p dist

# Package API
cd apps/api
tar -czf ../../dist/api.tar.gz dist package.json package-lock.json prisma
cd ../..

# Package Web
cd apps/web
if [ -d "out" ]; then
    # Static export
    tar -czf ../../dist/web-static.tar.gz out
else
    # Server-side rendering
    tar -czf ../../dist/web-ssr.tar.gz .next package.json package-lock.json public
fi
cd ../..

print_success "Deployment artifacts created in dist/"

# Generate build info
print_status "Generating build information..."
cat > dist/build-info.json << EOF
{
  "buildTime": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "branch": "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')",
  "nodeVersion": "$(node --version)",
  "npmVersion": "$(npm --version)"
}
EOF

# Calculate build time
END_TIME=$(date +%s)
BUILD_TIME=$((END_TIME - START_TIME))

print_success "Build completed successfully in ${BUILD_TIME} seconds!"
print_status "Artifacts available in dist/ directory:"
ls -la dist/

# Build summary
echo ""
echo "========================================"
echo "         BUILD SUMMARY"
echo "========================================"
echo "✅ API built and packaged"
echo "✅ Web app built and packaged"
echo "✅ Build artifacts created"
echo ""
echo "Next steps:"
echo "1. Update production environment variables"
echo "2. Run ./deploy.sh to deploy to your servers"
echo "========================================"