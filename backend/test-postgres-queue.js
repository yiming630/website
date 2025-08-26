/**
 * PostgreSQL 队列系统测试脚本
 * 测试队列的发布、订阅、处理等功能
 */

const { queueManager, PostgreSQLQueue } = require('./src/core/queueManager');

// 测试配置
const TEST_CONFIG = {
  testDuration: 30000, // 30秒测试
  messageCount: 10,
  topics: ['test-documents', 'test-texts', 'test-improvements']
};

class PostgreSQLQueueTester {
  constructor() {
    this.testResults = {
      published: 0,
      processed: 0,
      failed: 0,
      startTime: null,
      endTime: null
    };
    this.subscribers = [];
  }

  /**
   * 运行完整测试套件
   */
  async runTests() {
    console.log('🚀 Starting PostgreSQL Queue Tests...');
    console.log('=====================================');

    this.testResults.startTime = new Date();

    try {
      // 测试1: 基本连接和初始化
      await this.testInitialization();

      // 测试2: 消息发布
      await this.testMessagePublishing();

      // 测试3: 消息订阅和处理
      await this.testMessageSubscription();

      // 测试4: 优先级和延迟消息
      await this.testPriorityAndDelayedMessages();

      // 测试5: 错误处理和重试
      await this.testErrorHandlingAndRetry();

      // 测试6: 队列统计
      await this.testQueueStatistics();

      // 测试7: 清理功能
      await this.testCleanup();

      this.testResults.endTime = new Date();
      this.printTestSummary();

    } catch (error) {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    }
  }

  /**
   * 测试初始化
   */
  async testInitialization() {
    console.log('\n📋 Test 1: Initialization');
    console.log('---------------------------');

    try {
      // 测试队列管理器初始化
      await queueManager.initialize();
      console.log('✅ Queue Manager initialized successfully');

      // 测试直接PostgreSQL队列初始化
      const directQueue = new PostgreSQLQueue();
      await directQueue.initialize();
      console.log('✅ Direct PostgreSQL Queue initialized successfully');

      await directQueue.close();

    } catch (error) {
      console.error('❌ Initialization failed:', error);
      throw error;
    }
  }

  /**
   * 测试消息发布
   */
  async testMessagePublishing() {
    console.log('\n📤 Test 2: Message Publishing');
    console.log('------------------------------');

    try {
      // 发布不同类型的消息
      for (let i = 0; i < TEST_CONFIG.messageCount; i++) {
        // 文档翻译任务
        const docMessageId = await queueManager.publishDocumentTranslation(
          `doc_${i}`,
          'en',
          'zh',
          'academic',
          `user_${i}`
        );
        console.log(`📄 Published document translation: ${docMessageId}`);

        // 文本翻译任务
        const textMessageId = await queueManager.publishTextTranslation(
          `This is test text number ${i}`,
          'en',
          'zh',
          'general',
          `user_${i}`
        );
        console.log(`📝 Published text translation: ${textMessageId}`);

        // 翻译改进任务
        const improvementMessageId = await queueManager.publishTranslationImprovement(
          `Original text ${i}`,
          `Current translation ${i}`,
          'en',
          'zh',
          `Improve this translation ${i}`,
          `user_${i}`
        );
        console.log(`🔧 Published translation improvement: ${improvementMessageId}`);

        this.testResults.published += 3;
      }

      console.log(`✅ Published ${this.testResults.published} messages successfully`);

    } catch (error) {
      console.error('❌ Message publishing failed:', error);
      throw error;
    }
  }

  /**
   * 测试消息订阅
   */
  async testMessageSubscription() {
    console.log('\n📥 Test 3: Message Subscription');
    console.log('-------------------------------');

    try {
      // 订阅文档翻译任务
      const docSubscriber = await queueManager.subscribeDocumentTranslation(
        async (payload, metadata) => {
          console.log(`📄 Processing document: ${payload.documentId}`);
          await this.simulateWork(1000, 2000);
          this.testResults.processed++;
          return true;
        }
      );

      // 订阅文本翻译任务
      const textSubscriber = await queueManager.subscribeTextTranslation(
        async (payload, metadata) => {
          console.log(`📝 Processing text: ${payload.text.substring(0, 30)}...`);
          await this.simulateWork(500, 1500);
          this.testResults.processed++;
          return true;
        }
      );

      // 订阅翻译改进任务
      const improvementSubscriber = await queueManager.subscribeTranslationImprovement(
        async (payload, metadata) => {
          console.log(`🔧 Processing improvement for: ${payload.originalText.substring(0, 30)}...`);
          await this.simulateWork(800, 1800);
          this.testResults.processed++;
          return true;
        }
      );

      this.subscribers.push(docSubscriber, textSubscriber, improvementSubscriber);
      console.log('✅ Subscribed to all message types');

      // 等待消息处理
      console.log('⏳ Waiting for message processing...');
      await this.waitForProcessing(15000);

    } catch (error) {
      console.error('❌ Message subscription failed:', error);
      throw error;
    }
  }

  /**
   * 测试优先级和延迟消息
   */
  async testPriorityAndDelayedMessages() {
    console.log('\n⚡ Test 4: Priority and Delayed Messages');
    console.log('------------------------------------------');

    try {
      const directQueue = new PostgreSQLQueue();
      await directQueue.initialize();

      // 发布不同优先级的消息
      await directQueue.publish('test-priority', 
        { text: 'Low priority message' }, 
        { priority: 1 }
      );

      await directQueue.publish('test-priority', 
        { text: 'High priority message' }, 
        { priority: 10 }
      );

      await directQueue.publish('test-priority', 
        { text: 'Medium priority message' }, 
        { priority: 5 }
      );

      // 发布延迟消息
      await directQueue.publish('test-delayed', 
        { text: 'Delayed message' }, 
        { delaySeconds: 5 }
      );

      console.log('✅ Published priority and delayed messages');

      // 简单验证（实际项目中应该有更详细的验证）
      const stats = await directQueue.getQueueStats('test-priority');
      console.log(`📊 Priority queue stats:`, stats);

      await directQueue.close();

    } catch (error) {
      console.error('❌ Priority and delayed message test failed:', error);
      throw error;
    }
  }

  /**
   * 测试错误处理和重试
   */
  async testErrorHandlingAndRetry() {
    console.log('\n🔄 Test 5: Error Handling and Retry');
    console.log('------------------------------------');

    try {
      const directQueue = new PostgreSQLQueue();
      await directQueue.initialize();

      // 发布会失败的消息
      await directQueue.publish('test-errors', 
        { text: 'This message will fail', shouldFail: true }
      );

      // 订阅并模拟失败
      let attemptCount = 0;
      await directQueue.subscribe('test-errors', async (payload, metadata) => {
        attemptCount++;
        console.log(`🔄 Attempt ${attemptCount} for message: ${metadata.messageId}`);
        
        if (payload.shouldFail && attemptCount < 3) {
          this.testResults.failed++;
          return false; // 模拟失败
        }
        
        console.log('✅ Message finally succeeded');
        this.testResults.processed++;
        return true;
      }, {
        subscriberId: 'error-test-subscriber',
        pollInterval: 2000
      });

      // 等待重试处理
      console.log('⏳ Waiting for retry processing...');
      await this.waitForProcessing(10000);

      await directQueue.close();

    } catch (error) {
      console.error('❌ Error handling test failed:', error);
      throw error;
    }
  }

  /**
   * 测试队列统计
   */
  async testQueueStatistics() {
    console.log('\n📊 Test 6: Queue Statistics');
    console.log('----------------------------');

    try {
      // 获取所有队列统计
      const allStats = await queueManager.getStats();
      console.log('📈 All queue statistics:');
      Object.entries(allStats).forEach(([topic, stats]) => {
        console.log(`  ${topic}:`, stats);
      });

      // 获取特定主题统计
      const docStats = await queueManager.getTopicStats('translation-document');
      console.log('📄 Document translation stats:', docStats);

      console.log('✅ Queue statistics retrieved successfully');

    } catch (error) {
      console.error('❌ Queue statistics test failed:', error);
      throw error;
    }
  }

  /**
   * 测试清理功能
   */
  async testCleanup() {
    console.log('\n🧹 Test 7: Cleanup');
    console.log('-------------------');

    try {
      // 清理旧消息
      const cleanedCount = await queueManager.cleanup(0); // 清理所有消息
      console.log(`🗑️  Cleaned up ${cleanedCount} old messages`);

      console.log('✅ Cleanup completed successfully');

    } catch (error) {
      console.error('❌ Cleanup test failed:', error);
      throw error;
    }
  }

  /**
   * 等待消息处理
   */
  async waitForProcessing(timeout) {
    const startTime = Date.now();
    const initialProcessed = this.testResults.processed;
    
    while (Date.now() - startTime < timeout) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const processed = this.testResults.processed - initialProcessed;
      if (processed > 0) {
        console.log(`⏳ Processed ${processed} messages so far...`);
      }
    }
  }

  /**
   * 模拟工作负载
   */
  async simulateWork(minMs, maxMs) {
    const duration = Math.floor(Math.random() * (maxMs - minMs)) + minMs;
    await new Promise(resolve => setTimeout(resolve, duration));
  }

  /**
   * 打印测试总结
   */
  printTestSummary() {
    console.log('\n🎉 Test Summary');
    console.log('================');
    
    const duration = this.testResults.endTime - this.testResults.startTime;
    
    console.log(`⏱️  Test Duration: ${duration}ms`);
    console.log(`📤 Messages Published: ${this.testResults.published}`);
    console.log(`✅ Messages Processed: ${this.testResults.processed}`);
    console.log(`❌ Messages Failed: ${this.testResults.failed}`);
    
    const successRate = this.testResults.published > 0 
      ? ((this.testResults.processed / this.testResults.published) * 100).toFixed(2)
      : 0;
    
    console.log(`📈 Success Rate: ${successRate}%`);
    
    if (this.testResults.processed > 0) {
      console.log('\n✅ PostgreSQL Queue tests completed successfully!');
    } else {
      console.log('\n⚠️  No messages were processed. Check your configuration.');
    }
  }

  /**
   * 清理资源
   */
  async cleanup() {
    try {
      await queueManager.close();
      console.log('🧹 Test resources cleaned up');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

// 运行测试
async function runPostgreSQLQueueTests() {
  const tester = new PostgreSQLQueueTester();
  
  try {
    await tester.runTests();
  } catch (error) {
    console.error('Test execution failed:', error);
  } finally {
    await tester.cleanup();
    process.exit(0);
  }
}

// 处理进程信号
process.on('SIGTERM', async () => {
  console.log('\nReceived SIGTERM, cleaning up...');
  await queueManager.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\nReceived SIGINT, cleaning up...');
  await queueManager.close();
  process.exit(0);
});

// 如果直接运行此文件，启动测试
if (require.main === module) {
  runPostgreSQLQueueTests().catch(console.error);
}

module.exports = PostgreSQLQueueTester;