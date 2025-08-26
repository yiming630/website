import { gql } from '@apollo/client';
import { apolloClient } from '@/lib/apollo-client';
import {
  Document,
  DocumentStatus,
  ImproveTranslationInput,
  TranslateTextInput,
  TranslationImprovement,
  TranslationProgress,
  TranslationResult,
  TranslationStyle,
  UploadDocumentInput,
} from '@/types/graphql';

// GraphQL查询和变更定义
const UPLOAD_DOCUMENT_MUTATION = gql`
  mutation UploadDocument($input: UploadDocumentInput!) {
    uploadDocument(input: $input) {
      id
      title
      status
      progress
      sourceLanguage
      targetLanguage
      translationStyle
      specialization
      fileUrl
      fileSize
      fileType
      createdAt
      updatedAt
      owner {
        id
        name
        email
      }
    }
  }
`;

const GET_DOCUMENT_QUERY = gql`
  query GetDocument($id: ID!) {
    document(id: $id) {
      id
      title
      status
      progress
      sourceLanguage
      targetLanguage
      translationStyle
      specialization
      originalContent
      translatedContent
      fileUrl
      fileSize
      fileType
      owner {
        id
        name
        email
      }
      collaborators {
        id
        name
        email
      }
      downloadLinks {
        id
        format
        url
        fileSize
        expiresAt
        createdAt
      }
      createdAt
      updatedAt
    }
  }
`;

const GET_DOCUMENTS_QUERY = gql`
  query GetDocuments($projectId: ID, $limit: Int, $offset: Int) {
    documents(projectId: $projectId, limit: $limit, offset: $offset) {
      id
      title
      status
      progress
      sourceLanguage
      targetLanguage
      translationStyle
      specialization
      fileSize
      fileType
      owner {
        id
        name
      }
      createdAt
      updatedAt
    }
  }
`;

const SEARCH_DOCUMENTS_QUERY = gql`
  query SearchDocuments($query: String!, $projectId: ID) {
    searchDocuments(query: $query, projectId: $projectId) {
      id
      title
      status
      progress
      sourceLanguage
      targetLanguage
      translationStyle
      specialization
      createdAt
      updatedAt
    }
  }
`;

const RECENT_DOCUMENTS_QUERY = gql`
  query RecentDocuments($limit: Int) {
    recentDocuments(limit: $limit) {
      id
      title
      status
      progress
      sourceLanguage
      targetLanguage
      translationStyle
      specialization
      createdAt
      updatedAt
    }
  }
`;

const RETRANSLATE_DOCUMENT_MUTATION = gql`
  mutation RetranslateDocument(
    $documentId: ID!
    $targetLanguage: String
    $translationStyle: TranslationStyle
  ) {
    retranslateDocument(
      documentId: $documentId
      targetLanguage: $targetLanguage
      translationStyle: $translationStyle
    ) {
      id
      status
      progress
      targetLanguage
      translationStyle
    }
  }
`;

const TRANSLATE_TEXT_MUTATION = gql`
  mutation TranslateText($input: TranslateTextInput!) {
    translateText(input: $input) {
      originalText
      translatedText
      sourceLanguage
      targetLanguage
      style
      createdAt
    }
  }
`;

const IMPROVE_TRANSLATION_MUTATION = gql`
  mutation ImproveTranslation($input: ImproveTranslationInput!) {
    improveTranslation(input: $input) {
      originalText
      originalTranslation
      improvedTranslation
      sourceLanguage
      targetLanguage
      feedback
      createdAt
    }
  }
`;

const DELETE_DOCUMENT_MUTATION = gql`
  mutation DeleteDocument($id: ID!) {
    deleteDocument(id: $id)
  }
`;

const SHARE_DOCUMENT_MUTATION = gql`
  mutation ShareDocument(
    $documentId: ID!
    $userEmail: String!
    $permissions: SharePermissions!
  ) {
    shareDocument(
      documentId: $documentId
      userEmail: $userEmail
      permissions: $permissions
    )
  }
`;

const TRANSLATION_PROGRESS_SUBSCRIPTION = gql`
  subscription TranslationProgress($documentId: ID!) {
    translationProgress(documentId: $documentId) {
      documentId
      status
      progress
      currentStep
      estimatedTimeRemaining
      error
    }
  }
`;

const DOCUMENT_UPDATED_SUBSCRIPTION = gql`
  subscription DocumentUpdated($documentId: ID!) {
    documentUpdated(documentId: $documentId) {
      id
      status
      progress
      translatedContent
      updatedAt
    }
  }
`;

/**
 * 文档服务类
 * 处理文档上传、翻译、管理等功能
 */
export class DocumentService {
  private static instance: DocumentService;
  
  private constructor() {}
  
  /**
   * 获取DocumentService单例实例
   */
  public static getInstance(): DocumentService {
    if (!DocumentService.instance) {
      DocumentService.instance = new DocumentService();
    }
    return DocumentService.instance;
  }
  
  /**
   * 上传文档
   * @param input 文档上传信息
   * @returns 创建的文档信息
   */
  async uploadDocument(input: UploadDocumentInput): Promise<Document> {
    try {
      const { data } = await apolloClient.mutate({
        mutation: UPLOAD_DOCUMENT_MUTATION,
        variables: { input },
      });
      
      return data.uploadDocument;
    } catch (error) {
      console.error('Document upload error:', error);
      throw error;
    }
  }
  
  /**
   * 上传文件到服务器
   * @param file 文件对象
   * @returns 文件URL和相关信息
   */
  async uploadFile(file: File): Promise<{
    fileUrl: string;
    fileSize: number;
    fileType: string;
  }> {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('File upload failed');
      }
      
      const result = await response.json();
      return {
        fileUrl: result.fileUrl,
        fileSize: file.size,
        fileType: file.type || this.getFileType(file.name),
      };
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  }
  
  /**
   * 获取单个文档详情
   * @param id 文档ID
   * @returns 文档详情
   */
  async getDocument(id: string): Promise<Document> {
    try {
      const { data } = await apolloClient.query({
        query: GET_DOCUMENT_QUERY,
        variables: { id },
        fetchPolicy: 'network-only',
      });
      
      return data.document;
    } catch (error) {
      console.error('Get document error:', error);
      throw error;
    }
  }
  
  /**
   * 获取文档列表
   * @param projectId 项目ID（可选）
   * @param limit 限制数量
   * @param offset 偏移量
   * @returns 文档列表
   */
  async getDocuments(
    projectId?: string,
    limit = 10,
    offset = 0
  ): Promise<Document[]> {
    try {
      const { data } = await apolloClient.query({
        query: GET_DOCUMENTS_QUERY,
        variables: { projectId, limit, offset },
      });
      
      return data.documents;
    } catch (error) {
      console.error('Get documents error:', error);
      throw error;
    }
  }
  
  /**
   * 搜索文档
   * @param query 搜索关键词
   * @param projectId 项目ID（可选）
   * @returns 匹配的文档列表
   */
  async searchDocuments(
    query: string,
    projectId?: string
  ): Promise<Document[]> {
    try {
      const { data } = await apolloClient.query({
        query: SEARCH_DOCUMENTS_QUERY,
        variables: { query, projectId },
      });
      
      return data.searchDocuments;
    } catch (error) {
      console.error('Search documents error:', error);
      throw error;
    }
  }
  
  /**
   * 获取最近的文档
   * @param limit 限制数量
   * @returns 最近的文档列表
   */
  async getRecentDocuments(limit = 10): Promise<Document[]> {
    try {
      const { data } = await apolloClient.query({
        query: RECENT_DOCUMENTS_QUERY,
        variables: { limit },
      });
      
      return data.recentDocuments;
    } catch (error) {
      console.error('Get recent documents error:', error);
      throw error;
    }
  }
  
  /**
   * 重新翻译文档
   * @param documentId 文档ID
   * @param targetLanguage 目标语言（可选）
   * @param translationStyle 翻译风格（可选）
   * @returns 更新后的文档
   */
  async retranslateDocument(
    documentId: string,
    targetLanguage?: string,
    translationStyle?: TranslationStyle
  ): Promise<Document> {
    try {
      const { data } = await apolloClient.mutate({
        mutation: RETRANSLATE_DOCUMENT_MUTATION,
        variables: { documentId, targetLanguage, translationStyle },
      });
      
      return data.retranslateDocument;
    } catch (error) {
      console.error('Retranslate document error:', error);
      throw error;
    }
  }
  
  /**
   * 翻译文本
   * @param input 翻译输入
   * @returns 翻译结果
   */
  async translateText(input: TranslateTextInput): Promise<TranslationResult> {
    try {
      const { data } = await apolloClient.mutate({
        mutation: TRANSLATE_TEXT_MUTATION,
        variables: { input },
      });
      
      return data.translateText;
    } catch (error) {
      console.error('Translate text error:', error);
      throw error;
    }
  }
  
  /**
   * 改进翻译
   * @param input 改进翻译输入
   * @returns 改进后的翻译
   */
  async improveTranslation(
    input: ImproveTranslationInput
  ): Promise<TranslationImprovement> {
    try {
      const { data } = await apolloClient.mutate({
        mutation: IMPROVE_TRANSLATION_MUTATION,
        variables: { input },
      });
      
      return data.improveTranslation;
    } catch (error) {
      console.error('Improve translation error:', error);
      throw error;
    }
  }
  
  /**
   * 删除文档
   * @param id 文档ID
   * @returns 是否删除成功
   */
  async deleteDocument(id: string): Promise<boolean> {
    try {
      const { data } = await apolloClient.mutate({
        mutation: DELETE_DOCUMENT_MUTATION,
        variables: { id },
      });
      
      return data.deleteDocument;
    } catch (error) {
      console.error('Delete document error:', error);
      throw error;
    }
  }
  
  /**
   * 分享文档
   * @param documentId 文档ID
   * @param userEmail 用户邮箱
   * @param permissions 权限设置
   * @returns 是否分享成功
   */
  async shareDocument(
    documentId: string,
    userEmail: string,
    permissions: {
      canView: boolean;
      canComment: boolean;
      canEdit: boolean;
      canShare: boolean;
      canDownload: boolean;
    }
  ): Promise<boolean> {
    try {
      const { data } = await apolloClient.mutate({
        mutation: SHARE_DOCUMENT_MUTATION,
        variables: { documentId, userEmail, permissions },
      });
      
      return data.shareDocument;
    } catch (error) {
      console.error('Share document error:', error);
      throw error;
    }
  }
  
  /**
   * 订阅翻译进度
   * @param documentId 文档ID
   * @param onUpdate 进度更新回调
   * @returns 订阅对象
   */
  subscribeToProgress(
    documentId: string,
    onUpdate: (progress: TranslationProgress) => void
  ) {
    return apolloClient.subscribe({
      query: TRANSLATION_PROGRESS_SUBSCRIPTION,
      variables: { documentId },
    }).subscribe({
      next: ({ data }) => {
        if (data && data.translationProgress) {
          onUpdate(data.translationProgress);
        }
      },
      error: (error) => {
        console.error('Translation progress subscription error:', error);
      },
    });
  }
  
  /**
   * 订阅文档更新
   * @param documentId 文档ID
   * @param onUpdate 更新回调
   * @returns 订阅对象
   */
  subscribeToDocumentUpdates(
    documentId: string,
    onUpdate: (document: Partial<Document>) => void
  ) {
    return apolloClient.subscribe({
      query: DOCUMENT_UPDATED_SUBSCRIPTION,
      variables: { documentId },
    }).subscribe({
      next: ({ data }) => {
        if (data && data.documentUpdated) {
          onUpdate(data.documentUpdated);
        }
      },
      error: (error) => {
        console.error('Document update subscription error:', error);
      },
    });
  }
  
  /**
   * 根据文件名获取文件类型
   * @param fileName 文件名
   * @returns 文件MIME类型
   */
  private getFileType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      pdf: 'application/pdf',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      doc: 'application/msword',
      txt: 'text/plain',
      epub: 'application/epub+zip',
      mobi: 'application/x-mobipocket-ebook',
      azw: 'application/vnd.amazon.ebook',
    };
    
    return mimeTypes[extension || ''] || 'application/octet-stream';
  }
}

// 导出单例实例
export const documentService = DocumentService.getInstance();
