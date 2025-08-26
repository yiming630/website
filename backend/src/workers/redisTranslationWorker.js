/**
 * Redis翻译工作器
 * 使用Redis队列处理翻译任务，提供高性能处理能力
 */

const { RedisQueue } = require('../core/queueManager');
const openRouterService = require('../../services/api-gateway/src/utils/openRouterService');
const LocalFileStorage = require('../core/localFileStorage');

class RedisTranslationWorker {
  constructor() {
    this.redisQueue = new RedisQueue();
    this.localStorage = new LocalFileStorage();
    this.isRunning = false;
    this.workerName = `redis-translation-worker-${Date.now()}`;
  }

  /**
   * 启动Redis翻译工作器
   */
  async start() {
    if (this.isRunning) {
      console.log('Redis Translation worker already running');
      return;
    }

    console.log(`Starting Redis Translation worker: ${this.workerName}...`);
    this.isRunning = true;

    try {
      // 初始化Redis队列
      await this.redisQueue.initialize();

      // 订阅不同类型的翻译任务
      await this.subscribeToTasks();

      console.log('Redis Translation worker started successfully');

      // 监听队列事件
      this.setupEventListeners();

    } catch (error) {
      console.error('Failed to start Redis Translation worker:', error);
      this.isRunning = false;
      throw error;
    }
  }

  /**
   * 订阅翻译任务
   */
  async subscribeToTasks() {
    // 订阅文档翻译任务 - 高并发处理
    await this.redisQueue.subscribe('translation-document', 
      this.handleDocumentTranslation.bind(this),
      { concurrency: 3 }
    );

    // 订阅文本翻译任务 - 更高并发
    await this.redisQueue.subscribe('translation-text', 
      this.handleTextTranslation.bind(this),
      { concurrency: 5 }
    );

    // 订阅翻译改进任务
    await this.redisQueue.subscribe('translation-improvement', 
      this.handleTranslationImprovement.bind(this),
      { concurrency: 2 }
    );

    console.log('Subscribed to all Redis translation task types');
  }

  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    this.redisQueue.on('jobCompleted', (data) => {
      console.log(`✅ Job completed: ${data.jobId} in ${data.topic}`);
    });

    this.redisQueue.on('jobFailed', (data) => {
      console.error(`❌ Job failed: ${data.jobId} in ${data.topic} - ${data.error}`);
    });

    this.redisQueue.on('jobStalled', (data) => {
      console.warn(`⏸️  Job stalled: ${data.jobId} in ${data.topic}`);
    });
  }

  /**
   * 处理文档翻译任务
   */
  async handleDocumentTranslation(payload, metadata) {
    const { documentId, sourceLanguage, targetLanguage, style, userId } = payload;
    
    console.log(`📄 Processing document translation: ${documentId} (Job: ${metadata.jobId})`);
    console.log(`   Languages: ${sourceLanguage} → ${targetLanguage}, Style: ${style}`);

    try {
      // 模拟四步翻译流程，但在Redis中更高效
      const steps = [
        { name: '文档分割中', progress: 25, duration: 1000 },
        { name: '提交给AI翻译', progress: 60, duration: 5000 },
        { name: '文档整合中', progress: 85, duration: 2000 },
        { name: '自动排版与优化', progress: 100, duration: 1000 }
      ];

      let currentProgress = 0;

      for (const step of steps) {
        console.log(`   ${step.name} (${step.progress}%)`);
        
        if (step.name === '提交给AI翻译') {
          // 执行实际翻译
          await this.performBatchTranslation(documentId, sourceLanguage, targetLanguage, style);
        }
        
        // 模拟处理时间（Redis处理更快）
        await new Promise(resolve => setTimeout(resolve, step.duration));
        currentProgress = step.progress;
        
        // 更新任务进度（Redis支持进度更新）
        this.updateJobProgress(metadata.jobId, currentProgress, step.name);
      }

      // 生成最终文档
      const finalOutputKey = `translations/redis/${documentId}/final.pdf`;
      await this.localStorage.uploadString(
        `Redis translated document: ${documentId} (${sourceLanguage} → ${targetLanguage})`,
        finalOutputKey
      );

      console.log(`✅ Document translation completed: ${documentId}`);
      return {
        success: true,
        documentId,
        outputUrl: finalOutputKey,
        completedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error(`❌ Error processing document translation ${documentId}:`, error);
      throw error; // Redis会自动处理重试
    }
  }

  /**
   * 处理文本翻译任务
   */
  async handleTextTranslation(payload, metadata) {
    const { text, sourceLanguage, targetLanguage, style, userId } = payload;
    
    console.log(`📝 Processing text translation (Job: ${metadata.jobId})`);
    console.log(`   Text: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
    
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

      // 保存翻译结果
      const resultKey = `translations/redis/texts/${metadata.jobId}.json`;
      const result = {
        originalText: text,
        translatedText,
        sourceLanguage: detectedLanguage,
        targetLanguage,
        style,
        translatedAt: new Date().toISOString(),
        jobId: metadata.jobId
      };
      
      await this.localStorage.uploadString(
        JSON.stringify(result, null, 2),
        resultKey
      );

      console.log(`✅ Text translation completed: ${metadata.jobId}`);
      return result;

    } catch (error) {
      console.error(`❌ Error processing text translation:`, error);
      throw error;
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
    
    console.log(`🔧 Processing translation improvement (Job: ${metadata.jobId})`);
    console.log(`   Feedback: "${feedback?.substring(0, 50) || 'No specific feedback'}"`);
    
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
      const resultKey = `translations/redis/improvements/${metadata.jobId}.json`;
      const result = {
        originalText,
        originalTranslation: currentTranslation,
        improvedTranslation,
        sourceLanguage,
        targetLanguage,
        feedback,
        improvedAt: new Date().toISOString(),
        jobId: metadata.jobId
      };
      
      await this.localStorage.uploadString(
        JSON.stringify(result, null, 2),
        resultKey
      );

      console.log(`✅ Translation improvement completed: ${metadata.jobId}`);
      return result;

    } catch (error) {
      console.error(`❌ Error processing translation improvement:`, error);
      throw error;
    }
  }

  /**
   * 执行批量文档翻译
   */
  async performBatchTranslation(documentId, sourceLanguage, targetLanguage, style) {
    try {
      console.log(`   📖 Reading document content: ${documentId}`);
      
      // 模拟读取和分块文档
      const chunks = [
        `Chapter 1: Introduction to ${documentId}`,
        `Chapter 2: Main content of ${documentId}`,
        `Chapter 3: Advanced topics in ${documentId}`,
        `Chapter 4: Conclusion of ${documentId}`
      ];

      console.log(`   🔤 Translating ${chunks.length} chunks`);

      // 批量翻译（Redis支持并发处理）
      const translationPromises = chunks.map(async (chunk, index) => {
        const translatedChunk = await openRouterService.translateText(
          chunk,
          sourceLanguage === 'auto' ? 'en' : sourceLanguage,
          targetLanguage,
          style || 'general'
        );
        
        // 保存单个块
        const chunkKey = `translations/redis/${documentId}/chunks/chunk_${index + 1}.txt`;
        await this.localStorage.uploadString(translatedChunk, chunkKey);
        
        return translatedChunk;
      });

      const translatedChunks = await Promise.all(translationPromises);

      // 合并翻译结果
      const fullTranslation = translatedChunks.join('\n\n');
      
      // 保存完整翻译
      const fullKey = `translations/redis/${documentId}/full_translation.txt`;
      await this.localStorage.uploadString(fullTranslation, fullKey);

      console.log(`   ✅ Batch translation completed for ${documentId}`);

    } catch (error) {
      console.error(`   ❌ Error in batch translation for ${documentId}:`, error);
      throw error;
    }
  }

  /**
   * 更新任务进度
   */
  updateJobProgress(jobId, progress, currentStep) {
    // Redis/Bull支持任务进度更新
    console.log(`   📊 Progress: ${progress}% - ${currentStep}`);
    
    // 在实际应用中，可以通过WebSocket等方式实时通知前端
    process.nextTick(() => {
      process.emit('translationProgress', {
        jobId,
        progress,
        currentStep,
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * 简单的语言检测
   */
  detectLanguage(text) {
    if (/[\u4e00-\u9fa5]/.test(text)) return 'zh'; // 中文
    if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja'; // 日文
    if (/[\uac00-\ud7af]/.test(text)) return 'ko'; // 韩文
    if (/[\u0600-\u06ff]/.test(text)) return 'ar'; // 阿拉伯文
    if (/[\u0400-\u04ff]/.test(text)) return 'ru'; // 俄文
    
    return 'en'; // 默认英文
  }

  /**
   * 获取工作器统计信息
   */
  async getStats() {
    if (!this.isRunning) {
      return { status: 'stopped' };
    }

    try {
      const queueStats = await this.redisQueue.getQueueStats();
      
      return {
        status: 'running',
        workerName: this.workerName,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        queueStats,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Error getting worker stats:', error);
      return { 
        status: 'error', 
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 暂停工作器
   */
  async pause() {
    if (!this.isRunning) {
      console.log('Worker is not running');
      return;
    }

    try {
      // 暂停所有翻译队列
      await this.redisQueue.pauseQueue('translation-document');
      await this.redisQueue.pauseQueue('translation-text');
      await this.redisQueue.pauseQueue('translation-improvement');
      
      console.log('Redis Translation worker paused');
      
    } catch (error) {
      console.error('Error pausing worker:', error);
    }
  }

  /**
   * 恢复工作器
   */
  async resume() {
    if (!this.isRunning) {
      console.log('Worker is not running');
      return;
    }

    try {
      // 恢复所有翻译队列
      await this.redisQueue.resumeQueue('translation-document');
      await this.redisQueue.resumeQueue('translation-text');
      await this.redisQueue.resumeQueue('translation-improvement');
      
      console.log('Redis Translation worker resumed');
      
    } catch (error) {
      console.error('Error resuming worker:', error);
    }
  }

  /**
   * 停止Redis翻译工作器
   */
  async stop() {
    if (!this.isRunning) {
      return;
    }

    console.log(`Stopping Redis Translation worker: ${this.workerName}...`);
    this.isRunning = false;

    try {
      // 关闭Redis队列连接
      await this.redisQueue.close();
      
      console.log('Redis Translation worker stopped');
      
    } catch (error) {
      console.error('Error stopping Redis Translation worker:', error);
    }
  }
}

// 创建全局工作器实例
const redisTranslationWorker = new RedisTranslationWorker();

// 处理进程信号
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down Redis worker gracefully...');
  await redisTranslationWorker.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down Redis worker gracefully...');
  await redisTranslationWorker.stop();
  process.exit(0);
});

// 处理未捕获的异常
process.on('uncaughtException', async (error) => {
  console.error('Uncaught Exception in Redis worker:', error);
  await redisTranslationWorker.stop();
  process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
  console.error('Unhandled Rejection in Redis worker:', reason);
  await redisTranslationWorker.stop();
  process.exit(1);
});

module.exports = RedisTranslationWorker;

// 如果直接运行此文件，启动工作器
if (require.main === module) {
  (async () => {
    try {
      await redisTranslationWorker.start();
      
      console.log(`Redis Translation Worker ${redisTranslationWorker.workerName} is running`);
      console.log('Features:');
      console.log('  • High-performance job processing with Bull/Redis');
      console.log('  • Concurrent task processing (3 doc, 5 text, 2 improvement)');
      console.log('  • Automatic retry with exponential backoff');
      console.log('  • Real-time job progress tracking');
      console.log('  • Batch translation processing');
      console.log('  • Graceful shutdown handling');
      console.log('\nPress Ctrl+C to stop.');
      
    } catch (error) {
      console.error('Failed to start Redis Translation worker:', error);
      process.exit(1);
    }
  })();
}