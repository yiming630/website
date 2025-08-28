"use client"

import { useCallback, useEffect, useState } from 'react';
import { documentService } from '@/services/document.service';
import {
  Document,
  DocumentStatus,
  TranslationProgress,
  TranslationStyle,
  UploadDocumentInput,
} from '@/types/graphql';

interface UseDocumentsOptions {
  projectId?: string;
  autoRefetch?: boolean;
  refetchInterval?: number;
}

interface UseDocumentsReturn {
  documents: Document[];
  loading: boolean;
  error: string | null;
  uploadDocument: (file: File, options: DocumentUploadOptions) => Promise<Document>;
  deleteDocument: (id: string) => Promise<void>;
  retranslateDocument: (id: string, targetLanguage?: string, style?: TranslationStyle) => Promise<void>;
  searchDocuments: (query: string) => Promise<void>;
  refetch: () => Promise<void>;
  getDocument: (id: string) => Promise<Document>;
}

interface DocumentUploadOptions {
  targetLanguage: string;
  translationStyle: TranslationStyle;
  specialization: string;
  projectId?: string;
}

/**
 * useDocuments Hook
 * 管理文档列表和文档操作
 */
export function useDocuments(options: UseDocumentsOptions = {}): UseDocumentsReturn {
  const { projectId, autoRefetch = false, refetchInterval = 30000 } = options;
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 获取文档列表
  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const docs = await documentService.getDocuments(projectId);
      setDocuments(docs);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch documents');
      console.error('Fetch documents error:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);
  
  // 初始加载和自动刷新
  useEffect(() => {
    fetchDocuments();
    
    if (autoRefetch) {
      const interval = setInterval(fetchDocuments, refetchInterval);
      return () => clearInterval(interval);
    }
  }, [fetchDocuments, autoRefetch, refetchInterval]);
  
  /**
   * 上传文档
   */
  const uploadDocument = async (
    file: File,
    options: DocumentUploadOptions
  ): Promise<Document> => {
    setError(null);
    try {
      // 1. 上传文件到服务器
      const { fileUrl, fileSize, fileType } = await documentService.uploadFile(file);
      
      // 2. 创建文档记录
      const input: UploadDocumentInput = {
        title: file.name,
        sourceLanguage: 'auto',
        targetLanguage: options.targetLanguage,
        translationStyle: options.translationStyle,
        specialization: options.specialization,
        projectId: options.projectId,
        fileUrl,
        fileSize,
        fileType,
      };
      
      const document = await documentService.uploadDocument(input);
      
      // 3. 添加到本地列表
      setDocuments(prev => [document, ...prev]);
      
      // 4. 订阅翻译进度
      const subscription = documentService.subscribeToProgress(
        document.id,
        (progress: TranslationProgress) => {
          updateDocumentInList(document.id, {
            status: progress.status,
            progress: progress.progress,
          });
        }
      );
      
      return document;
    } catch (err: any) {
      setError(err.message || 'Failed to upload document');
      throw err;
    }
  };
  
  /**
   * 删除文档
   */
  const deleteDocument = async (id: string): Promise<void> => {
    setError(null);
    try {
      await documentService.deleteDocument(id);
      setDocuments(prev => prev.filter(doc => doc.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete document');
      throw err;
    }
  };
  
  /**
   * 重新翻译文档
   */
  const retranslateDocument = async (
    id: string,
    targetLanguage?: string,
    style?: TranslationStyle
  ): Promise<void> => {
    setError(null);
    try {
      const updatedDoc = await documentService.retranslateDocument(
        id,
        targetLanguage,
        style
      );
      updateDocumentInList(id, updatedDoc);
    } catch (err: any) {
      setError(err.message || 'Failed to retranslate document');
      throw err;
    }
  };
  
  /**
   * 搜索文档
   */
  const searchDocuments = async (query: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const results = await documentService.searchDocuments(query, projectId);
      setDocuments(results);
    } catch (err: any) {
      setError(err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * 获取单个文档详情
   */
  const getDocument = async (id: string): Promise<Document> => {
    setError(null);
    try {
      const doc = await documentService.getDocument(id);
      updateDocumentInList(id, doc);
      return doc;
    } catch (err: any) {
      setError(err.message || 'Failed to get document');
      throw err;
    }
  };
  
  /**
   * 更新列表中的文档
   */
  const updateDocumentInList = (id: string, updates: Partial<Document>) => {
    setDocuments(prev =>
      prev.map(doc => (doc.id === id ? { ...doc, ...updates } : doc))
    );
  };
  
  return {
    documents,
    loading,
    error,
    uploadDocument,
    deleteDocument,
    retranslateDocument,
    searchDocuments,
    refetch: fetchDocuments,
    getDocument,
  };
}

/**
 * useDocument Hook
 * 管理单个文档的详细信息
 */
export function useDocument(documentId: string) {
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<TranslationProgress | null>(null);
  
  // 获取文档详情
  useEffect(() => {
    const fetchDocument = async () => {
      setLoading(true);
      try {
        const doc = await documentService.getDocument(documentId);
        setDocument(doc);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch document');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDocument();
  }, [documentId]);
  
  // 订阅翻译进度
  useEffect(() => {
    if (!document || document.status === DocumentStatus.COMPLETED) {
      return;
    }
    
    const subscription = documentService.subscribeToProgress(
      documentId,
      (newProgress: TranslationProgress) => {
        setProgress(newProgress);
        setDocument(prev => 
          prev ? {
            ...prev,
            status: newProgress.status,
            progress: newProgress.progress,
          } : null
        );
      }
    );
    
    return () => subscription.unsubscribe();
  }, [documentId, document?.status]);
  
  // 订阅文档更新
  useEffect(() => {
    const subscription = documentService.subscribeToDocumentUpdates(
      documentId,
      (updates: Partial<Document>) => {
        setDocument(prev => (prev ? { ...prev, ...updates } : null));
      }
    );
    
    return () => subscription.unsubscribe();
  }, [documentId]);
  
  const shareDocument = async (
    email: string,
    permissions: {
      canView: boolean;
      canComment: boolean;
      canEdit: boolean;
      canShare: boolean;
      canDownload: boolean;
    }
  ) => {
    if (!document) return;
    
    try {
      await documentService.shareDocument(document.id, email, permissions);
    } catch (err: any) {
      setError(err.message || 'Failed to share document');
      throw err;
    }
  };
  
  return {
    document,
    loading,
    error,
    progress,
    shareDocument,
  };
}
