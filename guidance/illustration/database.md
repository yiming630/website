# Database Layer Documentation

## `/database` - Data Persistence Layer

**Purpose**: Centralized database schemas, migrations, and initialization scripts

**Why it exists here**: 
- Separation of data layer from application logic
- Version-controlled database schema evolution
- Consistent database setup across environments

### Directory Structure:

## `/database/schemas`
**Purpose**: SQL schema definitions for all database tables

**Key Files**:
- **init.sql**: Initial database schema creation script

**Schema Components** (from docker-compose.yml references):
- User management tables
- Project and document tables
- Translation history
- Collaboration data
- Configuration storage

---

## `/database/init-scripts`
**Purpose**: Database initialization and seed data scripts

**Typical Contents**:
- User role definitions
- Default configuration values
- Sample data for development
- Index creation scripts

---

## `/database/migrations`
**Purpose**: Schema evolution and version management

**Migration Strategy**:
- Incremental schema changes
- Rollback capabilities
- Version tracking

---

## Database Technology Stack:

### Primary Database: PostgreSQL 16
**Why PostgreSQL**:
- ACID compliance for data integrity
- JSON/JSONB support for flexible schemas
- Full-text search capabilities
- Strong consistency for financial/user data
- Excellent performance for complex queries

**Configuration** (from docker-compose.yml):
```yaml
- Image: postgres:16-alpine
- Port: 5432
- Health checks configured
- Persistent volume for data
```

### Cache Layer: Redis 7 (Optional)
**Why Redis**:
- Session management
- API response caching
- Real-time collaboration data
- Pub/Sub for event broadcasting

**Configuration**:
```yaml
- Image: redis:7-alpine
- Port: 6379
- Optional profile activation
```

---

## Cross-References:

### Services Integration:
- **← `/services/api-gateway`**: Queries and mutations
- **← `/services/user-service`**: User data operations
- **← `/backend/services/collaboration-service`**: Real-time data

### Configuration:
- **← `/docker-compose.yml`**: Container orchestration
- **← `/config/redis/redis.conf`**: Redis configuration
- **← Environment variables**: Connection strings

### Development Tools:
- **→ PgAdmin**: Database administration UI (port 5050)
- **→ Redis Commander**: Redis management UI (port 8081)

---

## Data Flow:
```
Application Services
        ↓
   Connection Pool
        ↓
    PostgreSQL
        ↓
   Data Volumes
```

## Best Practices Implemented:
1. **Connection Pooling**: Efficient resource usage
2. **Health Checks**: Automatic recovery
3. **Volume Persistence**: Data survives container restarts
4. **Initialization Order**: Proper service dependencies
5. **Environment Separation**: Different configs per environment