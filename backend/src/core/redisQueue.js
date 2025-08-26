/**
 * Redis Queue System - JavaScript Implementation
 * 使用Redis和Bull作为消息队列，提供高性能的任务处理
 * 适用于需要高并发处理的场景
 */

const Bull = require('bull');
const Redis = require('ioredis');
const EventEmitter = require('events');

class RedisQueue extends EventEmitter {
  constructor() {
    super();
    
    // Redis configuration
    this.redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      db: parseInt(process.env.REDIS_DB || '0'),
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      lazyConnect: true
    };
    
    this.redis = null;
    this.queues = new Map();
    this.processors = new Map();
    this.initialized = false;
    
    console.log('Redis Queue initialized');
  }
  
  /**
   * 初始化Redis连接和队列系统
   */
  async initialize() {
    if (this.initialized) return;
    
    try {
      // Create Redis connection
      this.redis = new Redis(this.redisConfig);
      
      // Test connection
      await this.redis.ping();
      
      this.initialized = true;
      console.log('Redis Queue initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize Redis Queue:', error);
      throw error;
    }
  }
  
  /**
   * 获取或创建指定主题的队列
   */
  getQueue(topic) {
    if (!this.initialized) {
      throw new Error('Redis Queue not initialized');
    }
    
    if (!this.queues.has(topic)) {
      const queue = new Bull(topic, {
        redis: this.redisConfig,
        defaultJobOptions: {
          removeOnComplete: 50,    // 保留最近50个完成的任务
          removeOnFail: 100,       // 保留最近100个失败的任务
          attempts: 3,             // 最多重试3次
          backoff: {
            type: 'exponential',
            delay: 2000            // 指数退避，从2秒开始
          }
        }
      });
      
      this.queues.set(topic, queue);
      console.log(`Created Redis queue for topic: ${topic}`);
      
      // 监听队列事件
      queue.on('completed', (job, result) => {
        console.log(`Job ${job.id} completed in queue ${topic}`);
        this.emit('jobCompleted', { topic, jobId: job.id, result });
      });
      
      queue.on('failed', (job, err) => {
        console.error(`Job ${job.id} failed in queue ${topic}:`, err.message);
        this.emit('jobFailed', { topic, jobId: job.id, error: err.message });
      });
      
      queue.on('stalled', (job) => {
        console.warn(`Job ${job.id} stalled in queue ${topic}`);
        this.emit('jobStalled', { topic, jobId: job.id });
      });
    }
    
    return this.queues.get(topic);
  }
  
  /**
   * 发布消息到队列
   * @param {string} topic - 消息主题
   * @param {object} message - 消息内容
   * @param {object} options - 选项
   * @returns {Promise<string>} 任务ID
   */
  async publish(topic, message, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    const {
      priority = 0,
      delaySeconds = 0,
      maxRetries = 3
    } = options;
    
    const queue = this.getQueue(topic);
    
    // 准备任务数据
    const taskData = {
      topic,
      payload: message,
      publishedAt: new Date().toISOString()
    };
    
    // 设置任务选项
    const jobOptions = {
      priority: priority,
      attempts: maxRetries,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    };
    
    // 如果有延迟，设置延迟时间
    if (delaySeconds > 0) {
      jobOptions.delay = delaySeconds * 1000;
    }
    
    try {
      const job = await queue.add('process', taskData, jobOptions);
      
      console.log(`Published message to Redis queue ${topic}: ${job.id}`);
      this.emit('messagePublished', { topic, jobId: job.id, message });
      
      return job.id;
      
    } catch (error) {
      console.error('Error publishing message to Redis:', error);
      throw error;
    }
  }
  
  /**
   * 订阅主题消息
   * @param {string} topic - 消息主题
   * @param {function} callback - 消息处理回调函数
   * @param {object} options - 选项
   */
  async subscribe(topic, callback, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    const {
      concurrency = 1,
      processorName = 'process'
    } = options;
    
    const queue = this.getQueue(topic);
    
    // 注册处理器
    queue.process(processorName, concurrency, async (job) => {
      const { payload } = job.data;
      
      console.log(`Processing job ${job.id} in queue ${topic}`);
      
      try {
        // 准备元数据
        const metadata = {
          jobId: job.id,
          topic,
          attempt: job.attemptsMade + 1,
          maxAttempts: job.opts.attempts,
          publishedAt: job.data.publishedAt,
          startedAt: new Date().toISOString()
        };
        
        // 调用回调函数
        const result = await callback(payload, metadata);
        
        if (result === false) {
          throw new Error('Callback returned false, marking job as failed');
        }
        
        console.log(`Successfully processed job ${job.id} in queue ${topic}`);
        return result || true;
        
      } catch (error) {
        console.error(`Error processing job ${job.id} in queue ${topic}:`, error);
        throw error; // Bull会处理重试逻辑
      }
    });
    
    // 保存处理器信息
    this.processors.set(`${topic}_${processorName}`, {
      topic,
      callback,
      concurrency,
      processorName
    });
    
    console.log(`Subscribed to Redis queue topic ${topic} with concurrency ${concurrency}`);
    this.emit('subscribed', { topic, concurrency });
  }
  
  /**
   * 获取队列统计信息
   */
  async getQueueStats(topic = null) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    if (topic) {
      // 单个队列统计
      if (!this.queues.has(topic)) {
        return { topic, error: 'Queue not found' };
      }
      
      const queue = this.queues.get(topic);
      
      try {
        const [waiting, active, completed, failed, delayed] = await Promise.all([
          queue.getWaiting(),
          queue.getActive(),
          queue.getCompleted(),
          queue.getFailed(),
          queue.getDelayed()
        ]);
        
        return {
          topic,
          waiting: waiting.length,
          active: active.length,
          completed: completed.length,
          failed: failed.length,
          delayed: delayed.length,
          total: waiting.length + active.length + completed.length + failed.length + delayed.length
        };
        
      } catch (error) {
        console.error(`Error getting stats for queue ${topic}:`, error);
        return { topic, error: error.message };
      }
      
    } else {
      // 所有队列统计
      const stats = {};
      
      for (const [topicName, queue] of this.queues.entries()) {
        try {
          const [waiting, active, completed, failed, delayed] = await Promise.all([
            queue.getWaiting(),
            queue.getActive(),
            queue.getCompleted(),
            queue.getFailed(),
            queue.getDelayed()
          ]);
          
          stats[topicName] = {
            waiting: waiting.length,
            active: active.length,
            completed: completed.length,
            failed: failed.length,
            delayed: delayed.length,
            total: waiting.length + active.length + completed.length + failed.length + delayed.length
          };
          
        } catch (error) {
          console.error(`Error getting stats for queue ${topicName}:`, error);
          stats[topicName] = { error: error.message };
        }
      }
      
      return stats;
    }
  }
  
  /**
   * 获取任务状态
   */
  async getJobStatus(topic, jobId) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    const queue = this.getQueue(topic);
    
    try {
      const job = await queue.getJob(jobId);
      
      if (!job) {
        return { jobId, status: 'not_found' };
      }
      
      return {
        jobId,
        status: await job.getState(),
        progress: job.progress(),
        createdAt: new Date(job.timestamp).toISOString(),
        processedOn: job.processedOn ? new Date(job.processedOn).toISOString() : null,
        finishedOn: job.finishedOn ? new Date(job.finishedOn).toISOString() : null,
        attemptsMade: job.attemptsMade,
        maxAttempts: job.opts.attempts,
        data: job.data,
        returnvalue: job.returnvalue,
        failedReason: job.failedReason
      };
      
    } catch (error) {
      console.error(`Error getting job status: ${error}`);
      return { jobId, status: 'error', error: error.message };
    }
  }
  
  /**
   * 取消任务
   */
  async cancelJob(topic, jobId) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    const queue = this.getQueue(topic);
    
    try {
      const job = await queue.getJob(jobId);
      
      if (!job) {
        console.warn(`Job not found for cancellation: ${jobId}`);
        return false;
      }
      
      await job.remove();
      console.log(`Cancelled job: ${jobId}`);
      this.emit('jobCancelled', { topic, jobId });
      
      return true;
      
    } catch (error) {
      console.error(`Error cancelling job ${jobId}:`, error);
      return false;
    }
  }
  
  /**
   * 重试失败的任务
   */
  async retryFailedJobs(topic, limit = null) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    const queue = this.getQueue(topic);
    
    try {
      let failedJobs = await queue.getFailed();
      
      if (limit) {
        failedJobs = failedJobs.slice(0, limit);
      }
      
      let retriedCount = 0;
      
      for (const job of failedJobs) {
        try {
          await job.retry();
          retriedCount++;
          console.log(`Retried failed job: ${job.id}`);
        } catch (error) {
          console.error(`Error retrying job ${job.id}:`, error);
        }
      }
      
      console.log(`Retried ${retriedCount} failed jobs in queue ${topic}`);
      this.emit('jobsRetried', { topic, count: retriedCount });
      
      return retriedCount;
      
    } catch (error) {
      console.error(`Error retrying failed jobs:`, error);
      return 0;
    }
  }
  
  /**
   * 清理旧任务
   */
  async cleanupOldJobs(topic = null, days = 7) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
    let totalCleaned = 0;
    
    const queuesToClean = topic ? [this.getQueue(topic)] : Array.from(this.queues.values());
    
    for (const queue of queuesToClean) {
      try {
        // 清理已完成的任务
        const completed = await queue.getCompleted();
        let cleanedFromQueue = 0;
        
        for (const job of completed) {
          if (job.finishedOn < cutoffTime) {
            await job.remove();
            cleanedFromQueue++;
          }
        }
        
        // 清理失败的任务
        const failed = await queue.getFailed();
        
        for (const job of failed) {
          if (job.finishedOn < cutoffTime) {
            await job.remove();
            cleanedFromQueue++;
          }
        }
        
        totalCleaned += cleanedFromQueue;
        console.log(`Cleaned ${cleanedFromQueue} old jobs from queue ${queue.name}`);
        
      } catch (error) {
        console.error(`Error cleaning queue ${queue.name}:`, error);
      }
    }
    
    console.log(`Total cleaned ${totalCleaned} old jobs`);
    this.emit('jobsCleaned', { count: totalCleaned, days });
    
    return totalCleaned;
  }
  
  /**
   * 暂停队列
   */
  async pauseQueue(topic) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    const queue = this.getQueue(topic);
    await queue.pause();
    
    console.log(`Paused queue: ${topic}`);
    this.emit('queuePaused', { topic });
  }
  
  /**
   * 恢复队列
   */
  async resumeQueue(topic) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    const queue = this.getQueue(topic);
    await queue.resume();
    
    console.log(`Resumed queue: ${topic}`);
    this.emit('queueResumed', { topic });
  }
  
  /**
   * 关闭队列连接
   */
  async close() {
    console.log('Closing Redis Queue connections...');
    
    // 关闭所有队列
    for (const [topic, queue] of this.queues.entries()) {
      try {
        await queue.close();
        console.log(`Closed queue: ${topic}`);
      } catch (error) {
        console.error(`Error closing queue ${topic}:`, error);
      }
    }
    
    // 关闭Redis连接
    if (this.redis) {
      try {
        await this.redis.quit();
        this.redis = null;
      } catch (error) {
        console.error('Error closing Redis connection:', error);
      }
    }
    
    // 清理资源
    this.queues.clear();
    this.processors.clear();
    this.initialized = false;
    
    console.log('Redis Queue connections closed');
    this.emit('closed');
  }
}

module.exports = RedisQueue;