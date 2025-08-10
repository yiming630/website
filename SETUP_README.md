# Translation Platform - Development Setup Guide

This guide will help you get the Translation Platform development environment running locally using Docker Compose.

## 🚀 Quick Start

### Prerequisites
- Docker Desktop installed and running
- Node.js 18+ (for local development if needed)
- Git

### 1. Clone and Setup
```bash
# Clone the repository
git clone <your-repo-url>
cd website

# Copy environment file
cp env.dev .env.dev

# Edit environment variables if needed
nano .env.dev
```

### 2. Start the Development Environment
```bash
# Run the automated setup script
./scripts/setup.sh

# Or manually start services
docker-compose up -d
```

### 3. Verify Everything is Running
```bash
# Check service status
docker-compose ps

# Test authentication system
node scripts/test-auth.js
```

## 🏗️ Architecture Overview

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│   Frontend  │    │ API Gateway  │    │ User       │
│  (Next.js)  │◄──►│ (GraphQL)    │◄──►│ Service    │
│  Port 3000  │    │ Port 4000    │    │ Port 4001  │
└─────────────┘    └──────────────┘    └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │ PostgreSQL  │
                    │ Port 5432   │
                    └─────────────┘
```

## 📁 Project Structure

```
website/
├── app/
│   ├── frontend/          # Next.js React app
│   ├── api-gateway/       # GraphQL API Gateway
│   ├── user-svc/          # User authentication service
│   └── db/                # Database initialization
├── scripts/               # Setup and utility scripts
├── docker-compose.yml     # Service orchestration
├── env.dev               # Environment configuration
└── SETUP_README.md       # This file
```

## 🔧 Service Details

### Frontend (Port 3000)
- **Technology**: Next.js 15 + React 19 + TypeScript
- **Features**: Translation editor, project management, user dashboard
- **Hot Reload**: Enabled for development

### API Gateway (Port 4000)
- **Technology**: Node.js + Apollo GraphQL Server
- **Features**: GraphQL endpoint, authentication middleware, rate limiting
- **Endpoints**: `/graphql`, `/health`

### User Service (Port 4001)
- **Technology**: Node.js + Express
- **Features**: User registration, authentication, JWT management
- **Endpoints**: `/auth/*`, `/users/*`, `/health`

### Database (Port 5432)
- **Technology**: PostgreSQL 16
- **Features**: User management, projects, documents, chat history
- **Admin**: pgAdmin available at port 5050 (optional)

## 🔐 Authentication Flow

1. **Registration**: User creates account via `/auth/register`
2. **Login**: User authenticates via `/auth/login`
3. **JWT Token**: Service returns JWT token
4. **API Calls**: Frontend includes token in Authorization header
5. **Validation**: API Gateway validates token and attaches user context

## 🧪 Testing

### Manual Testing
```bash
# Test health endpoints
curl http://localhost:4000/health
curl http://localhost:4001/health

# Test GraphQL endpoint
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ __schema { types { name } } }"}'
```

### Automated Testing
```bash
# Run the authentication test suite
node scripts/test-auth.js
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Check what's using the port
lsof -i :4000
lsof -i :4001
lsof -i :3000

# Kill the process or change ports in env.dev
```

#### 2. Database Connection Issues
```bash
# Check database logs
docker-compose logs db

# Restart database
docker-compose restart db
```

#### 3. Service Health Check Failures
```bash
# Check service logs
docker-compose logs api-gateway
docker-compose logs user-svc

# Rebuild services
docker-compose up --build
```

#### 4. Permission Denied
```bash
# Make setup script executable
chmod +x scripts/setup.sh
```

### Service Recovery
```bash
# Restart all services
docker-compose restart

# Rebuild and restart
docker-compose up --build

# Complete reset
docker-compose down -v
docker-compose up --build
```

## 📊 Monitoring

### Health Checks
- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:4000/health
- **User Service**: http://localhost:4001/health

### Logs
```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f api-gateway
docker-compose logs -f user-svc
docker-compose logs -f frontend
```

## 🚀 Next Steps

After successful setup, you can:

1. **Access the application**: http://localhost:3000
2. **Explore GraphQL schema**: http://localhost:4000/graphql
3. **Test authentication**: Use the test script
4. **Start development**: Edit files in the `app/` directory

## 📝 Development Workflow

1. **Make changes** to source code
2. **Services auto-reload** (hot reload enabled)
3. **Test changes** via browser or test scripts
4. **Commit changes** to version control

## 🆘 Getting Help

If you encounter issues:

1. Check the troubleshooting section above
2. Review service logs: `docker-compose logs [service-name]`
3. Verify environment variables in `env.dev`
4. Ensure Docker has sufficient resources allocated

## 🔄 Environment Variables

Key environment variables in `env.dev`:

- `JWT_SECRET`: Secret key for JWT tokens
- `POSTGRES_*`: Database configuration
- `API_GATEWAY_PORT`: GraphQL API port
- `USER_SVC_PORT`: User service port
- `CLIENT_ORIGIN`: CORS origin for frontend

---

**Happy coding! 🎉**
