/**
 * PostgreSQL Queue System - JavaScript Implementation
 * 使用PostgreSQL作为消息队列，替代Google Pub/Sub
 * 适用于中国网络环境，无需外部依赖
 */

const { Pool } = require('pg');
const EventEmitter = require('events');

class PostgreSQLQueue extends EventEmitter {
  constructor() {
    super();
    
    // Database configuration
    this.dbConfig = {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      database: process.env.POSTGRES_DB || 'seekhub_database',
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'password',
      max: 20, // 最大连接数
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };
    
    this.pool = null;
    this.initialized = false;
    this.subscribers = new Map();
    this.pollingIntervals = new Map();
    this.shutdown = false;
    
    console.log('PostgreSQL Queue initialized');
  }
  
  /**
   * 初始化数据库连接池和队列表
   */
  async initialize() {
    if (this.initialized) return;
    
    try {
      // Create connection pool
      this.pool = new Pool(this.dbConfig);
      
      // Test connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      
      // Create queue tables
      await this.createQueueTables();
      
      this.initialized = true;
      console.log('PostgreSQL Queue initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize PostgreSQL Queue:', error);
      throw error;
    }
  }
  
  /**
   * 创建队列相关的数据库表
   */
  async createQueueTables() {
    const createTablesSQL = `
      -- 创建队列表
      CREATE TABLE IF NOT EXISTS message_queue (
        id BIGSERIAL PRIMARY KEY,
        topic VARCHAR(255) NOT NULL,
        message_id VARCHAR(255) UNIQUE NOT NULL,
        payload JSONB NOT NULL,
        priority INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT 'pending',
        retry_count INTEGER DEFAULT 0,
        max_retries INTEGER DEFAULT 3,
        visibility_timeout TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        processed_at TIMESTAMP WITH TIME ZONE
      );
      
      -- 创建索引以优化查询性能
      CREATE INDEX IF NOT EXISTS idx_message_queue_topic_status 
      ON message_queue (topic, status);
      
      CREATE INDEX IF NOT EXISTS idx_message_queue_priority_scheduled 
      ON message_queue (priority DESC, scheduled_at ASC) 
      WHERE status = 'pending';
      
      CREATE INDEX IF NOT EXISTS idx_message_queue_visibility_timeout 
      ON message_queue (visibility_timeout) 
      WHERE status = 'processing';
      
      -- 创建订阅者表
      CREATE TABLE IF NOT EXISTS queue_subscriptions (
        id BIGSERIAL PRIMARY KEY,
        topic VARCHAR(255) NOT NULL,
        subscriber_id VARCHAR(255) NOT NULL,
        last_poll_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(topic, subscriber_id)
      );
      
      -- 创建死信队列表
      CREATE TABLE IF NOT EXISTS dead_letter_queue (
        id BIGSERIAL PRIMARY KEY,
        original_message_id VARCHAR(255) NOT NULL,
        topic VARCHAR(255) NOT NULL,
        payload JSONB NOT NULL,
        failure_reason TEXT,
        retry_count INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      -- 创建更新时间触发器函数
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
      
      -- 创建更新时间触发器
      DROP TRIGGER IF EXISTS update_message_queue_updated_at ON message_queue;
      CREATE TRIGGER update_message_queue_updated_at 
      BEFORE UPDATE ON message_queue 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `;
    
    const client = await this.pool.connect();
    try {
      await client.query(createTablesSQL);
      console.log('Queue tables created successfully');
    } finally {
      client.release();
    }
  }
  
  /**
   * 发布消息到队列
   * @param {string} topic - 消息主题
   * @param {object} message - 消息内容
   * @param {object} options - 选项
   * @returns {Promise<string>} 消息ID
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
    
    const messageId = `${topic}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const scheduledAt = new Date(Date.now() + delaySeconds * 1000);
    
    const insertSQL = `
      INSERT INTO message_queue 
      (topic, message_id, payload, priority, scheduled_at, max_retries)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `;
    
    const client = await this.pool.connect();
    try {
      await client.query(insertSQL, [
        topic,
        messageId,
        JSON.stringify(message),
        priority,
        scheduledAt,
        maxRetries
      ]);
      
      console.log(`Published message ${messageId} to topic ${topic}`);
      this.emit('messagePublished', { topic, messageId, message });
      
      return messageId;
      
    } catch (error) {
      console.error('Error publishing message:', error);
      throw error;
    } finally {
      client.release();
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
      subscriberId = `${topic}_subscriber_${Date.now()}`,
      maxMessages = 1,
      visibilityTimeout = 300, // 5 minutes
      pollInterval = 5000 // 5 seconds
    } = options;
    
    // 注册订阅者
    await this.registerSubscriber(topic, subscriberId);
    
    // 启动轮询
    const intervalId = setInterval(async () => {
      if (this.shutdown) {
        clearInterval(intervalId);
        return;
      }
      
      try {
        const messages = await this.pullMessages(topic, maxMessages, visibilityTimeout);
        
        for (const message of messages) {
          try {
            // 调用回调函数处理消息
            const success = await callback(message.payload, {
              messageId: message.message_id,
              retryCount: message.retry_count,
              createdAt: message.created_at
            });
            
            if (success) {
              await this.acknowledgeMessage(message.message_id);
              console.log(`Message ${message.message_id} processed successfully`);
            } else {
              await this.nackMessage(message.message_id);
              console.warn(`Message ${message.message_id} processing failed`);
            }
            
          } catch (error) {
            console.error(`Error processing message ${message.message_id}:`, error);
            await this.nackMessage(message.message_id);
          }
        }
        
        // 更新订阅者轮询时间
        await this.updateSubscriberPollTime(topic, subscriberId);
        
      } catch (error) {
        console.error('Error in subscription polling:', error);
      }
    }, pollInterval);
    
    // 保存订阅信息
    const subscriptionKey = `${topic}_${subscriberId}`;
    this.subscribers.set(subscriptionKey, {
      topic,
      subscriberId,
      callback,
      intervalId
    });
    
    this.pollingIntervals.set(subscriptionKey, intervalId);
    
    console.log(`Subscribed to topic ${topic} with subscriber ${subscriberId}`);
    this.emit('subscribed', { topic, subscriberId });
  }
  
  /**
   * 注册订阅者
   */
  async registerSubscriber(topic, subscriberId) {
    const insertSQL = `
      INSERT INTO queue_subscriptions (topic, subscriber_id)
      VALUES ($1, $2)
      ON CONFLICT (topic, subscriber_id) 
      DO UPDATE SET 
        last_poll_at = CURRENT_TIMESTAMP,
        is_active = TRUE
    `;
    
    const client = await this.pool.connect();
    try {
      await client.query(insertSQL, [topic, subscriberId]);
    } finally {
      client.release();
    }
  }
  
  /**
   * 拉取消息
   */
  async pullMessages(topic, maxMessages, visibilityTimeout) {
    const timeoutTime = new Date(Date.now() + visibilityTimeout * 1000);
    
    const selectSQL = `
      UPDATE message_queue 
      SET status = 'processing', 
          visibility_timeout = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id IN (
        SELECT id FROM message_queue
        WHERE topic = $2 
        AND status = 'pending'
        AND scheduled_at <= CURRENT_TIMESTAMP
        ORDER BY priority DESC, scheduled_at ASC
        LIMIT $3
        FOR UPDATE SKIP LOCKED
      )
      RETURNING id, message_id, payload, priority, retry_count, created_at
    `;
    
    const client = await this.pool.connect();
    try {
      const result = await client.query(selectSQL, [timeoutTime, topic, maxMessages]);
      
      return result.rows.map(row => ({
        id: row.id,
        message_id: row.message_id,
        payload: row.payload,
        priority: row.priority,
        retry_count: row.retry_count,
        created_at: row.created_at
      }));
      
    } catch (error) {
      console.error('Error pulling messages:', error);
      return [];
    } finally {
      client.release();
    }
  }
  
  /**
   * 确认消息处理完成
   */
  async acknowledgeMessage(messageId) {
    const updateSQL = `
      UPDATE message_queue 
      SET status = 'completed', 
          processed_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE message_id = $1
    `;
    
    const client = await this.pool.connect();
    try {
      await client.query(updateSQL, [messageId]);
      this.emit('messageAcknowledged', { messageId });
    } finally {
      client.release();
    }
  }
  
  /**
   * 消息处理失败，重新入队或移入死信队列
   */
  async nackMessage(messageId) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      // 获取消息信息
      const selectSQL = `
        SELECT id, topic, payload, retry_count, max_retries 
        FROM message_queue 
        WHERE message_id = $1
      `;
      
      const result = await client.query(selectSQL, [messageId]);
      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return;
      }
      
      const { topic, payload, retry_count, max_retries } = result.rows[0];
      
      if (retry_count >= max_retries) {
        // 移入死信队列
        const deadLetterSQL = `
          INSERT INTO dead_letter_queue 
          (original_message_id, topic, payload, failure_reason, retry_count)
          VALUES ($1, $2, $3, $4, $5)
        `;
        
        await client.query(deadLetterSQL, [
          messageId,
          topic,
          JSON.stringify(payload),
          'Max retries exceeded',
          retry_count
        ]);
        
        // 标记原消息为失败
        await client.query(
          "UPDATE message_queue SET status = 'failed' WHERE message_id = $1",
          [messageId]
        );
        
        console.warn(`Message ${messageId} moved to dead letter queue`);
        
      } else {
        // 重新入队，增加重试计数
        const retryDelay = Math.min(300, Math.pow(2, retry_count)); // 指数退避，最大5分钟
        const scheduledAt = new Date(Date.now() + retryDelay * 1000);
        
        const updateSQL = `
          UPDATE message_queue 
          SET status = 'pending', 
              retry_count = retry_count + 1,
              scheduled_at = $1,
              visibility_timeout = NULL,
              updated_at = CURRENT_TIMESTAMP
          WHERE message_id = $2
        `;
        
        await client.query(updateSQL, [scheduledAt, messageId]);
        console.log(`Message ${messageId} requeued for retry ${retry_count + 1}`);
      }
      
      await client.query('COMMIT');
      this.emit('messageNacked', { messageId, retry_count });
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`Error handling nack for message ${messageId}:`, error);
    } finally {
      client.release();
    }
  }
  
  /**
   * 更新订阅者轮询时间
   */
  async updateSubscriberPollTime(topic, subscriberId) {
    const updateSQL = `
      UPDATE queue_subscriptions 
      SET last_poll_at = CURRENT_TIMESTAMP 
      WHERE topic = $1 AND subscriber_id = $2
    `;
    
    const client = await this.pool.connect();
    try {
      await client.query(updateSQL, [topic, subscriberId]);
    } catch (error) {
      console.error('Error updating subscriber poll time:', error);
    } finally {
      client.release();
    }
  }
  
  /**
   * 获取队列统计信息
   */
  async getQueueStats(topic = null) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    const whereClause = topic ? 'WHERE topic = $1' : '';
    const params = topic ? [topic] : [];
    
    const statsSQL = `
      SELECT 
        topic,
        COUNT(*) as total_messages,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_messages,
        COUNT(*) FILTER (WHERE status = 'processing') as processing_messages,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_messages,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_messages,
        AVG(EXTRACT(EPOCH FROM (processed_at - created_at))) as avg_processing_time_seconds
      FROM message_queue 
      ${whereClause}
      GROUP BY topic
      ORDER BY topic
    `;
    
    const client = await this.pool.connect();
    try {
      const result = await client.query(statsSQL, params);
      
      if (topic) {
        // 返回单个主题的统计
        if (result.rows.length > 0) {
          const row = result.rows[0];
          return {
            topic: row.topic,
            total_messages: parseInt(row.total_messages),
            pending_messages: parseInt(row.pending_messages),
            processing_messages: parseInt(row.processing_messages),
            completed_messages: parseInt(row.completed_messages),
            failed_messages: parseInt(row.failed_messages),
            avg_processing_time_seconds: parseFloat(row.avg_processing_time_seconds) || 0
          };
        } else {
          return { topic, total_messages: 0 };
        }
      } else {
        // 返回所有主题的统计
        const stats = {};
        result.rows.forEach(row => {
          stats[row.topic] = {
            total_messages: parseInt(row.total_messages),
            pending_messages: parseInt(row.pending_messages),
            processing_messages: parseInt(row.processing_messages),
            completed_messages: parseInt(row.completed_messages),
            failed_messages: parseInt(row.failed_messages),
            avg_processing_time_seconds: parseFloat(row.avg_processing_time_seconds) || 0
          };
        });
        return stats;
      }
      
    } catch (error) {
      console.error('Error getting queue stats:', error);
      return {};
    } finally {
      client.release();
    }
  }
  
  /**
   * 清理旧消息
   */
  async cleanupOldMessages(days = 7) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    const cleanupDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const cleanupSQL = `
      DELETE FROM message_queue 
      WHERE (status = 'completed' OR status = 'failed')
      AND updated_at < $1
    `;
    
    const client = await this.pool.connect();
    try {
      const result = await client.query(cleanupSQL, [cleanupDate]);
      const deletedCount = result.rowCount;
      
      console.log(`Cleaned up ${deletedCount} old messages`);
      this.emit('messagesCleanedUp', { deletedCount, days });
      
      return deletedCount;
      
    } catch (error) {
      console.error('Error cleaning up old messages:', error);
      return 0;
    } finally {
      client.release();
    }
  }
  
  /**
   * 取消订阅
   */
  async unsubscribe(topic, subscriberId) {
    const subscriptionKey = `${topic}_${subscriberId}`;
    
    // 清除轮询间隔
    if (this.pollingIntervals.has(subscriptionKey)) {
      clearInterval(this.pollingIntervals.get(subscriptionKey));
      this.pollingIntervals.delete(subscriptionKey);
    }
    
    // 移除订阅信息
    this.subscribers.delete(subscriptionKey);
    
    // 更新数据库中的订阅状态
    const updateSQL = `
      UPDATE queue_subscriptions 
      SET is_active = FALSE 
      WHERE topic = $1 AND subscriber_id = $2
    `;
    
    if (this.pool) {
      const client = await this.pool.connect();
      try {
        await client.query(updateSQL, [topic, subscriberId]);
      } catch (error) {
        console.error('Error updating subscription status:', error);
      } finally {
        client.release();
      }
    }
    
    console.log(`Unsubscribed from topic ${topic} with subscriber ${subscriberId}`);
    this.emit('unsubscribed', { topic, subscriberId });
  }
  
  /**
   * 关闭队列连接
   */
  async close() {
    this.shutdown = true;
    
    // 清除所有轮询间隔
    for (const intervalId of this.pollingIntervals.values()) {
      clearInterval(intervalId);
    }
    
    this.pollingIntervals.clear();
    this.subscribers.clear();
    
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
    
    this.initialized = false;
    console.log('PostgreSQL Queue connections closed');
    this.emit('closed');
  }
}

module.exports = PostgreSQLQueue;