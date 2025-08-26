/**
 * 队列管理器 - 统一的队列接口
 * 支持PostgreSQL和内存队列，替代Google Pub/Sub
 */

const PostgreSQLQueue = require('./postgresQueue');
const RedisQueue = require('./redisQueue');
const EventEmitter = require('events');

/**
 * 内存队列实现（用于开发和测试）
 */
class MemoryQueue extends EventEmitter {
  constructor() {
    super();
    this.queues = new Map();
    this.subscribers = new Map();
    this.messageId = 0;
    this.processing = new Map();
  }

  async initialize() {
    console.log('Memory Queue initialized');
    return true;
  }

  async publish(topic, message, options = {}) {
    const messageId = `mem_${++this.messageId}_${Date.now()}`;
    
    if (!this.queues.has(topic)) {
      this.queues.set(topic, []);
    }
    
    const queueMessage = {
      id: messageId,
      topic,
      payload: message,
      priority: options.priority || 0,
      retryCount: 0,
      maxRetries: options.maxRetries || 3,
      createdAt: new Date(),
      scheduledAt: new Date(Date.now() + (options.delaySeconds || 0) * 1000)
    };
    
    this.queues.get(topic).push(queueMessage);
    
    // 按优先级和时间排序
    this.queues.get(topic).sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority; // 高优先级在前
      }
      return a.scheduledAt - b.scheduledAt; // 早时间在前
    });
    
    console.log(`Published message ${messageId} to memory queue topic ${topic}`);
    this.emit('messagePublished', { topic, messageId, message });
    
    return messageId;
  }

  async subscribe(topic, callback, options = {}) {
    const subscriberId = options.subscriberId || `${topic}_mem_${Date.now()}`;
    
    if (!this.subscribers.has(topic)) {
      this.subscribers.set(topic, []);
    }
    
    this.subscribers.get(topic).push({
      id: subscriberId,
      callback,
      options
    });
    
    // 启动轮询处理
    setInterval(() => {
      this.processMessages(topic);
    }, options.pollInterval || 1000);
    
    console.log(`Subscribed to memory queue topic ${topic} with subscriber ${subscriberId}`);
    return subscriberId;
  }

  async processMessages(topic) {
    const queue = this.queues.get(topic);
    const subscribers = this.subscribers.get(topic);
    
    if (!queue || !subscribers || queue.length === 0) {
      return;
    }
    
    const now = new Date();
    const availableMessages = queue.filter(msg => msg.scheduledAt <= now);
    
    for (const subscriber of subscribers) {
      const maxMessages = subscriber.options.maxMessages || 1;
      const messages = availableMessages.splice(0, maxMessages);
      
      for (const message of messages) {
        const index = queue.indexOf(message);
        if (index > -1) {
          queue.splice(index, 1);
          
          try {
            const success = await subscriber.callback(message.payload, {
              messageId: message.id,
              retryCount: message.retryCount,
              createdAt: message.createdAt
            });
            
            if (!success && message.retryCount < message.maxRetries) {
              message.retryCount++;
              message.scheduledAt = new Date(now.getTime() + Math.pow(2, message.retryCount) * 1000);
              queue.push(message);
              console.log(`Message ${message.id} requeued for retry ${message.retryCount}`);
            } else if (!success) {
              console.warn(`Message ${message.id} failed after max retries`);
            }
            
          } catch (error) {
            console.error(`Error processing message ${message.id}:`, error);
            if (message.retryCount < message.maxRetries) {
              message.retryCount++;
              message.scheduledAt = new Date(now.getTime() + Math.pow(2, message.retryCount) * 1000);
              queue.push(message);
            }
          }
        }
      }
    }
  }

  async getQueueStats(topic = null) {
    if (topic) {
      const queue = this.queues.get(topic) || [];
      return {
        topic,
        total_messages: queue.length,
        pending_messages: queue.filter(m => m.scheduledAt <= new Date()).length,
        processing_messages: 0,
        completed_messages: 0,
        failed_messages: 0,
        avg_processing_time_seconds: 0
      };
    } else {
      const stats = {};
      for (const [topicName, queue] of this.queues.entries()) {
        stats[topicName] = {
          total_messages: queue.length,
          pending_messages: queue.filter(m => m.scheduledAt <= new Date()).length,
          processing_messages: 0,
          completed_messages: 0,
          failed_messages: 0,
          avg_processing_time_seconds: 0
        };
      }
      return stats;
    }
  }

  async close() {
    this.queues.clear();
    this.subscribers.clear();
    console.log('Memory Queue closed');
  }
}

/**
 * 统一队列管理器
 */
class QueueManager {
  constructor() {
    this.queue = null;
    this.initialized = false;
  }

  /**
   * 初始化队列系统
   */
  async initialize() {
    if (this.initialized) return;

    const queueType = process.env.QUEUE_TYPE || 'postgresql';
    
    try {
      switch (queueType.toLowerCase()) {
        case 'postgresql':
        case 'postgres':
          this.queue = new PostgreSQLQueue();
          break;
          
        case 'redis':
          this.queue = new RedisQueue();
          break;
          
        case 'memory':
        case 'inmemory':
          this.queue = new MemoryQueue();
          break;
          
        default:
          console.warn(`Unknown queue type: ${queueType}, falling back to memory queue`);
          this.queue = new MemoryQueue();
      }
      
      await this.queue.initialize();
      this.initialized = true;
      
      console.log(`Queue manager initialized with ${queueType} backend`);
      
    } catch (error) {
      console.error('Failed to initialize queue manager:', error);
      
      // Fallback to memory queue
      console.log('Falling back to memory queue');
      this.queue = new MemoryQueue();
      await this.queue.initialize();
      this.initialized = true;
    }
  }

  /**
   * 发布翻译任务
   */
  async publishTranslationTask(taskData) {
    if (!this.initialized) await this.initialize();

    const { type, ...data } = taskData;
    const topic = `translation-${type}`;
    
    return await this.queue.publish(topic, data, {
      priority: data.priority || 0,
      maxRetries: 3
    });
  }

  /**
   * 订阅翻译任务
   */
  async subscribeTranslationTasks(taskType, handler) {
    if (!this.initialized) await this.initialize();

    const topic = `translation-${taskType}`;
    
    return await this.queue.subscribe(topic, async (payload, metadata) => {
      try {
        console.log(`Processing ${taskType} task:`, metadata.messageId);
        const result = await handler(payload, metadata);
        return result !== false; // 默认成功，除非明确返回false
      } catch (error) {
        console.error(`Error processing ${taskType} task:`, error);
        return false; // 失败，触发重试
      }
    }, {
      maxMessages: 1,
      visibilityTimeout: 300, // 5分钟
      pollInterval: 2000 // 2秒轮询
    });
  }

  /**
   * 发布文档翻译任务
   */
  async publishDocumentTranslation(documentId, sourceLanguage, targetLanguage, style, userId = null) {
    return await this.publishTranslationTask({
      type: 'document',
      documentId,
      sourceLanguage,
      targetLanguage,
      style,
      userId,
      priority: 1
    });
  }

  /**
   * 发布文本翻译任务
   */
  async publishTextTranslation(text, sourceLanguage, targetLanguage, style, userId = null) {
    return await this.publishTranslationTask({
      type: 'text',
      text,
      sourceLanguage,
      targetLanguage,
      style,
      userId,
      priority: 2 // 文本翻译优先级较高
    });
  }

  /**
   * 发布翻译改进任务
   */
  async publishTranslationImprovement(originalText, currentTranslation, sourceLanguage, targetLanguage, feedback, userId = null) {
    return await this.publishTranslationTask({
      type: 'improvement',
      originalText,
      currentTranslation,
      sourceLanguage,
      targetLanguage,
      feedback,
      userId,
      priority: 3 // 改进任务优先级最高
    });
  }

  /**
   * 订阅文档翻译任务
   */
  async subscribeDocumentTranslation(handler) {
    return await this.subscribeTranslationTasks('document', handler);
  }

  /**
   * 订阅文本翻译任务
   */
  async subscribeTextTranslation(handler) {
    return await this.subscribeTranslationTasks('text', handler);
  }

  /**
   * 订阅翻译改进任务
   */
  async subscribeTranslationImprovement(handler) {
    return await this.subscribeTranslationTasks('improvement', handler);
  }

  /**
   * 获取队列统计信息
   */
  async getStats() {
    if (!this.initialized) await this.initialize();
    return await this.queue.getQueueStats();
  }

  /**
   * 获取指定主题的统计信息
   */
  async getTopicStats(topic) {
    if (!this.initialized) await this.initialize();
    return await this.queue.getQueueStats(topic);
  }

  /**
   * 清理旧消息
   */
  async cleanup(days = 7) {
    if (!this.initialized) await this.initialize();
    
    if (this.queue.cleanupOldMessages) {
      return await this.queue.cleanupOldMessages(days);
    }
    
    return 0;
  }

  /**
   * 关闭队列管理器
   */
  async close() {
    if (this.queue) {
      await this.queue.close();
      this.queue = null;
    }
    this.initialized = false;
  }
}

// 全局队列管理器实例
const queueManager = new QueueManager();

module.exports = {
  QueueManager,
  queueManager,
  PostgreSQLQueue,
  RedisQueue,
  MemoryQueue
};