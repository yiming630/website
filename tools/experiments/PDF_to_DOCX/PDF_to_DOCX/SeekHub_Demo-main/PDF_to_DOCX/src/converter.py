"""
批量PDF转DOCX转换脚本
"""
import logging
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List, Tuple
from tqdm import tqdm
from .config import PDF_DIR, DOCX_RAW_DIR, MAX_WORKERS
from .wps_client import WPSClient
from .cloud_storage import GoogleCloudStorage

logger = logging.getLogger(__name__)


class PDFConverter:
    """PDF批量转换器"""
    
    def __init__(self, wps_client: WPSClient = None, gcs_client: GoogleCloudStorage = None):
        self.wps_client = wps_client or WPSClient()
        self.gcs_client = gcs_client or GoogleCloudStorage()
    
    def convert_single_pdf(self, pdf_path: Path, output_dir: Path) -> Tuple[bool, Path, str]:
        """
        转换单个PDF文件
        
        Returns:
            (是否成功, 文件路径, 错误信息)
        """
        try:
            # 步骤1: 上传PDF到云存储
            logger.info(f"上传PDF到云存储: {pdf_path}")
            blob_name = f"pdf-temp/{pdf_path.name}"
            pdf_url = self.gcs_client.upload_file(str(pdf_path), blob_name, make_public=True)
            
            if not pdf_url:
                return (False, pdf_path, "上传PDF到云存储失败")
            
            # 步骤2: 使用WPS API转换
            output_path = output_dir / pdf_path.with_suffix('.docx').name
            success = self.wps_client.convert_pdf_to_docx(pdf_url, str(output_path))
            
            # 步骤3: 清理云存储中的临时文件
            try:
                self.gcs_client.delete_file(blob_name)
                logger.info(f"已删除临时文件: {blob_name}")
            except Exception as e:
                logger.warning(f"删除临时文件失败: {e}")
            
            if success:
                return (True, output_path, "")
            else:
                return (False, pdf_path, "WPS API转换失败")
                
        except Exception as e:
            error_msg = str(e)
            logger.error(f"转换失败 {pdf_path}: {error_msg}")
            return (False, pdf_path, error_msg)
    
    def convert_batch(self, pdf_files: List[Path] = None, 
                     input_dir: Path = PDF_DIR,
                     output_dir: Path = DOCX_RAW_DIR,
                     max_workers: int = MAX_WORKERS) -> dict:
        """
        批量转换PDF文件
        
        Args:
            pdf_files: 要转换的PDF文件列表，为None时扫描input_dir
            input_dir: PDF文件目录
            output_dir: 输出目录
            max_workers: 最大并发数
            
        Returns:
            转换结果统计
        """
        # 获取PDF文件列表
        if pdf_files is None:
            pdf_files = list(input_dir.glob('*.pdf'))
        
        if not pdf_files:
            logger.warning(f"未找到PDF文件在: {input_dir}")
            return {
                'total': 0,
                'success': 0,
                'failed': 0,
                'success_files': [],
                'failed_files': []
            }
        
        logger.info(f"准备转换 {len(pdf_files)} 个PDF文件")
        
        # 确保输出目录存在
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # 结果统计
        success_files = []
        failed_files = []
        
        # 使用线程池并发转换
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            # 提交所有任务
            future_to_pdf = {
                executor.submit(self.convert_single_pdf, pdf_file, output_dir): pdf_file
                for pdf_file in pdf_files
            }
            
            # 使用进度条显示进度
            with tqdm(total=len(pdf_files), desc="转换进度") as pbar:
                for future in as_completed(future_to_pdf):
                    pdf_file = future_to_pdf[future]
                    success, file_path, error_msg = future.result()
                    
                    if success:
                        success_files.append(file_path)
                        logger.info(f"✓ 成功: {pdf_file.name}")
                    else:
                        failed_files.append((file_path, error_msg))
                        logger.error(f"✗ 失败: {pdf_file.name} - {error_msg}")
                    
                    pbar.update(1)
        
        # 统计结果
        result = {
            'total': len(pdf_files),
            'success': len(success_files),
            'failed': len(failed_files),
            'success_files': success_files,
            'failed_files': failed_files
        }
        
        logger.info(f"转换完成: 成功 {result['success']}/{result['total']}")
        
        # 如果有失败的文件，记录到错误日志
        if failed_files:
            self._save_error_log(failed_files)
        
        return result
    
    def _save_error_log(self, failed_files: List[Tuple[Path, str]]):
        """保存错误日志"""
        from .config import LOGS_DIR
        error_log_file = LOGS_DIR / 'conversion_errors.log'
        
        with open(error_log_file, 'a', encoding='utf-8') as f:
            f.write("\n" + "="*50 + "\n")
            from datetime import datetime
            f.write(f"转换失败记录 - {datetime.now()}\n")
            for file_path, error_msg in failed_files:
                f.write(f"文件: {file_path}\n错误: {error_msg}\n\n")


def main():
    """主函数"""
    import argparse
    
    parser = argparse.ArgumentParser(description='批量转换PDF到DOCX')
    parser.add_argument('--input', type=Path, default=PDF_DIR,
                       help='输入PDF目录')
    parser.add_argument('--output', type=Path, default=DOCX_RAW_DIR,
                       help='输出DOCX目录')
    parser.add_argument('--workers', type=int, default=MAX_WORKERS,
                       help='并发工作线程数')
    parser.add_argument('--files', nargs='+', type=Path,
                       help='指定要转换的PDF文件')
    
    args = parser.parse_args()
    
    # 配置日志
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # 创建转换器并执行
    converter = PDFConverter()
    result = converter.convert_batch(
        pdf_files=args.files,
        input_dir=args.input,
        output_dir=args.output,
        max_workers=args.workers
    )
    
    # 打印结果摘要
    print(f"\n转换完成！")
    print(f"总计: {result['total']} 个文件")
    print(f"成功: {result['success']} 个文件")
    print(f"失败: {result['failed']} 个文件")
    
    if result['failed'] > 0:
        print(f"\n失败文件详情请查看: logs/conversion_errors.log")


if __name__ == '__main__':
    main() 