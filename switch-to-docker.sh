#!/bin/bash

echo "🔄 Switching from system Nginx to Docker Nginx..."

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then 
    echo "⚠️  This script needs sudo privileges to stop system services"
    echo "Please run: sudo ./switch-to-docker.sh"
    exit 1
fi

# Stop system nginx
echo "🛑 Stopping system Nginx..."
systemctl stop nginx
systemctl disable nginx

# Start Docker services
echo "🚀 Starting Docker services..."
cd /home/nicolas/projects/development/prahok
docker compose -f docker-compose.prod.yml up -d

echo "✅ Done! Your application should now be available at:"
echo "   http://prahok.dev"
echo "   https://prahok.dev (after SSL setup)"