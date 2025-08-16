# Security Best Practices Guide

## 1. Authentication & Authorization

### JWT Token Security

#### Secure Token Generation
```javascript
// services/user-service/src/utils/jwt.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class JWTManager {
  constructor() {
    // Use strong, random secrets
    this.accessSecret = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
    this.refreshSecret = process.env.JWT_REFRESH_SECRET || crypto.randomBytes(64).toString('hex');
  }

  generateTokenPair(user) {
    const payload = {
      id: user.id,
      email: user.email,
      roles: user.roles || ['user'],
      iat: Math.floor(Date.now() / 1000),
    };

    // Short-lived access token (15 minutes)
    const accessToken = jwt.sign(payload, this.accessSecret, {
      expiresIn: '15m',
      issuer: 'translation-platform',
      audience: 'translation-platform-users',
    });

    // Long-lived refresh token (7 days)
    const refreshToken = jwt.sign(
      { id: user.id, type: 'refresh' },
      this.refreshSecret,
      {
        expiresIn: '7d',
        issuer: 'translation-platform',
        audience: 'translation-platform-users',
      }
    );

    return { accessToken, refreshToken };
  }

  verifyToken(token, type = 'access') {
    const secret = type === 'access' ? this.accessSecret : this.refreshSecret;
    
    try {
      return jwt.verify(token, secret, {
        issuer: 'translation-platform',
        audience: 'translation-platform-users',
      });
    } catch (error) {
      throw new Error(`Invalid ${type} token`);
    }
  }
}

module.exports = new JWTManager();
```

#### Secure Cookie Configuration
```javascript
// services/api-gateway/src/middleware/auth.js
const cookieOptions = {
  httpOnly: true, // Prevent XSS attacks
  secure: process.env.NODE_ENV === 'production', // HTTPS only in production
  sameSite: 'strict', // CSRF protection
  maxAge: 15 * 60 * 1000, // 15 minutes
  path: '/',
};

// Set secure cookie
res.cookie('accessToken', token, cookieOptions);

// For refresh tokens, use separate cookie with longer expiry
const refreshCookieOptions = {
  ...cookieOptions,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  httpOnly: true,
  path: '/auth/refresh', // Limit scope
};

res.cookie('refreshToken', refreshToken, refreshCookieOptions);
```

#### Role-Based Access Control (RBAC)
```javascript
// services/api-gateway/src/middleware/rbac.js
const roles = {
  ADMIN: ['read', 'write', 'delete', 'manage_users'],
  TRANSLATOR: ['read', 'write', 'translate'],
  REVIEWER: ['read', 'review', 'approve'],
  USER: ['read'],
};

const checkPermission = (userRoles, requiredPermission) => {
  return userRoles.some(role => 
    roles[role] && roles[role].includes(requiredPermission)
  );
};

const requirePermission = (permission) => {
  return (req, res, next) => {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!checkPermission(user.roles, permission)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// Usage in resolvers
const documentResolvers = {
  Mutation: {
    deleteDocument: [
      requirePermission('delete'),
      async (_, { id }, context) => {
        // Delete logic
      }
    ],
  },
};
```

### Password Security

#### Secure Password Hashing
```javascript
// services/user-service/src/utils/password.js
const bcrypt = require('bcrypt');
const zxcvbn = require('zxcvbn'); // Password strength estimation

class PasswordManager {
  constructor() {
    this.saltRounds = 12; // Higher rounds for better security
  }

  async hashPassword(password) {
    // Check password strength
    const strength = zxcvbn(password);
    if (strength.score < 3) {
      throw new Error('Password is too weak. Please use a stronger password.');
    }

    return await bcrypt.hash(password, this.saltRounds);
  }

  async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  generateSecurePassword(length = 16) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    return password;
  }

  validatePassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*]/.test(password);

    const errors = [];
    
    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters long`);
    }
    if (!hasUpperCase) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!hasLowerCase) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!hasNumbers) {
      errors.push('Password must contain at least one number');
    }
    if (!hasSpecialChar) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
      strength: zxcvbn(password).score,
    };
  }
}

module.exports = new PasswordManager();
```

## 2. Input Validation & Sanitization

### GraphQL Input Validation
```javascript
// services/api-gateway/src/validation/schemas.js
const Joi = require('joi');

const schemas = {
  createDocument: Joi.object({
    title: Joi.string()
      .min(1)
      .max(200)
      .trim()
      .required()
      .pattern(/^[a-zA-Z0-9\s\-_.]+$/) // Alphanumeric with safe chars only
      .messages({
        'string.pattern.base': 'Title contains invalid characters',
      }),
    
    content: Joi.string()
      .max(100000) // Limit content size
      .required(),
    
    sourceLanguage: Joi.string()
      .valid('EN', 'ES', 'FR', 'DE', 'IT', 'PT') // Whitelist
      .required(),
    
    targetLanguage: Joi.string()
      .valid('EN', 'ES', 'FR', 'DE', 'IT', 'PT')
      .required(),
  }),

  userRegistration: Joi.object({
    email: Joi.string()
      .email()
      .max(254)
      .lowercase()
      .required(),
    
    fullName: Joi.string()
      .min(2)
      .max(100)
      .trim()
      .pattern(/^[a-zA-Z\s]+$/) // Letters and spaces only
      .required(),
    
    password: Joi.string()
      .min(8)
      .max(128)
      .required(),
  }),
};

const validateInput = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true, // Remove unknown properties
    });

    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(detail => detail.message),
      });
    }

    req.body = value; // Use sanitized values
    next();
  };
};

module.exports = { schemas, validateInput };
```

### HTML Sanitization
```javascript
// services/api-gateway/src/utils/sanitizer.js
const DOMPurify = require('isomorphic-dompurify');
const validator = require('validator');

class ContentSanitizer {
  sanitizeHTML(html) {
    // Configure DOMPurify for rich text content
    const cleanHTML = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote'
      ],
      ALLOWED_ATTR: ['class'],
      ALLOW_DATA_ATTR: false,
    });

    return cleanHTML;
  }

  sanitizeText(text) {
    // Remove potentially dangerous characters
    return validator.escape(text.trim());
  }

  sanitizeEmail(email) {
    const normalized = validator.normalizeEmail(email);
    if (!validator.isEmail(normalized)) {
      throw new Error('Invalid email format');
    }
    return normalized;
  }

  sanitizeURL(url) {
    if (!validator.isURL(url, {
      protocols: ['http', 'https'],
      require_protocol: true,
    })) {
      throw new Error('Invalid URL format');
    }
    return url;
  }
}

module.exports = new ContentSanitizer();
```

## 3. Database Security

### SQL Injection Prevention
```javascript
// services/user-service/src/repositories/userRepository.js
const { pool } = require('../utils/database');

class UserRepository {
  // GOOD: Using parameterized queries
  async getUserByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  // GOOD: Using parameterized queries with multiple parameters
  async searchUsers(searchTerm, limit = 10, offset = 0) {
    const query = `
      SELECT id, email, full_name 
      FROM users 
      WHERE 
        (full_name ILIKE $1 OR email ILIKE $1)
        AND deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const searchPattern = `%${searchTerm}%`;
    const result = await pool.query(query, [searchPattern, limit, offset]);
    return result.rows;
  }

  // BAD: Never do this - SQL injection vulnerability
  // async getUserByEmailBad(email) {
  //   const query = `SELECT * FROM users WHERE email = '${email}'`;
  //   const result = await pool.query(query);
  //   return result.rows[0];
  // }
}
```

### Database Connection Security
```javascript
// services/user-service/src/utils/database.js
const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  
  // Security configurations
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: true,
    ca: fs.readFileSync('/path/to/ca-certificate.crt').toString(),
  } : false,
  
  // Connection limits
  max: 10, // Maximum number of clients
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  
  // Statement timeout to prevent long-running queries
  statement_timeout: 30000, // 30 seconds
});

// Row-level security helper
async function enableRLS() {
  await pool.query('ALTER TABLE documents ENABLE ROW LEVEL SECURITY');
  await pool.query(`
    CREATE POLICY document_access_policy ON documents
    FOR ALL
    TO application_role
    USING (user_id = current_setting('app.current_user_id')::uuid)
  `);
}

module.exports = { pool, enableRLS };
```

## 4. API Security

### Rate Limiting
```javascript
// services/api-gateway/src/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
});

// Different limits for different endpoints
const createRateLimiter = (options) => {
  return rateLimit({
    store: new RedisStore({
      client: redis,
      prefix: 'rl:',
    }),
    windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes
    max: options.max || 100,
    message: {
      error: 'Too many requests',
      retryAfter: Math.ceil(options.windowMs / 1000),
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      return req.user?.id || req.ip;
    },
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === '/health';
    },
  });
};

// Export different limiters
module.exports = {
  general: createRateLimiter({ max: 100, windowMs: 15 * 60 * 1000 }),
  auth: createRateLimiter({ max: 5, windowMs: 15 * 60 * 1000 }),
  upload: createRateLimiter({ max: 10, windowMs: 60 * 60 * 1000 }),
  ai: createRateLimiter({ max: 50, windowMs: 60 * 60 * 1000 }),
};
```

### CORS Configuration
```javascript
// services/api-gateway/src/middleware/cors.js
const cors = require('cors');

const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:3000', // Development
      'https://translation-platform.com', // Production
      'https://app.translation-platform.com', // Production app
    ];

    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  
  credentials: true, // Allow cookies
  
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-CSRF-Token',
  ],
  
  exposedHeaders: ['X-Total-Count'],
  
  maxAge: 86400, // 24 hours
};

module.exports = cors(corsOptions);
```

### Content Security Policy (CSP)
```javascript
// frontend/web-app/middleware.ts
import { NextResponse } from 'next/server';

export function middleware(request) {
  const response = NextResponse.next();

  // Content Security Policy
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdnjs.cloudflare.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' blob: data: https:;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' ${process.env.NEXT_PUBLIC_API_URL} wss:;
    media-src 'self';
    object-src 'none';
    child-src 'self';
    worker-src 'self';
    frame-ancestors 'none';
    form-action 'self';
    base-uri 'self';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();

  response.headers.set('Content-Security-Policy', cspHeader);
  
  // Other security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // HSTS (only in production)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  return response;
}
```

## 5. File Upload Security

### Secure File Upload
```javascript
// services/api-gateway/src/middleware/fileUpload.js
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const sharp = require('sharp'); // For image processing

// File type validation
const allowedMimeTypes = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/jpeg',
  'image/png',
];

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

// Generate secure filename
const generateSecureFilename = (originalname) => {
  const extension = path.extname(originalname);
  const basename = path.basename(originalname, extension);
  const timestamp = Date.now();
  const randomBytes = crypto.randomBytes(8).toString('hex');
  
  // Sanitize basename
  const sanitizedBasename = basename
    .replace(/[^a-zA-Z0-9\-_]/g, '')
    .substring(0, 50);
  
  return `${sanitizedBasename}_${timestamp}_${randomBytes}${extension}`;
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Store in secure directory outside web root
    cb(null, '/secure/uploads');
  },
  filename: (req, file, cb) => {
    cb(null, generateSecureFilename(file.originalname));
  },
});

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1,
  },
});

// Virus scanning middleware (integrate with ClamAV)
const virusScanning = async (req, res, next) => {
  if (!req.file) return next();

  try {
    // Implement virus scanning logic here
    // const isClean = await scanFile(req.file.path);
    // if (!isClean) {
    //   throw new Error('File failed virus scan');
    // }
    next();
  } catch (error) {
    // Delete uploaded file
    require('fs').unlinkSync(req.file.path);
    res.status(400).json({ error: 'File upload failed security check' });
  }
};

module.exports = { upload, virusScanning };
```

## 6. Environment Security

### Environment Variables Management
```bash
# .env.example - Safe to commit
NODE_ENV=development
API_GATEWAY_PORT=4000
USER_SVC_PORT=4001

# Database (use secure values in production)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=CHANGE_THIS_IN_PRODUCTION
POSTGRES_DB=translation_platform

# JWT Secrets (generate strong secrets)
JWT_SECRET=GENERATE_STRONG_SECRET_512_BITS
JWT_REFRESH_SECRET=GENERATE_DIFFERENT_STRONG_SECRET

# Third-party APIs
GEMINI_API_KEY=ENTER_YOUR_API_KEY
SENDGRID_API_KEY=ENTER_YOUR_API_KEY

# Security
BCRYPT_ROUNDS=12
SESSION_SECRET=GENERATE_SESSION_SECRET
COOKIE_SECRET=GENERATE_COOKIE_SECRET
```

```javascript
// config/validateEnv.js
const requiredEnvVars = [
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'POSTGRES_PASSWORD',
  'SESSION_SECRET',
];

const validateEnvironment = () => {
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing);
    process.exit(1);
  }

  // Validate secret strength
  const minSecretLength = 32;
  const secrets = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'SESSION_SECRET'];
  
  secrets.forEach(secret => {
    if (process.env[secret].length < minSecretLength) {
      console.error(`${secret} must be at least ${minSecretLength} characters`);
      process.exit(1);
    }
  });
};

module.exports = { validateEnvironment };
```

## 7. Frontend Security

### XSS Prevention
```typescript
// frontend/web-app/utils/sanitizer.ts
import DOMPurify from 'dompurify';

export const sanitizeHTML = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li'],
    ALLOWED_ATTR: [],
  });
};

export const escapeHTML = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

// Safe component for rendering user content
interface SafeHTMLProps {
  html: string;
  className?: string;
}

export const SafeHTML: React.FC<SafeHTMLProps> = ({ html, className }) => {
  const sanitizedHTML = sanitizeHTML(html);
  
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
    />
  );
};
```

### Secure Local Storage
```typescript
// frontend/web-app/utils/secureStorage.ts
import CryptoJS from 'crypto-js';

class SecureStorage {
  private encryptionKey: string;

  constructor() {
    // Generate or retrieve encryption key
    this.encryptionKey = this.getOrCreateEncryptionKey();
  }

  private getOrCreateEncryptionKey(): string {
    let key = localStorage.getItem('_ek');
    if (!key) {
      key = CryptoJS.lib.WordArray.random(256/8).toString();
      localStorage.setItem('_ek', key);
    }
    return key;
  }

  setItem(key: string, value: any): void {
    try {
      const stringValue = JSON.stringify(value);
      const encrypted = CryptoJS.AES.encrypt(stringValue, this.encryptionKey).toString();
      localStorage.setItem(key, encrypted);
    } catch (error) {
      console.error('Failed to store encrypted data:', error);
    }
  }

  getItem<T>(key: string): T | null {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;

      const decrypted = CryptoJS.AES.decrypt(encrypted, this.encryptionKey);
      const stringValue = decrypted.toString(CryptoJS.enc.Utf8);
      
      return JSON.parse(stringValue);
    } catch (error) {
      console.error('Failed to retrieve encrypted data:', error);
      return null;
    }
  }

  removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  clear(): void {
    // Only remove our encrypted items
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key !== '_ek') { // Don't remove encryption key
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }
}

export const secureStorage = new SecureStorage();
```

## 8. Security Monitoring

### Audit Logging
```javascript
// services/api-gateway/src/middleware/auditLogger.js
const winston = require('winston');

const auditLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: '/var/log/audit.log' }),
    new winston.transports.Console()
  ],
});

const logSecurityEvent = (req, eventType, details = {}) => {
  auditLogger.info({
    eventType,
    userId: req.user?.id,
    userEmail: req.user?.email,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    ...details,
  });
};

const auditMiddleware = (req, res, next) => {
  // Log sensitive operations
  const sensitiveRoutes = ['/auth', '/admin', '/delete'];
  const isSensitive = sensitiveRoutes.some(route => req.path.includes(route));

  if (isSensitive) {
    logSecurityEvent(req, 'SENSITIVE_OPERATION', {
      method: req.method,
      path: req.path,
      body: req.method === 'POST' ? 'REDACTED' : undefined,
    });
  }

  next();
};

module.exports = { auditLogger, logSecurityEvent, auditMiddleware };
```

### Security Headers Monitoring
```javascript
// services/api-gateway/src/middleware/securityHeaders.js
const helmet = require('helmet');

const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable if needed for compatibility
});

module.exports = securityHeaders;
```

## 9. Security Checklist

### Development Security Checklist
- [ ] All secrets stored in environment variables
- [ ] Strong password policies implemented
- [ ] JWT tokens have appropriate expiration times
- [ ] All user inputs validated and sanitized
- [ ] SQL injection prevention with parameterized queries
- [ ] XSS prevention with output encoding
- [ ] CORS properly configured
- [ ] Rate limiting implemented
- [ ] File upload restrictions in place
- [ ] Security headers configured
- [ ] Audit logging implemented
- [ ] Error messages don't leak sensitive information

### Production Security Checklist
- [ ] HTTPS enabled with valid certificates
- [ ] Database connections encrypted
- [ ] Secrets managed with proper secret management service
- [ ] Security monitoring and alerting configured
- [ ] Regular security scans scheduled
- [ ] Backup encryption enabled
- [ ] Access logs reviewed regularly
- [ ] Dependency vulnerability scanning enabled
- [ ] Security incident response plan documented
- [ ] Regular security audits conducted

### Code Review Security Focus
- [ ] No hardcoded secrets or credentials
- [ ] Input validation on all user inputs
- [ ] Proper error handling without information leakage
- [ ] Authorization checks on all protected resources
- [ ] Secure random number generation
- [ ] Protection against common OWASP Top 10 vulnerabilities
- [ ] Secure file handling
- [ ] Proper session management
- [ ] Protection against CSRF attacks
- [ ] Secure communication between services