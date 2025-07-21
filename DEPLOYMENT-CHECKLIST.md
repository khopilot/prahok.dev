# Deployment Checklist for prahok.dev

## 🚀 Pre-Deployment

### 1. Environment Variables
- [ ] Copy `.env.production` to `.env`
- [ ] Set `JWT_SECRET` (generate with: `openssl rand -base64 48`)
- [ ] Set `JWT_REFRESH_SECRET` (generate with: `openssl rand -base64 48`)
- [ ] Set `ANTHROPIC_API_KEY` from Claude dashboard
- [ ] Set `DAYTONA_API_KEY` (if using Daytona sandboxes)

### 2. Code Preparation
- [ ] Remove any `.env.local` from git history
- [ ] Ensure no hardcoded values in code
- [ ] Verify all API routes use environment variables
- [ ] Check that auth uses cookies (not localStorage)

### 3. Local Testing
- [ ] Run `npm run build` in both `apps/web` and `apps/api`
- [ ] Test with production environment variables locally
- [ ] Verify database migrations work

## 📦 Deployment Steps

### 1. Initial Setup (First Time Only)
```bash
# SSH to VPS
ssh nicolas@147.93.157.63

# Create project directory
mkdir -p /home/nicolas/projects/development
cd /home/nicolas/projects/development

# Clone repository
git clone https://github.com/your-username/prahok.dev.git prahok
cd prahok

# Set up environment
cp .env.production .env
nano .env  # Configure all variables

# Make deployment script executable
chmod +x deploy-live.sh
```

### 2. Deploy Application
```bash
# Run deployment
./deploy-live.sh
```

### 3. SSL Setup (First Time Only)
```bash
# The deployment guide mentions setup-ssl.sh
# This should be run after first deployment
```

## ✅ Post-Deployment Verification

### 1. Service Health
- [ ] Check API: `curl https://prahok.dev/api/health`
- [ ] Check Frontend: Open https://prahok.dev in browser
- [ ] Check all Docker containers: `docker-compose -f docker-compose.prod.yml ps`

### 2. Functionality Tests
- [ ] User registration works
- [ ] User login works
- [ ] Code generation works
- [ ] Project saving works
- [ ] Project loading from sidebar works

### 3. Monitoring
- [ ] Check logs: `docker-compose -f docker-compose.prod.yml logs -f`
- [ ] Monitor resources: `docker stats`
- [ ] Check database: `docker exec -it prahok-postgres psql -U prahok_user -d prahok_db`

## 🚨 Troubleshooting

### If deployment fails:
1. Check logs: `docker-compose -f docker-compose.prod.yml logs [service_name]`
2. Rollback if needed (backups are in `/home/nicolas/backups/prahok/`)
3. Fix issues and redeploy

### Common issues:
- **Port conflicts**: Check with `sudo netstat -tlnp | grep -E '(3000|5000|5432|6379)'`
- **Database connection**: Verify DATABASE_URL is correct
- **API key issues**: Ensure ANTHROPIC_API_KEY is valid

## 🔒 Security Reminders
- Never commit `.env` files
- Keep API keys secure
- Regularly update dependencies
- Monitor logs for suspicious activity

## 📞 Support
If you encounter issues, refer to the full deployment guide at:
`/home/nicolas/projects/development/prahok/DEPLOYMENT-GUIDE.md`