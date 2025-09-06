# 🔍 Database Schema Debugging Guide

## Common Issues and Solutions

### 1. Column/Table Not Found Errors
**Symptoms**: `column "X" of relation "Y" does not exist`

**Root Causes**:
- Database was recreated without migrations
- Backend cached old schema in memory
- Migrations weren't run after database restart

**Solution Process**:
```bash
# 1. Check if table exists
psql postgresql://postgres:password@localhost:5432/translation_platform -c "\dt"

# 2. Check table structure
psql postgresql://postgres:password@localhost:5432/translation_platform -c "\d table_name"

# 3. Run migrations
node backend/databases/migrate.js

# 4. IMPORTANT: Restart backend to refresh connections
pkill -f "npm run backend" && npm run backend:dev
```

### 2. Backend Caching Issues
**Key Insight**: The backend caches database schema at startup!

**When to restart backend**:
- After adding/removing columns
- After running migrations
- After recreating databases
- When seeing schema mismatch errors

### 3. Data Persistence with Docker

**With Volumes (Persistent)**:
```bash
docker run -v postgres_data:/var/lib/postgresql/data postgres
# Data survives container restarts
```

**Without Volumes (Lost on restart)**:
```bash
docker run postgres  # Data lost when container stops
```

### 4. Debugging Commands

```bash
# Check what's in PostgreSQL
psql $DB_URL -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public'"

# Check specific table columns
psql $DB_URL -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='file_metadata'"

# Check MongoDB collections
docker exec mongodb mongosh translation_platform_dev --eval "db.getCollectionNames()"

# Check if services are healthy
curl http://localhost:4002/health | jq .

# See what backend expects (check the error logs)
# The error message tells you EXACTLY what column/table is missing
```

### 5. Prevention Strategies

1. **Always run migrations after starting databases**
2. **Restart backend after schema changes**
3. **Use persistent volumes for development**
4. **Check health endpoints before testing**
5. **Read error messages carefully - they tell you exactly what's wrong**

### 6. Quick Troubleshooting Flow

```
Error occurs → Read error message → Identify missing column/table
↓
Check if databases are running (docker ps)
↓
Check table exists (psql ... -c "\dt")
↓
Check column exists (psql ... -c "\d table_name")
↓
Run migrations if needed
↓
RESTART BACKEND (critical step!)
↓
Test again
```

### 7. Common Pitfalls

❌ **DON'T**: Assume backend will pick up database changes automatically
✅ **DO**: Always restart backend after database schema changes

❌ **DON'T**: Use `docker rm -f` unless you want to lose data
✅ **DO**: Use volumes for persistent storage

❌ **DON'T**: Skip reading error messages
✅ **DO**: Error messages tell you exactly what's missing

### 8. The Golden Rule

**If you change the database schema, you MUST restart the backend!**

The backend's database connection pool caches schema information at startup.
No amount of migrations will fix this until you restart the backend service.
