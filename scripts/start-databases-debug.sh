#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}        DATABASE SERVICES STARTUP (DEBUG MODE)            ${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Function to check if container exists
container_exists() {
    docker ps -a --format '{{.Names}}' 2>/dev/null | grep -q "^$1$"
}

# Function to check if container is running
container_running() {
    docker ps --format '{{.Names}}' 2>/dev/null | grep -q "^$1$"
}

# Start PostgreSQL with persistent volume
echo -e "\n${BLUE}[PostgreSQL Setup]${NC}"
if container_exists "postgres"; then
    if container_running "postgres"; then
        echo -e "${GREEN}✓ PostgreSQL already running${NC}"
    else
        echo "Starting existing PostgreSQL container..."
        docker start postgres >/dev/null 2>&1
        echo -e "${GREEN}✓ PostgreSQL started${NC}"
    fi
else
    echo "Creating new PostgreSQL container with persistent volume..."
    docker run --name postgres \
        -e POSTGRES_USER=postgres \
        -e POSTGRES_PASSWORD=password \
        -e POSTGRES_DB=translation_platform \
        -p 5432:5432 \
        -v postgres_data:/var/lib/postgresql/data \
        -d postgres:16-alpine >/dev/null 2>&1
    echo -e "${GREEN}✓ PostgreSQL created${NC}"
fi

# Start MongoDB with persistent volume
echo -e "\n${BLUE}[MongoDB Setup]${NC}"
if container_exists "mongodb"; then
    if container_running "mongodb"; then
        echo -e "${GREEN}✓ MongoDB already running${NC}"
    else
        echo "Starting existing MongoDB container..."
        docker start mongodb >/dev/null 2>&1
        echo -e "${GREEN}✓ MongoDB started${NC}"
    fi
else
    echo "Creating new MongoDB container with persistent volume..."
    docker run --name mongodb \
        -p 27017:27017 \
        -v mongo_data:/data/db \
        -d mongo:latest >/dev/null 2>&1
    echo -e "${GREEN}✓ MongoDB created${NC}"
fi

# Wait for databases
echo -e "\n${YELLOW}⏳ Waiting for databases...${NC}"
sleep 3

# Check PostgreSQL
until docker exec postgres pg_isready -U postgres -d translation_platform >/dev/null 2>&1; do
    sleep 1
done
echo -e "${GREEN}✓ PostgreSQL ready${NC}"

# Check MongoDB
until docker exec mongodb mongosh --eval "db.adminCommand('ping')" 2>/dev/null | grep -q "1"; do
    sleep 1
done
echo -e "${GREEN}✓ MongoDB ready${NC}"

# Run migrations
echo -e "\n${BLUE}[Running Migrations]${NC}"
cd "$(dirname "$0")/.." && node backend/databases/migrate.js 2>&1 | grep -E "✅|❌|🚀|Successfully|failed" | head -20

# Display PostgreSQL Schema
echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}                    DATABASE SCHEMA INFO                  ${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "\n${BLUE}📊 PostgreSQL Tables:${NC}"
PGPASSWORD=password psql -h localhost -U postgres -d translation_platform -t -c "
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema='public' 
ORDER BY table_name;" | while read table; do
    if [ ! -z "$table" ]; then
        echo -e "  ${GREEN}✓${NC} $table"
    fi
done

echo -e "\n${BLUE}📊 file_metadata columns (critical table):${NC}"
PGPASSWORD=password psql -h localhost -U postgres -d translation_platform -t -c "
SELECT column_name || ' (' || data_type || ')' 
FROM information_schema.columns 
WHERE table_name='file_metadata' 
ORDER BY ordinal_position 
LIMIT 10;" | while read col; do
    if [ ! -z "$col" ]; then
        echo -e "  • $col"
    fi
done

echo -e "\n${BLUE}📊 MongoDB Collections:${NC}"
docker exec mongodb mongosh translation_platform_dev --quiet --eval "
db.getCollectionNames().forEach(function(c) { 
    var count = db[c].countDocuments();
    print('  ✓ ' + c + ' (' + count + ' documents)');
})" 2>/dev/null || echo "  No collections yet"

# Check what backend expects (by looking at recent migrations)
echo -e "\n${BLUE}🔍 Backend Expected Columns (from migrations):${NC}"
echo "  Key columns backend expects in file_metadata:"
echo "  • processing_status (VARCHAR)"
echo "  • stored_filename (VARCHAR)" 
echo "  • file_key (VARCHAR)"
echo "  • file_metadata_id (INTEGER) in file_access_logs"
echo "  • gridfs_file_id (VARCHAR) for MongoDB reference"

echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Database services ready!${NC}"
echo ""
echo -e "${BLUE}📌 Connection Strings:${NC}"
echo "  PostgreSQL: postgresql://postgres:password@localhost:5432/translation_platform"
echo "  MongoDB: mongodb://localhost:27017/translation_platform_dev"
echo ""
echo -e "${YELLOW}⚠️  Remember:${NC} Restart backend after schema changes!"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
