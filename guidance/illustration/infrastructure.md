# Infrastructure Documentation

## `/infrastructure` - DevOps and Deployment

**Purpose**: Infrastructure as Code (IaC) and deployment configurations

**Why it exists here**: 
- Centralized infrastructure management
- Version-controlled deployment configurations
- Consistent environment provisioning

### Directory Structure:

## `/infrastructure/docker`
**Purpose**: Container orchestration and configuration

**Key Components**:
- **docker-compose.yml**: Multi-container application definition
- **configs/redis/redis.conf**: Redis server configuration

**Services Defined**:
1. **PostgreSQL Database**: Primary data store
2. **User Service**: Authentication microservice
3. **API Gateway**: GraphQL endpoint
4. **Frontend**: Next.js application
5. **Redis**: Caching layer (optional)
6. **PgAdmin**: Database management UI (dev profile)
7. **Redis Commander**: Cache management UI (dev profile)

---

## `/infrastructure/ci-cd` (Planned)
**Purpose**: Continuous Integration/Deployment pipelines

**Expected Contents**:
- GitHub Actions workflows
- GitLab CI configurations
- Build and test automation
- Deployment scripts

---

## `/infrastructure/k8s` (Planned)
**Purpose**: Kubernetes deployment manifests

**Expected Contents**:
- Deployment configurations
- Service definitions
- Ingress rules
- ConfigMaps and Secrets
- Horizontal Pod Autoscaling

---

## Docker Configuration Details:

### Network Architecture:
```
translation-network (bridge)
    ├── db (PostgreSQL)
    ├── user-svc
    ├── api-gateway
    ├── frontend
    ├── redis (optional)
    ├── pgadmin (dev)
    └── redis-commander (dev)
```

### Volume Management:
- **postgres_data**: Database persistence
- **redis_data**: Cache persistence
- **pgadmin_data**: Admin tool settings
- **Application volumes**: Code mounting for development

### Health Checks:
All services include health check configurations:
- PostgreSQL: `pg_isready` command
- Services: HTTP endpoint checks
- Redis: `redis-cli ping`

### Environment Variables:
Comprehensive configuration through `.env` file:
- Database credentials
- JWT secrets
- Service ports
- CORS origins
- Rate limiting

---

## Cross-References:

### Application Code:
- **→ `/services/*`**: Service containers
- **→ `/frontend/web-app`**: Frontend container
- **→ `/database`**: Database initialization

### Configuration:
- **← Root docker-compose.yml**: Primary orchestration
- **← `/config`**: Service configurations
- **← `/configs`**: Environment-specific configs

### Scripts:
- **← `/scripts/setup.sh`**: Environment setup
- **← `/tools/scripts/test-setup.bat`**: Windows setup

---

## Deployment Profiles:

### Development Profile:
- All services with hot-reload
- Database admin tools
- Debug logging
- Local volume mounts

### Production Profile:
- Optimized images
- No admin tools
- Production logging
- External volumes

### Cache Profile:
- Redis enabled
- Session storage
- API caching

---

## Infrastructure Best Practices:
1. **Container Health Checks**: Automatic recovery
2. **Service Dependencies**: Proper startup order
3. **Network Isolation**: Secure service communication
4. **Volume Persistence**: Data durability
5. **Environment Separation**: Dev/staging/prod configs
6. **Resource Limits**: Prevent resource exhaustion
7. **Logging Strategy**: Centralized log collection