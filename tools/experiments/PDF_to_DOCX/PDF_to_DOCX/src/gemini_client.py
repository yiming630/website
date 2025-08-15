"""
Gemini API客户端 - 用于智能分割DOCX文档
"""
import json
import logging
from pathlib import Path
from typing import List, Dict, Optional
import google.generativeai as genai
from tenacity import retry, stop_after_attempt, wait_exponential
from .config import GEMINI_API_KEY, GEMINI_MODEL, SPLIT_MAX_TOKENS, RETRY_TIMES

logger = logging.getLogger(__name__)


class GeminiClient:
    """Google Gemini API客户端"""
    
    def __init__(self, api_key: str = GEMINI_API_KEY, model: str = GEMINI_MODEL):
        self.api_key = api_key
        self.model_name = model
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(model)
    
    @retry(stop=stop_after_attempt(RETRY_TIMES), wait=wait_exponential(multiplier=1, min=4))
    def split_text(self, text: str, max_tokens: int = SPLIT_MAX_TOKENS) -> List[str]:
        """
        使用Gemini智能分割文本，保持句子完整性
        
        Args:
            text: 要分割的文本
            max_tokens: 每段的最大token数
            
        Returns:
            分割后的文本段落列表
        """
        if not text.strip():
            return []
        
        # 构建提示词
        prompt = f"""你是一名专业的文档编辑助手。请帮我将以下文本智能分割成多个段落，要求：

1. 每个段落大约包含{max_tokens//4}到{max_tokens//2}个中文字符
2. 必须保持句子的完整性，不能在句子中间断开
3. 尽量在自然的段落边界处分割（如段落结束、章节转换等）
4. 保留原文的所有内容，不要遗漏任何文字
5. 返回JSON格式，包含一个"segments"数组，每个元素是一个分割后的文本段

示例输出格式：
{{
  "segments": [
    "第一段文本内容...",
    "第二段文本内容...",
    "第三段文本内容..."
  ]
}}

需要分割的文本：
{text}"""
        
        try:
            response = self.model.generate_content(prompt)
            result_text = response.text.strip()
            
            # 解析JSON响应
            # 处理可能的markdown代码块
            if result_text.startswith('```json'):
                result_text = result_text[7:]
            if result_text.startswith('```'):
                result_text = result_text[3:]
            if result_text.endswith('```'):
                result_text = result_text[:-3]
            
            result = json.loads(result_text.strip())
            segments = result.get('segments', [])
            
            # 验证分割结果
            if not segments:
                logger.warning("Gemini返回空的分割结果，使用简单分割")
                return self._simple_split(text, max_tokens)
            
            # 验证没有内容丢失
            combined = ''.join(segments).replace(' ', '').replace('\n', '')
            original = text.replace(' ', '').replace('\n', '')
            if len(combined) < len(original) * 0.95:  # 允许5%的误差
                logger.warning("分割后可能有内容丢失，使用简单分割")
                return self._simple_split(text, max_tokens)
            
            logger.info(f"成功将文本分割成 {len(segments)} 段")
            return segments
            
        except Exception as e:
            logger.error(f"Gemini分割失败: {e}")
            # 降级到简单分割
            return self._simple_split(text, max_tokens)
    
    def _simple_split(self, text: str, max_tokens: int) -> List[str]:
        """简单的基于句子的文本分割（降级方案）"""
        # 中文句子分隔符
        sentence_endings = ['。', '！', '？', '；', '\n\n']
        
        segments = []
        current_segment = []
        current_length = 0
        
        # 按句子分割
        sentences = []
        temp = text
        for ending in sentence_endings:
            parts = temp.split(ending)
            if len(parts) > 1:
                for i, part in enumerate(parts[:-1]):
                    sentences.append(part + ending)
                temp = parts[-1]
        if temp:
            sentences.append(temp)
        
        # 组合句子到段落
        for sentence in sentences:
            sentence_length = len(sentence)
            
            if current_length + sentence_length > max_tokens//2 and current_segment:
                segments.append(''.join(current_segment))
                current_segment = [sentence]
                current_length = sentence_length
            else:
                current_segment.append(sentence)
                current_length += sentence_length
        
        if current_segment:
            segments.append(''.join(current_segment))
        
        return segments
    
    def analyze_document_structure(self, text: str) -> Dict:
        """分析文档结构，识别章节、段落等"""
        prompt = f"""分析以下文档的结构，识别：
1. 主要章节标题
2. 段落结构
3. 关键内容区块
4. 建议的分割点

返回JSON格式的分析结果。

文档内容：
{text[:2000]}...  # 只发送前2000字符作为样本
"""
        
        try:
            response = self.model.generate_content(prompt)
            result_text = response.text.strip()
            
            # 解析JSON
            if result_text.startswith('```json'):
                result_text = result_text[7:]
            if result_text.startswith('```'):
                result_text = result_text[3:]
            if result_text.endswith('```'):
                result_text = result_text[:-3]
            
            return json.loads(result_text.strip())
            
        except Exception as e:
            logger.error(f"文档结构分析失败: {e}")
            return {
                "chapters": [],
                "paragraphs": [],
                "key_sections": []
            } 