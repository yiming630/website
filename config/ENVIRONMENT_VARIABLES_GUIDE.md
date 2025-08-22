# 环境变量配置指南

## 概述

本文档详细说明SeekHub翻译系统使用OpenRouter后的环境变量配置。

## 快速开始

### 自动配置

**Linux/Mac:**
```bash
chmod +x scripts/setup-openrouter-env.sh
./scripts/setup-openrouter-env.sh
```

**Windows:**
```batch
scripts\setup-openrouter-env.bat
```

### 手动配置

1. 复制环境变量模板：
```bash
cp config/environments/env.openrouter .env
```

2. 编辑`.env`文件，填入您的配置值

## 环境变量详解

### 1. OpenRouter配置（必需）

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `OPENROUTER_API_KEY` | OpenRouter API密钥 | sk-or-v1-xxxxx |
| `OPENROUTER_MODEL` | 主要使用的模型 | google/gemini-pro |
| `OPENROUTER_FALLBACK_MODEL` | 备用模型 | google/gemini-flash-1.5 |
| `OPENROUTER_BASE_URL` | API基础URL | https://openrouter.ai/api/v1 |

**获取API密钥：**
1. 访问 [OpenRouter](https://openrouter.ai/)
2. 注册并登录账户
3. 在Dashboard创建API密钥
4. 充值账户（支持支付宝、微信）

### 2. 存储配置

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `USE_LOCAL_STORAGE` | 是否使用本地存储 | true |
| `LOCAL_STORAGE_ROOT` | 本地存储根目录 | /data/seekhub/storage |
| `PUBLIC_URL_BASE` | 文件访问URL前缀 | http://your-server.com/files |

### 3. 数据库配置

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `POSTGRES_USER` | 数据库用户名 | postgres |
| `POSTGRES_PASSWORD` | 数据库密码 | your_password |
| `POSTGRES_DB` | 数据库名称 | seekhub_translation |
| `POSTGRES_HOST` | 数据库主机 | localhost |
| `POSTGRES_PORT` | 数据库端口 | 5432 |

### 4. Redis配置

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `REDIS_HOST` | Redis主机 | localhost |
| `REDIS_PORT` | Redis端口 | 6379 |
| `REDIS_PASSWORD` | Redis密码（可选） | your_redis_password |

### 5. 服务端口

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `TRANSLATOR_PORT` | 翻译服务端口 | 8000 |
| `API_GATEWAY_PORT` | API网关端口 | 4000 |
| `USER_SVC_PORT` | 用户服务端口 | 4001 |
| `CLIENT_PORT` | 前端应用端口 | 3000 |

### 6. JWT认证

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `JWT_SECRET` | JWT签名密钥 | 随机生成的字符串 |
| `JWT_REFRESH_SECRET` | 刷新令牌密钥 | 随机生成的字符串 |
| `JWT_EXPIRES_IN` | 访问令牌有效期 | 1h |
| `JWT_REFRESH_EXPIRES_IN` | 刷新令牌有效期 | 7d |

### 7. 翻译服务优化

| 变量名 | 说明 | 推荐值 |
|--------|------|--------|
| `MAX_RETRIES` | 最大重试次数 | 3 |
| `RATE_LIMIT_DELAY` | 速率限制延迟(秒) | 1.0 |
| `BATCH_SIZE` | 批处理大小 | 5 |
| `MAX_CONCURRENT_REQUESTS` | 最大并发请求数 | 30 |
| `CONNECTION_POOL_SIZE` | 连接池大小 | 100 |

### 8. Worker配置

| 变量名 | 说明 | 推荐值 |
|--------|------|--------|
| `MAX_WORKERS` | 最大工作进程数 | 20 |
| `WORKER_TIMEOUT` | 工作进程超时(秒) | 300 |

## 环境特定配置

### 开发环境

```bash
# 使用开发环境配置
cp config/environments/env.openrouter .env.development

# 主要特点：
# - 详细日志 (LOG_LEVEL=debug)
# - 本地数据库
# - 较小的并发限制
# - 不强制HTTPS
```

### 生产环境

```bash
# 使用生产环境配置
cp config/environments/production.openrouter.env .env.production

# 主要特点：
# - 简洁日志 (LOG_LEVEL=warn)
# - 远程数据库
# - 高并发配置
# - 强制HTTPS
# - 启用监控
```

### 测试环境

```bash
# 使用测试环境配置
cp config/environments/env.openrouter .env.test

# 修改为测试配置：
# - 使用测试数据库
# - Mock翻译服务（可选）
# - 降低速率限制
```

## 多服务配置

### 方式一：共享配置文件

所有服务使用同一个`.env`文件：

```bash
# 创建软链接
ln -s $(pwd)/.env backend/.env
ln -s $(pwd)/.env frontend/.env.local
ln -s $(pwd)/.env translator/.env
```

### 方式二：独立配置文件

每个服务使用独立的配置：

```bash
# Backend服务
cp config/environments/env.openrouter backend/.env
# 编辑backend特定配置

# Frontend服务
cp config/environments/env.openrouter frontend/.env.local
# 只保留前端需要的变量

# Translator服务
cp config/environments/env.openrouter translator/.env
# 只保留翻译服务需要的变量
```

## 安全建议

### 1. 敏感信息管理

**不要提交到Git：**
```bash
# 添加到.gitignore
.env
.env.*
!.env.example
```

**使用环境变量引用：**
```bash
# 生产环境使用系统环境变量
export OPENROUTER_API_KEY=your_actual_key
export JWT_SECRET=your_actual_secret
```

### 2. 密钥轮换

定期更新以下密钥：
- OpenRouter API密钥（每月）
- JWT密钥（每季度）
- 数据库密码（每季度）

### 3. 权限控制

```bash
# 限制配置文件权限
chmod 600 .env
chmod 600 .env.production
```

## 验证配置

### 1. 检查环境变量

```bash
# 显示当前配置（隐藏敏感信息）
node -e "
const env = require('dotenv').config();
Object.keys(env.parsed).forEach(key => {
    const value = key.includes('SECRET') || key.includes('PASSWORD') || key.includes('KEY') 
        ? '***' 
        : env.parsed[key];
    console.log(\`\${key}=\${value}\`);
});
"
```

### 2. 测试连接

```bash
# 测试OpenRouter连接
python test_openrouter_client.py

# 测试数据库连接
node -e "
const { Client } = require('pg');
const client = new Client();
client.connect()
    .then(() => console.log('✅ 数据库连接成功'))
    .catch(err => console.error('❌ 数据库连接失败:', err))
    .finally(() => client.end());
"
```

### 3. 验证存储配置

```bash
# 检查存储目录
ls -la $LOCAL_STORAGE_ROOT

# 测试文件写入
echo "test" > $LOCAL_STORAGE_ROOT/test.txt
rm $LOCAL_STORAGE_ROOT/test.txt
```

## 故障排查

### 常见问题

1. **OpenRouter API密钥无效**
   - 检查密钥是否正确复制
   - 确认账户有余额
   - 验证密钥权限

2. **数据库连接失败**
   - 检查PostgreSQL服务状态
   - 验证用户名密码
   - 确认网络连接

3. **存储权限问题**
   - 检查目录权限
   - 确认用户所有权
   - 验证磁盘空间

### 调试模式

启用详细日志：
```bash
export LOG_LEVEL=debug
export DEBUG=*
```

## 迁移清单

从Google Cloud迁移到OpenRouter时的检查清单：

- [ ] 获取OpenRouter API密钥
- [ ] 配置OPENROUTER_API_KEY
- [ ] 设置本地存储路径
- [ ] 更新数据库配置
- [ ] 生成新的JWT密钥
- [ ] 更新服务URL
- [ ] 测试API连接
- [ ] 验证存储访问
- [ ] 检查日志输出
- [ ] 运行集成测试

## 相关文档

- [OpenRouter迁移指南](../Documentations/SeekHub_Backend_Integration_Plan.md)
- [Translator服务文档](../tools/experiments/PDF_to_DOCX/PDF_to_DOCX/SeekHub_Demo-main/translator/README_OPENROUTER.md)
- [Backend服务文档](../tools/experiments/PDF_to_DOCX/PDF_to_DOCX/SeekHub_Demo-main/backend/MIGRATION_GUIDE_OPENROUTER.md)
