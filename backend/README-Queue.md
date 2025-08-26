# 本地队列系统 - 使用指南

## 概述

本系统提供两种本地队列解决方案，替代 Google Pub/Sub，解决在中国网络环境下的访问问题：

1. **PostgreSQL 队列**：基于现有数据库的可靠队列系统
2. **Redis 队列**：高性能队列系统，支持更高并发处理

## 功能特性

### ✅ 已实现功能

#### PostgreSQL 队列
- **数据库队列**：使用 PostgreSQL 作为消息队列后端
- **优先级队列**：支持消息优先级排序
- **延迟消息**：支持延迟发送功能
- **自动重试**：失败消息自动重试，支持指数退避
- **死信队列**：超过最大重试次数的消息进入死信队列
- **统计监控**：队列状态统计和监控

#### Redis 队列
- **高性能处理**：基于 Redis + Bull 的高性能队列系统
- **并发处理**：支持更高级别的并发任务处理
- **实时监控**：Bull Dashboard 支持的实时任务监控
- **任务调度**：更精确的任务调度和管理
- **进度跟踪**：实时任务进度更新和状态跟踪

#### 通用功能
- **多类型任务**：支持文档翻译、文本翻译、翻译改进任务
- **统一接口**：通过 QueueManager 提供统一的队列操作接口
- **内存队列**：开发和测试环境的备用队列实现
- **自动降级**：队列初始化失败时自动降级到内存队列

## 文件结构

```
backend/src/core/
├── postgres_queue.py       # PostgreSQL 队列 Python 实现
├── postgresQueue.js        # PostgreSQL 队列 JavaScript 实现
├── redis_queue.py          # Redis 队列 Python 实现
├── redisQueue.js           # Redis 队列 JavaScript 实现
├── queueManager.js         # 统一队列管理器
└── localFileStorage.js     # 本地文件存储

backend/src/workers/
├── translationWorker.js    # PostgreSQL 翻译工作器
└── redisTranslationWorker.js # Redis 翻译工作器

backend/
├── test-postgres-queue.js  # PostgreSQL 队列系统测试
├── test-redis-queue.js     # Redis 队列系统测试
└── README-Queue.md         # 本文档
```

## 快速开始

### 1. 环境配置

在 `.env` 文件中配置队列系统：

```bash
# 队列类型配置
QUEUE_TYPE=postgresql   # 可选: 'postgresql', 'redis', 'memory'

# PostgreSQL 配置 (当 QUEUE_TYPE=postgresql)
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=seekhub_database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password

# Redis 配置 (当 QUEUE_TYPE=redis)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=          # 可选
REDIS_DB=0

# 队列功能配置
USE_QUEUE_FOR_TEXT_TRANSLATION=false
USE_QUEUE_FOR_IMPROVEMENT=false
```

### 2. 启动系统

#### PostgreSQL 队列模式
```bash
# 启动主 API 服务器
npm start

# 启动 PostgreSQL 翻译工作器（另一个终端）
npm run worker:translation

# 开发模式
npm run worker:dev
```

#### Redis 队列模式
```bash
# 确保 Redis 服务器运行
redis-server

# 启动主 API 服务器
npm start

# 启动 Redis 翻译工作器（另一个终端）
npm run worker:redis

# 开发模式
npm run worker:redis-dev
```

### 3. 运行测试

```bash
# 测试 PostgreSQL 队列系统
npm run test:queue

# 测试 Redis 队列系统
npm run test:redis

# 测试翻译 API
npm run test:translation
```

## API 使用

### 发布任务

```javascript
const { queueManager } = require('./src/core/queueManager');

// 初始化
await queueManager.initialize();

// 发布文档翻译任务
const messageId = await queueManager.publishDocumentTranslation(
  'doc_123',      // 文档ID
  'en',           // 源语言
  'zh',           // 目标语言
  'academic',     // 翻译风格
  'user_456'      // 用户ID
);

// 发布文本翻译任务
const textMessageId = await queueManager.publishTextTranslation(
  'Hello world',  // 待翻译文本
  'en',           // 源语言
  'zh',           // 目标语言  
  'general',      // 翻译风格
  'user_456'      // 用户ID
);
```

### 订阅任务

```javascript
// 订阅文档翻译任务
await queueManager.subscribeDocumentTranslation(async (payload, metadata) => {
  console.log('Processing document:', payload.documentId);
  
  // 执行翻译逻辑
  // ... 翻译处理代码 ...
  
  return true; // 返回 true 表示成功，false 表示失败
});

// 订阅文本翻译任务
await queueManager.subscribeTextTranslation(async (payload, metadata) => {
  console.log('Processing text:', payload.text);
  
  // 执行翻译逻辑
  // ... 翻译处理代码 ...
  
  return true;
});
```

### 获取统计信息

```javascript
// 获取所有队列统计
const allStats = await queueManager.getStats();
console.log(allStats);

// 获取特定主题统计
const docStats = await queueManager.getTopicStats('translation-document');
console.log(docStats);
```

## 数据库表结构

系统会自动创建以下表：

### message_queue - 主队列表
- `id` - 消息唯一标识
- `topic` - 消息主题
- `message_id` - 消息ID
- `payload` - 消息内容 (JSONB)
- `priority` - 优先级
- `status` - 状态 (pending/processing/completed/failed)
- `retry_count` - 重试次数
- `max_retries` - 最大重试次数
- `visibility_timeout` - 可见性超时
- `scheduled_at` - 调度时间
- `created_at` - 创建时间
- `updated_at` - 更新时间
- `processed_at` - 处理完成时间

### queue_subscriptions - 订阅者表
- `topic` - 主题
- `subscriber_id` - 订阅者ID
- `last_poll_at` - 最后轮询时间
- `is_active` - 是否活跃

### dead_letter_queue - 死信队列表
- `original_message_id` - 原消息ID
- `topic` - 主题
- `payload` - 消息内容
- `failure_reason` - 失败原因
- `retry_count` - 重试次数

## 工作流程

### 1. 翻译任务流程

```
用户请求翻译
    ↓
GraphQL API 接收请求
    ↓
发布任务到队列
    ↓
翻译工作器处理任务
    ↓
四步翻译流程:
  1. 文档分割中
  2. 提交给AI翻译  
  3. 文档整合中
  4. 自动排版与优化
    ↓
返回翻译结果
```

### 2. 队列处理机制

```
消息发布 → 入队 (pending)
    ↓
工作器轮询 → 状态更改为 processing
    ↓
处理成功 → 状态更改为 completed
    ↓
处理失败 → 重试或进入死信队列
```

## 监控和维护

### 查看队列状态

```javascript
// 获取队列统计
const stats = await queueManager.getStats();

// 示例输出
{
  'translation-document': {
    total_messages: 100,
    pending_messages: 5,
    processing_messages: 2,
    completed_messages: 90,
    failed_messages: 3,
    avg_processing_time_seconds: 25.5
  }
}
```

### 清理旧消息

```javascript
// 清理7天前的已完成消息
const cleanedCount = await queueManager.cleanup(7);
console.log(`Cleaned ${cleanedCount} old messages`);
```

### 数据库维护

定期运行以下SQL进行维护：

```sql
-- 清理旧的已完成消息
DELETE FROM message_queue 
WHERE status IN ('completed', 'failed') 
AND updated_at < NOW() - INTERVAL '7 days';

-- 重建索引
REINDEX TABLE message_queue;

-- 查看队列统计
SELECT 
  topic,
  status,
  COUNT(*) as count
FROM message_queue 
GROUP BY topic, status
ORDER BY topic, status;
```

## Redis 队列特性

### Redis 队列优势

1. **高性能处理**：基于内存的快速队列操作
2. **高并发支持**：支持更多并发工作器
3. **实时监控**：Bull Dashboard 提供实时队列监控界面
4. **任务管理**：更精确的任务暂停、恢复、重试功能
5. **分布式支持**：支持多个工作器实例分布式处理

### Redis 队列配置

```javascript
// 高并发配置示例
await redisQueue.subscribe('translation-document', handler, {
  concurrency: 3  // 同时处理3个文档翻译任务
});

await redisQueue.subscribe('translation-text', handler, {
  concurrency: 5  // 同时处理5个文本翻译任务
});
```

### Redis 队列监控

```bash
# 启动 Bull Dashboard (可选)
npx bull-board

# 查看队列统计
const stats = await redisQueue.getQueueStats();
console.log(stats);

# 管理任务
await redisQueue.pauseQueue('translation-document');
await redisQueue.resumeQueue('translation-document');
await redisQueue.retryFailedJobs('translation-text');
```

## 故障排查

### 常见问题

#### PostgreSQL 队列
1. **队列初始化失败**
   - 检查 PostgreSQL 连接配置
   - 确认数据库权限
   - 查看错误日志

2. **消息处理缓慢**
   - 调整工作器数量
   - 优化数据库查询
   - 检查网络延迟

3. **消息重复处理**
   - 确认 `visibility_timeout` 设置合理
   - 检查工作器是否正确确认消息

#### Redis 队列
1. **Redis 连接失败**
   - 确认 Redis 服务器正在运行
   - 检查 Redis 配置（host, port, password）
   - 验证网络连接

2. **任务丢失**
   - 检查 Redis 持久化配置 (AOF/RDB)
   - 确认 Redis 内存没有超限
   - 查看 Redis 日志

3. **高内存使用**
   - 定期清理完成的任务
   - 调整任务保留策略
   - 监控 Redis 内存使用情况

### 日志监控

#### PostgreSQL 队列日志
```
PostgreSQL Queue initialized successfully
Published message translation-document_1703123456789_abc123 to topic translation-document
Processing document translation: doc_123
Document doc_123: 文档分割中
Document doc_123: 提交给AI翻译
Document doc_123: 文档整合中  
Document doc_123: 自动排版与优化
Document translation completed: doc_123
```

#### Redis 队列日志
```
Redis Queue initialized successfully
✅ Job completed: 123 in translation-document
📄 Processing document translation: doc_456 (Job: 123)
   Languages: en → zh, Style: academic
   文档分割中 (25%)
   提交给AI翻译 (60%)
   文档整合中 (85%)
   自动排版与优化 (100%)
✅ Document translation completed: doc_456
```

## 性能优化

### PostgreSQL 队列优化

1. **索引优化**：系统自动创建必要索引
2. **连接池**：使用连接池减少连接开销
3. **批量操作**：支持批量发布和处理
4. **定期维护**：清理旧消息，重建索引

### Redis 队列优化

1. **内存配置**：调整 Redis `maxmemory` 配置
2. **持久化策略**：配置 AOF 或 RDB 持久化
3. **连接池**：使用 ioredis 连接池
4. **任务清理**：定期清理已完成的任务数据

### 应用优化

1. **并发控制**：调整工作器并发数量
   - PostgreSQL: 适中并发 (1-3 workers)
   - Redis: 高并发 (3-10 workers)
2. **资源监控**：监控 CPU、内存、网络使用
3. **告警设置**：设置队列长度和处理时间告警

## 与 Google Pub/Sub 的对比

| 特性 | PostgreSQL 队列 | Redis 队列 | Google Pub/Sub |
|------|-----------------|------------|----------------|
| 网络访问 | ✅ 国内直接访问 | ✅ 国内直接访问 | ❌ 需要VPN |
| 成本 | ✅ 无额外费用 | ✅ 无额外费用 | ❌ 按使用量付费 |
| 部署复杂度 | ✅ 简单 | ✅ 简单 | ❌ 需要GCP配置 |
| 性能 | ⚡ 中等 | ⚡ 高 | ⚡ 非常高 |
| 可靠性 | ✅ 高 | ✅ 高 | ✅ 非常高 |
| 功能丰富度 | ✅ 满足需求 | ✅ 功能丰富 | ✅ 功能全面 |
| 并发处理 | ⚡ 中等 | ⚡ 高 | ⚡ 非常高 |
| 实时监控 | ⚡ 基础 | ✅ 丰富 | ✅ 全面 |

## 总结

本地队列系统成功实现了：

### PostgreSQL 队列
1. ✅ **替代 Google Pub/Sub**：解决中国网络访问问题
2. ✅ **数据持久化**：基于现有 PostgreSQL 数据库的可靠存储
3. ✅ **完整功能支持**：优先级、延迟、重试、死信队列
4. ✅ **易于部署维护**：无需额外服务，集成现有数据库
5. ✅ **事务支持**：数据库级别的事务保证

### Redis 队列
1. ✅ **高性能处理**：基于内存的快速队列操作
2. ✅ **高并发支持**：支持更高级别的并发处理
3. ✅ **实时监控**：丰富的任务状态监控和管理功能
4. ✅ **分布式支持**：支持多实例分布式处理
5. ✅ **灵活配置**：精确的任务调度和管理控制

### 统一优势
1. ✅ **中国网络友好**：无需VPN即可在中国稳定运行
2. ✅ **零额外成本**：基于现有基础设施，无云服务费用
3. ✅ **简化部署**：无需复杂的云平台配置和管理
4. ✅ **统一接口**：通过 QueueManager 提供一致的操作体验
5. ✅ **灵活切换**：可根据需求在不同队列后端间切换

系统现在提供两种队列选择，可根据具体需求选择合适的方案，完全无需依赖任何外部云服务。