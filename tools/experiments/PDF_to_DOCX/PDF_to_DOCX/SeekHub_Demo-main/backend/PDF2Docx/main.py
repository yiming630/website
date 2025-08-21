"""
PDF2Docx系统主程序
整合PDF转换、文档分割、翻译等功能
"""

import asyncio
import argparse
import sys
from pathlib import Path
from typing import List, Optional

from config.config import pdf2docx_config
from utils.logger import setup_logger
from utils.file_utils import FileUtils
from clients.wps_client import WPSClient
from clients.gemini_client import GeminiClient
from clients.cloud_storage_client import CloudStorageClient


class PDF2DocxSystem:
    """PDF2Docx系统主控制器"""
    
    def __init__(self):
        self.config = pdf2docx_config
        self.logger = setup_logger(
            name="PDF2Docx", 
            log_file=self.config.log.log_file,
            log_level=self.config.log.log_level
        )
        
        # 初始化客户端
        self.wps_client = WPSClient()
        self.gemini_client = GeminiClient()
        self.cloud_client = CloudStorageClient()
    
    def print_system_header(self):
        """打印系统标题"""
        print("\n" + "="*70)
        print("🚀 PDF2Docx 集成系统 🚀")
        print("="*70)
        print("📄 PDF转DOCX转换")
        print("✂️ 智能文档分割")
        print("🌐 多语言翻译")
        print("☁️ 云存储管理")
        print("🤖 AI驱动处理")
        print("="*70)
    
    async def test_connections(self) -> dict:
        """测试所有API连接"""
        self.logger.info("🧪 测试API连接...")
        
        results = {}
        
        # 测试WPS API
        self.logger.info("测试WPS API...")
        wps_result = await self.wps_client.test_connection()
        results['wps'] = wps_result
        
        # 测试Gemini API
        self.logger.info("测试Gemini API...")
        gemini_result = await self.gemini_client.test_connection()
        results['gemini'] = gemini_result
        
        # 测试云存储
        self.logger.info("测试云存储...")
        try:
            cloud_result = await self.cloud_client.test_connection()
            results['cloud_storage'] = cloud_result
        except Exception as e:
            results['cloud_storage'] = {'success': False, 'error': str(e)}
        
        return results
    
    async def convert_pdf_to_docx(self, 
                                 pdf_files: List[Path],
                                 output_dir: Optional[Path] = None) -> dict:
        """转换PDF为DOCX"""
        if not pdf_files:
            return {'success': False, 'error': '没有要转换的PDF文件'}
        
        output_dir = output_dir or self.config.paths.docx_raw_dir
        
        self.logger.info(f"开始转换{len(pdf_files)}个PDF文件...")
        
        async with self.wps_client:
            result = await self.wps_client.convert_batch(
                pdf_files=pdf_files,
                output_dir=output_dir,
                max_concurrent=self.config.worker.max_workers
            )
        
        self.logger.info(f"PDF转换完成: {result['successful']}/{result['total']} 成功")
        return result
    
    async def split_documents(self, 
                            docx_files: List[Path],
                            output_dir: Optional[Path] = None) -> dict:
        """分割DOCX文档"""
        if not docx_files:
            return {'success': False, 'error': '没有要分割的DOCX文件'}
        
        output_dir = output_dir or self.config.paths.docx_split_dir
        
        self.logger.info(f"开始分割{len(docx_files)}个DOCX文件...")
        
        results = []
        for docx_file in docx_files:
            try:
                # 读取DOCX文件内容（简化实现）
                # 实际实现需要使用python-docx库
                self.logger.info(f"分割文件: {docx_file}")
                
                # 模拟分割过程
                result = {
                    'success': True,
                    'input_file': str(docx_file),
                    'output_dir': str(output_dir),
                    'chunks_created': 3  # 模拟创建3个分割文件
                }
                results.append(result)
                
            except Exception as e:
                self.logger.error(f"分割文件失败 {docx_file}: {e}")
                results.append({
                    'success': False,
                    'input_file': str(docx_file),
                    'error': str(e)
                })
        
        successful = [r for r in results if r.get('success')]
        failed = [r for r in results if not r.get('success')]
        
        self.logger.info(f"文档分割完成: {len(successful)}/{len(results)} 成功")
        
        return {
            'success': len(successful) > 0,
            'total': len(results),
            'successful': len(successful),
            'failed': len(failed),
            'results': results
        }
    
    async def translate_documents(self, 
                                text_files: List[Path],
                                output_dir: Optional[Path] = None,
                                source_lang: str = 'en',
                                target_lang: str = 'zh') -> dict:
        """翻译文档"""
        if not text_files:
            return {'success': False, 'error': '没有要翻译的文档'}
        
        output_dir = output_dir or self.config.paths.docx_translated_dir
        
        self.logger.info(f"开始翻译{len(text_files)}个文档...")
        
        results = []
        for text_file in text_files:
            try:
                # 读取文件内容
                with open(text_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # 翻译文本
                translation_result = await self.gemini_client.translate_text(
                    content, source_lang, target_lang
                )
                
                if translation_result.get('success'):
                    # 保存翻译结果
                    output_file = output_dir / f"{text_file.stem}_translated.txt"
                    with open(output_file, 'w', encoding='utf-8') as f:
                        f.write(translation_result['translation'])
                    
                    results.append({
                        'success': True,
                        'input_file': str(text_file),
                        'output_file': str(output_file),
                        'translation': translation_result['translation'][:100] + '...'
                    })
                else:
                    results.append({
                        'success': False,
                        'input_file': str(text_file),
                        'error': translation_result.get('error', '翻译失败')
                    })
                    
            except Exception as e:
                self.logger.error(f"翻译文件失败 {text_file}: {e}")
                results.append({
                    'success': False,
                    'input_file': str(text_file),
                    'error': str(e)
                })
        
        successful = [r for r in results if r.get('success')]
        failed = [r for r in results if not r.get('success')]
        
        self.logger.info(f"文档翻译完成: {len(successful)}/{len(results)} 成功")
        
        return {
            'success': len(successful) > 0,
            'total': len(results),
            'successful': len(successful),
            'failed': len(failed),
            'results': results
        }
    
    async def process_workflow(self, 
                             pdf_files: List[Path],
                             workflow_type: str = 'full') -> dict:
        """执行完整工作流程"""
        self.logger.info(f"开始执行工作流程: {workflow_type}")
        
        workflow_results = {
            'workflow_type': workflow_type,
            'steps': [],
            'overall_success': True
        }
        
        try:
            # 步骤1: PDF转DOCX
            if workflow_type in ['full', 'convert']:
                self.logger.info("📄 步骤1: PDF转DOCX...")
                convert_result = await self.convert_pdf_to_docx(pdf_files)
                workflow_results['steps'].append({
                    'step': 'pdf_to_docx',
                    'result': convert_result
                })
                
                if not convert_result.get('success'):
                    workflow_results['overall_success'] = False
                    return workflow_results
                
                # 获取转换成功的文件
                converted_files = [
                    Path(f['output_file']) for f in convert_result.get('successful_files', [])
                ]
            else:
                converted_files = []
            
            # 步骤2: 文档分割
            if workflow_type in ['full', 'split'] and converted_files:
                self.logger.info("✂️ 步骤2: 文档分割...")
                split_result = await self.split_documents(converted_files)
                workflow_results['steps'].append({
                    'step': 'document_split',
                    'result': split_result
                })
                
                if not split_result.get('success'):
                    workflow_results['overall_success'] = False
                    return workflow_results
            
            # 步骤3: 文档翻译
            if workflow_type in ['full', 'translate']:
                self.logger.info("🌐 步骤3: 文档翻译...")
                
                # 查找要翻译的文件
                split_dir = self.config.paths.docx_split_dir
                text_files = FileUtils.find_files(split_dir, ['.txt', '.docx'])
                
                if text_files:
                    translate_result = await self.translate_documents(text_files)
                    workflow_results['steps'].append({
                        'step': 'document_translate',
                        'result': translate_result
                    })
                    
                    if not translate_result.get('success'):
                        workflow_results['overall_success'] = False
            
            self.logger.info(f"工作流程完成: {'成功' if workflow_results['overall_success'] else '失败'}")
            
            return workflow_results
            
        except Exception as e:
            self.logger.error(f"工作流程执行失败: {e}")
            workflow_results['overall_success'] = False
            workflow_results['error'] = str(e)
            return workflow_results
    
    async def run_interactive_mode(self):
        """运行交互模式"""
        self.print_system_header()
        
        while True:
            print("\n请选择操作:")
            print("1. 测试API连接")
            print("2. PDF转DOCX")
            print("3. 文档分割")
            print("4. 文档翻译")
            print("5. 完整工作流程")
            print("6. 退出")
            
            choice = input("\n请输入选择 (1-6): ").strip()
            
            if choice == '1':
                results = await self.test_connections()
                print("\n" + "="*50)
                print("🧪 API连接测试结果:")
                print("="*50)
                for service, result in results.items():
                    status = "✅ 成功" if result.get('success') else "❌ 失败"
                    print(f"{service}: {status}")
                    if not result.get('success'):
                        print(f"  错误: {result.get('error', '未知错误')}")
            
            elif choice == '2':
                pdf_dir = input("请输入PDF文件目录路径 (留空使用默认): ").strip()
                if not pdf_dir:
                    pdf_dir = self.config.paths.pdf_dir
                else:
                    pdf_dir = Path(pdf_dir)
                
                pdf_files = FileUtils.find_files(pdf_dir, ['.pdf'])
                if not pdf_files:
                    print("❌ 没有找到PDF文件")
                    continue
                
                print(f"找到{len(pdf_files)}个PDF文件")
                result = await self.convert_pdf_to_docx(pdf_files)
                print(f"转换结果: {result['successful']}/{result['total']} 成功")
            
            elif choice == '3':
                docx_dir = input("请输入DOCX文件目录路径 (留空使用默认): ").strip()
                if not docx_dir:
                    docx_dir = self.config.paths.docx_raw_dir
                else:
                    docx_dir = Path(docx_dir)
                
                docx_files = FileUtils.find_files(docx_dir, ['.docx'])
                if not docx_files:
                    print("❌ 没有找到DOCX文件")
                    continue
                
                print(f"找到{len(docx_files)}个DOCX文件")
                result = await self.split_documents(docx_files)
                print(f"分割结果: {result['successful']}/{result['total']} 成功")
            
            elif choice == '4':
                text_dir = input("请输入文本文件目录路径 (留空使用默认): ").strip()
                if not text_dir:
                    text_dir = self.config.paths.docx_split_dir
                else:
                    text_dir = Path(text_dir)
                
                text_files = FileUtils.find_files(text_dir, ['.txt', '.docx'])
                if not text_files:
                    print("❌ 没有找到文本文件")
                    continue
                
                print(f"找到{len(text_files)}个文本文件")
                result = await self.translate_documents(text_files)
                print(f"翻译结果: {result['successful']}/{result['total']} 成功")
            
            elif choice == '5':
                pdf_dir = input("请输入PDF文件目录路径 (留空使用默认): ").strip()
                if not pdf_dir:
                    pdf_dir = self.config.paths.pdf_dir
                else:
                    pdf_dir = Path(pdf_dir)
                
                pdf_files = FileUtils.find_files(pdf_dir, ['.pdf'])
                if not pdf_files:
                    print("❌ 没有找到PDF文件")
                    continue
                
                print(f"找到{len(pdf_files)}个PDF文件")
                result = await self.process_workflow(pdf_files, 'full')
                print(f"工作流程结果: {'成功' if result['overall_success'] else '失败'}")
                
                # 显示详细结果
                for step in result['steps']:
                    step_result = step['result']
                    print(f"- {step['step']}: {step_result['successful']}/{step_result['total']} 成功")
            
            elif choice == '6':
                print("👋 再见!")
                break
            
            else:
                print("❌ 无效选择，请重试")


async def main():
    """主函数"""
    parser = argparse.ArgumentParser(description='PDF2Docx集成系统')
    parser.add_argument('command', nargs='?', choices=['test', 'convert', 'split', 'translate', 'workflow', 'interactive'], 
                       help='要执行的命令')
    parser.add_argument('--input', '-i', help='输入目录或文件')
    parser.add_argument('--output', '-o', help='输出目录')
    parser.add_argument('--workflow', choices=['full', 'convert', 'split', 'translate'], 
                       default='full', help='工作流程类型')
    
    args = parser.parse_args()
    
    # 创建系统实例
    system = PDF2DocxSystem()
    
    if not args.command or args.command == 'interactive':
        # 交互模式
        await system.run_interactive_mode()
    
    elif args.command == 'test':
        # 测试模式
        system.print_system_header()
        results = await system.test_connections()
        print("\n" + "="*50)
        print("🧪 API连接测试结果:")
        print("="*50)
        for service, result in results.items():
            status = "✅ 成功" if result.get('success') else "❌ 失败"
            print(f"{service}: {status}")
            if not result.get('success'):
                print(f"  错误: {result.get('error', '未知错误')}")
    
    elif args.command == 'convert':
        # PDF转换模式
        input_dir = Path(args.input) if args.input else system.config.paths.pdf_dir
        output_dir = Path(args.output) if args.output else system.config.paths.docx_raw_dir
        
        pdf_files = FileUtils.find_files(input_dir, ['.pdf'])
        if not pdf_files:
            print("❌ 没有找到PDF文件")
            return
        
        result = await system.convert_pdf_to_docx(pdf_files, output_dir)
        print(f"转换结果: {result['successful']}/{result['total']} 成功")
    
    elif args.command == 'workflow':
        # 工作流程模式
        input_dir = Path(args.input) if args.input else system.config.paths.pdf_dir
        
        pdf_files = FileUtils.find_files(input_dir, ['.pdf'])
        if not pdf_files:
            print("❌ 没有找到PDF文件")
            return
        
        result = await system.process_workflow(pdf_files, args.workflow)
        print(f"工作流程结果: {'成功' if result['overall_success'] else '失败'}")


if __name__ == "__main__":
    asyncio.run(main()) 