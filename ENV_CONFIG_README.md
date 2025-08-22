# 环境变量配置指南

## 概述
本项目使用环境变量来管理不同环境下的配置。所有敏感信息（如API密钥、数据库密码等）都通过环境变量配置，不应提交到版本控制系统。

## 快速开始

1. **复制模板文件**
   ```bash
   cp .env.example .env
   ```

2. **编辑配置文件**
   根据你的环境修改 `.env` 文件中的值

3. **验证配置**
   ```bash
   node test-env-config.js
   ```

## 环境文件说明

- `.env.example` - 配置模板文件（已提交到版本控制）
- `.env.dev` - 开发环境配置
- `.env.local` - 本地开发配置
- `.env.production` - 生产环境配置
- `.env` - 实际使用的配置文件（不要提交）

## 核心配置项

### 1. OpenRouter配置（必需）
用于在中国访问Gemini API：
```bash
OPENROUTER_API_KEY=sk-or-v1-your-key-here
OPENROUTER_MODEL=google/gemini-pro
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```
获取API密钥：https://openrouter.ai/keys

### 2. 本地存储配置
替代Google Cloud Storage：
```bash
# Windows示例
LOCAL_STORAGE_ROOT=C:/data/seekhub/storage
# Linux示例
LOCAL_STORAGE_ROOT=/data/seekhub/storage

PUBLIC_URL_BASE=http://localhost:4000/files
```

### 3. 数据库配置
PostgreSQL连接信息：
```bash
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=seekhub_database
POSTGRES_PORT=5432
POSTGRES_HOST=localhost
```

### 4. 认证配置
JWT密钥（生产环境必须更改）：
```bash
JWT_SECRET=your-32-character-secret-key
JWT_REFRESH_SECRET=another-32-character-secret
```

生成安全密钥：
```bash
openssl rand -hex 32
```

### 5. 翻译服务配置
```bash
TRANSLATION_SERVICE_URL=http://localhost:8000
TRANSLATION_TIMEOUT=300000
MAX_CONCURRENT_TRANSLATIONS=5
ENABLE_TRANSLATION_CACHE=true
```

## 目录结构

项目需要以下目录（会自动创建）：
```
seekhub-demo/
├── storage/        # 文件存储目录
├── temp/          # 临时文件目录
└── output/        # 输出文件目录
```

## 不同环境的配置

### 开发环境
使用 `.env.dev` 或 `.env.local`：
- 宽松的速率限制
- 启用调试模式
- 本地数据库和服务

### 生产环境
使用 `.env.production`：
- 严格的安全配置
- 生产数据库
- HTTPS支持
- 错误监控

## 环境变量加载优先级

1. 系统环境变量
2. `.env.production`（如果NODE_ENV=production）
3. `.env.local`（不被Git跟踪）
4. `.env`

## 安全注意事项

⚠️ **重要提醒**：
- 永远不要将包含真实密钥的 `.env` 文件提交到版本控制
- 生产环境必须使用强密码和密钥
- 定期轮换API密钥和密码
- 使用环境变量管理工具（如AWS Secrets Manager）管理生产密钥

## 故障排查

### 常见问题

1. **环境变量未加载**
   - 确保 `.env` 文件在项目根目录
   - 检查文件权限
   - 重启应用

2. **OpenRouter API错误**
   - 验证API密钥是否正确
   - 检查网络连接
   - 确认API额度

3. **存储目录权限错误**
   - 确保应用有读写权限
   - 使用绝对路径
   - 检查磁盘空间

### 验证脚本

运行以下命令检查配置：
```bash
node test-env-config.js
```

## 相关文档

- [SeekHub后端集成计划](./Documentations/SeekHub_Backend_Integration_Plan.md)
- [服务器部署指南](./Documentations/服务器部署指南.md)

## 支持

如遇到配置问题，请检查：
1. 环境变量是否正确设置
2. 所需服务是否运行
3. 网络连接是否正常
4. 查看应用日志获取详细错误信息