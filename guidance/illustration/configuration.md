# Configuration Management Documentation

## Configuration Folder Overview

**Purpose**: Unified configuration management for all environments and services

**Structure**: Single `/config` directory with clear organization by purpose

---

## `/config` - Unified Configuration Directory

### `/config/app`
**Purpose**: Application-level configuration files

**Key Files**:
- **features.json**: Feature flags and settings
  - Enable/disable features
  - Configure feature behavior
  - Manage experimental features
- **api-endpoints.json**: API endpoint definitions
  - REST and GraphQL endpoints
  - Rate limiting configuration
  - API versioning

### `/config/environments`
**Purpose**: Environment-specific settings

**Key Files**:
- **development.env**: Development environment variables
- **production.env.example**: Production template (never commit actual)
- **staging.env**: Staging configuration (create as needed)

**Environment Types**:
- **development**: Local development with debug features
- **staging**: Pre-production testing
- **production**: Live environment with security hardening

### `/config/services`
**Purpose**: Service-specific configurations

**Structure**:
```
services/
└── redis/
    └── redis.conf  # Redis server configuration
```

**Key Configurations**:
- Redis persistence and memory settings
- Service-specific overrides
- Network and security settings

**Configuration Hierarchy**:
```
Default Config
    ↓
Environment Config
    ↓
Runtime Overrides
```

---

## Root-Level Configuration Files

### `docker-compose.yml`
**Purpose**: Container orchestration and service configuration

**Key Configurations**:
- Service definitions
- Network topology
- Volume mappings
- Environment variables
- Health checks
- Service dependencies

### `package.json` (Root)
**Purpose**: Workspace configuration and scripts

**Contents**:
- Workspace definitions
- Global dependencies
- Npm scripts for project management

### `.env` Files (Not tracked)
**Purpose**: Environment variable definitions

**Variables Categories**:
- Database credentials
- API keys and secrets
- Service URLs
- Feature flags
- Resource limits

---

## Configuration Management Strategy

### 1. **Layered Configuration**:
```
Base Config → Environment Override → Runtime Override
```

### 2. **Secret Management**:
- Never commit secrets to repository
- Use environment variables
- Implement secret rotation
- Use secret management services in production

### 3. **Configuration Sources**:
- **Static Files**: Base configurations
- **Environment Variables**: Sensitive data and overrides
- **Command Line**: Runtime overrides
- **Configuration Service**: Dynamic updates

---

## Cross-References:

### Services Using Configs:
- **← `/services/api-gateway`**: JWT secrets, database config
- **← `/services/user-service`**: Authentication settings
- **← `/frontend/web-app`**: API endpoints, feature flags

### Infrastructure:
- **← `/infrastructure/docker`**: Container configurations
- **← `/infrastructure/k8s`**: Kubernetes ConfigMaps

### Documentation:
- **→ `/docs/deployment`**: Configuration deployment guides
- **→ `/POSTGRESQL_ACCESS_GUIDE.md`**: Database configuration

---

## Environment Variables Structure:

### Database Configuration:
```
POSTGRES_USER
POSTGRES_PASSWORD
POSTGRES_DB
POSTGRES_PORT
```

### Service Configuration:
```
NODE_ENV
API_GATEWAY_PORT
USER_SVC_PORT
JWT_SECRET
JWT_REFRESH_SECRET
```

### Frontend Configuration:
```
NEXT_PUBLIC_API_URL
NEXT_PUBLIC_GRAPHQL_URL
NEXT_PUBLIC_CLIENT_ORIGIN
```

### Redis Configuration:
```
REDIS_PORT
REDIS_PASSWORD
```

---

## Best Practices Implemented:
1. **Environment Isolation**: Separate configs per environment
2. **Secret Security**: No hardcoded secrets
3. **Override Capability**: Flexible configuration hierarchy
4. **Version Control**: Track configuration changes
5. **Documentation**: Clear configuration documentation
6. **Validation**: Schema validation for configs
7. **Hot Reload**: Dynamic configuration updates in development