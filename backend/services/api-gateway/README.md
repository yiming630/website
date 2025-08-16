# API Gateway Service

The API Gateway is the central entry point for all client requests in the Translation Platform. It provides a unified GraphQL API that consolidates functionality from multiple microservices and external services.

## Features

- **GraphQL API**: Single endpoint for all data operations
- **Real-time Subscriptions**: WebSocket support for live updates
- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Rate Limiting**: Configurable rate limits for different endpoints
- **Microservices Integration**: Communication with document, collaboration, and file processing services
- **Baidu Cloud Integration**: File storage (BOS), AI translation, and authentication (IAM)
- **Error Handling**: Comprehensive error handling and logging
- **Health Monitoring**: Health checks and metrics endpoints
- **Security**: CORS, Helmet, and input validation

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │   Microservices │
│   Next.js       │◄──►│   GraphQL       │◄──►│   Backend       │
│                 │    │   WebSocket     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │                        │
                              ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Baidu Cloud   │    │   Database      │
                       │   Services      │    │   PostgreSQL    │
                       │                 │    │                 │
                       └─────────────────┘    └─────────────────┘
```

## API Endpoints

### GraphQL
- **Main**: `POST /graphql`
- **WebSocket**: `WS /graphql` (for subscriptions)
- **Playground**: `GET /graphql` (development only)

### REST
- **Health Check**: `GET /health`
- **Metrics**: `GET /metrics`

## GraphQL Schema

### Queries
- `me`: Get current user
- `projects`: List user's projects
- `project(id)`: Get specific project
- `document(id)`: Get specific document
- `searchDocuments(query)`: Search documents
- `recentDocuments`: Get recent documents
- `chatHistory(documentId)`: Get document chat history
- `translationSpecializations`: Get available specializations
- `supportedLanguages`: Get supported languages

### Mutations
- **Authentication**: `login`, `register`, `refreshToken`, `logout`
- **Projects**: `createProject`, `updateProject`, `deleteProject`
- **Documents**: `uploadDocument`, `updateDocumentContent`, `retranslateDocument`, `deleteDocument`
- **Sharing**: `shareDocument`
- **Comments**: `addComment`, `resolveComment`
- **Chat**: `sendChatMessage`, `clearChatHistory`
- **User**: `updateUserPreferences`

### Subscriptions
- `translationProgress(documentId)`: Real-time translation progress
- `documentUpdated(documentId)`: Document content updates
- `collaboratorStatusChanged(documentId)`: Collaborator presence
- `newComment(documentId)`: New comments
- `newChatMessage(documentId)`: New chat messages

## Environment Variables

Copy `env.example` to `.env` and configure:

```bash
# Server
NODE_ENV=development
PORT=4000
HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/db

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# Baidu Cloud
BAIDU_ACCESS_KEY=your-access-key
BAIDU_SECRET_KEY=your-secret-key
BAIDU_BOS_ENDPOINT=bj.bcebos.com
BAIDU_BOS_BUCKET=your-bucket

# Microservices
DOCUMENT_SERVICE_URL=http://document-service:5000
COLLABORATION_SERVICE_URL=http://collaboration-service:4001
```

## Installation

```bash
# Install dependencies
npm install

# Set up environment
cp env.example .env
# Edit .env with your configuration

# Start development server
npm run dev

# Start production server
npm start
```

## Docker

```bash
# Build image
docker build -t api-gateway .

# Run container
docker run -p 4000:4000 --env-file .env api-gateway
```

## Development

### Project Structure
```
src/
├── schema/           # GraphQL schema definitions
├── resolvers/        # GraphQL resolvers
├── middleware/       # Authentication, rate limiting
├── utils/           # Utilities and helpers
└── server.js        # Main server file
```

### Adding New Resolvers

1. Create resolver file in `src/resolvers/`
2. Export Query, Mutation, and/or Subscription objects
3. Add to `src/resolvers/index.js`
4. Add corresponding types to `src/schema/typeDefs.js`

### Error Handling

Use the ErrorHandler utility for consistent error responses:

```javascript
const ErrorHandler = require('../utils/errorHandler');

// In resolver
try {
  // Your logic
} catch (error) {
  throw ErrorHandler.handle(error, { context: 'resolver-name' });
}
```

### Validation

Use the Validation utility for input validation:

```javascript
const Validation = require('../utils/validation');

// In resolver
const validatedData = Validation.validateDocumentUpload(input);
```

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run API tests
npm run test:api
```

## Monitoring

### Health Check
```bash
curl http://localhost:4000/health
```

### Metrics
```bash
curl http://localhost:4000/metrics
```

### Logs
Check application logs for errors and performance metrics.

## Security

- **Authentication**: JWT tokens with refresh mechanism
- **Authorization**: Role-based access control
- **Rate Limiting**: Per-endpoint rate limits
- **Input Validation**: Comprehensive validation for all inputs
- **CORS**: Properly configured cross-origin policies
- **Helmet**: Security headers

## Performance

- **Connection Pooling**: Database connection pooling
- **Caching**: Redis for session and cache data
- **Compression**: Response compression
- **Rate Limiting**: Prevents abuse
- **Error Handling**: Graceful error handling

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check DATABASE_URL in .env
   - Ensure PostgreSQL is running
   - Verify network connectivity

2. **JWT Token Issues**
   - Check JWT_SECRET configuration
   - Verify token expiration settings
   - Check token format in requests

3. **Microservice Communication**
   - Verify microservice URLs in .env
   - Check network connectivity between services
   - Review service health endpoints

4. **Baidu Cloud Integration**
   - Verify Baidu credentials
   - Check BOS bucket configuration
   - Ensure AI service API keys are valid

### Debug Mode

Set `NODE_ENV=development` for detailed error messages and GraphQL playground.

## Contributing

1. Follow the existing code structure
2. Add proper error handling
3. Include input validation
4. Write tests for new features
5. Update documentation

## License

MIT License - see LICENSE file for details. 