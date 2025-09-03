// File Storage Types for Frontend
export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Project {
  id: string;
  name: string;
  color?: string;
}

export interface FileMetadata {
  id: string;
  userId: string;
  user?: User;
  projectId?: string;
  project?: Project;
  
  // File identification
  originalFilename: string;
  storedFilename: string;
  fileKey: string;
  fileHash: string;
  
  // File properties
  fileType: string;
  fileExtension: string;
  fileSize: number;
  
  // Status tracking
  uploadStatus: string;
  processingStatus: string;
  
  // Storage information
  bucketName: string;
  storageRegion: string;
  storageClass: string;
  isEncrypted: boolean;
  visibility: string;
  
  // Access URLs
  fileUrl?: string;
  cdnUrl?: string;
  presignedUrl?: string;
  presignedExpiresAt?: string;
  
  // Translation metadata
  sourceLanguage?: string;
  targetLanguage?: string;
  translationStyle?: string;
  specialization?: string;
  
  // Processing data
  extractedText?: string;
  metadata?: any;
  thumbnailUrls?: string[];
  
  // Upload tracking
  uploadSessionId?: string;
  uploadProgress: number;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  uploadedAt?: string;
  processedAt?: string;
  deletedAt?: string;
  lastAccessedAt?: string;
  
  // Related data
  glossaryMetadata?: GlossaryFile;
  shares?: FileShare[];
  accessLogs?: FileAccessLog[];
}

export interface GlossaryFile {
  id: string;
  fileMetadataId: string;
  fileMetadata?: FileMetadata;
  userId: string;
  user?: User;
  
  // Glossary properties
  glossaryName: string;
  description?: string;
  sourceLanguage: string;
  targetLanguage: string;
  domain?: string;
  
  // Statistics
  termCount: number;
  lastUpdatedAt?: string;
  version: number;
  
  // Usage tracking
  usageCount: number;
  lastUsedAt?: string;
  
  // Status
  validationStatus: string;
  validationNotes?: string;
  validatedBy?: string;
  validatedAt?: string;
  
  // Sharing
  isPublic: boolean;
  isShared: boolean;
  sharedWith: string[];
  
  createdAt: string;
  updatedAt: string;
}

export interface FileShare {
  id: string;
  fileMetadataId: string;
  fileMetadata?: FileMetadata;
  sharedBy: string;
  sharedByUser?: User;
  sharedWith?: string;
  sharedWithUser?: User;
  
  // Sharing configuration
  shareType: string;
  recipientEmail?: string;
  shareToken?: string;
  
  // Permissions
  canView: boolean;
  canDownload: boolean;
  canEdit: boolean;
  canComment: boolean;
  canShare: boolean;
  
  // Limits and expiration
  expiresAt?: string;
  maxDownloads?: number;
  downloadCount: number;
  maxViews?: number;
  viewCount: number;
  
  // Status
  isActive: boolean;
  revokedAt?: string;
  revokedBy?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface FileAccessLog {
  id: string;
  fileMetadataId: string;
  fileMetadata?: FileMetadata;
  userId?: string;
  user?: User;
  
  // Access details
  accessType: string;
  accessMethod: string;
  ipAddress?: string;
  userAgent?: string;
  
  // Request details
  responseStatus?: number;
  bytesTransferred?: number;
  accessDuration?: number;
  
  // Context
  shareToken?: string;
  referrer?: string;
  sessionId?: string;
  
  accessedAt: string;
}

export interface FileStorageStats {
  totalFiles: number;
  totalSizeBytes: number;
  totalSizeMB: number;
  filesByType: Record<string, number>;
  recentUploads: number;
}

export interface FileUploadResult {
  success: boolean;
  fileMetadata: FileMetadata;
  uploadResult?: any;
  isDuplicate: boolean;
  message?: string;
}

// Input Types
export interface FileUploadInput {
  projectId?: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  translationStyle?: string;
  specialization?: string;
  visibility?: string;
}

export interface CreateGlossaryInput {
  fileMetadataId: string;
  glossaryName: string;
  description?: string;
  sourceLanguage: string;
  targetLanguage: string;
  domain?: string;
}

export interface ShareFileInput {
  fileMetadataId: string;
  shareType: string; // user, email, public_link
  recipientEmail?: string;
  sharedWith?: string;
  permissions: FileSharePermissions;
  expiresAt?: string;
  maxDownloads?: number;
  maxViews?: number;
}

export interface FileSharePermissions {
  canView?: boolean;
  canDownload?: boolean;
  canEdit?: boolean;
  canComment?: boolean;
  canShare?: boolean;
}

export interface FileQueryOptions {
  projectId?: string;
  fileType?: string;
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: string;
}

export interface GlossaryQueryOptions {
  sourceLanguage?: string;
  targetLanguage?: string;
  domain?: string;
  isPublic?: boolean;
  limit?: number;
  offset?: number;
}

// File types and extensions mapping
export const FILE_TYPE_ICONS: Record<string, string> = {
  'pdf': '📄',
  'doc': '📝',
  'docx': '📝',
  'txt': '📄',
  'rtf': '📝',
  'html': '🌐',
  'htm': '🌐',
  'mp3': '🎵',
  'wav': '🎵',
  'mp4': '🎬',
  'avi': '🎬',
  'mov': '🎬',
};

export const UPLOAD_STATUS_CONFIG = {
  pending: { label: '等待中', color: 'bg-gray-500' },
  uploading: { label: '上传中', color: 'bg-blue-500' },
  completed: { label: '上传完成', color: 'bg-green-500' },
  failed: { label: '上传失败', color: 'bg-red-500' },
  deleted: { label: '已删除', color: 'bg-gray-400' },
};

export const PROCESSING_STATUS_CONFIG = {
  pending: { label: '等待处理', color: 'bg-yellow-500' },
  processing: { label: '处理中', color: 'bg-blue-500' },
  completed: { label: '处理完成', color: 'bg-green-500' },
  failed: { label: '处理失败', color: 'bg-red-500' },
};

export const VISIBILITY_OPTIONS = [
  { value: 'private', label: '私有' },
  { value: 'public-read', label: '公开只读' },
  { value: 'public-read-write', label: '公开读写' },
];

export const SHARE_TYPE_OPTIONS = [
  { value: 'user', label: '指定用户' },
  { value: 'email', label: '邮箱邀请' },
  { value: 'public_link', label: '公开链接' },
];