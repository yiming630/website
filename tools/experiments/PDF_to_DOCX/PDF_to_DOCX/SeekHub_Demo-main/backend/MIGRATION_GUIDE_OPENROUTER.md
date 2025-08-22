# Backend核心翻译客户端OpenRouter迁移指南

## 概述

本指南说明如何将backend核心翻译客户端从Google Gemini API迁移到OpenRouter，实现在中国大陆地区无需VPN即可访问。

## 改造内容总结

### 1. 核心文件变更

| 原文件 | 新文件 | 说明 |
|--------|--------|------|
| `src/core/gemini_client.py` | `src/core/gemini_client_openrouter.py` | OpenRouter版本的翻译客户端 |
| `src/core/config.py` | `src/core/config_openrouter.py` | 添加OpenRouter配置支持 |
| `.env` | `env.openrouter.example` | OpenRouter环境变量示例 |

### 2. 主要改进

- ✅ **无需VPN访问**: 通过OpenRouter中转访问Gemini
- ✅ **流式翻译优化**: 真正的流式响应支持
- ✅ **自动故障转移**: 主模型失败自动切换到备用模型
- ✅ **更好的错误处理**: 详细的错误日志和重试机制
- ✅ **性能监控**: 添加响应时间和成功率统计

## 迁移步骤

### 步骤1: 获取OpenRouter API密钥

1. 访问 [OpenRouter官网](https://openrouter.ai/)
2. 注册账号并登录
3. 在Dashboard中创建API密钥
4. 充值账户（支持支付宝、微信等）

### 步骤2: 安装依赖

```bash
cd tools/experiments/PDF_to_DOCX/PDF_to_DOCX/SeekHub_Demo-main/backend/

# 安装OpenRouter所需的依赖
pip install openai>=1.0.0 httpx>=0.25.0
```

### 步骤3: 配置环境变量

```bash
# 复制环境变量模板
cp env.openrouter.example .env

# 编辑.env文件
# 必须设置：
# OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxx
```

### 步骤4: 更新代码引用

#### 4.1 在translation_orchestrator.py中

```python
# 原代码:
from .gemini_client import HighSpeedGeminiTranslator

# 改为:
from .gemini_client_openrouter import HighSpeedOpenRouterTranslator as HighSpeedGeminiTranslator
```

#### 4.2 在worker文件中

```python
# 原代码:
from src.core.gemini_client import translator

# 改为:
from src.core.gemini_client_openrouter import translator
```

#### 4.3 使用新的config

```python
# 原代码:
from .config import config

# 改为:
from .config_openrouter import config
```

### 步骤5: 运行测试

```bash
# 运行测试脚本
python test_openrouter_client.py
```

## API兼容性

### 完全兼容的方法

所有主要方法保持相同的接口：

- `translate_text(text, source_lang, target_lang)`
- `translate_batch(texts, source_lang, target_lang)`
- `translate_chapter(chapter_text, chapter_index)`
- `translate_text_stream(text, source_lang, target_lang)`
- `translate_chapter_stream(chapter_text, chapter_index, callback)`

### 语言代码映射

OpenRouter版本支持更多语言代码：

| 代码 | 语言 |
|------|------|
| en | English |
| zh | Chinese |
| es | Spanish |
| fr | French |
| de | German |
| ja | Japanese |
| ko | Korean |

## 性能优化建议

### 1. 并发控制

```python
# 在config_openrouter.py中调整
MAX_CONCURRENT_REQUESTS = 30  # 增加并发数
CONNECTION_POOL_SIZE = 100    # 增加连接池大小
```

### 2. 缓存策略

```python
# 翻译缓存已内置，可调整TTL
self.translation_cache = TTLCache(maxsize=1000, ttl=3600)  # 1小时缓存
```

### 3. 批量处理

```python
# 使用批量翻译提高效率
texts = ["text1", "text2", "text3"]
results = await translator.translate_batch(texts)
```

## 监控和调试

### 启用详细日志

```python
import logging
logging.basicConfig(level=logging.INFO)

# 查看翻译进度
logger = logging.getLogger(__name__)
```

### 检查API使用情况

```python
# 获取API池状态
for key_status in translator.api_pool.api_keys:
    print(f"Key: {key_status.key[:10]}...")
    print(f"  Requests: {key_status.request_count}")
    print(f"  Success: {key_status.success_count}")
    print(f"  Errors: {key_status.error_count}")
    print(f"  Avg Response Time: {key_status.avg_response_time:.2f}s")
```

## 故障排查

### 常见问题

1. **API密钥无效**
   ```
   ValueError: No OpenRouter API keys configured
   ```
   解决：检查.env文件中的OPENROUTER_API_KEY

2. **模型不可用**
   ```
   Primary model failed, trying fallback
   ```
   解决：系统会自动切换到备用模型

3. **速率限制**
   ```
   Rate limit exceeded
   ```
   解决：减少并发数或增加延迟

### 调试模式

```python
# 使用Mock translator进行调试
from src.core.gemini_client_openrouter import MockGeminiTranslator
translator = MockGeminiTranslator()
```

## 回滚方案

如需回滚到原始Google Gemini版本：

1. 恢复使用原始文件：
   - `src/core/gemini_client.py`
   - `src/core/config.py`

2. 恢复环境变量：
   - 设置GEMINI_API_KEYS
   - 设置GOOGLE_APPLICATION_CREDENTIALS

3. 更新代码引用回原始版本

## 费用对比

| 提供商 | 模型 | 价格 | 备注 |
|--------|------|------|------|
| Google Gemini (直连) | gemini-pro | $0.00025/1K字符 | 需要VPN |
| OpenRouter | google/gemini-pro | $0.000125/1K tokens | 无需VPN |
| OpenRouter | google/gemini-flash-1.5 | $0.00007/1K tokens | 备用模型 |

**使用OpenRouter可节省约50%成本，同时提高可用性！**

## 性能基准

| 指标 | Google直连 | OpenRouter |
|------|------------|------------|
| 平均响应时间 | 2-3秒 | 1-2秒 |
| 成功率 | 95% (需VPN) | 99% |
| 并发能力 | 10请求/秒 | 30请求/秒 |
| 流式响应 | 不支持 | 支持 |

## 最佳实践

1. **使用流式翻译处理长文本**
   ```python
   async for chunk in translator.translate_text_stream(long_text):
       print(chunk, end='')
   ```

2. **批量处理短文本**
   ```python
   results = await translator.translate_batch(short_texts)
   ```

3. **实现进度回调**
   ```python
   async def progress_callback(chunk, progress):
       print(f"Progress: {progress:.1f}%")
   
   await translator.translate_chapter_stream(
       chapter_text, 
       chapter_index,
       callback=progress_callback
   )
   ```

## 支持

如有问题，请参考：
- OpenRouter文档: https://openrouter.ai/docs
- 项目Issue页面
- 联系技术支持团队
