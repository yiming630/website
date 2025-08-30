const openRouterService = require('../utils/openRouterService');
const LocalFileStorage = require('../../../../src/core/localFileStorage');
const { queueManager } = require('../../src/core/queueManager');
const { v4: uuidv4 } = require('uuid');

// Initialize local storage
const localStorage = new LocalFileStorage();

// Store for tracking translation jobs
const translationJobs = new Map();

// Supported languages configuration
const supportedLanguages = [
  { code: 'en', name: 'English', nativeName: 'English', isAutoDetected: true, supportedAsSource: true, supportedAsTarget: true },
  { code: 'zh', name: 'Chinese', nativeName: '中文', isAutoDetected: true, supportedAsSource: true, supportedAsTarget: true },
  { code: 'es', name: 'Spanish', nativeName: 'Español', isAutoDetected: true, supportedAsSource: true, supportedAsTarget: true },
  { code: 'fr', name: 'French', nativeName: 'Français', isAutoDetected: true, supportedAsSource: true, supportedAsTarget: true },
  { code: 'de', name: 'German', nativeName: 'Deutsch', isAutoDetected: true, supportedAsSource: true, supportedAsTarget: true },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', isAutoDetected: true, supportedAsSource: true, supportedAsTarget: true },
  { code: 'ko', name: 'Korean', nativeName: '한국어', isAutoDetected: true, supportedAsSource: true, supportedAsTarget: true },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', isAutoDetected: true, supportedAsSource: true, supportedAsTarget: true },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', isAutoDetected: true, supportedAsSource: true, supportedAsTarget: true },
  { code: 'auto', name: 'Auto Detect', nativeName: 'Auto', isAutoDetected: true, supportedAsSource: true, supportedAsTarget: false }
];

// Translation specializations
const translationSpecializations = [
  { key: 'general', title: 'General', description: 'General purpose translation', requiresExpertise: false },
  { key: 'technical', title: 'Technical', description: 'Technical documentation and manuals', requiresExpertise: true },
  { key: 'legal', title: 'Legal', description: 'Legal documents and contracts', requiresExpertise: true },
  { key: 'medical', title: 'Medical', description: 'Medical and healthcare documents', requiresExpertise: true },
  { key: 'business', title: 'Business', description: 'Business correspondence and reports', requiresExpertise: false },
  { key: 'academic', title: 'Academic', description: 'Academic papers and research', requiresExpertise: true },
  { key: 'creative', title: 'Creative', description: 'Creative and literary content', requiresExpertise: false },
  { key: 'financial', title: 'Financial', description: 'Financial reports and documents', requiresExpertise: true }
];

const translationResolver = {
  Query: {
    // Get supported languages
    supportedLanguages: async () => {
      return supportedLanguages;
    },

    // Get translation specializations
    translationSpecializations: async () => {
      return translationSpecializations;
    },

    // Get translation history (compatibility with existing system)
    translationHistory: async (parent, { limit = 20 }, { db }) => {
      try {
        const result = await db.query(
          `SELECT * FROM translation_jobs 
           WHERE status = 'completed' 
           ORDER BY completed_at DESC 
           LIMIT $1`,
          [limit]
        );
        return result.rows;
      } catch (error) {
        // Fallback to in-memory jobs if DB not available
        const jobs = Array.from(translationJobs.values())
          .filter(job => job.status === 'completed')
          .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
          .slice(0, limit);
        return jobs;
      }
    }
  },

  Mutation: {
    // Upload document for translation (unified API)
    uploadDocument: async (parent, { input }, { requireAuth, db }) => {
      try {
        const {
          title,
          sourceLanguage,
          targetLanguage,
          translationStyle,
          specialization,
          fileUrl,
          fileSize,
          fileType
        } = input;

        // Authenticate user if auth is available
        let userId = null;
        try {
          const user = requireAuth ? requireAuth() : null;
          userId = user?.id;
        } catch {
          // Continue without auth for now
        }

        // Auto-detect language if set to 'auto'
        let detectedSourceLang = sourceLanguage;
        if (sourceLanguage === 'auto' && fileUrl) {
          // In production, would analyze file content
          detectedSourceLang = 'en'; // Default for now
        }

        // Store document in database if available
        if (db) {
          try {
            const result = await db.query(
              `INSERT INTO documents (
                project_id, original_filename, file_type, file_size_bytes,
                storage_path, status, word_count, metadata
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
              RETURNING *`,
              [
                input.projectId || null,
                title,
                fileType || 'pdf',
                fileSize || 0,
                fileUrl,
                'processing',
                0,
                JSON.stringify({
                  sourceLanguage: detectedSourceLang,
                  targetLanguage,
                  translationStyle,
                  specialization
                })
              ]
            );
            
            const document = result.rows[0];
            
            // Start async translation
            processTranslation(document.id, detectedSourceLang, targetLanguage, translationStyle);
            
            return document;
          } catch (dbError) {
            console.error('Database error:', dbError);
          }
        }

        // Fallback to in-memory storage
        const documentId = uuidv4();
        const document = {
          id: documentId,
          original_filename: title,
          status: 'processing',
          progress: 0,
          file_type: fileType || 'pdf',
          file_size_bytes: fileSize || 0,
          storage_path: fileUrl,
          metadata: {
            sourceLanguage: detectedSourceLang,
            targetLanguage,
            translationStyle,
            specialization
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Start translation process
        processTranslation(documentId, detectedSourceLang, targetLanguage, translationStyle);

        return document;
      } catch (error) {
        console.error('Upload document error:', error);
        throw new Error(`Failed to upload document: ${error.message}`);
      }
    },

    // Translate text directly (unified API)
    translateText: async (parent, { input }, context) => {
      try {
        const { text, sourceLanguage = 'auto', targetLanguage, style = 'general' } = input;

        // Auto-detect source language if set to 'auto'
        let detectedLanguage = sourceLanguage;
        if (sourceLanguage === 'auto') {
          // Use a simple heuristic for now, can be improved with proper detection
          detectedLanguage = detectLanguage(text);
        }

        // 对于直接文本翻译，仍然使用同步方式以便立即返回结果
        // 但也可以选择使用队列进行异步处理
        let translatedText;
        
        const useQueue = process.env.USE_QUEUE_FOR_TEXT_TRANSLATION === 'true';
        
        if (useQueue) {
          // 使用队列异步处理
          const messageId = await queueManager.publishTextTranslation(
            text, detectedLanguage, targetLanguage, style
          );
          translatedText = `Translation queued with ID: ${messageId}`;
        } else {
          // 同步处理以便立即返回结果
          translatedText = await openRouterService.translateText(
            text,
            detectedLanguage,
            targetLanguage,
            style
          );
        }

        return {
          originalText: text,
          translatedText,
          sourceLanguage: detectedLanguage,
          targetLanguage,
          style,
          createdAt: new Date().toISOString()
        };
      } catch (error) {
        console.error('Text translation error:', error);
        throw new Error(`Translation failed: ${error.message}`);
      }
    },

    // Improve existing translation
    improveTranslation: async (parent, { input }) => {
      try {
        const {
          originalText,
          currentTranslation,
          sourceLanguage,
          targetLanguage,
          feedback
        } = input;

        // 翻译改进可以使用队列或同步处理
        let improvedTranslation;
        
        const useQueue = process.env.USE_QUEUE_FOR_IMPROVEMENT === 'true';
        
        if (useQueue) {
          // 使用队列异步处理
          const messageId = await queueManager.publishTranslationImprovement(
            originalText, currentTranslation, sourceLanguage, targetLanguage, feedback
          );
          improvedTranslation = `Improvement queued with ID: ${messageId}`;
        } else {
          // 同步处理
          improvedTranslation = await openRouterService.improveTranslation(
            originalText,
            currentTranslation,
            sourceLanguage,
            targetLanguage,
            feedback
          );
        }

        return {
          originalText,
          originalTranslation: currentTranslation,
          improvedTranslation,
          sourceLanguage,
          targetLanguage,
          feedback,
          createdAt: new Date().toISOString()
        };
      } catch (error) {
        console.error('Translation improvement error:', error);
        throw new Error(`Failed to improve translation: ${error.message}`);
      }
    },

    // Start translation job (compatibility with existing document system)
    startTranslation: async (parent, { documentId }, { requireAuth, db }) => {
      try {
        const user = requireAuth ? requireAuth() : null;
        
        // Get document metadata
        let documentMetadata = null;
        if (db) {
          const docResult = await db.query(
            'SELECT * FROM documents WHERE id = $1',
            [documentId]
          );
          documentMetadata = docResult.rows[0];
        }
        
        // Create translation job in database
        if (db && documentMetadata) {
          const result = await db.query(
            `INSERT INTO translation_jobs (
              document_id, status, progress_percentage, 
              ai_model, total_tokens_used, translation_settings
            )
             VALUES ($1, 'pending', 0, $2, 0, $3)
             RETURNING *`,
            [
              documentId, 
              'google/gemini-flash-1.5',
              JSON.stringify(documentMetadata.metadata || {})
            ]
          );
          
          // Update document status
          await db.query(
            'UPDATE documents SET status = $1 WHERE id = $2',
            ['translating', documentId]
          );
          
          // Start async translation
          const job = result.rows[0];
          processDocumentTranslation(
            job.id, 
            documentId, 
            documentMetadata.metadata?.targetLanguage || 'zh',
            documentMetadata.metadata?.translationStyle || 'GENERAL'
          );
          
          return job;
        }
        
        // Fallback to in-memory
        const jobId = uuidv4();
        const job = {
          id: jobId,
          document_id: documentId,
          status: 'running',
          progress_percentage: 0,
          ai_model: 'google/gemini-flash-1.5',
          total_tokens_used: 0,
          created_at: new Date().toISOString(),
          currentStep: '文档分割中'
        };
        
        translationJobs.set(jobId, job);
        processDocumentTranslation(jobId, documentId, 'zh', 'GENERAL');
        
        return job;
      } catch (error) {
        console.error('Start translation error:', error);
        throw new Error(`Failed to start translation: ${error.message}`);
      }
    },

    // Retranslate document (unified API)
    retranslateDocument: async (parent, { documentId, targetLanguage, translationStyle }, { requireAuth, db }) => {
      try {
        // Create new translation job
        const jobId = uuidv4();
        const job = {
          id: jobId,
          documentId,
          status: 'PROCESSING',
          progress: 0,
          targetLanguage,
          translationStyle: translationStyle || 'general',
          createdAt: new Date().toISOString(),
          segments: [],
          currentStep: '重新翻译中'
        };

        // Store job
        translationJobs.set(jobId, job);

        // Start retranslation
        processDocumentTranslation(jobId, documentId, targetLanguage, translationStyle);

        return {
          id: documentId,
          status: 'TRANSLATING',
          progress: 0,
          targetLanguage,
          translationStyle
        };
      } catch (error) {
        console.error('Retranslate document error:', error);
        throw new Error(`Failed to retranslate document: ${error.message}`);
      }
    }
  },

  Subscription: {
    // Translation progress subscription
    translationProgress: {
      subscribe: async function* (parent, { documentId }) {
        // Simulate progress updates
        let progress = 0;
        const steps = [
          { step: '文档分割中', progress: 20 },
          { step: '提交给AI翻译', progress: 50 },
          { step: '文档整合中', progress: 80 },
          { step: '自动排版与优化', progress: 100 }
        ];

        for (const { step, progress: p } of steps) {
          yield {
            translationProgress: {
              documentId,
              status: p === 100 ? 'COMPLETED' : 'TRANSLATING',
              progress: p,
              currentStep: step,
              estimatedTimeRemaining: Math.max(0, (100 - p) * 3)
            }
          };
          
          // Wait before next update
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
  }
};

// Helper function to process translation using queue system
async function processTranslation(documentId, sourceLanguage, targetLanguage, style) {
  try {
    // 发布文档翻译任务到队列
    const messageId = await queueManager.publishDocumentTranslation(
      documentId,
      sourceLanguage === 'auto' ? 'en' : sourceLanguage,
      targetLanguage,
      style?.toLowerCase() || 'general'
    );
    
    console.log(`Document translation task published: ${messageId}`);
    
  } catch (error) {
    console.error('Translation processing error:', error);
  }
}

// Helper function to process document translation using queue system
async function processDocumentTranslation(jobId, documentId, targetLanguage, style) {
  try {
    // 发布文档翻译任务到队列
    const messageId = await queueManager.publishDocumentTranslation(
      documentId,
      'auto', // 会在处理时检测
      targetLanguage,
      style?.toLowerCase() || 'general'
    );
    
    console.log(`Document translation task published: ${messageId} for job ${jobId}`);
    
    // 更新作业状态
    const job = translationJobs.get(jobId);
    if (job) {
      job.status = 'running';
      job.progress_percentage = 10;
      job.currentStep = '任务已提交到队列';
    }
    
  } catch (error) {
    console.error('Document translation error:', error);
    const job = translationJobs.get(jobId);
    if (job) {
      job.status = 'failed';
      job.error_message = error.message;
    }
  }
}

// Simple language detection helper
function detectLanguage(text) {
  // Simple heuristic - check for common characters
  if (/[\u4e00-\u9fa5]/.test(text)) return 'zh'; // Chinese
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja'; // Japanese
  if (/[\uac00-\ud7af]/.test(text)) return 'ko'; // Korean
  if (/[\u0600-\u06ff]/.test(text)) return 'ar'; // Arabic
  if (/[\u0400-\u04ff]/.test(text)) return 'ru'; // Russian
  
  // Default to English
  return 'en';
}

module.exports = translationResolver;