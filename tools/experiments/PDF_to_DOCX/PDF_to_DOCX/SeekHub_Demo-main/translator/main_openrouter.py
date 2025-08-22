# translator/main_openrouter.py
# 改造版本：使用OpenRouter实现国内访问Gemini
import os
from fastapi import FastAPI, HTTPException, Response
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import re
from openai import AsyncOpenAI
import httpx
import logging

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ---------- CONFIG ----------
# OpenRouter模型配置
MODEL = "google/gemini-pro"  # 主要模型
FALLBACK_MODEL = "google/gemini-flash-1.5"  # 备用模型
MAX_CHARS = 120_000  # ~85k 英文tokens
MAX_TOKENS = 3900  # 稍低于Flash限制

# 系统提示词
SYSTEM = (
    "You are a professional translator.\n"
    "Translate the following English text into accurate, fluent Simplified Chinese.\n"
    "Return **ONLY** the Chinese translation—no other output."
)

# ---------- OPENROUTER CLIENT ----------
# 初始化OpenRouter客户端
openrouter_client = AsyncOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
    default_headers={
        "HTTP-Referer": os.getenv("APP_URL", "http://localhost:3000"),  # 您的站点URL
        "X-Title": "SeekHub Translation"  # 应用名称
    },
    http_client=httpx.AsyncClient(
        timeout=60.0,
        limits=httpx.Limits(max_keepalive_connections=100)
    )
)

# ---------- API ----------
app = FastAPI(title="SeekHub Translator with OpenRouter")

# CORS配置：支持所有localhost端口和*.vercel.app
origins_regex = re.compile(
    r"^https?://localhost(:\d+)?$|^https://[-a-z0-9]+\.vercel\.app$"
)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=origins_regex.pattern,
    allow_methods=["*"],  # 包括 OPTIONS
    allow_headers=["*"],
)

class TranslationRequest(BaseModel):
    text: str

class TranslationResponse(BaseModel):
    translation: str
    model_used: str = None
    tokens_used: int = None

# ---- 预检请求处理 ----
@app.options("/translate")
async def options_translate() -> Response:
    """处理CORS预检请求"""
    return Response(status_code=204)

# ---- 健康检查端点 ----
@app.get("/health")
async def health_check():
    """健康检查端点"""
    return {"status": "healthy", "service": "translator", "provider": "openrouter"}

# ---- 主翻译端点 ----
@app.post("/translate", response_model=TranslationResponse)
async def translate(req: TranslationRequest):
    """
    使用OpenRouter调用Gemini进行英译中翻译
    """
    # ---- 文本大小检查 ----
    if len(req.text) > MAX_CHARS:
        raise HTTPException(413, f"Text too large: {len(req.text)} chars > {MAX_CHARS} max")
    
    # 估算token数量（粗略估算：英文约4字符/token）
    estimated_tokens = len(req.text) // 4
    if estimated_tokens > MAX_TOKENS:
        raise HTTPException(
            413,
            f"Text too large for single request "
            f"(estimated {estimated_tokens} tokens > {MAX_TOKENS})"
        )
    
    # ---- 准备消息 ----
    messages = [
        {"role": "system", "content": SYSTEM},
        {"role": "user", "content": req.text}
    ]
    
    # ---- 使用OpenRouter进行翻译（带重试机制）----
    model_used = MODEL
    translation = None
    tokens_used = None
    
    try:
        logger.info(f"Attempting translation with {MODEL}")
        response = await openrouter_client.chat.completions.create(
            model=MODEL,
            messages=messages,
            temperature=0.3,  # 较低的温度以获得更一致的翻译
            max_tokens=4000,
            top_p=0.9,
            frequency_penalty=0.0,
            presence_penalty=0.0
        )
        
        translation = response.choices[0].message.content.strip()
        tokens_used = response.usage.total_tokens if response.usage else None
        
    except Exception as e:
        logger.warning(f"Primary model {MODEL} failed: {str(e)}")
        
        # 尝试使用备用模型
        try:
            logger.info(f"Attempting translation with fallback {FALLBACK_MODEL}")
            model_used = FALLBACK_MODEL
            
            response = await openrouter_client.chat.completions.create(
                model=FALLBACK_MODEL,
                messages=messages,
                temperature=0.3,
                max_tokens=4000,
                top_p=0.9
            )
            
            translation = response.choices[0].message.content.strip()
            tokens_used = response.usage.total_tokens if response.usage else None
            
        except Exception as fallback_error:
            logger.error(f"Both models failed: {str(fallback_error)}")
            raise HTTPException(
                500,
                f"Translation failed with both models. "
                f"Please check your OpenRouter API key and credits. "
                f"Error: {str(fallback_error)}"
            )
    
    # 返回翻译结果
    return TranslationResponse(
        translation=translation,
        model_used=model_used,
        tokens_used=tokens_used
    )

# ---- 流式翻译端点（可选）----
@app.post("/translate/stream")
async def translate_stream(req: TranslationRequest):
    """
    流式翻译端点，实时返回翻译结果
    """
    from fastapi.responses import StreamingResponse
    import json
    
    # 文本大小检查
    if len(req.text) > MAX_CHARS:
        raise HTTPException(413, f"Text too large: {len(req.text)} chars > {MAX_CHARS} max")
    
    async def generate():
        messages = [
            {"role": "system", "content": SYSTEM},
            {"role": "user", "content": req.text}
        ]
        
        try:
            stream = await openrouter_client.chat.completions.create(
                model=MODEL,
                messages=messages,
                temperature=0.3,
                max_tokens=4000,
                stream=True
            )
            
            async for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield f"data: {json.dumps({'content': chunk.choices[0].delta.content})}\n\n"
            
            yield f"data: {json.dumps({'done': True})}\n\n"
            
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )

# ---- 批量翻译端点（可选）----
@app.post("/translate/batch")
async def translate_batch(texts: list[str]):
    """
    批量翻译多个文本
    """
    if len(texts) > 10:
        raise HTTPException(400, "Maximum 10 texts per batch")
    
    results = []
    for text in texts:
        try:
            req = TranslationRequest(text=text)
            result = await translate(req)
            results.append({
                "success": True,
                "translation": result.translation,
                "model_used": result.model_used
            })
        except Exception as e:
            results.append({
                "success": False,
                "error": str(e)
            })
    
    return {"results": results}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
