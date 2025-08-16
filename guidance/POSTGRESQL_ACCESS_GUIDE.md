# PostgreSQL Database Access Guide

## 🚀 Quick Access Commands

### Method 1: Direct Connection (Easiest)
```bash
# Connect to PostgreSQL database
docker exec -it translation-platform-db psql -U postgres -d translation_platform_dev
```

### Method 2: Using psql from your system
```bash
# If you have psql installed locally
psql -h localhost -p 5432 -U postgres -d translation_platform_dev
# Password: password (from .env file)
```

## 📊 Essential PostgreSQL Commands

Once you're connected to PostgreSQL, use these commands:

### Database Navigation
```sql
-- List all databases
\l

-- Connect to specific database
\c translation_platform_dev

-- Show current database
SELECT current_database();

-- List all tables in current database
\dt

-- List all schemas
\dn

-- Describe a specific table structure
\d users
\d projects
\d translations

-- List all columns of a table
\d+ users

-- Show table sizes
\dt+
```

### Viewing Data
```sql
-- View all data from a table
SELECT * FROM users;
SELECT * FROM projects;
SELECT * FROM translations;

-- Count records
SELECT COUNT(*) FROM users;

-- View first 10 records
SELECT * FROM users LIMIT 10;

-- View specific columns
SELECT id, email, username FROM users;

-- Search for specific data
SELECT * FROM users WHERE email LIKE '%@example.com';

-- Order data
SELECT * FROM users ORDER BY created_at DESC;

-- View recent records
SELECT * FROM translations 
WHERE created_at > NOW() - INTERVAL '7 days';
```

### Data Analysis Queries
```sql
-- Count users by role
SELECT role, COUNT(*) 
FROM users 
GROUP BY role;

-- Find most active users
SELECT user_id, COUNT(*) as translation_count 
FROM translations 
GROUP BY user_id 
ORDER BY translation_count DESC 
LIMIT 10;

-- Check database size
SELECT pg_database_size('translation_platform_dev');

-- Check table sizes
SELECT 
    schemaname AS table_schema,
    tablename AS table_name,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- View active connections
SELECT * FROM pg_stat_activity;

-- Check indexes
SELECT * FROM pg_indexes WHERE tablename = 'users';
```

### Useful Admin Commands
```sql
-- Show all users/roles
\du

-- Show database privileges
\l+

-- Show table privileges
\dp

-- Exit PostgreSQL
\q
```

## 🛠️ Docker-Specific Commands

### Quick one-liner queries
```bash
# Run a single query without entering psql
docker exec translation-platform-db psql -U postgres -d translation_platform_dev -c "SELECT COUNT(*) FROM users;"

# Get all table names
docker exec translation-platform-db psql -U postgres -d translation_platform_dev -c "\dt"

# Export query results to file
docker exec translation-platform-db psql -U postgres -d translation_platform_dev -c "SELECT * FROM users;" > users_data.txt
```

### Backup and Restore
```bash
# Backup entire database
docker exec translation-platform-db pg_dump -U postgres translation_platform_dev > backup.sql

# Backup specific table
docker exec translation-platform-db pg_dump -U postgres -t users translation_platform_dev > users_backup.sql

# Restore from backup
docker exec -i translation-platform-db psql -U postgres translation_platform_dev < backup.sql
```

### Data Export
```bash
# Export to CSV
docker exec translation-platform-db psql -U postgres -d translation_platform_dev -c "COPY users TO STDOUT WITH CSV HEADER" > users.csv

# Export with custom delimiter
docker exec translation-platform-db psql -U postgres -d translation_platform_dev -c "COPY users TO STDOUT WITH (FORMAT CSV, HEADER, DELIMITER '|')" > users.txt
```

## 🎯 Common Scenarios

### Scenario 1: "I want to see if users are being created"
```bash
docker exec translation-platform-db psql -U postgres -d translation_platform_dev -c "SELECT id, username, email, created_at FROM users ORDER BY created_at DESC LIMIT 5;"
```

### Scenario 2: "Check if database is initialized"
```bash
docker exec translation-platform-db psql -U postgres -d translation_platform_dev -c "\dt"
```

### Scenario 3: "View database logs"
```bash
docker-compose logs db
```

### Scenario 4: "Reset database"
```bash
# Stop database
docker-compose down db

# Remove volume (deletes all data!)
docker volume rm website_postgres_data

# Start fresh
docker-compose up -d db
```

## 🔍 GUI Tools (Optional)

### Option 1: pgAdmin (Already in docker-compose)
```bash
# Start pgAdmin
docker-compose --profile dev up -d pgadmin

# Access at: http://localhost:5050
# Email: admin@translation-platform.com
# Password: admin123

# Add server connection:
# Host: db (or host.docker.internal)
# Port: 5432
# Database: translation_platform_dev
# Username: postgres
# Password: password
```

### Option 2: Use local tools
- **DBeaver** (free, cross-platform)
- **TablePlus** (modern, paid)
- **pgAdmin** (official, free)
- **DataGrip** (JetBrains, paid)

Connection settings for any tool:
- Host: localhost
- Port: 5432
- Database: translation_platform_dev
- Username: postgres
- Password: password

## 📝 SQL Cheat Sheet

### Data Types
```sql
-- Common PostgreSQL data types
INTEGER, BIGINT         -- Numbers
VARCHAR(255), TEXT      -- Strings
BOOLEAN                 -- True/False
TIMESTAMP, DATE         -- Date/Time
JSON, JSONB            -- JSON data
UUID                   -- Unique identifiers
```

### Common Operations
```sql
-- Insert data
INSERT INTO users (username, email) 
VALUES ('testuser', 'test@example.com');

-- Update data
UPDATE users 
SET username = 'newname' 
WHERE id = 1;

-- Delete data
DELETE FROM users 
WHERE id = 1;

-- Create table
CREATE TABLE test (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Drop table (careful!)
DROP TABLE test;
```

## ⚡ Quick Tips

1. **Always check before deleting**: Use SELECT first
2. **Use transactions for safety**:
   ```sql
   BEGIN;
   -- your operations
   ROLLBACK; -- or COMMIT;
   ```
3. **Case sensitivity**: PostgreSQL converts unquoted names to lowercase
4. **Use LIMIT**: Always use LIMIT when testing queries
5. **Check execution plan**: Use `EXPLAIN` before slow queries

## 🚨 Troubleshooting

### Can't connect?
```bash
# Check if container is running
docker ps | grep postgres

# Check logs
docker-compose logs db

# Restart database
docker-compose restart db
```

### Permission denied?
```bash
# Connect as superuser
docker exec -it translation-platform-db psql -U postgres
```

### Port already in use?
```bash
# Change port in docker-compose.yml
# From: "5432:5432"
# To: "5433:5432"
# Then connect to port 5433
```

Remember: The database password is `password` (from your .env file) for development!