# Project Cross-References Guide

## Overview
This document maps the relationships and dependencies between different parts of the translation platform, helping developers understand how components interact and where to find related code.

---

## 🔄 Core Data Flow

### User Journey:
```
Browser → Frontend (Next.js) → API Gateway (GraphQL) → Services → Database
                                        ↓
                                    Redis Cache
```

### Authentication Flow:
```
Login Page → User Service → JWT Generation → API Gateway → Protected Routes
   (/login)    (/auth)       (cookies)      (middleware)    (frontend)
```

### Document Processing Flow:
```
Upload → Frontend → API Gateway → Document Service → PostgreSQL
                         ↓              ↓
                    AI Service    PDF Converter
                    (Gemini)     (Experimental)
```

---

## 📁 Component Dependencies Map

### Frontend Dependencies:
```
/frontend/web-app/
├── Connects to → /services/api-gateway (GraphQL)
├── Uses types from → /app/translate-editor/types.ts
├── Implements → /components/ui (Shadcn components)
├── Styled with → /styles/globals.css (Tailwind)
└── Configured by → next.config.mjs, tailwind.config.ts
```

### API Gateway Dependencies:
```
/services/api-gateway/
├── Forwards to → /services/user-service
├── Queries → PostgreSQL (via database.js)
├── Caches in → Redis (optional)
├── Validates with → /middleware/auth.js
└── Defines schema → /schema/typeDefs.js
```

### User Service Dependencies:
```
/services/user-service/
├── Stores in → PostgreSQL
├── Generates → JWT tokens
├── Validates → Passwords (bcrypt)
└── Exposes → REST endpoints
```

---

## 🗄️ Database References

### Tables Used By Services:

| Service | Tables | Purpose |
|---------|--------|---------|
| user-service | users, roles, sessions | Authentication & authorization |
| api-gateway | All tables | Data aggregation |
| document-service | documents, projects | Document management |
| collaboration | document_versions, locks | Real-time editing |

### Configuration Files:
- Schema: `/database/schemas/init.sql`
- Migrations: `/database/migrations/`
- Connection: Services use `/utils/database.js`

---

## 🐳 Docker Service Relationships

### Service Dependencies:
```
frontend
  └── depends_on:
      ├── api-gateway (healthy)
      ├── user-svc (healthy)
      └── db (healthy)

api-gateway
  └── depends_on:
      ├── user-svc (healthy)
      └── db (healthy)

user-svc
  └── depends_on:
      └── db (healthy)
```

### Shared Resources:
- **Network**: `translation-network` (all services)
- **Volumes**: 
  - `postgres_data` (database)
  - `redis_data` (cache)
  - Application code (development)

---

## 🔧 Configuration Cross-References

### Environment Variables Flow:
```
.env file
  ├── docker-compose.yml (substitution)
  │   └── Container environment
  │       └── Application runtime
  └── Direct usage in local development
```

### Configuration Priority:
1. Runtime arguments (highest)
2. Environment variables
3. Configuration files
4. Default values (lowest)

---

## 📚 Documentation Links

### For Frontend Development:
- Architecture: `/docs/frontend.md`
- Components: `/frontend/web-app/components/README.md`
- Styling: Tailwind docs + `/styles/globals.css`

### For Backend Development:
- Architecture: `/docs/architecture/Backend_Architecture.md`
- API Reference: `/docs/api/API.md`
- Database: `/POSTGRESQL_ACCESS_GUIDE.md`

### For DevOps:
- Docker: `/DOCKER_EXPLANATION.md`
- Deployment: `/docs/deployment/`
- Setup: `/docs/user-guides/PROJECT_SETUP_GUIDE.md`

---

## 🛠️ Development Tools References

### Testing:
- Auth testing: `/scripts/test-auth.js`
- PDF conversion: `/Test/PDF_to_DOCX/`

### Experiments:
- PDF to DOCX: `/tools/experiments/PDF_to_DOCX/`
- Future features: Check `/Documentations/todolist.md`

### Setup Scripts:
- Unix/Linux: `/scripts/setup.sh`
- Windows: `/tools/scripts/test-setup.bat`

---

## 🔍 Common Tasks Reference

### Adding a New Feature:
1. Plan in `/Documentations/todolist.md`
2. Prototype in `/tools/experiments/`
3. Implement in appropriate service
4. Add frontend in `/frontend/web-app/app/`
5. Document in `/docs/`

### Debugging Issues:
1. Check logs in service containers
2. Verify environment variables
3. Test with `/scripts/test-auth.js`
4. Use pgAdmin (port 5050) for database
5. Use Redis Commander (port 8081) for cache

### Updating Dependencies:
1. Update in specific service `package.json`
2. Rebuild Docker image
3. Test thoroughly
4. Update documentation

---

## 🎯 Quick Navigation

### Key Entry Points:
- **Frontend**: `/frontend/web-app/app/page.tsx`
- **API Gateway**: `/services/api-gateway/src/server.js`
- **User Service**: `/services/user-service/src/server.js`
- **Database Schema**: `/database/schemas/init.sql`
- **Docker Setup**: `/docker-compose.yml`

### Important Ports:
- **3000**: Frontend (Next.js)
- **4000**: API Gateway (GraphQL)
- **4001**: User Service
- **5432**: PostgreSQL
- **6379**: Redis
- **5050**: pgAdmin
- **8081**: Redis Commander

### Health Check Endpoints:
- Frontend: `http://localhost:3000`
- API Gateway: `http://localhost:4000/health`
- User Service: `http://localhost:4001/health`

---

## 🔮 Future Integration Points

### Planned Services:
- **collaboration-service**: Real-time editing
- **ai-service**: Enhanced translation
- **notification-service**: User notifications
- **billing-service**: Subscription management

### Migration Paths:
- `/Documentations/` → `/docs/` (ongoing)
- `/nextjs-app/` → `/frontend/web-app/` (duplicate removal)
- Experimental features → Production services