# PostgreSQL 队列系统 - 使用指南

## 概述

本系统使用 PostgreSQL 作为消息队列，替代 Google Pub/Sub，解决在中国网络环境下的访问问题。

## 功能特性

### ✅ 已实现功能
- **PostgreSQL 队列**：使用 PostgreSQL 作为消息队列后端
- **优先级队列**：支持消息优先级排序
- **延迟消息**：支持延迟发送功能
- **自动重试**：失败消息自动重试，支持指数退避
- **死信队列**：超过最大重试次数的消息进入死信队列
- **统计监控**：队列状态统计和监控
- **多类型任务**：支持文档翻译、文本翻译、翻译改进任务
- **内存队列**：开发和测试环境的备用队列实现

## 文件结构

```
backend/src/core/
├── postgres_queue.py       # Python 实现
├── postgresQueue.js       # JavaScript 实现  
├── queueManager.js        # 统一队列管理器
└── localFileStorage.js    # 本地文件存储

backend/src/workers/
└── translationWorker.js   # 翻译任务工作器

backend/
├── test-postgres-queue.js # 队列系统测试
└── README-Queue.md        # 本文档
```

## 快速开始

### 1. 环境配置

在 `.env` 文件中配置数据库连接：

```bash
# PostgreSQL 配置
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=seekhub_database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password

# 队列配置
QUEUE_TYPE=postgresql  # 或 'memory' 用于测试
USE_QUEUE_FOR_TEXT_TRANSLATION=false
USE_QUEUE_FOR_IMPROVEMENT=false
```

### 2. 启动系统

```bash
# 启动主 API 服务器
npm start

# 启动翻译工作器（另一个终端）
npm run worker:translation

# 开发模式
npm run worker:dev
```

### 3. 运行测试

```bash
# 测试队列系统
npm run test:queue

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

## 故障排查

### 常见问题

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

### 日志监控

系统会输出详细的日志信息：

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

## 性能优化

### 数据库优化

1. **索引优化**：系统自动创建必要索引
2. **连接池**：使用连接池减少连接开销
3. **批量操作**：支持批量发布和处理

### 应用优化

1. **并发控制**：调整最大连接数和工作器数量
2. **内存管理**：定期清理旧消息
3. **监控告警**：设置队列长度和处理时间告警

## 与 Google Pub/Sub 的对比

| 特性 | PostgreSQL 队列 | Google Pub/Sub |
|------|-----------------|----------------|
| 网络访问 | ✅ 国内直接访问 | ❌ 需要VPN |
| 成本 | ✅ 无额外费用 | ❌ 按使用量付费 |
| 部署复杂度 | ✅ 简单 | ❌ 需要GCP配置 |
| 性能 | ⚡ 中等 | ⚡ 高 |
| 可靠性 | ✅ 高 | ✅ 非常高 |
| 功能丰富度 | ✅ 满足需求 | ✅ 功能全面 |

## 总结

PostgreSQL 队列系统成功实现了：

1. ✅ **替代 Google Pub/Sub**：解决中国网络访问问题
2. ✅ **完整功能支持**：优先级、延迟、重试、死信队列
3. ✅ **易于部署维护**：基于现有 PostgreSQL 数据库
4. ✅ **高性能处理**：支持并发处理和批量操作
5. ✅ **监控和统计**：完整的队列状态监控

系统现在可以在中国网络环境下稳定运行，无需依赖任何外部云服务。