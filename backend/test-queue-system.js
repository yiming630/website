/**
 * Comprehensive Queue System Testing Script
 * Tests both PostgreSQL and Redis queue implementations
 */

const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Color codes for better terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

class QueueSystemTester {
  constructor() {
    this.testResults = {
      postgresql: { passed: 0, failed: 0, errors: [] },
      redis: { passed: 0, failed: 0, errors: [] },
      startTime: null,
      endTime: null
    };
  }

  /**
   * Main test runner
   */
  async runAllTests() {
    this.testResults.startTime = new Date();
    
    console.log(`${colors.bright}${colors.cyan}🚀 Starting Comprehensive Queue System Tests${colors.reset}`);
    console.log(`${colors.bright}================================================${colors.reset}\n`);

    // Step 1: Environment Check
    await this.checkEnvironment();

    // Step 2: Test PostgreSQL Queue
    if (process.env.QUEUE_TYPE === 'postgresql' || !process.env.QUEUE_TYPE) {
      await this.testPostgreSQLQueue();
    }

    // Step 3: Test Redis Queue
    if (process.env.QUEUE_TYPE === 'redis') {
      await this.testRedisQueue();
    }

    // Step 4: Test Queue Manager (unified interface)
    await this.testQueueManager();

    // Step 5: Print Results
    this.testResults.endTime = new Date();
    this.printFinalReport();
  }

  /**
   * Check environment configuration
   */
  async checkEnvironment() {
    console.log(`${colors.bright}📋 Environment Check${colors.reset}`);
    console.log('--------------------');

    const requiredEnvVars = {
      postgresql: [
        'POSTGRES_HOST',
        'POSTGRES_PORT',
        'POSTGRES_DB',
        'POSTGRES_USER',
        'POSTGRES_PASSWORD'
      ],
      redis: [
        'REDIS_HOST',
        'REDIS_PORT'
      ]
    };

    // Check queue type
    const queueType = process.env.QUEUE_TYPE || 'postgresql';
    console.log(`✅ Queue Type: ${colors.green}${queueType}${colors.reset}`);

    // Check required environment variables
    if (queueType === 'postgresql') {
      for (const varName of requiredEnvVars.postgresql) {
        const value = process.env[varName];
        if (value) {
          console.log(`✅ ${varName}: ${colors.green}Configured${colors.reset}`);
        } else {
          console.log(`❌ ${varName}: ${colors.red}Missing${colors.reset}`);
          this.testResults.postgresql.failed++;
          this.testResults.postgresql.errors.push(`Missing environment variable: ${varName}`);
        }
      }
    }

    if (queueType === 'redis') {
      for (const varName of requiredEnvVars.redis) {
        const value = process.env[varName];
        if (value) {
          console.log(`✅ ${varName}: ${colors.green}Configured${colors.reset}`);
        } else {
          console.log(`❌ ${varName}: ${colors.red}Missing${colors.reset}`);
          this.testResults.redis.failed++;
          this.testResults.redis.errors.push(`Missing environment variable: ${varName}`);
        }
      }
    }

    console.log('');
  }

  /**
   * Test PostgreSQL Queue
   */
  async testPostgreSQLQueue() {
    console.log(`${colors.bright}${colors.blue}🐘 Testing PostgreSQL Queue${colors.reset}`);
    console.log('---------------------------\n');

    try {
      const { PostgreSQLQueue } = require('./src/core/postgresQueue');
      const queue = new PostgreSQLQueue();

      // Test 1: Initialize
      console.log('1️⃣  Testing Initialization...');
      await queue.initialize();
      console.log(`   ${colors.green}✅ PostgreSQL Queue initialized${colors.reset}`);
      this.testResults.postgresql.passed++;

      // Test 2: Publish Message
      console.log('2️⃣  Testing Message Publishing...');
      const messageId = await queue.publish('test-topic', {
        test: true,
        timestamp: Date.now(),
        message: 'PostgreSQL test message'
      });
      console.log(`   ${colors.green}✅ Published message: ${messageId}${colors.reset}`);
      this.testResults.postgresql.passed++;

      // Test 3: Subscribe and Process
      console.log('3️⃣  Testing Message Subscription...');
      let processed = false;
      await queue.subscribe('test-topic', async (payload, metadata) => {
        console.log(`   ${colors.green}✅ Received message:`, payload.message, `${colors.reset}`);
        processed = true;
        return true;
      });
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      if (processed) {
        this.testResults.postgresql.passed++;
      } else {
        this.testResults.postgresql.failed++;
        this.testResults.postgresql.errors.push('Message was not processed');
      }

      // Test 4: Get Stats
      console.log('4️⃣  Testing Queue Statistics...');
      const stats = await queue.getQueueStats('test-topic');
      console.log(`   ${colors.green}✅ Queue stats retrieved:`, stats, `${colors.reset}`);
      this.testResults.postgresql.passed++;

      // Test 5: Cleanup
      console.log('5️⃣  Testing Cleanup...');
      const cleaned = await queue.cleanup(0);
      console.log(`   ${colors.green}✅ Cleaned ${cleaned} messages${colors.reset}`);
      this.testResults.postgresql.passed++;

      await queue.close();

    } catch (error) {
      console.error(`   ${colors.red}❌ PostgreSQL Queue test failed:`, error.message, `${colors.reset}`);
      this.testResults.postgresql.failed++;
      this.testResults.postgresql.errors.push(error.message);
    }

    console.log('');
  }

  /**
   * Test Redis Queue
   */
  async testRedisQueue() {
    console.log(`${colors.bright}${colors.red}🔴 Testing Redis Queue${colors.reset}`);
    console.log('----------------------\n');

    try {
      const { RedisQueue } = require('./src/core/redisQueue');
      const queue = new RedisQueue();

      // Test 1: Initialize
      console.log('1️⃣  Testing Initialization...');
      await queue.initialize();
      console.log(`   ${colors.green}✅ Redis Queue initialized${colors.reset}`);
      this.testResults.redis.passed++;

      // Test 2: Publish Job
      console.log('2️⃣  Testing Job Publishing...');
      const jobId = await queue.publish('test-topic', {
        test: true,
        timestamp: Date.now(),
        message: 'Redis test message'
      });
      console.log(`   ${colors.green}✅ Published job: ${jobId}${colors.reset}`);
      this.testResults.redis.passed++;

      // Test 3: Subscribe and Process
      console.log('3️⃣  Testing Job Processing...');
      let processed = false;
      await queue.subscribe('test-topic', async (payload, metadata) => {
        console.log(`   ${colors.green}✅ Processing job:`, payload.message, `${colors.reset}`);
        processed = true;
        return true;
      });

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      if (processed) {
        this.testResults.redis.passed++;
      } else {
        this.testResults.redis.failed++;
        this.testResults.redis.errors.push('Job was not processed');
      }

      // Test 4: Get Stats
      console.log('4️⃣  Testing Queue Statistics...');
      const stats = await queue.getQueueStats('test-topic');
      console.log(`   ${colors.green}✅ Queue stats:`, stats, `${colors.reset}`);
      this.testResults.redis.passed++;

      // Test 5: Job Management
      console.log('5️⃣  Testing Job Management...');
      await queue.pauseQueue('test-topic');
      console.log(`   ${colors.green}✅ Queue paused${colors.reset}`);
      await queue.resumeQueue('test-topic');
      console.log(`   ${colors.green}✅ Queue resumed${colors.reset}`);
      this.testResults.redis.passed++;

      await queue.close();

    } catch (error) {
      console.error(`   ${colors.red}❌ Redis Queue test failed:`, error.message, `${colors.reset}`);
      this.testResults.redis.failed++;
      this.testResults.redis.errors.push(error.message);
    }

    console.log('');
  }

  /**
   * Test Queue Manager (unified interface)
   */
  async testQueueManager() {
    console.log(`${colors.bright}${colors.yellow}🔧 Testing Queue Manager${colors.reset}`);
    console.log('------------------------\n');

    try {
      const { queueManager } = require('./src/core/queueManager');

      // Test 1: Initialize
      console.log('1️⃣  Testing Manager Initialization...');
      await queueManager.initialize();
      const queueType = process.env.QUEUE_TYPE || 'postgresql';
      console.log(`   ${colors.green}✅ Queue Manager initialized with ${queueType}${colors.reset}`);

      // Test 2: Document Translation
      console.log('2️⃣  Testing Document Translation...');
      const docMessageId = await queueManager.publishDocumentTranslation(
        'test_doc_001',
        'en',
        'zh',
        'academic',
        'test_user'
      );
      console.log(`   ${colors.green}✅ Published document translation: ${docMessageId}${colors.reset}`);

      // Test 3: Text Translation
      console.log('3️⃣  Testing Text Translation...');
      const textMessageId = await queueManager.publishTextTranslation(
        'Hello, World!',
        'en',
        'zh',
        'general',
        'test_user'
      );
      console.log(`   ${colors.green}✅ Published text translation: ${textMessageId}${colors.reset}`);

      // Test 4: Translation Improvement
      console.log('4️⃣  Testing Translation Improvement...');
      const improvementMessageId = await queueManager.publishTranslationImprovement(
        'Original text',
        'Current translation',
        'en',
        'zh',
        'Make it more natural',
        'test_user'
      );
      console.log(`   ${colors.green}✅ Published improvement request: ${improvementMessageId}${colors.reset}`);

      // Test 5: Get All Stats
      console.log('5️⃣  Testing Statistics...');
      const stats = await queueManager.getStats();
      console.log(`   ${colors.green}✅ Queue statistics:${colors.reset}`);
      Object.entries(stats).forEach(([topic, topicStats]) => {
        console.log(`      ${topic}:`, topicStats);
      });

      await queueManager.close();

    } catch (error) {
      console.error(`   ${colors.red}❌ Queue Manager test failed:`, error.message, `${colors.reset}`);
    }

    console.log('');
  }

  /**
   * Print final test report
   */
  printFinalReport() {
    console.log(`${colors.bright}${colors.cyan}📊 Test Results Summary${colors.reset}`);
    console.log('=======================\n');

    const duration = (this.testResults.endTime - this.testResults.startTime) / 1000;
    console.log(`⏱️  Total Duration: ${duration.toFixed(2)}s\n`);

    // PostgreSQL Results
    if (this.testResults.postgresql.passed > 0 || this.testResults.postgresql.failed > 0) {
      console.log(`${colors.blue}PostgreSQL Queue:${colors.reset}`);
      console.log(`  ✅ Passed: ${colors.green}${this.testResults.postgresql.passed}${colors.reset}`);
      console.log(`  ❌ Failed: ${colors.red}${this.testResults.postgresql.failed}${colors.reset}`);
      if (this.testResults.postgresql.errors.length > 0) {
        console.log(`  📝 Errors:`);
        this.testResults.postgresql.errors.forEach(err => {
          console.log(`     - ${err}`);
        });
      }
      console.log('');
    }

    // Redis Results
    if (this.testResults.redis.passed > 0 || this.testResults.redis.failed > 0) {
      console.log(`${colors.red}Redis Queue:${colors.reset}`);
      console.log(`  ✅ Passed: ${colors.green}${this.testResults.redis.passed}${colors.reset}`);
      console.log(`  ❌ Failed: ${colors.red}${this.testResults.redis.failed}${colors.reset}`);
      if (this.testResults.redis.errors.length > 0) {
        console.log(`  📝 Errors:`);
        this.testResults.redis.errors.forEach(err => {
          console.log(`     - ${err}`);
        });
      }
      console.log('');
    }

    // Overall Result
    const totalPassed = this.testResults.postgresql.passed + this.testResults.redis.passed;
    const totalFailed = this.testResults.postgresql.failed + this.testResults.redis.failed;
    
    if (totalFailed === 0) {
      console.log(`${colors.bright}${colors.green}✅ ALL TESTS PASSED!${colors.reset}`);
    } else {
      console.log(`${colors.bright}${colors.yellow}⚠️  SOME TESTS FAILED${colors.reset}`);
      console.log(`Total Passed: ${totalPassed}, Total Failed: ${totalFailed}`);
    }

    // Recommendations
    console.log(`\n${colors.bright}💡 Recommendations:${colors.reset}`);
    if (totalFailed > 0) {
      console.log('1. Check that PostgreSQL/Redis services are running');
      console.log('2. Verify environment variables in .env file');
      console.log('3. Check database connection credentials');
      console.log('4. Review error logs for specific issues');
    } else {
      console.log('1. Run translation worker: npm run worker:translation');
      console.log('2. Run Redis worker: npm run worker:redis');
      console.log('3. Test with real translation: npm run test:translation');
      console.log('4. Monitor queue stats in production');
    }
  }
}

// Main execution
async function main() {
  const tester = new QueueSystemTester();
  
  try {
    await tester.runAllTests();
  } catch (error) {
    console.error(`${colors.red}Fatal error:`, error.message, `${colors.reset}`);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = QueueSystemTester;
