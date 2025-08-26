// GraphQL类型定义

// 枚举类型
export enum UserRole {
  READER = 'READER',
  TRANSLATOR = 'TRANSLATOR',
  ADMIN = 'ADMIN',
  ENTERPRISE = 'ENTERPRISE',
}

export enum DocumentStatus {
  PROCESSING = 'PROCESSING',
  TRANSLATING = 'TRANSLATING',
  REVIEWING = 'REVIEWING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum TranslationStyle {
  GENERAL = 'GENERAL',
  ACADEMIC = 'ACADEMIC',
  BUSINESS = 'BUSINESS',
  LEGAL = 'LEGAL',
  TECHNICAL = 'TECHNICAL',
  CREATIVE = 'CREATIVE',
  MEDICAL = 'MEDICAL',
  FINANCIAL = 'FINANCIAL',
}

export enum ChatMessageAuthor {
  USER = 'USER',
  AI = 'AI',
}

// 基础类型接口
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  plan: string;
  preferences?: Record<string, any>;
  createdAt: Date;
  lastLogin?: Date;
  projects?: Project[];
  documents?: Document[];
}

export interface Document {
  id: string;
  title: string;
  status: DocumentStatus;
  progress: number;
  sourceLanguage: string;
  targetLanguage: string;
  translationStyle: TranslationStyle;
  specialization: string;
  originalContent?: string;
  translatedContent?: string;
  fileUrl?: string;
  fileSize?: number;
  fileType?: string;
  project?: Project;
  owner: User;
  collaborators?: User[];
  chatHistory?: ChatMessage[];
  downloadLinks?: DownloadLink[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  owner: User;
  defaultSettings: ProjectSettings;
  documents?: Document[];
  collaborators?: User[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectSettings {
  defaultSourceLanguage: string;
  defaultTargetLanguage: string;
  defaultTranslationStyle: TranslationStyle;
  defaultSpecialization: string;
  requireReview: boolean;
}

export interface ChatMessage {
  id: string;
  content: string;
  author: ChatMessageAuthor;
  messageType: string;
  selectedText?: string;
  position?: Record<string, any>;
  createdAt: Date;
}

export interface DownloadLink {
  id: string;
  format: string;
  url: string;
  fileSize?: number;
  expiresAt: Date;
  createdAt: Date;
}

export interface TranslationProgress {
  documentId: string;
  status: DocumentStatus;
  progress: number;
  currentStep: string;
  estimatedTimeRemaining?: number;
  error?: string;
}

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  isAutoDetected?: boolean;
  supportedAsSource?: boolean;
  supportedAsTarget?: boolean;
}

export interface TranslationSpecialization {
  key: string;
  title: string;
  description?: string;
  requiresExpertise?: boolean;
}

// 输入类型
export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RefreshTokenInput {
  refreshToken: string;
}

export interface UpdateUserProfileInput {
  name?: string;
  email?: string;
}

export interface UpdateUserPreferencesInput {
  defaultSourceLanguage?: string;
  defaultTargetLanguage?: string;
  defaultTranslationStyle?: TranslationStyle;
  autoSave?: boolean;
  emailNotifications?: boolean;
  theme?: string;
}

export interface UploadDocumentInput {
  title: string;
  sourceLanguage: string;
  targetLanguage: string;
  translationStyle: TranslationStyle;
  specialization: string;
  projectId?: string;
  fileUrl: string;
  fileSize?: number;
  fileType?: string;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  color?: string;
  defaultSettings: ProjectSettingsInput;
}

export interface ProjectSettingsInput {
  defaultSourceLanguage: string;
  defaultTargetLanguage: string;
  defaultTranslationStyle: TranslationStyle;
  defaultSpecialization: string;
  requireReview: boolean;
}

export interface SendChatMessageInput {
  documentId: string;
  content: string;
  messageType: string;
  selectedText?: string;
  position?: Record<string, any>;
}

export interface TranslateTextInput {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  style?: string;
}

export interface ImproveTranslationInput {
  originalText: string;
  currentTranslation: string;
  sourceLanguage: string;
  targetLanguage: string;
  feedback?: string;
}

export interface SharePermissions {
  canView: boolean;
  canComment: boolean;
  canEdit: boolean;
  canShare: boolean;
  canDownload: boolean;
}

// 响应类型
export interface AuthPayload {
  user: User;
  token: string;
  refreshToken: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LogoutResponse {
  message: string;
  success: boolean;
}

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  style: string;
  createdAt: string;
}

export interface TranslationImprovement {
  originalText: string;
  originalTranslation: string;
  improvedTranslation: string;
  sourceLanguage: string;
  targetLanguage: string;
  feedback?: string;
  createdAt: string;
}

export interface UsersResponse {
  users: User[];
  pagination: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// 错误类型
export enum ErrorCode {
  DOCUMENT_NOT_FOUND = 'DOCUMENT_NOT_FOUND',
  TRANSLATION_FAILED = 'TRANSLATION_FAILED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  BAIDU_BOS_ERROR = 'BAIDU_BOS_ERROR',
  BAIDU_AI_ERROR = 'BAIDU_AI_ERROR',
  BAIDU_IAM_ERROR = 'BAIDU_IAM_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface APIError {
  code: ErrorCode;
  message: string;
  details?: string;
  service?: string;
}
