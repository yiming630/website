# 🐛 DEBUG GUIDE - Translation Platform

This guide will help you debug connection issues, understand what `npm run dev` actually does, and how to deploy the system.

## ❓ **IMPORTANT: What Does `npm run dev` Actually Do?**

**`npm run dev` ONLY starts individual services - it does NOT start databases or all services automatically!**

### What Each Command Does:

```bash
# Frontend only - starts Next.js dev server on port 3000
cd frontend && npm run dev

# Backend API Gateway only - starts GraphQL server on port 4000  
cd backend/services/api-gateway && npm run dev

# This does NOT start:
# ❌ PostgreSQL database
# ❌ MongoDB database  
# ❌ Redis
# ❌ Other microservices
```

## 🚀 **Different Ways to Run the Complete System**

### **Option 1: Docker Compose (Recommended for Full System)**

Starts ALL services including databases:

```bash
# Start everything (PostgreSQL, Redis, API Gateway, User Service, Frontend)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop everything
docker-compose down

# Start with specific profiles
docker-compose --profile dev up -d  # Includes dev tools (pgAdmin, etc.)
docker-compose --profile cache up -d  # Includes Redis
```

### **Option 2: Manual Individual Services (Development)**

You need to start each service manually:

```bash
# 1. Start MongoDB (your cloud MongoDB is already running)

# 2. Start PostgreSQL (if using locally)
# Option A: Install PostgreSQL locally
# Option B: Use Docker for just PostgreSQL
docker run --name postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=translation_platform -p 5432:5432 -d postgres:16-alpine

# 3. Start Backend API Gateway
cd backend/services/api-gateway
npm run dev

# 4. Start Frontend (in another terminal)
cd frontend  
npm run dev
```

### **Option 3: Hybrid Approach (Databases in Docker, Code Locally)**

```bash
# Start only databases with Docker
docker-compose up -d db redis

# Run your code locally for easier debugging
cd backend/services/api-gateway && npm run dev
cd frontend && npm run dev  # In another terminal
```

## 📋 Step-by-Step Debugging

### 1. **Test MongoDB Connection First**

```bash
# Test your MongoDB connection
python mongo_test.py
```

This will show you:
- ✅ MongoDB connection status
- 📊 Database information  
- 📁 GridFS setup verification
- 🧪 Read/write operations test

### 2. **Test All Backend Connections**

```bash
cd backend/services/api-gateway
npm run test:connections
```

This comprehensive test shows:
- 🔧 Environment variables status
- 🐘 PostgreSQL connection 
- 🍃 MongoDB/GridFS connection
- 🔗 GraphQL schema loading
- 📁 File upload service status

### 3. **Test GraphQL Resolvers**

```bash
cd backend/services/api-gateway
npm run test:graphql
```

This shows:
- 📝 Available query/mutation resolvers
- 🔍 Schema introspection
- ⚡ Resolver function validation
- 📤 Upload capability check

### 4. **Run Server with Full Debug Logging**

```bash
cd backend/services/api-gateway
npm run dev
```

You should now see detailed startup logs:
```
🚀 Starting API Gateway Server...
🌐 Environment: development
🔧 Port: 4000
🔧 Host: 0.0.0.0

🔄 Initializing PostgreSQL connection pool...
📍 PostgreSQL Configuration:
   Host: localhost
   Port: 5432
   Database: translation_platform
   User: postgres
   Password: PROVIDED
   Max Connections: 20

✅ PostgreSQL client connected to pool

🔍 RUNNING STARTUP DIAGNOSTICS
============================================================
🐘 Checking PostgreSQL...
🏥 Checking PostgreSQL health...
✅ PostgreSQL health check passed
📊 Database: translation_platform
📊 Version: PostgreSQL 15.x

🍃 Checking MongoDB...
🔄 Initializing MongoDB GridFS connection...
📍 Connection String: PROVIDED
📍 Database Name: translation_platform
📍 GridFS Bucket: documents
🔗 Connecting to MongoDB...
🗄️ Selecting database...
📁 Initializing GridFS bucket...
✅ MongoDB GridFS initialized successfully
📊 MongoDB Status: Connected to translation_platform

🔗 Checking GraphQL...
✅ GraphQL system healthy

📁 Checking File Storage...
✅ File storage healthy

🏥 Overall Health: HEALTHY
============================================================

🔧 Starting Apollo Server with WebSocket support...
✅ Apollo Server started successfully
✅ GraphQL middleware applied to /graphql

🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉
✅ API GATEWAY SERVER STARTED SUCCESSFULLY
🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉
🚀 Server: http://0.0.0.0:4000
📊 Health Check: http://0.0.0.0:4000/health
🔍 Detailed Health: http://0.0.0.0:4000/health/detailed
🔍 GraphQL Playground: http://0.0.0.0:4000/graphql
📁 File Downloads: http://0.0.0.0:4000/api/files/download/{id}
🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉

🌍 Environment: development
🔌 WebSocket subscriptions: ws://0.0.0.0:4000/graphql
```

### 5. **Check Health Status While Running**

Open another terminal:

```bash
cd backend/services/api-gateway

# Quick health check
npm run health

# Or detailed health check
curl http://localhost:4000/health/detailed | json_pp
```

### 6. **Test Frontend Connection**

```bash
cd frontend
npm run dev
```

The frontend should now connect to your backend at `http://localhost:4000`.

## 🔧 Environment Variables Setup

Make sure your `.env` file has these variables:

```bash
# PostgreSQL (if you're using it for metadata)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=translation_platform
DB_USER=postgres
DB_PASSWORD=your_password

# MongoDB (your cloud MongoDB)
MONGODB_CONNECTION_STRING=mongodb://root:pA(5k*rW)z!3Tqe@UFj6R21Uq.mongodb.bj.baidubce.com:27017/admin
MONGODB_DB_NAME=translation_platform

# JWT
JWT_SECRET=your_jwt_secret_here

# Server
API_GATEWAY_PORT=4000
HOST=0.0.0.0
CORS_ORIGIN=http://localhost:3000
```

## ❌ Common Issues & Solutions

### Issue 1: "MONGODB_CONNECTION_STRING is not set"
**Solution:** Add the connection string to your `.env` file

### Issue 2: "PostgreSQL connection failed"
**Solution:** Either set up PostgreSQL or modify the code to use MongoDB only

### Issue 3: "GraphQL resolvers not found"
**Solution:** Run `npm run test:graphql` to see which resolvers are missing

### Issue 4: "No debug information shown"
**Solution:** Make sure you're using the updated server files with enhanced logging

### Issue 5: Frontend shows no connection
**Solution:** 
1. Make sure backend is running on port 4000
2. Check `NEXT_PUBLIC_API_URL=http://localhost:4000` in frontend `.env.local`

## 🧪 Test Commands Summary

```bash
# Test MongoDB connection
python mongo_test.py

# Test all backend connections
cd backend/services/api-gateway
npm run test:connections

# Test GraphQL system
npm run test:graphql  

# Test all systems
npm run test:all

# Start with full debug logging
npm run dev

# Check health while running
npm run health
```

## 🔍 What Each Service Does

- **PostgreSQL**: Stores file metadata, user data, projects
- **MongoDB**: Stores actual files using GridFS
- **GraphQL**: API layer that connects frontend to databases
- **File Upload**: Handles file storage and retrieval

## 🌐 **Cloud Deployment Guide**

### **Prerequisites for Cloud Deployment**

1. **Cloud Server** (AWS EC2, DigitalOcean Droplet, Google Cloud VM, etc.)
2. **Domain Name** (optional but recommended)
3. **SSL Certificate** (Let's Encrypt recommended)
4. **MongoDB Atlas** (you already have this!)

### **Option 1: Docker Compose Deployment (Recommended)**

```bash
# 1. Clone repository on server
git clone <your-repo-url>
cd website

# 2. Create production environment file
cp .env.example .env.production

# 3. Update .env.production with production values
nano .env.production
```

**Production .env.production example:**
```bash
NODE_ENV=production

# Your existing MongoDB (already working)
MONGODB_CONNECTION_STRING=mongodb://root:pA(5k*rW)z!3Tqe@UFj6R21Uq.mongodb.bj.baidubce.com:27017/admin
MONGODB_DB_NAME=translation_platform

# Production database (or keep using MongoDB only)
DB_HOST=db
DB_NAME=translation_platform_prod
DB_USER=postgres
DB_PASSWORD=your_super_secure_password

# Production domains
CORS_ORIGIN=https://your-domain.com
CLIENT_ORIGIN=https://your-domain.com

# Strong JWT secrets
JWT_SECRET=your_very_long_random_jwt_secret_for_production_at_least_64_characters
JWT_REFRESH_SECRET=your_very_long_random_refresh_secret_for_production

# Server settings
API_GATEWAY_PORT=4000
HOST=0.0.0.0
```

```bash
# 4. Deploy with Docker Compose
docker-compose --env-file .env.production up -d

# 5. Check health
curl http://localhost:4000/health
```

### **Option 2: Manual Cloud Deployment**

```bash
# 1. Install Node.js 18+ on server
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Install PM2 for process management
npm install -g pm2

# 3. Clone and setup
git clone <your-repo-url>
cd website

# 4. Install backend dependencies
cd backend/services/api-gateway
npm install --production

# 5. Install frontend dependencies and build
cd ../../../frontend
npm install
npm run build

# 6. Create PM2 ecosystem file
```

**ecosystem.config.js:**
```javascript
module.exports = {
  apps: [{
    name: 'api-gateway',
    script: './backend/services/api-gateway/src/server.js',
    cwd: '/path/to/your/website',
    env: {
      NODE_ENV: 'production',
      PORT: 4000,
      MONGODB_CONNECTION_STRING: 'your_connection_string',
      // ... other env vars
    }
  }, {
    name: 'frontend',
    script: 'npm',
    args: 'start',
    cwd: '/path/to/your/website/frontend',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      NEXT_PUBLIC_API_URL: 'https://your-domain.com:4000'
    }
  }]
};
```

```bash
# 7. Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### **Option 3: Cloud Platform Deployment**

#### **Vercel (Frontend) + Railway/Render (Backend)**

**Frontend (Vercel):**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy frontend
cd frontend
vercel

# Set environment variables in Vercel dashboard:
# NEXT_PUBLIC_API_URL=https://your-backend-domain.com
```

**Backend (Railway/Render):**
```bash
# Connect GitHub repo to Railway/Render
# Set environment variables:
# MONGODB_CONNECTION_STRING=...
# NODE_ENV=production
# PORT=4000 (Railway auto-assigns)
```

#### **AWS/Google Cloud/DigitalOcean App Platform**

1. **Create app service**
2. **Connect GitHub repository**
3. **Set build commands:**
   ```bash
   # Backend
   cd backend/services/api-gateway && npm install
   
   # Frontend
   cd frontend && npm install && npm run build
   ```
4. **Set environment variables**
5. **Configure health checks:** `/health`

### **Nginx Reverse Proxy Setup** (for VPS deployment)

```nginx
# /etc/nginx/sites-available/translation-platform
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # GraphQL
    location /graphql {
        proxy_pass http://localhost:4000/graphql;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### **SSL Certificate with Let's Encrypt**

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal (add to crontab)
0 12 * * * /usr/bin/certbot renew --quiet
```

### **Production Health Monitoring**

```bash
# Setup monitoring endpoints
curl https://your-domain.com/health
curl https://your-domain.com/api/health/detailed

# Monitor logs
pm2 logs api-gateway
docker-compose logs -f api-gateway

# Monitor resources
pm2 monit
docker stats
```

### **Backup Strategy**

```bash
# MongoDB backup (if needed)
mongodump --uri="your_connection_string" --out=/backup/mongodb/

# PostgreSQL backup (if using)
pg_dump -h localhost -U postgres translation_platform_prod > backup.sql

# Code deployment backup
git tag v1.0.0
git push origin v1.0.0
```

## 🚨 **Production Checklist**

- [ ] Environment variables set correctly
- [ ] MongoDB connection working
- [ ] SSL certificate installed
- [ ] Firewall configured (ports 80, 443, optionally 22)
- [ ] Health checks responding
- [ ] File uploads working
- [ ] GraphQL playground disabled in production
- [ ] Logging configured
- [ ] Backup strategy in place
- [ ] Monitoring setup
- [ ] Error handling tested

The system now has comprehensive logging and testing to help you see exactly what's working and what's not!