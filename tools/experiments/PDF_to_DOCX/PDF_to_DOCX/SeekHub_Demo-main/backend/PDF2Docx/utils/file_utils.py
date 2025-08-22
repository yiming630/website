"""
文件工具模块
"""

import os
import shutil
from pathlib import Path
from typing import List, Optional, Union
import mimetypes


class FileUtils:
    """文件操作工具类"""
    
    @staticmethod
    def ensure_dir(path: Union[str, Path]) -> Path:
        """确保目录存在"""
        path = Path(path)
        path.mkdir(parents=True, exist_ok=True)
        return path
    
    @staticmethod
    def get_file_size(file_path: Union[str, Path]) -> int:
        """获取文件大小（字节）"""
        return Path(file_path).stat().st_size
    
    @staticmethod
    def get_file_extension(file_path: Union[str, Path]) -> str:
        """获取文件扩展名"""
        return Path(file_path).suffix.lower()
    
    @staticmethod
    def is_pdf_file(file_path: Union[str, Path]) -> bool:
        """检查是否为PDF文件"""
        return FileUtils.get_file_extension(file_path) == '.pdf'
    
    @staticmethod
    def is_docx_file(file_path: Union[str, Path]) -> bool:
        """检查是否为DOCX文件"""
        return FileUtils.get_file_extension(file_path) == '.docx'
    
    @staticmethod
    def find_files(directory: Union[str, Path], 
                   extensions: Optional[List[str]] = None,
                   recursive: bool = True) -> List[Path]:
        """
        查找指定目录下的文件
        
        Args:
            directory: 目录路径
            extensions: 文件扩展名列表，如['.pdf', '.docx']
            recursive: 是否递归搜索
        
        Returns:
            文件路径列表
        """
        directory = Path(directory)
        if not directory.exists():
            return []
        
        if extensions:
            extensions = [ext.lower() for ext in extensions]
        
        files = []
        if recursive:
            pattern = "**/*"
        else:
            pattern = "*"
        
        for file_path in directory.glob(pattern):
            if file_path.is_file():
                if not extensions or file_path.suffix.lower() in extensions:
                    files.append(file_path)
        
        return sorted(files)
    
    @staticmethod
    def copy_file(src: Union[str, Path], dst: Union[str, Path]) -> bool:
        """复制文件"""
        try:
            src_path = Path(src)
            dst_path = Path(dst)
            
            # 确保目标目录存在
            dst_path.parent.mkdir(parents=True, exist_ok=True)
            
            shutil.copy2(src_path, dst_path)
            return True
        except Exception:
            return False
    
    @staticmethod
    def move_file(src: Union[str, Path], dst: Union[str, Path]) -> bool:
        """移动文件"""
        try:
            src_path = Path(src)
            dst_path = Path(dst)
            
            # 确保目标目录存在
            dst_path.parent.mkdir(parents=True, exist_ok=True)
            
            shutil.move(str(src_path), str(dst_path))
            return True
        except Exception:
            return False
    
    @staticmethod
    def delete_file(file_path: Union[str, Path]) -> bool:
        """删除文件"""
        try:
            Path(file_path).unlink()
            return True
        except Exception:
            return False
    
    @staticmethod
    def clean_filename(filename: str) -> str:
        """清理文件名，移除非法字符"""
        # 定义非法字符
        illegal_chars = '<>:"/\\|?*'
        
        # 替换非法字符
        for char in illegal_chars:
            filename = filename.replace(char, '_')
        
        # 移除首尾空格
        filename = filename.strip()
        
        # 限制文件名长度
        if len(filename) > 200:
            name, ext = os.path.splitext(filename)
            filename = name[:200-len(ext)] + ext
        
        return filename
    
    @staticmethod
    def get_mime_type(file_path: Union[str, Path]) -> Optional[str]:
        """获取文件MIME类型"""
        mime_type, _ = mimetypes.guess_type(str(file_path))
        return mime_type
    
    @staticmethod
    def create_unique_filename(directory: Union[str, Path], 
                             base_name: str, 
                             extension: str = "") -> Path:
        """
        创建唯一文件名
        
        Args:
            directory: 目录路径
            base_name: 基础文件名
            extension: 文件扩展名
        
        Returns:
            唯一文件路径
        """
        directory = Path(directory)
        FileUtils.ensure_dir(directory)
        
        if not extension.startswith('.') and extension:
            extension = '.' + extension
        
        counter = 1
        while True:
            if counter == 1:
                filename = f"{base_name}{extension}"
            else:
                filename = f"{base_name}_{counter}{extension}"
            
            file_path = directory / filename
            if not file_path.exists():
                return file_path
            
            counter += 1
    
    @staticmethod
    def format_file_size(size_bytes: int) -> str:
        """格式化文件大小"""
        if size_bytes == 0:
            return "0 B"
        
        size_names = ["B", "KB", "MB", "GB", "TB"]
        i = 0
        size_value = float(size_bytes)
        while size_value >= 1024 and i < len(size_names) - 1:
            size_value /= 1024
            i += 1
        
        return f"{size_value:.1f} {size_names[i]}" 