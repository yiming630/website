# Authentication Utilities

JWT token management and password security utilities.

## Components

- **`auth.js`** - JWT and password utilities

## Functions

### JWT Management

```javascript
const { generateToken, verifyToken } = require('./auth');

// Generate token for user
const token = generateToken(userId);

// Verify token
try {
  const decoded = verifyToken(token);
  console.log('User ID:', decoded.userId);
} catch (error) {
  console.log('Invalid token');
}
```

### Password Security

```javascript
const { hashPassword, comparePassword } = require('./auth');

// Hash password for storage
const hash = await hashPassword('userPassword123');

// Verify password during login
const isValid = await comparePassword('userPassword123', hash);
```

## Security Features

- **bcryptjs hashing** with 10 salt rounds
- **JWT signing** with configurable expiration
- **Secure comparison** to prevent timing attacks
- **Environment-based secrets** for production security

## Configuration

Requires environment variables:
```bash
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d  # Optional, defaults to 7 days
```

## Best Practices

- Never store passwords in plaintext
- Use strong, random JWT secrets in production
- Set appropriate token expiration times
- Rotate JWT secrets periodically
- Use HTTPS in production to protect tokens in transit