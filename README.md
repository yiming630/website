# Translation Platform

A microservices-based translation platform with AI-powered assistance.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │   User Service  │
│   (React)       │◄──►│   (GraphQL)     │◄──►│   (Auth)        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │                        │
                              ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   PostgreSQL    │    │   Redis         │
                       │   Database      │    │   (Optional)    │
                       └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Git

### Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd website
   ```

2. **Set up environment variables**
   ```bash
   cp env.dev .env.dev
   ```

3. **Run the setup script**
   ```bash
   chmod +x scripts/setup.sh
   ./scripts/setup.sh
   ```

4. **Access services**
   - Frontend: http://localhost:3000
   - API Gateway: http://localhost:4000
   - GraphQL Playground: http://localhost:4000/graphql
   - User Service: http://localhost:4001
   - PostgreSQL: localhost:5432
   - pgAdmin: http://localhost:5050 (admin@translation-platform.com / admin123)

## 📁 Project Structure

```
website/
├── app/
│   ├── api-gateway/      # GraphQL API Gateway
│   ├── user-svc/         # User authentication service
│   ├── frontend/         # React frontend application
│   └── db/               # Database initialization
├── docker-compose.yml    # Service orchestration
├── scripts/              # Setup and utility scripts
└── Documentations/       # Project documentation
```

## 🛠️ Development

See [Documentations/](./Documentations/) for detailed development guides.

