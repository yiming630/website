import os
import logging
import shutil
from typing import Optional
from pathlib import Path
import json

logger = logging.getLogger(__name__)

class LocalFileStorage:
    """百度服务器本地文件存储服务"""
    
    def __init__(self):
        # 配置存储根目录
        self.storage_root = os.getenv('LOCAL_STORAGE_ROOT', '/data/seekhub/storage')
        self.public_url_base = os.getenv('PUBLIC_URL_BASE', 'http://your-baidu-server.com/files')
        
        # 确保存储目录存在
        Path(self.storage_root).mkdir(parents=True, exist_ok=True)
        
        logger.info(f"本地存储初始化: {self.storage_root}")
        
    def _get_full_path(self, object_key: str) -> Path:
        """获取文件的完整路径"""
        return Path(self.storage_root) / object_key
        
    def upload_string(self, content: str, object_key: str) -> str:
        """保存字符串内容到本地文件系统"""
        try:
            file_path = self._get_full_path(object_key)
            
            # 创建目录结构
            file_path.parent.mkdir(parents=True, exist_ok=True)
            
            # 写入文件
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            # 生成访问URL（如果配置了Web服务器）
            url = f"{self.public_url_base}/{object_key}"
            logger.info(f"文件保存成功: {file_path}")
            
            return url
            
        except Exception as e:
            logger.error(f"保存文件失败: {e}")
            raise
    
    def upload_file(self, local_file_path: str, object_key: str) -> str:
        """上传本地文件到存储目录"""
        try:
            file_path = self._get_full_path(object_key)
            
            # 创建目录结构
            file_path.parent.mkdir(parents=True, exist_ok=True)
            
            # 复制文件
            shutil.copy2(local_file_path, file_path)
            
            url = f"{self.public_url_base}/{object_key}"
            logger.info(f"文件上传成功: {file_path}")
            
            return url
            
        except Exception as e:
            logger.error(f"上传文件失败: {e}")
            raise
    
    def download_string(self, object_key: str) -> str:
        """从本地文件系统读取字符串内容"""
        try:
            file_path = self._get_full_path(object_key)
            
            if not file_path.exists():
                raise FileNotFoundError(f"文件不存在: {object_key}")
            
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            return content
            
        except Exception as e:
            logger.error(f"读取文件失败: {e}")
            raise
    
    def delete_object(self, object_key: str) -> bool:
        """删除本地文件"""
        try:
            file_path = self._get_full_path(object_key)
            
            if file_path.exists():
                file_path.unlink()
                logger.info(f"文件删除成功: {file_path}")
                
                # 清理空目录
                try:
                    file_path.parent.rmdir()
                except OSError:
                    pass  # 目录非空，忽略
                    
            return True
            
        except Exception as e:
            logger.error(f"删除文件失败: {e}")
            return False
    
    def list_objects(self, prefix: str = "") -> list:
        """列出指定前缀的所有文件"""
        try:
            base_path = self._get_full_path(prefix)
            files = []
            
            if base_path.exists():
                for file_path in base_path.rglob("*"):
                    if file_path.is_file():
                        relative_path = file_path.relative_to(Path(self.storage_root))
                        files.append(str(relative_path))
            
            return files
            
        except Exception as e:
            logger.error(f"列出文件失败: {e}")
            return []