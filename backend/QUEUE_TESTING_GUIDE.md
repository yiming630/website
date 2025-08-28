# Queue System Testing Guide

## 🚀 Quick Start

### Prerequisites

1. **PostgreSQL Setup** (for PostgreSQL Queue)
   ```bash
   # Install PostgreSQL if not already installed
   # Windows: Download from https://www.postgresql.org/download/windows/
   # Mac: brew install postgresql
   # Linux: sudo apt-get install postgresql

   # Start PostgreSQL service
   # Windows: Use pgAdmin or Services
   # Mac/Linux: pg_ctl start
   ```

2. **Redis Setup** (for Redis Queue)
   ```bash
   # Install Redis if not already installed
   # Windows: Download from https://github.com/microsoftarchive/redis/releases
   # Mac: brew install redis
   # Linux: sudo apt-get install redis-server

   # Start Redis service
   redis-server
   ```

3. **Environment Configuration**
   ```bash
   # Copy environment template
   cp .env.example .env

   # Edit .env file with your configurations
   ```

## 📝 Environment Configuration

### PostgreSQL Queue Configuration
```env
# Queue Type
QUEUE_TYPE=postgresql

# PostgreSQL Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=seekhub_database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password

# Queue Features
USE_QUEUE_FOR_TEXT_TRANSLATION=true
USE_QUEUE_FOR_IMPROVEMENT=true
```

### Redis Queue Configuration
```env
# Queue Type
QUEUE_TYPE=redis

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=       # Optional
REDIS_DB=0

# Queue Features
USE_QUEUE_FOR_TEXT_TRANSLATION=true
USE_QUEUE_FOR_IMPROVEMENT=true
```

## 🧪 Running Tests

### 1. Comprehensive Test Suite
```bash
# Run all queue system tests
node test-queue-system.js
```

### 2. PostgreSQL Queue Test
```bash
# Set queue type to PostgreSQL
export QUEUE_TYPE=postgresql

# Run PostgreSQL specific tests
npm run test:queue
```

### 3. Redis Queue Test
```bash
# Set queue type to Redis
export QUEUE_TYPE=redis

# Run Redis specific tests
npm run test:redis
```

### 4. Translation API Test
```bash
# Test the complete translation flow
npm run test:translation
```

## 🔍 Testing Scenarios

### Scenario 1: Basic Queue Operations
Tests basic publish/subscribe functionality:
- Message publishing
- Message subscription
- Message processing
- Queue statistics

### Scenario 2: Priority and Delayed Messages
Tests advanced features:
- Message priority handling
- Delayed message scheduling
- Queue ordering

### Scenario 3: Error Handling and Retry
Tests reliability features:
- Automatic retry on failure
- Exponential backoff
- Dead letter queue
- Error logging

### Scenario 4: Concurrent Processing
Tests performance features:
- Multiple worker processing
- Concurrent job handling
- Load distribution

### Scenario 5: Queue Management
Tests administrative features:
- Queue pause/resume
- Job retry management
- Old job cleanup
- Queue monitoring

## 📊 Expected Test Output

### Successful PostgreSQL Test
```
🚀 Starting PostgreSQL Queue Tests...
=====================================

📋 Test 1: Initialization
---------------------------
✅ Queue Manager initialized successfully
✅ Direct PostgreSQL Queue initialized successfully

📤 Test 2: Message Publishing
------------------------------
📄 Published document translation: translation-document_xxx
📝 Published text translation: translation-text_xxx
🔧 Published translation improvement: translation-improvement_xxx
✅ Published 30 messages successfully

📥 Test 3: Message Subscription
-------------------------------
✅ Subscribed to all message types
⏳ Processing messages...
✅ All messages processed

📊 Test 6: Queue Statistics
----------------------------
📈 All queue statistics:
  translation-document: {
    total_messages: 10,
    pending_messages: 0,
    completed_messages: 10
  }
✅ Queue statistics retrieved successfully

🎉 Test Summary
================
⏱️ Test Duration: 30000ms
📤 Messages Published: 30
✅ Messages Processed: 30
📈 Success Rate: 100.00%

✅ PostgreSQL Queue tests completed successfully!
```

### Successful Redis Test
```
🚀 Starting Redis Queue Tests...
===================================

📋 Test 1: Initialization
---------------------------
✅ Redis Queue initialized successfully

📤 Test 2: Message Publishing
------------------------------
📄 Published document translation job: 1
📝 Published text translation job: 2
🔧 Published improvement job: 3
✅ Published 15 jobs successfully

📥 Test 3: Message Subscription
-------------------------------
✅ Subscribed to all message types
⏳ Processing jobs...
✅ All jobs processed

🎛️ Test 7: Job Management
---------------------------
⏸️ Paused test-management queue
▶️ Resumed test-management queue
🔄 Retried 0 failed jobs
✅ Job management features tested successfully

🎉 Redis Queue Test Summary
============================
⏱️ Test Duration: 30000ms
📤 Jobs Published: 15
✅ Jobs Processed: 15
📈 Success Rate: 100.00%

✅ Redis Queue tests completed successfully!
💡 Redis Queue provides:
   • High performance job processing
   • Built-in retry logic with exponential backoff
   • Job prioritization and scheduling
   • Real-time job monitoring
   • Automatic job cleanup
```

## 🔧 Troubleshooting

### PostgreSQL Connection Issues
```bash
# Check PostgreSQL is running
pg_isready

# Check connection
psql -h localhost -U postgres -d seekhub_database

# Common issues:
# 1. Wrong password - check POSTGRES_PASSWORD in .env
# 2. Database doesn't exist - create it:
createdb -U postgres seekhub_database

# 3. User doesn't exist - create it:
createuser -U postgres -P your_user
```

### Redis Connection Issues
```bash
# Check Redis is running
redis-cli ping

# Test connection
redis-cli -h localhost -p 6379

# Common issues:
# 1. Redis not started - start it:
redis-server

# 2. Wrong port - check REDIS_PORT in .env
# 3. Password required - add REDIS_PASSWORD in .env
```

### Queue Not Processing
```bash
# 1. Check workers are running
npm run worker:translation  # For PostgreSQL
npm run worker:redis        # For Redis

# 2. Check queue type in .env
echo $QUEUE_TYPE

# 3. Check logs for errors
tail -f logs/queue.log
```

## 🏃 Running Workers

### PostgreSQL Queue Worker
```bash
# Production mode
npm run worker:translation

# Development mode (auto-restart on changes)
npm run worker:dev
```

### Redis Queue Worker
```bash
# Production mode
npm run worker:redis

# Development mode (auto-restart on changes)
npm run worker:redis-dev
```

### Running Multiple Workers
```bash
# Terminal 1 - API Server
npm start

# Terminal 2 - PostgreSQL Worker
npm run worker:translation

# Terminal 3 - Redis Worker (if using Redis)
npm run worker:redis

# Terminal 4 - Monitor logs
tail -f logs/*.log
```

## 📈 Performance Testing

### Load Test
```bash
# Create load test script
node -e "
const { queueManager } = require('./src/core/queueManager');

async function loadTest() {
  await queueManager.initialize();
  
  console.time('Publishing 1000 messages');
  for (let i = 0; i < 1000; i++) {
    await queueManager.publishTextTranslation(
      'Test message ' + i,
      'en', 'zh', 'general', 'user_test'
    );
  }
  console.timeEnd('Publishing 1000 messages');
  
  const stats = await queueManager.getStats();
  console.log('Queue stats:', stats);
}

loadTest().catch(console.error);
"
```

### Performance Metrics to Monitor
1. **Message throughput**: Messages/second processed
2. **Processing latency**: Time from publish to completion
3. **Queue depth**: Number of pending messages
4. **Error rate**: Failed messages percentage
5. **Resource usage**: CPU, Memory, Database connections

## 🎯 Best Practices

### 1. Development
- Use PostgreSQL queue for development (simpler setup)
- Enable verbose logging for debugging
- Use small batch sizes for testing

### 2. Production
- Use Redis queue for high-traffic production
- Configure proper retry limits
- Set up monitoring and alerting
- Implement proper error handling
- Regular cleanup of old messages

### 3. Scaling
- Run multiple workers for high load
- Use Redis for better concurrency
- Implement load balancing
- Monitor queue depths
- Scale workers based on queue size

## 📚 Additional Resources

- [PostgreSQL Queue Documentation](./README-Queue.md)
- [Redis/Bull Documentation](https://github.com/OptimalBits/bull)
- [Queue Architecture Guide](./Documentations/SeekHub_Backend_Integration_Plan.md)
- [API Documentation](./Documentations/api/API.md)

## 🆘 Support

If you encounter issues:
1. Check this troubleshooting guide
2. Review error logs in `logs/` directory
3. Check queue statistics for anomalies
4. Verify environment configuration
5. Test individual components separately
