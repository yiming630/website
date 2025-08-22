"""
依赖管理模块
管理可选依赖和服务的初始化
"""

import importlib
from typing import Dict, Any, Optional, Callable, TypeVar, Type
from dataclasses import dataclass
from enum import Enum

from .logger import LoggerMixin
from .error_handler import ErrorSeverity, error_handler

T = TypeVar('T')


class DependencyStatus(Enum):
    """依赖状态枚举"""
    AVAILABLE = "available"
    UNAVAILABLE = "unavailable"
    ERROR = "error"


@dataclass
class DependencyInfo:
    """依赖信息"""
    name: str
    status: DependencyStatus
    module: Optional[Any] = None
    error_message: Optional[str] = None
    fallback: Optional[Any] = None


class DependencyManager(LoggerMixin):
    """依赖管理器"""
    
    def __init__(self):
        self.dependencies: Dict[str, DependencyInfo] = {}
        self.initializers: Dict[str, Callable] = {}
        self.initialized_services: Dict[str, Any] = {}
    
    def register_dependency(
        self,
        name: str,
        module_name: str,
        required: bool = False,
        fallback: Optional[Any] = None,
        initializer: Optional[Callable] = None
    ) -> DependencyInfo:
        """注册依赖"""
        try:
            module = importlib.import_module(module_name)
            dependency_info = DependencyInfo(
                name=name,
                status=DependencyStatus.AVAILABLE,
                module=module,
                fallback=fallback
            )
            self.log_info(f"✅ 依赖 {name} 可用")
        except ImportError as e:
            if required:
                self.log_error(f"❌ 必需依赖 {name} 不可用: {e}")
                raise
            else:
                dependency_info = DependencyInfo(
                    name=name,
                    status=DependencyStatus.UNAVAILABLE,
                    error_message=str(e),
                    fallback=fallback
                )
                self.log_warning(f"⚠️  可选依赖 {name} 不可用，使用回退方案")
        except Exception as e:
            dependency_info = DependencyInfo(
                name=name,
                status=DependencyStatus.ERROR,
                error_message=str(e),
                fallback=fallback
            )
            if required:
                self.log_error(f"❌ 依赖 {name} 加载错误: {e}")
                raise
            else:
                self.log_warning(f"⚠️  依赖 {name} 加载错误，使用回退方案: {e}")
        
        self.dependencies[name] = dependency_info
        
        if initializer:
            self.initializers[name] = initializer
        
        return dependency_info
    
    def get_dependency(self, name: str) -> Any:
        """获取依赖"""
        if name not in self.dependencies:
            raise ValueError(f"未注册的依赖: {name}")
        
        dependency_info = self.dependencies[name]
        
        if dependency_info.status == DependencyStatus.AVAILABLE:
            return dependency_info.module
        else:
            return dependency_info.fallback
    
    def is_available(self, name: str) -> bool:
        """检查依赖是否可用"""
        if name not in self.dependencies:
            return False
        return self.dependencies[name].status == DependencyStatus.AVAILABLE
    
    @error_handler(severity=ErrorSeverity.MEDIUM, component="DependencyManager")
    def initialize_service(self, name: str, *args, **kwargs) -> Any:
        """初始化服务"""
        if name in self.initialized_services:
            return self.initialized_services[name]
        
        if name not in self.initializers:
            raise ValueError(f"未注册的服务初始化器: {name}")
        
        initializer = self.initializers[name]
        service = initializer(*args, **kwargs)
        self.initialized_services[name] = service
        
        self.log_info(f"✅ 服务 {name} 初始化完成")
        return service
    
    def get_service(self, name: str) -> Any:
        """获取已初始化的服务"""
        if name not in self.initialized_services:
            raise ValueError(f"服务 {name} 未初始化")
        return self.initialized_services[name]
    
    def service_exists(self, name: str) -> bool:
        """检查服务是否存在"""
        return name in self.initialized_services
    
    def get_status_report(self) -> Dict[str, Any]:
        """获取依赖状态报告"""
        return {
            'dependencies': {
                name: {
                    'status': dep.status.value,
                    'error': dep.error_message,
                    'has_fallback': dep.fallback is not None
                }
                for name, dep in self.dependencies.items()
            },
            'services': {
                name: type(service).__name__
                for name, service in self.initialized_services.items()
            }
        }


# 创建模拟类用于回退
class MockFirestoreHelper:
    """模拟Firestore助手"""
    
    def __init__(self):
        self.data = {}
    
    async def connect(self):
        return True
    
    async def insert_document(self, collection: str, data: dict) -> str:
        doc_id = f"mock_{len(self.data)}"
        self.data[f"{collection}/{doc_id}"] = data
        return doc_id
    
    async def get_document_by_id(self, collection: str, doc_id: str) -> dict:
        return self.data.get(f"{collection}/{doc_id}", {})
    
    async def find_documents(self, collection: str, filters: Optional[dict] = None) -> list:
        return []
    
    async def update_document(self, collection: str, doc_id: str, data: dict):
        key = f"{collection}/{doc_id}"
        if key in self.data:
            self.data[key].update(data)
    
    async def delete_document(self, collection: str, doc_id: str):
        key = f"{collection}/{doc_id}"
        if key in self.data:
            del self.data[key]


class MockPubSubQueue:
    """模拟消息队列"""
    
    def __init__(self):
        self.messages = []
    
    async def initialize(self):
        return True
    
    async def add_chapter_task(self, book_id: str, chapter_index: int, chapter_text: str) -> str:
        message_id = f"msg_{len(self.messages)}"
        self.messages.append({
            'id': message_id,
            'book_id': book_id,
            'chapter_index': chapter_index,
            'chapter_text': chapter_text
        })
        return message_id


class MockGeminiClient:
    """模拟Gemini客户端"""
    
    async def translate_text(self, text: str, target_lang: str = "Chinese") -> str:
        return f"[模拟翻译] {text}"


# 全局依赖管理器实例
dependency_manager = DependencyManager()


def setup_dependencies():
    """设置标准依赖"""
    # 注册Firestore依赖
    dependency_manager.register_dependency(
        name="firestore",
        module_name="src.core.firestore_helper",
        required=False,
        fallback=MockFirestoreHelper()
    )
    
    # 注册PubSub依赖
    dependency_manager.register_dependency(
        name="pubsub",
        module_name="src.core.pubsub_queue",
        required=False,
        fallback=MockPubSubQueue()
    )
    
    # 注册Gemini依赖
    dependency_manager.register_dependency(
        name="gemini",
        module_name="src.core.gemini_client",
        required=False,
        fallback=MockGeminiClient()
    )
    
    # 注册可选GUI依赖
    dependency_manager.register_dependency(
        name="matplotlib",
        module_name="matplotlib.pyplot",
        required=False
    )
    
    dependency_manager.register_dependency(
        name="customtkinter",
        module_name="customtkinter",
        required=False
    ) 