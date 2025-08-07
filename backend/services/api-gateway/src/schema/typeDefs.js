const { gql } = require('apollo-server-express');

const typeDefs = gql`
  # Enums
  enum UserRole {
    READER
    TRANSLATOR
    ADMIN
    ENTERPRISE
  }

  enum DocumentStatus {
    PROCESSING
    TRANSLATING
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

  # Types
  type User {
    id: ID!
    name: String!
    email: String!
    role: UserRole!
    plan: String!
    projects: [Project!]
    documents: [Document!]
    preferences: UserPreferences
    createdAt: String!
    updatedAt: String!
  }

  type UserPreferences {
    defaultSourceLanguage: String
    defaultTargetLanguage: String
    defaultTranslationStyle: TranslationStyle
    autoSave: Boolean
    emailNotifications: Boolean
    theme: String
  }

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

  type Document {
    id: ID!
    title: String!
    status: DocumentStatus!
    progress: Int!
    sourceLanguage: String!
    targetLanguage: String!
    translationStyle: TranslationStyle!
    specialization: String!
    originalContent: String
    translatedContent: String
    fileUrl: String
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

  type Comment {
    id: ID!
    content: String!
    author: User!
    parentComment: Comment
    position: CommentPosition!
    isResolved: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type CommentPosition {
    start: Int!
    end: Int!
    section: String
  }

  type ChatMessage {
    id: ID!
    content: String!
    author: ChatMessageAuthor!
    messageType: String!
    selectedText: String
    position: CommentPosition
    createdAt: String!
  }

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

  type SelectionRange {
    start: Int!
    end: Int!
  }

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

  type APIError {
    code: ErrorCode!
    message: String!
    details: String
    service: String
  }

  # Input Types
  input UploadDocumentInput {
    bosObjectKey: String
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

  input UpdateProjectInput {
    name: String
    description: String
    color: String
    defaultSettings: ProjectSettingsInput
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

  input LoginInput {
    email: String!
    password: String!
  }

  input RegisterInput {
    name: String!
    email: String!
    password: String!
    role: UserRole = READER
  }

  type AuthPayload {
    token: String!
    user: User!
    refreshToken: String!
  }

  # Root Types
  type Query {
    # Auth
    me: User

    # Projects
    projects(limit: Int, offset: Int): [Project!]!
    project(id: ID!): Project

    # Documents
    document(id: ID!): Document
    searchDocuments(query: String!, projectId: ID): [Document!]!
    recentDocuments(limit: Int): [Document!]!
    documentDownloadLinks(documentId: ID!): [DownloadLink!]!

    # Chat
    chatHistory(documentId: ID!): [ChatMessage!]!

    # Configuration
    translationSpecializations: [TranslationSpecialization!]!
    supportedLanguages: [Language!]!
  }

  type Mutation {
    # Auth
    login(input: LoginInput!): AuthPayload!
    register(input: RegisterInput!): AuthPayload!
    refreshToken(refreshToken: String!): AuthPayload!
    logout: Boolean!

    # Projects
    createProject(input: CreateProjectInput!): Project!
    updateProject(id: ID!, input: UpdateProjectInput!): Project!
    deleteProject(id: ID!): Boolean!

    # Documents
    uploadDocument(input: UploadDocumentInput!): Document!
    updateDocumentContent(input: UpdateDocumentContentInput!): Document!
    retranslateDocument(
      documentId: ID!
      targetLanguage: String
      translationStyle: TranslationStyle
    ): Document!
    deleteDocument(id: ID!): Boolean!

    # Sharing
    shareDocument(
      documentId: ID!
      userEmail: String!
      permissions: SharePermissions!
    ): Boolean!

    # Chat
    sendChatMessage(input: SendChatMessageInput!): ChatMessage!
    clearChatHistory(documentId: ID!): Boolean!

    # User
    updateUserPreferences(input: UpdateUserPreferencesInput!): User!
  }

  type Subscription {
    # Real-time updates
    translationProgress(documentId: ID!): TranslationProgress!
    documentUpdated(documentId: ID!): Document!
    collaboratorStatusChanged(documentId: ID!): CollaboratorStatus!
    newComment(documentId: ID!): Comment!
    newChatMessage(documentId: ID!): ChatMessage!
  }
`;

module.exports = typeDefs;