"""
OpenRouter Gemini API Client with optimized API key pool management and high-speed processing
改造版本：使用OpenRouter实现国内访问Gemini
"""
import asyncio
import random
import time
import logging
import aiohttp
from typing import List, Optional, Dict, Any, AsyncIterator, Callable
from dataclasses import dataclass
from openai import AsyncOpenAI
import httpx
from .config import config
from functools import lru_cache
from datetime import datetime, timezone
from cachetools import TTLCache

@dataclass
class APIKeyStatus:
    """Track API key usage and rate limits with advanced metrics"""
    key: str
    last_used: float = 0
    request_count: int = 0
    success_count: int = 0
    error_count: int = 0
    is_active: bool = True
    avg_response_time: float = 0
    total_response_time: float = 0

class RateLimiter:
    """Rate limiter for API requests"""
    
    def __init__(self, requests_per_minute: int = 60, requests_per_second: int = 2):
        self.requests_per_minute = requests_per_minute
        self.requests_per_second = requests_per_second
        self.minute_requests = []
        self.second_requests = []
        self.lock = asyncio.Lock()
    
    async def acquire(self):
        """Acquire permission to make a request"""
        async with self.lock:
            current_time = time.time()
            
            # Clean old requests
            self.minute_requests = [t for t in self.minute_requests if current_time - t < 60]
            self.second_requests = [t for t in self.second_requests if current_time - t < 1]
            
            # Check limits
            if len(self.minute_requests) >= self.requests_per_minute:
                await asyncio.sleep(1)
                return await self.acquire()
            
            if len(self.second_requests) >= self.requests_per_second:
                await asyncio.sleep(1)
                return await self.acquire()
            
            # Record request
            self.minute_requests.append(current_time)
            self.second_requests.append(current_time)

class OptimizedOpenRouterAPIPool:
    """Advanced API key pool with intelligent load balancing and health monitoring for OpenRouter"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.api_keys = []
        self.current_key_index = 0
        self.lock = asyncio.Lock()
        self._initialize_keys()
        self.concurrent_requests = 0
        self.max_concurrent_per_key = 8  # 每个API key的并发数
    
    def _initialize_keys(self):
        """Initialize API keys pool with health monitoring"""
        # 尝试获取OpenRouter API密钥
        keys = config.get_openrouter_api_keys() if hasattr(config, 'get_openrouter_api_keys') else []
        
        # 如果没有OpenRouter密钥，尝试使用环境变量
        if not keys:
            import os
            openrouter_key = os.getenv("OPENROUTER_API_KEY")
            if openrouter_key:
                keys = [openrouter_key]
        
        if not keys:
            raise ValueError("No OpenRouter API keys configured")
        
        for key in keys:
            self.api_keys.append(APIKeyStatus(key=key))
        
        self.logger.info(f"Initialized OpenRouter API pool with {len(self.api_keys)} keys")
    
    async def get_best_key(self) -> APIKeyStatus:
        """Get the best performing available API key"""
        async with self.lock:
            current_time = time.time()
            
            # Filter active keys that are not rate limited
            available_keys = [
                key for key in self.api_keys 
                if (key.is_active and 
                    current_time - key.last_used >= 0.1 and  # OpenRouter has better rate limits
                    self._get_key_concurrent_requests(key.key) < self.max_concurrent_per_key)
            ]
            
            if not available_keys:
                # Wait for the next available key
                await asyncio.sleep(0.1)
                available_keys = [key for key in self.api_keys if key.is_active]
                if not available_keys:
                    raise ValueError("No active API keys available")
            
            # Select best key based on performance metrics
            best_key = min(available_keys, key=lambda k: (
                k.error_count / max(k.request_count, 1),  # Error rate
                k.avg_response_time,  # Response time
                k.request_count  # Load balancing
            ))
            
            best_key.last_used = current_time
            best_key.request_count += 1
            self.concurrent_requests += 1
            
            return best_key
    
    def _get_key_concurrent_requests(self, key: str) -> int:
        """Get current concurrent requests for a specific key"""
        # Simplified estimation
        return 0
    
    async def record_success(self, key: str, response_time: float):
        """Record successful API call with metrics"""
        async with self.lock:
            for key_status in self.api_keys:
                if key_status.key == key:
                    key_status.success_count += 1
                    key_status.total_response_time += response_time
                    key_status.avg_response_time = key_status.total_response_time / key_status.success_count
                    break
            self.concurrent_requests = max(0, self.concurrent_requests - 1)
    
    async def record_error(self, key: str):
        """Record API error with exponential backoff"""
        async with self.lock:
            for key_status in self.api_keys:
                if key_status.key == key:
                    key_status.error_count += 1
                    # Implement exponential backoff
                    if key_status.error_count >= 5:
                        key_status.is_active = False
                        self.logger.warning(f"Deactivated API key due to errors: {key[:10]}...")
                        # Schedule reactivation after cooldown
                        asyncio.create_task(self._reactivate_key_after_cooldown(key_status))
                    break
            self.concurrent_requests = max(0, self.concurrent_requests - 1)
    
    async def _reactivate_key_after_cooldown(self, key_status: APIKeyStatus):
        """Reactivate key after cooldown period"""
        cooldown_time = min(300, 60 * (2 ** (key_status.error_count - 5)))  # Max 5 minutes
        await asyncio.sleep(cooldown_time)
        key_status.is_active = True
        key_status.error_count = max(0, key_status.error_count - 2)  # Reduce error count
        self.logger.info(f"Reactivated API key: {key_status.key[:10]}...")

class HighSpeedOpenRouterTranslator:
    """High-performance OpenRouter translator with batch processing and concurrent requests"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.api_pool = OptimizedOpenRouterAPIPool()
        self.max_concurrent_requests = 30  # 高并发请求数
        self.semaphore = asyncio.Semaphore(self.max_concurrent_requests)
        
        # OpenRouter模型配置
        import os
        self.model = os.getenv("OPENROUTER_MODEL", "google/gemini-pro")
        self.fallback_model = os.getenv("OPENROUTER_FALLBACK_MODEL", "google/gemini-flash-1.5")
        self.base_url = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
        
        # Rate limiting
        self.rate_limiter = RateLimiter(
            requests_per_minute=60,
            requests_per_second=2
        )
        
        # Translation cache
        self.translation_cache = TTLCache(maxsize=1000, ttl=3600)
        
        # HTTP client for OpenRouter
        self.http_client = None
    
    def _get_client(self, api_key: str) -> AsyncOpenAI:
        """Get OpenRouter client with specific API key"""
        if not self.http_client:
            self.http_client = httpx.AsyncClient(
                timeout=60.0,
                limits=httpx.Limits(max_keepalive_connections=100)
            )
        
        return AsyncOpenAI(
            base_url=self.base_url,
            api_key=api_key,
            http_client=self.http_client,
            default_headers={
                "HTTP-Referer": "http://localhost:3000",  # 您的站点URL
                "X-Title": "SeekHub Translation"
            }
        )
    
    async def translate_text(self, text: str, source_lang: str = "en", 
                           target_lang: str = "zh") -> Optional[str]:
        """
        High-speed text translation with retry logic using OpenRouter
        
        Args:
            text (str): Text to translate
            source_lang (str): Source language code
            target_lang (str): Target language code
            
        Returns:
            str: Translated text or None if failed
        """
        async with self.semaphore:
            return await self._translate_with_retry(text, source_lang, target_lang)
    
    async def _translate_with_retry(self, text: str, source_lang: str, 
                                  target_lang: str, max_retries: int = 3) -> Optional[str]:
        """Internal translation method with retry logic"""
        
        # Check cache first
        cache_key = f"{text[:100]}:{source_lang}:{target_lang}"
        if cache_key in self.translation_cache:
            return self.translation_cache[cache_key]
        
        # Map language codes to full names for better prompt
        lang_map = {
            "en": "English",
            "zh": "Chinese",
            "es": "Spanish",
            "fr": "French",
            "de": "German",
            "ja": "Japanese",
            "ko": "Korean"
        }
        
        source_lang_full = lang_map.get(source_lang, source_lang)
        target_lang_full = lang_map.get(target_lang, target_lang)
        
        messages = [
            {
                "role": "system",
                "content": f"You are a professional translator. Translate from {source_lang_full} to {target_lang_full}. "
                          f"Maintain the original formatting, style, and meaning. "
                          f"Only return the translated text without any additional comments or explanations."
            },
            {
                "role": "user",
                "content": text
            }
        ]
        
        for attempt in range(max_retries):
            try:
                start_time = time.time()
                key_status = await self.api_pool.get_best_key()
                client = self._get_client(key_status.key)
                
                # Try primary model first
                try:
                    response = await client.chat.completions.create(
                        model=self.model,
                        messages=messages,
                        temperature=0.3,
                        max_tokens=4000,
                        top_p=0.9
                    )
                except Exception as model_error:
                    # Fallback to secondary model
                    self.logger.warning(f"Primary model failed, trying fallback: {model_error}")
                    response = await client.chat.completions.create(
                        model=self.fallback_model,
                        messages=messages,
                        temperature=0.3,
                        max_tokens=4000,
                        top_p=0.9
                    )
                
                if response and response.choices and response.choices[0].message.content:
                    response_time = time.time() - start_time
                    await self.api_pool.record_success(key_status.key, response_time)
                    
                    translated_text = response.choices[0].message.content.strip()
                    # Cache the result
                    self.translation_cache[cache_key] = translated_text
                    return translated_text
                
            except Exception as e:
                await self.api_pool.record_error(key_status.key)
                self.logger.warning(f"Translation attempt {attempt + 1} failed: {e}")
                
                if attempt == max_retries - 1:
                    self.logger.error(f"All translation attempts failed for text: {text[:100]}...")
                    return None
                
                # Exponential backoff
                await asyncio.sleep(2 ** attempt)
        
        return None
    
    async def translate_batch(self, texts: List[str], source_lang: str = "en", 
                            target_lang: str = "zh") -> List[Optional[str]]:
        """
        High-speed batch translation processing
        
        Args:
            texts (list): List of texts to translate
            source_lang (str): Source language code
            target_lang (str): Target language code
            
        Returns:
            list: List of translated texts (or None for failures)
        """
        tasks = [
            self.translate_text(text, source_lang, target_lang) 
            for text in texts
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Handle exceptions in results
        processed_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                self.logger.error(f"Batch translation failed for item {i}: {result}")
                processed_results.append(None)
            else:
                processed_results.append(result)
        
        return processed_results
    
    async def translate_chapter(self, chapter_text: str, chapter_index: int) -> Dict[str, Any]:
        """
        Translate a single chapter with metadata
        
        Args:
            chapter_text (str): Chapter content to translate
            chapter_index (int): Chapter index
            
        Returns:
            dict: Translation result with metadata
        """
        start_time = time.time()
        translated_text = await self.translate_text(chapter_text)
        processing_time = time.time() - start_time
        
        return {
            'chapter_index': chapter_index,
            'original_text': chapter_text,
            'translated_text': translated_text,
            'success': translated_text is not None,
            'processing_time': processing_time,
            'timestamp': time.time(),
            'word_count': len(chapter_text.split()),
            'character_count': len(chapter_text)
        }
    
    async def translate_text_stream(self, text: str, source_lang: str = "en", 
                                  target_lang: str = "zh") -> AsyncIterator[str]:
        """
        使用OpenRouter进行流式翻译
        
        Args:
            text (str): Text to translate
            source_lang (str): Source language code
            target_lang (str): Target language code
            
        Yields:
            str: Translated text chunks
        """
        # Check cache first
        cache_key = f"{text[:100]}:{source_lang}:{target_lang}"
        if cache_key in self.translation_cache:
            yield self.translation_cache[cache_key]
            return
        
        # Map language codes to full names
        lang_map = {
            "en": "English",
            "zh": "Chinese",
            "es": "Spanish",
            "fr": "French",
            "de": "German",
            "ja": "Japanese",
            "ko": "Korean"
        }
        
        source_lang_full = lang_map.get(source_lang, source_lang)
        target_lang_full = lang_map.get(target_lang, target_lang)
        
        messages = [
            {
                "role": "system",
                "content": f"Translate from {source_lang_full} to {target_lang_full}. "
                          f"Maintain the original meaning, tone, and style. "
                          f"Only provide the translation without any explanations."
            },
            {
                "role": "user",
                "content": text
            }
        ]
        
        await self.rate_limiter.acquire()
        
        async with self.semaphore:
            try:
                key_status = await self.api_pool.get_best_key()
                client = self._get_client(key_status.key)
                
                # Create streaming response
                stream = await client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    stream=True,
                    temperature=0.3,
                    max_tokens=4000
                )
                
                full_translation = []
                async for chunk in stream:
                    if chunk.choices[0].delta.content:
                        content = chunk.choices[0].delta.content
                        full_translation.append(content)
                        yield content
                
                # Cache the complete translation
                complete_text = "".join(full_translation)
                if complete_text:
                    self.translation_cache[cache_key] = complete_text
                    await self.api_pool.record_success(key_status.key, 1.0)
                else:
                    await self.api_pool.record_error(key_status.key)
                    
            except Exception as e:
                self.logger.error(f"Translation stream error: {e}")
                await self.api_pool.record_error(key_status.key)
                yield ""
    
    async def translate_chapter_stream(self, chapter_text: str, 
                                     chapter_index: int,
                                     callback: Optional[Callable[[str, float], None]] = None) -> dict:
        """
        Translate a chapter with streaming and progress callback
        
        Args:
            chapter_text (str): Chapter content to translate
            chapter_index (int): Chapter index
            callback (callable): Optional callback(translated_chunk, progress_percentage)
            
        Returns:
            dict: Translation result with metadata
        """
        start_time = time.time()
        self.logger.info(f"Starting streaming translation for chapter {chapter_index}")
        
        try:
            translated_chunks = []
            total_chars = len(chapter_text)
            chars_processed = 0
            
            async for chunk in self.translate_text_stream(chapter_text):
                translated_chunks.append(chunk)
                chars_processed += len(chunk)
                
                # Call progress callback if provided
                if callback:
                    progress = min(chars_processed / total_chars * 100, 100)
                    if asyncio.iscoroutinefunction(callback):
                        await callback(chunk, progress)
                    else:
                        callback(chunk, progress)
            
            translated_text = "".join(translated_chunks)
            
            translation_time = time.time() - start_time
            self.logger.info(f"Chapter {chapter_index} translated in {translation_time:.2f}s (streaming)")
            
            return {
                'chapter_index': chapter_index,
                'original_text': chapter_text,
                'translated_text': translated_text,
                'success': bool(translated_text),
                'translation_time': translation_time,
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'streaming': True,
                'provider': 'openrouter'
            }
            
        except Exception as e:
            self.logger.error(f"Error translating chapter {chapter_index}: {e}")
            return {
                'chapter_index': chapter_index,
                'original_text': chapter_text,
                'translated_text': '',
                'success': False,
                'error': str(e),
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'streaming': True,
                'provider': 'openrouter'
            }
    
    async def close(self):
        """Close the HTTP client"""
        if self.http_client:
            await self.http_client.aclose()
            self.http_client = None

# Mock translator for testing without API keys
class MockGeminiTranslator:
    """Mock translator that simulates translation for testing"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    async def translate_text(self, text: str, source_lang: str = "en", 
                           target_lang: str = "zh") -> Optional[str]:
        """Mock translation with simulated delay"""
        await asyncio.sleep(0.1)  # Reduced delay for faster testing
        return f"[MOCK {source_lang}->{target_lang}] {text}"
    
    async def translate_batch(self, texts: List[str], source_lang: str = "en", 
                            target_lang: str = "zh") -> List[Optional[str]]:
        """Mock batch translation"""
        return [await self.translate_text(text, source_lang, target_lang) for text in texts]
    
    async def translate_chapter(self, chapter_text: str, chapter_index: int) -> Dict[str, Any]:
        """Mock chapter translation"""
        start_time = time.time()
        translated_text = await self.translate_text(chapter_text)
        processing_time = time.time() - start_time
        
        return {
            'chapter_index': chapter_index,
            'original_text': chapter_text,
            'translated_text': translated_text,
            'success': True,
            'processing_time': processing_time,
            'timestamp': time.time(),
            'word_count': len(chapter_text.split()),
            'character_count': len(chapter_text)
        }
    
    async def translate_text_stream(self, text: str, source_lang: str = "en", 
                                  target_lang: str = "zh") -> AsyncIterator[str]:
        """Mock streaming translation"""
        await asyncio.sleep(0.1)
        yield f"[MOCK {source_lang}->{target_lang}] {text}"
    
    async def translate_chapter_stream(self, chapter_text: str, 
                                     chapter_index: int,
                                     callback: Optional[Callable[[str, float], None]] = None) -> dict:
        """Mock chapter streaming translation"""
        start_time = time.time()
        translated_text = f"[MOCK] {chapter_text}"
        
        if callback:
            if asyncio.iscoroutinefunction(callback):
                await callback(translated_text, 100.0)
            else:
                callback(translated_text, 100.0)
        
        return {
            'chapter_index': chapter_index,
            'original_text': chapter_text,
            'translated_text': translated_text,
            'success': True,
            'translation_time': time.time() - start_time,
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'streaming': True
        }
    
    async def close(self):
        """Mock close method"""
        pass

# Create global translator instance based on available API keys
def create_translator():
    """Factory function to create appropriate translator instance"""
    import os
    
    # Check for OpenRouter API key
    if os.getenv("OPENROUTER_API_KEY"):
        try:
            return HighSpeedOpenRouterTranslator()
        except Exception as e:
            logging.getLogger(__name__).warning(f"Failed to initialize OpenRouter translator: {e}, using mock translator")
            return MockGeminiTranslator()
    else:
        logging.getLogger(__name__).info("No OpenRouter API key found, using mock translator")
        return MockGeminiTranslator()

# Create global translator instance
translator = create_translator()

# Export translator instance and classes
__all__ = ["HighSpeedOpenRouterTranslator", "MockGeminiTranslator", "translator", "RateLimiter"]
