"""
PDF分割器 - 将PDF分割为多个PDF文件，然后转换为DOCX
"""
import os
import logging
from typing import List, Dict, Any, Tuple
from pypdf import PdfReader, PdfWriter
import tempfile
from .gemini_client import GeminiClient
from .wps_client import WPSClient
from . import config

logger = logging.getLogger(__name__)


class PDFSplitter:
    """PDF分割器 - 将PDF分割为多个PDF文件，然后转换为DOCX"""
    
    def __init__(self):
        """初始化PDF分割器"""
        self.gemini_client = GeminiClient()
        self.wps_client = WPSClient()
        
    def extract_text_from_pdf(self, pdf_path: str) -> str:
        """从PDF文件中提取文本内容
        
        Args:
            pdf_path: PDF文件路径
            
        Returns:
            提取的文本内容
        """
        try:
            logger.info(f"开始从PDF提取文本: {pdf_path}")
            
            reader = PdfReader(pdf_path)
            text_content = ""
            
            for page_num, page in enumerate(reader.pages, 1):
                try:
                    page_text = page.extract_text()
                    if page_text.strip():
                        text_content += f"\n--- 第{page_num}页 ---\n{page_text}\n"
                except Exception as e:
                    logger.warning(f"提取第{page_num}页文本时出错: {e}")
                    continue
            
            if not text_content.strip():
                raise ValueError("未能从PDF中提取到任何文本内容")
                
            logger.info(f"成功提取文本，总长度: {len(text_content)} 字符")
            return text_content
            
        except Exception as e:
            logger.error(f"提取PDF文本失败: {e}")
            raise
    
    def split_pdf_by_pages(self, pdf_path: str, page_ranges: List[Tuple[int, int]]) -> List[str]:
        """根据页码范围分割PDF文件
        
        Args:
            pdf_path: 原始PDF文件路径
            page_ranges: 页码范围列表，格式为[(start, end), ...]，页码从1开始
            
        Returns:
            分割后的PDF文件路径列表
        """
        try:
            logger.info(f"开始分割PDF: {pdf_path}")
            logger.info(f"分割范围: {page_ranges}")
            
            reader = PdfReader(pdf_path)
            total_pages = len(reader.pages)
            
            # 验证页码范围
            for start, end in page_ranges:
                if start < 1 or end > total_pages or start > end:
                    raise ValueError(f"无效的页码范围: {start}-{end}，PDF总页数: {total_pages}")
            
            # 创建输出目录
            base_name = os.path.splitext(os.path.basename(pdf_path))[0]
            output_dir = os.path.join(str(config.DOCX_RAW_DIR), f"{base_name}_split")
            os.makedirs(output_dir, exist_ok=True)
            
            split_files = []
            
            for i, (start_page, end_page) in enumerate(page_ranges, 1):
                # 创建新的PDF文件
                writer = PdfWriter()
                
                # 添加指定范围的页面（转换为0-based索引）
                for page_num in range(start_page - 1, end_page):
                    writer.add_page(reader.pages[page_num])
                
                # 保存分割后的PDF
                split_filename = f"{base_name}_part{i}_pages{start_page}-{end_page}.pdf"
                split_path = os.path.join(output_dir, split_filename)
                
                with open(split_path, 'wb') as output_file:
                    writer.write(output_file)
                
                split_files.append(split_path)
                logger.info(f"创建分割文件: {split_filename} (页面 {start_page}-{end_page})")
            
            logger.info(f"PDF分割完成，生成 {len(split_files)} 个文件")
            return split_files
            
        except Exception as e:
            logger.error(f"分割PDF失败: {e}")
            raise
    
    def convert_split_pdfs_to_docx(self, pdf_files: List[str]) -> List[str]:
        """将分割后的PDF文件转换为DOCX
        
        Args:
            pdf_files: PDF文件路径列表
            
        Returns:
            转换后的DOCX文件路径列表
        """
        try:
            logger.info(f"开始转换 {len(pdf_files)} 个PDF文件为DOCX")
            
            docx_files = []
            failed_files = []
            
            for pdf_path in pdf_files:
                try:
                    logger.info(f"转换文件: {os.path.basename(pdf_path)}")
                    
                    # 生成DOCX文件路径
                    base_name = os.path.splitext(os.path.basename(pdf_path))[0]
                    docx_path = os.path.join(str(config.DOCX_SPLIT_DIR), f"{base_name}.docx")
                    
                    # 调用WPS API转换
                    success = self.wps_client.convert_pdf_to_docx(pdf_path, docx_path)
                    
                    if success and os.path.exists(docx_path):
                        docx_files.append(docx_path)
                        logger.info(f"转换成功: {os.path.basename(docx_path)}")
                    else:
                        failed_files.append(pdf_path)
                        logger.error(f"转换失败: {os.path.basename(pdf_path)}")
                        
                except Exception as e:
                    logger.error(f"转换文件 {pdf_path} 时出错: {e}")
                    failed_files.append(pdf_path)
            
            if failed_files:
                logger.warning(f"转换失败的文件: {[os.path.basename(f) for f in failed_files]}")
            
            logger.info(f"转换完成，成功: {len(docx_files)} 个，失败: {len(failed_files)} 个")
            return docx_files
            
        except Exception as e:
            logger.error(f"批量转换失败: {e}")
            raise
    
    def split_and_convert_pdf(self, pdf_path: str, custom_prompt: str = None) -> Dict[str, Any]:
        """分割PDF并转换为DOCX文件
        
        Args:
            pdf_path: PDF文件路径
            custom_prompt: 自定义分割提示词
            
        Returns:
            处理结果字典
        """
        try:
            logger.info(f"开始处理PDF文件: {pdf_path}")
            
            # 步骤1: 提取PDF文本内容
            text_content = self.extract_text_from_pdf(pdf_path)
            
            # 步骤2: 使用Gemini分析文档结构
            logger.info("使用Gemini分析文档结构...")
            split_result = self.gemini_client.split_document_content(text_content, custom_prompt)
            
            if not split_result.get('success', False):
                raise ValueError(f"Gemini分析失败: {split_result.get('error', '未知错误')}")
            
            sections = split_result.get('sections', [])
            if not sections:
                raise ValueError("Gemini未返回任何分割结果")
            
            # 步骤3: 根据分析结果计算页码范围
            page_ranges = []
            for section in sections:
                # 这里需要将文本位置转换为页码范围
                # 为简化，我们按照section数量平均分配页码
                # 实际应用中可能需要更精确的页码定位算法
                pass
            
            # 临时实现：按section数量平均分割
            reader = PdfReader(pdf_path)
            total_pages = len(reader.pages)
            section_count = len(sections)
            pages_per_section = max(1, total_pages // section_count)
            
            for i in range(section_count):
                start_page = i * pages_per_section + 1
                if i == section_count - 1:  # 最后一个section包含剩余所有页面
                    end_page = total_pages
                else:
                    end_page = (i + 1) * pages_per_section
                page_ranges.append((start_page, end_page))
            
            logger.info(f"计算的页码范围: {page_ranges}")
            
            # 步骤4: 分割PDF文件
            split_pdf_files = self.split_pdf_by_pages(pdf_path, page_ranges)
            
            # 步骤5: 转换为DOCX
            docx_files = self.convert_split_pdfs_to_docx(split_pdf_files)
            
            # 步骤6: 重命名DOCX文件为有意义的名称
            renamed_files = []
            for i, (docx_path, section) in enumerate(zip(docx_files, sections)):
                section_title = section.get('title', f'Section_{i+1}')
                # 清理文件名中的特殊字符
                safe_title = "".join(c for c in section_title if c.isalnum() or c in (' ', '-', '_')).rstrip()
                safe_title = safe_title.replace(' ', '_')[:50]  # 限制长度
                
                new_filename = f"{safe_title}.docx"
                new_path = os.path.join(str(config.DOCX_SPLIT_DIR), new_filename)
                
                # 如果目标文件已存在，添加序号
                counter = 1
                while os.path.exists(new_path):
                    name_part = safe_title
                    new_filename = f"{name_part}_{counter}.docx"
                    new_path = os.path.join(str(config.DOCX_SPLIT_DIR), new_filename)
                    counter += 1
                
                try:
                    os.rename(docx_path, new_path)
                    renamed_files.append(new_path)
                    logger.info(f"重命名文件: {os.path.basename(docx_path)} -> {new_filename}")
                except Exception as e:
                    logger.warning(f"重命名文件失败: {e}")
                    renamed_files.append(docx_path)
            
            result = {
                'success': True,
                'original_file': pdf_path,
                'sections_analyzed': len(sections),
                'pdf_files_created': len(split_pdf_files),
                'docx_files_created': len(renamed_files),
                'output_files': renamed_files,
                'gemini_analysis': split_result
            }
            
            logger.info(f"PDF分割转换完成: {os.path.basename(pdf_path)}")
            return result
            
        except Exception as e:
            logger.error(f"处理PDF失败: {e}")
            return {
                'success': False,
                'error': str(e),
                'original_file': pdf_path
            }
    
    def batch_split_and_convert_pdfs(self, pdf_directory: str = None, custom_prompt: str = None) -> Dict[str, Any]:
        """批量分割和转换PDF文件
        
        Args:
            pdf_directory: PDF文件目录，默认使用配置的PDF目录
            custom_prompt: 自定义分割提示词
            
        Returns:
            批量处理结果
        """
        try:
            if pdf_directory is None:
                pdf_directory = str(config.PDF_DIR)
            
            logger.info(f"开始批量处理PDF目录: {pdf_directory}")
            
            # 查找所有PDF文件
            pdf_files = []
            for file in os.listdir(pdf_directory):
                if file.lower().endswith('.pdf'):
                    pdf_files.append(os.path.join(pdf_directory, file))
            
            if not pdf_files:
                return {
                    'success': False,
                    'error': f'在目录 {pdf_directory} 中未找到PDF文件'
                }
            
            logger.info(f"找到 {len(pdf_files)} 个PDF文件")
            
            # 批量处理
            results = []
            successful_count = 0
            failed_count = 0
            
            for pdf_file in pdf_files:
                logger.info(f"处理文件 {os.path.basename(pdf_file)} ({len(results)+1}/{len(pdf_files)})")
                
                result = self.split_and_convert_pdf(pdf_file, custom_prompt)
                results.append(result)
                
                if result.get('success', False):
                    successful_count += 1
                else:
                    failed_count += 1
            
            batch_result = {
                'success': True,
                'total_files': len(pdf_files),
                'successful_count': successful_count,
                'failed_count': failed_count,
                'results': results
            }
            
            logger.info(f"批量处理完成: 成功 {successful_count} 个，失败 {failed_count} 个")
            return batch_result
            
        except Exception as e:
            logger.error(f"批量处理失败: {e}")
            return {
                'success': False,
                'error': str(e)
            }


def main():
    """测试函数"""
    import argparse
    
    parser = argparse.ArgumentParser(description='PDF智能分割工具')
    parser.add_argument('--input', type=str, default=str(config.PDF_DIR),
                       help='输入PDF目录')
    parser.add_argument('--output', type=str, default=str(config.DOCX_SPLIT_DIR),
                       help='输出目录')
    parser.add_argument('--format', choices=['docx', 'txt'], default='docx',
                       help='输出格式')
    parser.add_argument('--files', nargs='+', type=str,
                       help='指定要处理的PDF文件')
    
    args = parser.parse_args()
    
    # 配置日志
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # 创建分割器并执行
    splitter = PDFSplitter()
    
    if args.files:
        # 处理指定文件
        for pdf_file in args.files:
            try:
                splitter.split_and_convert_pdf(pdf_file)
            except Exception as e:
                print(f"❌ 处理失败 {pdf_file}: {e}")
    else:
        # 批量处理
        result = splitter.batch_split_and_convert_pdfs(
            pdf_directory=args.input
        )
        
        print(f"\n处理完成！")
        print(f"总计: {result['total_files']} 个文件")
        print(f"成功: {result['successful_count']} 个文件")
        print(f"失败: {result['failed_count']} 个文件")
        print(f"生成: {len(result['results'])} 个输出文件")


if __name__ == '__main__':
    main() 