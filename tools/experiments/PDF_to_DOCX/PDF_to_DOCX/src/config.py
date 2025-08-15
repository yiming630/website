"""
配置文件 - 管理API密钥和其他配置参数
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 文件路径配置（需要先定义BASE_DIR）
BASE_DIR = Path(__file__).parent.parent

# API配置
# 注意：这里直接使用用户提供的凭证，生产环境应该使用环境变量
WPS_API_KEY = 'vLycqJTZoNDDDLuIOAzXEZSNgckvXPaC'
WPS_APP_ID = 'SX20250704GGUSEK'
WPS_ENDPOINT = 'https://solution.wps.cn'

# Google Cloud 配置
GOOGLE_APPLICATION_CREDENTIALS = os.getenv('GOOGLE_APPLICATION_CREDENTIALS', str(BASE_DIR.parent / 'seekhub-demo-9d255b940d24.json'))
GOOGLE_CLOUD_PROJECT = os.getenv('GOOGLE_CLOUD_PROJECT', 'seekhub-demo')
GCS_BUCKET_NAME = os.getenv('GCS_BUCKET_NAME', 'run-sources-seekhub-demo-asia-east1')

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')
GEMINI_MODEL = os.getenv('GEMINI_MODEL', 'gemini-pro')

# 并发配置 - 与backend保持一致的高并发设置
MAX_WORKERS = int(os.getenv('MAX_WORKERS', '20'))  # 提高并发数以匹配backend
RETRY_TIMES = int(os.getenv('RETRY_TIMES', '3'))
RETRY_DELAY = int(os.getenv('RETRY_DELAY', '5'))
DATA_DIR = BASE_DIR / 'data'
PDF_DIR = DATA_DIR / 'pdf'
DOCX_RAW_DIR = DATA_DIR / 'docx_raw'
DOCX_SPLIT_DIR = DATA_DIR / 'docx_split'
LOGS_DIR = BASE_DIR / 'logs'

# 确保目录存在
for dir_path in [PDF_DIR, DOCX_RAW_DIR, DOCX_SPLIT_DIR, LOGS_DIR]:
    dir_path.mkdir(parents=True, exist_ok=True)

# 分割配置
SPLIT_MAX_TOKENS = int(os.getenv('SPLIT_MAX_TOKENS', '2048'))
SPLIT_OVERLAP_TOKENS = int(os.getenv('SPLIT_OVERLAP_TOKENS', '200'))

# 日志配置
LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
LOG_FILE = LOGS_DIR / 'app.log'
ERROR_LOG_FILE = LOGS_DIR / 'error.log' 