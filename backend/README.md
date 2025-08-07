# Translation Platform Backend

## Overview

This is the backend API for the Translation Platform, built with GraphQL, WebSockets, and microservices architecture.

## Architecture

- **API Gateway**: GraphQL server with real-time subscriptions (Node.js + Apollo Server)
- **Document Service**: FastAPI service for document processing
- **Database**: PostgreSQL 15+ with Redis caching
- **WebSocket**: Real-time collaboration and progress updates

## Tech Stack

- **GraphQL API**: Apollo Server with GraphQL subscriptions
- **Database**: PostgreSQL 15+ with connection pooling
- **Cache**: Redis for sessions and real-time data
- **Document Processing**: FastAPI + Python
- **Authentication**: JWT with refresh tokens
- **Real-time**: WebSocket connections bound to 0.0.0.0

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for development)
- Python 3.11+ (for document service)

### Environment Setup

1. Copy environment template:
```bash
cp env.example .env
```

2. Update `.env` with your configuration:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=translation_platform_dev
DB_USER=postgres
DB_PASSWORD=your_secure_password

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key

# API
HOST=0.0.0.0
PORT=4000
CORS_ORIGIN=http://localhost:3000
```

### Database Setup

The database schema is automatically initialized when you run docker-compose. The following tables will be created:

- `users` - User accounts and authentication
- `projects` - Translation projects
- `documents` - Document metadata and content
- `chat_messages` - AI chat history
- `download_links` - Temporary download links
- `languages` - Supported languages
- `translation_specializations` - Translation specialization types

### Running with Docker

1. Start all services:
```bash
cd backend
docker-compose up -d
```

2. Check service health:
```bash
# API Gateway
curl http://localhost:4000/health

# Document Service
curl http://localhost:8000/health
```

3. Access GraphQL Playground:
```
http://localhost:4000/graphql
```

### Development Setup

For local development without Docker:

1. Install dependencies:
```bash
# API Gateway
cd services/api-gateway
npm install

# Document Service
cd ../document-service
pip install -r requirements.txt
```

2. Start PostgreSQL and Redis locally

3. Initialize database:
```bash
psql -U postgres -c "CREATE DATABASE translation_platform_dev;"
psql -U postgres -d translation_platform_dev -f databases/schema.sql
```

4. Start services:
```bash
# API Gateway (Terminal 1)
cd services/api-gateway
npm run dev

# Document Service (Terminal 2)
cd services/document-service
python main.py
```

## API Endpoints

### GraphQL API (Port 4000)

- **Endpoint**: `http://localhost:4000/graphql`
- **WebSocket**: `ws://localhost:4000/graphql`
- **Playground**: `http://localhost:4000/graphql` (development only)

### REST API (Document Service - Port 8000)

- **Health**: `GET /health`
- **Upload**: `POST /api/documents/upload`
- **Process**: `POST /api/documents/process`
- **Status**: `GET /api/documents/{id}/status`
- **Translate**: `POST /api/translate/text`

## GraphQL Schema

### Queries

```graphql
query {
  me {
    id
    name
    email
    role
  }
  
  projects(limit: 20) {
    id
    name
    description
    documents {
      id
      title
      status
      progress
    }
  }
  
  supportedLanguages {
    code
    name
    nativeName
  }
}
```

### Mutations

```graphql
mutation {
  register(input: {
    name: "John Doe"
    email: "john@example.com"
    password: "securepassword123"
    role: TRANSLATOR
  }) {
    token
    user {
      id
      name
      email
    }
  }
  
  createProject(input: {
    name: "My Project"
    description: "Translation project"
    defaultSettings: {
      defaultSourceLanguage: "en"
      defaultTargetLanguage: "zh-CN"
      defaultTranslationStyle: BUSINESS
      defaultSpecialization: "business"
      requireReview: true
    }
  }) {
    id
    name
  }
}
```

### Subscriptions

```graphql
subscription {
  translationProgress(documentId: "doc-id") {
    documentId
    status
    progress
    currentStep
  }
  
  newChatMessage(documentId: "doc-id") {
    id
    content
    author
    createdAt
  }
}
```

## Authentication

The API uses JWT tokens with refresh token support:

1. **Register/Login** - Get access token and refresh token
2. **API Requests** - Include `Authorization: Bearer <token>` header
3. **Token Refresh** - Use refresh token to get new access token
4. **WebSocket Auth** - Pass token in connection parameters

Example login:
```javascript
const response = await fetch('http://localhost:4000/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: `
      mutation {
        login(input: { email: "user@example.com", password: "password" }) {
          token
          refreshToken
          user { id name email role }
        }
      }
    `
  })
});
```

## WebSocket Real-time Features

The WebSocket server is bound to 0.0.0.0 and supports:

- **Translation Progress**: Real-time updates during document processing
- **Document Updates**: Live editing collaboration
- **Chat Messages**: AI assistant conversations
- **Collaborator Status**: Who's online and editing

Connection example:
```javascript
import { createClient } from 'graphql-ws';

const client = createClient({
  url: 'ws://localhost:4000/graphql',
  connectionParams: {
    authorization: `Bearer ${token}`
  }
});
```

## Data Models

### User Roles
- `READER` - Can view and comment
- `TRANSLATOR` - Can translate and edit
- `ADMIN` - Full system access
- `ENTERPRISE` - Advanced features

### Document Status
- `PROCESSING` - Initial file processing
- `TRANSLATING` - AI translation in progress
- `REVIEWING` - Human review phase
- `COMPLETED` - Translation finished
- `FAILED` - Processing error

### Translation Styles
- `GENERAL` - General purpose
- `ACADEMIC` - Academic papers
- `BUSINESS` - Business documents
- `LEGAL` - Legal documents
- `TECHNICAL` - Technical manuals
- `CREATIVE` - Creative writing
- `MEDICAL` - Medical documents
- `FINANCIAL` - Financial reports

## Monitoring and Health Checks

### Health Check Endpoints

- API Gateway: `http://localhost:4000/health`
- Document Service: `http://localhost:8000/health`
- Database: Built into Docker health checks

### Logging

Services use structured logging with different levels:
- `ERROR` - Errors and exceptions
- `WARN` - Warning conditions
- `INFO` - General information
- `DEBUG` - Detailed debug information

### Database Connection Monitoring

The application monitors database connections and will:
- Retry failed connections
- Log connection status
- Gracefully handle connection losses

## Security Features

- **JWT Authentication** with secure secret keys
- **Password Hashing** with bcrypt (12 rounds)
- **Input Validation** for all GraphQL inputs
- **SQL Injection Protection** via parameterized queries
- **CORS Configuration** for secure cross-origin requests
- **Rate Limiting** on API endpoints
- **Role-based Access Control** (RBAC)

## Production Deployment

For production deployment:

1. Update environment variables with secure values
2. Use a proper secret management system
3. Configure SSL/TLS certificates
4. Set up database backups
5. Configure monitoring and alerting
6. Use a reverse proxy (nginx/cloudflare)
7. Set up log aggregation

Example production docker-compose:
```yaml
version: '3.8'
services:
  api-gateway:
    image: your-registry/translation-api:latest
    environment:
      NODE_ENV: production
      JWT_SECRET: ${SECURE_JWT_SECRET}
      DB_HOST: ${PROD_DB_HOST}
    deploy:
      replicas: 3
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check PostgreSQL is running
   - Verify connection string in .env
   - Ensure database exists

2. **WebSocket Connection Failed**
   - Verify WebSocket is bound to 0.0.0.0
   - Check firewall settings
   - Ensure authentication token is valid

3. **GraphQL Schema Errors**
   - Check all resolvers are properly imported
   - Verify database schema matches GraphQL types
   - Ensure all required fields are returned

4. **Authentication Issues**
   - Verify JWT secret is consistent
   - Check token expiration
   - Ensure user exists in database

### Debug Mode

Set `NODE_ENV=development` and `LOG_LEVEL=debug` for detailed logging.

## Contributing

1. Follow the existing code structure
2. Add tests for new features
3. Update documentation
4. Use conventional commit messages
5. Ensure all lints pass

## License

MIT License - see LICENSE file for details.
