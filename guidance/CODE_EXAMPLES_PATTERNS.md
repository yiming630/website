# Code Examples and Design Patterns

## 1. Frontend Code Examples

### Component Structure Pattern
```typescript
// File: /frontend/web-app/components/translate-editor/EditorSection.tsx

import React, { useState, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

interface EditorSectionProps {
  documentId: string;
  content: string;
  onSave: (content: string) => Promise<void>;
  isReadOnly?: boolean;
}

export const EditorSection: React.FC<EditorSectionProps> = ({
  documentId,
  content,
  onSave,
  isReadOnly = false
}) => {
  const [localContent, setLocalContent] = useState(content);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Memoized computation
  const wordCount = useMemo(() => {
    return localContent.split(/\s+/).filter(word => word.length > 0).length;
  }, [localContent]);

  // Callback with error handling
  const handleSave = useCallback(async () => {
    try {
      setIsSaving(true);
      await onSave(localContent);
      toast({
        title: "Success",
        description: "Document saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save document",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [localContent, onSave, toast]);

  return (
    <div className="editor-section">
      <textarea
        value={localContent}
        onChange={(e) => setLocalContent(e.target.value)}
        disabled={isReadOnly}
        className="w-full h-96 p-4 border rounded-lg"
      />
      <div className="flex justify-between mt-4">
        <span>Words: {wordCount}</span>
        <Button onClick={handleSave} disabled={isSaving || isReadOnly}>
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  );
};
```

### Custom Hook Pattern
```typescript
// File: /frontend/web-app/hooks/useDocument.ts

import { useState, useEffect } from 'react';
import { documentService } from '@/services/documentService';

interface Document {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

interface UseDocumentReturn {
  document: Document | null;
  loading: boolean;
  error: Error | null;
  updateDocument: (updates: Partial<Document>) => Promise<void>;
  deleteDocument: () => Promise<void>;
}

export function useDocument(documentId: string): UseDocumentReturn {
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        setLoading(true);
        const data = await documentService.getDocument(documentId);
        setDocument(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [documentId]);

  const updateDocument = async (updates: Partial<Document>) => {
    if (!document) return;
    
    try {
      const updated = await documentService.updateDocument(documentId, updates);
      setDocument(updated);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const deleteDocument = async () => {
    try {
      await documentService.deleteDocument(documentId);
      setDocument(null);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  return {
    document,
    loading,
    error,
    updateDocument,
    deleteDocument,
  };
}
```

### Context Provider Pattern
```typescript
// File: /frontend/web-app/context/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  name: string;
  roles: string[];
}

interface AuthContextValue {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for existing session
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/verify');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const userData = await response.json();
    setUser(userData);
    router.push('/dashboard');
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

## 2. Backend Code Examples

### GraphQL Resolver Pattern
```javascript
// File: /services/api-gateway/src/resolvers/documentResolvers.js

const { AuthenticationError, UserInputError } = require('apollo-server-express');
const { checkAuth } = require('../middleware/auth');
const documentService = require('../services/documentService');

const documentResolvers = {
  Query: {
    // Get single document
    document: async (_, { id }, context) => {
      const user = checkAuth(context);
      
      try {
        const document = await documentService.getDocument(id, user.id);
        if (!document) {
          throw new UserInputError('Document not found');
        }
        return document;
      } catch (error) {
        console.error('Error fetching document:', error);
        throw error;
      }
    },

    // Get all user documents with pagination
    documents: async (_, { page = 1, limit = 10, filter }, context) => {
      const user = checkAuth(context);
      
      try {
        const offset = (page - 1) * limit;
        const { documents, total } = await documentService.getUserDocuments(
          user.id,
          { offset, limit, filter }
        );

        return {
          documents,
          pageInfo: {
            page,
            limit,
            total,
            hasNextPage: offset + limit < total,
            hasPrevPage: page > 1,
          },
        };
      } catch (error) {
        console.error('Error fetching documents:', error);
        throw error;
      }
    },
  },

  Mutation: {
    // Create new document
    createDocument: async (_, { input }, context) => {
      const user = checkAuth(context);
      
      // Validate input
      if (!input.title || !input.content) {
        throw new UserInputError('Title and content are required');
      }

      try {
        const document = await documentService.createDocument({
          ...input,
          userId: user.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // Publish event for real-time updates
        context.pubsub.publish('DOCUMENT_CREATED', {
          documentCreated: document,
          userId: user.id,
        });

        return document;
      } catch (error) {
        console.error('Error creating document:', error);
        throw error;
      }
    },

    // Update document
    updateDocument: async (_, { id, input }, context) => {
      const user = checkAuth(context);
      
      try {
        // Check ownership
        const existing = await documentService.getDocument(id, user.id);
        if (!existing) {
          throw new AuthenticationError('Not authorized to update this document');
        }

        const updated = await documentService.updateDocument(id, {
          ...input,
          updatedAt: new Date(),
        });

        // Publish event for real-time updates
        context.pubsub.publish('DOCUMENT_UPDATED', {
          documentUpdated: updated,
          userId: user.id,
        });

        return updated;
      } catch (error) {
        console.error('Error updating document:', error);
        throw error;
      }
    },
  },

  Subscription: {
    // Real-time document updates
    documentUpdated: {
      subscribe: (_, { documentId }, context) => {
        const user = checkAuth(context);
        return context.pubsub.asyncIterator(['DOCUMENT_UPDATED']);
      },
      filter: (payload, variables) => {
        return payload.documentUpdated.id === variables.documentId;
      },
    },
  },

  // Field resolvers
  Document: {
    // Resolve author field
    author: async (document, _, context) => {
      return context.dataloaders.userLoader.load(document.userId);
    },
    
    // Resolve translations field
    translations: async (document, _, context) => {
      return context.dataloaders.translationLoader.load(document.id);
    },
    
    // Compute word count
    wordCount: (document) => {
      return document.content.split(/\s+/).filter(word => word.length > 0).length;
    },
  },
};

module.exports = documentResolvers;
```

### Service Layer Pattern
```javascript
// File: /services/user-service/src/services/userService.js

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../utils/database');
const { ValidationError, AuthenticationError } = require('../utils/errors');

class UserService {
  // Create new user
  async createUser({ email, password, fullName }) {
    // Validate input
    this.validateEmail(email);
    this.validatePassword(password);

    // Check if user exists
    const existingUser = await this.getUserByEmail(email);
    if (existingUser) {
      throw new ValidationError('User already exists');
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert user
    const query = `
      INSERT INTO users (email, password_hash, full_name, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      RETURNING id, email, full_name, created_at
    `;

    try {
      const result = await pool.query(query, [email, hashedPassword, fullName]);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  // Authenticate user
  async authenticateUser(email, password) {
    const user = await this.getUserByEmail(email);
    if (!user) {
      throw new AuthenticationError('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      throw new AuthenticationError('Invalid credentials');
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // Store refresh token
    await this.storeRefreshToken(user.id, refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
      },
      accessToken,
      refreshToken,
    };
  }

  // Get user by email
  async getUserByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  // Get user by ID
  async getUserById(id) {
    const query = 'SELECT id, email, full_name, created_at FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Generate access token
  generateAccessToken(user) {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '1h',
      }
    );
  }

  // Generate refresh token
  generateRefreshToken(user) {
    return jwt.sign(
      {
        id: user.id,
        type: 'refresh',
      },
      process.env.JWT_REFRESH_SECRET,
      {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      }
    );
  }

  // Store refresh token
  async storeRefreshToken(userId, token) {
    const query = `
      INSERT INTO refresh_tokens (user_id, token, expires_at)
      VALUES ($1, $2, NOW() + INTERVAL '7 days')
      ON CONFLICT (user_id) DO UPDATE
      SET token = $2, expires_at = NOW() + INTERVAL '7 days'
    `;
    await pool.query(query, [userId, token]);
  }

  // Validate email format
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError('Invalid email format');
    }
  }

  // Validate password strength
  validatePassword(password) {
    if (password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters');
    }
    // Add more validation rules as needed
  }
}

module.exports = new UserService();
```

### Database Connection Pattern
```javascript
// File: /services/user-service/src/utils/database.js

const { Pool } = require('pg');

// Create connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'translation_platform',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle
  connectionTimeoutMillis: 2000, // How long to wait for a connection
});

// Error handling
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Transaction helper
async function withTransaction(callback) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Query helper with logging
async function query(text, params) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    if (process.env.LOG_QUERIES === 'true') {
      console.log('Query executed', {
        text,
        duration,
        rows: result.rowCount,
      });
    }
    
    return result;
  } catch (error) {
    console.error('Query error', { text, error });
    throw error;
  }
}

module.exports = {
  pool,
  query,
  withTransaction,
};
```

## 3. Design Patterns

### Repository Pattern
```javascript
// File: /services/api-gateway/src/repositories/documentRepository.js

class DocumentRepository {
  constructor(database) {
    this.db = database;
  }

  async findById(id) {
    const query = 'SELECT * FROM documents WHERE id = $1';
    const result = await this.db.query(query, [id]);
    return result.rows[0];
  }

  async findByUserId(userId, options = {}) {
    const { limit = 10, offset = 0, orderBy = 'created_at DESC' } = options;
    
    const query = `
      SELECT * FROM documents 
      WHERE user_id = $1 
      ORDER BY ${orderBy}
      LIMIT $2 OFFSET $3
    `;
    
    const result = await this.db.query(query, [userId, limit, offset]);
    return result.rows;
  }

  async create(document) {
    const query = `
      INSERT INTO documents (title, content, user_id, project_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING *
    `;
    
    const values = [
      document.title,
      document.content,
      document.userId,
      document.projectId,
    ];
    
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async update(id, updates) {
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    
    const setClause = fields
      .map((field, index) => `${field} = $${index + 2}`)
      .join(', ');
    
    const query = `
      UPDATE documents 
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await this.db.query(query, [id, ...values]);
    return result.rows[0];
  }

  async delete(id) {
    const query = 'DELETE FROM documents WHERE id = $1 RETURNING *';
    const result = await this.db.query(query, [id]);
    return result.rows[0];
  }

  async count(criteria = {}) {
    let query = 'SELECT COUNT(*) FROM documents';
    const values = [];
    
    if (Object.keys(criteria).length > 0) {
      const conditions = Object.keys(criteria)
        .map((key, index) => `${key} = $${index + 1}`)
        .join(' AND ');
      
      query += ` WHERE ${conditions}`;
      values.push(...Object.values(criteria));
    }
    
    const result = await this.db.query(query, values);
    return parseInt(result.rows[0].count, 10);
  }
}

module.exports = DocumentRepository;
```

### Factory Pattern
```javascript
// File: /services/api-gateway/src/factories/serviceFactory.js

class ServiceFactory {
  constructor() {
    this.services = new Map();
  }

  register(name, factory) {
    this.services.set(name, factory);
  }

  create(name, ...args) {
    const factory = this.services.get(name);
    if (!factory) {
      throw new Error(`Service ${name} not registered`);
    }
    return factory(...args);
  }
}

// Usage
const serviceFactory = new ServiceFactory();

// Register services
serviceFactory.register('email', (config) => {
  const EmailService = require('./services/emailService');
  return new EmailService(config);
});

serviceFactory.register('storage', (config) => {
  const StorageService = require('./services/storageService');
  return new StorageService(config);
});

serviceFactory.register('ai', (config) => {
  const AIService = require('./services/aiService');
  return new AIService(config);
});

// Create services
const emailService = serviceFactory.create('email', { provider: 'sendgrid' });
const storageService = serviceFactory.create('storage', { provider: 's3' });
const aiService = serviceFactory.create('ai', { provider: 'gemini' });

module.exports = serviceFactory;
```

### Singleton Pattern
```javascript
// File: /services/api-gateway/src/utils/cache.js

class CacheManager {
  constructor() {
    if (CacheManager.instance) {
      return CacheManager.instance;
    }

    this.redis = null;
    this.connected = false;
    CacheManager.instance = this;
  }

  async connect() {
    if (this.connected) return;

    const Redis = require('ioredis');
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.redis.on('connect', () => {
      console.log('Redis connected');
      this.connected = true;
    });

    this.redis.on('error', (error) => {
      console.error('Redis error:', error);
    });
  }

  async get(key) {
    if (!this.connected) await this.connect();
    const value = await this.redis.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set(key, value, ttl = 3600) {
    if (!this.connected) await this.connect();
    await this.redis.set(key, JSON.stringify(value), 'EX', ttl);
  }

  async delete(key) {
    if (!this.connected) await this.connect();
    await this.redis.del(key);
  }

  async flush() {
    if (!this.connected) await this.connect();
    await this.redis.flushdb();
  }
}

module.exports = new CacheManager();
```

### Observer Pattern
```javascript
// File: /services/api-gateway/src/utils/eventEmitter.js

class EventEmitter {
  constructor() {
    this.events = {};
  }

  on(event, listener) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  off(event, listenerToRemove) {
    if (!this.events[event]) return;
    
    this.events[event] = this.events[event].filter(
      listener => listener !== listenerToRemove
    );
  }

  emit(event, data) {
    if (!this.events[event]) return;
    
    this.events[event].forEach(listener => listener(data));
  }
}

// Usage for document events
const documentEvents = new EventEmitter();

// Subscribe to events
documentEvents.on('document.created', async (document) => {
  console.log('Document created:', document.id);
  // Send notification
  await notificationService.send({
    type: 'document_created',
    userId: document.userId,
    data: document,
  });
});

documentEvents.on('document.updated', async (document) => {
  console.log('Document updated:', document.id);
  // Clear cache
  await cacheManager.delete(`document:${document.id}`);
});

documentEvents.on('document.deleted', async (document) => {
  console.log('Document deleted:', document.id);
  // Clean up related data
  await translationService.deleteByDocumentId(document.id);
});

// Emit events
documentEvents.emit('document.created', newDocument);
documentEvents.emit('document.updated', updatedDocument);
documentEvents.emit('document.deleted', deletedDocument);

module.exports = documentEvents;
```