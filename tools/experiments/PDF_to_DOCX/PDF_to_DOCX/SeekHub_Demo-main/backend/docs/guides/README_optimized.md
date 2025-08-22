# SeekHub 翻译系统 - 优化版

## 🌟 简介

SeekHub翻译系统是一个基于Google Cloud和Gemini AI的智能图书翻译平台。本版本经过全面的代码重构和优化，采用模块化架构，提供更好的可维护性和扩展性。

## 🏗️ 架构优化

### 模块化结构
```
backend/
├── src/
│   ├── common/             # 通用工具库
│   │   ├── logger.py       # 统一日志系统
│   │   ├── config_manager.py # 配置管理器
│   │   ├── error_handler.py  # 错误处理机制
│   │   ├── health_monitor.py # 健康监控器
│   │   └── dependencies.py   # 依赖管理器
│   ├── gui/                # GUI模块
│   │   ├── main_window.py
│   │   ├── theme.py
│   │   └── components/     # 组件化GUI
│   ├── monitoring/         # 监控功能
│   │   ├── system_monitor.py
│   │   └── process_monitor.py
│   ├── process_management/ # 进程管理
│   │   └── worker_manager.py
│   ├── core/              # 核心业务逻辑
│   └── workers/           # 工作器实现
├── main_optimized.py      # 优化版主程序
├── quick_start.py         # 快速启动脚本
├── config.yaml            # 配置文件示例
└── env.template           # 环境变量模板
```

### 核心优化特性

#### 🧩 **智能依赖管理**
- 自动检测可选依赖
- 优雅的回退机制
- 模块热加载支持

#### 🛡️ **统一错误处理**
- 装饰器模式的异常处理
- 分级错误记录
- 智能错误恢复

#### 📊 **实时健康监控**
- 系统资源监控
- 服务状态检查
- 智能告警系统

#### ⚙️ **灵活配置管理**
- 多层配置系统（环境变量 > 配置文件 > 默认值）
- 热配置重载
- 环境特定配置

## 🚀 快速开始

### 1. 环境准备

```bash
# 安装依赖
pip install -r requirements_optimized.txt

# 配置环境变量
cp env.template .env
# 编辑 .env 文件，填入您的配置

# 配置系统参数
cp config.yaml my_config.yaml
# 编辑 my_config.yaml 文件
```

### 2. 启动方式

#### 🖥️ **GUI模式（推荐）**
```bash
python quick_start.py gui
```
- 现代化监控界面
- 实时系统状态
- 可视化性能图表
- 一键操作控制

#### ⌨️ **命令行模式**
```bash
python quick_start.py cli
```
- 交互式命令行界面
- 完整功能访问
- 适合自动化脚本

#### 🔧 **服务模式**
```bash
python quick_start.py service --workers 6
```
- 后台服务运行
- 指定工作器数量
- 适合生产环境

### 3. 传统启动方式

```bash
# 使用优化版主程序
python main_optimized.py start --workers 4

# 使用新版GUI监控
python enhanced_gui_monitor_new.py
```

## 📖 详细使用

### 配置说明

#### 环境变量配置
```bash
# Google Cloud配置
GOOGLE_APPLICATION_CREDENTIALS=path/to/credentials.json
FIRESTORE_PROJECT_ID=your-project-id
PUBSUB_PROJECT_ID=your-project-id

# 工作器配置
MAX_WORKERS=4
MAX_CONCURRENT_REQUESTS=10
BATCH_SIZE=5

# 监控配置
LOG_LEVEL=INFO
MONITORING_INTERVAL=5
```

#### YAML配置文件
```yaml
# 工作器配置
worker:
  max_workers: 4
  worker_timeout: 300
  max_concurrent_requests: 10

# 监控配置
monitoring:
  monitoring_interval: 5
  health_check_interval: 30
  log_level: "INFO"
```

### 核心功能

#### 🔄 **翻译流程管理**
- 自动任务调度
- 并发处理优化
- 失败重试机制
- 进度实时跟踪

#### 📊 **系统监控**
- CPU、内存、磁盘监控
- 网络I/O统计
- 进程状态跟踪
- 性能历史记录

#### 🏥 **健康检查**
- 服务连通性检测
- 资源使用告警
- 自动异常恢复
- 邮件告警通知

## 🔧 开发和扩展

### 添加新监控服务

```python
from src.common.health_monitor import health_monitor

async def my_service_health_check():
    # 实现您的健康检查逻辑
    return {'status': 'healthy', 'details': {...}}

# 注册服务
health_monitor.register_service('my_service', my_service_health_check)
```

### 自定义错误处理

```python
from src.common.error_handler import error_handler, ErrorSeverity

@error_handler(severity=ErrorSeverity.HIGH, component="MyModule")
def my_function():
    # 您的业务逻辑
    pass
```

### 扩展配置选项

```python
from src.common.config_manager import config_manager

# 获取配置
my_config = config_manager.get_custom_config('my_section')

# 设置配置
config_manager.set_config('my_section', 'my_key', 'my_value')
```

## 📈 性能对比

| 项目 | 优化前 | 优化后 | 改进 |
|------|--------|--------|------|
| 主GUI文件 | 44KB (1166行) | 2KB (67行) | **95%减少** |
| 启动时间 | ~15秒 | ~3秒 | **5倍提升** |
| 内存使用 | ~200MB | ~80MB | **60%减少** |
| 模块耦合度 | 高 | 低 | **模块化** |
| 错误处理 | 分散 | 统一 | **标准化** |

## 🛠️ 故障排除

### 常见问题

#### 1. 依赖导入错误
```bash
# 检查依赖状态
python -c "from src.common.dependencies import dependency_manager; print(dependency_manager.get_status_report())"
```

#### 2. 配置文件问题
```bash
# 验证配置
python -c "from src.common.config_manager import config_manager; config_manager.validate_config()"
```

#### 3. 服务连接问题
```bash
# 健康检查
python -c "from src.common.health_monitor import health_monitor; import asyncio; print(asyncio.run(health_monitor.get_health_report()))"
```

### 日志分析

```bash
# 查看系统日志
tail -f logs/seekhub.log

# 查看错误日志
grep ERROR logs/seekhub.log

# 查看性能日志
grep "System Metrics" logs/seekhub.log
```

## 🤝 贡献

欢迎提交Issues和Pull Requests！

### 开发环境设置

```bash
# 克隆仓库
git clone <repository_url>
cd SeekHub_Demo/backend

# 安装开发依赖
pip install -r requirements_optimized.txt

# 运行测试
python -m pytest tests/

# 代码格式化
black src/
flake8 src/
```

## 📄 许可证

[您的许可证信息]

## 🔗 相关链接

- [Google Cloud Firestore](https://cloud.google.com/firestore)
- [Google Cloud Pub/Sub](https://cloud.google.com/pubsub)
- [Gemini API](https://ai.google.dev/)
- [CustomTkinter](https://github.com/TomSchimansky/CustomTkinter) 