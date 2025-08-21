# SeekHub 智能翻译系统后端

🌟 **基于Google Cloud的现代化高性能书籍翻译服务** 🌟

## 📋 系统概述

SeekHub翻译系统是一个企业级的分布式翻译服务，采用Google Cloud原生架构，支持高并发处理和智能文档翻译。系统具备完整的进程管理、实时监控、多格式导出等功能。

### 🏗️ 核心架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   GUI监控界面    │    │   主控制器      │    │   进程管理器     │
│enhanced_gui_    │◄───┤   main.py      │◄───┤process_manager  │
│monitor.py       │    │                │    │.py              │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   翻译协调器     │    │   Worker进程    │    │   系统监控      │
│ orchestrator.py │    │ chapter_worker  │    │   健康检查      │
│                │    │ combo_worker    │    │   性能监控      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Google Cloud  │    │   Gemini AI     │    │   多格式导出     │
│   Firestore     │    │   翻译引擎      │    │   PDF/HTML/MD   │
│   Pub/Sub       │    │   流式处理      │    │   TXT格式       │
│   Storage       │    │                │    │                │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 核心功能特性

### 1. 🤖 AI驱动的智能翻译
- **Gemini AI集成**: 采用Google最新Gemini模型
- **流式处理**: 支持实时翻译输出，提升用户体验
- **多API密钥**: 智能负载均衡，突破单密钥限制
- **智能缓存**: TTL缓存机制，避免重复翻译

### 2. ☁️ Google Cloud原生架构
- **Firestore数据库**: NoSQL文档存储，支持实时更新
- **Pub/Sub消息队列**: 替代Redis，提供全托管消息服务
- **Cloud Storage**: 对象存储，支持全球CDN加速
- **自动扩缩**: 根据负载自动调整资源

### 3. 📊 全面的系统监控
- **GUI监控界面**: 现代化CustomTkinter界面
- **实时性能监控**: CPU、内存、磁盘、网络状态
- **进程健康检查**: 自动检测和重启失败进程
- **告警系统**: 智能阈值告警，支持邮件通知

### 4. 📄 DOCX智能处理
- **XML直接替换**: 100%保留原始格式和排版
- **多格式导出**: 支持PDF、HTML、Markdown、TXT
- **图片位置保护**: 完整保留文档中的图片和表格
- **批量处理**: 高效的并发翻译处理

### 5. ⚡ 高性能并发架构
- **异步处理**: 基于asyncio的高并发架构
- **进程池管理**: 智能Worker进程调度
- **连接池优化**: HTTP/2长连接复用
- **内存优化**: 流式处理减少内存占用

## 📁 项目结构

```
backend/
├── main.py                      # 🎯 主入口文件
├── process_manager.py           # 🔧 进程管理器
├── enhanced_gui_monitor.py      # 🖥️ GUI监控界面
├── docx_xml_translator.py       # 📄 DOCX翻译器
├── exporters.py                 # 📤 多格式导出器
├── requirements.txt             # 📦 依赖列表
├── start_enhanced_gui.sh        # 🚀 GUI启动脚本
├── start_monitor.sh             # 📊 监控启动脚本
├── seekhub-demo-*.json          # 🔑 Google Cloud凭证
├── src/                         # 📚 核心模块
│   ├── core/                    # 🧠 核心组件
│   │   ├── config.py            # ⚙️ 配置管理
│   │   ├── firestore_helper.py  # 🔥 Firestore操作
│   │   ├── pubsub_queue.py      # 📨 消息队列管理
│   │   ├── gemini_client.py     # 🤖 AI翻译客户端
│   │   └── translation_orchestrator.py # 🎼 翻译协调器
│   └── workers/                 # 👷 工作进程
│       ├── chapter_worker.py    # 📖 章节翻译工作器
│       └── combination_worker.py # 📑 组合工作器
├── logs/                        # 📋 日志目录
└── test_results/               # 🧪 测试结果
```

## 🛠️ 安装与配置

### 环境要求

- Python 3.8+
- Google Cloud凭证
- Gemini API密钥

### 1. 安装依赖

```bash
cd backend
pip install -r requirements.txt
```

### 2. 配置Google Cloud凭证

```bash
# 设置环境变量
export GOOGLE_APPLICATION_CREDENTIALS="seekhub-demo-9d255b940d24.json"

# 或在.env文件中配置
echo "GOOGLE_APPLICATION_CREDENTIALS=seekhub-demo-9d255b940d24.json" >> .env
```

### 3. 配置API密钥

在`.env`文件中添加：

```env
# Gemini API配置
GEMINI_API_KEYS=your_key1,your_key2,your_key3
GEMINI_MODEL=gemini-pro

# Google Cloud配置
FIRESTORE_PROJECT_ID=seekhub-demo
PUBSUB_PROJECT_ID=seekhub-demo
GCS_BUCKET_NAME=seekhub-demo-test1

# 性能配置
MAX_WORKERS=20
MAX_CONCURRENT_REQUESTS=30
CONNECTION_POOL_SIZE=100
```

## 🎮 使用指南

### 命令行模式

```bash
# 运行完整翻译流程
python main.py

# 查看系统状态
python main.py status

# 测试API连接
python main.py test

# 紧急停止系统
python main.py stop
```

### GUI监控模式

```bash
# 启动图形化监控界面
python enhanced_gui_monitor.py

# 或使用启动脚本
chmod +x start_enhanced_gui.sh
./start_enhanced_gui.sh
```

### DOCX翻译模式

```bash
# 基础翻译（仅生成DOCX）
python docx_xml_translator.py --input source.docx --output result.docx

# 翻译并导出多种格式
python docx_xml_translator.py \
    --input book.docx \
    --output translated.docx \
    --formats pdf,html,md,txt \
    --lang Chinese
```

### 程序化调用

```python
from src.core.translation_orchestrator import orchestrator

# 启动翻译任务
result = await orchestrator.start_translation(
    book_id="book_123",
    content="要翻译的内容",
    target_language="Chinese"
)

# 查询翻译状态
status = await orchestrator.get_translation_status("book_123")
```

## 📊 监控与管理

### GUI监控界面功能

- **📈 实时性能图表**: CPU、内存、网络使用率
- **🔄 进程状态监控**: Worker进程运行状态
- **📝 日志实时查看**: 系统日志和错误日志
- **⚙️ 系统控制面板**: 启动/停止服务控制
- **🔔 状态通知**: 系统状态变化通知

### 命令行监控

```bash
# 查看详细系统状态
python process_manager.py status

# 启动健康检查
python process_manager.py health

# 查看进程信息
python process_manager.py processes
```

## 🔧 高级配置

### 性能调优参数

```env
# 并发控制
MAX_WORKERS=20                    # 最大Worker进程数
MAX_CONCURRENT_REQUESTS=30        # 最大并发请求数
CONNECTION_POOL_SIZE=100          # 连接池大小

# 超时设置
WORKER_TIMEOUT=300               # Worker超时时间(秒)
PROCESS_TIMEOUT=600              # 进程超时时间(秒)
RATE_LIMIT_DELAY=1.0             # 速率限制延迟

# 重试配置
MAX_RETRIES=3                    # 最大重试次数
WORKER_RESTART_DELAY=10          # Worker重启延迟
MAX_WORKER_RESTARTS=5            # 最大重启次数
```

### 监控配置

```env
# 监控间隔
MONITORING_INTERVAL=5            # 监控检查间隔(秒)
HEALTH_CHECK_INTERVAL=30         # 健康检查间隔(秒)

# 告警阈值
ALERT_THRESHOLD_CPU_USAGE=0.8    # CPU使用率告警阈值
ALERT_THRESHOLD_MEMORY_USAGE=0.8 # 内存使用率告警阈值
ALERT_THRESHOLD_ERROR_RATE=0.1   # 错误率告警阈值

# 日志配置
LOG_LEVEL=INFO                   # 日志级别
LOG_FILE=logs/translation_system.log # 日志文件路径
```

## 📚 API参考

### 核心API

#### 翻译接口
```python
# 提交翻译任务
POST /api/translate
{
    "title": "书籍标题",
    "content": "书籍内容",
    "target_language": "Chinese",
    "format": "docx"
}

# 查询翻译状态
GET /api/status/{book_id}

# 下载翻译结果
GET /api/download/{book_id}
```

#### 系统管理
```python
# 系统状态
GET /api/system/status

# 健康检查
GET /api/system/health

# 性能指标
GET /api/system/metrics
```

### Python SDK

```python
from src.core.translation_orchestrator import orchestrator
from src.core.firestore_helper import db_helper
from src.core.pubsub_queue import queue_manager

# 数据库操作
docs = await db_helper.find_documents("books", {"status": "pending"})
await db_helper.update_document("books", "book_id", {"status": "completed"})

# 队列操作
message_id = await queue_manager.add_chapter_task(
    book_id="book_123",
    chapter_index=1,
    chapter_text="章节内容"
)

# 翻译操作
result = await orchestrator.translate_chapter(
    chapter_text="要翻译的内容",
    target_language="Chinese"
)
```

## 🐛 故障排除

### 常见问题

**Q: 系统启动时连接失败？**
A: 检查Google Cloud凭证和网络连接，确保API密钥有效。

**Q: Worker进程频繁重启？**
A: 检查内存使用率和API调用限制，可能需要调整并发参数。

**Q: 翻译速度慢？**
A: 增加Worker进程数量，优化网络连接，或添加更多API密钥。

**Q: GUI界面无法显示？**
A: 确保已安装customtkinter和相关GUI依赖。

### 日志分析

```bash
# 查看实时日志
tail -f logs/translation_system.log

# 查看错误日志
grep "ERROR" logs/translation_system.log

# 查看性能日志
grep "Performance" logs/translation_system.log
```

### 调试模式

```bash
# 启用调试模式
export LOG_LEVEL=DEBUG
python main.py

# 详细错误信息
python -u main.py 2>&1 | tee debug.log
```

## 🚀 部署指南

### 开发环境

```bash
# 创建虚拟环境
python -m venv .venv
source .venv/bin/activate  # Linux/macOS
# .venv\Scripts\activate   # Windows

# 安装依赖
pip install -r requirements.txt

# 启动开发服务器
python main.py
```

### 生产环境

```bash
# 使用systemd管理服务
sudo cp seekhub.service /etc/systemd/system/
sudo systemctl enable seekhub
sudo systemctl start seekhub

# 使用Docker部署
docker build -t seekhub-backend .
docker run -d --name seekhub -p 8080:8080 seekhub-backend
```

### 性能优化建议

1. **资源配置**: 根据负载调整MAX_WORKERS和内存分配
2. **网络优化**: 使用HTTP/2和连接池复用
3. **缓存策略**: 启用智能缓存减少API调用
4. **监控告警**: 配置完整的监控和告警系统

## 📄 许可证

本项目采用MIT许可证，详见LICENSE文件。

## 🤝 贡献指南

欢迎提交Issue和Pull Request！请遵循以下流程：

1. Fork项目仓库
2. 创建功能分支
3. 提交代码变更
4. 创建Pull Request

## 📞 技术支持

- 📧 邮箱: support@seekhub.com
- 📖 文档: https://docs.seekhub.com
- 🐛 问题反馈: https://github.com/seekhub/issues

---

**🌟 SeekHub - 让翻译更智能，让文档更国际化！ 🌟** 