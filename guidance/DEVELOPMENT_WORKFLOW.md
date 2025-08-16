# Development Workflow Guide

## Getting Started as a Developer

### 1. Initial Setup Workflow

```bash
# 1. Clone the repository
git clone https://github.com/your-org/translation-platform.git
cd translation-platform

# 2. Copy environment configuration
cp config/environments/development.env .env

# 3. Start Docker containers
docker-compose up -d

# 4. Verify all services are running
docker ps
# Should see: db, user-svc, api-gateway, frontend, redis

# 5. Access the application
open http://localhost:3000

# 6. Access development tools
open http://localhost:5050  # pgAdmin
open http://localhost:8081  # Redis Commander
```

### 2. Daily Development Workflow

#### Morning Startup Routine
```bash
# 1. Pull latest changes
git pull origin main

# 2. Check for dependency updates
npm outdated

# 3. Start development environment
docker-compose up

# 4. Run database migrations (if any)
docker exec translation-platform-db psql -U postgres -d translation_platform_dev -f /migrations/latest.sql

# 5. Open your IDE
code .
```

#### Development Cycle
```
┌─────────────────────────────────────────┐
│           DEVELOPMENT CYCLE              │
├─────────────────────────────────────────┤
│                                         │
│  1. Pick Task → 2. Create Branch        │
│       ↓              ↓                  │
│  8. Merge ← 7. Review                   │
│       ↑              ↑                  │
│  6. Push ← 5. Test ← 4. Commit ← 3. Code│
│                                         │
└─────────────────────────────────────────┘
```

### 3. Feature Development Workflow

#### Step 1: Task Selection
```bash
# Check available tasks
cat Documentations/todolist.md

# Or check project board
open https://github.com/your-org/translation-platform/projects
```

#### Step 2: Branch Creation
```bash
# Create feature branch
git checkout -b feature/add-translation-history

# Branch naming conventions:
# feature/description    - New features
# fix/description        - Bug fixes
# refactor/description   - Code refactoring
# docs/description       - Documentation
# test/description       - Test additions
```

#### Step 3: Development

**Frontend Development:**
```bash
# Navigate to frontend
cd frontend/web-app

# Install new dependencies (if needed)
npm install package-name

# Run development server
npm run dev

# Create new component
mkdir components/TranslationHistory
touch components/TranslationHistory/index.tsx
touch components/TranslationHistory/TranslationHistory.module.css
```

**Backend Development:**
```bash
# Navigate to service
cd services/api-gateway

# Install dependencies
npm install package-name

# Create new resolver
touch src/resolvers/translationHistoryResolver.js

# Update GraphQL schema
edit src/schema/typeDefs.js

# Restart service (auto-reload in dev)
# Docker handles this automatically
```

**Database Changes:**
```sql
-- Create migration file
-- database/migrations/004_add_translation_history.sql

CREATE TABLE translation_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    original_text TEXT,
    translated_text TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Run migration
docker exec translation-platform-db psql -U postgres -d translation_platform_dev -f /migrations/004_add_translation_history.sql
```

#### Step 4: Testing

**Unit Testing:**
```javascript
// frontend/web-app/components/TranslationHistory/TranslationHistory.test.tsx
import { render, screen } from '@testing-library/react';
import TranslationHistory from './index';

describe('TranslationHistory', () => {
  it('renders translation history', () => {
    render(<TranslationHistory />);
    expect(screen.getByText('Translation History')).toBeInTheDocument();
  });
});

// Run tests
npm test
```

**Integration Testing:**
```javascript
// services/api-gateway/tests/translationHistory.test.js
const request = require('supertest');
const app = require('../src/server');

describe('Translation History API', () => {
  it('should fetch translation history', async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `
          query {
            translationHistory(documentId: "123") {
              id
              originalText
              translatedText
            }
          }
        `
      });
    
    expect(response.status).toBe(200);
    expect(response.body.data.translationHistory).toBeDefined();
  });
});
```

**End-to-End Testing:**
```javascript
// cypress/e2e/translation-history.cy.js
describe('Translation History Feature', () => {
  it('displays translation history', () => {
    cy.login('test@example.com', 'password');
    cy.visit('/documents/123');
    cy.get('[data-testid="history-button"]').click();
    cy.get('[data-testid="history-panel"]').should('be.visible');
    cy.get('[data-testid="history-item"]').should('have.length.greaterThan', 0);
  });
});

// Run E2E tests
npm run cypress:open
```

#### Step 5: Code Review Preparation

**Pre-commit Checklist:**
```bash
# 1. Format code
npm run format

# 2. Lint code
npm run lint

# 3. Type check (TypeScript)
npm run type-check

# 4. Run tests
npm test

# 5. Build verification
npm run build
```

**Commit Guidelines:**
```bash
# Stage changes
git add .

# Commit with conventional commit message
git commit -m "feat(translation): add translation history panel

- Display previous translations for document
- Add timestamp and user info
- Implement pagination for history items

Closes #123"

# Conventional Commit Format:
# type(scope): description
#
# Types:
# - feat: New feature
# - fix: Bug fix
# - docs: Documentation
# - style: Formatting
# - refactor: Code restructuring
# - test: Tests
# - chore: Maintenance
```

#### Step 6: Pull Request

```bash
# Push branch
git push origin feature/add-translation-history

# Create PR via CLI (using GitHub CLI)
gh pr create --title "Add Translation History Feature" \
  --body "## Description
  Adds translation history panel to document editor
  
  ## Changes
  - New TranslationHistory component
  - GraphQL resolver for history queries
  - Database migration for history table
  
  ## Testing
  - Unit tests added
  - E2E tests added
  - Manual testing completed
  
  ## Screenshots
  ![History Panel](screenshot.png)
  
  ## Checklist
  - [ ] Code follows style guidelines
  - [ ] Tests pass
  - [ ] Documentation updated
  - [ ] No breaking changes"
```

### 4. Debugging Workflow

#### Frontend Debugging
```javascript
// 1. Browser DevTools
console.log('Debug data:', data);
debugger; // Breakpoint

// 2. React DevTools
// Install browser extension
// Inspect component props and state

// 3. Network debugging
// DevTools → Network tab
// Check GraphQL requests/responses

// 4. VS Code debugging
// launch.json configuration:
{
  "type": "chrome",
  "request": "launch",
  "name": "Debug Frontend",
  "url": "http://localhost:3000",
  "webRoot": "${workspaceFolder}/frontend/web-app"
}
```

#### Backend Debugging
```javascript
// 1. Console logging
console.log('Request:', req.body);
console.error('Error:', error);

// 2. Node.js debugging
// Start with inspect flag
node --inspect=0.0.0.0:9229 src/server.js

// 3. VS Code debugging
// launch.json configuration:
{
  "type": "node",
  "request": "attach",
  "name": "Debug API Gateway",
  "port": 9229,
  "address": "localhost",
  "localRoot": "${workspaceFolder}/services/api-gateway",
  "remoteRoot": "/app"
}

// 4. GraphQL Playground
// http://localhost:4000/graphql
// Use for testing queries/mutations
```

#### Database Debugging
```sql
-- 1. Check running queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query, state
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';

-- 2. Analyze query performance
EXPLAIN ANALYZE SELECT * FROM documents WHERE user_id = 'uuid';

-- 3. Check table sizes
SELECT
  schemaname AS table_schema,
  tablename AS table_name,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 4. View locks
SELECT * FROM pg_locks WHERE NOT granted;
```

### 5. Collaboration Workflow

#### Code Review Process
```
Developer → Push Code → Create PR → Assign Reviewer
                                        ↓
                                   Code Review
                                        ↓
                            ┌─────────────────────┐
                            │ Changes Requested?  │
                            └─────────┬───────────┘
                                     │
                    No ←─────────────┼─────────────→ Yes
                     ↓                               ↓
                  Approve                     Make Changes
                     ↓                               ↓
                   Merge                        Push Updates
```

#### Review Guidelines
- **Code Quality**: Clean, readable, maintainable
- **Performance**: No obvious bottlenecks
- **Security**: No vulnerabilities introduced
- **Tests**: Adequate test coverage
- **Documentation**: Code is documented

#### Pair Programming Setup
```bash
# Using VS Code Live Share
1. Install "Live Share" extension
2. Start session: Ctrl+Shift+P → "Live Share: Start"
3. Share link with teammate
4. Collaborate in real-time

# Using tmux for terminal sharing
tmux new -s pairing
# Other developer:
tmux attach -t pairing
```

### 6. Release Workflow

#### Version Management
```bash
# Semantic Versioning: MAJOR.MINOR.PATCH

# 1. Update version
npm version minor  # 1.2.0 → 1.3.0

# 2. Generate changelog
npm run changelog

# 3. Tag release
git tag -a v1.3.0 -m "Release version 1.3.0"

# 4. Push tags
git push origin --tags
```

#### Release Checklist
- [ ] All tests passing
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped
- [ ] Database migrations tested
- [ ] Performance benchmarks run
- [ ] Security scan completed
- [ ] Release notes written

### 7. Hotfix Workflow

```bash
# 1. Create hotfix branch from production
git checkout -b hotfix/critical-bug production

# 2. Fix the issue
# Make minimal changes

# 3. Test thoroughly
npm test
npm run e2e:test

# 4. Deploy to staging first
git push origin hotfix/critical-bug

# 5. After validation, merge to production
git checkout production
git merge hotfix/critical-bug
git push origin production

# 6. Backport to main
git checkout main
git merge hotfix/critical-bug
git push origin main
```

### 8. Performance Profiling Workflow

#### Frontend Performance
```javascript
// 1. React Profiler
import { Profiler } from 'react';

<Profiler id="TranslationEditor" onRender={onRenderCallback}>
  <TranslationEditor />
</Profiler>

// 2. Chrome DevTools Performance tab
// Record → Perform actions → Stop → Analyze

// 3. Lighthouse audit
// DevTools → Lighthouse → Generate report
```

#### Backend Performance
```javascript
// 1. Add timing middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.url} - ${duration}ms`);
  });
  next();
});

// 2. Use profiling tools
// npm install clinic
npx clinic doctor -- node src/server.js
```

### 9. Documentation Workflow

#### When to Update Documentation
- New feature added
- API changes
- Configuration changes
- Bug fixes that affect usage
- Performance optimizations
- Security updates

#### Documentation Locations
```
/guidance/              # Technical guidance
/docs/                  # User documentation
/README.md             # Project overview
/CONTRIBUTING.md       # Contribution guidelines
/API.md               # API documentation
Component.README.md    # Component documentation
```

#### Documentation Template
```markdown
# Feature Name

## Overview
Brief description of the feature

## Usage
How to use the feature

## API Reference
### Endpoints
- `GET /api/feature`
- `POST /api/feature`

### Parameters
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Feature ID |

## Examples
\`\`\`javascript
// Code example
\`\`\`

## Configuration
Environment variables and settings

## Troubleshooting
Common issues and solutions
```

### 10. Continuous Improvement

#### Weekly Tasks
- Review and update dependencies
- Check security advisories
- Review error logs
- Performance monitoring
- Update documentation

#### Monthly Tasks
- Full system backup
- Security audit
- Performance benchmarks
- Code quality review
- Team retrospective

#### Tools for Productivity
- **Aliases**: Add to `.bashrc` or `.zshrc`
  ```bash
  alias dc='docker-compose'
  alias dcu='docker-compose up'
  alias dcd='docker-compose down'
  alias dcl='docker-compose logs -f'
  ```

- **Git Hooks**: `.git/hooks/pre-commit`
  ```bash
  #!/bin/sh
  npm run lint
  npm test
  ```

- **VS Code Extensions**:
  - ESLint
  - Prettier
  - GitLens
  - Docker
  - Thunder Client (API testing)
  - Error Lens
  - Todo Tree