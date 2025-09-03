import { gql } from '@apollo/client';
import { apolloClient } from '@/lib/apollo-client';
import {
  FileMetadata,
  GlossaryFile,
  FileShare,
  FileAccessLog,
  FileStorageStats,
  FileUploadResult,
  FileUploadInput,
  CreateGlossaryInput,
  ShareFileInput,
  FileQueryOptions,
  GlossaryQueryOptions,
  FileSharePermissions
} from '@/types/file-types';

// GraphQL Queries
const GET_FILE_METADATA_QUERY = gql`
  query GetFileMetadata($id: ID!) {
    fileMetadata(id: $id) {
      id
      userId
      projectId
      originalFilename
      storedFilename
      fileKey
      fileHash
      fileType
      fileExtension
      fileSize
      uploadStatus
      processingStatus
      bucketName
      storageRegion
      storageClass
      isEncrypted
      visibility
      fileUrl
      cdnUrl
      presignedUrl
      presignedExpiresAt
      sourceLanguage
      targetLanguage
      translationStyle
      specialization
      extractedText
      metadata
      thumbnailUrls
      uploadSessionId
      uploadProgress
      createdAt
      updatedAt
      uploadedAt
      processedAt
      deletedAt
      lastAccessedAt
      user {
        id
        name
        email
      }
      project {
        id
        name
        color
      }
      glossaryMetadata {
        id
        glossaryName
        description
        sourceLanguage
        targetLanguage
        domain
        termCount
        usageCount
        validationStatus
        isPublic
      }
    }
  }
`;

const GET_USER_FILES_QUERY = gql`
  query GetUserFiles($options: FileQueryOptions) {
    userFiles(options: $options) {
      id
      userId
      projectId
      originalFilename
      fileType
      fileExtension
      fileSize
      uploadStatus
      processingStatus
      visibility
      sourceLanguage
      targetLanguage
      translationStyle
      specialization
      uploadProgress
      createdAt
      updatedAt
      user {
        id
        name
      }
      project {
        id
        name
        color
      }
    }
  }
`;

const GET_FILE_STORAGE_STATS_QUERY = gql`
  query GetFileStorageStats {
    fileStorageStats {
      totalFiles
      totalSizeBytes
      totalSizeMB
      filesByType
      recentUploads
    }
  }
`;

const GET_FILE_DOWNLOAD_URL_QUERY = gql`
  query GetFileDownloadUrl($fileId: ID!, $expiresIn: Int) {
    fileDownloadUrl(fileId: $fileId, expiresIn: $expiresIn)
  }
`;

const GET_USER_GLOSSARIES_QUERY = gql`
  query GetUserGlossaries($options: GlossaryQueryOptions) {
    userGlossaries(options: $options) {
      id
      fileMetadataId
      glossaryName
      description
      sourceLanguage
      targetLanguage
      domain
      termCount
      usageCount
      lastUsedAt
      validationStatus
      isPublic
      createdAt
      updatedAt
      fileMetadata {
        id
        originalFilename
        fileSize
        fileType
      }
    }
  }
`;

// GraphQL Mutations
const UPLOAD_FILE_MUTATION = gql`
  mutation UploadFile($file: Upload!, $input: FileUploadInput!) {
    uploadFile(file: $file, input: $input) {
      success
      isDuplicate
      message
      fileMetadata {
        id
        originalFilename
        fileType
        fileSize
        uploadStatus
        processingStatus
        visibility
        sourceLanguage
        targetLanguage
        translationStyle
        specialization
        createdAt
        user {
          id
          name
        }
        project {
          id
          name
        }
      }
    }
  }
`;

const DELETE_FILE_MUTATION = gql`
  mutation DeleteFile($fileId: ID!) {
    deleteFile(fileId: $fileId)
  }
`;

const CREATE_GLOSSARY_MUTATION = gql`
  mutation CreateGlossary($input: CreateGlossaryInput!) {
    createGlossary(input: $input) {
      id
      glossaryName
      description
      sourceLanguage
      targetLanguage
      domain
      createdAt
      fileMetadata {
        id
        originalFilename
        fileSize
      }
    }
  }
`;

const SHARE_FILE_MUTATION = gql`
  mutation ShareFile($input: ShareFileInput!) {
    shareFile(input: $input) {
      id
      shareType
      shareToken
      recipientEmail
      canView
      canDownload
      canEdit
      canComment
      canShare
      expiresAt
      createdAt
    }
  }
`;

const GENERATE_DOWNLOAD_URL_MUTATION = gql`
  mutation GenerateDownloadUrl($fileId: ID!, $expiresIn: Int) {
    generateDownloadUrl(fileId: $fileId, expiresIn: $expiresIn)
  }
`;

// Service class
export class FileService {
  // File Operations
  static async uploadFile(file: File, input: FileUploadInput): Promise<FileUploadResult> {
    const { data } = await apolloClient.mutate({
      mutation: UPLOAD_FILE_MUTATION,
      variables: { file, input },
      context: {
        hasUpload: true,
      }
    });
    return data.uploadFile;
  }

  static async getFileMetadata(id: string): Promise<FileMetadata | null> {
    try {
      const { data } = await apolloClient.query({
        query: GET_FILE_METADATA_QUERY,
        variables: { id },
        fetchPolicy: 'cache-first'
      });
      return data.fileMetadata;
    } catch (error) {
      console.error('Error getting file metadata:', error);
      return null;
    }
  }

  static async getUserFiles(options?: FileQueryOptions): Promise<FileMetadata[]> {
    try {
      const { data } = await apolloClient.query({
        query: GET_USER_FILES_QUERY,
        variables: { options },
        fetchPolicy: 'cache-first'
      });
      return data.userFiles;
    } catch (error) {
      console.error('Error getting user files:', error);
      return [];
    }
  }

  static async getFileStorageStats(): Promise<FileStorageStats> {
    const { data } = await apolloClient.query({
      query: GET_FILE_STORAGE_STATS_QUERY,
      fetchPolicy: 'cache-first'
    });
    return data.fileStorageStats;
  }

  static async deleteFile(fileId: string): Promise<boolean> {
    const { data } = await apolloClient.mutate({
      mutation: DELETE_FILE_MUTATION,
      variables: { fileId },
      refetchQueries: [
        { query: GET_USER_FILES_QUERY },
        { query: GET_FILE_STORAGE_STATS_QUERY }
      ]
    });
    return data.deleteFile;
  }

  static async getUserGlossaries(options?: GlossaryQueryOptions): Promise<GlossaryFile[]> {
    try {
      const { data } = await apolloClient.query({
        query: GET_USER_GLOSSARIES_QUERY,
        variables: { options },
        fetchPolicy: 'cache-first'
      });
      return data.userGlossaries;
    } catch (error) {
      console.error('Error getting user glossaries:', error);
      return [];
    }
  }

  static async createGlossary(input: CreateGlossaryInput): Promise<GlossaryFile> {
    const { data } = await apolloClient.mutate({
      mutation: CREATE_GLOSSARY_MUTATION,
      variables: { input },
      refetchQueries: [
        { query: GET_USER_GLOSSARIES_QUERY }
      ]
    });
    return data.createGlossary;
  }

  static async shareFile(input: ShareFileInput): Promise<FileShare> {
    const { data } = await apolloClient.mutate({
      mutation: SHARE_FILE_MUTATION,
      variables: { input }
    });
    return data.shareFile;
  }

  static async generateDownloadUrl(fileId: string, expiresIn = 3600): Promise<string> {
    const { data } = await apolloClient.mutate({
      mutation: GENERATE_DOWNLOAD_URL_MUTATION,
      variables: { fileId, expiresIn }
    });
    return data.generateDownloadUrl;
  }

  // Utility methods
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  static getFileTypeIcon(fileType: string): string {
    const type = fileType.toLowerCase();
    
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
    if (type.includes('powerpoint') || type.includes('presentation')) return '📽️';
    if (type.includes('image')) return '🖼️';
    if (type.includes('audio')) return '🎵';
    if (type.includes('video')) return '🎬';
    if (type.includes('text')) return '📄';
    
    return '📎';
  }

  static isFileTypeSupported(fileType: string): boolean {
    const supportedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'text/rtf',
      'text/html',
      'audio/mpeg',
      'audio/wav',
      'video/mp4',
      'video/avi',
      'video/quicktime'
    ];
    
    return supportedTypes.includes(fileType);
  }

  static async downloadFile(fileId: string, filename?: string): Promise<void> {
    try {
      // Get download URL
      const downloadUrl = await this.generateDownloadUrl(fileId);
      
      // Create download link and trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      if (filename) {
        link.download = filename;
      }
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }
}

export default FileService;