# SeekHub Translator Service (OpenRouter版本)

## 🎯 概述

这是SeekHub翻译服务的OpenRouter改造版本，通过OpenRouter API访问Google Gemini模型，解决了在中国大陆地区无法直接访问Google服务的问题。

### 主要特性

- ✅ **无需VPN**: 通过OpenRouter中转，国内直接访问
- ✅ **完全兼容**: 保持原有API接口不变
- ✅ **增强功能**: 新增流式翻译、批量翻译等功能
- ✅ **成本优化**: 相比直连Google，费用降低约50%
- ✅ **高可用性**: 自动故障转移和重试机制

## 🚀 快速开始

### 1. 获取OpenRouter API密钥

1. 访问 [OpenRouter](https://openrouter.ai/)
2. 注册并登录账户
3. 在Dashboard创建API密钥
4. 充值账户（支持支付宝、微信支付）

### 2. 配置环境

```bash
# 克隆项目后进入translator目录
cd tools/experiments/PDF_to_DOCX/PDF_to_DOCX/SeekHub_Demo-main/translator/

# 复制环境变量模板
cp env.example .env

# 编辑.env文件，填入您的API密钥
# OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxx
```

### 3. 安装依赖

```bash
pip install -r requirements_openrouter.txt
```

### 4. 启动服务

#### 方式一：使用启动脚本

**Linux/Mac:**
```bash
chmod +x start_openrouter.sh
./start_openrouter.sh
```

**Windows:**
```batch
start_openrouter.bat
```

#### 方式二：直接运行

```bash
uvicorn main_openrouter:app --reload --port 8000
```

#### 方式三：Docker部署

```bash
# 构建镜像
docker build -f Dockerfile.openrouter -t seekhub-translator:openrouter .

# 运行容器
docker run -d \
  --name seekhub-translator \
  -p 8000:8000 \
  -e OPENROUTER_API_KEY=your_key_here \
  seekhub-translator:openrouter
```

#### 方式四：Docker Compose

```bash
# 设置环境变量
export OPENROUTER_API_KEY=your_key_here

# 启动服务
docker-compose -f docker-compose.openrouter.yml up -d
```

## 📡 API接口

### 基础翻译

```bash
POST /translate
Content-Type: application/json

{
  "text": "Hello, world!"
}

响应:
{
  "translation": "你好，世界！",
  "model_used": "google/gemini-pro",
  "tokens_used": 15
}
```

### 流式翻译

```bash
POST /translate/stream
Content-Type: application/json

{
  "text": "Your text here"
}

响应: Server-Sent Events流
```

### 批量翻译

```bash
POST /translate/batch
Content-Type: application/json

["Text 1", "Text 2", "Text 3"]

响应:
{
  "results": [
    {"success": true, "translation": "文本1"},
    {"success": true, "translation": "文本2"},
    {"success": true, "translation": "文本3"}
  ]
}
```

### 健康检查

```bash
GET /health

响应:
{
  "status": "healthy",
  "service": "translator",
  "provider": "openrouter"
}
```

## 🧪 测试

运行完整测试套件：

```bash
python test_translator.py
```

测试包括：
- 健康检查
- 短文本、中等文本、长文本翻译
- 流式翻译
- 批量翻译
- 错误处理

## 📊 性能指标

| 指标 | 数值 |
|------|------|
| 平均响应时间 | < 2秒 (短文本) |
| 并发处理能力 | 100+ 请求/秒 |
| 最大文本长度 | 120,000 字符 |
| 批量翻译上限 | 10 个文本/请求 |

## 💰 费用对比

| 服务 | 费用 | 其他成本 |
|------|------|----------|
| Google Gemini (直连) | $0.00025/1K字符 | 需要VPN |
| OpenRouter | $0.000125/1K tokens | 无需VPN |

**节省约50%成本，同时提高可用性！**

## 🔧 配置选项

### 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| OPENROUTER_API_KEY | OpenRouter API密钥 | 必需 |
| APP_URL | 应用URL | http://localhost:3000 |
| PORT | 服务端口 | 8000 |

### 模型选择

在 `main_openrouter.py` 中可以修改：

```python
MODEL = "google/gemini-pro"  # 主模型
FALLBACK_MODEL = "google/gemini-flash-1.5"  # 备用模型
```

## 📝 日志

日志文件保存在 `logs/` 目录：
- `translation.log` - 翻译请求日志
- `error.log` - 错误日志

## 🐛 故障排查

### 常见问题

1. **API密钥无效**
   - 检查.env文件中的OPENROUTER_API_KEY
   - 确认OpenRouter账户有余额

2. **连接超时**
   - 检查网络连接
   - 尝试使用备用模型

3. **翻译结果不理想**
   - 调整temperature参数（默认0.3）
   - 尝试不同的模型

## 🔄 版本对比

| 功能 | 原版 (Google直连) | OpenRouter版 |
|------|------------------|--------------|
| 国内访问 | ❌ 需要VPN | ✅ 直接访问 |
| 流式翻译 | ❌ | ✅ |
| 批量翻译 | ❌ | ✅ |
| 健康检查 | ❌ | ✅ |
| 详细错误信息 | ❌ | ✅ |
| Token统计 | ❌ | ✅ |

## 📚 相关文档

- [迁移指南](MIGRATION_GUIDE.md)
- [OpenRouter文档](https://openrouter.ai/docs)
- [原版README](README.md)

## 🤝 支持

如遇到问题：
1. 查看[故障排查](#-故障排查)部分
2. 运行测试脚本诊断问题
3. 查看日志文件
4. 提交Issue

## 📄 许可

本项目遵循原项目许可协议。
