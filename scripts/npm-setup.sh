#!/bin/bash

# ============================================================
# NPM-BASED LOCAL DEVELOPMENT SETUP (NOT FOR DOCKER)
# ============================================================
# 
# PURPOSE: This script sets up the local development environment
#          using npm and local PostgreSQL for testing purposes.
#          
# NOTE: This is completely separate from Docker Compose setup.
#       Use this for local npm development ONLY.
#       
# WARNING: Do NOT run this if you're using Docker Compose.
#          The two setups are mutually exclusive.
# ============================================================

echo "================================================"
echo "   LOCAL NPM DEVELOPMENT SETUP (NON-DOCKER)    "
echo "================================================"
echo ""
echo "⚠️  WARNING: This setup is for NPM-based local testing only!"
echo "⚠️  Do NOT use if running with Docker Compose!"
echo ""
echo "Press Ctrl+C to cancel, or wait 3 seconds to continue..."
sleep 3

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    print_error "This script is designed for macOS. Please modify for your OS."
    exit 1
fi

echo "📋 Checking prerequisites for NPM setup..."
echo ""

# Check if Docker is running (warn if it is)
if docker info &> /dev/null; then
    print_warning "Docker is running. Make sure you're not using Docker Compose for this project!"
    print_warning "This setup uses local PostgreSQL on port 5432 and API on port 4001"
    echo ""
fi

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js installed: $NODE_VERSION"
else
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_success "npm installed: $NPM_VERSION"
else
    print_error "npm is not installed."
    exit 1
fi

# Check PostgreSQL (local installation, not Docker)
if /opt/homebrew/opt/postgresql@16/bin/psql --version &> /dev/null; then
    print_success "PostgreSQL is installed locally (Homebrew)"
else
    print_warning "PostgreSQL not found. Installing with Homebrew..."
    
    # Check Homebrew
    if command -v brew &> /dev/null; then
        brew install postgresql@16
        brew services start postgresql@16
        echo 'export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"' >> ~/.zshrc
        source ~/.zshrc
        print_success "PostgreSQL installed locally via Homebrew"
    else
        print_error "Homebrew not found. Please install PostgreSQL manually."
        echo "Visit: https://www.postgresql.org/download/"
        exit 1
    fi
fi

echo ""
echo "📦 Installing NPM dependencies (local development)..."
echo ""

# Move to project root
cd "$(dirname "$0")/.." || exit

# Install root dependencies
print_warning "Installing root project dependencies..."
npm install

# Install backend dependencies
print_warning "Installing backend API dependencies..."
cd backend && npm install && cd ..

# Install frontend dependencies
print_warning "Installing frontend Next.js dependencies..."
cd frontend && npm install --legacy-peer-deps && cd ..

print_success "All NPM dependencies installed for local development!"

echo ""
echo "🗄️  Setting up LOCAL PostgreSQL database (not Docker)..."
echo ""

# Check if PostgreSQL is running locally
if brew services list | grep -q "postgresql@16.*started"; then
    print_success "Local PostgreSQL is running (port 5432)"
else
    print_warning "Starting local PostgreSQL service..."
    brew services start postgresql@16
fi

# Create database if it doesn't exist
if /opt/homebrew/opt/postgresql@16/bin/psql -lqt | cut -d \| -f 1 | grep -qw translation_platform; then
    print_success "Database 'translation_platform' already exists"
    echo -n "Do you want to reset the database? (y/N): "
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        npm run db:reset
        npm run db:init
        print_success "Database reset and initialized with test data"
    fi
else
    print_warning "Creating database..."
    /opt/homebrew/opt/postgresql@16/bin/createdb translation_platform
    print_success "Database created"
    
    # Run database setup
    print_warning "Setting up database schema..."
    npm run db:reset
    
    print_warning "Loading test data..."
    npm run db:init
fi

print_success "Local PostgreSQL database setup complete!"

echo ""
echo "🔧 Checking environment configuration..."
echo ""

# Check if .env.local exists
if [ -f .env.local ]; then
    print_success ".env.local file exists"
    
    # Check if using correct local settings
    if grep -q "127.0.0.1:5432" .env.local; then
        print_success "Database URL correctly set to local PostgreSQL"
    else
        print_warning "Database URL may not be configured for local PostgreSQL"
        print_warning "Ensure DATABASE_URL uses: postgresql://username@127.0.0.1:5432/translation_platform"
    fi
    
    if grep -q "API_PORT=4001" .env.local; then
        print_success "API port set to 4001 (avoiding Docker's 4000)"
    else
        print_warning "Consider using API_PORT=4001 to avoid conflicts with Docker"
    fi
else
    print_error ".env.local file not found!"
    echo "Creating from template..."
    cat > .env.local << 'EOF'
# LOCAL NPM DEVELOPMENT CONFIGURATION (NOT FOR DOCKER)
# =====================================================

# Database Configuration (Local PostgreSQL - NOT Docker)
DATABASE_URL=postgresql://${USER}@127.0.0.1:5432/translation_platform
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=translation_platform
DB_USER=${USER}
DB_PASSWORD=
DB_SSL=false

# PostgreSQL Connection Pool
DB_MAX_CONNECTIONS=20
DB_IDLE_TIMEOUT=10000

# JWT Configuration (Change for production!)
JWT_SECRET=local-dev-jwt-secret-2024
JWT_EXPIRES_IN=7d

# API Configuration (Port 4001 to avoid Docker conflicts)
NODE_ENV=development
PORT=3000
API_PORT=4001
NEXT_PUBLIC_API_URL=http://localhost:4001/graphql

# Cloud Storage (Add when ready)
# BOS_ACCESS_KEY=
# BOS_SECRET_KEY=
# BOS_BUCKET_NAME=
# BOS_ENDPOINT=

# AI Services (Add when ready)
# GEMINI_API_KEY=
# GEMINI_MODEL=gemini-1.5-pro
EOF
    print_success ".env.local created for local NPM development"
fi

echo ""
echo "================================================"
echo "✨ LOCAL NPM SETUP COMPLETE!"
echo "================================================"
echo ""
echo "🎯 DEVELOPMENT MODE: NPM + Local PostgreSQL"
echo "   (NOT using Docker Compose)"
echo ""
echo "📝 Test Accounts:"
echo "   • test@example.com / test123 (translator)"
echo "   • admin@example.com / admin123 (admin)"
echo "   • demo@example.com / demo123 (demo)"
echo ""
echo "🚀 To start the LOCAL development servers:"
echo ""
echo "   Terminal 1 - Backend API:"
echo "   cd backend && npm start"
echo ""
echo "   Terminal 2 - Frontend:"
echo "   cd frontend && npm run dev"
echo ""
echo "📊 GraphQL Playground: http://127.0.0.1:4001/graphql"
echo "🌐 Next.js App:       http://localhost:3000"
echo ""
echo "⚠️  IMPORTANT: These ports are different from Docker setup!"
echo "   • API: 4001 (not 4000 - avoiding Docker conflict)"
echo "   • DB:  5432 (local PostgreSQL, not Docker)"
echo ""