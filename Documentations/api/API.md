# Translation Platform API Documentation

## Overview
本API基于GraphQL实现，提供文档翻译平台的核心功能。主要特性包括：
- **自动语言检测**：源语言现在支持自动检测，无需用户手动输入
- **实时翻译进度**：通过WebSocket订阅获取翻译进度
- **多格式支持**：PDF、DOCX、EPUB、TXT、MOBI、AZW格式
- **AI集成**：支持AI聊天助手和智能翻译优化

## Scalar Types
```graphql
scalar JSON      # 用于存储复杂对象数据
scalar DateTime  # ISO 8601格式的日期时间
```

## Data Models

### User
```graphql
type User {
  id: ID!
  name: String!
  email: String!
  role: UserRole!
  plan: String!
  preferences: JSON
  createdAt: DateTime!
  lastLogin: DateTime
  projects: [Project!]!
  documents: [Document!]!

```

### Document
```graphql
type Document {
  id: ID!
  title: String!
  status: DocumentStatus!
  progress: Int!
  sourceLanguage: String!  # 自动检测，不需要用户手动输入
  targetLanguage: String!
  translationStyle: TranslationStyle!
  specialization: String!
  originalContent: String
  translatedContent: String
  fileUrl: String
  fileSize: Int
  fileType: String
  project: Project
  owner: User!
  collaborators: [User!]!
  chatHistory: [ChatMessage!]!
  downloadLinks: [DownloadLink!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type DownloadLink {
  id: ID!
  format: String!
  url: String!
  fileSize: Int
  expiresAt: DateTime!
  createdAt: DateTime!
}
```

### Project
```graphql
type Project {
  id: ID!
  name: String!
  description: String
  color: String!
  owner: User!
  defaultSettings: ProjectSettings!
  documents: [Document!]!
  collaborators: [User!]!
  createdAt: DateTime!
  updatedAt: DateTime!
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
  position: JSON
  createdAt: DateTime!
}
```

### Progress
```graphql
type TranslationProgress {
  documentId: ID!
  status: DocumentStatus!
  progress: Int!
  currentStep: String!  # 现在包括：文档分割中、提交给AI翻译、文档整合中、自动排版与优化
  estimatedTimeRemaining: Int
  error: String
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
  title: String!
  sourceLanguage: String!  # 现在支持自动检测，传入 "auto" 即可
  targetLanguage: String!
  translationStyle: TranslationStyle!
  specialization: String!
  projectId: ID
  fileUrl: String!
  fileSize: Int
  fileType: String
}

# UpdateDocumentContentInput 已被移除
# 文档内容更新现在通过其他方式处理（如重新翻译、编辑器直接修改等）

input CreateProjectInput {
  name: String!
  description: String
  color: String
  defaultSettings: ProjectSettingsInput!
}

input ProjectSettingsInput {
  defaultSourceLanguage: String!
  defaultTargetLanguage: String!
  defaultTranslationStyle: TranslationStyle!
  defaultSpecialization: String!
  requireReview: Boolean!
}


input SendChatMessageInput {
  documentId: ID!
  content: String!
  messageType: String!
  selectedText: String
  position: JSON
}

input UpdateUserPreferencesInput {
  defaultSourceLanguage: String
  defaultTargetLanguage: String
  defaultTranslationStyle: TranslationStyle
  autoSave: Boolean
  emailNotifications: Boolean
  theme: String
}

input RegisterInput {
  name: String!
  email: String!
  password: String!
  role: UserRole = READER
}

input LoginInput {
  email: String!
  password: String!
}

input RefreshTokenInput {
  refreshToken: String!
}

input UpdateUserProfileInput {
  name: String
  email: String
}

input TranslateTextInput {
  text: String!
  sourceLanguage: String!  # 支持 "auto" 自动检测
  targetLanguage: String!
  style: String
}

input ImproveTranslationInput {
  originalText: String!
  currentTranslation: String!
  sourceLanguage: String!
  targetLanguage: String!
  feedback: String
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
  # User queries
  me: User
  user(id: ID!): User
  users(page: Int, limit: Int): UsersResponse

  # Project queries
  projects(limit: Int, offset: Int): [Project!]!
  project(id: ID!): Project

  # Document queries
  document(id: ID!): Document
  documents(projectId: ID, limit: Int, offset: Int): [Document!]!
  searchDocuments(query: String!, projectId: ID): [Document!]!
  recentDocuments(limit: Int): [Document!]!

  # Chat queries
  chatHistory(documentId: ID!): [ChatMessage!]!

  # Configuration queries
  supportedLanguages: [Language!]!
  translationSpecializations: [TranslationSpecialization!]!
}
```

## Mutations

```graphql
type Mutation {
  # Authentication mutations
  register(input: RegisterInput!): AuthPayload!
  login(input: LoginInput!): AuthPayload!
  refreshToken(input: RefreshTokenInput!): AuthTokens!
  logout(refreshToken: String): LogoutResponse!

  # User mutations
  updateProfile(input: UpdateUserProfileInput!): User!
  updatePreferences(input: UpdateUserPreferencesInput!): User!

  # Project mutations
  createProject(input: CreateProjectInput!): Project!
  updateProject(id: ID!, input: CreateProjectInput!): Project!
  deleteProject(id: ID!): Boolean!
  
  # Document mutations
  uploadDocument(input: UploadDocumentInput!): Document!
  retranslateDocument(
    documentId: ID!
    targetLanguage: String
    translationStyle: TranslationStyle
  ): Document!
  translateText(input: TranslateTextInput!): TranslationResult!
  improveTranslation(input: ImproveTranslationInput!): TranslationImprovement!
  deleteDocument(id: ID!): Boolean!
  
  # Sharing & Collaboration
  shareDocument(
    documentId: ID!
    userEmail: String!
    permissions: SharePermissions!
  ): Boolean!
  
  # Chat mutations
  sendChatMessage(input: SendChatMessageInput!): ChatMessage!
  clearChatHistory(documentId: ID!): Boolean!
}
```

## Subscriptions

```graphql
type Subscription {
  # Document subscriptions
  translationProgress(documentId: ID!): TranslationProgress!
  documentUpdated(documentId: ID!): Document!

  # Chat subscriptions
  newChatMessage(documentId: ID!): ChatMessage!
}
```

## Additional Types

### Authentication Types
```graphql
type AuthPayload {
  user: User!
  token: String!
  refreshToken: String!
}

type AuthTokens {
  accessToken: String!
  refreshToken: String!
}

type LogoutResponse {
  message: String!
  success: Boolean!
}
```

### Translation Types
```graphql
type TranslationResult {
  originalText: String!
  translatedText: String!
  sourceLanguage: String!  # 返回检测到的实际语言
  targetLanguage: String!
  style: String!
  createdAt: String!
}

type TranslationImprovement {
  originalText: String!
  originalTranslation: String!
  improvedTranslation: String!
  sourceLanguage: String!
  targetLanguage: String!
  feedback: String
  createdAt: String!
}
```

### Response Types  
```graphql
type UsersResponse {
  users: [User!]!
  pagination: PaginationInfo!
}

type PaginationInfo {
  page: Int!
  limit: Int!
  total: Int!
  pages: Int!
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

## Implementation Notes

### 自动语言检测

当前系统实现了自动语言检测功能：
1. 用户上传文档后，系统自动分析文档内容
2. 源语言字段默认设置为 "auto"
3. 在翻译过程中，AI服务会自动识别并返回实际语言

### 翻译流程

当前的翻译流程包括四个步骤：
1. **文档分割中** - 将大文档分割成小块以便处理
2. **提交给AI翻译** - 使用OpenRouter或其他AI服务进行翻译
3. **文档整合中** - 将翻译后的块重新组合
4. **自动排版与优化** - 保持原始格式并优化排版

### 支持的文件格式

```javascript
const supportedFormats = ["pdf", "docx", "epub", "txt", "mobi", "azw"]
const supportedMimeTypes = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/epub+zip",
  "text/plain",
  "application/x-mobipocket-ebook",
  "application/vnd.amazon.ebook"
]
```

### 本地存储集成

系统现在使用本地文件存储代替Google Cloud Storage：
- 文件保存在 `/storage` 目录
- 通过 `localFileStorage.js` 服务管理文件操作
- 支持文件上传、下载、删除等操作

## Baidu Cloud Integration (已弃用)

### File Upload (本地存储)
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

### OpenRouter Integration (当前使用)

系统现在使用OpenRouter代替Baidu AI服务：

```javascript
// backend/services/api-gateway/src/utils/openRouterService.js
const translateWithOpenRouter = async (text, targetLanguage) => {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'google/gemini-flash-1.5',
      messages: [{
        role: 'user',
        content: `Translate to ${targetLanguage}: ${text}`
      }]
    })
  });
  return response.json();
};
```

### AI Services (已弃用Baidu AI)
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

## Key Updates in Current Implementation

### 主要变更说明

1. **自动语言检测**
   - 源语言不再需要用户手动选择
   - 系统自动检测文档语言
   - API中sourceLanguage字段支持"auto"值

2. **简化的翻译流程**
   - 移除了UpdateDocumentContentInput
   - 文档内容更新通过编辑器或重新翻译处理
   - 四步翻译流程：分割→AI翻译→整合→优化

3. **技术栈更新**
   - 从Google Cloud Storage迁移到本地存储
   - 从Baidu AI迁移到OpenRouter (Gemini模型)
   - 保留GraphQL API架构

4. **用户体验改进**
   - 实时翻译进度显示
   - 自动格式保留
   - 支持多种文档格式

5. **API简化**
   - 减少了必需的输入参数
   - 自动处理更多配置选项
   - 改进的错误处理机制