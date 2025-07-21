#!/bin/bash

# Production deployment script for VPS
# This script handles deployment without exposing sensitive data

echo "🚀 Starting VPS deployment..."

# Check if required environment variables are set
if [ -z "$NEXT_PUBLIC_API_URL" ]; then
    echo "❌ Error: NEXT_PUBLIC_API_URL is not set"
    echo "Please set it to your production API URL (e.g., https://api.prahok.dev)"
    exit 1
fi

if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "❌ Error: ANTHROPIC_API_KEY is not set"
    echo "Please set your Claude API key"
    exit 1
fi

# Build the frontend
echo "📦 Building frontend..."
cd apps/web
npm install
npm run build

# Build the backend
echo "📦 Building backend..."
cd ../api
npm install
npx prisma generate
npx prisma migrate deploy
npm run build

# Create deployment directory structure
echo "📁 Creating deployment structure..."
cd ../..
mkdir -p dist/web
mkdir -p dist/api

# Copy built files
cp -r apps/web/.next dist/web/
cp -r apps/web/public dist/web/
cp apps/web/package.json dist/web/
cp apps/web/package-lock.json dist/web/

cp -r apps/api/dist/* dist/api/
cp -r apps/api/prisma dist/api/
cp apps/api/package.json dist/api/
cp apps/api/package-lock.json dist/api/

# Create ecosystem.config.js for PM2
cat > dist/ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'prahok-api',
      script: 'dist/api/index.js',
      cwd: './api',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
        DATABASE_URL: process.env.DATABASE_URL,
        JWT_SECRET: process.env.JWT_SECRET,
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
        DAYTONA_API_KEY: process.env.DAYTONA_API_KEY
      }
    },
    {
      name: 'prahok-web',
      script: 'npm',
      args: 'start',
      cwd: './web',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
        DAYTONA_API_KEY: process.env.DAYTONA_API_KEY
      }
    }
  ]
};
EOF

# Create nginx configuration
cat > dist/nginx.conf << EOF
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

echo "✅ Build complete!"
echo ""
echo "📋 Next steps:"
echo "1. Copy the 'dist' folder to your VPS"
echo "2. Install dependencies on VPS:"
echo "   cd dist/api && npm install --production"
echo "   cd ../web && npm install --production"
echo "3. Set up environment variables on your VPS"
echo "4. Install and configure PM2:"
echo "   npm install -g pm2"
echo "   pm2 start ecosystem.config.js"
echo "5. Configure nginx with the provided nginx.conf"
echo "6. Set up SSL with Let's Encrypt"
echo ""
echo "🔒 Security reminder:"
echo "- Never commit .env.local to git"
echo "- Use strong JWT_SECRET"
echo "- Keep API keys secure"
echo "- Enable firewall on VPS"