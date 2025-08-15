# Project Structure Cleanup Plan

## Current Issues
1. **Severe directory duplication** causing confusion and maintenance burden
2. **Multiple frontend applications** (3 separate Next.js apps)
3. **Duplicate backend services** in different locations
4. **Inconsistent documentation** spread across multiple folders

## Recommended Clean Structure

```
website/
├── frontend/                 # Single frontend application
│   ├── src/
│   │   ├── app/             # Next.js app directory
│   │   ├── components/      # Reusable components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utilities and helpers
│   │   ├── services/        # API clients
│   │   └── styles/          # Global styles
│   ├── public/              # Static assets
│   ├── package.json
│   └── next.config.mjs
│
├── backend/                  # All backend services
│   ├── api-gateway/         # GraphQL API gateway
│   ├── user-service/        # Authentication service
│   ├── translation-service/ # Translation logic (if needed)
│   └── shared/              # Shared utilities
│
├── infrastructure/           # DevOps and deployment
│   ├── docker/              # Docker configurations
│   ├── k8s/                 # Kubernetes manifests
│   └── ci-cd/               # CI/CD pipelines
│
├── docs/                     # All documentation
│   ├── api/                 # API documentation
│   ├── architecture/        # System design docs
│   ├── guides/              # User and setup guides
│   └── development/         # Development guidelines
│
├── scripts/                  # Utility scripts
│   ├── setup/               # Setup scripts
│   └── dev/                 # Development tools
│
├── tests/                    # Test suites
│   ├── e2e/                 # End-to-end tests
│   ├── integration/         # Integration tests
│   └── fixtures/            # Test data
│
├── .github/                  # GitHub specific files
│   └── workflows/           # GitHub Actions
│
├── docker-compose.yml        # Local development orchestration
├── package.json             # Root package.json for workspace
├── README.md
└── .gitignore
```

## Immediate Actions Required

### Step 1: Consolidate Frontend (Priority: HIGH)
- **Keep**: `nextjs-app/` as the main frontend
- **Remove**: 
  - `app/frontend/`
  - `frontend/web-app/` (appears to be duplicate of nextjs-app)
- **Action**: Move `nextjs-app/` to `frontend/`

### Step 2: Consolidate Backend Services (Priority: HIGH)
- **Keep**: One version of each service
- **Remove duplicates**:
  - Choose between `app/api-gateway/` vs `services/api-gateway/`
  - Choose between `app/user-svc/` vs `services/user-service/`
- **Action**: Move chosen services to `backend/` directory

### Step 3: Clean Documentation (Priority: MEDIUM)
- **Merge**: `Documentations/` and `docs/` into single `docs/` folder
- **Remove**: Duplicate documentation files
- **Organize**: By category (API, guides, architecture)

### Step 4: Remove Test/Experimental Code (Priority: LOW)
- **Move**: `Test/PDF_to_DOCX/` to `tools/experiments/` or remove if not needed
- **Clean**: Remove duplicate experimental code

### Step 5: Update Configuration Files
- Update `docker-compose.yml` with new paths
- Update root `package.json` scripts
- Update import paths in code

## Benefits of Clean Structure

1. **Clear Separation of Concerns**: Frontend, backend, and infrastructure are clearly separated
2. **No Duplication**: Single source of truth for each component
3. **Easier Onboarding**: New developers can understand the structure immediately
4. **Better CI/CD**: Clear paths for deployment pipelines
5. **Scalable**: Easy to add new services or features
6. **Maintainable**: Clear ownership and responsibility boundaries

## Migration Commands

```bash
# Create backup first
git checkout -b structure-cleanup
git add .
git commit -m "Backup before structure cleanup"

# Step 1: Consolidate frontend
mv nextjs-app frontend
rm -rf app/frontend
rm -rf frontend/web-app  # if duplicate

# Step 2: Consolidate backend
mkdir -p backend
mv services/api-gateway backend/
mv services/user-service backend/
rm -rf app/api-gateway app/user-svc

# Step 3: Clean docs
rm -rf Documentations
# Manually merge any unique content into docs/

# Step 4: Clean tests
rm -rf Test/PDF_to_DOCX  # or move to tools/experiments

# Step 5: Update configurations
# Update docker-compose.yml paths
# Update package.json scripts
```

## Post-Cleanup Verification

1. Run `npm install` in the new frontend directory
2. Update and test `docker-compose up`
3. Verify all import paths are updated
4. Run tests to ensure nothing is broken
5. Update CI/CD pipelines if they exist

## Long-term Recommendations

1. **Adopt Monorepo Tools**: Consider using Nx, Lerna, or Turborepo for better workspace management
2. **Implement Code Ownership**: Use CODEOWNERS file to define responsibility
3. **Add Pre-commit Hooks**: Prevent structure violations
4. **Document Architecture Decisions**: Use ADRs (Architecture Decision Records)
5. **Regular Structure Reviews**: Schedule quarterly reviews of project structure

This cleanup will significantly improve developer experience and project sustainability.