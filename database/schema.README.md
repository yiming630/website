# Database Schema

PostgreSQL schema definition for the Translation Platform.

## Tables Overview

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `users` | User accounts | email, password_hash, user_type |
| `projects` | Translation projects | name, source/target languages |
| `documents` | Document metadata | filename, content, status |
| `translation_jobs` | Processing queue | progress, ai_model, tokens |
| `chat_messages` | AI chat history | role, content, document_id |
| `translation_segments` | Paragraph translations | original/translated text |
| `user_sessions` | JWT tokens | token_hash, expires_at |

## Key Features

- **UUID primary keys** for security
- **Automatic timestamps** with triggers
- **Foreign key constraints** for integrity
- **Performance indexes** on common queries
- **JSONB metadata** for flexibility

## Usage

```bash
# Apply schema to database
psql -d translation_platform -f database/schema.sql

# Reset and recreate
npm run db:reset
```

## Schema Highlights

### User Types
- `translator` - Regular users
- `admin` - Full access
- `viewer` - Read-only

### Document Status Flow
`uploaded` → `processing` → `ready` → `translating` → `completed`

### Translation Job States
`pending` → `running` → `completed` | `failed` | `cancelled`

All tables include `created_at` and `updated_at` timestamps managed automatically by triggers.