#!/bin/bash

# ============================================================
# START BACKEND API SERVER (NPM LOCAL DEVELOPMENT)
# ============================================================
# This script starts the GraphQL API server for local testing
# Uses local PostgreSQL (NOT Docker)
# ============================================================

echo "================================================"
echo "   Starting Backend API (Local NPM Mode)       "
echo "================================================"
echo ""
echo "⚠️  This is for NPM local development only!"
echo "⚠️  NOT for use with Docker Compose!"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Move to project root
cd "$(dirname "$0")/.." || exit

# Check if PostgreSQL is running
if brew services list | grep -q "postgresql@16.*started"; then
    echo -e "${GREEN}✅ Local PostgreSQL is running${NC}"
else
    echo -e "${YELLOW}⚠️  Starting PostgreSQL...${NC}"
    brew services start postgresql@16
    sleep 2
fi

# Check database connection
if npm run db:test 2>/dev/null | grep -q "Database connected"; then
    echo -e "${GREEN}✅ Database connection successful${NC}"
else
    echo -e "${RED}❌ Cannot connect to database${NC}"
    echo "Please run: ./scripts/npm-setup.sh"
    exit 1
fi

# Check if port 4001 is available
if lsof -i :4001 &> /dev/null; then
    echo -e "${RED}❌ Port 4001 is already in use${NC}"
    echo "Another process is using the API port."
    echo ""
    echo "Running processes on port 4001:"
    lsof -i :4001 | grep LISTEN
    echo ""
    echo "Kill the process or use a different port in .env.local"
    exit 1
fi

echo ""
echo "📦 Starting GraphQL API Server..."
echo ""

# Start the backend
cd backend
npm start

# This will run until you press Ctrl+C