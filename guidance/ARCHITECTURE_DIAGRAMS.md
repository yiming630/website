# Architecture Diagrams and System Design

## 1. System Overview Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                     │
├─────────────────────────────────────────────────────────────────────────┤
│  Web Browser    │    Mobile App    │    Desktop App    │    API Client  │
└────────┬────────┴────────┬──────────┴────────┬─────────┴────────┬───────┘
         │                 │                    │                  │
         └─────────────────┴────────────────────┴──────────────────┘
                                      │
                                      ▼
                        ┌──────────────────────────┐
                        │    LOAD BALANCER         │
                        │    (Port 80/443)         │
                        └──────────────────────────┘
                                      │
                 ┌────────────────────┴────────────────────┐
                 ▼                                         ▼
    ┌───────────────────────┐                ┌───────────────────────┐
    │   FRONTEND (Next.js)  │                │   API GATEWAY         │
    │   Port: 3000          │◄───────────────│   (GraphQL)           │
    │                       │                │   Port: 4000          │
    └───────────────────────┘                └───────────────────────┘
                                                         │
                                    ┌────────────────────┼────────────────────┐
                                    ▼                    ▼                    ▼
                      ┌──────────────────────┐ ┌──────────────────┐ ┌──────────────────┐
                      │   USER SERVICE       │ │  DOCUMENT SERVICE │ │  AI SERVICE      │
                      │   Port: 4001         │ │  Port: 4002       │ │  Port: 4003      │
                      │   - Authentication   │ │  - CRUD Ops       │ │  - Translation   │
                      │   - Authorization    │ │  - Versioning     │ │  - Suggestions   │
                      │   - User Management  │ │  - Sharing        │ │  - Grammar Check │
                      └──────────┬───────────┘ └────────┬─────────┘ └────────┬─────────┘
                                 │                       │                     │
                                 └───────────────────────┴─────────────────────┘
                                                         │
                          ┌──────────────────────────────┴──────────────────────────────┐
                          ▼                                                             ▼
            ┌──────────────────────────┐                              ┌──────────────────────────┐
            │   PostgreSQL Database    │                              │   Redis Cache            │
            │   Port: 5432             │                              │   Port: 6379             │
            │   - Users                │                              │   - Session Storage      │
            │   - Documents            │                              │   - API Cache            │
            │   - Projects             │                              │   - Real-time Data       │
            │   - Translations         │                              │   - Rate Limiting        │
            └──────────────────────────┘                              └──────────────────────────┘
```

## 2. Request Flow Diagram

```
User Action → Frontend → API Gateway → Service → Database
                ↑            ↓           ↓         ↓
              Response    GraphQL    Business    Data
                          Schema      Logic     Storage

Detailed Flow:
1. User clicks "Translate" button
   └─→ 2. Frontend sends GraphQL mutation
       └─→ 3. API Gateway validates request
           └─→ 4. Gateway routes to Document Service
               └─→ 5. Service calls AI Service
                   └─→ 6. AI processes translation
                       └─→ 7. Result saved to PostgreSQL
                           └─→ 8. Cache updated in Redis
                               └─→ 9. Response sent back through chain
```

## 3. Authentication Flow

```
┌──────────┐      ┌──────────┐      ┌─────────────┐      ┌──────────┐
│  Client  │      │ Frontend │      │ API Gateway │      │   User   │
│          │      │          │      │             │      │  Service │
└────┬─────┘      └────┬─────┘      └──────┬──────┘      └────┬─────┘
     │                 │                    │                  │
     │  1. Login Page  │                    │                  │
     │────────────────>│                    │                  │
     │                 │                    │                  │
     │  2. Credentials │                    │                  │
     │<────────────────│                    │                  │
     │                 │                    │                  │
     │  3. Submit      │                    │                  │
     │────────────────>│  4. GraphQL Login │                  │
     │                 │───────────────────>│  5. Validate    │
     │                 │                    │────────────────>│
     │                 │                    │                  │ 6. Check DB
     │                 │                    │                  │ 7. Generate JWT
     │                 │                    │  8. JWT Token    │
     │                 │  9. Set Cookie     │<────────────────│
     │                 │<───────────────────│                  │
     │  10. Dashboard  │                    │                  │
     │<────────────────│                    │                  │
     │                 │                    │                  │

JWT Token Structure:
{
  "userId": "uuid",
  "email": "user@example.com",
  "roles": ["translator", "admin"],
  "exp": 1234567890,
  "iat": 1234567890
}
```

## 4. Database Schema Relationships

```
┌─────────────────┐
│     USERS       │
├─────────────────┤
│ id (PK)         │
│ email           │
│ password_hash   │
│ full_name       │
│ created_at      │
│ updated_at      │
└────────┬────────┘
         │ 1:N
         ▼
┌─────────────────┐      1:N      ┌─────────────────┐
│    PROJECTS     │───────────────>│   DOCUMENTS     │
├─────────────────┤                ├─────────────────┤
│ id (PK)         │                │ id (PK)         │
│ user_id (FK)    │                │ project_id (FK) │
│ name            │                │ title           │
│ description     │                │ content         │
│ created_at      │                │ source_lang     │
│ updated_at      │                │ target_lang     │
└─────────────────┘                │ created_at      │
         │                         │ updated_at      │
         │ N:M                     └────────┬────────┘
         ▼                                  │ 1:N
┌─────────────────┐                        ▼
│ PROJECT_MEMBERS │                ┌─────────────────┐
├─────────────────┤                │   VERSIONS      │
│ project_id (FK) │                ├─────────────────┤
│ user_id (FK)    │                │ id (PK)         │
│ role            │                │ document_id(FK) │
│ joined_at       │                │ content         │
└─────────────────┘                │ version_number  │
                                   │ created_by      │
                                   │ created_at      │
                                   └─────────────────┘

┌─────────────────┐
│  TRANSLATIONS   │
├─────────────────┤
│ id (PK)         │
│ document_id(FK) │
│ original_text   │
│ translated_text │
│ ai_suggestion   │
│ status          │
│ created_at      │
└─────────────────┘
```

## 5. Container Network Architecture

```
Docker Network: translation-network (Bridge)
│
├── Container: translation-platform-db (PostgreSQL)
│   ├── Internal IP: 172.18.0.2
│   ├── Exposed Port: 5432
│   └── Volume: postgres_data
│
├── Container: translation-platform-user-svc
│   ├── Internal IP: 172.18.0.3
│   ├── Exposed Port: 4001
│   ├── Depends On: db
│   └── Volume: ./app/user-svc:/app
│
├── Container: translation-platform-api-gateway
│   ├── Internal IP: 172.18.0.4
│   ├── Exposed Port: 4000
│   ├── Depends On: db, user-svc
│   └── Volume: ./app/api-gateway:/app
│
├── Container: translation-platform-frontend
│   ├── Internal IP: 172.18.0.5
│   ├── Exposed Port: 3000
│   ├── Depends On: db, user-svc, api-gateway
│   └── Volume: ./app/frontend:/app
│
├── Container: translation-platform-redis (Optional)
│   ├── Internal IP: 172.18.0.6
│   ├── Exposed Port: 6379
│   └── Volume: redis_data
│
├── Container: translation-platform-pgadmin (Dev Profile)
│   ├── Internal IP: 172.18.0.7
│   ├── Exposed Port: 5050
│   └── Depends On: db
│
└── Container: translation-platform-redis-commander (Dev Profile)
    ├── Internal IP: 172.18.0.8
    ├── Exposed Port: 8081
    └── Depends On: redis
```

## 6. Data Flow for Document Translation

```
Step-by-Step Process:

1. UPLOAD PHASE
   Browser ──[File]──> Frontend ──[FormData]──> API Gateway
                                                     │
                                                     ▼
                                              Document Service
                                                     │
                                    ┌────────────────┼────────────────┐
                                    ▼                                 ▼
                              Parse Document                    Store in Database
                              (PDF/DOCX/TXT)                   (PostgreSQL)
                                    │                                 │
                                    ▼                                 ▼
                              Extract Text                      Generate Doc ID
                                    │                                 │
                                    └─────────────┬──────────────────┘
                                                  ▼
                                            Return Doc ID

2. TRANSLATION PHASE
   Frontend ──[Translate Request]──> API Gateway ──> Document Service
                                                            │
                                                            ▼
                                                      Load Document
                                                            │
                                                            ▼
                                                      Split into Chunks
                                                            │
                                                            ▼
                                                    ┌───────────────┐
                                                    │  AI Service   │
                                                    │               │
                                                    │  1. Analyze   │
                                                    │  2. Translate │
                                                    │  3. Validate  │
                                                    └───────┬───────┘
                                                            │
                                                            ▼
                                                     Store Translation
                                                            │
                                                            ▼
                                                     Update Cache
                                                            │
                                                            ▼
                                                    WebSocket Update
                                                            │
                                                            ▼
                                                    Frontend Updates UI

3. COLLABORATION PHASE
   User A Edits ──> WebSocket ──> Collaboration Service ──> Broadcast
                                            │                     │
                                            ▼                     ▼
                                    Conflict Resolution      User B Receives
                                            │                     │
                                            ▼                     ▼
                                     Save to Database       Update UI
```

## 7. Deployment Pipeline

```
Development Environment:
├── Local Development
│   ├── docker-compose up
│   ├── Hot Reload Enabled
│   ├── Debug Logging
│   └── Admin Tools Available
│
├── Testing
│   ├── Unit Tests (Jest)
│   ├── Integration Tests
│   ├── E2E Tests (Cypress)
│   └── Load Tests (K6)
│
└── CI/CD Pipeline
    ├── GitHub Actions / GitLab CI
    ├── Build Docker Images
    ├── Run Tests
    ├── Security Scan
    └── Deploy to Environment

Staging Environment:
├── Deploy to Staging
│   ├── Docker Swarm / K8s
│   ├── Production-like Config
│   ├── Limited Access
│   └── Performance Testing
│
└── Validation
    ├── Smoke Tests
    ├── User Acceptance Testing
    └── Performance Metrics

Production Environment:
├── Blue-Green Deployment
│   ├── Deploy to Green
│   ├── Health Checks
│   ├── Switch Traffic
│   └── Monitor Metrics
│
├── Monitoring
│   ├── Application Metrics
│   ├── Error Tracking
│   ├── Performance Monitoring
│   └── User Analytics
│
└── Backup & Recovery
    ├── Database Backups
    ├── Document Storage Backup
    ├── Configuration Backup
    └── Disaster Recovery Plan
```

## 8. Security Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                        │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  1. NETWORK SECURITY                                     │
│     ├── HTTPS/TLS (Let's Encrypt)                       │
│     ├── Firewall Rules                                  │
│     ├── VPN for Admin Access                            │
│     └── DDoS Protection (Cloudflare)                    │
│                                                           │
│  2. APPLICATION SECURITY                                 │
│     ├── JWT Authentication                              │
│     ├── Role-Based Access Control (RBAC)                │
│     ├── Input Validation & Sanitization                 │
│     ├── SQL Injection Prevention                        │
│     ├── XSS Protection                                  │
│     └── CSRF Tokens                                     │
│                                                           │
│  3. API SECURITY                                         │
│     ├── Rate Limiting                                   │
│     ├── API Key Management                              │
│     ├── Request Signing                                 │
│     └── GraphQL Query Depth Limiting                    │
│                                                           │
│  4. DATA SECURITY                                        │
│     ├── Encryption at Rest (AES-256)                    │
│     ├── Encryption in Transit (TLS 1.3)                 │
│     ├── Database Encryption                             │
│     └── Secure File Storage                             │
│                                                           │
│  5. INFRASTRUCTURE SECURITY                              │
│     ├── Container Scanning                              │
│     ├── Secret Management (Vault)                       │
│     ├── Audit Logging                                   │
│     └── Compliance Monitoring                           │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

## 9. Scaling Strategy

```
Horizontal Scaling:
                    Load Balancer
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
   Frontend-1       Frontend-2       Frontend-N
        │                │                │
        └────────────────┼────────────────┘
                         ▼
                   API Gateway Cluster
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
   Service-1        Service-2        Service-N
        │                │                │
        └────────────────┼────────────────┘
                         ▼
                 Database Cluster
                    (Primary)
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
    Read-1           Read-2           Read-N
   (Replica)        (Replica)        (Replica)

Vertical Scaling Limits:
- Frontend: 2 CPU, 4GB RAM per instance
- API Gateway: 4 CPU, 8GB RAM per instance
- Services: 2 CPU, 4GB RAM per instance
- Database: 8 CPU, 32GB RAM (Primary)
- Cache: 2 CPU, 8GB RAM
```