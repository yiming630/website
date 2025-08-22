"""
PDF2Docx系统配置文件
整合了多个子系统的配置：
- PDF转换配置
- 翻译服务配置
- 云存储配置
- 系统监控配置
"""

import os
from pathlib import Path
from dotenv import load_dotenv
from typing import List, Optional
from dataclasses import dataclass

# 加载环境变量
load_dotenv()

# 基础路径配置
BASE_DIR = Path(__file__).parent.parent
PROJECT_ROOT = BASE_DIR.parent.parent

@dataclass
class WPSConfig:
    """WPS API配置"""
    api_key: str = 'vLycqJTZoNDDDLuIOAzXEZSNgckvXPaC'
    app_id: str = 'SX20250704GGUSEK'
    endpoint: str = 'https://solution.wps.cn'
    timeout: int = 300

@dataclass
class GeminiConfig:
    """Gemini API配置"""
    api_key: str = os.getenv('GEMINI_API_KEY', '')
    model: str = os.getenv('GEMINI_MODEL', 'gemini-2.0-flash-001')
    fallback_model: str = 'gemini-1.5-flash'
    max_tokens: int = 4096
    temperature: float = 0.3

@dataclass 
class GoogleCloudConfig:
    """Google Cloud配置"""
    project_id: str = os.getenv('GOOGLE_CLOUD_PROJECT', 'seekhub-demo')
    credentials_path: str = os.getenv('GOOGLE_APPLICATION_CREDENTIALS', 
                                    str(BASE_DIR / 'credentials' / 'seekhub-demo-9d255b940d24.json'))
    bucket_name: str = os.getenv('GCS_BUCKET_NAME', 'run-sources-seekhub-demo-asia-east1')
    firestore_database_id: str = os.getenv('FIRESTORE_DATABASE_ID', '(default)')

@dataclass
class WorkerConfig:
    """工作器配置"""
    max_workers: int = int(os.getenv('MAX_WORKERS', '20'))
    worker_timeout: int = int(os.getenv('WORKER_TIMEOUT', '300'))
    max_concurrent_requests: int = int(os.getenv('MAX_CONCURRENT_REQUESTS', '30'))
    connection_pool_size: int = int(os.getenv('CONNECTION_POOL_SIZE', '100'))

@dataclass
class ProcessingConfig:
    """处理配置"""
    retry_times: int = int(os.getenv('RETRY_TIMES', '3'))
    retry_delay: int = int(os.getenv('RETRY_DELAY', '5'))
    split_max_tokens: int = int(os.getenv('SPLIT_MAX_TOKENS', '2048'))
    split_overlap_tokens: int = int(os.getenv('SPLIT_OVERLAP_TOKENS', '200'))
    batch_size: int = int(os.getenv('BATCH_SIZE', '5'))

@dataclass
class PathConfig:
    """路径配置"""
    base_dir: Path = BASE_DIR
    data_dir: Path = BASE_DIR / 'data'
    pdf_dir: Path = data_dir / 'pdf'
    docx_raw_dir: Path = data_dir / 'docx_raw'
    docx_split_dir: Path = data_dir / 'docx_split'
    docx_translated_dir: Path = data_dir / 'docx_translated'
    logs_dir: Path = BASE_DIR / 'logs'
    temp_dir: Path = data_dir / 'temp'
    
    def __post_init__(self):
        """确保所有目录存在"""
        for dir_path in [self.data_dir, self.pdf_dir, self.docx_raw_dir, 
                        self.docx_split_dir, self.docx_translated_dir, 
                        self.logs_dir, self.temp_dir]:
            dir_path.mkdir(parents=True, exist_ok=True)

@dataclass
class LogConfig:
    """日志配置"""
    log_level: str = os.getenv('LOG_LEVEL', 'INFO')
    log_file: Path = BASE_DIR / 'logs' / 'pdf2docx.log'
    error_log_file: Path = BASE_DIR / 'logs' / 'error.log'
    max_log_size: int = 10 * 1024 * 1024  # 10MB
    backup_count: int = 5

@dataclass
class TranslationConfig:
    """翻译配置"""
    source_language: str = 'en'
    target_language: str = 'zh'
    max_chars: int = 120_000
    max_tokens: int = 3900
    rate_limit_delay: float = 1.0

class PDF2DocxConfig:
    """PDF2Docx系统主配置类"""
    
    def __init__(self):
        self.wps = WPSConfig()
        self.gemini = GeminiConfig()
        self.google_cloud = GoogleCloudConfig()
        self.worker = WorkerConfig()
        self.processing = ProcessingConfig()
        self.paths = PathConfig()
        self.log = LogConfig()
        self.translation = TranslationConfig()
        
        # 验证配置
        self._validate_config()
    
    def _validate_config(self):
        """验证配置（非严格模式用于测试）"""
        # 只在生产环境进行严格验证
        if os.getenv('PDF2DOCX_STRICT_VALIDATION', 'false').lower() == 'true':
            # 检查必要的API密钥
            if not self.gemini.api_key:
                raise ValueError("GEMINI_API_KEY environment variable is required")
            
            # 检查Google Cloud凭证文件
            if not os.path.exists(self.google_cloud.credentials_path):
                raise ValueError(f"Google Cloud credentials file not found: {self.google_cloud.credentials_path}")
            
            # 检查WPS API配置
            if not self.wps.api_key or not self.wps.app_id:
                raise ValueError("WPS API configuration is incomplete")
        else:
            # 测试模式：只记录警告
            if not self.gemini.api_key:
                print("⚠️ GEMINI_API_KEY environment variable not set")
            
            if not os.path.exists(self.google_cloud.credentials_path):
                print(f"⚠️ Google Cloud credentials file not found: {self.google_cloud.credentials_path}")
            
            if not self.wps.api_key or not self.wps.app_id:
                print("⚠️ WPS API configuration incomplete")
    
    def get_gemini_api_keys(self) -> List[str]:
        """获取Gemini API密钥列表"""
        keys = os.getenv('GEMINI_API_KEYS', self.gemini.api_key).split(',')
        return [key.strip() for key in keys if key.strip()]
    
    def to_dict(self) -> dict:
        """转换为字典格式"""
        return {
            'wps': self.wps.__dict__,
            'gemini': self.gemini.__dict__, 
            'google_cloud': self.google_cloud.__dict__,
            'worker': self.worker.__dict__,
            'processing': self.processing.__dict__,
            'paths': {k: str(v) for k, v in self.paths.__dict__.items()},
            'log': {k: str(v) if isinstance(v, Path) else v for k, v in self.log.__dict__.items()},
            'translation': self.translation.__dict__
        }

# 全局配置实例
pdf2docx_config = PDF2DocxConfig() 