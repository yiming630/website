# Translation Platform Deployment Guide

Based on: `Documentations/服务器部署指南.md`

## Quick Start with PM2

### 1. Prerequisites

```bash
# Install Node.js (18+), PostgreSQL, and PM2
npm install -g pm2

# Create .env file from template
cp .env.example .env
# Edit .env with your configuration
```

### 2. Start with PM2

```bash
# Option 1: Use the main orchestrator (Recommended)
pm2 start main.js --name "translation-platform"

# Option 2: Use ecosystem file
pm2 start ecosystem.config.js --env production

# Option 3: Quick development start
pm2 start ecosystem.config.js --env development
```

### 3. PM2 Management Commands

```bash
# View running processes
pm2 list

# View logs
pm2 logs

# Restart all services
pm2 restart all

# Stop all services
pm2 stop all

# Monitor resources
pm2 monit

# Setup auto-startup
pm2 startup
pm2 save
```

## Full Server Deployment

### Automated Deployment Script

```bash
# Make script executable
chmod +x deploy.sh

# Deploy to production
./deploy.sh production

# Deploy to development
./deploy.sh development

# Deploy to staging
./deploy.sh staging
```

### Manual Deployment Steps

Follow the detailed steps in `Documentations/服务器部署指南.md`:

1. **Server Setup** - Create admin user, update system
2. **Install Environment** - Node.js (via nvm), PostgreSQL, PM2
3. **Configure Database** - Create database and user
4. **Deploy Code** - Git clone, install dependencies
5. **Configure Environment** - Create .env file
6. **Start with PM2** - Use main.js or ecosystem.config.js
7. **Setup Nginx** - Reverse proxy configuration
8. **Configure HTTPS** - SSL certificates with Let's Encrypt

## Architecture Overview

### Services Started by main.js

1. **Database Health Check** - Verifies PostgreSQL connection
2. **API Gateway** (Port 4000) - GraphQL Apollo Server
3. **User Service** (Port 4001) - Authentication & User Management
4. **Frontend** (Port 3000) - Next.js React Application
5. **Health Check** (Port 8080) - System monitoring endpoint

### Service Dependencies

```
Database → User Service → API Gateway → Frontend
                    ↓
              Health Monitor
```

## Environment Configuration

### Required Environment Variables

```bash
# Database (Required)
DB_HOST=localhost
DB_NAME=translation_platform
DB_USER=postgres
DB_PASSWORD=your_secure_password

# Security (Required)
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_min_32_chars

# Application (Optional)
NODE_ENV=production
API_GATEWAY_PORT=4000
USER_SERVICE_PORT=4001
CORS_ORIGIN=http://localhost:3000
```

See `.env.example` for complete configuration options.

## Monitoring and Logs

### Health Check Endpoints

- **Main Health**: `http://localhost:8080/health`
- **API Gateway**: `http://localhost:4000/health`
- **Frontend**: `http://localhost:3000`

### Log Files

```bash
# PM2 logs
pm2 logs

# Application logs (if configured)
tail -f logs/app.log
tail -f logs/err.log
tail -f logs/out.log
```

### Process Monitoring

```bash
# Real-time monitoring
pm2 monit

# Process status
pm2 list

# Resource usage
pm2 describe translation-platform
```

## Nginx Configuration

### Reverse Proxy Setup

The deployment automatically configures Nginx to:
- Forward `/graphql` → API Gateway (4000)
- Forward `/api/*` → API Gateway (4000)
- Forward `/health` → Health Monitor (8080)
- Forward `/` → Frontend (3000)

### SSL/HTTPS

For production with domain:
```bash
# Manual SSL setup
sudo certbot --nginx -d your-domain.com
```

## Troubleshooting

### Common Issues

1. **Port Conflicts**
   ```bash
   # Check what's using a port
   sudo netstat -tulpn | grep :4000
   ```

2. **Database Connection**
   ```bash
   # Test database connection
   npm run db:test
   ```

3. **Permission Issues**
   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER .
   chmod 600 .env
   ```

4. **Service Not Starting**
   ```bash
   # Check PM2 logs
   pm2 logs translation-platform
   
   # Check individual service
   cd services/api-gateway
   npm start
   ```

### Recovery Commands

```bash
# Restart everything
pm2 restart all

# Reload ecosystem
pm2 reload ecosystem.config.js --env production

# Reset PM2
pm2 kill
pm2 start ecosystem.config.js --env production
```

## Development vs Production

### Development Setup

```bash
# Install dependencies
npm install
cd frontend && npm install
cd ../services/api-gateway && npm install
cd ../user-service && npm install

# Start development
pm2 start ecosystem.config.js --env development
```

### Production Deployment

```bash
# Use deployment script
./deploy.sh production

# Or manual production setup
npm run build
pm2 start ecosystem.config.js --env production
```

## Security Considerations

1. **Strong Passwords** - Use secure database and JWT secrets
2. **Firewall** - Configure UFW to allow only necessary ports
3. **SSL/HTTPS** - Always use HTTPS in production
4. **Environment Files** - Never commit .env files to git
5. **User Permissions** - Run services as non-root user
6. **Database Access** - Restrict database user permissions

## Backup and Maintenance

### Database Backup

```bash
# Backup database
pg_dump -U postgres translation_platform > backup.sql

# Restore database
psql -U postgres translation_platform < backup.sql
```

### Code Updates

```bash
# Pull latest code
git pull origin master

# Install new dependencies
npm install

# Restart services
pm2 restart all
```

### Regular Maintenance

```bash
# Update system packages
sudo apt update && sudo apt upgrade

# Clean PM2 logs
pm2 flush

# Monitor disk space
df -h
```