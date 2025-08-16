# Performance Optimization Guide

## Overview

This guide covers performance optimization strategies for the Translation Platform, from frontend rendering to database queries and infrastructure scaling.

## 1. Frontend Performance Optimization

### React Performance

#### Component Optimization
```typescript
// Memoization to prevent unnecessary re-renders
import React, { memo, useMemo, useCallback } from 'react';

// Memoize expensive calculations
const TranslationEditor = memo(({ document, onSave }) => {
  const wordCount = useMemo(() => {
    return document.content.split(/\s+/).filter(word => word.length > 0).length;
  }, [document.content]);

  // Memoize callbacks to prevent child re-renders
  const handleTextChange = useCallback((newText) => {
    onSave({ ...document, content: newText });
  }, [document, onSave]);

  return (
    <div>
      <textarea onChange={handleTextChange} value={document.content} />
      <div>Words: {wordCount}</div>
    </div>
  );
});

// Custom hook for debounced updates
const useDebouncedSave = (saveFunction, delay = 1000) => {
  const timeoutRef = useRef(null);

  return useCallback((data) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      saveFunction(data);
    }, delay);
  }, [saveFunction, delay]);
};
```

#### Virtual Scrolling for Large Lists
```typescript
// components/VirtualDocumentList.tsx
import { FixedSizeList as List } from 'react-window';

interface VirtualDocumentListProps {
  documents: Document[];
  onDocumentClick: (document: Document) => void;
}

const DocumentItem = memo(({ index, style, data }) => (
  <div style={style} onClick={() => data.onDocumentClick(data.documents[index])}>
    <h3>{data.documents[index].title}</h3>
    <p>{data.documents[index].wordCount} words</p>
  </div>
));

export const VirtualDocumentList: React.FC<VirtualDocumentListProps> = ({
  documents,
  onDocumentClick
}) => {
  return (
    <List
      height={600}
      itemCount={documents.length}
      itemSize={100}
      itemData={{ documents, onDocumentClick }}
    >
      {DocumentItem}
    </List>
  );
};
```

#### Code Splitting and Lazy Loading
```typescript
// App.tsx - Route-based code splitting
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

// Lazy load components
const Dashboard = lazy(() => import('./pages/Dashboard'));
const TranslateEditor = lazy(() => import('./pages/TranslateEditor'));
const DocumentList = lazy(() => import('./pages/DocumentList'));

// Loading component
const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

export function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/translate" element={<TranslateEditor />} />
        <Route path="/documents" element={<DocumentList />} />
      </Routes>
    </Suspense>
  );
}

// Component-level code splitting
const HeavyComponent = lazy(() => 
  import('./HeavyComponent').then(module => ({
    default: module.HeavyComponent
  }))
);
```

### Next.js Optimizations

#### Image Optimization
```typescript
// components/OptimizedImage.tsx
import Image from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  priority = false
}) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="relative">
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD//gA7Q1JFQVRPUjogZ2QtanBlZyB2MS4wICh1c2luZyBJSkcgSlBFRyB2ODApLCBxdWFsaXR5ID0gNzUK/9sAQwAIBgYHBgUIBwcHCQkICgwUDQwLCwwZEhMPFB0aHx4dGhwcICQuJyAiLCMcHCg3KSwwMTQ0NB8nOT04MjwuMzQy/9sAQwEJCQkMCwwYDQ0YMiEcITIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIy/8AAEQgAAQABAwEiAAIRAQMRAf/EAB8AAAEFAQEBAQEBAAAAAAAAAAABAgMEBQYHCAkKC//EALUQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+gEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigD/2Q=="
        onLoad={() => setIsLoading(false)}
        className={`transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
      />
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
    </div>
  );
};
```

#### Dynamic Imports and Prefetching
```typescript
// utils/preloader.ts
export const preloadRoute = (route: string) => {
  if (typeof window !== 'undefined') {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = route;
    document.head.appendChild(link);
  }
};

// Preload critical routes on app start
export const preloadCriticalRoutes = () => {
  preloadRoute('/dashboard');
  preloadRoute('/translate');
  preloadRoute('/documents');
};

// Dynamic component loading with retry
export const loadComponentWithRetry = async (
  importFunc: () => Promise<any>,
  retries = 3
): Promise<any> => {
  for (let i = 0; i < retries; i++) {
    try {
      return await importFunc();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
};
```

## 2. API Performance Optimization

### GraphQL Optimization

#### Query Optimization
```javascript
// services/api-gateway/src/resolvers/optimizedResolvers.js
const DataLoader = require('dataloader');

// DataLoader for batching database queries
const createUserLoader = () => new DataLoader(async (userIds) => {
  const query = 'SELECT * FROM users WHERE id = ANY($1)';
  const result = await pool.query(query, [userIds]);
  
  // Return results in the same order as input
  const userMap = new Map(result.rows.map(user => [user.id, user]));
  return userIds.map(id => userMap.get(id) || null);
});

const createDocumentLoader = () => new DataLoader(async (documentIds) => {
  const query = 'SELECT * FROM documents WHERE id = ANY($1)';
  const result = await pool.query(query, [documentIds]);
  
  const documentMap = new Map(result.rows.map(doc => [doc.id, doc]));
  return documentIds.map(id => documentMap.get(id) || null);
});

// Optimized resolvers using DataLoader
const resolvers = {
  Query: {
    documents: async (_, { limit = 10, offset = 0 }, context) => {
      // Use SQL optimization techniques
      const query = `
        SELECT d.*, u.full_name as author_name
        FROM documents d
        LEFT JOIN users u ON d.user_id = u.id
        ORDER BY d.created_at DESC
        LIMIT $1 OFFSET $2
      `;
      
      const result = await pool.query(query, [limit, offset]);
      return result.rows;
    },
  },
  
  Document: {
    author: (document, _, context) => {
      // Use DataLoader instead of individual queries
      return context.dataloaders.userLoader.load(document.user_id);
    },
    
    translations: async (document, _, context) => {
      // Batch load translations
      return context.dataloaders.translationLoader.load(document.id);
    },
  },
};

// Context with DataLoaders
const createContext = (req) => ({
  user: req.user,
  dataloaders: {
    userLoader: createUserLoader(),
    documentLoader: createDocumentLoader(),
    translationLoader: createTranslationLoader(),
  },
});
```

#### Query Complexity Analysis
```javascript
// services/api-gateway/src/middleware/queryComplexity.js
const { createComplexityLimitRule } = require('graphql-query-complexity');

const complexityLimitRule = createComplexityLimitRule(1000, {
  maximumComplexity: 1000,
  variables: {},
  introspection: true,
  scalarCost: 1,
  objectCost: 2,
  listFactor: 10,
  createError: (max, actual) => {
    return new Error(`Query complexity ${actual} exceeds maximum ${max}`);
  },
});

// Field-specific complexity
const typeDefs = `
  type Document {
    id: ID!
    content: String! # complexity: 1
    translations: [Translation!]! # complexity: 10 (list factor)
    author: User! # complexity: 2 (object cost)
  }
`;
```

### Caching Strategies

#### Redis Caching Layer
```javascript
// services/api-gateway/src/cache/redisCache.js
const Redis = require('ioredis');

class CacheManager {
  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => Math.min(times * 50, 2000),
    });
  }

  // Hierarchical cache with tags
  async set(key, value, ttl = 3600, tags = []) {
    const multi = this.redis.multi();
    
    // Store the actual data
    multi.setex(key, ttl, JSON.stringify({
      data: value,
      timestamp: Date.now(),
      tags,
    }));
    
    // Store reverse mapping for tag-based invalidation
    tags.forEach(tag => {
      multi.sadd(`tag:${tag}`, key);
      multi.expire(`tag:${tag}`, ttl);
    });
    
    await multi.exec();
  }

  async get(key) {
    const cached = await this.redis.get(key);
    if (!cached) return null;

    try {
      const parsed = JSON.parse(cached);
      return parsed.data;
    } catch (error) {
      await this.redis.del(key);
      return null;
    }
  }

  // Invalidate by tags
  async invalidateByTag(tag) {
    const keys = await this.redis.smembers(`tag:${tag}`);
    if (keys.length > 0) {
      const multi = this.redis.multi();
      keys.forEach(key => multi.del(key));
      multi.del(`tag:${tag}`);
      await multi.exec();
    }
  }

  // Cache with distributed locking to prevent cache stampede
  async getOrSet(key, fetcher, ttl = 3600, tags = []) {
    // Try to get from cache first
    let value = await this.get(key);
    if (value !== null) return value;

    // Use distributed lock to prevent multiple processes from fetching
    const lockKey = `lock:${key}`;
    const lockValue = `${Date.now()}-${Math.random()}`;
    
    const acquired = await this.redis.set(lockKey, lockValue, 'PX', 5000, 'NX');
    
    if (acquired) {
      try {
        // Double-check cache (may have been set by another process)
        value = await this.get(key);
        if (value !== null) return value;

        // Fetch and cache the data
        value = await fetcher();
        await this.set(key, value, ttl, tags);
        
        return value;
      } finally {
        // Release lock only if we still own it
        const script = `
          if redis.call("get", KEYS[1]) == ARGV[1] then
            return redis.call("del", KEYS[1])
          else
            return 0
          end
        `;
        await this.redis.eval(script, 1, lockKey, lockValue);
      }
    } else {
      // Wait for lock to be released and try again
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.getOrSet(key, fetcher, ttl, tags);
    }
  }
}

module.exports = new CacheManager();
```

#### Resolver-Level Caching
```javascript
// services/api-gateway/src/resolvers/cachedResolvers.js
const cache = require('../cache/redisCache');

const resolvers = {
  Query: {
    document: async (_, { id }, context) => {
      const cacheKey = `document:${id}`;
      
      return cache.getOrSet(
        cacheKey,
        async () => {
          const result = await pool.query('SELECT * FROM documents WHERE id = $1', [id]);
          return result.rows[0];
        },
        3600, // 1 hour TTL
        [`document:${id}`, 'documents'] // Tags for invalidation
      );
    },

    documents: async (_, { page = 1, limit = 10, filter }, context) => {
      const cacheKey = `documents:${page}:${limit}:${JSON.stringify(filter)}`;
      
      return cache.getOrSet(
        cacheKey,
        async () => {
          const offset = (page - 1) * limit;
          const query = `
            SELECT * FROM documents
            WHERE ($1::text IS NULL OR title ILIKE $1)
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
          `;
          const result = await pool.query(query, [
            filter?.search ? `%${filter.search}%` : null,
            limit,
            offset
          ]);
          return result.rows;
        },
        300, // 5 minutes TTL (shorter for lists)
        ['documents']
      );
    },
  },

  Mutation: {
    updateDocument: async (_, { id, input }, context) => {
      const result = await pool.query(
        'UPDATE documents SET title = $2, content = $3, updated_at = NOW() WHERE id = $1 RETURNING *',
        [id, input.title, input.content]
      );

      // Invalidate related caches
      await cache.invalidateByTag(`document:${id}`);
      await cache.invalidateByTag('documents');

      return result.rows[0];
    },
  },
};
```

## 3. Database Performance Optimization

### Query Optimization

#### Index Strategy
```sql
-- Performance-focused indexes
-- database/migrations/005_performance_indexes.sql

-- User lookups
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY idx_users_created_at ON users(created_at DESC);

-- Document queries
CREATE INDEX CONCURRENTLY idx_documents_user_id ON documents(user_id);
CREATE INDEX CONCURRENTLY idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX CONCURRENTLY idx_documents_status ON documents(status);
CREATE INDEX CONCURRENTLY idx_documents_title_gin ON documents USING gin(to_tsvector('english', title));
CREATE INDEX CONCURRENTLY idx_documents_content_gin ON documents USING gin(to_tsvector('english', content));

-- Composite indexes for common queries
CREATE INDEX CONCURRENTLY idx_documents_user_status_created ON documents(user_id, status, created_at DESC);
CREATE INDEX CONCURRENTLY idx_documents_project_created ON documents(project_id, created_at DESC);

-- Translation queries
CREATE INDEX CONCURRENTLY idx_translations_document_id ON translations(document_id);
CREATE INDEX CONCURRENTLY idx_translations_created_at ON translations(created_at DESC);

-- Project queries
CREATE INDEX CONCURRENTLY idx_projects_user_id ON projects(user_id);
CREATE INDEX CONCURRENTLY idx_project_members_project_id ON project_members(project_id);
CREATE INDEX CONCURRENTLY idx_project_members_user_id ON project_members(user_id);

-- Partial indexes for active records
CREATE INDEX CONCURRENTLY idx_documents_active ON documents(created_at DESC) 
WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY idx_projects_active ON projects(created_at DESC) 
WHERE deleted_at IS NULL;
```

#### Query Performance Analysis
```sql
-- Query analysis and optimization
-- Enable query planning and execution statistics
SET track_activity_query_size = 4096;
SET log_min_duration_statement = 1000; -- Log slow queries > 1s

-- Find slow queries
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  stddev_time,
  rows
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Analyze query performance
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) 
SELECT d.*, u.full_name 
FROM documents d 
JOIN users u ON d.user_id = u.id 
WHERE d.created_at > NOW() - INTERVAL '30 days'
ORDER BY d.created_at DESC 
LIMIT 20;

-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC;
```

#### Connection Pooling Optimization
```javascript
// services/user-service/src/utils/optimizedDatabase.js
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  
  // Optimized connection settings
  max: 20, // Maximum connections
  min: 5,  // Minimum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  acquireTimeoutMillis: 60000,
  
  // Query optimization
  statement_timeout: 30000, // 30s query timeout
  query_timeout: 30000,
  
  // Performance monitoring
  log: (text, params) => {
    if (process.env.LOG_QUERIES === 'true') {
      console.log('Query:', text);
      console.log('Params:', params);
    }
  },
});

// Enhanced query method with metrics
const query = async (text, params) => {
  const start = Date.now();
  let client;
  
  try {
    client = await pool.connect();
    const result = await client.query(text, params);
    
    const duration = Date.now() - start;
    
    // Log slow queries
    if (duration > 1000) {
      console.warn(`Slow query detected (${duration}ms):`, text);
    }
    
    // Metrics collection
    if (global.metrics) {
      global.metrics.queryDuration.observe(duration / 1000);
      global.metrics.queryCount.inc({ status: 'success' });
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    console.error(`Query failed (${duration}ms):`, error.message);
    
    if (global.metrics) {
      global.metrics.queryCount.inc({ status: 'error' });
    }
    
    throw error;
  } finally {
    if (client) client.release();
  }
};

module.exports = { pool, query };
```

### Pagination Optimization

#### Cursor-Based Pagination
```javascript
// services/api-gateway/src/resolvers/paginationResolvers.js
const resolvers = {
  Query: {
    // Efficient cursor-based pagination
    documentsFeed: async (_, { first = 10, after, filter }, context) => {
      let query = `
        SELECT d.*, u.full_name as author_name
        FROM documents d
        LEFT JOIN users u ON d.user_id = u.id
        WHERE d.deleted_at IS NULL
      `;
      
      const params = [];
      let paramIndex = 1;
      
      // Add cursor condition
      if (after) {
        const cursor = Buffer.from(after, 'base64').toString('ascii');
        const [timestamp, id] = cursor.split('|');
        query += ` AND (d.created_at < $${paramIndex} OR (d.created_at = $${paramIndex} AND d.id < $${paramIndex + 1}))`;
        params.push(timestamp, id);
        paramIndex += 2;
      }
      
      // Add filters
      if (filter?.search) {
        query += ` AND d.title ILIKE $${paramIndex}`;
        params.push(`%${filter.search}%`);
        paramIndex++;
      }
      
      // Order and limit
      query += ` ORDER BY d.created_at DESC, d.id DESC LIMIT $${paramIndex}`;
      params.push(first + 1); // Get one extra to check if there's a next page
      
      const result = await pool.query(query, params);
      const documents = result.rows.slice(0, first);
      const hasNextPage = result.rows.length > first;
      
      return {
        edges: documents.map(doc => ({
          node: doc,
          cursor: Buffer.from(`${doc.created_at.toISOString()}|${doc.id}`).toString('base64'),
        })),
        pageInfo: {
          hasNextPage,
          endCursor: documents.length > 0 
            ? Buffer.from(`${documents[documents.length - 1].created_at.toISOString()}|${documents[documents.length - 1].id}`).toString('base64')
            : null,
        },
      };
    },
  },
};
```

## 4. Infrastructure Performance

### Load Balancing Configuration

#### Nginx Load Balancer
```nginx
# nginx/performance.conf
upstream api_servers {
    least_conn; # Use least connections algorithm
    server api-gateway-1:4000 max_fails=3 fail_timeout=30s;
    server api-gateway-2:4000 max_fails=3 fail_timeout=30s;
    server api-gateway-3:4000 max_fails=3 fail_timeout=30s;
    
    # Health check
    keepalive 32;
}

upstream frontend_servers {
    server frontend-1:3000 max_fails=3 fail_timeout=30s;
    server frontend-2:3000 max_fails=3 fail_timeout=30s;
    
    keepalive 32;
}

# Rate limiting
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=general_limit:10m rate=1r/s;

server {
    listen 80;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
    
    # Client body optimization
    client_max_body_size 10M;
    client_body_buffer_size 128k;
    client_header_buffer_size 1k;
    large_client_header_buffers 4 4k;
    
    # Timeouts
    client_body_timeout 12;
    client_header_timeout 12;
    keepalive_timeout 65;
    send_timeout 10;
    
    # API routes
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        
        proxy_pass http://api_servers;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Connection pooling
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        
        # Buffering
        proxy_buffering on;
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
        
        # Timeouts
        proxy_connect_timeout 5s;
        proxy_send_timeout 10s;
        proxy_read_timeout 30s;
    }
    
    # Static files with caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        proxy_pass http://frontend_servers;
        
        # Aggressive caching for static assets
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Vary "Accept-Encoding";
        
        # Compression for static files
        gzip_static on;
    }
    
    # Frontend routes
    location / {
        limit_req zone=general_limit burst=10 nodelay;
        
        proxy_pass http://frontend_servers;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # SPA fallback
        try_files $uri $uri/ @fallback;
    }
    
    location @fallback {
        proxy_pass http://frontend_servers;
    }
}
```

### Docker Performance Optimization

#### Optimized Dockerfiles
```dockerfile
# services/api-gateway/Dockerfile.optimized
# Multi-stage build for smaller images
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build step if needed
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Security: Don't run as root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Switch to non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

EXPOSE 4000

# Use exec form for better signal handling
CMD ["node", "dist/server.js"]
```

#### Docker Compose Performance
```yaml
# docker-compose.performance.yml
version: '3.8'
services:
  api-gateway:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
        reservations:
          memory: 512M
          cpus: '0.25'
    
    # Optimize logging
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    
    # Restart policy
    restart: unless-stopped
    
    # Environment optimizations
    environment:
      NODE_ENV: production
      UV_THREADPOOL_SIZE: 4
      NODE_OPTIONS: "--max-old-space-size=896"
    
    # Volume optimizations
    volumes:
      - type: tmpfs
        target: /tmp
        tmpfs:
          size: 100M
    
    # Network optimizations
    networks:
      - app-network
    
    # Health check
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s

networks:
  app-network:
    driver: bridge
    driver_opts:
      com.docker.network.driver.mtu: 1450
```

## 5. Monitoring and Performance Metrics

### Application Performance Monitoring
```javascript
// services/api-gateway/src/monitoring/performance.js
const promClient = require('prom-client');

// Register default metrics
promClient.collectDefaultMetrics({
  timeout: 10000,
  prefix: 'translation_platform_',
});

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5, 10],
});

const databaseQueryDuration = new promClient.Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});

const cacheHitRate = new promClient.Counter({
  name: 'cache_operations_total',
  help: 'Total cache operations',
  labelNames: ['operation', 'result'], // hit, miss, error
});

const activeWebSocketConnections = new promClient.Gauge({
  name: 'websocket_connections_active',
  help: 'Number of active WebSocket connections',
});

// Memory usage tracking
const memoryUsage = new promClient.Gauge({
  name: 'memory_usage_bytes',
  help: 'Memory usage in bytes',
  labelNames: ['type'], // rss, heapTotal, heapUsed, external
});

setInterval(() => {
  const mem = process.memoryUsage();
  memoryUsage.set({ type: 'rss' }, mem.rss);
  memoryUsage.set({ type: 'heapTotal' }, mem.heapTotal);
  memoryUsage.set({ type: 'heapUsed' }, mem.heapUsed);
  memoryUsage.set({ type: 'external' }, mem.external);
}, 30000);

module.exports = {
  httpRequestDuration,
  databaseQueryDuration,
  cacheHitRate,
  activeWebSocketConnections,
  promClient,
};
```

### Performance Testing
```javascript
// tests/performance/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

export const errorRate = new Rate('errors');

export const options = {
  scenarios: {
    // Constant load
    constant_load: {
      executor: 'constant-vus',
      vus: 10,
      duration: '5m',
    },
    // Spike test
    spike_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 10 },
        { duration: '5m', target: 10 },
        { duration: '2m', target: 100 },
        { duration: '5m', target: 100 },
        { duration: '2m', target: 10 },
        { duration: '3m', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'],   // Error rate under 1%
    errors: ['rate<0.01'],
  },
};

const BASE_URL = 'http://localhost:4000';

export default function () {
  // Test GraphQL query performance
  const query = `
    query GetDocuments {
      documents(limit: 10) {
        documents {
          id
          title
          wordCount
          author {
            fullName
          }
        }
      }
    }
  `;

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + getAuthToken(),
    },
  };

  const response = http.post(`${BASE_URL}/graphql`, JSON.stringify({
    query: query,
  }), params);

  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
    'has data': (r) => r.json('data.documents') !== null,
  });

  errorRate.add(!success);

  sleep(1);
}

function getAuthToken() {
  // Implement token generation/caching
  return 'test-token';
}
```

## 6. Performance Optimization Checklist

### Frontend Checklist
- [ ] Code splitting implemented
- [ ] Lazy loading for routes and components
- [ ] Image optimization with Next.js Image component
- [ ] Virtual scrolling for large lists
- [ ] Memoization for expensive calculations
- [ ] Bundle size analyzed and optimized
- [ ] Service worker for caching
- [ ] Critical CSS inlined
- [ ] Prefetching for critical routes

### Backend Checklist
- [ ] Database queries optimized with proper indexes
- [ ] GraphQL query complexity limiting
- [ ] DataLoader for batching queries
- [ ] Redis caching implemented
- [ ] Connection pooling configured
- [ ] Rate limiting implemented
- [ ] Compression enabled
- [ ] Response time monitoring
- [ ] Memory leak detection

### Infrastructure Checklist
- [ ] Load balancing configured
- [ ] CDN setup for static assets
- [ ] Gzip compression enabled
- [ ] HTTP/2 enabled
- [ ] Keep-alive connections
- [ ] Proper cache headers
- [ ] Health checks implemented
- [ ] Auto-scaling configured
- [ ] Performance monitoring setup

### Database Checklist
- [ ] Proper indexing strategy
- [ ] Query performance analyzed
- [ ] Connection pooling optimized
- [ ] Slow query logging enabled
- [ ] Database statistics updated
- [ ] Vacuum and analyze scheduled
- [ ] Replication lag monitored
- [ ] Backup performance optimized