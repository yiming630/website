#!/bin/bash

# =============================================================================
# Translation Platform Deployment Script
# Based on: 服务器部署指南.md
# =============================================================================
#
# This script automates the deployment process described in the deployment guide.
# It handles the installation and setup of the entire Translation Platform.
#
# Usage:
#   chmod +x deploy.sh
#   ./deploy.sh [environment]
#
# Examples:
#   ./deploy.sh production
#   ./deploy.sh development
#   ./deploy.sh staging
#
# Prerequisites:
#   - Ubuntu/Debian server
#   - Root or sudo access
#   - Internet connection
# =============================================================================

set -e  # Exit on any error

# Configuration
ENVIRONMENT=${1:-production}
PROJECT_NAME="translation-platform"
APP_USER="admin"
APP_DIR="/home/$APP_USER/$PROJECT_NAME"
LOG_FILE="/tmp/${PROJECT_NAME}_deploy.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

# Error handler
error_handler() {
    log_error "Deployment failed at line $1"
    log_error "Check the log file: $LOG_FILE"
    exit 1
}

trap 'error_handler $LINENO' ERR

# =============================================================================
# PHASE 1: System Initialization (服务器初始设置)
# =============================================================================

phase1_system_setup() {
    log_info "Phase 1: System initialization"
    
    # Update system packages
    log_info "Updating system packages..."
    sudo apt update && sudo apt upgrade -y
    
    # Install essential packages
    log_info "Installing essential packages..."
    sudo apt install -y curl wget git build-essential software-properties-common
    
    # Create application user if doesn't exist
    if ! id "$APP_USER" &>/dev/null; then
        log_info "Creating application user: $APP_USER"
        sudo adduser --disabled-password --gecos "" "$APP_USER"
        sudo usermod -aG sudo "$APP_USER"
    else
        log_info "User $APP_USER already exists"
    fi
    
    log_success "Phase 1 completed: System initialization"
}

# =============================================================================
# PHASE 2: Install Core Environment (安装核心环境)
# =============================================================================

phase2_install_environment() {
    log_info "Phase 2: Installing core environment"
    
    # Install Node.js via nvm
    log_info "Installing Node.js..."
    if ! command -v nvm &> /dev/null; then
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
        [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
    fi
    
    # Install latest LTS Node.js
    nvm install --lts
    nvm use --lts
    
    # Install PM2 globally
    log_info "Installing PM2..."
    npm install -g pm2
    
    # Install PostgreSQL
    log_info "Installing PostgreSQL..."
    sudo apt install -y postgresql postgresql-contrib
    sudo systemctl enable postgresql
    sudo systemctl start postgresql
    
    log_success "Phase 2 completed: Core environment installed"
}

# =============================================================================
# PHASE 3: Database Configuration (配置数据库)
# =============================================================================

phase3_configure_database() {
    log_info "Phase 3: Configuring database"
    
    # Database configuration
    DB_NAME="${PROJECT_NAME}_${ENVIRONMENT}"
    DB_USER="${PROJECT_NAME}_user"
    DB_PASSWORD=$(openssl rand -base64 32)
    
    log_info "Creating database and user..."
    
    # Create database and user
    sudo -u postgres psql << EOF
CREATE DATABASE ${DB_NAME};
CREATE USER ${DB_USER} WITH ENCRYPTED PASSWORD '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
ALTER USER ${DB_USER} CREATEDB;
\q
EOF
    
    # Save database credentials
    cat > "/tmp/db_credentials.txt" << EOF
Database Name: ${DB_NAME}
Database User: ${DB_USER}
Database Password: ${DB_PASSWORD}
EOF
    
    log_success "Phase 3 completed: Database configured"
    log_info "Database credentials saved to: /tmp/db_credentials.txt"
}

# =============================================================================
# PHASE 4: Deploy Application Code (部署应用代码)
# =============================================================================

phase4_deploy_application() {
    log_info "Phase 4: Deploying application code"
    
    # Switch to application user
    sudo -u "$APP_USER" bash << EOF
set -e

# Create application directory
mkdir -p "$APP_DIR"
cd "$APP_DIR"

# Clone repository (if not exists) or pull latest changes
if [ ! -d ".git" ]; then
    log_info "Cloning repository..."
    git clone https://github.com/yiming630/website.git .
else
    log_info "Updating repository..."
    git pull origin master
fi

# Install dependencies
log_info "Installing dependencies..."

# Frontend dependencies
if [ -d "frontend" ]; then
    cd frontend
    npm install --legacy-peer-deps
    npm run build
    cd ..
fi

# API Gateway dependencies
if [ -d "services/api-gateway" ]; then
    cd services/api-gateway
    npm install
    cd ../..
fi

# User Service dependencies
if [ -d "services/user-service" ]; then
    cd services/user-service
    npm install
    cd ../..
fi

# Root dependencies
npm install

EOF

    log_success "Phase 4 completed: Application deployed"
}

# =============================================================================
# PHASE 5: Configure Environment (配置环境变量)
# =============================================================================

phase5_configure_environment() {
    log_info "Phase 5: Configuring environment"
    
    # Read database credentials
    source /tmp/db_credentials.txt 2>/dev/null || true
    
    # Generate JWT secrets
    JWT_SECRET=$(openssl rand -base64 64)
    JWT_REFRESH_SECRET=$(openssl rand -base64 64)
    
    # Create .env file
    sudo -u "$APP_USER" cat > "$APP_DIR/.env" << EOF
# Environment Configuration - Generated by deploy.sh
NODE_ENV=${ENVIRONMENT}
HOST=0.0.0.0
API_GATEWAY_PORT=4000
USER_SERVICE_PORT=4001
HEALTH_PORT=8080
ENABLE_FRONTEND=true

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=${DB_NAME:-translation_platform}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-changeme}

# Security
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF

    # Create logs directory
    sudo -u "$APP_USER" mkdir -p "$APP_DIR/logs"
    
    # Set proper permissions
    sudo chown -R "$APP_USER:$APP_USER" "$APP_DIR"
    sudo chmod 600 "$APP_DIR/.env"
    
    log_success "Phase 5 completed: Environment configured"
}

# =============================================================================
# PHASE 6: Start Application with PM2 (使用PM2启动应用)
# =============================================================================

phase6_start_application() {
    log_info "Phase 6: Starting application with PM2"
    
    # Switch to application user and start services
    sudo -u "$APP_USER" bash << EOF
set -e
cd "$APP_DIR"

# Initialize database
log_info "Initializing database..."
npm run db:setup

# Start application with PM2
log_info "Starting application..."
pm2 start ecosystem.config.js --env ${ENVIRONMENT}

# Setup PM2 startup
pm2 startup
pm2 save

EOF

    log_success "Phase 6 completed: Application started"
}

# =============================================================================
# PHASE 7: Configure Nginx and HTTPS (配置Nginx和HTTPS)
# =============================================================================

phase7_configure_nginx() {
    log_info "Phase 7: Configuring Nginx"
    
    # Install Nginx
    sudo apt install -y nginx
    
    # Configure firewall
    log_info "Configuring firewall..."
    sudo ufw allow OpenSSH
    sudo ufw allow 'Nginx Full'
    sudo ufw --force enable
    
    # Create Nginx configuration
    DOMAIN=${DOMAIN:-$(curl -s ifconfig.me)}
    
    sudo tee "/etc/nginx/sites-available/$PROJECT_NAME" > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    # API Gateway
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
    }

    # API routes
    location /api/ {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:8080;
        access_log off;
    }

    # Frontend (if enabled)
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

    # Enable site
    sudo ln -sf "/etc/nginx/sites-available/$PROJECT_NAME" "/etc/nginx/sites-enabled/"
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Test and restart Nginx
    sudo nginx -t
    sudo systemctl restart nginx
    
    log_success "Phase 7 completed: Nginx configured"
}

# =============================================================================
# PHASE 8: SSL/HTTPS Setup (Optional)
# =============================================================================

phase8_setup_ssl() {
    if [[ "$ENVIRONMENT" == "production" ]] && [[ -n "$DOMAIN" ]] && [[ "$DOMAIN" != *"."* ]]; then
        log_warning "Skipping SSL setup - no valid domain provided"
        return 0
    fi
    
    log_info "Phase 8: Setting up SSL/HTTPS"
    
    # Install Certbot
    sudo apt install -y certbot python3-certbot-nginx
    
    # Obtain SSL certificate
    if [[ -n "$DOMAIN" ]] && [[ "$DOMAIN" != *[0-9]* ]]; then
        log_info "Obtaining SSL certificate for domain: $DOMAIN"
        sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email "admin@$DOMAIN"
    else
        log_warning "Skipping SSL - no valid domain provided"
    fi
    
    log_success "Phase 8 completed: SSL configured"
}

# =============================================================================
# Main Deployment Function
# =============================================================================

main() {
    log_info "Starting Translation Platform deployment"
    log_info "Environment: $ENVIRONMENT"
    log_info "Log file: $LOG_FILE"
    
    # Check if running as root or with sudo
    if [[ $EUID -eq 0 ]] && [[ -z "$SUDO_USER" ]]; then
        log_error "Do not run this script as root. Use a regular user with sudo privileges."
        exit 1
    fi
    
    # Execute deployment phases
    phase1_system_setup
    phase2_install_environment
    phase3_configure_database
    phase4_deploy_application
    phase5_configure_environment
    phase6_start_application
    phase7_configure_nginx
    
    # SSL setup for production
    if [[ "$ENVIRONMENT" == "production" ]]; then
        phase8_setup_ssl
    fi
    
    # Final summary
    log_success "🎉 Translation Platform deployment completed successfully!"
    echo
    log_info "Application URLs:"
    log_info "  • Frontend: http://${DOMAIN:-localhost}"
    log_info "  • GraphQL API: http://${DOMAIN:-localhost}/graphql"
    log_info "  • Health Check: http://${DOMAIN:-localhost}/health"
    echo
    log_info "Management commands:"
    log_info "  • View PM2 status: pm2 list"
    log_info "  • View logs: pm2 logs"
    log_info "  • Restart services: pm2 restart all"
    echo
    log_info "Database credentials saved to: /tmp/db_credentials.txt"
    log_info "Environment file location: $APP_DIR/.env"
    log_info "Full deployment log: $LOG_FILE"
}

# Run main function
main "$@"