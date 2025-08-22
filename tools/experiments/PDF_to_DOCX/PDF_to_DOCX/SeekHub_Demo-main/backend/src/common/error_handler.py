"""
统一错误处理模块
提供标准化的异常处理和错误恢复机制
"""

import traceback
import functools
from typing import Any, Callable, Dict, List, Optional, Type, Union
from datetime import datetime
from dataclasses import dataclass
from enum import Enum

from .logger import LoggerMixin


class ErrorSeverity(Enum):
    """错误严重程度"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class ErrorInfo:
    """错误信息数据类"""
    timestamp: datetime
    error_type: str
    message: str
    traceback: str
    severity: ErrorSeverity
    context: Dict[str, Any]
    component: str


class ErrorHandler(LoggerMixin):
    """统一错误处理器"""
    
    def __init__(self):
        self.error_history: List[ErrorInfo] = []
        self.max_history_size = 1000
        self.error_callbacks: Dict[Type[Exception], List[Callable]] = {}
    
    def register_error_callback(self, exception_type: Type[Exception], callback: Callable):
        """注册错误回调函数"""
        if exception_type not in self.error_callbacks:
            self.error_callbacks[exception_type] = []
        self.error_callbacks[exception_type].append(callback)
    
    def handle_error(
        self,
        error: Exception,
        severity: ErrorSeverity = ErrorSeverity.MEDIUM,
        context: Optional[Dict[str, Any]] = None,
        component: str = "unknown"
    ) -> ErrorInfo:
        """处理错误"""
        error_info = ErrorInfo(
            timestamp=datetime.now(),
            error_type=type(error).__name__,
            message=str(error),
            traceback=traceback.format_exc(),
            severity=severity,
            context=context or {},
            component=component
        )
        
        # 记录错误历史
        self._add_to_history(error_info)
        
        # 根据严重程度记录日志
        if severity == ErrorSeverity.CRITICAL:
            self.log_error(f"CRITICAL ERROR in {component}: {error_info.message}")
        elif severity == ErrorSeverity.HIGH:
            self.log_error(f"HIGH ERROR in {component}: {error_info.message}")
        elif severity == ErrorSeverity.MEDIUM:
            self.log_warning(f"MEDIUM ERROR in {component}: {error_info.message}")
        else:
            self.log_debug(f"LOW ERROR in {component}: {error_info.message}")
        
        # 执行注册的回调函数
        self._execute_callbacks(error)
        
        return error_info
    
    def _add_to_history(self, error_info: ErrorInfo):
        """添加到错误历史"""
        self.error_history.append(error_info)
        
        # 保持历史大小
        if len(self.error_history) > self.max_history_size:
            self.error_history = self.error_history[-self.max_history_size:]
    
    def _execute_callbacks(self, error: Exception):
        """执行错误回调"""
        error_type = type(error)
        
        # 执行精确匹配的回调
        if error_type in self.error_callbacks:
            for callback in self.error_callbacks[error_type]:
                try:
                    callback(error)
                except Exception as e:
                    self.log_error(f"Error callback failed: {e}")
        
        # 执行基类匹配的回调
        for registered_type, callbacks in self.error_callbacks.items():
            if issubclass(error_type, registered_type) and registered_type != error_type:
                for callback in callbacks:
                    try:
                        callback(error)
                    except Exception as e:
                        self.log_error(f"Error callback failed: {e}")
    
    def get_error_statistics(self) -> Dict[str, Any]:
        """获取错误统计"""
        if not self.error_history:
            return {
                'total_errors': 0,
                'by_type': {},
                'by_severity': {},
                'by_component': {},
                'recent_errors': []
            }
        
        by_type = {}
        by_severity = {}
        by_component = {}
        
        for error in self.error_history:
            # 按类型统计
            by_type[error.error_type] = by_type.get(error.error_type, 0) + 1
            
            # 按严重程度统计
            severity_name = error.severity.value
            by_severity[severity_name] = by_severity.get(severity_name, 0) + 1
            
            # 按组件统计
            by_component[error.component] = by_component.get(error.component, 0) + 1
        
        # 最近的错误（最多10个）
        recent_errors = [
            {
                'timestamp': error.timestamp.isoformat(),
                'type': error.error_type,
                'message': error.message,
                'severity': error.severity.value,
                'component': error.component
            }
            for error in self.error_history[-10:]
        ]
        
        return {
            'total_errors': len(self.error_history),
            'by_type': by_type,
            'by_severity': by_severity,
            'by_component': by_component,
            'recent_errors': recent_errors
        }
    
    def clear_history(self):
        """清空错误历史"""
        self.error_history.clear()
        self.log_info("Error history cleared")


def error_handler(
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    component: Optional[str] = None,
    reraise: bool = False,
    default_return: Any = None
):
    """错误处理装饰器"""
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                # 获取组件名称
                comp_name = component or (
                    f"{func.__module__}.{func.__qualname__}" 
                    if hasattr(func, '__qualname__') 
                    else func.__name__
                )
                
                # 处理错误
                error_handler_instance.handle_error(
                    error=e,
                    severity=severity,
                    context={
                        'function': func.__name__,
                        'args': str(args)[:200],  # 限制参数长度
                        'kwargs': str(kwargs)[:200]
                    },
                    component=comp_name
                )
                
                if reraise:
                    raise
                
                return default_return
        
        return wrapper
    return decorator


def async_error_handler(
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    component: Optional[str] = None,
    reraise: bool = False,
    default_return: Any = None
):
    """异步错误处理装饰器"""
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            try:
                return await func(*args, **kwargs)
            except Exception as e:
                # 获取组件名称
                comp_name = component or (
                    f"{func.__module__}.{func.__qualname__}" 
                    if hasattr(func, '__qualname__') 
                    else func.__name__
                )
                
                # 处理错误
                error_handler_instance.handle_error(
                    error=e,
                    severity=severity,
                    context={
                        'function': func.__name__,
                        'args': str(args)[:200],
                        'kwargs': str(kwargs)[:200]
                    },
                    component=comp_name
                )
                
                if reraise:
                    raise
                
                return default_return
        
        return wrapper
    return decorator


# 全局错误处理器实例
error_handler_instance = ErrorHandler() 