#!/bin/bash

# SSL Setup Script for Prahok

echo "🔐 Setting up SSL certificates for prahok.dev..."

# Create directories for certbot
mkdir -p certbot/conf
mkdir -p certbot/www

# Run certbot in Docker
docker run -it --rm \
  -v /home/nicolas/projects/development/prahok/certbot/conf:/etc/letsencrypt \
  -v /home/nicolas/projects/development/prahok/certbot/www:/var/www/certbot \
  -p 80:80 \
  certbot/certbot certonly \
  --standalone \
  --email pienikdelrieu@gmail.com \
  --agree-tos \
  --no-eff-email \
  -d prahok.dev \
  -d www.prahok.dev

echo "✅ SSL certificates generated!"
echo "📝 Now updating Nginx configuration for HTTPS..."