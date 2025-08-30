# Authentication Middleware

JWT-based authentication system for GraphQL API.

## Components

- **`context.js`** - GraphQL context with authentication

## How It Works

1. **Extract JWT token** from Authorization header
2. **Verify token** using JWT_SECRET
3. **Load user data** from database
4. **Provide auth helpers** to resolvers

## Usage in Resolvers

```javascript
// Public resolver (no auth required)
const publicData = async (_, __, { db }) => {
  return await db.query('SELECT * FROM public_data');
};

// Protected resolver (auth required)
const userData = async (_, __, { requireAuth, db }) => {
  const user = requireAuth(); // Throws if not authenticated
  return await db.query('SELECT * FROM user_data WHERE user_id = $1', [user.id]);
};

// Admin-only resolver
const adminData = async (_, __, { requireAdmin, db }) => {
  const user = requireAdmin(); // Throws if not admin
  return await db.query('SELECT * FROM admin_data');
};
```

## Context Properties

| Property | Type | Description |
|----------|------|-------------|
| `user` | Object\|null | Current authenticated user |
| `db` | Object | Database connection |
| `req` | Object | Express request object |
| `requireAuth()` | Function | Throws if not authenticated |
| `requireAdmin()` | Function | Throws if not admin |

## Authentication Flow

```
Client Request → JWT Token → Token Verification → User Loading → GraphQL Context
```

## Error Handling

- Invalid tokens return `null` user (silent failure)
- `requireAuth()` throws "Authentication required"
- `requireAdmin()` throws "Admin access required"
- Development mode logs token validation errors