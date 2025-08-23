# Translation Platform - Baidu Cloud Deployment Guide
*Complete guide to deploy your AI-powered Translation Platform with OpenRouter and local storage on Baidu Cloud for public internet access*

## 🚀 Quick Start

This guide will help you deploy the Translation Platform (SeekHub Demo - 格式译专家) on Baidu Cloud servers, using OpenRouter for AI translation and local storage instead of Google Cloud services.

### Prerequisites
- **Baidu Cloud Light Application Server** (百度云轻量应用服务器)
- Ubuntu 20.04+ or CentOS 7+
- At least 4GB RAM and 50GB storage (recommended for production)
- Root or sudo access
- **OpenRouter API Key** (for AI translation services)

---

## 📋 Step-by-Step Deployment

### Step 1: Provision Your Baidu Cloud Server

#### Baidu Cloud Light Application Server (百度云轻量应用服务器)
```bash
# 创建轻量应用服务器
# - 镜像: Ubuntu 20.04 LTS 或 CentOS 7.9
# - 套餐: 4核8GB内存 (推荐用于生产环境)
# - 存储: 80GB SSD系统盘
# - 带宽: 5Mbps起步 (根据用户量调整)
# - 地域: 选择离目标用户最近的地域
```

#### Security Group Configuration (安全组配置)
```bash
# 入站规则:
# - SSH (22): 限制IP访问
# - HTTP (80): 0.0.0.0/0
# - HTTPS (443): 0.0.0.0/0
# - API Gateway (4000): 0.0.0.0/0
# - Frontend (3000): 0.0.0.0/0 (开发环境)
# - Document Service (8001): 内网访问
# - Health Check (8080): 内网访问
```

### Step 2: Initial Server Setup

```bash
# Connect to your server
ssh root@YOUR_SERVER_IP

# Detect your Linux distribution
cat /etc/os-release
```

#### For CentOS/RHEL/Alibaba Cloud Linux (Most Baidu Cloud Servers):
```bash
# Update system packages
sudo yum update -y
sudo yum upgrade -y

# Install essential tools
sudo yum groupinstall "Development Tools" -y
sudo yum install epel-release -y
sudo yum install wget curl git nano vim -y

# Create application user
sudo useradd -m -s /bin/bash admin
sudo passwd admin  # Set password
sudo usermod -aG wheel admin  # Add to sudo group
su - admin
```

#### For Ubuntu/Debian:
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install build-essential curl wget git nano vim -y

# Create application user
sudo adduser admin
sudo usermod -aG sudo admin
su - admin
```

### Step 3: Automated Deployment with OpenRouter

```bash
# Clone the repository
git clone https://github.com/yiming630/website.git translation-platform
cd translation-platform

# Run OpenRouter setup script
chmod +x scripts/setup-openrouter-env.sh
./scripts/setup-openrouter-env.sh

# Or use the main deployment script
chmod +x deploy.sh
export DOMAIN=YOUR_SERVER_IP
export USE_OPENROUTER=true
./deploy.sh production
```

### Step 4: Manual Configuration with All Services

If you prefer manual setup:

#### Install Core Dependencies

##### For CentOS/RHEL:
```bash
# Install Node.js via nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install --lts
nvm use --lts

# Install PM2 for process management
npm install -g pm2

# Install Python 3.9+ for document processing
sudo yum install python39 python39-pip python39-devel -y
sudo alternatives --set python3 /usr/bin/python3.9

# Install PostgreSQL 14
sudo yum install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-7-x86_64/pgdg-redhat-repo-latest.noarch.rpm
sudo yum install -y postgresql14 postgresql14-server postgresql14-contrib
sudo /usr/pgsql-14/bin/postgresql-14-setup initdb
sudo systemctl enable postgresql-14
sudo systemctl start postgresql-14

# Install Redis
sudo yum install -y redis
sudo systemctl enable redis
sudo systemctl start redis

# Install Nginx
sudo yum install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# Additional utilities
sudo yum install -y git gcc gcc-c++ make
```

##### For Ubuntu/Debian:
```bash
# Install Node.js via nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install --lts
nvm use --lts

# Install PM2 for process management
npm install -g pm2

# Install Python 3.9+ for document processing
sudo apt update
sudo apt install python3.9 python3-pip python3-venv -y

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Install Redis
sudo apt install redis-server -y
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Install Nginx
sudo apt install nginx -y

# Additional utilities
sudo apt install git build-essential curl wget -y
```

#### Setup Database
```bash
sudo -u postgres psql
CREATE DATABASE translation_platform;
CREATE USER platform_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE translation_platform TO platform_user;
ALTER USER platform_user CREATEDB;
\q
```

#### Setup Redis with Password

##### For CentOS/RHEL:
```bash
# Configure Redis password
sudo sed -i 's/# requirepass foobared/requirepass your_redis_password/' /etc/redis.conf
# Or if config is in different location:
# sudo sed -i 's/# requirepass foobared/requirepass your_redis_password/' /etc/redis/redis.conf

# Enable Redis to bind to all interfaces (if needed)
sudo sed -i 's/bind 127.0.0.1/bind 0.0.0.0/' /etc/redis.conf

# Restart Redis
sudo systemctl restart redis

# Test Redis connection
redis-cli -a your_redis_password ping
```

##### For Ubuntu/Debian:
```bash
# Configure Redis password
sudo sed -i 's/# requirepass foobared/requirepass your_redis_password/' /etc/redis/redis.conf
sudo systemctl restart redis-server

# Test Redis connection
redis-cli -a your_redis_password ping
```

#### Deploy Application with All Services
```bash
# Clone repository
git clone https://github.com/yiming630/website.git translation-platform
cd translation-platform

# Install root dependencies
npm install

# Install API Gateway dependencies
cd services/api-gateway && npm install && cd ../..

# Install User Service dependencies
cd services/user-service && npm install && cd ../..

# Install Frontend dependencies
cd frontend && npm install --legacy-peer-deps && cd ..

# Setup Python Document Service
cd backend/services/document-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
deactivate
cd ../../..

# Create local storage directories
sudo mkdir -p /data/seekhub/storage
sudo mkdir -p /data/seekhub/output
sudo mkdir -p /tmp/seekhub
sudo chown -R $USER:$USER /data/seekhub
sudo chown -R $USER:$USER /tmp/seekhub

# Copy and configure environment file
cp config/environments/env.openrouter .env
# Edit .env with your OpenRouter API key and server details
```

### Step 5: Configure Environment Variables for Baidu Cloud & OpenRouter

Edit your `.env` file with Baidu Cloud and OpenRouter specific values:

```env
# ==================== Server Configuration ====================
NODE_ENV=production
HOST=0.0.0.0
API_GATEWAY_PORT=4000
USER_SERVICE_PORT=4001
HEALTH_PORT=8080

# ==================== OpenRouter AI Configuration ====================
# Get your API key from: https://openrouter.ai/
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=google/gemini-pro-1.5
OPENROUTER_FALLBACK_MODEL=google/gemini-flash-1.5
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
SITE_URL=http://YOUR_SERVER_IP:3000
SITE_NAME=Translation Platform

# ==================== Local Storage (Baidu Server) ====================
# Using local storage instead of Google Cloud Storage
USE_LOCAL_STORAGE=true
LOCAL_STORAGE_ROOT=/data/seekhub/storage
PUBLIC_URL_BASE=http://YOUR_SERVER_IP:4000/files
DOCX_OUTPUT_DIR=/data/seekhub/output
TEMP_FILES_DIR=/tmp/seekhub

# ==================== Baidu Cloud Services (Optional) ====================
# If using Baidu Object Storage (BOS)
BAIDU_ACCESS_KEY=your_baidu_access_key
BAIDU_SECRET_KEY=your_baidu_secret_key
BAIDU_BOS_ENDPOINT=bj.bcebos.com
BAIDU_BOS_BUCKET=your_bucket_name
BAIDU_CDN_BASE_URL=https://your-cdn.bcebos.com

# ==================== Database Configuration ====================
DB_HOST=localhost
DB_PORT=5432
DB_NAME=translation_platform
DB_USER=platform_user
DB_PASSWORD=your_secure_password
# Alternative: Full database URL
# DATABASE_URL=postgresql://platform_user:password@localhost:5432/translation_platform

# ==================== Redis Cache ====================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_URL=redis://:your_redis_password@localhost:6379

# ==================== Security ====================
JWT_SECRET=your_super_long_jwt_secret_minimum_64_characters_recommended
JWT_REFRESH_SECRET=your_super_long_refresh_secret_minimum_64_characters_recommended
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# ==================== CORS Configuration ====================
CORS_ORIGIN=http://YOUR_SERVER_IP:3000
# For production with domain:
# CORS_ORIGIN=https://your-domain.com

# ==================== Translation Service ====================
TRANSLATION_SERVICE_URL=http://localhost:8000
PDF_PROCESSOR_URL=http://localhost:8001
MAX_CONCURRENT_TRANSLATIONS=5
TRANSLATION_TIMEOUT=300000
ENABLE_TRANSLATION_CACHE=true

# ==================== Rate Limiting ====================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX_REQUESTS=5
```

### Step 6: Start All Application Services

```bash
# Initialize database schema and tables
npm run db:reset
npm run db:init

# Method 1: Start all services with main orchestrator (Recommended)
pm2 start main.js --name "translation-platform"

# Method 2: Start with ecosystem configuration
pm2 start ecosystem.config.js --env production

# Method 3: Start services individually
# API Gateway
cd services/api-gateway
pm2 start src/server.js --name "api-gateway" --env "NODE_ENV=production PORT=4000"
cd ../..

# User Service
cd services/user-service
pm2 start src/server.js --name "user-service" --env "NODE_ENV=production PORT=4001"
cd ../..

# Document Processing Service (Python)
cd backend/services/document-service
pm2 start "python main.py" --name "document-service" --interpreter python3
cd ../../..

# Frontend (Next.js)
cd frontend
npm run build
pm2 start "npm start" --name "frontend"
cd ..

# View all running services
pm2 list

# Enable auto-start on boot
pm2 startup
pm2 save

# Monitor services
pm2 monit
```

### Step 7: Configure Nginx Reverse Proxy

```bash
# Create Nginx configuration
sudo tee /etc/nginx/sites-available/translation-platform > /dev/null <<EOF
server {
    listen 80;
    server_name YOUR_SERVER_IP;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # Client max body size for file uploads
    client_max_body_size 100M;

    # GraphQL endpoint
    location /graphql {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # API routes
    location /api/ {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300s;
    }

    # File uploads
    location /upload {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        client_max_body_size 100M;
        proxy_read_timeout 600s;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:8080;
        access_log off;
    }

    # Frontend application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable the site
sudo ln -s /etc/nginx/sites-available/translation-platform /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and restart Nginx
sudo nginx -t
sudo systemctl restart nginx
```

### Step 8: Configure Firewall

```bash
# Configure UFW firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Check status
sudo ufw status
```

### Step 9: Verify Deployment

```bash
# Check PM2 processes
pm2 list

# Check application logs
pm2 logs

# Check Nginx status
sudo systemctl status nginx

# Test health endpoint
curl http://YOUR_SERVER_IP/health
```

---

## 🌐 Accessing Your Translation Platform

Once deployed, your Translation Platform (SeekHub Demo - 格式译专家) will be accessible at:

### Public Endpoints:
- **Main Application**: `http://YOUR_SERVER_IP` or `http://YOUR_SERVER_IP:3000`
- **GraphQL API**: `http://YOUR_SERVER_IP:4000/graphql`
- **API Documentation**: `http://YOUR_SERVER_IP:4000/api-docs`
- **Health Check**: `http://YOUR_SERVER_IP:8080/health`

### Service Endpoints (Internal):
- **API Gateway**: Port 4000 (GraphQL, Authentication)
- **User Service**: Port 4001 (User Management)
- **Document Service**: Port 8001 (Python Document Processing)
- **Translation Service**: Port 8000 (OpenRouter Integration)
- **Frontend**: Port 3000 (Next.js React App)

### File Access:
- **Uploaded Files**: `http://YOUR_SERVER_IP:4000/files/[path]`
- **Translated Documents**: `http://YOUR_SERVER_IP:4000/files/output/[filename]`

## 🔒 Security Hardening for Baidu Cloud

### Enable HTTPS with Let's Encrypt or Baidu SSL

#### Option 1: Let's Encrypt (Free SSL)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d your-domain.com

# Auto-renewal setup
sudo systemctl enable certbot.timer
```

#### Option 2: Baidu Cloud SSL Certificate
```bash
# 使用百度云SSL证书服务
# 1. 在百度云控制台申请SSL证书
# 2. 下载证书文件
# 3. 配置Nginx使用SSL证书

sudo mkdir -p /etc/nginx/ssl
sudo cp your_domain.crt /etc/nginx/ssl/
sudo cp your_domain.key /etc/nginx/ssl/
sudo chmod 600 /etc/nginx/ssl/*
```

### Baidu Cloud Security Best Practices

```bash
# Configure Baidu Cloud Security Group (安全组)
# 在百度云控制台设置:
# - 限制SSH访问来源IP
# - 仅开放必要端口
# - 启用DDoS防护

# Change SSH port
sudo sed -i 's/#Port 22/Port 2222/' /etc/ssh/sshd_config
sudo systemctl restart ssh
sudo ufw allow 2222

# Setup SSH key authentication
ssh-keygen -t rsa -b 4096
# Add public key to ~/.ssh/authorized_keys

# Disable password authentication
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl restart ssh

# Install and configure fail2ban
sudo apt install fail2ban -y
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Configure application firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 2222/tcp  # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 3000/tcp  # Frontend (dev)
sudo ufw allow 4000/tcp  # API Gateway
sudo ufw --force enable
```

---

## 🔧 Baidu Cloud Specific Configuration

### Baidu Cloud Security Group (百度云安全组配置)
```yaml
# 入站规则 (Inbound Rules):
- HTTP (80): 0.0.0.0/0          # 公网访问
- HTTPS (443): 0.0.0.0/0        # 加密访问
- SSH (22/2222): 指定IP        # 管理访问
- API Gateway (4000): 0.0.0.0/0 # API服务
- Frontend (3000): 0.0.0.0/0    # 前端应用
- Health Check (8080): 内网     # 健康检查

# 出站规则 (Outbound Rules):
- All Traffic: 0.0.0.0/0        # 允许所有出站
```

### Baidu Cloud CDN Integration (可选)
```bash
# 配置百度云CDN加速静态资源
# 1. 在百度云控制台创建CDN域名
# 2. 配置源站为您的服务器IP
# 3. 设置缓存规则

# Nginx配置静态资源路径
location /static/ {
    alias /data/seekhub/storage/static/;
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

### Baidu Object Storage (BOS) Integration (可选)
```bash
# 如果需要使用百度对象存储而非本地存储
# 在.env文件中配置:
USE_LOCAL_STORAGE=false
BAIDU_ACCESS_KEY=your_access_key
BAIDU_SECRET_KEY=your_secret_key
BAIDU_BOS_ENDPOINT=bj.bcebos.com
BAIDU_BOS_BUCKET=your_bucket_name
```

---

## 📊 Monitoring and Maintenance

### PM2 Monitoring
```bash
# Real-time monitoring
pm2 monit

# View logs
pm2 logs --lines 100

# Restart services
pm2 restart all

# Check resource usage
pm2 list
```

### System Monitoring
```bash
# Check disk space
df -h

# Check memory usage
free -h

# Check running processes
htop

# Check Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Database Maintenance
```bash
# Create database backup
pg_dump -h localhost -U platform_user translation_platform > backup_$(date +%Y%m%d).sql

# Monitor database connections
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"
```

---

## 🚀 Scaling and Optimization

### Horizontal Scaling
```bash
# Run multiple instances with PM2
pm2 scale translation-platform +2

# Use cluster mode in ecosystem.config.js
instances: 'max'
exec_mode: 'cluster'
```

### Performance Optimization
```bash
# Enable Nginx gzip compression
sudo nano /etc/nginx/nginx.conf
# Add in http block:
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;

# Restart Nginx
sudo systemctl restart nginx
```

---

## 🆘 Troubleshooting

### Common Issues

#### Application won't start
```bash
# Check PM2 logs
pm2 logs

# Check environment variables
cat .env

# Verify database connection
npm run db:test
```

#### Can't access from internet
```bash
# Check if ports are open
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :3000

# Check firewall
sudo ufw status

# Check cloud provider security groups
```

#### High memory usage
```bash
# Check processes
pm2 list
htop

# Restart services
pm2 restart all

# Check for memory leaks in logs
pm2 logs --err
```

---

## 📋 Complete Deployment Checklist

### Infrastructure
- [ ] Baidu Cloud server provisioned (4GB+ RAM, 50GB+ storage)
- [ ] Security groups configured in Baidu Cloud console
- [ ] Domain name configured (optional but recommended)
- [ ] SSH key authentication set up
- [ ] Firewall (ufw) configured and enabled

### Core Services
- [ ] PostgreSQL installed and configured
- [ ] Redis installed with password authentication
- [ ] Nginx reverse proxy configured
- [ ] Node.js (LTS) installed via nvm
- [ ] Python 3.9+ installed for document service
- [ ] PM2 process manager installed globally

### Application Components
- [ ] API Gateway running (port 4000)
- [ ] User Service running (port 4001)
- [ ] Document Service running (port 8001)
- [ ] Frontend built and running (port 3000)
- [ ] Database schema initialized
- [ ] Local storage directories created with proper permissions

### AI Translation Service
- [ ] OpenRouter API key configured
- [ ] Translation service tested and working
- [ ] Gemini model selected and configured
- [ ] Rate limiting configured

### Security & Performance
- [ ] SSL certificate installed (Let's Encrypt or Baidu SSL)
- [ ] JWT secrets generated (64+ characters)
- [ ] Redis cache configured
- [ ] PM2 auto-start on boot configured
- [ ] Backup strategy implemented
- [ ] Monitoring and logging set up

### Optional Enhancements
- [ ] Baidu CDN configured for static assets
- [ ] Baidu Object Storage (BOS) integrated
- [ ] Custom domain with DNS configured
- [ ] Email service configured for notifications

---

## 🎯 Next Steps & Production Setup

### 1. Production Optimization
```bash
# Enable PM2 cluster mode for better performance
pm2 delete all
pm2 start ecosystem.config.js --env production --instances max

# Configure log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### 2. Setup Automated Backups
```bash
# Create backup script
cat > /home/admin/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/data/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup database
pg_dump -h localhost -U platform_user translation_platform > $BACKUP_DIR/db_$DATE.sql

# Backup uploaded files
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /data/seekhub/storage

# Keep only last 7 days of backups
find $BACKUP_DIR -type f -mtime +7 -delete

# Optional: Upload to Baidu Object Storage
# python3 /home/admin/upload_to_bos.py $BACKUP_DIR/db_$DATE.sql
EOF

chmod +x /home/admin/backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /home/admin/backup.sh
```

### 3. Custom Domain Setup
```bash
# Configure DNS (in your domain provider):
# A Record: @ -> YOUR_SERVER_IP
# A Record: www -> YOUR_SERVER_IP

# Update environment configuration
sed -i 's/YOUR_SERVER_IP/your-domain.com/g' .env
pm2 restart all
```

### 4. Setup Monitoring
```bash
# PM2 Plus monitoring (free tier available)
pm2 install pm2-auto-pull pm2-server-monit
pm2 link YOUR_SECRET_KEY YOUR_PUBLIC_KEY

# System monitoring with netdata
bash <(curl -Ss https://my-netdata.io/kickstart.sh)

# Check application health
curl http://localhost:8080/health
curl http://localhost:4000/metrics
```

### 5. CI/CD Pipeline
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Baidu Cloud
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_IP }}
          username: admin
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /home/admin/translation-platform
            git pull
            npm install
            npm run build
            pm2 restart all
```

Your Translation Platform is now live and ready for production use! 🌍

---

## 💡 Cost Optimization for Baidu Cloud

### Baidu Cloud Cost Savings
```bash
# Server Optimization
# - Start with 2核4GB for development (~¥50/month)
# - Scale to 4核8GB for production (~¥200/month)
# - Use reserved instances for 50% savings

# Storage Optimization
USE_LOCAL_STORAGE=true  # Avoid BOS costs for small files
LOCAL_STORAGE_ROOT=/data/seekhub/storage

# OpenRouter API Optimization
# Development: Use cheaper models
OPENROUTER_MODEL=google/gemini-flash-1.5

# Production: Use premium models selectively
OPENROUTER_MODEL=google/gemini-pro-1.5

# Caching Strategy
ENABLE_TRANSLATION_CACHE=true
REDIS_CACHE_TTL=3600  # Cache for 1 hour
```

### Resource Monitoring
```bash
# Monitor server resources
htop                    # CPU and memory usage
df -h                   # Disk usage
iotop                   # I/O performance
pm2 monit               # Application monitoring

# Database size check
sudo -u postgres psql -c "SELECT pg_database_size('translation_platform');"

# Redis memory usage
redis-cli -a your_password INFO memory
```

### Scaling Recommendations
| Stage | Server Specs | Monthly Cost | Users |
|-------|-------------|--------------|-------|
| Development | 2核2GB | ~¥50 | 1-10 |
| Small Business | 4核8GB | ~¥200 | 10-100 |
| Growth | 8核16GB | ~¥500 | 100-1000 |
| Enterprise | 16栲32GB+ | ~¥1000+ | 1000+ |

### Free Alternatives
- **Database**: PostgreSQL vs Managed DB (Save ¥200+/month)
- **Cache**: Redis vs Managed Cache (Save ¥100+/month)
- **Storage**: Local vs Object Storage (Save ¥50+/month for <100GB)
- **SSL**: Let's Encrypt vs Paid Certificates (Save ¥500+/year)