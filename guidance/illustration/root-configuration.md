# Root-Level Configuration Files

## Overview
**Purpose**: Project-wide configuration and orchestration

**Why at root level**: 
- Apply to entire project scope
- Control multi-service orchestration
- Define project boundaries and standards

---

## `docker-compose.yml`
**Purpose**: Multi-container application orchestration

**Key Responsibilities**:
1. **Service Definitions**: All microservices and dependencies
2. **Network Configuration**: Inter-service communication
3. **Volume Management**: Data persistence
4. **Environment Variables**: Service configuration
5. **Health Checks**: Service availability monitoring
6. **Dependencies**: Service startup order

**Service Architecture**:
```yaml
Services:
├── db (PostgreSQL:16)          # Primary database
├── user-svc                    # Authentication service
├── api-gateway                  # GraphQL API
├── frontend                     # Next.js UI
├── redis (optional)             # Caching layer
├── pgadmin (dev profile)        # Database admin
└── redis-commander (dev)        # Cache admin
```

**Cross-References**:
- Launches **→ `/services/*`** containers
- Mounts **→ `/frontend/web-app`** for development
- Initializes **→ `/database/schemas/init.sql`**
- Uses **→ `/config/redis/redis.conf`**

---

## `package.json` (Root)
**Purpose**: Workspace management and global scripts

**Key Features**:
```json
{
  "workspaces": [
    "frontend/web-app",
    "services/*",
    "tools/*"
  ],
  "scripts": {
    "dev": "docker-compose up",
    "build": "docker-compose build",
    "test": "npm test --workspaces"
  }
}
```

**Why Workspaces**:
- Shared dependency management
- Cross-package linking
- Unified script execution
- Consistent versioning

---

## `next-env.d.ts`
**Purpose**: TypeScript declarations for Next.js

**Contents**:
- Next.js type references
- Global type augmentations
- Environment variable types

**Cross-References**:
- Used by **→ `/frontend/web-app`**
- Extends **→ `/nextjs-app`** TypeScript config

---

## `.env` (Not in repository)
**Purpose**: Environment variable definitions

**Structure**:
```bash
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=secure_password
POSTGRES_DB=translation_platform

# Services
API_GATEWAY_PORT=4000
USER_SVC_PORT=4001

# Security
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

# Frontend
CLIENT_ORIGIN=http://localhost:3000
```

**Security Note**: Never commit to version control

---

## `.gitignore` (Implied)
**Purpose**: Version control exclusions

**Typical Exclusions**:
```
node_modules/
.env
.env.local
dist/
build/
*.log
.DS_Store
```

---

## Configuration Files That Should Exist:

### `.dockerignore`
**Purpose**: Optimize Docker build context

**Recommended Contents**:
```
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.vscode
.idea
```

### `.prettierrc`
**Purpose**: Code formatting standards

### `.eslintrc`
**Purpose**: Code quality rules

### `tsconfig.json` (Root)
**Purpose**: TypeScript compiler options for workspace

---

## Environment Management Strategy:

### Configuration Hierarchy:
```
1. Default Values (in code)
     ↓
2. docker-compose.yml defaults
     ↓
3. .env file overrides
     ↓
4. Runtime environment variables
```

### Environment Types:
- **Development**: Hot reload, debug logging, admin tools
- **Staging**: Production-like, testing integrations
- **Production**: Optimized, secure, monitored

---

## Cross-References:

### Services Configuration:
- **→ All services** inherit environment variables
- **→ `/infrastructure/docker`** for Docker configs
- **→ `/configs/environments`** for env-specific settings

### Development Flow:
- **→ `/scripts/setup.sh`** uses these configs
- **→ `/tools/scripts/test-setup.bat`** Windows equivalent

### Documentation:
- **→ `/DOCKER_EXPLANATION.md`** explains Docker setup
- **→ `/POSTGRESQL_ACCESS_GUIDE.md`** database config
- **→ `/docs/deployment`** production configuration

---

## Best Practices:

### 1. **Environment Variables**:
- Use descriptive names
- Provide defaults where safe
- Document all variables
- Validate at startup

### 2. **Docker Compose**:
- Use profiles for optional services
- Define health checks
- Set resource limits
- Use named volumes

### 3. **Security**:
- Never hardcode secrets
- Use strong passwords
- Rotate credentials regularly
- Limit service exposure

### 4. **Development Experience**:
- Fast startup times
- Hot reload support
- Helpful error messages
- Easy debugging