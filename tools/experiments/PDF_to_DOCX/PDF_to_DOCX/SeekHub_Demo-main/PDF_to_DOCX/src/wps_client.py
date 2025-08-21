"""
WPS API客户端 - 用于调用WPS的PDF转DOCX功能
基于官方WPS WebOffice开放平台API文档实现
"""
import json
import time
import requests
import hashlib
import os
from datetime import datetime
from email.utils import formatdate
from typing import Optional, Dict, Any
from tenacity import retry, stop_after_attempt, wait_exponential
import logging
from . import config

logger = logging.getLogger(__name__)


class WPSClient:
    """WPS Office API客户端 - 实现PDF转DOCX功能"""
    
    def __init__(self, app_id: str = None, app_secret: str = None, endpoint: str = None):
        self.app_id = app_id or getattr(config, 'WPS_APP_ID', 'SX20250704GGUSEK')
        self.app_secret = app_secret or getattr(config, 'WPS_API_KEY', 'vLycqJTZoNDDDLuIOAzXEZSNgckvXPaC')
        self.endpoint = endpoint or getattr(config, 'WPS_ENDPOINT', 'https://solution.wps.cn')
        self.endpoint = self.endpoint.rstrip('/')
        
        logger.info(f"初始化WPS客户端 - AppID: {self.app_id}")
    
    def _generate_headers(self, body_content: str = "", request_uri: str = "") -> Dict[str, str]:
        """
        生成WPS API请求头
        根据官方文档生成必要的认证headers
        
        Args:
            body_content: POST请求的body内容，GET请求为空字符串
            request_uri: GET请求的URI路径（用于计算MD5）
        """
        # 生成当前时间 (RFC1123格式)
        date_str = formatdate(timeval=None, localtime=False, usegmt=True)
        
        # 计算Content-MD5
        if request_uri:  # GET请求使用URI计算MD5
            content_md5 = hashlib.md5(request_uri.encode('utf-8')).hexdigest()
        else:  # POST请求使用body计算MD5
            content_md5 = hashlib.md5(body_content.encode('utf-8')).hexdigest()
        
        # 设置Content-Type
        content_type = "application/json"
        
        # 生成签名
        # 格式: sha1(app_secret + content_md5 + content_type + date)
        sign_string = f"{self.app_secret}{content_md5}{content_type}{date_str}"
        signature = hashlib.sha1(sign_string.encode('utf-8')).hexdigest()
        
        # 构建Authorization header
        # 格式: "WPS-2:" + app_id + ":" + signature
        authorization = f"WPS-2:{self.app_id}:{signature}"
        
        headers = {
            'Date': date_str,
            'Content-Md5': content_md5,
            'Content-Type': content_type,
            'Authorization': authorization
        }
        
        logger.debug(f"生成请求头: {headers}")
        return headers
    
    def convert_pdf_to_docx(self, pdf_url: str, output_path: str = None, 
                           page_begin: int = None, page_end: int = None) -> bool:
        """
        将PDF转换为DOCX
        
        Args:
            pdf_url: PDF文件的公网访问URL
            output_path: 输出DOCX文件路径
            page_begin: 转换起始页 (从1开始，可选)
            page_end: 转换结束页 (可选)
            
        Returns:
            转换是否成功
        """
        try:
            logger.info(f"开始转换PDF: {pdf_url}")
            
            # 步骤1: 创建转换任务
            task_id = self._create_conversion_task(pdf_url, page_begin, page_end)
            if not task_id:
                return False
            
            # 步骤2: 轮询任务状态
            download_url = self._poll_task_status(task_id)
            if not download_url:
                return False
            
            # 步骤3: 下载转换后的文件
            if output_path:
                success = self._download_file(download_url, output_path)
                return success
            else:
                logger.info(f"转换完成，下载链接: {download_url}")
                return True
                
        except Exception as e:
            logger.error(f"PDF转换失败: {e}")
            return False
    
    def _create_conversion_task(self, pdf_url: str, page_begin: int = None, page_end: int = None) -> Optional[str]:
        """
        创建PDF转DOCX转换任务
        
        Args:
            pdf_url: PDF文件的公网访问URL
            page_begin: 起始页
            page_end: 结束页
            
        Returns:
            任务ID或None
        """
        try:
            # 构建请求URL
            url = f"{self.endpoint}/api/developer/v1/office/pdf/convert/to/docx"
            
            # 构建请求体
            body_data = {
                "url": pdf_url,
                "text_unify": True  # 统一段落字体字号
            }
            
            # 添加页码范围（如果指定）
            if page_begin is not None:
                body_data["page_num_begin"] = page_begin
            if page_end is not None:
                body_data["page_num_end"] = page_end
            
            body_content = json.dumps(body_data, ensure_ascii=False)
            
            # 生成请求头
            headers = self._generate_headers(body_content)
            
            logger.info(f"发送转换请求到: {url}")
            logger.debug(f"请求体: {body_content}")
            
            # 发送请求
            response = requests.post(url, data=body_content, headers=headers, timeout=30)
            
            logger.info(f"WPS API响应状态: {response.status_code}")
            logger.debug(f"WPS API响应内容: {response.text}")
            
            if response.status_code != 200:
                logger.error(f"WPS API请求失败: {response.status_code} - {response.text}")
                return None
            
            result = response.json()
            
            # 打印完整的响应数据以了解结构
            logger.info(f"创建任务完整响应: {json.dumps(result, ensure_ascii=False, indent=2)}")
            
            if result.get('code') == 0:
                task_data = result.get('data', {})
                task_id = task_data.get('task_id')
                
                # 检查是否有查询URL
                query_url = task_data.get('query_url') or task_data.get('status_url')
                if query_url:
                    logger.info(f"获取到查询URL: {query_url}")
                    # 保存查询URL供后续使用
                    self._task_query_urls = getattr(self, '_task_query_urls', {})
                    self._task_query_urls[task_id] = query_url
                
                logger.info(f"转换任务创建成功，任务ID: {task_id}")
                return task_id
            else:
                logger.error(f"创建转换任务失败: {result}")
                return None
                
        except Exception as e:
            logger.error(f"创建转换任务异常: {e}")
            return None
    
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2))
    def _poll_task_status(self, task_id: str, timeout: int = 300) -> Optional[str]:
        """
        轮询任务状态直到完成
        
        Args:
            task_id: 任务ID
            timeout: 超时时间（秒）
            
        Returns:
            下载URL或None
        """
        try:
            # 根据WPS官方文档，PDF转DOCX的查询路径应该是这个
            request_uri = f"/api/developer/v1/tasks/convert/to/docx/{task_id}"
            url = f"{self.endpoint}{request_uri}"
            
            start_time = time.time()
            check_count = 0
            
            while time.time() - start_time < timeout:
                check_count += 1
                logger.info(f"查询任务状态 (第{check_count}次): {task_id}")
                logger.info(f"查询URL: {url}")
                
                # 生成查询请求头（GET请求，使用完整URI计算MD5）
                headers = self._generate_headers("", request_uri)
                
                response = requests.get(url, headers=headers, timeout=30)
                
                logger.info(f"查询响应状态: {response.status_code}")
                logger.debug(f"查询响应内容: {response.text}")
                
                if response.status_code != 200:
                    logger.warning(f"查询任务状态失败: {response.status_code} - {response.text}")
                    time.sleep(5)
                    continue
                
                result = response.json()
                logger.info(f"查询结果: {json.dumps(result, ensure_ascii=False, indent=2)}")
                
                if result.get('code') != 0:
                    logger.error(f"查询任务状态返回错误: {result}")
                    return None
                
                task_data = result.get('data', {})
                status = task_data.get('status', 'unknown')
                progress = task_data.get('progress', 0)
                
                logger.info(f"任务状态: {status}, 进度: {progress}%")
                
                # 根据WPS文档，转换状态为1且progress为100时表示转换完成
                if (status == 1 or status == '1' or 
                    status == 'success' or status == 'done' or status == 'completed') and progress == 100:
                    # 根据文档，下载URL字段为download_url
                    download_url = task_data.get('download_url')
                    if download_url:
                        logger.info(f"任务完成，获取下载链接: {download_url}")
                        return download_url
                    else:
                        logger.error("任务完成但未获取到下载链接")
                        logger.error(f"完整响应数据: {task_data}")
                        return None
                        
                elif (status == 4 or status == '4' or 
                      status == 'failed' or status == 'error'):
                    error_msg = task_data.get('errMsgs') or task_data.get('error_msg') or task_data.get('message', '未知错误')
                    logger.error(f"转换任务失败: {error_msg}")
                    return None
                    
                elif (status in [2, '2', 3, '3', 5, '5'] or 
                      status in ['processing', 'waiting', 'pending', 'running', 'queued']):
                    duration = task_data.get('duration', 0)
                    logger.info(f"任务进行中 (状态: {status}, 进度: {progress}%, 耗时: {duration}秒)，等待10秒后重试...")
                    time.sleep(10)
                    continue
                else:
                    logger.warning(f"未知任务状态: {status}，等待10秒后重试...")
                    time.sleep(10)
                    continue
            
            logger.error(f"任务超时: {task_id}")
            return None
            
        except Exception as e:
            logger.error(f"轮询任务状态异常: {e}")
            return None
    
    def _download_file(self, download_url: str, output_path: str) -> bool:
        """
        下载转换后的文件
        
        Args:
            download_url: 下载链接
            output_path: 输出文件路径
            
        Returns:
            下载是否成功
        """
        try:
            logger.info(f"开始下载文件: {download_url} -> {output_path}")
            
            response = requests.get(download_url, stream=True, timeout=60)
            
            if response.status_code != 200:
                logger.error(f"下载文件失败: {response.status_code}")
                return False
            
            # 确保输出目录存在
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            
            with open(output_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
            
            logger.info(f"文件下载完成: {output_path}")
            return True
            
        except Exception as e:
            logger.error(f"下载文件异常: {e}")
            return False
    
    def upload_file_to_cloud(self, file_path: str) -> Optional[str]:
        """
        上传文件到云存储并返回公网URL
        
        Args:
            file_path: 本地文件路径
            
        Returns:
            公网访问URL或None
            
        注意: 这里需要根据您的云存储服务实现
        您提到有Google Cloud，可以使用Google Cloud Storage
        """
        # TODO: 实现Google Cloud Storage上传
        # 这里是示例实现，您需要根据实际情况修改
        
        logger.warning("upload_file_to_cloud 方法需要实现")
        logger.info("请将PDF文件上传到可公网访问的URL，然后使用该URL调用convert_pdf_to_docx")
        
        return None
    
    def test_connection(self) -> Dict[str, Any]:
        """
        测试WPS API连接
        
        Returns:
            测试结果
        """
        try:
            # 使用一个示例URL测试API连接
            test_url = "https://example.com/test.pdf"  # 这个URL不存在，但可以测试API响应
            
            url = f"{self.endpoint}/api/developer/v1/office/pdf/convert/to/docx"
            body_data = {"url": test_url}
            body_content = json.dumps(body_data)
            headers = self._generate_headers(body_content)
            
            response = requests.post(url, data=body_content, headers=headers, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                if result.get('code') == 0:
                    return {
                        'success': True,
                        'message': 'WPS API连接正常',
                        'app_id': self.app_id
                    }
                else:
                    return {
                        'success': True,
                        'message': 'WPS API连接正常（测试URL无效，但API响应正常）',
                        'app_id': self.app_id,
                        'api_response': result
                    }
            else:
                return {
                    'success': False,
                    'error': f'API响应异常: {response.status_code}',
                    'response': response.text
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': f'连接测试失败: {str(e)}'
            }


def main():
    """测试函数"""
    # 配置日志
    logging.basicConfig(level=logging.INFO)
    
    # 创建客户端
    client = WPSClient()
    
    # 测试连接
    result = client.test_connection()
    print("WPS API连接测试结果:")
    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == '__main__':
    main() 