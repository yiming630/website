"""
文本工具模块
"""

import re
from typing import List, Dict, Optional
import unicodedata


class TextUtils:
    """文本处理工具类"""
    
    @staticmethod
    def clean_text(text: str) -> str:
        """清理文本，移除多余空格和特殊字符"""
        if not text:
            return ""
        
        # 移除控制字符
        text = ''.join(char for char in text if unicodedata.category(char)[0] != 'C')
        
        # 规范化空格
        text = re.sub(r'\s+', ' ', text)
        
        # 移除首尾空格
        text = text.strip()
        
        return text
    
    @staticmethod
    def split_text_by_sentences(text: str, max_length: int = 1000) -> List[str]:
        """
        按句子分割文本，保持语义完整性
        
        Args:
            text: 要分割的文本
            max_length: 每段的最大长度
        
        Returns:
            分割后的文本段落列表
        """
        if not text:
            return []
        
        # 句子分割正则表达式
        sentence_pattern = r'[.!?。！？]+\s*'
        sentences = re.split(sentence_pattern, text)
        
        # 移除空句子
        sentences = [s.strip() for s in sentences if s.strip()]
        
        chunks = []
        current_chunk = ""
        
        for sentence in sentences:
            # 如果当前句子本身就超过最大长度，需要进一步分割
            if len(sentence) > max_length:
                # 保存当前chunk
                if current_chunk:
                    chunks.append(current_chunk.strip())
                    current_chunk = ""
                
                # 分割长句子
                sub_chunks = TextUtils._split_long_sentence(sentence, max_length)
                chunks.extend(sub_chunks)
            else:
                # 检查添加这个句子是否会超过长度限制
                if len(current_chunk) + len(sentence) + 1 <= max_length:
                    current_chunk += sentence + " "
                else:
                    # 保存当前chunk并开始新的chunk
                    if current_chunk:
                        chunks.append(current_chunk.strip())
                    current_chunk = sentence + " "
        
        # 添加最后一个chunk
        if current_chunk:
            chunks.append(current_chunk.strip())
        
        return chunks
    
    @staticmethod
    def _split_long_sentence(sentence: str, max_length: int) -> List[str]:
        """分割超长句子"""
        if len(sentence) <= max_length:
            return [sentence]
        
        # 尝试在标点符号处分割
        punctuation_pattern = r'[,;:，；：]+\s*'
        parts = re.split(punctuation_pattern, sentence)
        
        if len(parts) > 1:
            chunks = []
            current_chunk = ""
            
            for part in parts:
                if len(current_chunk) + len(part) + 1 <= max_length:
                    current_chunk += part + " "
                else:
                    if current_chunk:
                        chunks.append(current_chunk.strip())
                    current_chunk = part + " "
            
            if current_chunk:
                chunks.append(current_chunk.strip())
            
            return chunks
        
        # 如果没有合适的分割点，按字符强制分割
        chunks = []
        start = 0
        while start < len(sentence):
            end = start + max_length
            if end >= len(sentence):
                chunks.append(sentence[start:])
                break
            
            # 尝试在空格处分割
            space_pos = sentence.rfind(' ', start, end)
            if space_pos != -1:
                chunks.append(sentence[start:space_pos])
                start = space_pos + 1
            else:
                chunks.append(sentence[start:end])
                start = end
        
        return chunks
    
    @staticmethod
    def extract_keywords(text: str, max_keywords: int = 10) -> List[str]:
        """提取关键词"""
        if not text:
            return []
        
        # 简单的关键词提取：统计词频
        # 移除标点符号
        text = re.sub(r'[^\w\s]', ' ', text)
        
        # 分割为单词
        words = text.lower().split()
        
        # 过滤短词和常见词
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'can', 'may', 'might', 'must', 'shall', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'}
        
        words = [word for word in words if len(word) > 2 and word not in stop_words]
        
        # 统计词频
        word_count = {}
        for word in words:
            word_count[word] = word_count.get(word, 0) + 1
        
        # 按频率排序
        sorted_words = sorted(word_count.items(), key=lambda x: x[1], reverse=True)
        
        # 返回前N个关键词
        return [word for word, count in sorted_words[:max_keywords]]
    
    @staticmethod
    def estimate_reading_time(text: str, words_per_minute: int = 200) -> int:
        """估算阅读时间（分钟）"""
        if not text:
            return 0
        
        word_count = len(text.split())
        return max(1, word_count // words_per_minute)
    
    @staticmethod
    def truncate_text(text: str, max_length: int, suffix: str = "...") -> str:
        """截断文本"""
        if len(text) <= max_length:
            return text
        
        return text[:max_length - len(suffix)] + suffix
    
    @staticmethod
    def count_tokens_estimate(text: str) -> int:
        """估算token数量（简单方法）"""
        if not text:
            return 0
        
        # 简单估算：英文约4个字符=1个token，中文约1.5个字符=1个token
        chinese_chars = len(re.findall(r'[\u4e00-\u9fff]', text))
        other_chars = len(text) - chinese_chars
        
        return int(chinese_chars / 1.5 + other_chars / 4)
    
    @staticmethod
    def normalize_whitespace(text: str) -> str:
        """规范化空白字符"""
        if not text:
            return ""
        
        # 替换各种空白字符为标准空格
        text = re.sub(r'\s+', ' ', text)
        
        # 移除首尾空格
        text = text.strip()
        
        return text
    
    @staticmethod
    def remove_html_tags(text: str) -> str:
        """移除HTML标签"""
        if not text:
            return ""
        
        # 移除HTML标签
        text = re.sub(r'<[^>]+>', '', text)
        
        # 解码HTML实体
        html_entities = {
            '&amp;': '&',
            '&lt;': '<',
            '&gt;': '>',
            '&quot;': '"',
            '&apos;': "'",
            '&nbsp;': ' '
        }
        
        for entity, char in html_entities.items():
            text = text.replace(entity, char)
        
        return text 