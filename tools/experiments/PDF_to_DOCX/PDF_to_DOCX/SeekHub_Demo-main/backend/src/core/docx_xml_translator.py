#!/usr/bin/env python3
"""
路线A - 极简XML替换法DOCX翻译器
只修改 <w:t> 节点内容，完全保留原始排版和图片位置
支持多格式导出：PDF、HTML、Markdown、纯文本等
"""

import os
import sys
import zipfile
import shutil
import tempfile
import pathlib
import asyncio
import argparse
from typing import List, Dict, Optional
from lxml import etree

# 添加src路径
sys.path.append(str(pathlib.Path(__file__).parent / 'src'))

from src.core.gemini_client import HighSpeedGeminiTranslator
from exporters import FormatExporter

class DocxXmlTranslator:
    """基于XML直接替换的DOCX翻译器"""
    
    def __init__(self):
        self.translator = HighSpeedGeminiTranslator()
        self.exporter = FormatExporter()
        self.ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
        
    async def translate_text(self, text: str, target_lang: str = "Chinese") -> str:
        """翻译单个文本"""
        if not text.strip():
            return text
        try:
            result = await self.translator.translate_text(text, target_lang)
            return result if result else text
        except Exception as e:
            print(f"   ⚠️  翻译失败: {text[:50]}... -> {e}")
            return text
    
    async def translate_batch(self, texts: List[str], target_lang: str = "Chinese") -> List[str]:
        """批量翻译文本"""
        print(f"   🔄 批量翻译 {len(texts)} 个文本段...")
        tasks = [self.translate_text(text, target_lang) for text in texts]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # 处理异常结果
        final_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                print(f"   ❌ 翻译异常: {texts[i][:30]}... -> {result}")
                final_results.append(texts[i])  # 保持原文
            else:
                final_results.append(result)
        
        return final_results
    
    def extract_docx(self, src_path: pathlib.Path) -> pathlib.Path:
        """解压DOCX文件"""
        print("📦 解压DOCX文件...")
        tmp_dir = pathlib.Path(tempfile.mkdtemp())
        with zipfile.ZipFile(src_path, 'r') as zf:
            zf.extractall(tmp_dir)
        print(f"   ✅ 解压到: {tmp_dir}")
        return tmp_dir
    
    def find_text_elements(self, xml_dir: pathlib.Path) -> List[tuple]:
        """找到所有包含文本的XML文件和元素"""
        print("🔍 查找文本元素...")
        text_elements = []
        
        # 需要处理的XML文件
        xml_files = []
        
        # 主文档
        doc_xml = xml_dir / "word" / "document.xml"
        if doc_xml.exists():
            xml_files.append(("document", doc_xml))
        
        # 页眉页脚
        word_dir = xml_dir / "word"
        if word_dir.exists():
            for xml_file in word_dir.glob("header*.xml"):
                xml_files.append(("header", xml_file))
            for xml_file in word_dir.glob("footer*.xml"):
                xml_files.append(("footer", xml_file))
        
        # 解析每个XML文件
        for file_type, xml_file in xml_files:
            try:
                tree = etree.parse(str(xml_file))
                t_elements = tree.xpath("//w:t", namespaces=self.ns)
                for elem in t_elements:
                    if elem.text and elem.text.strip():
                        text_elements.append((file_type, xml_file, elem, elem.text))
                print(f"   📄 {file_type}: 找到 {len(t_elements)} 个文本元素")
            except Exception as e:
                print(f"   ❌ 解析 {xml_file} 失败: {e}")
        
        print(f"   ✅ 总共找到 {len(text_elements)} 个文本元素")
        return text_elements
    
    async def translate_elements(self, text_elements: List[tuple], target_lang: str = "Chinese"):
        """翻译所有文本元素"""
        print(f"🤖 开始翻译为 {target_lang}...")
        
        # 提取所有文本
        texts = [elem[3] for elem in text_elements]
        
        # 批量翻译（分批处理避免超时）
        batch_size = 50
        translated_texts = []
        
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i+batch_size]
            batch_results = await self.translate_batch(batch, target_lang)
            translated_texts.extend(batch_results)
            print(f"   📊 进度: {min(i+batch_size, len(texts))}/{len(texts)}")
        
        # 应用翻译结果
        for (file_type, xml_file, elem, original), translation in zip(text_elements, translated_texts):
            elem.text = translation
            if original != translation:
                print(f"   🔄 {file_type}: '{original[:30]}...' -> '{translation[:30]}...'")
        
        # 保存修改后的XML文件
        modified_files = set()
        for file_type, xml_file, elem, original in text_elements:
            if xml_file not in modified_files:
                tree = elem.getroottree()
                tree.write(str(xml_file), xml_declaration=True, encoding="utf-8")
                modified_files.add(xml_file)
        
        print(f"   ✅ 已修改 {len(modified_files)} 个XML文件")
    
    def repack_docx(self, xml_dir: pathlib.Path, output_path: pathlib.Path):
        """重新打包DOCX文件"""
        print("📦 重新打包DOCX...")
        with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zf:
            for file_path in xml_dir.rglob("*"):
                if file_path.is_file():
                    arc_path = file_path.relative_to(xml_dir)
                    zf.write(file_path, arc_path)
        print(f"   ✅ 已生成: {output_path}")
    
    def cleanup(self, tmp_dir: pathlib.Path):
        """清理临时文件"""
        shutil.rmtree(tmp_dir, ignore_errors=True)
        print("🧹 已清理临时文件")
    
    async def translate_docx(self, src_path: str, output_path: str, 
                           target_lang: str = "Chinese", 
                           export_formats: Optional[List[str]] = None):
        """完整的DOCX翻译流程，支持多格式导出"""
        src = pathlib.Path(src_path)
        output = pathlib.Path(output_path)
        
        print(f"🚀 开始翻译DOCX: {src} -> {output}")
        print("=" * 60)
        
        if not src.exists():
            raise FileNotFoundError(f"源文件不存在: {src}")
        
        tmp_dir = None
        try:
            # 1. 解压DOCX
            tmp_dir = self.extract_docx(src)
            
            # 2. 查找文本元素
            text_elements = self.find_text_elements(tmp_dir)
            
            if not text_elements:
                print("⚠️  未找到可翻译的文本")
                return
            
            # 3. 翻译文本
            await self.translate_elements(text_elements, target_lang)
            
            # 4. 重新打包
            self.repack_docx(tmp_dir, output)
            
            print("=" * 60)
            print("🎉 翻译完成!")
            print(f"📄 原文件: {src}")
            print(f"📄 译文件: {output}")
            print(f"📊 翻译了 {len(text_elements)} 个文本段")
            
            # 5. 多格式导出（如果指定）
            if export_formats and len(export_formats) > 0:
                # 过滤掉docx格式（已经生成）
                formats_to_export = [fmt for fmt in export_formats if fmt.lower() != 'docx']
                if formats_to_export:
                    print("\n" + "=" * 60)
                    export_results = self.exporter.export_multiple_formats(output, formats_to_export)
                    
                    # 显示导出结果
                    print("\n📚 导出文件列表:")
                    print(f"   DOCX: {output}")
                    for fmt, path in export_results.items():
                        if path:
                            print(f"   {fmt.upper()}: {path}")
            
        except Exception as e:
            print(f"❌ 翻译失败: {e}")
            raise
        finally:
            if tmp_dir:
                self.cleanup(tmp_dir)

async def main():
    """主函数 - 支持命令行参数"""
    parser = argparse.ArgumentParser(
        description="DOCX XML翻译器 - 路线A (极简XML替换法)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
支持的导出格式:
  pdf   - PDF文档（需要docx2pdf或LibreOffice）
  html  - HTML网页（需要mammoth）
  md    - Markdown文档（需要pypandoc或使用简化方案）
  txt   - 纯文本文件

示例:
  python docx_xml_translator.py
  python docx_xml_translator.py --formats pdf
  python docx_xml_translator.py --formats pdf,html,md
  python docx_xml_translator.py --input mydoc.docx --output translated.docx --formats pdf,html
        """
    )
    
    parser.add_argument('--input', '-i', 
                       default='complex_document.docx',
                       help='输入DOCX文件路径 (默认: complex_document.docx)')
    
    parser.add_argument('--output', '-o',
                       default='complex_translated.docx',
                       help='输出DOCX文件路径 (默认: complex_translated.docx)')
    
    parser.add_argument('--formats', '-f',
                       help='导出格式，逗号分隔 (如: pdf,html,md,txt)')
    
    parser.add_argument('--lang', '-l',
                       default='Chinese',
                       help='目标语言 (默认: Chinese)')
    
    args = parser.parse_args()
    
    print("🚀 DOCX XML 翻译器 - 路线A (极简XML替换法)")
    print("=" * 60)
    
    # 检查API密钥
    if not os.getenv('GEMINI_API_KEYS'):
        print("❌ 请先设置 GEMINI_API_KEYS 环境变量")
        return
    
    # 检查输入文件
    if not pathlib.Path(args.input).exists():
        print(f"❌ 输入文件不存在: {args.input}")
        if args.input == 'complex_document.docx':
            print("💡 请先运行 create_complex_docx.py 创建测试文档")
        return
    
    # 解析导出格式
    export_formats = []
    if args.formats:
        export_formats = [fmt.strip().lower() for fmt in args.formats.split(',') if fmt.strip()]
        print(f"📋 指定导出格式: {', '.join(export_formats)}")
    
    # 创建翻译器并执行
    translator = DocxXmlTranslator()
    await translator.translate_docx(args.input, args.output, args.lang, export_formats)

if __name__ == "__main__":
    asyncio.run(main()) 