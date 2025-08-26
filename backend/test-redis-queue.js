/**
 * Redis 队列系统测试脚本
 * 测试基于Redis和Bull的队列功能
 */

const { RedisQueue } = require('./src/core/queueManager');

// 测试配置
const TEST_CONFIG = {
  testDuration: 30000, // 30秒测试
  messageCount: 5,
  topics: ['test-documents', 'test-texts', 'test-improvements']
};

class RedisQueueTester {
  constructor() {
    this.testResults = {
      published: 0,
      processed: 0,
      failed: 0,
      startTime: null,
      endTime: null
    };
    this.redisQueue = null;
  }

  /**
   * 运行完整测试套件
   */
  async runTests() {
    console.log('🚀 Starting Redis Queue Tests...');
    console.log('===================================');

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

      // 测试7: 任务管理
      await this.testJobManagement();

      // 测试8: 清理功能
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
      // 测试Redis队列初始化
      this.redisQueue = new RedisQueue();
      await this.redisQueue.initialize();
      console.log('✅ Redis Queue initialized successfully');

    } catch (error) {
      console.error('❌ Initialization failed:', error);
      console.log('💡 Make sure Redis is running on localhost:6379');
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
        const docJobId = await this.redisQueue.publish('test-documents', {
          type: 'document',
          documentId: `doc_${i}`,
          sourceLanguage: 'en',
          targetLanguage: 'zh',
          style: 'academic'
        }, { priority: i % 3 });
        console.log(`📄 Published document translation job: ${docJobId}`);

        // 文本翻译任务
        const textJobId = await this.redisQueue.publish('test-texts', {
          type: 'text',
          text: `This is test text number ${i}`,
          sourceLanguage: 'en',
          targetLanguage: 'zh',
          style: 'general'
        }, { priority: (i + 1) % 3 });
        console.log(`📝 Published text translation job: ${textJobId}`);

        // 翻译改进任务
        const improvementJobId = await this.redisQueue.publish('test-improvements', {
          type: 'improvement',
          originalText: `Original text ${i}`,
          currentTranslation: `Current translation ${i}`,
          sourceLanguage: 'en',
          targetLanguage: 'zh',
          feedback: `Improve this translation ${i}`
        }, { priority: (i + 2) % 3 });
        console.log(`🔧 Published improvement job: ${improvementJobId}`);

        this.testResults.published += 3;
      }

      console.log(`✅ Published ${this.testResults.published} jobs successfully`);

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
      await this.redisQueue.subscribe('test-documents', async (payload, metadata) => {
        console.log(`📄 Processing document: ${payload.documentId} (Job: ${metadata.jobId})`);
        await this.simulateWork(1000, 2000);
        this.testResults.processed++;
        return true;
      }, { concurrency: 2 });

      // 订阅文本翻译任务
      await this.redisQueue.subscribe('test-texts', async (payload, metadata) => {
        console.log(`📝 Processing text: ${payload.text.substring(0, 30)}... (Job: ${metadata.jobId})`);
        await this.simulateWork(500, 1500);
        this.testResults.processed++;
        return true;
      }, { concurrency: 1 });

      // 订阅翻译改进任务
      await this.redisQueue.subscribe('test-improvements', async (payload, metadata) => {
        console.log(`🔧 Processing improvement: ${payload.originalText.substring(0, 30)}... (Job: ${metadata.jobId})`);
        await this.simulateWork(800, 1800);
        this.testResults.processed++;
        return true;
      }, { concurrency: 1 });

      console.log('✅ Subscribed to all message types');

      // 等待消息处理
      console.log('⏳ Waiting for job processing...');
      await this.waitForProcessing(10000);

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
      // 发布不同优先级的消息
      const lowPriorityJob = await this.redisQueue.publish('test-priority', 
        { text: 'Low priority message', priority: 1 }, 
        { priority: 1 }
      );

      const highPriorityJob = await this.redisQueue.publish('test-priority', 
        { text: 'High priority message', priority: 10 }, 
        { priority: 10 }
      );

      const mediumPriorityJob = await this.redisQueue.publish('test-priority', 
        { text: 'Medium priority message', priority: 5 }, 
        { priority: 5 }
      );

      // 发布延迟消息
      const delayedJob = await this.redisQueue.publish('test-delayed', 
        { text: 'Delayed message' }, 
        { delaySeconds: 3 }
      );

      console.log('✅ Published priority and delayed messages');
      console.log(`  Low Priority: ${lowPriorityJob}`);
      console.log(`  High Priority: ${highPriorityJob}`);
      console.log(`  Medium Priority: ${mediumPriorityJob}`);
      console.log(`  Delayed: ${delayedJob}`);

      // 验证任务状态
      const delayedStatus = await this.redisQueue.getJobStatus('test-delayed', delayedJob);
      console.log(`📊 Delayed job status:`, delayedStatus.status);

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
      // 发布会失败的消息
      const failingJob = await this.redisQueue.publish('test-errors', 
        { text: 'This message will fail', shouldFail: true }
      );

      // 订阅并模拟失败
      let attemptCount = 0;
      await this.redisQueue.subscribe('test-errors', async (payload, metadata) => {
        attemptCount++;
        console.log(`🔄 Attempt ${attemptCount} for job: ${metadata.jobId}`);
        
        if (payload.shouldFail && metadata.attempt < 3) {
          this.testResults.failed++;
          throw new Error('Simulated failure');
        }
        
        console.log('✅ Job finally succeeded');
        this.testResults.processed++;
        return true;
      });

      // 等待重试处理
      console.log('⏳ Waiting for retry processing...');
      await this.waitForProcessing(8000);

      // 检查任务状态
      const jobStatus = await this.redisQueue.getJobStatus('test-errors', failingJob);
      console.log(`📊 Failed job final status: ${jobStatus.status}`);

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
      const allStats = await this.redisQueue.getQueueStats();
      console.log('📈 All queue statistics:');
      Object.entries(allStats).forEach(([topic, stats]) => {
        if (!stats.error) {
          console.log(`  ${topic}: ${stats.total} total (${stats.waiting} waiting, ${stats.active} active, ${stats.completed} completed, ${stats.failed} failed)`);
        } else {
          console.log(`  ${topic}: Error - ${stats.error}`);
        }
      });

      // 获取特定主题统计
      const docStats = await this.redisQueue.getQueueStats('test-documents');
      console.log('📄 Document queue stats:', docStats);

      console.log('✅ Queue statistics retrieved successfully');

    } catch (error) {
      console.error('❌ Queue statistics test failed:', error);
      throw error;
    }
  }

  /**
   * 测试任务管理
   */
  async testJobManagement() {
    console.log('\n🎛️  Test 7: Job Management');
    console.log('---------------------------');

    try {
      // 创建一个任务用于测试管理功能
      const testJob = await this.redisQueue.publish('test-management', 
        { text: 'Job management test' }
      );

      // 获取任务状态
      const jobStatus = await this.redisQueue.getJobStatus('test-management', testJob);
      console.log(`📊 Test job status:`, jobStatus.status);

      // 暂停队列
      await this.redisQueue.pauseQueue('test-management');
      console.log('⏸️  Paused test-management queue');

      // 等待一下
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 恢复队列
      await this.redisQueue.resumeQueue('test-management');
      console.log('▶️  Resumed test-management queue');

      // 重试失败任务（如果有的话）
      const retriedCount = await this.redisQueue.retryFailedJobs('test-errors');
      console.log(`🔄 Retried ${retriedCount} failed jobs`);

      console.log('✅ Job management features tested successfully');

    } catch (error) {
      console.error('❌ Job management test failed:', error);
      throw error;
    }
  }

  /**
   * 测试清理功能
   */
  async testCleanup() {
    console.log('\n🧹 Test 8: Cleanup');
    console.log('-------------------');

    try {
      // 清理旧任务
      const cleanedCount = await this.redisQueue.cleanupOldJobs(null, 0); // 清理所有任务
      console.log(`🗑️  Cleaned up ${cleanedCount} old jobs`);

      console.log('✅ Cleanup completed successfully');

    } catch (error) {
      console.error('❌ Cleanup test failed:', error);
      throw error;
    }
  }

  /**
   * 等待处理
   */
  async waitForProcessing(timeout) {
    const startTime = Date.now();
    const initialProcessed = this.testResults.processed;
    
    while (Date.now() - startTime < timeout) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const processed = this.testResults.processed - initialProcessed;
      if (processed > 0) {
        console.log(`⏳ Processed ${processed} jobs so far...`);
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
    console.log('\n🎉 Redis Queue Test Summary');
    console.log('============================');
    
    const duration = this.testResults.endTime - this.testResults.startTime;
    
    console.log(`⏱️  Test Duration: ${duration}ms`);
    console.log(`📤 Jobs Published: ${this.testResults.published}`);
    console.log(`✅ Jobs Processed: ${this.testResults.processed}`);
    console.log(`❌ Jobs Failed: ${this.testResults.failed}`);
    
    const successRate = this.testResults.published > 0 
      ? ((this.testResults.processed / this.testResults.published) * 100).toFixed(2)
      : 0;
    
    console.log(`📈 Success Rate: ${successRate}%`);
    
    if (this.testResults.processed > 0) {
      console.log('\n✅ Redis Queue tests completed successfully!');
      console.log('💡 Redis Queue provides:');
      console.log('   • High performance job processing');
      console.log('   • Built-in retry logic with exponential backoff');
      console.log('   • Job prioritization and scheduling');
      console.log('   • Real-time job monitoring');
      console.log('   • Automatic job cleanup');
    } else {
      console.log('\n⚠️  No jobs were processed. Check your Redis configuration.');
    }
  }

  /**
   * 清理资源
   */
  async cleanup() {
    try {
      if (this.redisQueue) {
        await this.redisQueue.close();
        console.log('🧹 Test resources cleaned up');
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

// 运行测试
async function runRedisQueueTests() {
  const tester = new RedisQueueTester();
  
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
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\nReceived SIGINT, cleaning up...');
  process.exit(0);
});

// 如果直接运行此文件，启动测试
if (require.main === module) {
  runRedisQueueTests().catch(console.error);
}

module.exports = RedisQueueTester;