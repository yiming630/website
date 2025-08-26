# Production Deployment Guide: Keep Your npm Service Running 24/7

This guide provides multiple proven methods to keep your Translation Platform running continuously on a server, even after closing terminal/SSH sessions.

## 🚀 Method 1: PM2 (Process Manager 2) - RECOMMENDED

PM2 is the most popular and reliable solution for production Node.js applications.

### Installation

```bash
# Global installation (preferred)
npm install -g pm2

# Or use npx (if global installation fails)
npx pm2 --version
```

### Basic Usage

```bash
# Start your application
npx pm2 start main.js --name "translation-platform"

# Start with ecosystem config (recommended)
npx pm2 start ecosystem.config.js --env production

# Monitor processes
npx pm2 status
npx pm2 logs translation-platform
npx pm2 monit

# Restart/reload
npx pm2 restart translation-platform
npx pm2 reload translation-platform

# Stop and delete
npx pm2 stop translation-platform
npx pm2 delete translation-platform
```

### Auto-start on System Boot

```bash
# Generate startup script
npx pm2 startup

# Save current process list
npx pm2 save

# To disable auto-startup
npx pm2 unstartup
```

### Ecosystem Configuration (Your existing config)

Your `ecosystem.config.js` is already configured! Key features:
- Auto-restart on crashes
- Memory limit monitoring
- Environment-specific configs
- Log management
- Health checks

---

## 🐳 Method 2: Docker with Docker Compose

### Create Production Dockerfile

```dockerfile
# frontend/Dockerfile.prod
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
```

### Docker Compose for Full Stack

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    depends_on:
      - api-gateway

  api-gateway:
    build:
      context: ./services/api-gateway
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    depends_on:
      - postgres

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: translation_platform
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: your_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

### Deploy with Docker

```bash
# Build and start
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop
docker-compose -f docker-compose.prod.yml down
```

---

## 🖥️ Method 3: Linux systemd Service

### Create Service File

```bash
sudo nano /etc/systemd/system/translation-platform.service
```

```ini
[Unit]
Description=Translation Platform Node.js Application
Documentation=https://github.com/yourusername/translation-platform
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/your/app
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/node main.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=translation-platform

[Install]
WantedBy=multi-user.target
```

### Control Service

```bash
# Enable auto-start
sudo systemctl enable translation-platform

# Start service
sudo systemctl start translation-platform

# Check status
sudo systemctl status translation-platform

# View logs
sudo journalctl -u translation-platform -f

# Stop service
sudo systemctl stop translation-platform
```

---

## 📱 Method 4: Screen/Tmux Sessions

### Using Screen

```bash
# Install screen
sudo apt-get install screen  # Ubuntu/Debian
# or
sudo yum install screen      # CentOS/RHEL

# Create named session
screen -S translation-platform

# Inside screen session, start your app
cd /path/to/your/app
npm start

# Detach session (Ctrl+A, then D)
# or press Ctrl+A followed by D

# List sessions
screen -ls

# Reattach to session
screen -r translation-platform

# Kill session
screen -X -S translation-platform quit
```

### Using Tmux

```bash
# Install tmux
sudo apt-get install tmux    # Ubuntu/Debian

# Create session
tmux new-session -s translation-platform

# Start your app
npm start

# Detach session (Ctrl+B, then D)

# List sessions
tmux list-sessions

# Reattach
tmux attach-session -t translation-platform

# Kill session
tmux kill-session -t translation-platform
```

---

## 🔧 Method 5: Node.js Forever

### Installation

```bash
npm install -g forever
```

### Usage

```bash
# Start application
forever start main.js

# Start with options
forever start --pidFile=/var/run/translation-platform.pid \
             --sourceDir=/path/to/your/app \
             --minUptime=1000 \
             --spin=1000 \
             main.js

# List running processes
forever list

# Stop application
forever stop main.js

# Stop all
forever stopall

# View logs
forever logs main.js
```

---

## 🎯 Method 6: nohup (Simple but Limited)

```bash
# Basic usage
nohup npm start &

# With output redirection
nohup npm start > app.log 2>&1 &

# Check if running
ps aux | grep node

# Kill process
kill -9 <PID>
```

---

## 🏆 Recommended Production Setup

### For Your Translation Platform:

1. **Development**: Use `npm run dev` or PM2 with development config
2. **Staging**: PM2 with staging environment
3. **Production**: PM2 + systemd (double redundancy) or Docker

### Step-by-Step Production Deployment:

```bash
# 1. Prepare your server
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Clone your repository
git clone https://github.com/yourusername/translation-platform.git
cd translation-platform

# 3. Install dependencies
npm install
cd frontend && npm install && npm run build && cd ..
cd backend && npm install && cd ..

# 4. Setup environment
cp config/environments/production.env.example .env
# Edit .env with your production values

# 5. Setup database
npm run db:setup

# 6. Install PM2 and start
npm install -g pm2
pm2 start ecosystem.config.js --env production

# 7. Setup auto-start
pm2 startup
pm2 save

# 8. Setup reverse proxy (Nginx)
# ... (see nginx configuration below)
```

### Nginx Reverse Proxy Configuration:

```nginx
# /etc/nginx/sites-available/translation-platform
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # API Gateway
    location /graphql {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🔍 Monitoring and Troubleshooting

### PM2 Monitoring

```bash
# Real-time monitoring
pm2 monit

# Web-based monitoring (PM2+)
pm2 plus

# Performance monitoring
pm2 show translation-platform

# Memory usage
pm2 list

# Restart on memory limit
pm2 start app.js --max-memory-restart 1G
```

### Log Management

```bash
# View logs
pm2 logs translation-platform

# Clear logs
pm2 flush

# Rotate logs
pm2 install pm2-logrotate
```

### Common Issues and Solutions

1. **Port already in use**:
   ```bash
   sudo lsof -i :3000
   sudo kill -9 <PID>
   ```

2. **Permission issues**:
   ```bash
   sudo chown -R $USER:$USER /path/to/app
   ```

3. **Memory leaks**:
   ```bash
   pm2 start app.js --max-memory-restart 1G
   ```

4. **Database connection issues**:
   ```bash
   npm run db:test
   ```

---

## 🚀 Quick Start Commands

### For immediate deployment:

```bash
# Quick PM2 setup
npx pm2 start main.js --name "translation-platform" --env production
npx pm2 startup
npx pm2 save

# Quick health check
curl http://localhost:8080/health
curl http://localhost:4000/graphql
curl http://localhost:3000
```

This will keep your service running even after closing terminal/SSH sessions!

