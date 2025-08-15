# Translation Platform API

## Data Models

### User
```graphql
type User {
  id: ID!
  name: String!
  email: String!
  role: UserRole!
  plan: String!
  projects: [Project!]
  documents: [Document!]
  preferences: UserPreferences
}

```

### Document
```graphql
type Document {
  id: ID!
  title: String!
  status: DocumentStatus!
  progress: Int!
  sourceLanguage: String!
  targetLanguage: String!
  translationStyle: TranslationStyle!
  specialization: String!
  originalContent: String!
  translatedContent: String!
  fileUrl: String!
  downloadLinks: [DownloadLink!]!
  project: Project
  owner: User!
  collaborators: [User!]!
  comments: [Comment!]!
  chatHistory: [ChatMessage!]!
  createdAt: String!
  updatedAt: String!
}

type DownloadLink {
  format: String!
  url: String!
  fileSize: Int!
  expiresAt: String!
}
```

### Project
```graphql
type Project {
  id: ID!
  name: String!
  description: String
  color: String
  defaultSettings: ProjectSettings!
  documents: [Document!]!
  collaborators: [User!]!
  owner: User!
  createdAt: String!
  updatedAt: String!
}

type ProjectSettings {
  defaultSourceLanguage: String!
  defaultTargetLanguage: String!
  defaultTranslationStyle: TranslationStyle!
  defaultSpecialization: String!
  requireReview: Boolean!
}
```

### Chat
```graphql
type ChatMessage {
  id: ID!
  content: String!
  author: ChatMessageAuthor!
  messageType: String!
  selectedText: String
  position: CommentPosition
  createdAt: String!
}
```

### Progress
```graphql
type TranslationProgress {
  documentId: ID!
  status: DocumentStatus!
  progress: Int!
  currentStep: String!
  estimatedTimeRemaining: Int
  error: String
}

type CollaboratorStatus {
  user: User!
  status: String!
  lastSeen: String!
  currentSelection: SelectionRange
}
```

### Configuration
```graphql
type Language {
  code: String!
  name: String!
  nativeName: String!
  isAutoDetected: Boolean!
  supportedAsSource: Boolean!
  supportedAsTarget: Boolean!
}

type TranslationSpecialization {
  key: String!
  title: String!
  description: String!
  requiresExpertise: Boolean!
}
```

## Enums

```graphql
enum UserRole {
  READER
  TRANSLATOR
  ADMIN
  ENTERPRISE
}

enum DocumentStatus {
  PROCESSING
  TRANSLATING  # preview
  REVIEWING
  COMPLETED
  FAILED
}

enum TranslationStyle {
  GENERAL
  ACADEMIC
  BUSINESS
  LEGAL
  TECHNICAL
  CREATIVE
  MEDICAL
  FINANCIAL
}

enum ChatMessageAuthor {
  USER
  AI
}
```

## Input Types

```graphql
input UploadDocumentInput {
  bosObjectKey: String!
  fileName: String!
  fileSize: Int!
  sourceLanguage: String!
  targetLanguage: String!
  translationStyle: TranslationStyle!
  specialization: String!
  projectId: ID
  outputFormats: [String!]!
  autoStart: Boolean
}

input UpdateDocumentContentInput {
  documentId: ID!
  content: String!
  editType: String!
  selectionStart: Int
  selectionEnd: Int
}

input CreateProjectInput {
  name: String!
  description: String
  color: String
  defaultSettings: ProjectSettingsInput!
  collaboratorEmails: [String!]
}

input ProjectSettingsInput {
  defaultSourceLanguage: String!
  defaultTargetLanguage: String!
  defaultTranslationStyle: TranslationStyle!
  defaultSpecialization: String!
  autoStart: Boolean!
  requireReview: Boolean!
}


input SendChatMessageInput {
  documentId: ID!
  content: String!
  selectedText: String
  messageType: String!
}

input UpdateUserPreferencesInput {
  defaultSourceLanguage: String
  defaultTargetLanguage: String
  defaultTranslationStyle: TranslationStyle
  autoSave: Boolean
  emailNotifications: Boolean
  theme: String
}

input SharePermissions {
  canView: Boolean!
  canComment: Boolean!
  canEdit: Boolean!
  canShare: Boolean!
  canDownload: Boolean!
}
```

## Queries

```graphql
type Query {
  me: User
  projects(limit: Int, offset: Int): [Project!]!
  project(id: ID!): Project
  document(id: ID!): Document
  searchDocuments(query: String!, projectId: ID): [Document!]!
  recentDocuments(limit: Int): [Document!]!
  chatHistory(documentId: ID!): [ChatMessage!]!
  translationSpecializations: [TranslationSpecialization!]!
  supportedLanguages: [Language!]!
  documentDownloadLinks(documentId: ID!): [DownloadLink!]!
}
```

## Mutations

```graphql
type Mutation {
  createProject(input: CreateProjectInput!): Project!
  updateProject(id: ID!, input: UpdateProjectInput!): Project!
  deleteProject(id: ID!): Boolean!
  
  uploadDocument(input: UploadDocumentInput!): Document!
  updateDocumentContent(input: UpdateDocumentContentInput!): Document!
  retranslateDocument(documentId: ID!, targetLanguage: String, translationStyle: TranslationStyle): Document!
  deleteDocument(id: ID!): Boolean!
  
  shareDocument(documentId: ID!, userEmail: String!, permissions: SharePermissions!): Boolean!
  
  sendChatMessage(input: SendChatMessageInput!): ChatMessage!
  clearChatHistory(documentId: ID!): Boolean!
  
  updateUserPreferences(input: UpdateUserPreferencesInput!): User!
}
```

## Subscriptions

```graphql
type Subscription {
  translationProgress(documentId: ID!): TranslationProgress!
  documentUpdated(documentId: ID!): Document!
  collaboratorStatusChanged(documentId: ID!): CollaboratorStatus!
  newComment(documentId: ID!): Comment!
  newChatMessage(documentId: ID!): ChatMessage!
}
```

## Error Handling

```graphql
type APIError {
  code: ErrorCode!
  message: String!
  details: String
  service: String
}

enum ErrorCode {
  DOCUMENT_NOT_FOUND
  TRANSLATION_FAILED
  PERMISSION_DENIED
  BAIDU_BOS_ERROR
  BAIDU_AI_ERROR
  BAIDU_IAM_ERROR
  NETWORK_ERROR
  RATE_LIMIT_EXCEEDED
  UNKNOWN_ERROR
}
```

## Baidu Cloud Integration

### File Upload (BOS)
```javascript
const uploadToBOS = async (file) => {
  const uploadUrl = await getBOSUploadUrl(file.name);
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    body: file
  });
  return response.headers.get('x-bos-object-key');
};
```

### Authentication (IAM)
```javascript
import { BaiduIAM } from '@baidu-cloud/iam-sdk';

const iam = new BaiduIAM({
  accessKeyId: process.env.BAIDU_ACCESS_KEY,
  secretAccessKey: process.env.BAIDU_SECRET_KEY
});
```

### Real-time Communication (BMQ)
```javascript
import { BaiduMQ } from '@baidu-cloud/bmq-sdk';

const bmq = new BaiduMQ({
  endpoint: process.env.BAIDU_BMQ_ENDPOINT
});

bmq.subscribe('translation-progress', (message) => {
  const progress = JSON.parse(message.body);
  io.to(progress.documentId).emit('translation-progress', progress);
});
```

### AI Services
```javascript
import { BaiduAI } from '@baidu-cloud/ai-sdk';

const ai = new BaiduAI({
  apiKey: process.env.BAIDU_AI_API_KEY,
  secretKey: process.env.BAIDU_AI_SECRET_KEY
});

const translateDocument = async (content, from, to) => {
  return await ai.translate({
    q: content,
    from: from,
    to: to
  });
};

const chatWithERNIE = async (messages) => {
  return await ai.ernieBot.chat({
    messages: messages,
    temperature: 0.7
  });
};
```