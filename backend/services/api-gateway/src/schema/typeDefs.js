const typeDefs = `
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

  enum ContactInquiryStatus {
    NEW
    IN_PROGRESS
    RESOLVED
    CLOSED
  }

  enum ContactPriority {
    LOW
    NORMAL
    HIGH
    URGENT
  }

  # User Types
  type User {
    id: ID!
    name: String!
    email: String!
    emailVerified: Boolean!
    emailVerifiedAt: DateTime
    accountStatus: AccountStatus!
    role: UserRole!
    plan: String!
    preferences: JSON
    createdAt: DateTime!
    lastLogin: DateTime
    projects: [Project!]!
    documents: [Document!]!
  }

  enum AccountStatus {
    PENDING
    ACTIVE
    SUSPENDED
    DEACTIVATED
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
    user: User
    tokens: AuthTokens
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

  # Email verification types
  type SendVerificationEmailResponse {
    success: Boolean!
    message: String!
    emailSent: Boolean!
  }

  type VerifyEmailResponse {
    success: Boolean!
    message: String!
    user: User
    tokens: AuthTokens
  }

  type EmailVerificationStatus {
    valid: Boolean!
    expired: Boolean!
    used: Boolean!
    user: User
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

  # Comment type definition
  type Comment {
    id: ID!
    documentId: ID!
    userId: ID!
    content: String!
    position: CommentPosition!
    resolved: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type CommentPosition {
    start: Int!
    end: Int!
    section: String
  }

  # Contact Management Types
  type ContactInquiry {
    id: ID!
    userId: ID
    user: User
    name: String!
    email: String!
    subject: String!
    inquiryType: String!
    message: String!
    status: ContactInquiryStatus!
    priority: ContactPriority!
    assignedToId: ID
    assignedTo: User
    adminNotes: String
    ipAddress: String
    userAgent: String
    source: String!
    responses: [ContactResponse!]!
    createdAt: DateTime!
    updatedAt: DateTime!
    resolvedAt: DateTime
    lastResponseAt: DateTime
  }

  type ContactResponse {
    id: ID!
    inquiryId: ID!
    inquiry: ContactInquiry!
    adminId: ID!
    admin: User!
    responseText: String!
    isPublic: Boolean!
    responseType: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type ContactCategory {
    id: ID!
    name: String!
    description: String
    color: String!
    isActive: Boolean!
    sortOrder: Int!
    createdAt: DateTime!
  }

  type ContactStats {
    totalInquiries: Int!
    newInquiries: Int!
    resolvedInquiries: Int!
    avgResolutionTime: String
    mostCommonType: String
  }

  # Document content update input
  input UpdateDocumentContentInput {
    documentId: ID!
    content: String!
    format: String
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

  # Contact Input Types
  input CreateContactInquiryInput {
    name: String!
    email: String!
    subject: String!
    inquiryType: String!
    message: String!
    userAgent: String
    ipAddress: String
  }

  input UpdateContactInquiryInput {
    status: ContactInquiryStatus
    priority: ContactPriority
    assignedToId: ID
    adminNotes: String
  }

  input CreateContactResponseInput {
    inquiryId: ID!
    responseText: String!
    isPublic: Boolean = true
    responseType: String = "reply"
  }

  # File Storage Types
  type FileMetadata {
    id: ID!
    userId: ID!
    user: User!
    projectId: ID
    project: Project
    
    # File identification
    originalFilename: String!
    storedFilename: String!
    fileKey: String!
    fileHash: String!
    
    # File properties
    fileType: String!
    fileExtension: String!
    fileSize: Int!
    
    # Status tracking
    uploadStatus: String!
    processingStatus: String!
    
    # Storage information
    bucketName: String!
    storageRegion: String!
    storageClass: String!
    isEncrypted: Boolean!
    visibility: String!
    
    # Access URLs
    fileUrl: String
    cdnUrl: String
    presignedUrl: String
    presignedExpiresAt: DateTime
    
    # Translation metadata
    sourceLanguage: String
    targetLanguage: String
    translationStyle: String
    specialization: String
    
    # Processing data
    extractedText: String
    metadata: JSON
    thumbnailUrls: [String!]
    
    # Upload tracking
    uploadSessionId: String
    uploadProgress: Int!
    
    # Timestamps
    createdAt: DateTime!
    updatedAt: DateTime!
    uploadedAt: DateTime
    processedAt: DateTime
    deletedAt: DateTime
    lastAccessedAt: DateTime
    
    # Related data
    glossaryMetadata: GlossaryFile
    shares: [FileShare!]
    accessLogs: [FileAccessLog!]
  }

  type GlossaryFile {
    id: ID!
    fileMetadataId: ID!
    fileMetadata: FileMetadata!
    userId: ID!
    user: User!
    
    # Glossary properties
    glossaryName: String!
    description: String
    sourceLanguage: String!
    targetLanguage: String!
    domain: String
    
    # Statistics
    termCount: Int!
    lastUpdatedAt: DateTime
    version: Int!
    
    # Usage tracking
    usageCount: Int!
    lastUsedAt: DateTime
    
    # Status
    validationStatus: String!
    validationNotes: String
    validatedBy: ID
    validatedAt: DateTime
    
    # Sharing
    isPublic: Boolean!
    isShared: Boolean!
    sharedWith: [ID!]
    
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type FileShare {
    id: ID!
    fileMetadataId: ID!
    fileMetadata: FileMetadata!
    sharedBy: ID!
    sharedByUser: User!
    sharedWith: ID
    sharedWithUser: User
    
    # Sharing configuration
    shareType: String!
    recipientEmail: String
    shareToken: String
    
    # Permissions
    canView: Boolean!
    canDownload: Boolean!
    canEdit: Boolean!
    canComment: Boolean!
    canShare: Boolean!
    
    # Limits and expiration
    expiresAt: DateTime
    maxDownloads: Int
    downloadCount: Int!
    maxViews: Int
    viewCount: Int!
    
    # Status
    isActive: Boolean!
    revokedAt: DateTime
    revokedBy: ID
    
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type FileAccessLog {
    id: ID!
    fileMetadataId: ID!
    fileMetadata: FileMetadata!
    userId: ID
    user: User
    
    # Access details
    accessType: String!
    accessMethod: String!
    ipAddress: String
    userAgent: String
    
    # Request details
    responseStatus: Int
    bytesTransferred: Int
    accessDuration: Int
    
    # Context
    shareToken: String
    referrer: String
    sessionId: String
    
    accessedAt: DateTime!
  }

  type FileStorageStats {
    totalFiles: Int!
    totalSizeBytes: Int!
    totalSizeMB: Float!
    filesByType: JSON!
    recentUploads: Int!
  }

  type FileUploadResult {
    success: Boolean!
    fileMetadata: FileMetadata!
    uploadResult: JSON
    isDuplicate: Boolean!
    message: String
  }

  # File Input Types
  input FileUploadInput {
    projectId: ID
    sourceLanguage: String
    targetLanguage: String
    translationStyle: String
    specialization: String
    visibility: String = "private"
  }

  input CreateGlossaryInput {
    fileMetadataId: ID!
    glossaryName: String!
    description: String
    sourceLanguage: String!
    targetLanguage: String!
    domain: String
  }

  input ShareFileInput {
    fileMetadataId: ID!
    shareType: String! # user, email, public_link
    recipientEmail: String
    sharedWith: ID
    permissions: FileSharePermissions!
    expiresAt: DateTime
    maxDownloads: Int
    maxViews: Int
  }

  input FileSharePermissions {
    canView: Boolean = true
    canDownload: Boolean = false
    canEdit: Boolean = false
    canComment: Boolean = false
    canShare: Boolean = false
  }

  input FileQueryOptions {
    projectId: ID
    fileType: String
    limit: Int = 50
    offset: Int = 0
    orderBy: String = "created_at"
    orderDirection: String = "DESC"
  }

  input GlossaryQueryOptions {
    sourceLanguage: String
    targetLanguage: String
    domain: String
    isPublic: Boolean
    limit: Int = 50
    offset: Int = 0
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

    # Email verification queries
    checkEmailVerificationStatus(token: String!): EmailVerificationStatus!

    # Contact queries
    contactInquiries(status: ContactInquiryStatus, limit: Int, offset: Int): [ContactInquiry!]!
    contactInquiry(id: ID!): ContactInquiry
    contactCategories: [ContactCategory!]!
    contactStats(startDate: String, endDate: String): ContactStats!
    
    # File storage queries
    fileMetadata(id: ID!): FileMetadata
    userFiles(options: FileQueryOptions): [FileMetadata!]!
    fileStorageStats: FileStorageStats!
    fileDownloadUrl(fileId: ID!, expiresIn: Int = 3600): String!
    
    # Glossary queries
    glossaryFile(id: ID!): GlossaryFile
    userGlossaries(options: GlossaryQueryOptions): [GlossaryFile!]!
    publicGlossaries(options: GlossaryQueryOptions): [GlossaryFile!]!
    
    # File sharing queries
    fileShares(fileId: ID!): [FileShare!]!
    sharedWithMe(limit: Int = 50, offset: Int = 0): [FileShare!]!
    fileAccessLogs(fileId: ID!, limit: Int = 100): [FileAccessLog!]!
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

    # Email verification mutations
    sendVerificationEmail(email: String!): SendVerificationEmailResponse!
    verifyEmail(token: String!): VerifyEmailResponse!
    resendVerificationEmail: SendVerificationEmailResponse!

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

    # Contact mutations
    createContactInquiry(input: CreateContactInquiryInput!): ContactInquiry!
    updateContactInquiry(id: ID!, input: UpdateContactInquiryInput!): ContactInquiry!
    createContactResponse(input: CreateContactResponseInput!): ContactResponse!
    deleteContactInquiry(id: ID!): Boolean!
    
    # File storage mutations
    # NOTE: File uploads are now handled via REST endpoints /api/files/upload
    uploadFileMetadata(input: FileUploadInput!): FileUploadResult!
    deleteFile(fileId: ID!): Boolean!
    updateFileMetadata(fileId: ID!, metadata: JSON!): FileMetadata!
    
    # Glossary mutations
    createGlossary(input: CreateGlossaryInput!): GlossaryFile!
    updateGlossary(id: ID!, input: CreateGlossaryInput!): GlossaryFile!
    deleteGlossary(id: ID!): Boolean!
    validateGlossary(id: ID!, status: String!, notes: String): GlossaryFile!
    
    # File sharing mutations
    shareFile(input: ShareFileInput!): FileShare!
    updateFileShare(shareId: ID!, permissions: FileSharePermissions!): FileShare!
    revokeFileShare(shareId: ID!): Boolean!
    
    # File access mutations
    generateDownloadUrl(fileId: ID!, expiresIn: Int = 3600): String!
    trackFileAccess(fileId: ID!, accessType: String!): Boolean!
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