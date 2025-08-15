# Translation Platform - Windows Setup Guide

## System Status Detected

✅ **Node.js**: v22.18.0 (Installed)  
✅ **Python**: 3.13.5 (Available via `py` command)  
✅ **Frontend Dependencies**: Already installed (node_modules exists)  
❌ **Docker**: Not installed  
❌ **PostgreSQL**: Need to install  
❌ **Redis**: Need to install  

## Required Downloads and Installations

### 1. Docker Desktop (Recommended) 

**Download**: https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe

**Alternative: Manual PostgreSQL & Redis Installation**

### 2. PostgreSQL 15+ (If not using Docker)

**Download**: https://www.enterprisedb.com/downloads/postgres-postgresql-downloads
- Choose Windows x86-64, Version 15.x
- During installation:
  - Set password for postgres user (remember this!)
  - Keep default port 5432
  - Include pgAdmin 4

### 3. Redis (If not using Docker)

**Download**: https://github.com/tporadowski/redis/releases
- Download `Redis-x64-5.0.14.1.msi`
- Install with default settings

### 4. Python Package Manager (if needed)

```powershell
# Check if pip is available
py -m pip --version

# If not, install pip
py -m ensurepip --upgrade
```

## Installation Instructions

### Option A: Using Docker Desktop (Recommended)

1. **Install Docker Desktop**
   - Download and install from the link above
   - Restart your computer
   - Start Docker Desktop

2. **Start Backend Services**
   ```powershell
   cd C:\Users\MSI\Desktop\WinCoding\website\backend
   docker-compose up -d
   ```

### Option B: Manual Installation

1. **Install PostgreSQL**
   - Run the downloaded installer
   - Set postgres user password
   - Note down the password for later use

2. **Install Redis**
   - Run the downloaded MSI installer
   - Redis will start automatically as a Windows service

3. **Setup Database**
   ```powershell
   # Open Command Prompt as Administrator
   
   # Connect to PostgreSQL (will prompt for password)
   "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres
   
   # In psql prompt, run:
   CREATE DATABASE translation_platform_dev;
   CREATE USER translation_app WITH PASSWORD 'your_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE translation_platform_dev TO translation_app;
   \q
   
   # Load schema
   "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -d translation_platform_dev -f C:\Users\MSI\Desktop\WinCoding\website\backend\databases\schema.sql
   ```

## Backend Service Setup

### 1. Install Backend Dependencies

```powershell
# API Gateway
cd C:\Users\MSI\Desktop\WinCoding\website\backend\services\api-gateway
npm install

# Collaboration Service
cd ..\collaboration-service
npm install

# Document Service (Python)
cd ..\document-service
py -m pip install -r requirements.txt

# File Processing Service (Python)
cd ..\file-processing-service
py -m pip install -r requirements.txt

# PDF Processing System
cd ..\..\..\Test\PDF_to_DOCX
py -m pip install -r requirements.txt
```

### 2. Environment Configuration

#### Create Backend Environment File

```powershell
cd C:\Users\MSI\Desktop\WinCoding\website\backend
copy env.example .env
```

Edit `backend\.env` file:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=translation_platform_dev
DB_USER=postgres
DB_PASSWORD=your_postgres_password_here

# Redis Configuration
REDIS_URL=redis://localhost:6379

# JWT Configuration (change these in production!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-token-key

# Server Configuration
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

#### Create API Gateway Environment File

```powershell
cd services\api-gateway
copy env.example .env
```

Edit `backend\services\api-gateway\.env`:
```env
NODE_ENV=development
PORT=4000
HOST=0.0.0.0

# Database (same as backend .env)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=translation_platform_dev
DB_USER=postgres
DB_PASSWORD=your_postgres_password_here

# JWT (same as backend .env)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000
```

## Running the Application

### 1. Start Backend Services (Manual - 4 terminals)

**Terminal 1 - API Gateway:**
```powershell
cd C:\Users\MSI\Desktop\WinCoding\website\backend\services\api-gateway
node src\server.js
```

**Terminal 2 - Document Service:**
```powershell
cd C:\Users\MSI\Desktop\WinCoding\website\backend\services\document-service
py -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 3 - Collaboration Service:**
```powershell
cd C:\Users\MSI\Desktop\WinCoding\website\backend\services\collaboration-service
node main.js
```

**Terminal 4 - Frontend:**
```powershell
cd C:\Users\MSI\Desktop\WinCoding\website
npm run dev
```

### 2. Access Points

Once all services are running:

- **Frontend Application**: http://localhost:3000
- **API Gateway (GraphQL)**: http://localhost:4000/graphql
- **Document Service API**: http://localhost:8000/docs
- **Collaboration Service**: http://localhost:4001

## Testing the Setup

### 1. Quick Health Check Script

Create `test-setup.bat`:
```batch
@echo off
echo Testing Translation Platform Setup...
echo.

echo 1. Testing API Gateway...
curl -s http://localhost:4000/health
echo.

echo 2. Testing Document Service...
curl -s http://localhost:8000/health
echo.

echo 3. Testing Collaboration Service...
curl -s http://localhost:4001/health
echo.

echo 4. Testing Frontend...
curl -s http://localhost:3000
echo.

echo Setup test complete!
pause
```

### 2. Database Connection Test

Create `test-db.js` in the backend directory:
```javascript
require('dotenv').config();
const { testConnection } = require('./databases/connection');

testConnection().then(result => {
  console.log('Database test:', result ? '✅ Success' : '❌ Failed');
  process.exit(result ? 0 : 1);
}).catch(err => {
  console.error('Database test failed:', err);
  process.exit(1);
});
```

Run it:
```powershell
cd C:\Users\MSI\Desktop\WinCoding\website\backend
node test-db.js
```

## Troubleshooting Windows-Specific Issues

### 1. Python Path Issues

If Python packages don't install:
```powershell
# Use full Python path
C:\Users\MSI\AppData\Local\Programs\Python\Python313\python.exe -m pip install -r requirements.txt
```

### 2. Node.js PATH Issues

If npm commands fail:
```powershell
# Use full npm path
"C:\Program Files\nodejs\npm.cmd" install
```

### 3. PostgreSQL Connection Issues

- Ensure PostgreSQL service is running:
  ```powershell
  # Check service status
  Get-Service postgresql*
  
  # Start if stopped
  Start-Service postgresql-x64-15  # Adjust version number
  ```

### 4. Redis Connection Issues

- Ensure Redis service is running:
  ```powershell
  # Check service status
  Get-Service Redis
  
  # Start if stopped
  Start-Service Redis
  ```

### 5. Port Conflicts

Check if ports are in use:
```powershell
# Check specific ports
netstat -an | findstr :3000
netstat -an | findstr :4000
netstat -an | findstr :5432
netstat -an | findstr :6379
netstat -an | findstr :8000
```

## Development Commands for Windows

### Package Management
```powershell
# Frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Backend Node.js services
npm run dev          # Development with nodemon
npm run start        # Production mode

# Python services
py -m uvicorn main:app --reload    # Development mode
py -m uvicorn main:app             # Production mode
```

### Service Management
```powershell
# Stop all Node.js processes
taskkill /f /im node.exe

# Stop Python processes
taskkill /f /im python.exe

# Restart PostgreSQL
Restart-Service postgresql-x64-15

# Restart Redis
Restart-Service Redis
```

## Next Steps After Setup

1. **Test the complete workflow:**
   - Register a new user
   - Create a project
   - Upload a document
   - Test real-time collaboration

2. **Configure external services (optional):**
   - Google Cloud for AI features
   - WPS Office API for enhanced document processing

3. **Production deployment:**
   - Use environment-specific configurations
   - Set up proper security measures
   - Consider using Docker in production

## Production Deployment on Windows

### Using Windows Server

1. **Install IIS with Application Request Routing**
2. **Use PM2 for Node.js process management:**
   ```powershell
   npm install -g pm2
   pm2 start ecosystem.config.js
   ```

3. **Configure Windows services for Python apps:**
   ```powershell
   # Install NSSM (Non-Sucking Service Manager)
   # Create services for Python applications
   ```

### Using Docker on Windows Server

1. **Enable Containers feature**
2. **Install Docker Enterprise**
3. **Use production docker-compose configuration**

## Support

For Windows-specific issues:
- Check Windows Event Viewer for service errors
- Verify firewall settings for the ports
- Ensure all prerequisites are properly installed
- Check antivirus software for potential blocking

## Common Error Solutions

### "Module not found" errors
```powershell
# Reinstall node_modules
rm -r node_modules
npm install
```

### Python import errors
```powershell
# Check Python path
py -c "import sys; print(sys.path)"

# Install packages in user directory if needed
py -m pip install --user -r requirements.txt
```

### Database permission errors
```sql
-- In psql as postgres user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO translation_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO translation_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO translation_app;
```

---

This Windows-specific guide should help you get the Translation Platform running on your Windows development environment. Follow the steps in order and test each component before proceeding to the next.
