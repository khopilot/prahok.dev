# Prahok Deployment Guide

## 🚀 Production Deployment

Your Prahok application is now deployed and running on your VPS!

### Access URLs

- **Frontend Application**: http://147.93.157.63:8888
- **API Health Check**: http://147.93.157.63:8888/health
- **Database (PostgreSQL)**: localhost:5432 (from VPS)
- **Redis Cache**: localhost:6379 (from VPS)

### Services Running

All services are containerized with Docker:

1. **PostgreSQL** - Database
2. **Redis** - Cache and session storage  
3. **API Backend** - Express.js/TypeScript with Prisma
4. **Web Frontend** - Next.js 15 with TypeScript
5. **Nginx** - Reverse proxy

### Useful Commands

From the project directory (`~/projects/development/prahok`):

```bash
# View all services status
docker compose -f docker-compose.prod.yml ps

# View logs for all services
docker compose -f docker-compose.prod.yml logs -f

# View logs for specific service
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f web

# Restart all services
docker compose -f docker-compose.prod.yml restart

# Stop all services
docker compose -f docker-compose.prod.yml down

# Start all services
docker compose -f docker-compose.prod.yml up -d

# Rebuild and restart a specific service
docker compose -f docker-compose.prod.yml up -d --build api
```

### Database Management

```bash
# Access PostgreSQL
docker exec -it prahok-postgres psql -U prahok_user -d prahok_db

# Run Prisma migrations
docker compose -f docker-compose.prod.yml exec api npx prisma migrate deploy

# Open Prisma Studio (development only)
docker compose -f docker-compose.prod.yml exec api npx prisma studio
```

### Monitoring

```bash
# Check resource usage
docker stats

# Check disk usage
df -h
```

### Troubleshooting

1. **Port already in use**: The app runs on port 8888 to avoid conflicts with system services
2. **API not responding**: Check logs with `docker compose logs api`
3. **Database connection issues**: Verify PostgreSQL is healthy with `docker compose ps`

### Security Notes

⚠️ **Important**: Before going to production:

1. Change all default passwords in `.env`
2. Set up SSL/TLS certificates
3. Configure firewall rules
4. Set up regular backups
5. Monitor logs for security issues

### Next Steps

1. Set up a domain name
2. Configure SSL with Let's Encrypt
3. Set up monitoring (Prometheus/Grafana)
4. Configure automated backups
5. Set up CI/CD pipeline