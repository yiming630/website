# Complete Folder Structure Reference

## Project Directory Tree

```
website/
├── 📁 frontend/                    # Frontend application
│   └── web-app/                    # Next.js 14+ application
│       ├── app/                    # App Router pages
│       │   ├── dashboard/          # User dashboard
│       │   ├── translate-editor/   # Core translation editor
│       │   ├── workspace/          # Project management
│       │   ├── reader-*/          # Document readers
│       │   └── login/              # Authentication pages
│       ├── components/             # React components
│       │   ├── ui/                # Shadcn/ui library
│       │   └── translate-editor/   # Editor components
│       ├── context/               # React contexts
│       ├── hooks/                 # Custom React hooks
│       ├── lib/                   # Utilities
│       ├── services/              # API services
│       └── styles/                # CSS files
│
├── 📁 services/                    # Backend microservices
│   ├── api-gateway/               # GraphQL API Gateway
│   │   ├── src/
│   │   │   ├── resolvers/        # GraphQL resolvers
│   │   │   ├── schema/           # Type definitions
│   │   │   ├── middleware/       # Auth middleware
│   │   │   └── utils/            # Utilities
│   │   └── Dockerfile
│   └── user-service/              # Authentication service
│       ├── src/
│       │   ├── routes/           # REST endpoints
│       │   └── utils/            # Database utilities
│       └── Dockerfile
│
├── 📁 backend/                     # Additional backend services
│   └── services/
│       └── collaboration-service/  # Real-time collaboration (planned)
│
├── 📁 database/                    # Database layer
│   ├── schemas/                   # SQL schemas
│   │   └── init.sql              # Initial schema
│   ├── migrations/                # Schema migrations
│   └── init-scripts/              # Initialization scripts
│
├── 📁 infrastructure/              # DevOps and deployment
│   ├── docker/                    # Docker configurations
│   │   └── configs/
│   ├── ci-cd/                     # CI/CD pipelines (planned)
│   └── k8s/                       # Kubernetes manifests (planned)
│
├── 📁 config/                      # Service configurations
│   └── redis/                     # Redis configuration
│       └── redis.conf
│
├── 📁 configs/                     # Environment configurations
│   ├── app-configs/               # Application configs
│   └── environments/              # Environment-specific
│
├── 📁 docs/                        # Organized documentation
│   ├── api/                       # API documentation
│   ├── architecture/              # System design
│   ├── deployment/                # Deployment guides
│   └── user-guides/               # User guides
│
├── 📁 Documentations/              # Legacy documentation
│   ├── *.md                       # Various docs (migrating to /docs)
│   └── todolist.md                # Development tasks
│
├── 📁 tools/                       # Development tools
│   ├── experiments/               # Experimental features
│   │   └── PDF_to_DOCX/          # PDF conversion experiment
│   ├── dev-tools/                 # Development utilities
│   └── scripts/                   # Utility scripts
│       └── legacy/                # Old scripts
│
├── 📁 scripts/                     # Project scripts
│   ├── setup.sh                   # Unix setup
│   └── test-auth.js               # Auth testing
│
├── 📁 Test/                        # Testing experiments
│   └── PDF_to_DOCX/               # PDF conversion tests
│
├── 📁 nextjs-app/                  # Duplicate frontend (to be removed)
│   └── [similar structure to frontend/web-app]
│
├── 📁 guidance/                    # Project guidance (NEW)
│   ├── illustration/              # Folder documentation
│   │   ├── frontend.md           # Frontend documentation
│   │   ├── services.md           # Services documentation
│   │   ├── database.md           # Database documentation
│   │   ├── infrastructure.md     # Infrastructure docs
│   │   ├── configuration.md      # Config documentation
│   │   ├── documentation.md      # Docs structure
│   │   ├── tools-and-scripts.md  # Tools documentation
│   │   └── root-configuration.md # Root config docs
│   ├── PROJECT_OVERVIEW.md       # Project overview
│   ├── CROSS_REFERENCES.md       # Component relationships
│   └── FOLDER_STRUCTURE.md       # This file
│
├── 📄 docker-compose.yml           # Container orchestration
├── 📄 package.json                 # Workspace configuration
├── 📄 README.md                    # Project introduction
├── 📄 DOCKER_EXPLANATION.md        # Docker guide
├── 📄 POSTGRESQL_ACCESS_GUIDE.md   # Database guide
├── 📄 NEXT_STEPS.md                # Future roadmap
└── 📄 next-env.d.ts                # TypeScript declarations
```

---

## Folder Categories

### 🎨 **Frontend** (User Interface)
- `/frontend/web-app/` - Main Next.js application
- `/nextjs-app/` - Duplicate (to be removed)

### ⚙️ **Backend** (Business Logic)
- `/services/` - Microservices
- `/backend/services/` - Additional services

### 💾 **Data** (Persistence)
- `/database/` - Schemas and migrations
- PostgreSQL & Redis (via Docker)

### 🔧 **Configuration**
- `/config/` - Service configs
- `/configs/` - Environment configs
- Root config files

### 📚 **Documentation**
- `/docs/` - Organized docs
- `/Documentations/` - Legacy docs
- `/guidance/` - Project guidance

### 🛠️ **Development**
- `/tools/` - Dev tools and experiments
- `/scripts/` - Automation scripts
- `/Test/` - Testing environment

### 🚀 **Infrastructure**
- `/infrastructure/` - Deployment configs
- `docker-compose.yml` - Container orchestration

---

## Navigation Tips

### For New Developers:
1. Start with `/guidance/PROJECT_OVERVIEW.md`
2. Review `/guidance/illustration/` for each component
3. Check `/docs/user-guides/PROJECT_SETUP_GUIDE.md`
4. Explore `/frontend/web-app/` for UI code
5. Understand `/services/` for backend logic

### For Feature Development:
1. Check `/Documentations/todolist.md` for tasks
2. Prototype in `/tools/experiments/`
3. Implement in appropriate service/frontend
4. Update relevant documentation
5. Test thoroughly

### For DevOps:
1. Review `docker-compose.yml`
2. Check `/infrastructure/` for deployment
3. Configure via `/configs/environments/`
4. Monitor health endpoints
5. Access admin tools (pgAdmin, Redis Commander)

---

## Important Notes

### Duplicate Folders:
- `/nextjs-app/` duplicates `/frontend/web-app/` (cleanup needed)
- `/Documentations/` being migrated to `/docs/`

### Environment-Specific:
- Development uses volume mounts for hot reload
- Production uses built Docker images
- Optional services activated via profiles

### Security Considerations:
- Never commit `.env` files
- Store secrets securely
- Use environment variables
- Implement proper authentication

### Future Additions:
- More microservices planned
- Kubernetes deployment coming
- CI/CD pipeline implementation
- Enhanced monitoring and logging