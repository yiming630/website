# Backend Services Documentation

## `/services` - Microservices Architecture

**Purpose**: Backend services implementing business logic and data management

**Why it exists here**: 
- Follows microservices pattern for scalability and maintainability
- Each service has single responsibility
- Enables independent deployment and scaling

### Service Components:

## `/services/api-gateway`
**Purpose**: Unified GraphQL API endpoint for all frontend requests

**Key Files**:
- **server.js**: Express server with Apollo GraphQL setup
- **schema/typeDefs.js**: GraphQL type definitions
- **resolvers/**: GraphQL resolvers for different domains
  - `userResolvers.js`: User authentication and management
  - `documentResolvers.js`: Document operations
  - `projectResolvers.js`: Project management
  - `chatResolvers.js`: AI chat functionality
  - `configResolvers.js`: Configuration management
- **middleware/auth.js**: JWT authentication middleware
- **utils/database.js**: PostgreSQL connection management

**Cross-References**:
- Receives requests from **← `/frontend/web-app`**
- Forwards to **→ `/services/user-service`**
- Connects to **→ PostgreSQL database** (defined in docker-compose.yml)

---

## `/services/user-service`
**Purpose**: User authentication, authorization, and profile management

**Key Files**:
- **server.js**: Express REST API server
- **routes/auth.js**: Authentication endpoints (login, register, refresh)
- **routes/users.js**: User CRUD operations
- **utils/database.js**: Database connection utilities

**Why separate service**:
- Security isolation for sensitive user data
- Independent scaling for authentication load
- Reusable across multiple frontends

**Cross-References**:
- Called by **← `/services/api-gateway`**
- Stores data in **→ PostgreSQL database**
- Uses JWT secrets from **← environment configuration**

---

## `/backend/services/collaboration-service` (Planned/Partial)
**Purpose**: Real-time collaboration features

**Current State**: Package-lock.json exists, indicating planned implementation

**Expected Features**:
- WebSocket connections for live editing
- Conflict resolution for concurrent edits
- User presence tracking

---

## Service Communication Pattern:
```
Frontend → API Gateway → Individual Services → Database
         ↓                                    ↓
    GraphQL Query                      PostgreSQL/Redis
```

## Configuration:
Each service includes:
- **Dockerfile**: Container definition
- **package.json**: Dependencies and scripts
- **Environment variables**: Defined in docker-compose.yml

## Design Principles:
1. **Single Responsibility**: Each service handles one domain
2. **Loose Coupling**: Services communicate via well-defined APIs
3. **High Cohesion**: Related functionality grouped together
4. **Fault Isolation**: Service failure doesn't cascade
5. **Independent Deployment**: Services can be updated separately