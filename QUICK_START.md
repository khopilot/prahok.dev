# 🚀 Prahok.dev Quick Start Guide

Get the project running in under 5 minutes!

## 1️⃣ First Time Setup (One-time only)

```bash
# Clone the repository
git clone https://github.com/yourusername/prahok.dev.git
cd prahok.dev

# Install dependencies
npm install

# Set up environment files
cp apps/api/.env.local apps/api/.env
cp apps/web/.env.local apps/web/.env.local
```

## 2️⃣ Start Development Environment

```bash
# Start database and cache (Docker required)
npm run docker:local

# Run database migrations
npm run db:migrate

# Start both frontend and backend
npm run dev
```

## 3️⃣ Access Your Applications

- 🌐 **Frontend**: http://localhost:3000
- 🔧 **API**: http://localhost:5000
- 💌 **MailDev** (email testing): http://localhost:1080
- 🗄️ **Prisma Studio** (database GUI): Run `npm run db:studio`

## 📝 Daily Development Workflow

```bash
# Start services (if not already running)
npm run docker:local

# Start development servers
npm run dev

# When done, stop Docker services (optional)
npm run docker:local:down
```

## 🆘 Troubleshooting

### Port already in use?
```bash
# Check what's using the ports
lsof -i :3000  # Frontend
lsof -i :5000  # API
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis

# Kill the process using the port
kill -9 <PID>
```

### Database connection issues?
```bash
# Check if Docker containers are running
docker ps

# Restart Docker services
npm run docker:local:down
npm run docker:local

# Check logs
docker-compose -f docker-compose.local.yml logs
```

### Clean slate needed?
```bash
# Stop everything
npm run docker:local:down

# Remove volumes (THIS DELETES ALL DATA!)
docker-compose -f docker-compose.local.yml down -v

# Start fresh
npm run docker:local
npm run db:migrate
```

## 📚 Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Check [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment
- Join our Discord/Slack for help (link here)

Happy coding! 🎉