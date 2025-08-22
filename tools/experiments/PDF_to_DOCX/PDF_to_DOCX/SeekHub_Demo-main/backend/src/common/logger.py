"""
统一日志配置模块
提供标准化的日志配置和记录功能
"""

import os
import logging
import logging.handlers
from typing import Optional
from datetime import datetime


class ColoredFormatter(logging.Formatter):
    """彩色日志格式化器"""
    
    COLORS = {
        'DEBUG': '\033[36m',    # 青色
        'INFO': '\033[32m',     # 绿色
        'WARNING': '\033[33m',  # 黄色
        'ERROR': '\033[31m',    # 红色
        'CRITICAL': '\033[35m', # 紫色
    }
    RESET = '\033[0m'
    
    def format(self, record):
        if record.levelname in self.COLORS:
            record.levelname = f"{self.COLORS[record.levelname]}{record.levelname}{self.RESET}"
        return super().format(record)


def setup_logger(
    name: str,
    log_level: str = 'INFO',
    log_file: Optional[str] = None,
    max_file_size: int = 10 * 1024 * 1024,  # 10MB
    backup_count: int = 5,
    enable_console: bool = True,
    enable_color: bool = True
) -> logging.Logger:
    """
    设置标准化日志器
    
    Args:
        name: 日志器名称
        log_level: 日志级别
        log_file: 日志文件路径（可选）
        max_file_size: 最大文件大小
        backup_count: 备份文件数量
        enable_console: 是否启用控制台输出
        enable_color: 是否启用彩色输出
    """
    logger = logging.getLogger(name)
    logger.setLevel(getattr(logging, log_level.upper()))
    
    # 清除现有处理器
    logger.handlers.clear()
    
    # 日志格式
    log_format = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    
    # 控制台处理器
    if enable_console:
        console_handler = logging.StreamHandler()
        if enable_color:
            console_formatter = ColoredFormatter(log_format)
        else:
            console_formatter = logging.Formatter(log_format)
        console_handler.setFormatter(console_formatter)
        logger.addHandler(console_handler)
    
    # 文件处理器
    if log_file:
        # 确保日志目录存在
        log_dir = os.path.dirname(log_file)
        if log_dir:
            os.makedirs(log_dir, exist_ok=True)
        
        # 使用轮转文件处理器
        file_handler = logging.handlers.RotatingFileHandler(
            log_file,
            maxBytes=max_file_size,
            backupCount=backup_count,
            encoding='utf-8'
        )
        file_formatter = logging.Formatter(log_format)
        file_handler.setFormatter(file_formatter)
        logger.addHandler(file_handler)
    
    return logger


def get_logger(name: str) -> logging.Logger:
    """获取已配置的日志器"""
    return logging.getLogger(name)


class LoggerMixin:
    """日志器混合类，为其他类提供日志功能"""
    
    @property
    def logger(self) -> logging.Logger:
        """获取类的日志器"""
        if not hasattr(self, '_logger'):
            self._logger = get_logger(self.__class__.__name__)
        return self._logger
    
    def log_info(self, message: str, *args, **kwargs):
        """记录信息日志"""
        self.logger.info(message, *args, **kwargs)
    
    def log_error(self, message: str, *args, **kwargs):
        """记录错误日志"""
        self.logger.error(message, *args, **kwargs)
    
    def log_warning(self, message: str, *args, **kwargs):
        """记录警告日志"""
        self.logger.warning(message, *args, **kwargs)
    
    def log_debug(self, message: str, *args, **kwargs):
        """记录调试日志"""
        self.logger.debug(message, *args, **kwargs) 