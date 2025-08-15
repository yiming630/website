# Translation Platform - Setup and Installation Guide

## Project Overview

This is a comprehensive translation platform with a **Next.js frontend** and a **microservices backend architecture**. The project includes:

### Architecture Components

**Frontend (Next.js 15)**
- React 19 with TypeScript
- TailwindCSS + Radix UI components
- Rich text editor with TipTap
- Real-time collaboration features

**Backend Services**
1. **API Gateway** (Node.js/GraphQL) - Port 4000
2. **Document Service** (Python/FastAPI) - Port 8000  
3. **Collaboration Service** (Node.js/Socket.io) - Port 4001
4. **File Processing Service** (Python/FastAPI) - Port 8001

**Database & Infrastructure**
- PostgreSQL 15 (Port 5432)
- Redis (Port 6379)
- Docker Compose orchestration

**Special Features**
- PDF to DOCX conversion with AI-powered splitting
- Real-time document collaboration
- Google Cloud integration (Gemini AI, Cloud Storage)

## Prerequisites

### System Requirements

1. **Node.js** >= 18.0.0
2. **Python** >= 3.11
3. **Docker** & **Docker Compose**
4. **PostgreSQL** 15+ (if running without Docker)
5. **Redis** (if running without Docker)

### Account Requirements (Optional)

- **Google Cloud Account** (for AI translation and storage)
- **WPS Office API** (for enhanced document processing)

## Installation Steps

### 1. Clone and Navigate

```bash
git clone <repository-url>
cd website
```

### 2. Environment Configuration

#### Backend Environment Setup

Copy the environment template:
```bash
cd backend
cp env.example .env
```

Edit `backend/.env` with your settings:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=translation_platform_dev
DB_USER=postgres
DB_PASSWORD=your_secure_password

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-token-key

# External Services (Optional)
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_STORAGE_BUCKET=your-storage-bucket

# Redis
REDIS_URL=redis://localhost:6379
```

#### Service-Specific Environment Files

**API Gateway** (`backend/services/api-gateway/.env`):
```bash
cd backend/services/api-gateway
cp env.example .env
```

### 3. Frontend Dependencies

```bash
# Install frontend dependencies
npm install
# or
pnpm install
```

### 4. Backend Dependencies

#### Node.js Services
```bash
# API Gateway
cd backend/services/api-gateway
npm install

# Collaboration Service  
cd ../collaboration-service
npm install
```

#### Python Services
```bash
# Document Service
cd backend/services/document-service
pip install -r requirements.txt

# File Processing Service
cd ../file-processing-service  
pip install -r requirements.txt

# PDF Processing System
cd ../../../Test/PDF_to_DOCX
pip install -r requirements.txt
```

## Running the Project

### Option 1: Docker Compose (Recommended)

This will start all backend services and databases:

```bash
cd backend
docker-compose up -d
```

Services will be available at:
- **API Gateway**: http://localhost:4000/graphql
- **Document Service**: http://localhost:8000/docs
- **Collaboration Service**: http://localhost:4001
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### Option 2: Manual Setup

#### 1. Start Database Services

**PostgreSQL**:
```bash
# Ubuntu/Debian
sudo systemctl start postgresql

# macOS (Homebrew)
brew services start postgresql

# Windows
net start postgresql-x64-15
```

**Redis**:
```bash
# Ubuntu/Debian
sudo systemctl start redis

# macOS (Homebrew) 
brew services start redis

# Windows (if installed)
redis-server
```

#### 2. Database Setup

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE translation_platform_dev;
CREATE USER translation_app WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE translation_platform_dev TO translation_app;

# Exit and run schema
\q
psql -U postgres -d translation_platform_dev -f backend/databases/schema.sql
```

#### 3. Start Backend Services

**Terminal 1 - API Gateway**:
```bash
cd backend/services/api-gateway
npm run dev
```

**Terminal 2 - Document Service**:
```bash
cd backend/services/document-service
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 3 - Collaboration Service**:
```bash
cd backend/services/collaboration-service
npm run dev
```

#### 4. Start Frontend

**Terminal 4 - Frontend**:
```bash
# In project root
npm run dev
```

## Testing the Setup

### 1. Health Checks

Verify all services are running:

```bash
# API Gateway
curl http://localhost:4000/health

# Document Service
curl http://localhost:8000/health

# Collaboration Service
curl http://localhost:4001/health
```

### 2. Database Connection

Test database connectivity:
```bash
cd backend/services/api-gateway
node -e "
const { testConnection } = require('../../databases/connection');
testConnection().then(result => {
  console.log('Database test:', result ? '✅ Success' : '❌ Failed');
  process.exit(result ? 0 : 1);
});
"
```

### 3. Frontend Access

Open your browser and navigate to:
- **Frontend**: http://localhost:3000
- **GraphQL Playground**: http://localhost:4000/graphql

### 4. API Testing

Test the GraphQL API:
```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "query { __schema { types { name } } }"}'
```

## Available Features

### Current Backend Functionality

1. **User Management**
   - User registration/authentication
   - JWT-based authorization
   - Role-based access control

2. **Document Processing**
   - PDF upload and processing
   - DOCX conversion
   - AI-powered document splitting
   - Content extraction and translation

3. **Real-time Collaboration**
   - WebSocket-based document editing
   - User presence tracking
   - Cursor position sharing
   - Live content synchronization

4. **Project Management**
   - Project creation and management
   - Document organization
   - Collaboration permissions

### Frontend Pages

- `/login` - User authentication
- `/dashboard` - Main dashboard
- `/workspace` - Document workspace
- `/translate` - Translation interface
- `/translate-editor` - Rich text editor
- `/reader-workspace` - Document reading interface

## Development Commands

### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Backend Services
```bash
# API Gateway
npm run dev          # Development mode
npm run start        # Production mode
npm test             # Run tests

# Python Services  
uvicorn main:app --reload  # Development mode
python -m pytest          # Run tests
```

### Docker Commands
```bash
docker-compose up -d           # Start all services
docker-compose down            # Stop all services
docker-compose logs <service>  # View service logs
docker-compose restart        # Restart services
```

## Troubleshooting

### Common Issues

1. **Port Conflicts**
   - Check if ports 3000, 4000, 4001, 5432, 6379, 8000 are available
   - Kill conflicting processes or modify ports in configuration

2. **Database Connection Errors**
   - Verify PostgreSQL is running and accessible
   - Check credentials in `.env` files
   - Ensure database exists and schema is loaded

3. **Permission Errors**
   - Ensure proper file permissions for uploads directory
   - Check Docker daemon permissions

4. **Module Import Errors**
   - Verify all dependencies are installed
   - Check Python path configuration for document services

### Logs and Debugging

```bash
# Docker logs
docker-compose logs -f api-gateway
docker-compose logs -f document-service

# Manual service logs are displayed in their respective terminals
```

## Production Deployment

### Environment Configuration

1. Update all `.env` files with production values
2. Set `NODE_ENV=production`
3. Use strong, unique JWT secrets
4. Configure proper CORS origins
5. Set up SSL/TLS certificates

### Security Considerations

1. **Database Security**
   - Use strong passwords
   - Enable SSL connections
   - Restrict network access

2. **API Security**
   - Enable rate limiting
   - Use HTTPS only
   - Implement proper input validation

3. **File Upload Security**
   - Validate file types and sizes
   - Use secure file storage
   - Implement virus scanning (recommended)

## External Service Integration

### Google Cloud Setup (Optional)

1. Create a Google Cloud Project
2. Enable the following APIs:
   - Cloud Storage API
   - Vertex AI API (for Gemini)
3. Create service account and download credentials
4. Update environment variables with project details

### WPS Office API (Optional)

1. Register for WPS Office API access
2. Obtain API keys
3. Update environment variables in the PDF processing system

## Performance Optimization

### Database Optimization
- Enable connection pooling (already configured)
- Monitor query performance
- Set up read replicas for high traffic

### Caching Strategy
- Redis for session storage
- Application-level caching for frequently accessed data
- CDN for static assets

### Monitoring
- Set up application monitoring (New Relic, DataDog, etc.)
- Configure log aggregation
- Monitor resource usage and performance metrics

## Support and Documentation

- **API Documentation**: http://localhost:4000/graphql (GraphQL playground)
- **Document Service API**: http://localhost:8000/docs (FastAPI auto-docs)
- **Project Documentation**: `/Documentations/` directory

---

## Next Steps

After successful setup:

1. **Test the full workflow**: Upload a document, process it, and test collaboration features
2. **Configure external services**: Set up Google Cloud integration for AI features
3. **Customize the UI**: Modify components and styling to match your requirements
4. **Add monitoring**: Implement logging and monitoring for production use

For issues or questions, check the troubleshooting section or review the service logs for detailed error information.
