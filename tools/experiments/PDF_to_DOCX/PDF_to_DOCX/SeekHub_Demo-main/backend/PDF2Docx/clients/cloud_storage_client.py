"""
云存储客户端
提供Google Cloud Storage文件管理功能
"""

import asyncio
import os
from typing import Dict, Any, List, Optional
from pathlib import Path
from google.cloud import storage
from google.auth.exceptions import GoogleAuthError

from config.config import pdf2docx_config
from utils.logger import LoggerMixin
from utils.file_utils import FileUtils


class CloudStorageClient(LoggerMixin):
    """云存储客户端"""
    
    def __init__(self):
        super().__init__()
        self.config = pdf2docx_config.google_cloud
        self.client: Optional[storage.Client] = None
        self.bucket: Optional[storage.Bucket] = None
        
    async def initialize(self):
        """初始化客户端"""
        try:
            # 设置认证
            os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = self.config.credentials_path
            
            # 创建客户端
            self.client = storage.Client(project=self.config.project_id)
            
            # 获取存储桶
            self.bucket = self.client.bucket(self.config.bucket_name)
            
            # 验证存储桶是否存在
            if not self.bucket.exists():
                raise Exception(f"存储桶不存在: {self.config.bucket_name}")
            
            self.log_info("云存储客户端初始化完成")
            
        except Exception as e:
            self.log_error(f"云存储客户端初始化失败: {e}")
            raise
    
    async def test_connection(self) -> Dict[str, Any]:
        """测试连接"""
        try:
            if not self.client:
                await self.initialize()
            
            if not self.bucket:
                return {'success': False, 'error': 'Bucket not initialized'}
            
            # 尝试列出存储桶中的文件（限制数量）
            blobs = list(self.bucket.list_blobs(max_results=1))
            
            return {
                'success': True, 
                'status': 'connected',
                'bucket_name': self.config.bucket_name,
                'project_id': self.config.project_id
            }
            
        except Exception as e:
            self.log_error(f"云存储连接测试失败: {e}")
            return {'success': False, 'error': str(e)}
    
    async def upload_file(self, 
                         local_path: Path, 
                         remote_path: str = None,
                         overwrite: bool = False) -> Dict[str, Any]:
        """
        上传文件到云存储
        
        Args:
            local_path: 本地文件路径
            remote_path: 远程文件路径（可选）
            overwrite: 是否覆盖已存在的文件
        
        Returns:
            上传结果
        """
        try:
            if not self.bucket:
                await self.initialize()
            
            if not local_path.exists():
                return {'success': False, 'error': f'本地文件不存在: {local_path}'}
            
            # 确定远程路径
            if not remote_path:
                remote_path = f"pdf2docx/{local_path.name}"
            
            # 检查文件是否已存在
            blob = self.bucket.blob(remote_path)
            if blob.exists() and not overwrite:
                return {'success': False, 'error': f'远程文件已存在: {remote_path}'}
            
            # 上传文件
            self.log_info(f"开始上传文件: {local_path} -> {remote_path}")
            
            blob.upload_from_filename(str(local_path))
            
            # 获取文件信息
            file_info = {
                'local_path': str(local_path),
                'remote_path': remote_path,
                'file_size': FileUtils.get_file_size(local_path),
                'file_type': FileUtils.get_mime_type(local_path),
                'public_url': blob.public_url,
                'upload_time': blob.time_created.isoformat() if blob.time_created else None
            }
            
            self.log_info(f"文件上传完成: {remote_path}")
            
            return {
                'success': True,
                'file_info': file_info
            }
            
        except Exception as e:
            self.log_error(f"文件上传失败: {e}")
            return {'success': False, 'error': str(e)}
    
    async def download_file(self, 
                          remote_path: str, 
                          local_path: Path,
                          overwrite: bool = False) -> Dict[str, Any]:
        """
        从云存储下载文件
        
        Args:
            remote_path: 远程文件路径
            local_path: 本地文件路径
            overwrite: 是否覆盖已存在的文件
        
        Returns:
            下载结果
        """
        try:
            if not self.bucket:
                await self.initialize()
            
            # 检查本地文件是否已存在
            if local_path.exists() and not overwrite:
                return {'success': False, 'error': f'本地文件已存在: {local_path}'}
            
            # 检查远程文件是否存在
            blob = self.bucket.blob(remote_path)
            if not blob.exists():
                return {'success': False, 'error': f'远程文件不存在: {remote_path}'}
            
            # 确保本地目录存在
            local_path.parent.mkdir(parents=True, exist_ok=True)
            
            # 下载文件
            self.log_info(f"开始下载文件: {remote_path} -> {local_path}")
            
            blob.download_to_filename(str(local_path))
            
            # 获取文件信息
            file_info = {
                'remote_path': remote_path,
                'local_path': str(local_path),
                'file_size': FileUtils.get_file_size(local_path),
                'file_type': FileUtils.get_mime_type(local_path),
                'download_time': blob.time_created.isoformat() if blob.time_created else None
            }
            
            self.log_info(f"文件下载完成: {local_path}")
            
            return {
                'success': True,
                'file_info': file_info
            }
            
        except Exception as e:
            self.log_error(f"文件下载失败: {e}")
            return {'success': False, 'error': str(e)}
    
    async def list_files(self, 
                        prefix: str = "pdf2docx/",
                        max_results: int = 100) -> Dict[str, Any]:
        """
        列出云存储中的文件
        
        Args:
            prefix: 文件路径前缀
            max_results: 最大返回文件数
        
        Returns:
            文件列表
        """
        try:
            if not self.bucket:
                await self.initialize()
            
            # 列出文件
            blobs = self.bucket.list_blobs(prefix=prefix, max_results=max_results)
            
            files = []
            for blob in blobs:
                files.append({
                    'name': blob.name,
                    'size': blob.size,
                    'content_type': blob.content_type,
                    'created_time': blob.time_created.isoformat() if blob.time_created else None,
                    'updated_time': blob.updated.isoformat() if blob.updated else None,
                    'public_url': blob.public_url
                })
            
            return {
                'success': True,
                'files': files,
                'total_count': len(files)
            }
            
        except Exception as e:
            self.log_error(f"列出文件失败: {e}")
            return {'success': False, 'error': str(e)}
    
    async def delete_file(self, remote_path: str) -> Dict[str, Any]:
        """
        删除云存储中的文件
        
        Args:
            remote_path: 远程文件路径
        
        Returns:
            删除结果
        """
        try:
            if not self.bucket:
                await self.initialize()
            
            # 检查文件是否存在
            blob = self.bucket.blob(remote_path)
            if not blob.exists():
                return {'success': False, 'error': f'文件不存在: {remote_path}'}
            
            # 删除文件
            blob.delete()
            
            self.log_info(f"文件删除完成: {remote_path}")
            
            return {
                'success': True,
                'deleted_file': remote_path
            }
            
        except Exception as e:
            self.log_error(f"文件删除失败: {e}")
            return {'success': False, 'error': str(e)}
    
    async def batch_upload(self, 
                          file_pairs: List[tuple], 
                          max_concurrent: int = 5) -> Dict[str, Any]:
        """
        批量上传文件
        
        Args:
            file_pairs: (本地路径, 远程路径) 的元组列表
            max_concurrent: 最大并发数
        
        Returns:
            批量上传结果
        """
        if not file_pairs:
            return {'success': False, 'error': '没有要上传的文件'}
        
        # 创建信号量控制并发
        semaphore = asyncio.Semaphore(max_concurrent)
        
        async def upload_single(local_path: Path, remote_path: str) -> Dict[str, Any]:
            async with semaphore:
                return await self.upload_file(local_path, remote_path)
        
        # 并发执行上传
        tasks = [upload_single(Path(local), remote) for local, remote in file_pairs]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # 统计结果
        successful = []
        failed = []
        
        for i, result in enumerate(results):
            local_path, remote_path = file_pairs[i]
            
            if isinstance(result, Exception):
                failed.append({
                    'local_path': str(local_path),
                    'remote_path': remote_path,
                    'error': str(result)
                })
            elif isinstance(result, dict) and result.get('success'):
                successful.append(result['file_info'])
            else:
                error_msg = result.get('error', '未知错误') if isinstance(result, dict) else '未知错误'
                failed.append({
                    'local_path': str(local_path),
                    'remote_path': remote_path,
                    'error': error_msg
                })
        
        return {
            'success': len(successful) > 0,
            'total': len(file_pairs),
            'successful': len(successful),
            'failed': len(failed),
            'uploaded_files': successful,
            'failed_files': failed
        } 