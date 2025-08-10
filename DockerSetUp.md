# Translation Platform - Docker Compose Setup

A microservices-based translation platform with Docker Compose for easy development and deployment.
Before you run the setup.sh script in the scripts/, navigate there and provide excution privilige by chmod +x setup.sh and then run by ./setup.sh

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │   User Service  │
│   (React)       │◄──►│   (GraphQL)     │◄──►│   (Auth)        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │                        │
                              ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   PostgreSQL    │    │   Redis         │
                       │   Database      │    │   (Optional)    │
                       └─────────────────┘    └─────────────────┘
```

## 📁 Project Structure

```
├── app/
│   ├── db/
│   │   └── init.sql              # Database initialization script
│   ├── user-svc/                 # User authentication service
│   ├── api-gateway/              # GraphQL API gateway
│   └── frontend/                 # React frontend application
├── docker-compose.yml            # Main Docker Compose configuration
├── .env.dev                      # Development environment variables
├── redis.conf                    # Redis configuration
└── scripts/
    └── setup.sh                  # Development setup script
```

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Git

### 1. Environment Setup

Create `.env.dev` file in the root directory:

```bash
# Database Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DB=translation_platform_dev
POSTGRES_PORT=5432

# Authentication & Security
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
COOKIE_NAME=translation-platform-token

# Service Ports
API_GATEWAY_PORT=4000
USER_SVC_PORT=4001

# Client Configuration
CLIENT_ORIGIN=http://localhost:3000

# Redis Configuration (Optional)
REDIS_URL=redis://localhost:6379
REDIS_PORT=6379

# Additional Development Variables
NODE_ENV=development
LOG_LEVEL=debug

# Development Tools (Optional)
PGADMIN_EMAIL=admin@translation-platform.com
PGADMIN_PASSWORD=admin123
PGADMIN_PORT=5050
REDIS_COMMANDER_PORT=8081
```

### 2. Start Development Environment

```bash
# Make setup script executable
chmod +x scripts/setup.sh

# Run setup script
./scripts/setup.sh
```

Or manually:

```bash
# Start core services
docker-compose up -d db user-svc api-gateway frontend

# Start optional services (Redis + Dev tools)
docker-compose --profile cache --profile dev up -d redis pgadmin redis-commander
```

### 3. Access Services

- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:4000
- **GraphQL Playground**: http://localhost:4000/graphql
- **User Service**: http://localhost:4001
- **PostgreSQL**: localhost:5432
- **pgAdmin**: http://localhost:5050 (admin@translation-platform.com / admin123)
- **Redis Commander**: http://localhost:8081

## 🔧 Service Configuration

### Core Services

#### Database (PostgreSQL 16)
- **Image**: `postgres:16-alpine`
- **Port**: 5432 (configurable via `POSTGRES_PORT`)
- **Database**: `translation_platform_dev`
- **Initialization**: `app/db/init.sql` is automatically executed

#### User Service
- **Technology**: Node.js + Express
- **Port**: 4001 (configurable via `USER_SVC_PORT`)
- **Purpose**: Authentication, user management, JWT handling
- **Hot Reload**: Enabled with volume mounting

#### API Gateway
- **Technology**: Node.js + Apollo GraphQL Server
- **Port**: 4000 (configurable via `API_GATEWAY_PORT`)
- **Purpose**: GraphQL API, request routing, authentication middleware
- **Hot Reload**: Enabled with volume mounting

#### Frontend
- **Technology**: React + Next.js + Apollo Client
- **Port**: 3000
- **Purpose**: User interface, GraphQL client
- **Hot Reload**: Enabled with volume mounting

### Optional Services

#### Redis (Cache Profile)
- **Image**: `redis:7-alpine`
- **Port**: 6379 (configurable via `REDIS_PORT`)
- **Purpose**: Caching, sessions, real-time features
- **Configuration**: `redis.conf`

#### Development Tools (Dev Profile)
- **pgAdmin**: Database management interface
- **Redis Commander**: Redis management interface

## 📊 Database Schema

The database includes the following tables:

- `users` - User accounts and authentication
- `projects` - Translation projects
- `documents` - Document metadata and content
- `chat_messages` - AI chat history
- `download_links` - Temporary download links
- `languages` - Supported languages
- `translation_specializations` - Translation types
- `notifications` - User notifications
- `user_sessions` - JWT refresh tokens

### Default Data

- **Admin User**: admin@translation-platform.com / admin123
- **Sample Project**: "Sample Project" with default settings
- **Languages**: 14 supported languages (English, Chinese, Japanese, etc.)
- **Specializations**: 8 translation types (General, Academic, Business, etc.)

## 🛠️ Development Workflow

### 1. Service Development

Each service can be developed independently:

```bash
# User Service
cd app/user-svc
npm install
npm run dev

# API Gateway
cd app/api-gateway
npm install
npm run dev

# Frontend
cd app/frontend
npm install
npm run dev
```

### 2. Database Development

```bash
# Connect to database
docker-compose exec db psql -U postgres -d translation_platform_dev

# View logs
docker-compose logs -f db

# Reset database
docker-compose down
docker volume rm website_postgres_data
docker-compose up -d db
```

### 3. Service Communication

- **Frontend → API Gateway**: GraphQL queries/mutations
- **API Gateway → User Service**: HTTP requests for authentication
- **API Gateway → Database**: Direct PostgreSQL queries
- **All Services → Redis**: Caching and sessions (optional)

## 🔍 Monitoring & Debugging

### Health Checks

All services include health check endpoints:

```bash
# Check service health
curl http://localhost:4000/health  # API Gateway
curl http://localhost:4001/health  # User Service
curl http://localhost:3000         # Frontend
```

### Logs

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f api-gateway
docker-compose logs -f user-svc
docker-compose logs -f frontend
```

### Database Management

```bash
# Access pgAdmin
open http://localhost:5050

# Direct database access
docker-compose exec db psql -U postgres -d translation_platform_dev

# Backup database
docker-compose exec db pg_dump -U postgres translation_platform_dev > backup.sql
```

## 🚀 Production Deployment

For production deployment:

1. **Update environment variables** for production
2. **Use production Docker Compose file** (create `docker-compose.prod.yml`)
3. **Set up proper SSL certificates**
4. **Configure external databases and Redis**
5. **Set up monitoring and logging**

Example production environment:

```bash
# Production environment variables
NODE_ENV=production
JWT_SECRET=your-production-secret-key
POSTGRES_PASSWORD=your-secure-password
CLIENT_ORIGIN=https://yourdomain.com
```

## 📝 Useful Commands

```bash
# Start all services
docker-compose up -d

# Start specific services
docker-compose up -d db user-svc

# Stop all services
docker-compose down

# Rebuild services
docker-compose up --build

# View service status
docker-compose ps

# Access service shell
docker-compose exec api-gateway sh
docker-compose exec user-svc sh
docker-compose exec frontend sh

# Clean up volumes
docker-compose down -v
```

## 🔧 Troubleshooting

### Common Issues

1. **Port conflicts**: Change ports in `.env.dev`
2. **Database connection**: Check PostgreSQL is running and accessible
3. **Service startup order**: Use `depends_on` with health checks
4. **Volume permissions**: Ensure proper file permissions for mounted volumes

### Reset Environment

```bash
# Complete reset
docker-compose down -v
docker system prune -f
./scripts/setup.sh
```

## 📚 Next Steps

1. **Create service implementations** in `app/user-svc`, `app/api-gateway`, `app/frontend`
2. **Set up GraphQL schema** and resolvers
3. **Implement authentication flow**
4. **Add document processing features**
5. **Deploy to production**

## 🤝 Contributing

1. Follow the microservices architecture
2. Update Docker configurations when adding new services
3. Include proper health checks for all services
4. Document environment variables
5. Test with the provided setup script

---

**Happy coding! 🚀**
