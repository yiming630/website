/**
 * 翻译工作器
 * 处理队列中的翻译任务
 */

const { queueManager } = require('../core/queueManager');
const openRouterService = require('../../services/api-gateway/src/utils/openRouterService');
const LocalFileStorage = require('../core/localFileStorage');

class TranslationWorker {
  constructor() {
    this.localStorage = new LocalFileStorage();
    this.isRunning = false;
  }

  /**
   * 启动翻译工作器
   */
  async start() {
    if (this.isRunning) {
      console.log('Translation worker already running');
      return;
    }

    console.log('Starting translation worker...');
    this.isRunning = true;

    // 初始化队列管理器
    await queueManager.initialize();

    // 订阅不同类型的翻译任务
    await this.subscribeToTasks();

    console.log('Translation worker started successfully');
  }

  /**
   * 订阅翻译任务
   */
  async subscribeToTasks() {
    // 订阅文档翻译任务
    await queueManager.subscribeDocumentTranslation(
      this.handleDocumentTranslation.bind(this)
    );

    // 订阅文本翻译任务
    await queueManager.subscribeTextTranslation(
      this.handleTextTranslation.bind(this)
    );

    // 订阅翻译改进任务
    await queueManager.subscribeTranslationImprovement(
      this.handleTranslationImprovement.bind(this)
    );

    console.log('Subscribed to all translation task types');
  }

  /**
   * 处理文档翻译任务
   */
  async handleDocumentTranslation(payload, metadata) {
    const { documentId, sourceLanguage, targetLanguage, style, userId } = payload;
    
    console.log(`Processing document translation: ${documentId}`);
    console.log(`Languages: ${sourceLanguage} → ${targetLanguage}, Style: ${style}`);

    try {
      // 模拟四步翻译流程
      const steps = [
        { name: '文档分割中', progress: 20, duration: 2000 },
        { name: '提交给AI翻译', progress: 50, duration: 8000 },
        { name: '文档整合中', progress: 80, duration: 3000 },
        { name: '自动排版与优化', progress: 100, duration: 2000 }
      ];

      let currentProgress = 0;

      for (const step of steps) {
        console.log(`Document ${documentId}: ${step.name}`);
        
        if (step.name === '提交给AI翻译') {
          // 执行实际翻译
          await this.performActualTranslation(documentId, sourceLanguage, targetLanguage, style);
        }
        
        // 模拟处理时间
        await new Promise(resolve => setTimeout(resolve, step.duration));
        currentProgress = step.progress;
        
        // 这里可以发送进度更新到前端（通过WebSocket或其他机制）
        this.updateTranslationProgress(documentId, step.name, currentProgress);
      }

      // 生成最终文档下载链接
      const finalOutputKey = `translations/${documentId}/final.pdf`;
      await this.localStorage.uploadString(
        `Translated document content for ${documentId}`,
        finalOutputKey
      );

      console.log(`Document translation completed: ${documentId}`);
      return true; // 成功

    } catch (error) {
      console.error(`Error processing document translation ${documentId}:`, error);
      return false; // 失败，会触发重试
    }
  }

  /**
   * 处理文本翻译任务
   */
  async handleTextTranslation(payload, metadata) {
    const { text, sourceLanguage, targetLanguage, style, userId } = payload;
    
    console.log(`Processing text translation: ${text.substring(0, 50)}...`);
    
    try {
      // 自动检测源语言
      const detectedLanguage = sourceLanguage === 'auto' 
        ? this.detectLanguage(text) 
        : sourceLanguage;

      // 执行翻译
      const translatedText = await openRouterService.translateText(
        text,
        detectedLanguage,
        targetLanguage,
        style || 'general'
      );

      // 保存翻译结果（可选）
      const resultKey = `text-translations/${metadata.messageId}.json`;
      const result = {
        originalText: text,
        translatedText,
        sourceLanguage: detectedLanguage,
        targetLanguage,
        style,
        translatedAt: new Date().toISOString()
      };
      
      await this.localStorage.uploadString(
        JSON.stringify(result, null, 2),
        resultKey
      );

      console.log(`Text translation completed: ${metadata.messageId}`);
      return true;

    } catch (error) {
      console.error(`Error processing text translation:`, error);
      return false;
    }
  }

  /**
   * 处理翻译改进任务
   */
  async handleTranslationImprovement(payload, metadata) {
    const { 
      originalText, 
      currentTranslation, 
      sourceLanguage, 
      targetLanguage, 
      feedback, 
      userId 
    } = payload;
    
    console.log(`Processing translation improvement: ${metadata.messageId}`);
    
    try {
      // 执行翻译改进
      const improvedTranslation = await openRouterService.improveTranslation(
        originalText,
        currentTranslation,
        sourceLanguage,
        targetLanguage,
        feedback
      );

      // 保存改进结果
      const resultKey = `translation-improvements/${metadata.messageId}.json`;
      const result = {
        originalText,
        originalTranslation: currentTranslation,
        improvedTranslation,
        sourceLanguage,
        targetLanguage,
        feedback,
        improvedAt: new Date().toISOString()
      };
      
      await this.localStorage.uploadString(
        JSON.stringify(result, null, 2),
        resultKey
      );

      console.log(`Translation improvement completed: ${metadata.messageId}`);
      return true;

    } catch (error) {
      console.error(`Error processing translation improvement:`, error);
      return false;
    }
  }

  /**
   * 执行实际文档翻译
   */
  async performActualTranslation(documentId, sourceLanguage, targetLanguage, style) {
    try {
      // 这里应该：
      // 1. 从存储中读取文档内容
      // 2. 将文档分割成块
      // 3. 批量翻译每个块
      // 4. 保存翻译结果

      // 模拟读取文档内容
      console.log(`Reading document content for ${documentId}`);
      
      // 模拟文档分块
      const chunks = [
        'This is the first chunk of the document.',
        'This is the second chunk of the document.',
        'This is the third chunk of the document.'
      ];

      // 翻译每个块
      const translatedChunks = [];
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        console.log(`Translating chunk ${i + 1}/${chunks.length}`);
        
        const translatedChunk = await openRouterService.translateText(
          chunk,
          sourceLanguage === 'auto' ? 'en' : sourceLanguage,
          targetLanguage,
          style || 'general'
        );
        
        translatedChunks.push(translatedChunk);
        
        // 保存单个块的翻译结果
        const chunkKey = `translations/${documentId}/chunks/chunk_${i + 1}.txt`;
        await this.localStorage.uploadString(translatedChunk, chunkKey);
      }

      // 合并翻译结果
      const fullTranslation = translatedChunks.join('\n\n');
      
      // 保存完整翻译
      const fullKey = `translations/${documentId}/full_translation.txt`;
      await this.localStorage.uploadString(fullTranslation, fullKey);

      console.log(`Document translation processing completed for ${documentId}`);

    } catch (error) {
      console.error(`Error in actual translation for ${documentId}:`, error);
      throw error;
    }
  }

  /**
   * 更新翻译进度
   */
  updateTranslationProgress(documentId, currentStep, progress) {
    // 这里可以：
    // 1. 更新数据库中的进度
    // 2. 通过WebSocket发送实时进度到前端
    // 3. 发送通知等
    
    console.log(`Progress update - Document: ${documentId}, Step: ${currentStep}, Progress: ${progress}%`);
    
    // 示例：可以通过事件发送进度更新
    process.nextTick(() => {
      process.emit('translationProgress', {
        documentId,
        currentStep,
        progress,
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * 简单的语言检测
   */
  detectLanguage(text) {
    // 简单的启发式语言检测
    if (/[\u4e00-\u9fa5]/.test(text)) return 'zh'; // 中文
    if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja'; // 日文
    if (/[\uac00-\ud7af]/.test(text)) return 'ko'; // 韩文
    if (/[\u0600-\u06ff]/.test(text)) return 'ar'; // 阿拉伯文
    if (/[\u0400-\u04ff]/.test(text)) return 'ru'; // 俄文
    
    return 'en'; // 默认英文
  }

  /**
   * 停止翻译工作器
   */
  async stop() {
    if (!this.isRunning) {
      return;
    }

    console.log('Stopping translation worker...');
    this.isRunning = false;

    // 关闭队列连接
    await queueManager.close();

    console.log('Translation worker stopped');
  }

  /**
   * 获取工作器状态
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      queueStats: this.isRunning ? null : 'Queue not initialized'
    };
  }
}

// 创建全局工作器实例
const translationWorker = new TranslationWorker();

// 处理进程信号
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  await translationWorker.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  await translationWorker.stop();
  process.exit(0);
});

module.exports = TranslationWorker;

// 如果直接运行此文件，启动工作器
if (require.main === module) {
  (async () => {
    try {
      await translationWorker.start();
      
      // 保持进程运行
      console.log('Translation worker is running. Press Ctrl+C to stop.');
      
    } catch (error) {
      console.error('Failed to start translation worker:', error);
      process.exit(1);
    }
  })();
}