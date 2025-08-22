# SeekHub后端核心集成与改造计划

## 系统现状分析

### 当前架构概览
SeekHub_Demo-main系统当前采用Google Cloud全家桶架构：
- **文档处理**: WPS API进行PDF转DOCX
- **翻译引擎**: 直接调用Google Gemini API
- **存储服务**: Google Cloud Storage (GCS)
- **数据库**: Google Firestore
- **任务队列**: Google Pub/Sub
- **认证方式**: Google服务账号JSON密钥

### 核心组件结构
```
SeekHub_Demo-main/
├── translator/          # FastAPI翻译服务（独立微服务）
├── backend/            # 主后端系统
│   ├── src/core/       # 核心翻译逻辑
│   └── src/workers/    # 任务处理工作器
├── PDF_to_DOCX/        # PDF处理模块
└── run_full_translation.py  # 完整流程协调器
```

## 改造计划详细步骤

### 1. 集成OpenRouter实现国内访问Gemini

#### 1.1 改造translator服务
**文件位置**: `translator/main.py`

**改造步骤**:
1. 安装OpenRouter SDK
```bash
pip install openai  # OpenRouter使用OpenAI兼容接口
```

2. 修改API客户端初始化
```python
# 原代码（第24行）:
client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

# 改为:
from openai import AsyncOpenAI

openrouter_client = AsyncOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
    default_headers={
        "HTTP-Referer": "http://localhost:3000",  # 您的站点URL
        "X-Title": "SeekHub Translation"
    }
)
```

3. 修改翻译函数
```python
# 原代码（第88-92行）:
rsp = await aio.models.generate_content(
    model=MODEL,
    contents=msgs,
)

# 改为:
rsp = await openrouter_client.chat.completions.create(
    model="google/gemini-pro",  # 或 "google/gemini-flash-1.5"
    messages=[
        {"role": "system", "content": SYSTEM},
        {"role": "user", "content": req.text}
    ],
    temperature=0.3,
    max_tokens=4000
)
translation = rsp.choices[0].message.content
```

#### 1.2 改造backend核心翻译客户端
**文件位置**: `backend/src/core/gemini_client.py`

**改造步骤**:
1. 替换Gemini SDK为OpenRouter
```python
# 第11行，替换:
import google.generativeai as genai

# 为:
from openai import AsyncOpenAI
import httpx
```

2. 修改`translate_text_stream`方法（第236行）
```python
async def translate_text_stream(self, text: str, source_lang: str = "en", 
                               target_lang: str = "zh") -> AsyncIterator[str]:
    """使用OpenRouter进行流式翻译"""
    
    client = AsyncOpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=self.current_key,  # 使用OpenRouter API密钥
        http_client=httpx.AsyncClient(
            timeout=60.0,
            limits=httpx.Limits(max_keepalive_connections=100)
        )
    )
    
    stream = await client.chat.completions.create(
        model="google/gemini-pro",
        messages=[
            {"role": "system", "content": f"Translate from {source_lang} to {target_lang}"},
            {"role": "user", "content": text}
        ],
        stream=True,
        temperature=0.3
    )
    
    async for chunk in stream:
        if chunk.choices[0].delta.content:
            yield chunk.choices[0].delta.content
```

#### 1.3 环境变量配置
在`.env`文件中添加：
```bash
# OpenRouter配置
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=google/gemini-pro
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

### 2. 将Google Cloud Storage改为百度服务器本地存储

#### 2.1 创建本地文件存储服务
**新建文件**: `backend/src/core/local_storage.py`
```python
import os
import logging
import shutil
from typing import Optional
from pathlib import Path
import json

logger = logging.getLogger(__name__)

class LocalFileStorage:
    """百度服务器本地文件存储服务"""
    
    def __init__(self):
        # 配置存储根目录
        self.storage_root = os.getenv('LOCAL_STORAGE_ROOT', '/data/seekhub/storage')
        self.public_url_base = os.getenv('PUBLIC_URL_BASE', 'http://your-baidu-server.com/files')
        
        # 确保存储目录存在
        Path(self.storage_root).mkdir(parents=True, exist_ok=True)
        
        logger.info(f"本地存储初始化: {self.storage_root}")
        
    def _get_full_path(self, object_key: str) -> Path:
        """获取文件的完整路径"""
        return Path(self.storage_root) / object_key
        
    def upload_string(self, content: str, object_key: str) -> str:
        """保存字符串内容到本地文件系统"""
        try:
            file_path = self._get_full_path(object_key)
            
            # 创建目录结构
            file_path.parent.mkdir(parents=True, exist_ok=True)
            
            # 写入文件
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            # 生成访问URL（如果配置了Web服务器）
            url = f"{self.public_url_base}/{object_key}"
            logger.info(f"文件保存成功: {file_path}")
            
            return url
            
        except Exception as e:
            logger.error(f"保存文件失败: {e}")
            raise
    
    def upload_file(self, local_file_path: str, object_key: str) -> str:
        """上传本地文件到存储目录"""
        try:
            file_path = self._get_full_path(object_key)
            
            # 创建目录结构
            file_path.parent.mkdir(parents=True, exist_ok=True)
            
            # 复制文件
            shutil.copy2(local_file_path, file_path)
            
            url = f"{self.public_url_base}/{object_key}"
            logger.info(f"文件上传成功: {file_path}")
            
            return url
            
        except Exception as e:
            logger.error(f"上传文件失败: {e}")
            raise
    
    def download_string(self, object_key: str) -> str:
        """从本地文件系统读取字符串内容"""
        try:
            file_path = self._get_full_path(object_key)
            
            if not file_path.exists():
                raise FileNotFoundError(f"文件不存在: {object_key}")
            
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            return content
            
        except Exception as e:
            logger.error(f"读取文件失败: {e}")
            raise
    
    def delete_object(self, object_key: str) -> bool:
        """删除本地文件"""
        try:
            file_path = self._get_full_path(object_key)
            
            if file_path.exists():
                file_path.unlink()
                logger.info(f"文件删除成功: {file_path}")
                
                # 清理空目录
                try:
                    file_path.parent.rmdir()
                except OSError:
                    pass  # 目录非空，忽略
                    
            return True
            
        except Exception as e:
            logger.error(f"删除文件失败: {e}")
            return False
    
    def list_objects(self, prefix: str = "") -> list:
        """列出指定前缀的所有文件"""
        try:
            base_path = self._get_full_path(prefix)
            files = []
            
            if base_path.exists():
                for file_path in base_path.rglob("*"):
                    if file_path.is_file():
                        relative_path = file_path.relative_to(Path(self.storage_root))
                        files.append(str(relative_path))
            
            return files
            
        except Exception as e:
            logger.error(f"列出文件失败: {e}")
            return []
```

#### 2.2 替换translation_orchestrator.py中的GCS调用
**文件位置**: `backend/src/core/translation_orchestrator.py`

**改造步骤**:
1. 导入本地存储客户端（第15行后添加）
```python
from .local_storage import LocalFileStorage
```

2. 替换GCS初始化（第22-24行）
```python
# 原代码:
self.gcs_client = storage.Client()
self.bucket_name = config.GCS_BUCKET_NAME

# 改为:
self.storage_client = LocalFileStorage()
```

3. 替换所有GCS操作
- 第119行（上传原始内容）:
```python
# 原代码:
original_blob = self.bucket.blob(f"books/{book_id}/original.txt")
original_blob.upload_from_string(content, content_type="text/plain; charset=utf-8")

# 改为:
original_path = self.storage_client.upload_string(
    content, 
    f"books/{book_id}/original.txt"
)
```

- 第225行（上传翻译结果）:
```python
# 原代码:
blob = self.bucket.blob(f"books/{book_id}/chapters/chapter_{chapter_index}_zh.txt")
blob.upload_from_string(translated_text, content_type="text/plain; charset=utf-8")

# 改为:
chapter_path = self.storage_client.upload_string(
    translated_text,
    f"books/{book_id}/chapters/chapter_{chapter_index}_zh.txt"
)
```

- 第277行（下载章节内容）:
```python
# 原代码:
blob = self.bucket.blob(chapter['gcs_path'])
chapter_text = blob.download_as_text()

# 改为:
# 从路径中提取相对路径（去掉URL前缀）
relative_path = chapter['gcs_path'].replace(self.storage_client.public_url_base + '/', '')
chapter_text = self.storage_client.download_string(relative_path)
```

#### 2.3 配置Nginx服务器（可选）
如果需要通过HTTP访问文件，在百度服务器上配置Nginx：

**文件**: `/etc/nginx/sites-available/seekhub-storage`
```nginx
server {
    listen 80;
    server_name your-baidu-server.com;
    
    # 文件存储目录
    location /files/ {
        alias /data/seekhub/storage/;
        autoindex off;
        
        # 设置缓存
        expires 7d;
        add_header Cache-Control "public, immutable";
        
        # 安全头
        add_header X-Content-Type-Options nosniff;
        add_header X-Frame-Options DENY;
    }
    
    # 限制文件大小
    client_max_body_size 100M;
}
```

#### 2.4 环境变量配置
在`.env`文件中添加：
```bash
# 本地存储配置
LOCAL_STORAGE_ROOT=/data/seekhub/storage
PUBLIC_URL_BASE=http://your-baidu-server.com/files
```

### 3. 嵌入前端翻译流程

#### 3.1 创建统一的翻译API接口
**新建文件**: `backend/src/api/translation_api.py`
```python
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
import asyncio
import uuid
from typing import Optional

app = FastAPI()

class TranslationRequest(BaseModel):
    file_id: str
    source_lang: str = "en"
    target_lang: str = "zh"
    preserve_format: bool = True

class TranslationStatus(BaseModel):
    job_id: str
    status: str  # pending, processing, completed, failed
    progress: float
    download_url: Optional[str]
    error: Optional[str]

@app.post("/api/upload")
async def upload_document(file: UploadFile = File(...)):
    """上传PDF文档"""
    try:
        # 生成文件ID
        file_id = str(uuid.uuid4())
        
        # 保存文件到临时目录
        temp_path = f"temp/{file_id}_{file.filename}"
        with open(temp_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        # 保存到本地存储
        storage = LocalFileStorage()
        url = storage.upload_file(temp_path, f"uploads/{file_id}/{file.filename}")
        
        return JSONResponse({
            "file_id": file_id,
            "filename": file.filename,
            "size": len(content),
            "url": url
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/translate")
async def start_translation(request: TranslationRequest):
    """启动翻译任务"""
    try:
        # 创建翻译任务
        from backend.run_full_translation import FullTranslationPipeline
        
        pipeline = FullTranslationPipeline()
        job_id = str(uuid.uuid4())
        
        # 异步执行翻译
        asyncio.create_task(
            pipeline.run_full_pipeline(
                pdf_path=f"temp/{request.file_id}",
                book_title=f"Document_{request.file_id}",
                output_dir=f"result/{job_id}"
            )
        )
        
        return JSONResponse({
            "job_id": job_id,
            "status": "processing",
            "message": "Translation started"
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/status/{job_id}")
async def get_translation_status(job_id: str):
    """获取翻译状态"""
    try:
        # 从Firestore获取状态
        from backend.src.core.firestore_helper import db_helper
        
        job_data = await db_helper.get_document_by_id("translation_jobs", job_id)
        
        if not job_data:
            raise HTTPException(status_code=404, detail="Job not found")
        
        return TranslationStatus(
            job_id=job_id,
            status=job_data.get("status", "unknown"),
            progress=job_data.get("progress", 0),
            download_url=job_data.get("download_url"),
            error=job_data.get("error")
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/download/{job_id}")
async def download_result(job_id: str):
    """下载翻译结果"""
    try:
        # 获取文件路径
        result_path = f"result/{job_id}/translated.docx"
        
        if not os.path.exists(result_path):
            raise HTTPException(status_code=404, detail="Result not found")
        
        return FileResponse(
            result_path,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            filename=f"translated_{job_id}.docx"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

#### 3.2 前端集成示例
```javascript
// 前端调用示例
class TranslationService {
    constructor() {
        this.baseUrl = 'http://localhost:8000/api';
    }
    
    // 上传文件
    async uploadFile(file) {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch(`${this.baseUrl}/upload`, {
            method: 'POST',
            body: formData
        });
        
        return await response.json();
    }
    
    // 开始翻译
    async startTranslation(fileId, options = {}) {
        const response = await fetch(`${this.baseUrl}/translate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                file_id: fileId,
                source_lang: options.sourceLang || 'en',
                target_lang: options.targetLang || 'zh',
                preserve_format: options.preserveFormat !== false
            })
        });
        
        return await response.json();
    }
    
    // 检查状态
    async checkStatus(jobId) {
        const response = await fetch(`${this.baseUrl}/status/${jobId}`);
        return await response.json();
    }
    
    // 下载结果
    async downloadResult(jobId) {
        window.open(`${this.baseUrl}/download/${jobId}`);
    }
}

// 使用示例
async function handleTranslation(file) {
    const service = new TranslationService();
    
    // 1. 上传文件
    const uploadResult = await service.uploadFile(file);
    console.log('File uploaded:', uploadResult.file_id);
    
    // 2. 开始翻译
    const translateResult = await service.startTranslation(uploadResult.file_id);
    console.log('Translation started:', translateResult.job_id);
    
    // 3. 轮询检查状态
    const checkProgress = setInterval(async () => {
        const status = await service.checkStatus(translateResult.job_id);
        console.log('Progress:', status.progress + '%');
        
        if (status.status === 'completed') {
            clearInterval(checkProgress);
            // 4. 下载结果
            await service.downloadResult(translateResult.job_id);
        } else if (status.status === 'failed') {
            clearInterval(checkProgress);
            console.error('Translation failed:', status.error);
        }
    }, 5000); // 每5秒检查一次
}
```

### 4. 与PDF_Translation_Implementation_Plan.md对比的缺失功能

根据对比分析，当前SeekHub_Demo-main系统还缺少以下关键功能：

#### 4.1 缺少完整的格式保留系统
**当前问题**: 系统将PDF转为纯文本进行翻译，丢失了所有格式信息

**需要添加的功能**:
1. **格式提取模块**
```python
# 新建: backend/src/core/format_extractor.py
class FormatExtractor:
    def extract_from_docx(self, docx_path):
        """提取DOCX文档的完整格式信息"""
        # 提取字体、大小、颜色、对齐、间距等
        # 提取表格、列表、图片位置等
        # 保存为结构化的格式元数据
        pass
```

2. **格式映射和重建**
```python
# 新建: backend/src/core/format_rebuilder.py
class FormatRebuilder:
    def apply_format_to_translation(self, translated_text, format_metadata):
        """将格式信息应用到翻译后的文本"""
        # 重建文档结构
        # 恢复所有格式样式
        # 确保100%格式一致性
        pass
```

#### 4.2 缺少任务优先级和队列管理
**当前问题**: 所有任务平等处理，无优先级概念

**需要添加的功能**:
1. 在Pub/Sub消息中添加优先级字段
2. 实现基于优先级的任务调度
3. 支持VIP用户的高优先级处理

#### 4.3 缺少完整的GraphQL API
**当前问题**: 只有基础的REST API，缺少GraphQL支持

**需要添加的功能**:
```python
# 新建: backend/src/api/graphql_schema.py
from graphene import ObjectType, String, Float, List, Field, Mutation

class TranslationJob(ObjectType):
    id = String()
    document_id = String()
    status = String()
    progress = Float()
    segments = List(String)
    created_at = String()
    completed_at = String()
    download_url = String()
    error = String()

class Query(ObjectType):
    translation_job = Field(TranslationJob, job_id=String())
    translation_jobs = List(TranslationJob, user_id=String())
    translation_history = List(TranslationJob, limit=Int())
    translation_statistics = Field(TranslationStats)

class StartTranslation(Mutation):
    class Arguments:
        document_id = String(required=True)
        source_lang = String()
        target_lang = String()
    
    job = Field(TranslationJob)
    
    def mutate(root, info, document_id, source_lang="en", target_lang="zh"):
        # 启动翻译逻辑
        pass

class Mutation(ObjectType):
    start_translation = StartTranslation.Field()
    cancel_translation = Field(Boolean, job_id=String())
    retry_translation = Field(TranslationJob, job_id=String())
```

#### 4.4 缺少本地队列系统选项
**当前问题**: 强依赖Google Pub/Sub，在中国可能有访问问题

**需要添加的功能**:
1. **基于PostgreSQL的队列**
```python
# 新建: backend/src/core/postgres_queue.py
class PostgreSQLQueue:
    """使用PostgreSQL作为消息队列"""
    def __init__(self):
        self.conn = psycopg2.connect(...)
    
    def publish(self, topic, message):
        # 插入任务到数据库
        pass
    
    def subscribe(self, topic, callback):
        # 轮询数据库获取任务
        pass
```

2. **基于Redis的队列**
```python
# 新建: backend/src/core/redis_queue.py
import redis
from rq import Queue

class RedisQueue:
    """使用Redis作为消息队列"""
    def __init__(self):
        self.redis = redis.Redis(...)
        self.queue = Queue(connection=self.redis)
    
    def publish(self, topic, message):
        self.queue.enqueue(process_task, message)
```

#### 4.5 缺少错误恢复和重试机制
**当前问题**: 简单的错误处理，没有完善的重试逻辑

**需要添加的功能**:
```python
# 增强: backend/src/core/error_handler.py
class EnhancedErrorHandler:
    def __init__(self):
        self.max_retries = 3
        self.retry_delays = [5, 15, 30]  # 递增延迟
    
    async def with_retry(self, func, *args, **kwargs):
        """带重试的函数执行"""
        for attempt in range(self.max_retries):
            try:
                return await func(*args, **kwargs)
            except Exception as e:
                if attempt < self.max_retries - 1:
                    await asyncio.sleep(self.retry_delays[attempt])
                else:
                    raise
```

#### 4.6 缺少实时进度推送
**当前问题**: 只能轮询查询进度，没有实时推送

**需要添加的功能**:
```python
# 新建: backend/src/api/websocket_handler.py
from fastapi import WebSocket

class TranslationWebSocket:
    def __init__(self):
        self.connections = {}
    
    async def connect(self, websocket: WebSocket, job_id: str):
        await websocket.accept()
        self.connections[job_id] = websocket
    
    async def send_progress(self, job_id: str, progress: float):
        if job_id in self.connections:
            await self.connections[job_id].send_json({
                "type": "progress",
                "progress": progress
            })
```

## 实施优先级

### 第一优先级（必须立即实施）
1. **OpenRouter集成** - 解决Gemini API在国内的访问问题
2. **本地存储系统** - 使用百度服务器本地存储替换Google Cloud Storage
3. **基础API接口** - 实现前端可调用的翻译接口

### 第二优先级（核心功能完善）
1. **完整格式保留系统** - 确保翻译后格式100%一致
2. **本地队列系统** - 提供Pub/Sub的替代方案
3. **错误恢复机制** - 提高系统稳定性

### 第三优先级（用户体验优化）
1. **GraphQL API** - 提供更灵活的数据查询
2. **实时进度推送** - WebSocket支持
3. **任务优先级管理** - VIP用户支持

## 部署建议

### 开发环境
```bash
# 1. 安装依赖
pip install -r requirements.txt
pip install openai

# 2. 配置环境变量
cp .env.example .env
# 编辑.env文件，填入OpenRouter密钥和本地存储路径

# 3. 创建存储目录
mkdir -p /data/seekhub/storage

# 4. 启动服务
# 启动翻译API
uvicorn backend.src.api.translation_api:app --reload --port 8000

# 启动Worker
python backend/start_workers.py
```

### 生产环境
```yaml
# docker-compose.yml
version: '3.8'
services:
  translation-api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - OPENROUTER_API_KEY=${OPENROUTER_API_KEY}
      - LOCAL_STORAGE_ROOT=/data/seekhub/storage
      - PUBLIC_URL_BASE=http://your-baidu-server.com/files
    volumes:
      - /data/seekhub/storage:/data/seekhub/storage
      - ./temp:/app/temp
      - ./result:/app/result
  
  worker:
    build: .
    command: python backend/start_workers.py
    environment:
      - OPENROUTER_API_KEY=${OPENROUTER_API_KEY}
      - LOCAL_STORAGE_ROOT=/data/seekhub/storage
      - PUBLIC_URL_BASE=http://your-baidu-server.com/files
    volumes:
      - /data/seekhub/storage:/data/seekhub/storage
    depends_on:
      - translation-api
  
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
      - /data/seekhub/storage:/data/seekhub/storage:ro
    depends_on:
      - translation-api
```

## 测试计划

### 功能测试
1. **OpenRouter连接测试**
```python
async def test_openrouter():
    client = OpenRouterClient()
    result = await client.translate("Hello world", "en", "zh")
    assert result is not None
```

2. **本地存储测试**
```python
async def test_local_storage():
    storage = LocalFileStorage()
    # 测试上传
    url = storage.upload_string("test content", "test.txt")
    assert url.startswith("http://")
    
    # 测试下载
    content = storage.download_string("test.txt")
    assert content == "test content"
    
    # 测试删除
    result = storage.delete_object("test.txt")
    assert result == True
```

3. **端到端翻译测试**
```python
async def test_full_translation():
    # 上传PDF
    # 启动翻译
    # 检查进度
    # 下载结果
    pass
```

### 性能测试
- 并发10个翻译任务
- 测试大文件（>50页）处理
- 测试网络中断恢复

### 兼容性测试
- 测试不同格式的PDF
- 测试中英文混合文档
- 测试包含表格、图片的文档

## 维护和监控

### 日志配置
```python
# backend/src/common/logger.py
import logging
from logging.handlers import RotatingFileHandler

def setup_logging():
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)
    
    # 文件日志
    file_handler = RotatingFileHandler(
        'logs/translation.log',
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5
    )
    
    # 格式化
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    file_handler.setFormatter(formatter)
    
    logger.addHandler(file_handler)
```

### 监控指标
1. **翻译任务监控**
   - 每日翻译量
   - 平均处理时间
   - 失败率

2. **API监控**
   - 请求量
   - 响应时间
   - 错误率

3. **资源监控**
   - CPU使用率
   - 内存使用
   - 磁盘空间

## 总结

本集成计划提供了将SeekHub_Demo-main系统改造为适合中国网络环境的完整方案。主要改造包括：

1. **OpenRouter集成** - 解决了Gemini API在国内的访问问题，无需VPN即可使用
2. **本地存储系统** - 使用百度服务器本地文件系统替换Google Cloud Storage，提高访问速度和数据安全性
3. **完整API接口** - 提供了前端可直接调用的RESTful API
4. **缺失功能补充** - 列出了与原计划相比缺少的所有功能

### 本地存储优势
- **性能优化**: 文件直接存储在服务器本地，无网络延迟
- **成本节约**: 无需支付云存储费用
- **数据安全**: 数据完全掌控在自己的服务器上
- **简化架构**: 减少外部依赖，降低系统复杂度

建议按照实施优先级逐步推进，先完成核心功能的改造，确保系统可用，再逐步完善其他功能。整个改造过程预计需要2-3周时间完成。
