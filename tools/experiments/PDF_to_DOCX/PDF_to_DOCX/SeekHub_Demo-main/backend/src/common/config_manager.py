"""
统一配置管理模块
支持环境变量、配置文件、默认值等多种配置来源
"""

import os
import json
from typing import Any, Dict, Optional, Union
from pathlib import Path
from dataclasses import dataclass, field


@dataclass
class DatabaseConfig:
    """数据库配置"""
    project_id: str = "seekhub-demo"
    database_id: str = "(default)"
    credentials_path: str = "seekhub-demo-9d255b940d24.json"


@dataclass 
class PubSubConfig:
    """消息队列配置"""
    project_id: str = "seekhub-demo"
    chapter_topic: str = "chapter-translation-topic"
    chapter_subscription: str = "chapter-translation-subscription"
    combination_topic: str = "combination-topic"
    combination_subscription: str = "combination-subscription"


@dataclass
class StorageConfig:
    """存储配置"""
    bucket_name: str = "seekhub-demo-test1"


@dataclass
class GeminiConfig:
    """Gemini API配置"""
    api_keys: list = field(default_factory=list)
    model: str = "gemini-pro"
    max_retries: int = 3
    rate_limit_delay: float = 1.0


@dataclass
class WorkerConfig:
    """工作器配置"""
    max_workers: int = 20
    worker_timeout: int = 300
    max_concurrent_requests: int = 30
    connection_pool_size: int = 100
    batch_size: int = 5


@dataclass
class MonitoringConfig:
    """监控配置"""
    monitoring_interval: int = 5
    health_check_interval: int = 30
    log_level: str = "INFO"
    log_file: str = "logs/translation_system.log"


@dataclass
class ProcessConfig:
    """进程配置"""
    worker_restart_delay: int = 10
    max_worker_restarts: int = 5
    process_timeout: int = 600


@dataclass
class AlertConfig:
    """告警配置"""
    alert_email: str = "admin@example.com"
    alert_threshold_error_rate: float = 0.1
    alert_threshold_memory_usage: float = 0.8
    alert_threshold_cpu_usage: float = 0.8


class ConfigManager:
    """统一配置管理器"""
    
    def __init__(self, config_file: Optional[str] = None):
        self.config_file = config_file
        self._config_data = {}
        self.load_config()
    
    def load_config(self):
        """加载配置"""
        # 1. 加载默认配置
        self._load_defaults()
        
        # 2. 加载配置文件（如果存在）
        if self.config_file and Path(self.config_file).exists():
            self._load_config_file()
        
        # 3. 加载环境变量（优先级最高）
        self._load_environment_variables()
    
    def _load_defaults(self):
        """加载默认配置"""
        self._config_data = {
            'database': DatabaseConfig(),
            'pubsub': PubSubConfig(), 
            'storage': StorageConfig(),
            'gemini': GeminiConfig(),
            'worker': WorkerConfig(),
            'monitoring': MonitoringConfig(),
            'process': ProcessConfig(),
            'alert': AlertConfig()
        }
    
    def _load_config_file(self):
        """从配置文件加载"""
        if not self.config_file:
            return
        try:
            with open(self.config_file, 'r', encoding='utf-8') as f:
                file_config = json.load(f)
            
            # 更新配置
            for section, values in file_config.items():
                if section in self._config_data:
                    config_obj = self._config_data[section]
                    for key, value in values.items():
                        if hasattr(config_obj, key):
                            setattr(config_obj, key, value)
        except Exception as e:
            print(f"⚠️  加载配置文件失败: {e}")
    
    def _load_environment_variables(self):
        """从环境变量加载"""
        env_mappings = {
            # 数据库配置
            'FIRESTORE_PROJECT_ID': ('database', 'project_id'),
            'FIRESTORE_DATABASE_ID': ('database', 'database_id'),
            'GOOGLE_APPLICATION_CREDENTIALS': ('database', 'credentials_path'),
            
            # 消息队列配置
            'PUBSUB_PROJECT_ID': ('pubsub', 'project_id'),
            'CHAPTER_TOPIC': ('pubsub', 'chapter_topic'),
            'CHAPTER_SUBSCRIPTION': ('pubsub', 'chapter_subscription'),
            'COMBINATION_TOPIC': ('pubsub', 'combination_topic'),
            'COMBINATION_SUBSCRIPTION': ('pubsub', 'combination_subscription'),
            
            # 存储配置
            'GCS_BUCKET_NAME': ('storage', 'bucket_name'),
            
            # Gemini配置
            'GEMINI_MODEL': ('gemini', 'model'),
            'MAX_RETRIES': ('gemini', 'max_retries'),
            'RATE_LIMIT_DELAY': ('gemini', 'rate_limit_delay'),
            
            # 工作器配置
            'MAX_WORKERS': ('worker', 'max_workers'),
            'WORKER_TIMEOUT': ('worker', 'worker_timeout'),
            'MAX_CONCURRENT_REQUESTS': ('worker', 'max_concurrent_requests'),
            'CONNECTION_POOL_SIZE': ('worker', 'connection_pool_size'),
            'BATCH_SIZE': ('worker', 'batch_size'),
            
            # 监控配置
            'MONITORING_INTERVAL': ('monitoring', 'monitoring_interval'),
            'HEALTH_CHECK_INTERVAL': ('monitoring', 'health_check_interval'),
            'LOG_LEVEL': ('monitoring', 'log_level'),
            'LOG_FILE': ('monitoring', 'log_file'),
            
            # 进程配置
            'WORKER_RESTART_DELAY': ('process', 'worker_restart_delay'),
            'MAX_WORKER_RESTARTS': ('process', 'max_worker_restarts'),
            'PROCESS_TIMEOUT': ('process', 'process_timeout'),
            
            # 告警配置
            'ALERT_EMAIL': ('alert', 'alert_email'),
            'ALERT_THRESHOLD_ERROR_RATE': ('alert', 'alert_threshold_error_rate'),
            'ALERT_THRESHOLD_MEMORY_USAGE': ('alert', 'alert_threshold_memory_usage'),
            'ALERT_THRESHOLD_CPU_USAGE': ('alert', 'alert_threshold_cpu_usage'),
        }
        
        for env_var, (section, attr) in env_mappings.items():
            value = os.getenv(env_var)
            if value is not None:
                config_obj = self._config_data[section]
                
                # 类型转换
                if hasattr(config_obj, attr):
                    current_value = getattr(config_obj, attr)
                    if isinstance(current_value, int):
                        value = int(value)
                    elif isinstance(current_value, float):
                        value = float(value)
                    elif isinstance(current_value, bool):
                        value = value.lower() in ('true', '1', 'yes', 'on')
                    
                    setattr(config_obj, attr, value)
        
        # 特殊处理Gemini API密钥
        gemini_keys = os.getenv('GEMINI_API_KEYS')
        if gemini_keys:
            self._config_data['gemini'].api_keys = [
                key.strip() for key in gemini_keys.split(',') if key.strip()
            ]
    
    def get_database_config(self) -> DatabaseConfig:
        """获取数据库配置"""
        return self._config_data['database']
    
    def get_pubsub_config(self) -> PubSubConfig:
        """获取消息队列配置"""
        return self._config_data['pubsub']
    
    def get_storage_config(self) -> StorageConfig:
        """获取存储配置"""
        return self._config_data['storage']
    
    def get_gemini_config(self) -> GeminiConfig:
        """获取Gemini配置"""
        return self._config_data['gemini']
    
    def get_worker_config(self) -> WorkerConfig:
        """获取工作器配置"""
        return self._config_data['worker']
    
    def get_monitoring_config(self) -> MonitoringConfig:
        """获取监控配置"""
        return self._config_data['monitoring']
    
    def get_process_config(self) -> ProcessConfig:
        """获取进程配置"""
        return self._config_data['process']
    
    def get_alert_config(self) -> AlertConfig:
        """获取告警配置"""
        return self._config_data['alert']
    
    def get(self, key: str, default: Any = None) -> Any:
        """获取配置值"""
        keys = key.split('.')
        value = self._config_data
        
        for k in keys:
            if isinstance(value, dict):
                value = value.get(k)
            else:
                value = getattr(value, k, None)
            
            if value is None:
                return default
        
        return value
    
    def save_config(self, filename: str):
        """保存配置到文件"""
        config_dict = {}
        for section, config_obj in self._config_data.items():
            config_dict[section] = config_obj.__dict__
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(config_dict, f, indent=2, ensure_ascii=False)


# 全局配置管理器实例
config_manager = ConfigManager() 