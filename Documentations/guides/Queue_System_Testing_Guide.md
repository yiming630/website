# Queue System Testing Guide
# 队列系统测试指南

## 🎯 概述

本指南提供了完整的Redis和PostgreSQL队列系统测试方法。队列系统是SeekHub翻译平台的核心组件，负责处理文档翻译、文本翻译和翻译改进任务的异步处理。

## 📋 测试前准备

### 系统要求

- **Node.js**: 18.0.0 或更高版本
- **PostgreSQL**: 12+ (用于PostgreSQL队列)
- **Redis**: 6+ (可选，用于Redis队列)
- **操作系统**: Windows/Mac/Linux

### 依赖检查

确保以下依赖已安装：
```json
{
  "pg": "^8.16.3",           // PostgreSQL客户端
  "ioredis": "^5.7.0",       // Redis客户端
  "bull": "^4.16.5",         // Redis队列处理
  "uuid": "^11.1.0"          // 消息ID生成
}
```

## 🚀 快速开始测试

### 步骤 1: 环境配置

```bash
# 进入后端目录
cd backend

# 运行交互式环境配置
npm run setup
```

**配置选项说明：**

1. **队列类型选择**：
   - `1. PostgreSQL` - 推荐用于开发环境，基于现有数据库
   - `2. Redis` - 推荐用于生产环境，高性能处理
   - `3. Memory` - 仅用于测试，无持久化

2. **数据库配置**：
   - PostgreSQL Host: 通常为 `localhost`
   - PostgreSQL Port: 默认 `5432`
   - 数据库名称: 建议 `seekhub_database`
   - 用户名: 通常为 `postgres`
   - 密码: 您设置的PostgreSQL密码

3. **API配置**：
   - OpenRouter API Key: 用于AI翻译服务
   - 端口配置: API网关端口 (默认4000)

**示例配置过程：**
```
🔧 Queue System Environment Setup
==================================

Select Queue Type:
1. PostgreSQL (Recommended for development)
2. Redis (High performance, requires Redis server)
3. Memory (Testing only, no persistence)

Enter your choice (1-3) [default: 1]: 1

PostgreSQL Configuration:
PostgreSQL Host [localhost]: 
PostgreSQL Port [5432]: 
PostgreSQL Database [seekhub_database]: 
PostgreSQL User [postgres]: 
PostgreSQL Password: ********

Queue Features:
Enable queue for text translation? (y/n) [y]: y
Enable queue for translation improvement? (y/n) [y]: y

API Configuration:
API Gateway Port [4000]: 
OpenRouter API Key (for translations): sk-or-****
```

### 步骤 2: 服务健康检查

```bash
# 检查服务状态
npm run check
```

**期望输出（健康状态）：**
```
🔍 Service Health Check
========================

📋 Environment Configuration
-----------------------------
Queue Type: postgresql
✅ POSTGRES_HOST: Configured
✅ POSTGRES_PORT: Configured
✅ POSTGRES_DB: Configured
✅ POSTGRES_USER: Configured
✅ POSTGRES_PASSWORD: Configured

🐘 PostgreSQL Status
--------------------
✅ PostgreSQL is running
   Server time: 2024-01-15 10:30:00
   ✅ Queue tables exist

📊 Summary
----------
✅ All required services are healthy

💡 Next Steps
-------------
1. Run comprehensive tests: node test-queue-system.js
2. Test PostgreSQL queue: npm run test:queue
3. Start worker: npm run worker:translation
4. Test translation API: npm run test:translation
```

### 步骤 3: 运行测试

#### 3.1 综合测试套件

```bash
# 运行所有队列测试
npm run test:all
```

这将执行：
- 环境检查
- PostgreSQL队列测试（如果配置）
- Redis队列测试（如果配置）
- 队列管理器统一接口测试

#### 3.2 特定队列测试

```bash
# 测试PostgreSQL队列
npm run test:queue

# 测试Redis队列
npm run test:redis

# 测试翻译API
npm run test:translation
```

## 📊 测试结果解读

### 成功的PostgreSQL测试输出

```
🚀 Starting PostgreSQL Queue Tests...
=====================================

📋 Test 1: Initialization
---------------------------
✅ Queue Manager initialized successfully
✅ Direct PostgreSQL Queue initialized successfully

📤 Test 2: Message Publishing
------------------------------
📄 Published document translation: translation-document_1703123456789_abc123
📝 Published text translation: translation-text_1703123456790_def456
🔧 Published translation improvement: translation-improvement_1703123456791_ghi789
✅ Published 30 messages successfully

📥 Test 3: Message Subscription
-------------------------------
📄 Processing document: doc_0
📝 Processing text: This is test text number 0...
🔧 Processing improvement for: Original text 0...
✅ Subscribed to all message types
⏳ Processed 30 messages

📊 Test 6: Queue Statistics
----------------------------
📈 All queue statistics:
  translation-document: {
    total_messages: 10,
    pending_messages: 0,
    processing_messages: 0,
    completed_messages: 10,
    failed_messages: 0,
    avg_processing_time_seconds: 2.5
  }

🎉 Test Summary
================
⏱️  Test Duration: 15234ms
📤 Messages Published: 30
✅ Messages Processed: 30
❌ Messages Failed: 0
📈 Success Rate: 100.00%

✅ PostgreSQL Queue tests completed successfully!
```

### 成功的Redis测试输出

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
📄 Processing document: doc_0 (Job: 1)
📝 Processing text: This is test text number 0... (Job: 2)
🔧 Processing improvement: Original text 0... (Job: 3)
✅ Subscribed to all message types

🎛️  Test 7: Job Management
---------------------------
⏸️  Paused test-management queue
▶️  Resumed test-management queue
🔄 Retried 0 failed jobs
✅ Job management features tested successfully

🎉 Redis Queue Test Summary
============================
📈 Success Rate: 100.00%

✅ Redis Queue tests completed successfully!
💡 Redis Queue provides:
   • High performance job processing
   • Built-in retry logic with exponential backoff
   • Job prioritization and scheduling
   • Real-time job monitoring
   • Automatic job cleanup
```

## 🔧 启动工作器

测试通过后，需要启动工作器来处理实际的队列任务：

### PostgreSQL工作器

```bash
# 生产模式启动
npm run worker:translation

# 开发模式（自动重启）
npm run worker:dev
```

### Redis工作器

```bash
# 生产模式启动
npm run worker:redis

# 开发模式（自动重启）
npm run worker:redis-dev
```

### 完整系统启动

```bash
# 终端1 - API服务器
npm start

# 终端2 - PostgreSQL工作器
npm run worker:translation

# 终端3 - Redis工作器（如果使用Redis）
npm run worker:redis

# 终端4 - 监控日志
tail -f logs/*.log
```

## 🛠️ 故障排除

### 常见问题和解决方案

#### 1. PostgreSQL连接问题

**错误**: `PostgreSQL connection failed`

**解决方案**:
```bash
# 检查PostgreSQL是否运行
pg_isready

# 手动测试连接
psql -h localhost -U postgres -d seekhub_database

# 常见问题：
# 1. 密码错误 - 检查.env中的POSTGRES_PASSWORD
# 2. 数据库不存在 - 创建数据库:
createdb -U postgres seekhub_database

# 3. 用户不存在 - 创建用户:
createuser -U postgres -P your_user
```

#### 2. Redis连接问题

**错误**: `Redis connection failed`

**解决方案**:
```bash
# 检查Redis是否运行
redis-cli ping

# 启动Redis服务器
redis-server

# 测试连接
redis-cli -h localhost -p 6379

# 常见问题：
# 1. Redis未启动 - 运行: redis-server
# 2. 端口错误 - 检查.env中的REDIS_PORT
# 3. 需要密码 - 在.env中添加REDIS_PASSWORD
```

#### 3. 队列表未初始化

**错误**: `Queue tables not initialized`

**解决方案**:
```bash
# 运行PostgreSQL队列测试会自动创建表
npm run test:queue

# 或者手动初始化
node -e "
const { PostgreSQLQueue } = require('./src/core/postgresQueue');
(async () => {
  const queue = new PostgreSQLQueue();
  await queue.initialize();
  console.log('Tables initialized');
  process.exit(0);
})();
"
```

#### 4. 消息未被处理

**错误**: `No messages processed`

**解决方案**:
```bash
# 1. 启动相应的工作器
npm run worker:translation  # PostgreSQL
npm run worker:redis        # Redis

# 2. 检查队列类型配置
echo $QUEUE_TYPE

# 3. 查看工作器日志
tail -f logs/worker.log

# 4. 检查队列统计
node -e "
const { queueManager } = require('./src/core/queueManager');
queueManager.initialize().then(() => {
  return queueManager.getStats();
}).then(stats => {
  console.log(stats);
  process.exit(0);
});
"
```

## 📈 性能测试

### 负载测试脚本

```bash
# 创建负载测试
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

### 性能基准

| 队列类型 | 吞吐量 | 推荐并发 | 最佳用途 |
|---------|-------|---------|---------|
| PostgreSQL | 100-500 消息/秒 | 1-3 工作器 | 可靠的事务性处理 |
| Redis | 1000-5000 消息/秒 | 3-10 工作器 | 高性能实时处理 |
| Memory | 10000+ 消息/秒 | 无限制 | 测试和开发 |

## 📋 测试检查清单

### 开发环境测试

- [ ] 环境配置完成（`npm run setup`）
- [ ] 服务健康检查通过（`npm run check`）
- [ ] PostgreSQL队列测试通过（`npm run test:queue`）
- [ ] 工作器可以启动（`npm run worker:translation`）
- [ ] API服务器正常运行（`npm start`）
- [ ] 翻译API测试通过（`npm run test:translation`）

### 生产环境准备

- [ ] Redis服务器配置和启动
- [ ] Redis队列测试通过（`npm run test:redis`）
- [ ] 多个工作器可以并行运行
- [ ] 负载测试完成，性能满足要求
- [ ] 监控和日志系统配置
- [ ] 错误处理和重试机制验证

## 🎯 最佳实践

### 开发阶段
- 使用PostgreSQL队列（设置简单）
- 启用详细日志记录
- 使用小批量数据测试
- 单个工作器调试

### 生产部署
- 使用Redis队列（高性能）
- 配置适当的重试限制
- 设置监控和告警
- 实现优雅关闭
- 定期清理旧消息
- 运行多个工作器实例

## 🔗 相关资源

- [队列系统架构文档](../SeekHub_Backend_Integration_Plan.md)
- [API文档](../api/API.md)
- [队列实现详解](../../backend/README-Queue.md)
- [PostgreSQL文档](https://www.postgresql.org/docs/)
- [Redis/Bull文档](https://github.com/OptimalBits/bull)

## 📞 支持和帮助

如果在测试过程中遇到问题：

1. 查看本故障排除指南
2. 检查`logs/`目录中的错误日志
3. 查看队列统计信息是否异常
4. 验证环境配置是否正确
5. 分别测试各个组件

记住，队列系统的健康状态直接影响整个翻译平台的性能。定期运行测试套件可以确保系统稳定运行。
