# Database & Authentication

PostgreSQL database setup and JWT authentication for the Translation Platform.

## Quick Start

```bash
# Setup database with test data
npm run db:setup

# Test connection
npm run db:test

# Start using in code
const db = require('./database/connection');
```

## Structure

- **`schema.sql`** - Complete PostgreSQL schema (7 tables)
- **`connection.js`** - Database connection pool
- **`init.js`** - Test data initialization  
- **`reset.js`** - Database reset utility

## Test Accounts

- `test@example.com` / `test123` (translator)
- `admin@example.com` / `admin123` (admin)
- `demo@example.com` / `demo123` (demo)

## Configuration

Requires in `.env.local`:
```bash
DATABASE_URL=postgresql://username@127.0.0.1:5432/translation_platform
JWT_SECRET=your-secret-key
```

See individual component READMEs for detailed documentation.