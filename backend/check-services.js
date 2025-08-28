/**
 * Service Health Check Script
 * Checks if PostgreSQL and Redis services are running
 */

const { Client } = require('pg');
const Redis = require('ioredis');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

class ServiceChecker {
  constructor() {
    this.results = {
      postgresql: { status: 'unknown', message: '' },
      redis: { status: 'unknown', message: '' },
      environment: { status: 'unknown', message: '' }
    };
  }

  async checkAll() {
    console.log(`${colors.bright}${colors.cyan}🔍 Service Health Check${colors.reset}`);
    console.log('========================\n');

    await this.checkEnvironment();
    await this.checkPostgreSQL();
    await this.checkRedis();
    
    this.printResults();
    this.printRecommendations();
  }

  async checkEnvironment() {
    console.log(`${colors.bright}📋 Environment Configuration${colors.reset}`);
    console.log('-----------------------------');

    const queueType = process.env.QUEUE_TYPE || 'postgresql';
    console.log(`Queue Type: ${colors.blue}${queueType}${colors.reset}`);

    if (!process.env.POSTGRES_HOST && !process.env.REDIS_HOST) {
      this.results.environment.status = 'error';
      this.results.environment.message = 'No database configuration found';
      console.log(`${colors.red}❌ No database configuration found in .env${colors.reset}`);
    } else {
      this.results.environment.status = 'ok';
      this.results.environment.message = 'Environment configured';
      console.log(`${colors.green}✅ Environment variables loaded${colors.reset}`);
    }
    console.log('');
  }

  async checkPostgreSQL() {
    console.log(`${colors.bright}🐘 PostgreSQL Status${colors.reset}`);
    console.log('--------------------');

    if (!process.env.POSTGRES_HOST) {
      console.log(`${colors.yellow}⚠️  PostgreSQL not configured${colors.reset}`);
      this.results.postgresql.status = 'not_configured';
      this.results.postgresql.message = 'PostgreSQL not configured in .env';
      console.log('');
      return;
    }

    const client = new Client({
      host: process.env.POSTGRES_HOST || 'localhost',
      port: process.env.POSTGRES_PORT || 5432,
      database: process.env.POSTGRES_DB || 'seekhub_database',
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || '',
    });

    try {
      await client.connect();
      
      // Test query
      const result = await client.query('SELECT NOW()');
      console.log(`${colors.green}✅ PostgreSQL is running${colors.reset}`);
      console.log(`   Server time: ${result.rows[0].now}`);
      
      // Check if queue tables exist
      const tableCheck = await client.query(`
        SELECT COUNT(*) FROM information_schema.tables 
        WHERE table_name IN ('message_queue', 'queue_subscriptions', 'dead_letter_queue')
      `);
      
      const tableCount = parseInt(tableCheck.rows[0].count);
      if (tableCount === 3) {
        console.log(`   ${colors.green}✅ Queue tables exist${colors.reset}`);
      } else if (tableCount > 0) {
        console.log(`   ${colors.yellow}⚠️  Some queue tables missing (${tableCount}/3)${colors.reset}`);
      } else {
        console.log(`   ${colors.yellow}⚠️  Queue tables not initialized${colors.reset}`);
        console.log(`   Run: npm run test:queue to initialize`);
      }
      
      this.results.postgresql.status = 'ok';
      this.results.postgresql.message = 'PostgreSQL is running and accessible';
      
      await client.end();
    } catch (error) {
      console.log(`${colors.red}❌ PostgreSQL connection failed${colors.reset}`);
      console.log(`   Error: ${error.message}`);
      
      this.results.postgresql.status = 'error';
      this.results.postgresql.message = error.message;
      
      // Provide specific troubleshooting
      if (error.code === 'ECONNREFUSED') {
        console.log(`   ${colors.yellow}💡 PostgreSQL service may not be running${colors.reset}`);
        console.log(`   Start with: pg_ctl start or use pgAdmin`);
      } else if (error.code === '28P01') {
        console.log(`   ${colors.yellow}💡 Authentication failed${colors.reset}`);
        console.log(`   Check POSTGRES_PASSWORD in .env`);
      } else if (error.code === '3D000') {
        console.log(`   ${colors.yellow}💡 Database does not exist${colors.reset}`);
        console.log(`   Create with: createdb ${process.env.POSTGRES_DB || 'seekhub_database'}`);
      }
    }
    console.log('');
  }

  async checkRedis() {
    console.log(`${colors.bright}🔴 Redis Status${colors.reset}`);
    console.log('---------------');

    if (!process.env.REDIS_HOST && process.env.QUEUE_TYPE !== 'redis') {
      console.log(`${colors.yellow}⚠️  Redis not configured (optional)${colors.reset}`);
      this.results.redis.status = 'not_configured';
      this.results.redis.message = 'Redis not configured (using PostgreSQL queue)';
      console.log('');
      return;
    }

    const redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      db: process.env.REDIS_DB || 0,
      retryStrategy: () => null, // Don't retry for health check
      lazyConnect: true,
    });

    try {
      await redis.connect();
      await redis.ping();
      
      console.log(`${colors.green}✅ Redis is running${colors.reset}`);
      
      // Get Redis info
      const info = await redis.info('server');
      const version = info.match(/redis_version:(.+)/)?.[1]?.trim();
      if (version) {
        console.log(`   Version: ${version}`);
      }
      
      // Check Bull queues
      const keys = await redis.keys('bull:*');
      if (keys.length > 0) {
        console.log(`   ${colors.green}✅ Bull queues found: ${keys.length} keys${colors.reset}`);
      } else {
        console.log(`   ${colors.yellow}⚠️  No Bull queues initialized yet${colors.reset}`);
      }
      
      this.results.redis.status = 'ok';
      this.results.redis.message = 'Redis is running and accessible';
      
      await redis.quit();
    } catch (error) {
      if (process.env.QUEUE_TYPE === 'redis') {
        console.log(`${colors.red}❌ Redis connection failed${colors.reset}`);
        console.log(`   Error: ${error.message}`);
        
        this.results.redis.status = 'error';
        this.results.redis.message = error.message;
        
        // Provide specific troubleshooting
        if (error.code === 'ECONNREFUSED') {
          console.log(`   ${colors.yellow}💡 Redis service may not be running${colors.reset}`);
          console.log(`   Start with: redis-server`);
        } else if (error.message.includes('AUTH')) {
          console.log(`   ${colors.yellow}💡 Authentication required${colors.reset}`);
          console.log(`   Set REDIS_PASSWORD in .env`);
        }
      } else {
        console.log(`${colors.yellow}⚠️  Redis not available (using PostgreSQL queue)${colors.reset}`);
        this.results.redis.status = 'not_required';
        this.results.redis.message = 'Redis not required for PostgreSQL queue';
      }
    }
    console.log('');
  }

  printResults() {
    console.log(`${colors.bright}📊 Summary${colors.reset}`);
    console.log('----------');

    const queueType = process.env.QUEUE_TYPE || 'postgresql';
    
    // Check overall health
    let overallStatus = 'ok';
    
    if (queueType === 'postgresql' && this.results.postgresql.status !== 'ok') {
      overallStatus = 'error';
    } else if (queueType === 'redis' && this.results.redis.status !== 'ok') {
      overallStatus = 'error';
    }
    
    if (overallStatus === 'ok') {
      console.log(`${colors.green}✅ All required services are healthy${colors.reset}`);
    } else {
      console.log(`${colors.red}❌ Some required services are not available${colors.reset}`);
    }
    console.log('');
  }

  printRecommendations() {
    console.log(`${colors.bright}💡 Next Steps${colors.reset}`);
    console.log('-------------');

    const queueType = process.env.QUEUE_TYPE || 'postgresql';
    
    if (queueType === 'postgresql') {
      if (this.results.postgresql.status === 'ok') {
        console.log('1. Run comprehensive tests: node test-queue-system.js');
        console.log('2. Test PostgreSQL queue: npm run test:queue');
        console.log('3. Start worker: npm run worker:translation');
        console.log('4. Test translation API: npm run test:translation');
      } else {
        console.log('1. Fix PostgreSQL connection issues');
        console.log('2. Ensure PostgreSQL service is running');
        console.log('3. Verify database credentials in .env');
        console.log('4. Create database if needed: createdb seekhub_database');
      }
    } else if (queueType === 'redis') {
      if (this.results.redis.status === 'ok') {
        console.log('1. Run comprehensive tests: node test-queue-system.js');
        console.log('2. Test Redis queue: npm run test:redis');
        console.log('3. Start worker: npm run worker:redis');
        console.log('4. Test translation API: npm run test:translation');
      } else {
        console.log('1. Fix Redis connection issues');
        console.log('2. Start Redis server: redis-server');
        console.log('3. Verify Redis configuration in .env');
        console.log('4. Test connection: redis-cli ping');
      }
    }
    
    console.log('\n📚 For detailed testing guide, see: QUEUE_TESTING_GUIDE.md');
  }
}

// Main execution
async function main() {
  const checker = new ServiceChecker();
  await checker.checkAll();
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = ServiceChecker;
