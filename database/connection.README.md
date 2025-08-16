# Database Connection Pool

Reusable PostgreSQL connection module with pooling and error handling.

## Usage

```javascript
const db = require('./database/connection');

// Simple query
const users = await db.query('SELECT * FROM users');

// Parameterized query (prevents SQL injection)
const user = await db.query(
  'SELECT * FROM users WHERE email = $1',
  ['test@example.com']
);

// Get client for transactions
const client = await db.getClient();
try {
  await client.query('BEGIN');
  await client.query('INSERT INTO projects ...');
  await client.query('UPDATE documents ...');
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release(); // Always release!
}
```

## Features

- **Connection pooling** for performance (max 20 connections)
- **Automatic reconnection** on connection loss
- **Query logging** in development mode
- **Health checks** with `testConnection()`
- **Graceful shutdown** on process termination

## Methods

| Method | Purpose | Returns |
|--------|---------|---------|
| `query(text, params)` | Execute query | Query result |
| `getClient()` | Get pooled client | Database client |
| `testConnection()` | Health check | Boolean |
| `getPoolStats()` | Pool statistics | Stats object |
| `shutdown()` | Close all connections | Promise |

## Configuration

Environment variables:
```bash
DATABASE_URL=postgresql://user@host:port/database
DB_MAX_CONNECTIONS=20
DB_IDLE_TIMEOUT=10000
```

## Error Handling

- Logs all database errors with context
- Warns about slow queries (>100ms)
- Graceful handling of connection failures
- Pool event logging in development mode