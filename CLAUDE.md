# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Translation Platform ("SeekHub Demo - 格式译专家") - an AI-powered document translation system that maintains original document formatting. It's a full-stack application with microservices backend and Next.js frontend.

## Common Development Commands

### Frontend (Root Directory)
```bash
npm run dev          # Start development server (localhost:3000)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Backend API Gateway
```bash
cd backend/services/api-gateway
npm run dev          # Development with nodemon
npm run start        # Production server
npm run test         # Jest unit tests
npm run test:api     # API integration tests
npm run lint         # ESLint
npm run lint:fix     # Auto-fix linting issues
```

### Backend Services (Docker)
```bash
cd backend
docker-compose up -d    # Start all backend services
docker-compose down     # Stop services
docker-compose logs -f  # View service logs
```

### Document Service (Python)
```bash
cd backend/services/document-service
pip install -r requirements.txt  # Install dependencies
python main.py                    # Start FastAPI server
```

## Architecture Overview

### Frontend Architecture
- **Framework**: Next.js 15 with App Router, React 19, TypeScript 5
- **Styling**: TailwindCSS 3.4 with custom design system
- **Components**: Radix UI primitives in `components/ui/`
- **Editor**: TipTap-based rich text editor in `components/translate-editor/`
- **Forms**: React Hook Form + Zod validation
- **Key Pages**: 
  - `/` - Landing page
  - `/translate` - Main translation interface
  - `/documents` - Document management
  - `/projects` - Project workspace

### Backend Architecture

**Microservices Structure**:
```
backend/
├── services/
│   ├── api-gateway/         # GraphQL API (Apollo Server)
│   ├── document-service/    # Python document processing (FastAPI)
│   ├── collaboration-service/
│   └── file-processing-service/
├── databases/               # PostgreSQL schemas and migrations
└── docker-compose.yml       # Service orchestration
```

**API Gateway (GraphQL)**:
- Central entry point for all client requests
- Authentication via JWT middleware
- Resolvers in `src/resolvers/` for User, Project, Document, Chat, Config
- Baidu Cloud integration in `src/utils/baiduServices.js`
- Microservice communication in `src/utils/microservices.js`

**Document Processing Service**:
- Python/FastAPI service for document handling
- PDF, DOCX processing capabilities
- Translation pipeline integration
- Runs on port 8001

**Database**:
- PostgreSQL 15+ for persistent storage
- Redis for caching and sessions
- Connection pooling in `backend/databases/connection.js`

### Key Technical Patterns

1. **GraphQL Schema**: Defined in `backend/services/api-gateway/src/schema/typeDefs.js`
2. **Component Structure**: UI components use Radix UI primitives with custom styling
3. **Error Handling**: Centralized error handler in `backend/services/api-gateway/src/utils/errorHandler.js`
4. **Authentication**: JWT-based auth middleware in `backend/services/api-gateway/src/middleware/auth.js`
5. **Cloud Integration**: Baidu Cloud services for storage (BOS), AI, and IAM

### Environment Configuration

Frontend requires:
- `NEXT_PUBLIC_API_URL` - Backend API endpoint

Backend API Gateway requires:
- Database credentials (PG_HOST, PG_USER, PG_PASSWORD, PG_DATABASE)
- JWT_SECRET for authentication
- Baidu Cloud credentials (ACCESS_KEY_ID, SECRET_ACCESS_KEY)
- Service URLs for microservices

### Testing Strategy

Backend API Gateway uses Jest for testing:
- Unit tests: `npm run test`
- Integration tests: `npm run test:api`
- Test file: `backend/services/api-gateway/test-api.js` for API testing

Frontend currently has ESLint setup but no test framework configured.

### Important Notes

- TypeScript errors are currently ignored in Next.js build (`ignoreBuildErrors: true` in next.config.mjs)
- Docker Compose manages service dependencies and health checks
- API Gateway runs on port 4000, Document Service on port 8001
- Frontend development server runs on port 3000