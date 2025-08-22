# PDF转DOCX并智能分割工具

这是一个使用WPS Office API和Google Gemini API的批量文档处理工具，可以将PDF文件转换为DOCX格式，并使用AI进行智能文档分割。

## 功能特点

- 🚀 批量PDF转DOCX（通过WPS Office云API）
- 🤖 AI智能文档分割（通过Google Gemini）
- 📝 保持句子完整性的智能切分
- ⚡ 多线程并发处理
- 📊 进度条显示和详细日志
- 🔄 自动重试机制
- 🆕 新流程：直接从PDF提取文本并智能分割生成多个DOCX

## 项目结构

```
PDF_to_DOCX/
├── data/
│   ├── pdf/            # 待转换的PDF文件
│   ├── docx_raw/       # WPS转换后的原始DOCX
│   └── docx_split/     # AI分割后的DOCX/TXT
├── src/
│   ├── config.py       # 配置管理
│   ├── wps_client.py   # WPS API客户端
│   ├── gemini_client.py# Gemini API客户端
│   ├── converter.py    # PDF转换器
│   ├── splitter.py     # 文档分割器
│   └── pdf_splitter.py # PDF直接分割器（新）
├── logs/               # 日志文件
├── main.py            # 主程序入口
├── requirements.txt   # 依赖包
└── README.md         # 本文件
```

## 安装步骤

1. 克隆项目并进入目录：
```bash
cd PDF_to_DOCX
```

2. 创建虚拟环境（推荐）：
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate
```

3. 安装依赖：
```bash
pip install -r requirements.txt
```

4. 配置API密钥：
创建`.env`文件并添加以下内容：
```env
# WPS API配置
WPS_API_KEY=your_wps_api_key
WPS_APP_ID=your_wps_app_id
WPS_ENDPOINT=https://solution.wps.cn

# Gemini API配置
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-pro

# 其他配置
MAX_WORKERS=5
SPLIT_MAX_TOKENS=2048
```

## 使用方法

### 1. 测试API连接
```bash
python main.py test
```

### 2. 新流程：先分割PDF再转换（推荐）
```bash
# 处理data/pdf目录下的所有PDF，分割后转换为多个DOCX
python main.py split-pdf

# 处理指定PDF文件，自定义分割提示词
python main.py split-pdf --files document.pdf --prompt "按章节分割文档"

# 指定输入输出目录
python main.py split-pdf --input /path/to/pdfs --output /path/to/output --prompt "按主题分类"
```

### 3. 传统流程：先转换后分割

#### 转换PDF到DOCX
```bash
# 转换data/pdf目录下的所有PDF
python main.py convert

# 转换指定文件
python main.py convert --files file1.pdf file2.pdf

# 指定输入输出目录
python main.py convert --input /path/to/pdfs --output /path/to/docx
```

#### 智能分割DOCX
```bash
# 分割data/docx_raw目录下的所有DOCX
python main.py split

# 分割并保存为TXT格式
python main.py split --format txt

# 指定文件
python main.py split --files doc1.docx doc2.docx
```

### 4. 完整流程（转换+分割）
```bash
# 执行完整流程
python main.py all

# 指定输出格式为TXT
python main.py all --format txt

# 调整并发数
python main.py all --workers 10
```

## 两种流程对比

### 新流程 (split-pdf) - 推荐
- **优势**：精确分割，保留格式，减少API调用
- **流程**：PDF → 提取文本分析 → 分割为多个PDF → WPS API转换 → 多个DOCX
- **适用**：需要精确分割且保留原始格式的场景

### 传统流程 (convert + split)
- **优势**：简单直接，先获得完整DOCX
- **流程**：PDF → 完整DOCX → Gemini分割 → 多个DOCX
- **适用**：需要先获得完整DOCX文件作为备份的场景

## 命令行参数

### 通用参数
- `--workers`: 并发工作线程数（默认5）
- `--files`: 指定要处理的文件列表

### split-pdf命令（新）
- `--input`: PDF输入目录
- `--output`: 输出目录
- `--prompt`: 自定义分割提示词
- `--files`: 指定要处理的PDF文件

### convert命令
- `--input`: PDF输入目录
- `--output`: DOCX输出目录

### split命令
- `--input`: DOCX输入目录
- `--output`: 分割结果输出目录
- `--format`: 输出格式（docx或txt）

### all命令
- `--input`: PDF输入目录
- `--output`: 最终输出目录
- `--format`: 输出格式（docx或txt）

## API获取说明

### WPS Office API（仅传统流程需要）
1. 访问 [WPS开放平台](https://open.wps.cn/)
2. 注册开发者账号
3. 创建应用获取API Key和App ID
4. 查看PDF转换API文档

### Google Gemini API（必需）
1. 访问 [Google AI Studio](https://makersuite.google.com/)
2. 申请API密钥
3. 查看[Gemini API文档](https://ai.google.dev/)

## 注意事项

1. **API限制**：请注意API的QPS限制，可通过`MAX_WORKERS`参数调整并发数
2. **文件大小**：大文件转换可能需要较长时间，请耐心等待
3. **网络要求**：需要稳定的网络连接访问云端API
4. **费用**：某些API可能会产生费用，请查看相关平台的计费说明

## 错误处理

- 转换错误日志：`logs/conversion_errors.log`
- 分割错误日志：`logs/split_errors.log`
- 应用日志：`logs/app.log`

## 常见问题

1. **Q: API Key未配置错误**
   A: 请检查`.env`文件是否正确创建并包含所需的API密钥

2. **Q: 转换失败**
   A: 检查PDF文件是否损坏，网络连接是否正常，API配额是否用完

3. **Q: 分割结果不理想**
   A: 可以调整`SPLIT_MAX_TOKENS`参数来改变每段的长度

## 贡献指南

欢迎提交Issue和Pull Request！

## 许可证

MIT License 