# API Usage Examples

## GraphQL API Reference

### Base URL
- **Development**: `http://localhost:4000/graphql`
- **Production**: `https://api.translation-platform.com/graphql`

### Authentication Headers
```javascript
{
  "Authorization": "Bearer YOUR_JWT_TOKEN",
  "Content-Type": "application/json"
}
```

## 1. Authentication Examples

### User Registration
```graphql
mutation RegisterUser {
  register(input: {
    email: "user@example.com"
    password: "securePassword123"
    fullName: "John Doe"
  }) {
    user {
      id
      email
      fullName
      createdAt
    }
    accessToken
    refreshToken
  }
}
```

**JavaScript Example:**
```javascript
const registerUser = async (userData) => {
  const response = await fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: `
        mutation RegisterUser($input: RegisterInput!) {
          register(input: $input) {
            user {
              id
              email
              fullName
            }
            accessToken
          }
        }
      `,
      variables: {
        input: userData
      }
    })
  });

  const result = await response.json();
  return result.data.register;
};

// Usage
const newUser = await registerUser({
  email: "john@example.com",
  password: "securePassword123",
  fullName: "John Doe"
});
```

### User Login
```graphql
mutation LoginUser {
  login(input: {
    email: "user@example.com"
    password: "securePassword123"
  }) {
    user {
      id
      email
      fullName
    }
    accessToken
    refreshToken
  }
}
```

**React Hook Example:**
```typescript
// hooks/useAuth.ts
import { useState } from 'react';
import { gql, useMutation } from '@apollo/client';

const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      user {
        id
        email
        fullName
      }
      accessToken
    }
  }
`;

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loginMutation] = useMutation(LOGIN_MUTATION);

  const login = async (email: string, password: string) => {
    try {
      const { data } = await loginMutation({
        variables: {
          input: { email, password }
        }
      });

      setUser(data.login.user);
      localStorage.setItem('token', data.login.accessToken);
      
      return data.login;
    } catch (error) {
      throw new Error('Login failed');
    }
  };

  return { user, login };
}
```

### Token Refresh
```graphql
mutation RefreshToken {
  refreshToken(refreshToken: "YOUR_REFRESH_TOKEN") {
    accessToken
    refreshToken
  }
}
```

## 2. Document Management Examples

### Get Documents List
```graphql
query GetDocuments {
  documents(page: 1, limit: 10, filter: { search: "translation" }) {
    documents {
      id
      title
      content
      sourceLanguage
      targetLanguage
      status
      createdAt
      updatedAt
      author {
        id
        fullName
      }
      wordCount
    }
    pageInfo {
      page
      limit
      total
      hasNextPage
      hasPrevPage
    }
  }
}
```

**React Component Example:**
```typescript
import { useQuery, gql } from '@apollo/client';

const GET_DOCUMENTS = gql`
  query GetDocuments($page: Int, $limit: Int, $filter: DocumentFilter) {
    documents(page: $page, limit: $limit, filter: $filter) {
      documents {
        id
        title
        status
        createdAt
        wordCount
      }
      pageInfo {
        total
        hasNextPage
      }
    }
  }
`;

export function DocumentsList() {
  const { data, loading, error, fetchMore } = useQuery(GET_DOCUMENTS, {
    variables: { page: 1, limit: 10 }
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const loadMore = () => {
    fetchMore({
      variables: { page: Math.floor(data.documents.documents.length / 10) + 1 },
      updateQuery: (prev, { fetchMoreResult }) => {
        return {
          documents: {
            ...fetchMoreResult.documents,
            documents: [
              ...prev.documents.documents,
              ...fetchMoreResult.documents.documents
            ]
          }
        };
      }
    });
  };

  return (
    <div>
      {data.documents.documents.map(doc => (
        <div key={doc.id}>
          <h3>{doc.title}</h3>
          <p>Words: {doc.wordCount} | Status: {doc.status}</p>
        </div>
      ))}
      {data.documents.pageInfo.hasNextPage && (
        <button onClick={loadMore}>Load More</button>
      )}
    </div>
  );
}
```

### Create Document
```graphql
mutation CreateDocument {
  createDocument(input: {
    title: "My Translation Project"
    content: "This is the original text to be translated..."
    sourceLanguage: "EN"
    targetLanguage: "ES"
    projectId: "project-uuid"
  }) {
    id
    title
    content
    status
    createdAt
  }
}
```

**Form Submission Example:**
```typescript
import { useState } from 'react';
import { useMutation, gql } from '@apollo/client';

const CREATE_DOCUMENT = gql`
  mutation CreateDocument($input: CreateDocumentInput!) {
    createDocument(input: $input) {
      id
      title
      status
    }
  }
`;

export function CreateDocumentForm() {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    sourceLanguage: 'EN',
    targetLanguage: 'ES'
  });
  
  const [createDocument, { loading }] = useMutation(CREATE_DOCUMENT, {
    onCompleted: (data) => {
      console.log('Document created:', data.createDocument);
      // Redirect or show success message
    },
    onError: (error) => {
      console.error('Error creating document:', error);
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createDocument({
      variables: {
        input: formData
      }
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={formData.title}
        onChange={(e) => setFormData({...formData, title: e.target.value})}
        placeholder="Document title"
        required
      />
      <textarea
        value={formData.content}
        onChange={(e) => setFormData({...formData, content: e.target.value})}
        placeholder="Content to translate"
        required
      />
      <select
        value={formData.sourceLanguage}
        onChange={(e) => setFormData({...formData, sourceLanguage: e.target.value})}
      >
        <option value="EN">English</option>
        <option value="ES">Spanish</option>
        <option value="FR">French</option>
      </select>
      <select
        value={formData.targetLanguage}
        onChange={(e) => setFormData({...formData, targetLanguage: e.target.value})}
      >
        <option value="ES">Spanish</option>
        <option value="EN">English</option>
        <option value="FR">French</option>
      </select>
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Document'}
      </button>
    </form>
  );
}
```

### Update Document
```graphql
mutation UpdateDocument {
  updateDocument(
    id: "document-uuid"
    input: {
      title: "Updated Title"
      content: "Updated content..."
      status: "IN_PROGRESS"
    }
  ) {
    id
    title
    content
    status
    updatedAt
  }
}
```

### Delete Document
```graphql
mutation DeleteDocument {
  deleteDocument(id: "document-uuid") {
    success
    message
  }
}
```

## 3. Project Management Examples

### Get Projects with Documents
```graphql
query GetProjects {
  projects {
    id
    name
    description
    status
    createdAt
    documents {
      id
      title
      status
      wordCount
    }
    members {
      id
      user {
        fullName
        email
      }
      role
      joinedAt
    }
  }
}
```

### Create Project
```graphql
mutation CreateProject {
  createProject(input: {
    name: "Website Translation"
    description: "Translating company website to Spanish"
  }) {
    id
    name
    description
    status
    createdAt
  }
}
```

### Add Member to Project
```graphql
mutation AddProjectMember {
  addProjectMember(
    projectId: "project-uuid"
    userId: "user-uuid"
    role: "TRANSLATOR"
  ) {
    id
    role
    joinedAt
    user {
      fullName
      email
    }
  }
}
```

## 4. AI Translation Examples

### Get AI Translation
```graphql
mutation GetAITranslation {
  translateText(input: {
    text: "Hello, how are you today?"
    sourceLanguage: "EN"
    targetLanguage: "ES"
    context: "casual_conversation"
  }) {
    translatedText
    confidence
    alternatives {
      text
      confidence
    }
    suggestions {
      type
      message
      correction
    }
  }
}
```

**Real-time Translation Component:**
```typescript
import { useState, useCallback, useDebounce } from 'react';
import { useMutation, gql } from '@apollo/client';

const TRANSLATE_TEXT = gql`
  mutation TranslateText($input: TranslateInput!) {
    translateText(input: $input) {
      translatedText
      confidence
      alternatives {
        text
        confidence
      }
    }
  }
`;

export function TranslationEditor() {
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [confidence, setConfidence] = useState(0);
  
  const [translateText, { loading }] = useMutation(TRANSLATE_TEXT, {
    onCompleted: (data) => {
      setTranslatedText(data.translateText.translatedText);
      setConfidence(data.translateText.confidence);
    }
  });

  // Debounce translation to avoid too many API calls
  const debouncedTranslate = useCallback(
    debounce(async (text) => {
      if (text.trim()) {
        await translateText({
          variables: {
            input: {
              text,
              sourceLanguage: 'EN',
              targetLanguage: 'ES'
            }
          }
        });
      }
    }, 500),
    [translateText]
  );

  const handleSourceChange = (e) => {
    const text = e.target.value;
    setSourceText(text);
    debouncedTranslate(text);
  };

  return (
    <div className="translation-editor">
      <div className="source-panel">
        <textarea
          value={sourceText}
          onChange={handleSourceChange}
          placeholder="Enter text to translate..."
          className="source-textarea"
        />
      </div>
      <div className="target-panel">
        <textarea
          value={translatedText}
          onChange={(e) => setTranslatedText(e.target.value)}
          placeholder="Translation will appear here..."
          className="target-textarea"
        />
        {confidence > 0 && (
          <div className="confidence-indicator">
            Confidence: {Math.round(confidence * 100)}%
          </div>
        )}
        {loading && <div className="loading">Translating...</div>}
      </div>
    </div>
  );
}
```

### Get Grammar Suggestions
```graphql
mutation GetGrammarSuggestions {
  checkGrammar(input: {
    text: "This are a example of text with grammar errors."
    language: "EN"
  }) {
    suggestions {
      start
      end
      type
      message
      corrections
      confidence
    }
    correctedText
  }
}
```

## 5. File Upload Examples

### Upload Document File
```graphql
mutation UploadDocument($file: Upload!) {
  uploadDocument(file: $file) {
    id
    title
    content
    originalFileName
    fileSize
    mimeType
  }
}
```

**File Upload Component:**
```typescript
import { useState } from 'react';
import { useMutation, gql } from '@apollo/client';

const UPLOAD_DOCUMENT = gql`
  mutation UploadDocument($file: Upload!) {
    uploadDocument(file: $file) {
      id
      title
      content
      originalFileName
    }
  }
`;

export function FileUpload() {
  const [uploadDocument, { loading, error }] = useMutation(UPLOAD_DOCUMENT, {
    onCompleted: (data) => {
      console.log('File uploaded:', data.uploadDocument);
    }
  });

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a PDF, DOCX, or TXT file');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    try {
      await uploadDocument({
        variables: { file }
      });
    } catch (err) {
      console.error('Upload error:', err);
    }
  };

  return (
    <div className="file-upload">
      <input
        type="file"
        accept=".pdf,.docx,.txt"
        onChange={handleFileSelect}
        disabled={loading}
      />
      {loading && <div>Uploading...</div>}
      {error && <div>Error: {error.message}</div>}
    </div>
  );
}
```

## 6. Real-time Subscriptions

### Document Updates Subscription
```graphql
subscription DocumentUpdated {
  documentUpdated(documentId: "document-uuid") {
    id
    title
    content
    status
    updatedAt
    updatedBy {
      fullName
    }
  }
}
```

**WebSocket Subscription Example:**
```typescript
import { useSubscription, gql } from '@apollo/client';

const DOCUMENT_UPDATED = gql`
  subscription DocumentUpdated($documentId: ID!) {
    documentUpdated(documentId: $documentId) {
      id
      content
      updatedAt
      updatedBy {
        fullName
      }
    }
  }
`;

export function CollaborativeEditor({ documentId }) {
  const { data, loading } = useSubscription(DOCUMENT_UPDATED, {
    variables: { documentId },
    onSubscriptionData: ({ subscriptionData }) => {
      const update = subscriptionData.data.documentUpdated;
      console.log('Document updated by:', update.updatedBy.fullName);
      // Update local state or show notification
    }
  });

  return (
    <div>
      {/* Editor content */}
      {data && (
        <div className="update-notification">
          Document updated by {data.documentUpdated.updatedBy.fullName}
        </div>
      )}
    </div>
  );
}
```

### Collaboration Events
```graphql
subscription CollaborationEvents {
  collaborationEvent(documentId: "document-uuid") {
    type
    userId
    user {
      fullName
    }
    data
    timestamp
  }
}
```

## 7. Error Handling Examples

### GraphQL Error Handling
```typescript
import { ApolloError } from '@apollo/client';

const handleGraphQLError = (error: ApolloError) => {
  if (error.graphQLErrors.length > 0) {
    error.graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(
        `GraphQL error: Message: ${message}, Location: ${locations}, Path: ${path}`
      );
    });
  }

  if (error.networkError) {
    console.error('Network error:', error.networkError);
    
    // Handle specific HTTP errors
    if (error.networkError.statusCode === 401) {
      // Redirect to login
      window.location.href = '/login';
    } else if (error.networkError.statusCode >= 500) {
      // Show server error message
      alert('Server error. Please try again later.');
    }
  }
};

// Usage in component
const [createDocument] = useMutation(CREATE_DOCUMENT, {
  onError: handleGraphQLError
});
```

### Retry Logic Example
```typescript
import { useQuery } from '@apollo/client';

const { data, loading, error, refetch } = useQuery(GET_DOCUMENTS, {
  errorPolicy: 'all',
  notifyOnNetworkStatusChange: true,
  onError: (error) => {
    // Auto-retry on network error
    if (error.networkError) {
      setTimeout(() => {
        refetch();
      }, 5000);
    }
  }
});
```

## 8. Performance Optimization Examples

### Query Batching
```typescript
import { BatchHttpLink } from '@apollo/client/link/batch-http';

const batchLink = new BatchHttpLink({
  uri: 'http://localhost:4000/graphql',
  batchMax: 5, // Max 5 queries per batch
  batchInterval: 20, // Wait 20ms before sending batch
});
```

### Fragment Usage
```graphql
fragment DocumentDetails on Document {
  id
  title
  content
  status
  createdAt
  updatedAt
  wordCount
}

query GetDocument($id: ID!) {
  document(id: $id) {
    ...DocumentDetails
    author {
      id
      fullName
    }
  }
}

query GetDocuments {
  documents {
    documents {
      ...DocumentDetails
    }
  }
}
```

### Cache Configuration
```typescript
import { InMemoryCache } from '@apollo/client';

const cache = new InMemoryCache({
  typePolicies: {
    Document: {
      fields: {
        comments: {
          merge(existing = [], incoming) {
            return [...existing, ...incoming];
          }
        }
      }
    }
  }
});
```