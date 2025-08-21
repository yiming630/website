"""
Gemini API客户端
提供文档分割、翻译和智能分析功能
"""

import asyncio
import re
from typing import Dict, Any, List, Optional
from pathlib import Path
import google.generativeai as genai

from config.config import pdf2docx_config
from utils.logger import LoggerMixin
from utils.text_utils import TextUtils


class GeminiClient(LoggerMixin):
    """Gemini API客户端"""
    
    def __init__(self):
        super().__init__()
        self.config = pdf2docx_config.gemini
        genai.configure(api_key=self.config.api_key)
        self.model = genai.GenerativeModel(self.config.model)
        
        # 系统提示词
        self.translation_system_prompt = (
            "You are a professional translator. "
            "Translate the following English text into accurate, fluent Simplified Chinese. "
            "Return ONLY the Chinese translation—no other output."
        )
        
        self.split_system_prompt = (
            "You are a document processing assistant. "
            "Please analyze the document and split it into logical sections. "
            "Maintain the integrity of sentences and paragraphs."
        )
    
    async def test_connection(self) -> Dict[str, Any]:
        """测试API连接"""
        try:
            # 简单测试
            test_text = "Hello, this is a test."
            result = await self.translate_text(test_text)
            
            if result.get('success'):
                return {'success': True, 'status': 'connected'}
            else:
                return {'success': False, 'error': result.get('error', 'Connection failed')}
                
        except Exception as e:
            self.log_error(f"Gemini API连接测试失败: {e}")
            return {'success': False, 'error': str(e)}
    
    async def translate_text(self, text: str, 
                           source_lang: str = 'en', 
                           target_lang: str = 'zh') -> Dict[str, Any]:
        """
        翻译文本
        
        Args:
            text: 要翻译的文本
            source_lang: 源语言
            target_lang: 目标语言
        
        Returns:
            翻译结果
        """
        try:
            if not text.strip():
                return {'success': False, 'error': '文本为空'}
            
            # 检查文本长度
            if len(text) > self.config.max_tokens * 4:  # 估算
                return {'success': False, 'error': '文本过长'}
            
            # 构造提示词
            if target_lang == 'zh':
                prompt = (
                    "You are a professional translator. "
                    "Translate the English text that follows into accurate, fluent Simplified Chinese. "
                    "Return ONLY the Chinese translation—no commentary.\n\n"
                    + text
                )
            else:
                prompt = f"Translate the following text from {source_lang} to {target_lang}:\n\n{text}"
            
            # 生成翻译
            try:
                response = self.model.generate_content(
                    prompt,
                    generation_config=genai.GenerationConfig(
                        temperature=self.config.temperature,
                        max_output_tokens=self.config.max_tokens
                    )
                )
                
                translation = response.text.strip()
                
                return {
                    'success': True,
                    'translation': translation,
                    'source_text': text,
                    'model_used': self.config.model
                }
                
            except Exception as e:
                self.log_warning(f"主模型失败，尝试备用模型: {e}")
                
                # 尝试备用模型
                fallback_model = genai.GenerativeModel(self.config.fallback_model)
                response = fallback_model.generate_content(
                    prompt,
                    generation_config=genai.GenerationConfig(
                        temperature=self.config.temperature,
                        max_output_tokens=self.config.max_tokens
                    )
                )
                
                translation = response.text.strip()
                
                return {
                    'success': True,
                    'translation': translation,
                    'source_text': text,
                    'model_used': self.config.fallback_model
                }
                
        except Exception as e:
            self.log_error(f"翻译失败: {e}")
            return {'success': False, 'error': str(e)}
    
    async def split_document(self, text: str, 
                           max_chunk_size: int = 2000,
                           overlap_size: int = 200) -> Dict[str, Any]:
        """
        智能分割文档
        
        Args:
            text: 要分割的文本
            max_chunk_size: 每个分段的最大字符数
            overlap_size: 重叠字符数
        
        Returns:
            分割结果
        """
        try:
            if not text.strip():
                return {'success': False, 'error': '文本为空'}
            
            # 如果文本较短，直接返回
            if len(text) <= max_chunk_size:
                return {
                    'success': True,
                    'chunks': [text],
                    'total_chunks': 1,
                    'method': 'no_split'
                }
            
            # 先尝试使用TextUtils进行基础分割
            basic_chunks = TextUtils.split_text_by_sentences(text, max_chunk_size)
            
            if len(basic_chunks) <= 1:
                return {
                    'success': True,
                    'chunks': basic_chunks,
                    'total_chunks': len(basic_chunks),
                    'method': 'basic_split'
                }
            
            # 使用AI进行智能分割（对于较长文档）
            if len(text) > max_chunk_size * 2:
                ai_result = await self._intelligent_split(text, max_chunk_size)
                if ai_result.get('success'):
                    return ai_result
            
            # 回退到基础分割
            return {
                'success': True,
                'chunks': basic_chunks,
                'total_chunks': len(basic_chunks),
                'method': 'basic_split'
            }
            
        except Exception as e:
            self.log_error(f"文档分割失败: {e}")
            return {'success': False, 'error': str(e)}
    
    async def _intelligent_split(self, text: str, max_chunk_size: int) -> Dict[str, Any]:
        """使用AI进行智能分割"""
        try:
            # 构造分割提示词
            prompt = f"""
请分析以下文档并将其分割成逻辑段落。每个段落应该：
1. 保持语义完整性
2. 不超过{max_chunk_size}个字符
3. 在合适的位置分割，避免句子中断

文档内容：
{text}

请返回分割后的段落列表，每个段落用 "---CHUNK---" 分隔。
"""
            
            # 生成分割结果
            response = self.model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    temperature=0.1,
                    max_output_tokens=self.config.max_tokens
                )
            )
            
            # 解析AI返回的结果
            result_text = response.text.strip()
            chunks = [chunk.strip() for chunk in result_text.split("---CHUNK---") if chunk.strip()]
            
            if not chunks:
                # AI分割失败，回退到基础分割
                return {'success': False, 'error': 'AI分割失败'}
            
            return {
                'success': True,
                'chunks': chunks,
                'total_chunks': len(chunks),
                'method': 'ai_split'
            }
            
        except Exception as e:
            self.log_error(f"AI分割失败: {e}")
            return {'success': False, 'error': str(e)}
    
    async def analyze_document(self, text: str) -> Dict[str, Any]:
        """
        分析文档内容
        
        Args:
            text: 要分析的文本
        
        Returns:
            分析结果
        """
        try:
            if not text.strip():
                return {'success': False, 'error': '文本为空'}
            
            # 构造分析提示词
            prompt = f"""
请分析以下文档并提供以下信息：
1. 文档类型和主题
2. 主要内容概述
3. 文档结构分析
4. 关键信息提取
5. 建议的处理方式

文档内容：
{text[:2000]}{'...' if len(text) > 2000 else ''}

请以JSON格式返回分析结果。
"""
            
            # 生成分析结果
            response = self.model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    temperature=0.2,
                    max_output_tokens=self.config.max_tokens
                )
            )
            
            analysis = response.text.strip()
            
            return {
                'success': True,
                'analysis': analysis,
                'document_length': len(text),
                'model_used': self.config.model
            }
            
        except Exception as e:
            self.log_error(f"文档分析失败: {e}")
            return {'success': False, 'error': str(e)}
    
    async def batch_translate(self, 
                            texts: List[str], 
                            source_lang: str = 'en',
                            target_lang: str = 'zh',
                            max_concurrent: int = 3) -> Dict[str, Any]:
        """
        批量翻译文本
        
        Args:
            texts: 要翻译的文本列表
            source_lang: 源语言
            target_lang: 目标语言
            max_concurrent: 最大并发数
        
        Returns:
            批量翻译结果
        """
        if not texts:
            return {'success': False, 'error': '没有要翻译的文本'}
        
        semaphore = asyncio.Semaphore(max_concurrent)
        
        async def translate_single(text: str) -> Dict[str, Any]:
            async with semaphore:
                return await self.translate_text(text, source_lang, target_lang)
        
        # 并行翻译
        tasks = [translate_single(text) for text in texts]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        successful = []
        failed = []
        
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                failed.append({
                    'index': i,
                    'text': texts[i][:50] + '...' if len(texts[i]) > 50 else texts[i],
                    'error': str(result)
                })
            elif isinstance(result, dict) and result.get('success'):
                successful.append({
                    'index': i,
                    'original': texts[i],
                    'translation': result['translation']
                })
            else:
                error_msg = result.get('error', '未知错误') if isinstance(result, dict) else '未知错误'
                failed.append({
                    'index': i,
                    'text': texts[i][:50] + '...' if len(texts[i]) > 50 else texts[i],
                    'error': error_msg
                })
        
        return {
            'success': len(successful) > 0,
            'total': len(texts),
            'successful': len(successful),
            'failed': len(failed),
            'successful_translations': successful,
            'failed_translations': failed
        }
    
    def _get_model_config(self) -> Dict[str, Any]:
        """获取模型配置"""
        return {
            'model': self.config.model,
            'fallback_model': self.config.fallback_model,
            'temperature': self.config.temperature,
            'max_tokens': self.config.max_tokens
        } 