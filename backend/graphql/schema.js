/**
 * GraphQL Type Definitions
 * Defines the structure of our GraphQL API
 */

const { gql } = require('graphql-tag');

const typeDefs = gql`
  scalar DateTime
  scalar JSON

  # User type definitions
  type User {
    id: ID!
    email: String!
    fullName: String!
    userType: UserType!
    avatarUrl: String
    createdAt: DateTime!
    updatedAt: DateTime!
    lastLogin: DateTime
    isActive: Boolean!
    preferences: JSON
    projects: [Project!]!
  }

  enum UserType {
    translator
    admin
    viewer
  }

  # Project type definitions
  type Project {
    id: ID!
    user: User!
    name: String!
    description: String
    sourceLanguage: String!
    targetLanguage: String!
    status: ProjectStatus!
    createdAt: DateTime!
    updatedAt: DateTime!
    completedAt: DateTime
    metadata: JSON
    documents: [Document!]!
  }

  enum ProjectStatus {
    draft
    active
    completed
    archived
  }

  # Document type definitions
  type Document {
    id: ID!
    project: Project!
    originalFilename: String!
    fileType: String!
    fileSizeBytes: Int
    storagePath: String
    originalContent: String
    translatedContent: String
    status: DocumentStatus!
    wordCount: Int!
    pageCount: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
    processedAt: DateTime
    metadata: JSON
    translationJob: TranslationJob
    chatMessages: [ChatMessage!]!
  }

  enum DocumentStatus {
    uploaded
    processing
    ready
    translating
    completed
    error
  }

  # Translation job type definitions
  type TranslationJob {
    id: ID!
    document: Document!
    status: JobStatus!
    progressPercentage: Int!
    startedAt: DateTime
    completedAt: DateTime
    errorMessage: String
    aiModel: String!
    totalTokensUsed: Int!
    translationSettings: JSON
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  enum JobStatus {
    pending
    running
    completed
    failed
    cancelled
  }

  # Chat message type definitions
  type ChatMessage {
    id: ID!
    document: Document!
    user: User!
    role: ChatRole!
    content: String!
    tokensUsed: Int!
    createdAt: DateTime!
    metadata: JSON
  }

  enum ChatRole {
    user
    assistant
    system
  }

  # Translation segment type definitions
  type TranslationSegment {
    id: ID!
    document: Document!
    segmentIndex: Int!
    originalText: String!
    translatedText: String
    confidenceScore: Float
    isReviewed: Boolean!
    isEdited: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  # Authentication types
  type AuthPayload {
    token: String!
    user: User!
  }

  # Input types
  input SignUpInput {
    email: String!
    password: String!
    fullName: String!
    userType: UserType
  }

  input SignInInput {
    email: String!
    password: String!
  }

  input CreateProjectInput {
    name: String!
    description: String
    sourceLanguage: String!
    targetLanguage: String!
  }

  input UpdateProjectInput {
    name: String
    description: String
    status: ProjectStatus
    sourceLanguage: String
    targetLanguage: String
  }

  input CreateDocumentInput {
    projectId: ID!
    filename: String!
    fileType: String!
    content: String!
  }

  input UpdateDocumentInput {
    translatedContent: String
    status: DocumentStatus
    metadata: JSON
  }

  input SendChatMessageInput {
    documentId: ID!
    content: String!
  }

  input UpdateTranslationSegmentInput {
    translatedText: String!
    isReviewed: Boolean
    isEdited: Boolean
  }

  # Query definitions
  type Query {
    # User queries
    me: User
    user(id: ID!): User
    users: [User!]!

    # Project queries
    project(id: ID!): Project
    projects(status: ProjectStatus): [Project!]!
    myProjects: [Project!]!

    # Document queries
    document(id: ID!): Document
    documents(projectId: ID!): [Document!]!

    # Translation queries
    translationJob(id: ID!): TranslationJob
    translationSegments(documentId: ID!): [TranslationSegment!]!

    # Chat queries
    chatMessages(documentId: ID!): [ChatMessage!]!

    # System queries
    systemStats: SystemStats
  }

  type SystemStats {
    totalUsers: Int!
    totalProjects: Int!
    totalDocuments: Int!
    activeTranslations: Int!
  }

  # Mutation definitions
  type Mutation {
    # Authentication mutations
    signUp(input: SignUpInput!): AuthPayload!
    signIn(input: SignInInput!): AuthPayload!
    signOut: Boolean!
    refreshToken: AuthPayload!

    # User mutations
    updateProfile(fullName: String, avatarUrl: String, preferences: JSON): User!
    changePassword(oldPassword: String!, newPassword: String!): Boolean!

    # Project mutations
    createProject(input: CreateProjectInput!): Project!
    updateProject(id: ID!, input: UpdateProjectInput!): Project!
    deleteProject(id: ID!): Boolean!

    # Document mutations
    createDocument(input: CreateDocumentInput!): Document!
    updateDocument(id: ID!, input: UpdateDocumentInput!): Document!
    deleteDocument(id: ID!): Boolean!
    
    # Translation mutations
    startTranslation(documentId: ID!): TranslationJob!
    cancelTranslation(jobId: ID!): TranslationJob!
    updateTranslationSegment(id: ID!, input: UpdateTranslationSegmentInput!): TranslationSegment!

    # Chat mutations
    sendChatMessage(input: SendChatMessageInput!): ChatMessage!
    clearChatHistory(documentId: ID!): Boolean!
  }

  # Subscription definitions (for real-time updates)
  type Subscription {
    translationProgress(documentId: ID!): TranslationJob!
    newChatMessage(documentId: ID!): ChatMessage!
  }
`;

module.exports = typeDefs;