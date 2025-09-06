#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🛑 Stopping all services...${NC}"

# Kill all node processes related to the project
echo "  Stopping Node.js processes..."
pkill -f "npm run" 2>/dev/null
pkill -f "nodemon" 2>/dev/null
pkill -f "next dev" 2>/dev/null

# Clear specific ports
echo "  Clearing ports..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:4002 | xargs kill -9 2>/dev/null || true
lsof -ti:5432 | xargs kill -9 2>/dev/null || true
lsof -ti:27017 | xargs kill -9 2>/dev/null || true

# Stop Docker containers (but keep data)
echo "  Stopping Docker containers..."
docker stop postgres mongodb 2>/dev/null || true

echo -e "${GREEN}✅ All services stopped${NC}"
echo ""
echo "ℹ️  Data is preserved in Docker volumes"
echo "   To completely reset data, run: npm run services:reset"
