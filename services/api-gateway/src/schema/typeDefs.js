const { gql } = require('apollo-server-express');

const typeDefs = gql`
  # Scalar types
  scalar JSON
  scalar DateTime

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

  # User Types
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
  }

  type UserPreferences {
    defaultSourceLanguage: String
    defaultTargetLanguage: String
    defaultTranslationStyle: TranslationStyle
    autoSave: Boolean
    emailNotifications: Boolean
    theme: String
  }

  # Authentication Types
  type AuthPayload {
    user: User!
    tokens: AuthTokens!
    message: String!
  }

  type AuthTokens {
    accessToken: String!
    refreshToken: String!
  }

  type LogoutResponse {
    message: String!
    success: Boolean!
  }

  # Project Types
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

  # Document Types
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

  # Chat Types
  type ChatMessage {
    id: ID!
    content: String!
    author: ChatMessageAuthor!
    messageType: String!
    selectedText: String
    position: JSON
    createdAt: DateTime!
  }

  # Language and Configuration Types
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

  # Progress Types
  type TranslationProgress {
    documentId: ID!
    status: DocumentStatus!
    progress: Int!
    currentStep: String!
    estimatedTimeRemaining: Int
    error: String
  }

  # Input Types
  input RegisterInput {
    name: String!
    email: String!
    password: String!
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

  input AddCommentInput {
    documentId: ID!
    content: String!
    parentCommentId: ID
    position: CommentPositionInput!
  }

  input CommentPositionInput {
    start: Int!
    end: Int!
    section: String
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

  input TranslateTextInput {
    text: String!
    sourceLanguage: String!
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

  type TranslationResult {
    originalText: String!
    translatedText: String!
    sourceLanguage: String!
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

  type AuthPayload {
    token: String!
    user: User!
    refreshToken: String!
  }

  input UploadDocumentInput {
    title: String!
    sourceLanguage: String!
    targetLanguage: String!
    translationStyle: TranslationStyle!
    specialization: String!
    projectId: ID
    fileUrl: String!
    fileSize: Int
    fileType: String
  }

  input SendChatMessageInput {
    documentId: ID!
    content: String!
    messageType: String!
    selectedText: String
    position: JSON
  }

  # Queries
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

  # Mutations
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
    updateDocumentContent(input: UpdateDocumentContentInput!): Document!
    retranslateDocument(
      documentId: ID!
      targetLanguage: String
      translationStyle: TranslationStyle
    ): Document!
    translateText(input: TranslateTextInput!): TranslationResult!
    improveTranslation(input: ImproveTranslationInput!): TranslationImprovement!
    deleteDocument(id: ID!): Boolean!

    # Sharing
    shareDocument(
      documentId: ID!
      userEmail: String!
      permissions: SharePermissions!
    ): Boolean!

    # Comments
    addComment(input: AddCommentInput!): Comment!
    resolveComment(commentId: ID!): Comment!

    # Chat mutations
    sendChatMessage(input: SendChatMessageInput!): ChatMessage!
    clearChatHistory(documentId: ID!): Boolean!
  }

  # Subscriptions
  type Subscription {
    # Document subscriptions
    translationProgress(documentId: ID!): TranslationProgress!
    documentUpdated(documentId: ID!): Document!

    # Chat subscriptions
    newChatMessage(documentId: ID!): ChatMessage!
  }
`;

module.exports = typeDefs;