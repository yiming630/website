# Troubleshooting Guide

## Common Issues and Solutions

### 1. Docker & Container Issues

#### Problem: Container fails to start
```bash
Error: translation-platform-db exited with code 1
```

**Solutions:**
1. Check if port is already in use:
   ```bash
   # Windows
   netstat -ano | findstr :5432
   taskkill /PID <PID> /F
   
   # Linux/Mac
   lsof -i :5432
   kill -9 <PID>
   ```

2. Clear Docker volumes and restart:
   ```bash
   docker-compose down -v
   docker-compose up --build
   ```

3. Check Docker logs:
   ```bash
   docker logs translation-platform-db
   docker logs translation-platform-api-gateway
   ```

#### Problem: Database connection refused
```
Error: ECONNREFUSED 127.0.0.1:5432
```

**Solutions:**
1. Ensure database container is healthy:
   ```bash
   docker ps
   docker exec translation-platform-db pg_isready
   ```

2. Check environment variables:
   ```bash
   # Verify .env file exists
   cat .env
   
   # Check if variables are loaded
   docker-compose config
   ```

3. Wait for database to be ready:
   ```javascript
   // Add retry logic in database.js
   const connectWithRetry = async () => {
     for (let i = 0; i < 10; i++) {
       try {
         await pool.connect();
         console.log('Database connected');
         break;
       } catch (err) {
         console.log(`Database connection attempt ${i + 1} failed`);
         await new Promise(resolve => setTimeout(resolve, 5000));
       }
     }
   };
   ```

#### Problem: Volume permission issues (Windows)
```
Error: Permission denied
```

**Solutions:**
1. Reset Docker Desktop settings
2. Share drives in Docker Desktop settings
3. Run as administrator:
   ```bash
   # Run command prompt as administrator
   docker-compose down
   docker-compose up
   ```

### 2. Frontend Issues

#### Problem: Next.js hot reload not working
**Solutions:**
1. Add to next.config.mjs:
   ```javascript
   const nextConfig = {
     webpack: (config) => {
       config.watchOptions = {
         poll: 1000,
         aggregateTimeout: 300,
       };
       return config;
     },
   };
   ```

2. Clear Next.js cache:
   ```bash
   rm -rf .next
   npm run dev
   ```

#### Problem: "Module not found" errors
```
Error: Cannot find module '@/components/ui/button'
```

**Solutions:**
1. Check tsconfig.json paths:
   ```json
   {
     "compilerOptions": {
       "paths": {
         "@/*": ["./app/*"],
         "@/components/*": ["./components/*"]
       }
     }
   }
   ```

2. Reinstall dependencies:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

#### Problem: Tailwind CSS not applying styles
**Solutions:**
1. Check tailwind.config.ts content paths:
   ```javascript
   content: [
     './pages/**/*.{js,ts,jsx,tsx,mdx}',
     './components/**/*.{js,ts,jsx,tsx,mdx}',
     './app/**/*.{js,ts,jsx,tsx,mdx}',
   ]
   ```

2. Ensure globals.css imports:
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```

### 3. Backend Issues

#### Problem: GraphQL schema errors
```
Error: GraphQL validation error
```

**Solutions:**
1. Validate schema syntax:
   ```bash
   # Install GraphQL CLI
   npm install -g graphql-cli
   
   # Validate schema
   graphql validate
   ```

2. Check resolver implementations match schema:
   ```javascript
   // Ensure all schema fields have resolvers
   const resolvers = {
     Query: {
       // Must match Query type in schema
     },
     Mutation: {
       // Must match Mutation type in schema
     },
   };
   ```

#### Problem: JWT authentication failing
```
Error: JsonWebTokenError: invalid signature
```

**Solutions:**
1. Verify JWT secrets match:
   ```bash
   # Check .env file
   JWT_SECRET=same_value_everywhere
   JWT_REFRESH_SECRET=same_value_everywhere
   ```

2. Check token expiration:
   ```javascript
   // Decode token to check expiry
   const decoded = jwt.decode(token);
   console.log('Token expires:', new Date(decoded.exp * 1000));
   ```

3. Ensure cookies are being set:
   ```javascript
   // Check cookie configuration
   res.cookie('token', token, {
     httpOnly: true,
     secure: process.env.NODE_ENV === 'production',
     sameSite: 'lax',
     maxAge: 3600000, // 1 hour
   });
   ```

#### Problem: Rate limiting blocking requests
```
Error: Too many requests
```

**Solutions:**
1. Adjust rate limit settings:
   ```javascript
   // In API Gateway
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100, // Increase limit
     skipSuccessfulRequests: true, // Don't count successful requests
   });
   ```

2. Exclude certain routes:
   ```javascript
   app.use('/api', (req, res, next) => {
     if (req.path === '/health') return next();
     limiter(req, res, next);
   });
   ```

### 4. Database Issues

#### Problem: Migration failures
```
Error: relation "users" already exists
```

**Solutions:**
1. Reset database:
   ```bash
   docker exec translation-platform-db psql -U postgres -c "DROP DATABASE translation_platform_dev;"
   docker exec translation-platform-db psql -U postgres -c "CREATE DATABASE translation_platform_dev;"
   docker-compose restart
   ```

2. Run migrations in order:
   ```bash
   # Create migrations folder structure
   migrations/
   ├── 001_create_users.sql
   ├── 002_create_documents.sql
   └── 003_create_projects.sql
   ```

#### Problem: Slow queries
**Solutions:**
1. Add indexes:
   ```sql
   CREATE INDEX idx_documents_user_id ON documents(user_id);
   CREATE INDEX idx_documents_created_at ON documents(created_at DESC);
   ```

2. Use query explain:
   ```sql
   EXPLAIN ANALYZE SELECT * FROM documents WHERE user_id = 'uuid';
   ```

3. Enable query logging:
   ```javascript
   // In database.js
   pool.on('query', (query) => {
     console.log('Query:', query.text);
     console.log('Duration:', query.duration);
   });
   ```

### 5. Performance Issues

#### Problem: Slow page loads
**Solutions:**
1. Enable caching:
   ```javascript
   // API Gateway caching
   const cachedData = await cache.get(cacheKey);
   if (cachedData) return cachedData;
   
   const data = await fetchData();
   await cache.set(cacheKey, data, 300); // 5 minutes
   ```

2. Optimize images:
   ```javascript
   // next.config.mjs
   module.exports = {
     images: {
       domains: ['your-domain.com'],
       formats: ['image/avif', 'image/webp'],
     },
   };
   ```

3. Enable compression:
   ```javascript
   // API Gateway
   const compression = require('compression');
   app.use(compression());
   ```

#### Problem: Memory leaks
**Solutions:**
1. Monitor memory usage:
   ```javascript
   setInterval(() => {
     const used = process.memoryUsage();
     console.log('Memory Usage:', {
       rss: `${Math.round(used.rss / 1024 / 1024)} MB`,
       heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)} MB`,
       heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)} MB`,
     });
   }, 30000);
   ```

2. Clean up event listeners:
   ```javascript
   // Remove listeners when done
   component.removeEventListener('event', handler);
   subscription.unsubscribe();
   ```

### 6. Development Environment Issues

#### Problem: npm install fails
```
Error: ENOENT: no such file or directory
```

**Solutions:**
1. Clear npm cache:
   ```bash
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

2. Use correct Node version:
   ```bash
   # Check required version
   cat .nvmrc
   
   # Switch to correct version
   nvm use 18.17.0
   ```

#### Problem: Environment variables not loading
**Solutions:**
1. Check .env file location (root directory)
2. Install dotenv if missing:
   ```bash
   npm install dotenv
   ```
3. Load early in application:
   ```javascript
   // At top of server.js
   require('dotenv').config();
   ```

### 7. Debugging Tips

#### Enable Debug Logging
```javascript
// Set DEBUG environment variable
DEBUG=* npm run dev
DEBUG=express:* npm run dev
DEBUG=apollo:* npm run dev
```

#### Use Chrome DevTools for Node.js
```bash
# Start with inspect flag
node --inspect=0.0.0.0:9229 server.js

# Open chrome://inspect in Chrome
```

#### Database Query Debugging
```javascript
// Log all queries
const { Pool } = require('pg');
const pool = new Pool({
  // ... config
  log: console.log,
});
```

#### GraphQL Playground Debugging
```graphql
# Enable introspection in development
{
  __schema {
    types {
      name
      fields {
        name
        type {
          name
        }
      }
    }
  }
}
```

### 8. Quick Fixes Reference

| Issue | Quick Command |
|-------|--------------|
| Reset everything | `docker-compose down -v && docker-compose up --build` |
| Clear Docker cache | `docker system prune -a` |
| View container logs | `docker logs -f <container-name>` |
| Enter container shell | `docker exec -it <container-name> /bin/sh` |
| Check port usage | `netstat -tulpn \| grep <port>` |
| Kill process on port | `kill -9 $(lsof -t -i:<port>)` |
| Rebuild specific service | `docker-compose up --build <service-name>` |
| View environment variables | `docker-compose config` |
| Database backup | `docker exec translation-platform-db pg_dump -U postgres translation_platform_dev > backup.sql` |
| Database restore | `docker exec -i translation-platform-db psql -U postgres translation_platform_dev < backup.sql` |

### 9. Getting Help

1. **Check Logs First:**
   - Docker logs: `docker logs <container>`
   - Application logs: Check console output
   - Browser console: F12 → Console tab

2. **Common Log Locations:**
   - Frontend: Browser console & terminal
   - API Gateway: `docker logs translation-platform-api-gateway`
   - Database: `docker logs translation-platform-db`
   - Redis: `docker logs translation-platform-redis`

3. **Error Message Search:**
   - Copy exact error message
   - Search in project issues
   - Check Stack Overflow
   - Review documentation

4. **Create Minimal Reproduction:**
   - Isolate the problem
   - Create simple test case
   - Document steps to reproduce
   - Include environment details