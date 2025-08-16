#!/bin/bash

# ============================================================
# START FRONTEND SERVER (NPM LOCAL DEVELOPMENT)
# ============================================================
# This script starts the Next.js frontend for local testing
# Connects to local backend API (NOT Docker)
# ============================================================

echo "================================================"
echo "   Starting Frontend (Local NPM Mode)          "
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

# Check if backend is running
if curl -s http://127.0.0.1:4001/health &> /dev/null; then
    echo -e "${GREEN}✅ Backend API is running (port 4001)${NC}"
else
    echo -e "${YELLOW}⚠️  Backend API not detected on port 4001${NC}"
    echo ""
    echo "Please start the backend first:"
    echo "  ./scripts/npm-start-backend.sh"
    echo ""
    echo "Or in another terminal:"
    echo "  cd backend && npm start"
    echo ""
    echo -n "Continue anyway? (y/N): "
    read -r response
    if ! [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        exit 1
    fi
fi

# Check if port 3000 is available
if lsof -i :3000 &> /dev/null; then
    echo -e "${YELLOW}⚠️  Port 3000 is already in use${NC}"
    echo ""
    echo "Running processes on port 3000:"
    lsof -i :3000 | grep LISTEN
    echo ""
    echo "Next.js will try to use an alternative port..."
    echo ""
fi

echo ""
echo "🌐 Starting Next.js Frontend..."
echo ""
echo "Expected URLs:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://127.0.0.1:4001/graphql"
echo ""

# Start the frontend
cd frontend
npm run dev

# This will run until you press Ctrl+C