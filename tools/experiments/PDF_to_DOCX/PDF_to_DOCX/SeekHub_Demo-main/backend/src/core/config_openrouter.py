"""
Configuration module for the translation system with OpenRouter support
改造版本：添加OpenRouter配置支持
"""
import os
from typing import List
from dotenv import load_dotenv

# Load environment variables from backend/.env
import pathlib
backend_dir = pathlib.Path(__file__).parent.parent.parent
env_path = backend_dir / '.env'
load_dotenv(env_path)

class Config:
    """Configuration class for the translation system with OpenRouter support"""
    
    # OpenRouter Configuration (优先使用)
    OPENROUTER_API_KEYS = os.getenv('OPENROUTER_API_KEYS', '').split(',')
    OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY', '')  # 单个密钥支持
    OPENROUTER_BASE_URL = os.getenv('OPENROUTER_BASE_URL', 'https://openrouter.ai/api/v1')
    OPENROUTER_MODEL = os.getenv('OPENROUTER_MODEL', 'google/gemini-pro')
    OPENROUTER_FALLBACK_MODEL = os.getenv('OPENROUTER_FALLBACK_MODEL', 'google/gemini-flash-1.5')
    
    # Google Cloud Configuration (保留兼容性)
    # Make credentials path absolute if it's relative
    cred_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS', 'seekhub-demo-9d255b940d24.json')
    if not os.path.isabs(cred_path):
        # If relative path, make it absolute relative to the backend directory
        backend_dir = pathlib.Path(__file__).parent.parent.parent
        cred_path = str(backend_dir.parent / cred_path)
    GOOGLE_APPLICATION_CREDENTIALS = cred_path
    FIRESTORE_PROJECT_ID = os.getenv('FIRESTORE_PROJECT_ID', 'seekhub-demo')
    FIRESTORE_DATABASE_ID = os.getenv('FIRESTORE_DATABASE_ID', '(default)')
    
    # Cloud Pub/Sub Configuration
    PUBSUB_PROJECT_ID = os.getenv('PUBSUB_PROJECT_ID', 'seekhub-demo')
    CHAPTER_TOPIC = os.getenv('CHAPTER_TOPIC', 'chapter-translation-topic')
    CHAPTER_SUBSCRIPTION = os.getenv('CHAPTER_SUBSCRIPTION', 'chapter-translation-subscription')
    COMBINATION_TOPIC = os.getenv('COMBINATION_TOPIC', 'combination-topic')
    COMBINATION_SUBSCRIPTION = os.getenv('COMBINATION_SUBSCRIPTION', 'combination-subscription')
    
    # Cloud Storage Configuration
    GCS_BUCKET_NAME = os.getenv('GCS_BUCKET_NAME', 'seekhub-demo-test1')
    
    # Local Storage Configuration (新增)
    LOCAL_STORAGE_ROOT = os.getenv('LOCAL_STORAGE_ROOT', '/data/seekhub/storage')
    PUBLIC_URL_BASE = os.getenv('PUBLIC_URL_BASE', 'http://localhost:8080/files')
    USE_LOCAL_STORAGE = os.getenv('USE_LOCAL_STORAGE', 'true').lower() == 'true'
    
    # Gemini API Configuration (保留兼容性)
    GEMINI_API_KEYS = os.getenv('GEMINI_API_KEYS', '').split(',')
    GEMINI_MODEL = os.getenv('GEMINI_MODEL', 'gemini-pro')
    
    # Translation Configuration
    MAX_RETRIES = int(os.getenv('MAX_RETRIES', '3'))
    RATE_LIMIT_DELAY = float(os.getenv('RATE_LIMIT_DELAY', '1.0'))
    BATCH_SIZE = int(os.getenv('BATCH_SIZE', '5'))
    
    # Worker Configuration - 高并发设置
    MAX_WORKERS = int(os.getenv('MAX_WORKERS', '20'))
    WORKER_TIMEOUT = int(os.getenv('WORKER_TIMEOUT', '300'))
    
    # High-Speed Optimization Settings
    MAX_CONCURRENT_REQUESTS = int(os.getenv('MAX_CONCURRENT_REQUESTS', '30'))
    CONNECTION_POOL_SIZE = int(os.getenv('CONNECTION_POOL_SIZE', '100'))
    
    @classmethod
    def get_openrouter_api_keys(cls) -> List[str]:
        """Get list of valid OpenRouter API keys"""
        keys = []
        
        # 首先检查多个密钥配置
        if cls.OPENROUTER_API_KEYS and cls.OPENROUTER_API_KEYS[0]:
            keys.extend([key.strip() for key in cls.OPENROUTER_API_KEYS if key.strip()])
        
        # 然后检查单个密钥配置
        if cls.OPENROUTER_API_KEY and cls.OPENROUTER_API_KEY.strip():
            keys.append(cls.OPENROUTER_API_KEY.strip())
        
        return list(set(keys))  # 去重
    
    @classmethod
    def get_gemini_api_keys(cls) -> List[str]:
        """Get list of valid Gemini API keys (for backward compatibility)"""
        return [key.strip() for key in cls.GEMINI_API_KEYS if key.strip()]
    
    @classmethod
    def is_openrouter_enabled(cls) -> bool:
        """Check if OpenRouter is configured and should be used"""
        return bool(cls.get_openrouter_api_keys())
    
    @classmethod
    def validate_config(cls) -> bool:
        """Validate configuration"""
        # 优先检查OpenRouter配置
        if cls.is_openrouter_enabled():
            print(f"✅ Using OpenRouter with {len(cls.get_openrouter_api_keys())} API key(s)")
            return True
        
        # 如果没有OpenRouter，检查Google Cloud配置
        if not os.path.exists(cls.GOOGLE_APPLICATION_CREDENTIALS):
            print(f"⚠️  Google Cloud credentials file not found: {cls.GOOGLE_APPLICATION_CREDENTIALS}")
            print("   Consider using OpenRouter for better accessibility in China")
        
        # Check for Gemini API keys
        if not cls.get_gemini_api_keys():
            print("⚠️  No Gemini API keys configured")
            print("   Consider using OpenRouter with OPENROUTER_API_KEY environment variable")
            return False
        
        return True
    
    @classmethod
    def get_translation_provider(cls) -> str:
        """Get the current translation provider"""
        if cls.is_openrouter_enabled():
            return "openrouter"
        elif cls.get_gemini_api_keys():
            return "gemini"
        else:
            return "mock"
    
    @classmethod
    def print_config_summary(cls):
        """Print configuration summary"""
        print("\n" + "="*60)
        print("📋 Configuration Summary")
        print("="*60)
        
        provider = cls.get_translation_provider()
        print(f"Translation Provider: {provider.upper()}")
        
        if provider == "openrouter":
            print(f"  - API Keys: {len(cls.get_openrouter_api_keys())}")
            print(f"  - Model: {cls.OPENROUTER_MODEL}")
            print(f"  - Fallback Model: {cls.OPENROUTER_FALLBACK_MODEL}")
            print(f"  - Base URL: {cls.OPENROUTER_BASE_URL}")
        elif provider == "gemini":
            print(f"  - API Keys: {len(cls.get_gemini_api_keys())}")
            print(f"  - Model: {cls.GEMINI_MODEL}")
        
        if cls.USE_LOCAL_STORAGE:
            print(f"\nStorage: LOCAL")
            print(f"  - Root: {cls.LOCAL_STORAGE_ROOT}")
            print(f"  - Public URL: {cls.PUBLIC_URL_BASE}")
        else:
            print(f"\nStorage: Google Cloud Storage")
            print(f"  - Bucket: {cls.GCS_BUCKET_NAME}")
        
        print(f"\nWorker Configuration:")
        print(f"  - Max Workers: {cls.MAX_WORKERS}")
        print(f"  - Max Concurrent Requests: {cls.MAX_CONCURRENT_REQUESTS}")
        print(f"  - Batch Size: {cls.BATCH_SIZE}")
        print("="*60 + "\n")

# Global config instance
config = Config()

# Print configuration summary on import (for debugging)
if __name__ == "__main__":
    config.print_config_summary()
