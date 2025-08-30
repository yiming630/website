# GraphQL API

GraphQL schema, resolvers, and testing for the Translation Platform.

## Quick Start

```bash
# Test GraphQL API
node test-api.js

# Or from project root
npm run api:test
```

## Structure

- **`schema.js`** - GraphQL type definitions and schema
- **`resolvers/`** - Query/mutation implementations
- **`test-api.js`** - Comprehensive API testing script

## Core Features

### Authentication
- User signup/signin with JWT
- Password hashing with bcryptjs
- Session management

### User Management
- Profile updates
- Password changes
- Role-based access (translator/admin)

### Project Management
- Create/update/delete projects
- Language pair configuration
- Status tracking (draft/active/completed)

### Document Handling
- File upload and metadata
- Translation job management
- Progress tracking
- AI chat integration

## Testing

The `test-api.js` script validates:
- ✅ Health check endpoint
- ✅ GraphQL introspection
- ✅ System statistics
- ✅ User authentication
- ✅ Authenticated queries
- ✅ CRUD operations
- ✅ Error handling

## Usage Example

```javascript
// Authentication
mutation {
  signIn(input: { email: "test@example.com", password: "test123" }) {
    token
    user { id email fullName }
  }
}

// Create project
mutation {
  createProject(input: {
    name: "My Translation"
    sourceLanguage: "en"
    targetLanguage: "zh"
  }) {
    id name status
  }
}

// Get my projects
query {
  myProjects {
    id name status
    documents { id originalFilename status }
  }
}
```