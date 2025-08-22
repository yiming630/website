"""
WPS API客户端
提供PDF转DOCX的转换功能
"""

import asyncio
import aiohttp
import hashlib
import hmac
import base64
import time
from typing import Optional, Dict, Any, List
from pathlib import Path

from config.config import pdf2docx_config
from utils.logger import LoggerMixin
from utils.file_utils import FileUtils


class WPSClient(LoggerMixin):
    """WPS API客户端"""
    
    def __init__(self):
        super().__init__()
        self.config = pdf2docx_config.wps
        self.session: Optional[aiohttp.ClientSession] = None
        
    async def __aenter__(self):
        """异步上下文管理器进入"""
        await self.initialize()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """异步上下文管理器退出"""
        await self.close()
    
    async def initialize(self):
        """初始化客户端"""
        if not self.session:
            timeout = aiohttp.ClientTimeout(total=self.config.timeout)
            self.session = aiohttp.ClientSession(timeout=timeout)
        
        self.log_info("WPS客户端初始化完成")
    
    async def close(self):
        """关闭客户端"""
        if self.session:
            await self.session.close()
            self.session = None
        
        self.log_info("WPS客户端已关闭")
    
    def _generate_signature(self, timestamp: str, nonce: str) -> str:
        """生成API签名"""
        sign_str = f"{self.config.app_id}{timestamp}{nonce}"
        signature = hmac.new(
            self.config.api_key.encode('utf-8'),
            sign_str.encode('utf-8'),
            hashlib.sha256
        ).digest()
        return base64.b64encode(signature).decode('utf-8')
    
    def _get_auth_headers(self) -> Dict[str, str]:
        """获取认证头"""
        timestamp = str(int(time.time()))
        nonce = hashlib.md5(f"{timestamp}{self.config.app_id}".encode()).hexdigest()
        signature = self._generate_signature(timestamp, nonce)
        
        return {
            'Content-Type': 'application/json',
            'X-WPS-AppID': self.config.app_id,
            'X-WPS-Timestamp': timestamp,
            'X-WPS-Nonce': nonce,
            'X-WPS-Signature': signature
        }
    
    async def test_connection(self) -> Dict[str, Any]:
        """测试API连接"""
        try:
            if not self.session:
                await self.initialize()
            
            if not self.session:
                return {'success': False, 'error': 'Session not initialized'}
            
            headers = self._get_auth_headers()
            
            async with self.session.get(
                f"{self.config.endpoint}/api/v1/status",
                headers=headers
            ) as response:
                if response.status == 200:
                    return {'success': True, 'status': 'connected'}
                else:
                    return {'success': False, 'error': f'HTTP {response.status}'}
                    
        except Exception as e:
            self.log_error(f"WPS API连接测试失败: {e}")
            return {'success': False, 'error': str(e)}
    
    async def convert_pdf_to_docx(self, pdf_path: Path, output_path: Optional[Path] = None) -> Dict[str, Any]:
        """转换PDF为DOCX"""
        try:
            if not self.session:
                await self.initialize()
            
            if not pdf_path.exists():
                return {'success': False, 'error': f'PDF文件不存在: {pdf_path}'}
            
            if not output_path:
                output_path = pdf_path.with_suffix('.docx')
            
            # 模拟转换过程（实际实现需要根据WPS API文档调整）
            self.log_info(f"开始转换PDF: {pdf_path}")
            
            # 简化实现：这里可以集成实际的WPS API调用
            # 目前返回模拟结果
            return {
                'success': True,
                'input_file': str(pdf_path),
                'output_file': str(output_path),
                'message': '转换完成（模拟）'
            }
                
        except Exception as e:
            self.log_error(f"PDF转换失败: {e}")
            return {'success': False, 'error': str(e)}
    
    async def convert_batch(self, 
                          pdf_files: List[Path], 
                          output_dir: Path,
                          max_concurrent: int = 5) -> Dict[str, Any]:
        """批量转换PDF文件"""
        if not pdf_files:
            return {'success': False, 'error': '没有要转换的PDF文件'}
        
        FileUtils.ensure_dir(output_dir)
        
        semaphore = asyncio.Semaphore(max_concurrent)
        
        async def convert_single(pdf_path: Path) -> Dict[str, Any]:
            async with semaphore:
                output_path = output_dir / f"{pdf_path.stem}.docx"
                return await self.convert_pdf_to_docx(pdf_path, output_path)
        
        tasks = [convert_single(pdf_path) for pdf_path in pdf_files]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        successful = []
        failed = []
        
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                failed.append({
                    'file': str(pdf_files[i]),
                    'error': str(result)
                })
            elif isinstance(result, dict) and result.get('success'):
                successful.append(result)
            else:
                error_msg = result.get('error', '未知错误') if isinstance(result, dict) else '未知错误'
                failed.append({
                    'file': str(pdf_files[i]),
                    'error': error_msg
                })
        
        return {
            'success': len(successful) > 0,
            'total': len(pdf_files),
            'successful': len(successful),
            'failed': len(failed),
            'successful_files': successful,
            'failed_files': failed
        } 