"""
Google Cloud Storage工具 - 用于上传PDF文件并生成公网URL
"""
import os
import logging
from datetime import datetime, timedelta
from typing import Optional
from google.cloud import storage
from google.cloud.storage import Blob
try:
    from .config import GOOGLE_APPLICATION_CREDENTIALS, GOOGLE_CLOUD_PROJECT, GCS_BUCKET_NAME
except ImportError:
    # 当作为独立模块运行时的备用导入
    from config import GOOGLE_APPLICATION_CREDENTIALS, GOOGLE_CLOUD_PROJECT, GCS_BUCKET_NAME

logger = logging.getLogger(__name__)


class GoogleCloudStorage:
    """Google Cloud Storage客户端"""
    
    def __init__(self, bucket_name: str = None, credentials_path: str = None, project_id: str = None):
        """
        初始化GCS客户端
        
        Args:
            bucket_name: GCS存储桶名称
            credentials_path: 服务账号密钥文件路径
            project_id: Google Cloud项目ID
        """
        self.bucket_name = bucket_name or GCS_BUCKET_NAME
        self.project_id = project_id or GOOGLE_CLOUD_PROJECT
        
        # 设置认证
        credentials_path = credentials_path or GOOGLE_APPLICATION_CREDENTIALS
        if credentials_path and os.path.exists(credentials_path):
            os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = credentials_path
            logger.info(f"使用凭证文件: {credentials_path}")
        else:
            logger.warning(f"凭证文件不存在: {credentials_path}")
        
        try:
            self.client = storage.Client(project=self.project_id)
            self.bucket = self.client.bucket(self.bucket_name)
            logger.info(f"GCS客户端初始化成功，项目: {self.project_id}, 存储桶: {self.bucket_name}")
        except Exception as e:
            logger.error(f"GCS客户端初始化失败: {e}")
            raise

    def test_connection(self) -> bool:
        """
        测试GCS连接
        
        Returns:
            连接是否成功
        """
        try:
            # 尝试获取存储桶信息
            bucket_info = self.bucket.reload()
            logger.info(f"存储桶连接测试成功: {self.bucket_name}")
            logger.info(f"存储桶位置: {self.bucket.location}")
            logger.info(f"存储桶存储类: {self.bucket.storage_class}")
            return True
        except Exception as e:
            logger.error(f"存储桶连接测试失败: {e}")
            return False
    
    def upload_file(self, local_file_path: str, blob_name: str = None, 
                   make_public: bool = True) -> Optional[str]:
        """
        上传文件到GCS并返回公网URL
        
        Args:
            local_file_path: 本地文件路径
            blob_name: GCS中的文件名（可选，默认使用原文件名）
            make_public: 是否设置为公开访问
            
        Returns:
            公网访问URL或None
        """
        try:
            if not os.path.exists(local_file_path):
                logger.error(f"文件不存在: {local_file_path}")
                return None
            
            # 生成blob名称
            if blob_name is None:
                blob_name = f"pdf-files/{os.path.basename(local_file_path)}"
            
            # 创建blob对象
            blob = self.bucket.blob(blob_name)
            
            # 上传文件
            logger.info(f"开始上传文件: {local_file_path} -> {blob_name}")
            blob.upload_from_filename(local_file_path)
            
            # 由于启用了uniform bucket-level access，无法单独设置对象ACL
            # 直接返回公网URL（如果存储桶配置为公开）或生成签名URL
            if make_public:
                try:
                    # 尝试设置为公开（如果允许的话）
                    blob.make_public()
                    public_url = blob.public_url
                    logger.info(f"文件上传成功，公网URL: {public_url}")
                    return public_url
                except Exception as e:
                    logger.warning(f"无法设置公开访问（uniform bucket-level access），使用签名URL: {e}")
                    # 生成签名URL作为备选，使用datetime对象
                    expiration = datetime.utcnow() + timedelta(hours=24)
                    signed_url = blob.generate_signed_url(expiration=expiration)
                    logger.info(f"文件上传成功，签名URL: {signed_url}")
                    return signed_url
            else:
                # 生成签名URL（有时效性），使用datetime对象
                expiration = datetime.utcnow() + timedelta(hours=1)
                signed_url = blob.generate_signed_url(expiration=expiration)
                logger.info(f"文件上传成功，签名URL: {signed_url}")
                return signed_url
                
        except Exception as e:
            logger.error(f"文件上传失败: {e}")
            return None
    
    def delete_file(self, blob_name: str) -> bool:
        """
        删除GCS中的文件
        
        Args:
            blob_name: GCS中的文件名
            
        Returns:
            删除是否成功
        """
        try:
            blob = self.bucket.blob(blob_name)
            blob.delete()
            logger.info(f"文件删除成功: {blob_name}")
            return True
        except Exception as e:
            logger.error(f"文件删除失败: {e}")
            return False
    
    def list_files(self, prefix: str = "pdf-files/") -> list:
        """
        列出存储桶中的文件
        
        Args:
            prefix: 文件前缀
            
        Returns:
            文件列表
        """
        try:
            blobs = self.client.list_blobs(self.bucket, prefix=prefix)
            files = [blob.name for blob in blobs]
            logger.info(f"找到 {len(files)} 个文件")
            return files
        except Exception as e:
            logger.error(f"列出文件失败: {e}")
            return []


def main():
    """测试函数"""
    import sys
    
    if len(sys.argv) < 3:
        print("用法: python cloud_storage.py <bucket_name> <file_path>")
        return
    
    bucket_name = sys.argv[1]
    file_path = sys.argv[2]
    
    # 配置日志
    logging.basicConfig(level=logging.INFO)
    
    # 创建GCS客户端
    gcs = GoogleCloudStorage(bucket_name)
    
    # 上传文件
    url = gcs.upload_file(file_path)
    if url:
        print(f"上传成功！公网URL: {url}")
    else:
        print("上传失败！")


if __name__ == '__main__':
    main() 