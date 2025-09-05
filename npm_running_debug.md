# 🐛 Translation Platform - Quick Start Guide

## 🚀 Start Everything (One Command)

```bash
npm run dev:full    # Starts databases + backend + frontend
```

## 📋 Individual Commands

```bash
# Database management
npm run services:start    # Start PostgreSQL + MongoDB  
npm run services:stop     # Stop databases
npm run ports:clear       # Kill port conflicts

# Services
npm run backend:dev       # Start backend (port 4002)
npm run frontend:dev      # Start frontend (port 3000)

# Testing
npm run test:user         # Create test user
npm run test:upload       # Test file upload
npm run test:translate    # Test quick translation
```

## 🔗 URLs

- **Frontend**: http://localhost:3000
- **GraphQL**: http://localhost:4002/graphql  
- **Health**: http://localhost:4002/health
- **File Upload**: http://localhost:4002/api/files/upload

## 🔧 VS Code Database Connections

**PostgreSQL**: `postgresql://postgres:password@localhost:5432/translation_platform`  
**MongoDB**: `mongodb://localhost:27017/translation_platform_dev`

## 🧪 Test Account

```
Name: Test User
Email: test@example.com
Password: password123
```

## ❌ Common Issues → Solutions

- **"role postgres does not exist"** → Fixed automatically by `npm run services:start`
- **"Port in use"** → Run `npm run ports:clear` first
- **GraphQL empty page** → Use port 4002, not 4000
- **Docker not running** → Start Docker Desktop

⏺ PostgreSQL Migration Debugging Rules

  Common Syntax Errors & Fixes

  1. ON CONFLICT DO NOTHING Error
  ❌ ON CONFLICT DO NOTHING;
  ✅ ON CONFLICT (column_name) DO NOTHING;
  2. CREATE TRIGGER IF NOT EXISTS Not Supported
  ❌ CREATE TRIGGER IF NOT EXISTS my_trigger...
  ✅ DROP TRIGGER IF EXISTS my_trigger ON table_name;
     CREATE TRIGGER my_trigger...
  3. Function Not Found Error
  ❌ Using update_timestamp() before defining it
  ✅ Define functions BEFORE creating triggers that use them
  4. Foreign Key Type Mismatch
  ❌ UUID column → INTEGER column reference
  ✅ Check data types match before adding foreign keys

  Debugging Tips

  - Read the error position: Error position: 4767 tells you exactly where in the SQL
  the error occurs
  - Check constraint names: Use IF NOT EXISTS checks to prevent duplicate constraint
  errors
  - Test incrementally: Comment out sections to isolate which part is failing
  - Use RAISE NOTICE: Add debug messages in DO blocks to see what's happening

  Quick Fix Pattern

  DO $$
  BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                     WHERE constraint_name = 'your_constraint_name') THEN
          -- Your ALTER TABLE statement here
      END IF;
  END $$;

## ✅ What's Fixed

- ✅ Automatic PostgreSQL setup with proper user/database
- ✅ Port conflict resolution  
- ✅ Single command startup
- ✅ File upload service (500MB limit, PDF/DOCX/TXT)
- ✅ Quick translation mode (no file upload needed)
- ✅ Database schema auto-creation