# Backend Architecture - Translation Platform

## System Overview

### Architecture Goals
- **High Performance**: Handle document processing and real-time collaboration
- **Scalability**: Support multiple users with concurrent translations
- **Reliability**: Ensure document integrity and translation quality
- **Cloud Integration**: Leverage Baidu Cloud services for infrastructure
- **Real-time**: Support live collaboration and progress tracking

### Core Services Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   GraphQL       │    │   Microservices │
│   Next.js       │◄──►│   API Gateway   │◄──►│   Backend       │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │                        │
                              ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Baidu Cloud   │    │   Database      │
                       │   Services      │    │   Layer         │
                       │                 │    │                 │
                       └─────────────────┘    └─────────────────┘
```

## Technology Stack

### Core Backend Technologies
- **Runtime**: Node.js 20+ / Python 3.11+
- **API Framework**: Apollo GraphQL Server / Express.js
- **Database**: PostgreSQL 15+ (Primary), Redis (Cache/Sessions)
- **Message Queue**: Baidu BMQ / Redis Pub/Sub
- **File Processing**: Python (document parsing), Node.js (API layer)

### Baidu Cloud Services Integration
- **BOS (Object Storage)**: Document storage and CDN distribution
- **IAM**: User authentication and authorization
- **BMQ**: Real-time messaging and notifications
- **AI Cloud**: Translation and ERNIE Bot integration
- **Cloud Monitor**: System monitoring and logging
- **CDS**: Content delivery and caching

## Microservices Architecture

### 1. API Gateway Service
**Technology**: Node.js + Apollo GraphQL
**Responsibilities**:
- GraphQL API endpoint consolidation
- Authentication middleware
- Rate limiting and security
- Request routing to microservices
- Real-time subscriptions (WebSocket)

```javascript
// API Gateway Structure
services/
├── api-gateway/
│   ├── src/
│   │   ├── schema/           # GraphQL schemas
│   │   ├── resolvers/        # GraphQL resolvers
│   │   ├── middleware/       # Auth, validation, rate limiting
│   │   ├── subscriptions/    # WebSocket handlers
│   │   └── utils/           # Utilities
│   ├── package.json
│   └── Dockerfile
```

### 2. Document Processing Service
**Technology**: Python + FastAPI
**Responsibilities**:
- Document format parsing (PDF, DOCX, TXT, etc.)
- Content extraction and preprocessing
- Format preservation logic
- Integration with Baidu AI translation
- Post-processing and format reconstruction

```python
# Document Service Structure
services/
├── document-service/
│   ├── src/
│   │   ├── parsers/          # Format-specific parsers
│   │   ├── processors/       # Content processing
│   │   ├── formatters/       # Output formatting
│   │   ├── translation/      # Baidu AI integration
│   │   └── api/             # FastAPI endpoints
│   ├── requirements.txt
│   └── Dockerfile
```

### 3. User & Project Management Service
**Technology**: Node.js + Express
**Responsibilities**:
- User profile management
- Project CRUD operations
- Collaboration permissions
- Integration with Baidu IAM
- User preferences and settings

### 4. Real-time Collaboration Service
**Technology**: Node.js + Socket.io
**Responsibilities**:
- Document editing synchronization
- Comment system real-time updates
- Collaborative cursor tracking
- Presence awareness
- Conflict resolution

### 5. AI Integration Service
**Technology**: Node.js + Express
**Responsibilities**:
- ERNIE Bot chat integration
- Translation quality assessment
- AI-powered suggestions
- Context-aware translation improvements
- Conversation management

## Database Design

### PostgreSQL Schema

#### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    baidu_iam_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role user_role_enum NOT NULL DEFAULT 'READER',
    plan VARCHAR(100) NOT NULL DEFAULT 'free',
    preferences JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Projects Table
```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7),
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    default_settings JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Documents Table
```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    status document_status_enum NOT NULL DEFAULT 'PROCESSING',
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    source_language VARCHAR(10) NOT NULL,
    target_language VARCHAR(10) NOT NULL,
    translation_style translation_style_enum NOT NULL,
    specialization VARCHAR(100) NOT NULL,
    original_content TEXT,
    translated_content TEXT,
    bos_object_key VARCHAR(500) NOT NULL,
    file_url TEXT,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Comments Table
```sql
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    position JSONB NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Chat Messages Table
```sql
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    author chat_author_enum NOT NULL,
    message_type VARCHAR(100) NOT NULL,
    selected_text TEXT,
    position JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Redis Cache Structure
```
# User sessions
session:{sessionId} -> {userId, preferences, permissions}

# Document cache
document:{documentId} -> {content, metadata, collaborators}

# Real-time collaboration
collab:{documentId}:users -> Set of active user IDs
collab:{documentId}:cursors -> Hash of user cursors

# Translation progress
progress:{documentId} -> {status, progress, currentStep}
```

## Baidu Cloud Integration Layer

### 1. File Storage (BOS) Integration
```javascript
// BOS Service Implementation
class BOSService {
    constructor() {
        this.client = new BOS({
            endpoint: process.env.BAIDU_BOS_ENDPOINT,
            credentials: {
                ak: process.env.BAIDU_ACCESS_KEY,
                sk: process.env.BAIDU_SECRET_KEY
            }
        });
    }

    async uploadDocument(file, metadata) {
        const objectKey = `documents/${Date.now()}-${file.originalname}`;
        
        await this.client.putObject({
            Bucket: process.env.BOS_BUCKET,
            Key: objectKey,
            Body: file.buffer,
            ContentType: file.mimetype,
            Metadata: metadata
        });

        return {
            objectKey,
            url: `${process.env.CDN_BASE_URL}/${objectKey}`
        };
    }

    async getDownloadUrl(objectKey, format) {
        return this.client.generatePresignedUrl('getObject', {
            Bucket: process.env.BOS_BUCKET,
            Key: objectKey,
            Expires: 3600 // 1 hour
        });
    }
}
```

### 2. Authentication (IAM) Integration
```javascript
// IAM Service Implementation
class IAMService {
    constructor() {
        this.client = new BaiduIAM({
            accessKeyId: process.env.BAIDU_ACCESS_KEY,
            secretAccessKey: process.env.BAIDU_SECRET_KEY
        });
    }

    async validateToken(token) {
        try {
            const userInfo = await this.client.getUserInfo(token);
            return {
                isValid: true,
                user: userInfo
            };
        } catch (error) {
            return { isValid: false, error: error.message };
        }
    }

    async createUser(userData) {
        return await this.client.createUser(userData);
    }
}
```

### 3. Message Queue (BMQ) Integration
```javascript
// BMQ Service Implementation
class MessageQueueService {
    constructor() {
        this.client = new BaiduMQ({
            endpoint: process.env.BAIDU_BMQ_ENDPOINT,
            credentials: {
                ak: process.env.BAIDU_ACCESS_KEY,
                sk: process.env.BAIDU_SECRET_KEY
            }
        });
    }

    async publishTranslationProgress(documentId, progress) {
        await this.client.sendMessage({
            QueueName: 'translation-progress',
            MessageBody: JSON.stringify({
                documentId,
                progress,
                timestamp: new Date().toISOString()
            })
        });
    }

    async subscribeToProgress(callback) {
        this.client.receiveMessage({
            QueueName: 'translation-progress',
            WaitTimeSeconds: 20
        }, callback);
    }
}
```

### 4. AI Services Integration
```javascript
// AI Service Implementation
class AIService {
    constructor() {
        this.client = new BaiduAI({
            apiKey: process.env.BAIDU_AI_API_KEY,
            secretKey: process.env.BAIDU_AI_SECRET_KEY
        });
    }

    async translateDocument(content, sourceLanguage, targetLanguage, style) {
        const chunks = this.splitContent(content);
        const translatedChunks = [];

        for (const chunk of chunks) {
            const result = await this.client.translate({
                q: chunk,
                from: sourceLanguage,
                to: targetLanguage,
                action: this.getTranslationMode(style)
            });
            translatedChunks.push(result.trans_result[0].dst);
        }

        return translatedChunks.join('\n');
    }

    async chatWithERNIE(messages, context) {
        return await this.client.ernieBot.chat({
            messages: messages,
            temperature: 0.7,
            system: `You are a professional translation assistant. Context: ${context}`
        });
    }
}
```

## API Implementation

### GraphQL Schema Implementation
```javascript
// Schema definitions
const typeDefs = gql`
    type Query {
        me: User
        projects(limit: Int, offset: Int): [Project!]!
        document(id: ID!): Document
        searchDocuments(query: String!, projectId: ID): [Document!]!
        recentDocuments(limit: Int): [Document!]!
        chatHistory(documentId: ID!): [ChatMessage!]!
    }

    type Mutation {
        uploadDocument(input: UploadDocumentInput!): Document!
        updateDocumentContent(input: UpdateDocumentContentInput!): Document!
        createProject(input: CreateProjectInput!): Project!
        addComment(input: AddCommentInput!): Comment!
        sendChatMessage(input: SendChatMessageInput!): ChatMessage!
    }

    type Subscription {
        translationProgress(documentId: ID!): TranslationProgress!
        documentUpdated(documentId: ID!): Document!
        newComment(documentId: ID!): Comment!
        newChatMessage(documentId: ID!): ChatMessage!
    }
`;

// Resolver implementation
const resolvers = {
    Query: {
        me: async (_, __, { user }) => {
            return await UserService.findById(user.id);
        },
        document: async (_, { id }, { user }) => {
            return await DocumentService.findByIdWithPermissions(id, user);
        }
    },
    
    Mutation: {
        uploadDocument: async (_, { input }, { user }) => {
            return await DocumentService.create(input, user);
        },
        updateDocumentContent: async (_, { input }, { user }) => {
            const document = await DocumentService.update(input, user);
            pubsub.publish('DOCUMENT_UPDATED', { 
                documentUpdated: document,
                documentId: input.documentId 
            });
            return document;
        }
    },
    
    Subscription: {
        translationProgress: {
            subscribe: (_, { documentId }) => {
                return pubsub.asyncIterator([`TRANSLATION_PROGRESS_${documentId}`]);
            }
        }
    }
};
```

### Service Layer Implementation
```javascript
// Document Service
class DocumentService {
    static async create(input, user) {
        // 1. Validate BOS object exists
        const fileExists = await BOSService.objectExists(input.bosObjectKey);
        if (!fileExists) {
            throw new Error('File not found in storage');
        }

        // 2. Create document record
        const document = await Document.create({
            ...input,
            owner_id: user.id,
            status: 'PROCESSING'
        });

        // 3. Start translation process
        if (input.autoStart) {
            await this.startTranslation(document.id);
        }

        return document;
    }

    static async startTranslation(documentId) {
        // Queue translation job
        await MessageQueueService.publishTranslationJob(documentId);
    }

    static async processTranslation(documentId) {
        const document = await Document.findById(documentId);
        
        // 1. Download from BOS
        const content = await BOSService.getObjectContent(document.bos_object_key);
        
        // 2. Parse document
        const parsedContent = await DocumentParser.parse(content, document.file_type);
        
        // 3. Translate content
        const translatedContent = await AIService.translateDocument(
            parsedContent.text,
            document.source_language,
            document.target_language,
            document.translation_style
        );

        // 4. Reconstruct format
        const formattedOutput = await DocumentFormatter.reconstruct(
            parsedContent.structure,
            translatedContent
        );

        // 5. Update document
        await Document.update(documentId, {
            translated_content: formattedOutput,
            status: 'COMPLETED',
            progress: 100
        });

        // 6. Publish completion
        await MessageQueueService.publishTranslationProgress(documentId, {
            status: 'COMPLETED',
            progress: 100
        });
    }
}
```

## Real-time Collaboration Implementation

### WebSocket Handler
```javascript
// Collaboration Socket Handler
class CollaborationHandler {
    constructor(io) {
        this.io = io;
        this.setupEventHandlers();
    }

    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            socket.on('join-document', async (documentId, userId) => {
                // Validate permissions
                const hasAccess = await this.validateDocumentAccess(documentId, userId);
                if (!hasAccess) {
                    socket.emit('error', 'Access denied');
                    return;
                }

                // Join document room
                socket.join(`document:${documentId}`);
                
                // Update user presence
                await this.updateUserPresence(documentId, userId, 'online');
                
                // Notify other collaborators
                socket.to(`document:${documentId}`).emit('user-joined', {
                    userId,
                    timestamp: new Date()
                });
            });

            socket.on('content-change', async (data) => {
                const { documentId, changes, userId } = data;
                
                // Apply changes to document
                await DocumentService.applyChanges(documentId, changes, userId);
                
                // Broadcast to other collaborators
                socket.to(`document:${documentId}`).emit('content-updated', {
                    changes,
                    userId,
                    timestamp: new Date()
                });
            });

            socket.on('cursor-position', (data) => {
                const { documentId, position } = data;
                
                // Broadcast cursor position
                socket.to(`document:${documentId}`).emit('cursor-updated', {
                    userId: socket.userId,
                    position
                });
            });
        });
    }
}
```

## Document Processing Pipeline

### Processing Workflow
```python
# Document Processing Pipeline
class DocumentProcessor:
    def __init__(self):
        self.parsers = {
            'pdf': PDFParser(),
            'docx': DOCXParser(),
            'txt': TextParser()
        }
        self.ai_service = BaiduAIService()

    async def process_document(self, document_id: str):
        try:
            # 1. Update status
            await self.update_progress(document_id, 'PROCESSING', 10)
            
            # 2. Download from BOS
            document = await Document.get(document_id)
            content = await BOSService.download(document.bos_object_key)
            
            # 3. Parse document
            await self.update_progress(document_id, 'PROCESSING', 30)
            file_type = self.detect_file_type(content)
            parsed_data = await self.parsers[file_type].parse(content)
            
            # 4. Translate content
            await self.update_progress(document_id, 'TRANSLATING', 50)
            translated_text = await self.ai_service.translate(
                text=parsed_data.text,
                source_lang=document.source_language,
                target_lang=document.target_language,
                style=document.translation_style
            )
            
            # 5. Reconstruct format
            await self.update_progress(document_id, 'PROCESSING', 80)
            formatted_output = await self.reconstruct_format(
                parsed_data.structure,
                translated_text
            )
            
            # 6. Save results
            await self.update_progress(document_id, 'COMPLETED', 100)
            await Document.update(document_id, {
                'translated_content': formatted_output,
                'status': 'COMPLETED'
            })
            
        except Exception as e:
            await self.handle_error(document_id, str(e))

    async def update_progress(self, document_id: str, status: str, progress: int):
        # Update database
        await Document.update_progress(document_id, progress, status)
        
        # Publish to message queue
        await MessageQueue.publish('translation-progress', {
            'document_id': document_id,
            'status': status,
            'progress': progress,
            'timestamp': datetime.utcnow().isoformat()
        })
```

## Deployment Architecture

### Docker Configuration
```yaml
# docker-compose.yml
version: '3.8'
services:
  api-gateway:
    build: ./services/api-gateway
    ports:
      - "4000:4000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - BAIDU_ACCESS_KEY=${BAIDU_ACCESS_KEY}
    depends_on:
      - postgres
      - redis

  document-service:
    build: ./services/document-service
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - BAIDU_AI_API_KEY=${BAIDU_AI_API_KEY}
    depends_on:
      - postgres

  collaboration-service:
    build: ./services/collaboration-service
    ports:
      - "4001:4001"
    environment:
      - REDIS_URL=${REDIS_URL}
    depends_on:
      - redis

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=translation_platform
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### Infrastructure Requirements
- **API Gateway**: 2 vCPU, 4GB RAM (Auto-scaling)
- **Document Service**: 4 vCPU, 8GB RAM (CPU intensive)
- **Database**: PostgreSQL 15+ with read replicas
- **Cache**: Redis Cluster for session and real-time data
- **Message Queue**: Baidu BMQ for async processing
- **Storage**: Baidu BOS with CDN distribution

## Security & Performance

### Security Measures
- **Authentication**: Baidu IAM integration with JWT tokens
- **Authorization**: Role-based access control (RBAC)
- **Data Encryption**: TLS 1.3 in transit, AES-256 at rest
- **Input Validation**: Comprehensive validation for all inputs
- **Rate Limiting**: Per-user and per-endpoint rate limits
- **CORS**: Properly configured cross-origin policies

### Performance Optimizations
- **Database**: Connection pooling, query optimization, read replicas
- **Caching**: Multi-level caching (Redis, CDN, application)
- **File Processing**: Async queue-based processing
- **Real-time**: Optimized WebSocket connections with room management
- **CDN**: Baidu CDN for static assets and document delivery

## Monitoring & Observability

### Metrics & Logging
- **Application Metrics**: Response times, error rates, throughput
- **Business Metrics**: Translation success rate, user engagement
- **Infrastructure Metrics**: CPU, memory, disk, network usage
- **Logs**: Structured logging with correlation IDs
- **Tracing**: Distributed tracing for request flows

### Health Checks
- **API Health**: GraphQL endpoint availability
- **Database Health**: Connection and query performance
- **External Services**: Baidu Cloud service availability
- **Message Queue**: Queue depth and processing rates

This backend architecture provides a robust, scalable foundation for the translation platform, leveraging Baidu Cloud services while maintaining high performance and reliability for real-time collaboration and document processing.