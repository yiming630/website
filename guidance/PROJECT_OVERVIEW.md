# Translation Platform Project Overview

## Project Description
This is a comprehensive translation platform built with a microservices architecture, featuring real-time collaboration, AI-powered translation assistance, and document management capabilities.

## Technology Stack
- **Frontend**: Next.js 14+ with TypeScript, React, and Tailwind CSS
- **Backend**: Node.js microservices with GraphQL API Gateway
- **Database**: PostgreSQL with Redis caching
- **Infrastructure**: Docker containerization with Docker Compose orchestration
- **Development Tools**: PDF to DOCX conversion experiments, testing utilities

## Core Architecture Pattern
The project follows a **microservices architecture** with:
- Service-oriented backend components
- API Gateway pattern for unified access
- Container-based deployment strategy
- Separation of concerns across different layers

## Key Features
1. **Document Translation**: Multi-format document processing and translation
2. **Real-time Collaboration**: Live editing and review capabilities
3. **AI Integration**: AI-powered translation assistance and chat functionality
4. **User Management**: Authentication and authorization system
5. **Workspace Management**: Project and document organization

## Project Structure Categories

### 1. **Application Code** (`/frontend`, `/services`, `/nextjs-app`)
Contains the actual application implementation including frontend UI and backend services.

### 2. **Configuration** (`/config`, `/configs`, `/infrastructure`)
Houses all configuration files for different environments and deployment scenarios.

### 3. **Database** (`/database`)
Contains database schemas, migrations, and initialization scripts.

### 4. **Documentation** (`/docs`, `/Documentations`, root-level .md files)
Comprehensive documentation covering architecture, APIs, setup guides, and development plans.

### 5. **Development Tools** (`/tools`, `/scripts`, `/Test`)
Utilities, scripts, and experimental features for development and testing.

### 6. **Infrastructure** (`/infrastructure`, Docker files)
Container definitions and orchestration configurations for deployment.

## Navigation Guide
Each folder in this guidance directory contains detailed documentation about specific project components. Start with:
1. `illustration/frontend.md` - Understanding the user interface
2. `illustration/services.md` - Backend services architecture
3. `illustration/infrastructure.md` - Deployment and DevOps setup
4. `illustration/database.md` - Data layer design

## Cross-References
The project components are highly interconnected. Key relationships:
- Frontend → Services (via API Gateway)
- Services → Database (data persistence)
- All components → Infrastructure (containerization)
- Documentation → All components (guidance and specifications)