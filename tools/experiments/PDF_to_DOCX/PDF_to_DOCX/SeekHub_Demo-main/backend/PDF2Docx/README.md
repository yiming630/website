# PDF2Docx 集成系统使用说明书

## 📖 系统概述

PDF2Docx是一个集成的文档处理系统，整合了多个功能模块：

- 🚀 **PDF转DOCX转换**: 使用WPS Office API进行高质量转换
- ✂️ **智能文档分割**: 使用AI进行语义感知的文档分割
- 🌐 **多语言翻译**: 基于Google Gemini的专业翻译
- ☁️ **云存储管理**: Google Cloud Storage文件管理
- 🤖 **AI驱动处理**: 全流程智能化处理

## 🏗️ 系统架构

```
PDF2Docx/
├── config/           # 配置管理
│   ├── config.py    # 主配置文件
│   └── __init__.py
├── utils/           # 工具模块
│   ├── logger.py    # 日志工具
│   ├── file_utils.py # 文件操作工具
│   ├── text_utils.py # 文本处理工具
│   └── __init__.py
├── clients/         # API客户端
│   ├── wps_client.py      # WPS API客户端
│   ├── gemini_client.py   # Gemini API客户端
│   ├── cloud_storage_client.py # 云存储客户端
│   └── __init__.py
├── data/           # 数据目录
│   ├── pdf/        # 输入PDF文件
│   ├── docx_raw/   # 转换后的DOCX文件
│   ├── docx_split/ # 分割后的文档
│   ├── docx_translated/ # 翻译后的文档
│   └── temp/       # 临时文件
├── logs/           # 日志文件
├── main.py         # 主程序入口
├── test_system.py  # 系统测试程序
├── requirements.txt # 依赖包列表
└── README.md       # 本文件
```

## 🚀 快速开始

### 1. 环境准备

#### 系统要求
- Python 3.8+
- 稳定的网络连接
- 足够的磁盘空间

#### 安装依赖
```bash
# 进入项目目录
cd backend/PDF2Docx

# 安装依赖包
pip install -r requirements.txt
```

### 2. 配置API密钥

#### 环境变量配置
创建 `.env` 文件或设置环境变量：

```bash
# Gemini API配置（必需）
export GEMINI_API_KEY="your_gemini_api_key"
export GEMINI_MODEL="gemini-2.0-flash-001"

# Google Cloud配置（可选）
export GOOGLE_CLOUD_PROJECT="your_project_id"
export GOOGLE_APPLICATION_CREDENTIALS="path/to/credentials.json"
export GCS_BUCKET_NAME="your_bucket_name"

# WPS API配置（转换功能需要）
export WPS_API_KEY="your_wps_api_key"
export WPS_APP_ID="your_wps_app_id"

# 系统配置
export MAX_WORKERS="20"
export LOG_LEVEL="INFO"
```

#### API密钥获取

**Google Gemini API**
1. 访问 [Google AI Studio](https://makersuite.google.com/)
2. 创建API密钥
3. 设置 `GEMINI_API_KEY` 环境变量

**WPS Office API**
1. 访问 [WPS开放平台](https://open.wps.cn/)
2. 注册开发者账号并创建应用
3. 获取API Key和App ID

**Google Cloud Storage**
1. 创建Google Cloud项目
2. 启用Cloud Storage API
3. 创建服务账号并下载凭证文件

### 3. 运行系统测试

```bash
# 运行综合测试
python3 test_system.py

# 运行API连接测试
python3 main.py test
```

## 💻 使用方法

### 命令行模式

#### 1. 交互模式（推荐新手）
```bash
python3 main.py
# 或
python3 main.py interactive
```

交互模式提供友好的菜单界面：
- 测试API连接
- PDF转DOCX
- 文档分割
- 文档翻译
- 完整工作流程

#### 2. 命令模式（推荐自动化）

**测试API连接**
```bash
python3 main.py test
```

**PDF转DOCX转换**
```bash
# 使用默认目录
python3 main.py convert

# 指定输入输出目录
python3 main.py convert --input /path/to/pdf --output /path/to/docx
```

**完整工作流程**
```bash
# 完整流程：PDF转换 + 分割 + 翻译
python3 main.py workflow --workflow full

# 仅转换
python3 main.py workflow --workflow convert

# 仅分割
python3 main.py workflow --workflow split

# 仅翻译
python3 main.py workflow --workflow translate
```

### 编程接口

#### 基本使用示例

```python
import asyncio
from pathlib import Path
from main import PDF2DocxSystem

async def process_documents():
    # 创建系统实例
    system = PDF2DocxSystem()
    
    # 测试API连接
    connections = await system.test_connections()
    print("API连接状态:", connections)
    
    # 处理PDF文件
    pdf_files = [Path("example.pdf")]
    
    # 执行完整工作流程
    result = await system.process_workflow(
        pdf_files=pdf_files,
        workflow_type='full'
    )
    
    print("处理结果:", result)

# 运行
asyncio.run(process_documents())
```

#### 高级用法

```python
import asyncio
from clients.gemini_client import GeminiClient
from clients.wps_client import WPSClient

async def advanced_usage():
    # 直接使用客户端
    gemini = GeminiClient()
    
    # 翻译文本
    result = await gemini.translate_text(
        text="Hello, world!",
        source_lang="en",
        target_lang="zh"
    )
    
    # 智能分割文档
    split_result = await gemini.split_document(
        text="Large document content...",
        max_chunk_size=2000
    )
    
    # WPS转换
    async with WPSClient() as wps:
        convert_result = await wps.convert_pdf_to_docx(
            pdf_path=Path("document.pdf"),
            output_path=Path("document.docx")
        )

asyncio.run(advanced_usage())
```

## 🔧 配置选项

### 核心配置

| 配置项 | 环境变量 | 默认值 | 说明 |
|--------|----------|--------|------|
| API密钥 | GEMINI_API_KEY | 无 | Gemini API密钥 |
| 模型 | GEMINI_MODEL | gemini-2.0-flash-001 | 使用的AI模型 |
| 工作线程 | MAX_WORKERS | 20 | 最大并发工作线程数 |
| 日志级别 | LOG_LEVEL | INFO | 日志详细程度 |

### 路径配置

| 目录 | 默认路径 | 说明 |
|------|----------|------|
| PDF输入 | data/pdf/ | 待转换的PDF文件 |
| DOCX原始 | data/docx_raw/ | 转换后的DOCX文件 |
| DOCX分割 | data/docx_split/ | 分割后的文档片段 |
| DOCX翻译 | data/docx_translated/ | 翻译后的文档 |
| 临时文件 | data/temp/ | 处理过程中的临时文件 |
| 日志 | logs/ | 系统日志文件 |

### 性能调优

```python
# 在config.py中修改
class WorkerConfig:
    max_workers: int = 20           # 并发线程数
    worker_timeout: int = 300       # 单个任务超时时间
    max_concurrent_requests: int = 30  # 最大并发请求数
    connection_pool_size: int = 100   # 连接池大小

class ProcessingConfig:
    retry_times: int = 3            # 重试次数
    retry_delay: int = 5            # 重试延迟
    split_max_tokens: int = 2048    # 分割最大token数
    batch_size: int = 5             # 批处理大小
```

## 🛠️ 故障排除

### 常见问题

#### 1. API密钥错误
```
ValueError: GEMINI_API_KEY environment variable is required
```

**解决方案:**
- 检查环境变量是否正确设置
- 验证API密钥是否有效
- 确认网络连接正常

#### 2. 文件权限错误
```
PermissionError: Permission denied
```

**解决方案:**
- 检查文件和目录权限
- 确保有写入权限
- 使用管理员权限运行

#### 3. 依赖包错误
```
ModuleNotFoundError: No module named 'xxx'
```

**解决方案:**
```bash
pip install -r requirements.txt
# 或更新pip
pip install --upgrade pip
```

#### 4. 内存不足
```
MemoryError: Out of memory
```

**解决方案:**
- 减少并发数量
- 分批处理大文件
- 增加系统内存

### 调试模式

启用详细日志：
```bash
export LOG_LEVEL="DEBUG"
python3 main.py test
```

检查配置：
```python
from config import pdf2docx_config
print(pdf2docx_config.to_dict())
```

### 性能监控

系统提供内置的性能监控：
- 实时任务进度
- 内存使用情况
- API调用统计
- 错误率监控

## 📊 最佳实践

### 1. 文件组织

```
project/
├── input/
│   ├── batch1/
│   │   ├── doc1.pdf
│   │   └── doc2.pdf
│   └── batch2/
├── output/
│   ├── converted/
│   ├── split/
│   └── translated/
└── logs/
```

### 2. 批处理建议

- **小文件** (< 10MB): 并发数 20-30
- **中等文件** (10-50MB): 并发数 10-15
- **大文件** (> 50MB): 并发数 5-10

### 3. 错误处理

```python
async def robust_processing():
    system = PDF2DocxSystem()
    
    try:
        result = await system.process_workflow(pdf_files)
        
        # 检查部分失败
        if result['overall_success']:
            print("✅ 处理完成")
        else:
            print("⚠️ 部分失败，检查日志")
            
    except Exception as e:
        print(f"❌ 处理失败: {e}")
        # 实施重试逻辑
```

### 4. 资源管理

```python
# 使用异步上下文管理器
async with WPSClient() as wps:
    result = await wps.convert_batch(pdf_files)

# 手动清理临时文件
system.cleanup_temp_files()
```

## 🔒 安全注意事项

### 1. API密钥安全
- 不要在代码中硬编码API密钥
- 使用环境变量或安全的配置管理
- 定期轮换API密钥

### 2. 文件安全
- 验证上传文件类型
- 限制文件大小
- 清理临时文件

### 3. 网络安全
- 使用HTTPS连接
- 验证SSL证书
- 实施速率限制

## 📈 扩展开发

### 添加新的转换器

```python
class CustomConverter:
    async def convert(self, input_file, output_file):
        # 实现转换逻辑
        pass

# 注册转换器
system.register_converter('custom', CustomConverter())
```

### 添加新的翻译语言

```python
# 在gemini_client.py中添加
LANGUAGE_MAPPINGS = {
    'zh-tw': '繁体中文',
    'ja': '日语',
    'ko': '韩语',
    # ...
}
```

### 自定义工作流程

```python
async def custom_workflow(pdf_files):
    system = PDF2DocxSystem()
    
    # 自定义步骤1: 预处理
    preprocessed = await preprocess_pdfs(pdf_files)
    
    # 自定义步骤2: 转换
    converted = await system.convert_pdf_to_docx(preprocessed)
    
    # 自定义步骤3: 后处理
    result = await postprocess_docx(converted)
    
    return result
```

## 🆘 获取帮助

### 文档资源
- [Google Gemini API文档](https://ai.google.dev/)
- [WPS API文档](https://open.wps.cn/)
- [Google Cloud Storage文档](https://cloud.google.com/storage/)

### 社区支持
- GitHub Issues
- 技术博客
- 开发者论坛

### 专业支持
如需专业技术支持，请联系开发团队。

---

## 📄 许可证

本项目采用MIT许可证。详情请参阅LICENSE文件。

## 🙏 致谢

感谢以下开源项目和服务：
- Google Gemini AI
- Google Cloud Platform
- WPS Office API
- Python开源社区

---

**最后更新**: 2024年1月
**版本**: 1.0.0 