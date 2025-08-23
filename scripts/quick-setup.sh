#!/bin/bash

# Translation Platform Quick Setup Script
# Automatically detects OS and runs appropriate commands

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Detect OS
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$NAME
        VER=$VERSION_ID
        ID=$ID
    elif type lsb_release >/dev/null 2>&1; then
        OS=$(lsb_release -si)
        VER=$(lsb_release -sr)
    elif [ -f /etc/lsb-release ]; then
        . /etc/lsb-release
        OS=$DISTRIB_ID
        VER=$DISTRIB_RELEASE
    elif [ -f /etc/debian_version ]; then
        OS=Debian
        VER=$(cat /etc/debian_version)
    elif [ -f /etc/redhat-release ]; then
        OS=RedHat
    else
        OS=$(uname -s)
        VER=$(uname -r)
    fi
    
    echo -e "${BLUE}[INFO]${NC} Detected OS: $OS $VER"
    
    # Determine package manager
    if [[ "$ID" == "centos" ]] || [[ "$ID" == "rhel" ]] || [[ "$ID" == "almalinux" ]] || [[ "$ID" == "rocky" ]] || [[ "$ID" == "amzn" ]]; then
        PKG_MANAGER="yum"
        OS_TYPE="rhel"
    elif [[ "$ID" == "ubuntu" ]] || [[ "$ID" == "debian" ]]; then
        PKG_MANAGER="apt"
        OS_TYPE="debian"
    else
        echo -e "${RED}[ERROR]${NC} Unsupported OS: $OS"
        exit 1
    fi
    
    echo -e "${GREEN}[SUCCESS]${NC} Using package manager: $PKG_MANAGER"
}

# Update system packages
update_system() {
    echo -e "${BLUE}[INFO]${NC} Updating system packages..."
    
    if [[ "$PKG_MANAGER" == "yum" ]]; then
        sudo yum update -y
        sudo yum upgrade -y
    elif [[ "$PKG_MANAGER" == "apt" ]]; then
        sudo apt update
        sudo apt upgrade -y
    fi
    
    echo -e "${GREEN}[SUCCESS]${NC} System updated"
}

# Install essential packages
install_essentials() {
    echo -e "${BLUE}[INFO]${NC} Installing essential packages..."
    
    if [[ "$PKG_MANAGER" == "yum" ]]; then
        sudo yum groupinstall "Development Tools" -y
        sudo yum install -y epel-release
        sudo yum install -y wget curl git nano vim
    elif [[ "$PKG_MANAGER" == "apt" ]]; then
        sudo apt install -y build-essential
        sudo apt install -y wget curl git nano vim
    fi
    
    echo -e "${GREEN}[SUCCESS]${NC} Essential packages installed"
}

# Install Node.js
install_nodejs() {
    echo -e "${BLUE}[INFO]${NC} Installing Node.js..."
    
    # Install nvm
    if [ ! -d "$HOME/.nvm" ]; then
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
        [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
    fi
    
    # Install Node.js LTS
    nvm install --lts
    nvm use --lts
    
    # Install PM2
    npm install -g pm2
    
    echo -e "${GREEN}[SUCCESS]${NC} Node.js and PM2 installed"
}

# Install Python
install_python() {
    echo -e "${BLUE}[INFO]${NC} Installing Python 3.9+..."
    
    if [[ "$PKG_MANAGER" == "yum" ]]; then
        sudo yum install -y python39 python39-pip python39-devel
        sudo alternatives --set python3 /usr/bin/python3.9
    elif [[ "$PKG_MANAGER" == "apt" ]]; then
        sudo apt install -y python3.9 python3-pip python3.9-venv
    fi
    
    echo -e "${GREEN}[SUCCESS]${NC} Python installed"
}

# Install PostgreSQL
install_postgresql() {
    echo -e "${BLUE}[INFO]${NC} Installing PostgreSQL..."
    
    if [[ "$PKG_MANAGER" == "yum" ]]; then
        # Install PostgreSQL 14 for CentOS/RHEL
        sudo yum install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-7-x86_64/pgdg-redhat-repo-latest.noarch.rpm
        sudo yum install -y postgresql14 postgresql14-server postgresql14-contrib
        sudo /usr/pgsql-14/bin/postgresql-14-setup initdb
        sudo systemctl enable postgresql-14
        sudo systemctl start postgresql-14
    elif [[ "$PKG_MANAGER" == "apt" ]]; then
        sudo apt install -y postgresql postgresql-contrib
        sudo systemctl enable postgresql
        sudo systemctl start postgresql
    fi
    
    echo -e "${GREEN}[SUCCESS]${NC} PostgreSQL installed"
}

# Install Redis
install_redis() {
    echo -e "${BLUE}[INFO]${NC} Installing Redis..."
    
    if [[ "$PKG_MANAGER" == "yum" ]]; then
        sudo yum install -y redis
        sudo systemctl enable redis
        sudo systemctl start redis
    elif [[ "$PKG_MANAGER" == "apt" ]]; then
        sudo apt install -y redis-server
        sudo systemctl enable redis-server
        sudo systemctl start redis-server
    fi
    
    echo -e "${GREEN}[SUCCESS]${NC} Redis installed"
}

# Install Nginx
install_nginx() {
    echo -e "${BLUE}[INFO]${NC} Installing Nginx..."
    
    if [[ "$PKG_MANAGER" == "yum" ]]; then
        sudo yum install -y nginx
    elif [[ "$PKG_MANAGER" == "apt" ]]; then
        sudo apt install -y nginx
    fi
    
    sudo systemctl enable nginx
    sudo systemctl start nginx
    
    echo -e "${GREEN}[SUCCESS]${NC} Nginx installed"
}

# Create application user
create_app_user() {
    echo -e "${BLUE}[INFO]${NC} Creating application user..."
    
    if ! id "admin" &>/dev/null; then
        if [[ "$PKG_MANAGER" == "yum" ]]; then
            sudo useradd -m -s /bin/bash admin
            echo -e "${YELLOW}[ACTION]${NC} Please set password for admin user:"
            sudo passwd admin
            sudo usermod -aG wheel admin
        elif [[ "$PKG_MANAGER" == "apt" ]]; then
            sudo adduser admin
            sudo usermod -aG sudo admin
        fi
        echo -e "${GREEN}[SUCCESS]${NC} User 'admin' created"
    else
        echo -e "${YELLOW}[INFO]${NC} User 'admin' already exists"
    fi
}

# Main execution
main() {
    echo "=========================================="
    echo "  Translation Platform Quick Setup"
    echo "=========================================="
    echo ""
    
    # Detect OS
    detect_os
    
    # Run installation steps
    update_system
    install_essentials
    install_nodejs
    install_python
    install_postgresql
    install_redis
    install_nginx
    create_app_user
    
    echo ""
    echo "=========================================="
    echo -e "${GREEN}  Setup Complete!${NC}"
    echo "=========================================="
    echo ""
    echo "Next steps:"
    echo "1. Switch to admin user: su - admin"
    echo "2. Clone the repository:"
    echo "   git clone https://github.com/yiming630/website.git translation-platform"
    echo "3. Run the OpenRouter setup:"
    echo "   cd translation-platform"
    echo "   ./scripts/setup-openrouter-env.sh"
    echo ""
}

# Run main function
main