"""
Configuration module for the translation system
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
    """Configuration class for the translation system"""
    
    # Google Cloud Configuration
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
    
    # Gemini API Configuration
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
    def get_gemini_api_keys(cls) -> List[str]:
        """Get list of valid Gemini API keys"""
        return [key.strip() for key in cls.GEMINI_API_KEYS if key.strip()]
    
    @classmethod
    def validate_config(cls) -> bool:
        """Validate configuration"""
        # Check for Google Cloud credentials
        if not os.path.exists(cls.GOOGLE_APPLICATION_CREDENTIALS):
            raise ValueError(f"Google Cloud credentials file not found: {cls.GOOGLE_APPLICATION_CREDENTIALS}")
        
        # Check for Gemini API keys
        if not cls.get_gemini_api_keys():
            raise ValueError("No Gemini API keys configured")
        
        return True

# Global config instance
config = Config()
