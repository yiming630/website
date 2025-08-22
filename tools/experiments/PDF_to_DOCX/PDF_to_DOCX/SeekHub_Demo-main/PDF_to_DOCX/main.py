"""
PDF转DOCX并智能分割 - 主程序入口
"""
import sys
import logging
from pathlib import Path
from src.config import PDF_DIR, DOCX_RAW_DIR, DOCX_SPLIT_DIR, LOG_FILE
from src.converter import PDFConverter
from src.splitter import DocumentSplitter
from src.pdf_splitter import PDFSplitter
from src.wps_client import WPSClient
from src.gemini_client import GeminiClient

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE, encoding='utf-8'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)


def convert_command(args):
    """执行PDF转换命令"""
    converter = PDFConverter()
    
    pdf_files = None
    if args.files:
        pdf_files = [Path(f) for f in args.files]
    
    result = converter.convert_batch(
        pdf_files=pdf_files,
        input_dir=Path(args.input) if args.input else PDF_DIR,
        output_dir=Path(args.output) if args.output else DOCX_RAW_DIR,
        max_workers=args.workers
    )
    
    print(f"\n✅ 转换完成！")
    print(f"📊 总计: {result['total']} 个文件")
    print(f"✓ 成功: {result['success']} 个文件")
    print(f"✗ 失败: {result['failed']} 个文件")
    
    if result['success_files']:
        print(f"\n成功转换的文件保存在: {args.output or DOCX_RAW_DIR}")


def split_command(args):
    """执行文档分割命令"""
    splitter = DocumentSplitter()
    
    docx_files = None
    if args.files:
        docx_files = [Path(f) for f in args.files]
    
    result = splitter.split_batch(
        docx_files=docx_files,
        input_dir=Path(args.input) if args.input else DOCX_RAW_DIR,
        output_dir=Path(args.output) if args.output else DOCX_SPLIT_DIR,
        max_workers=args.workers,
        save_format=args.format
    )
    
    print(f"\n✅ 分割完成！")
    print(f"📊 总计: {result['total']} 个文件")
    print(f"✓ 成功: {result['success']} 个文件")
    print(f"✗ 失败: {result['failed']} 个文件")
    
    if result['success_files']:
        print(f"\n分割后的文件保存在: {args.output or DOCX_SPLIT_DIR}")


def split_pdf_command(args):
    """执行PDF直接分割命令（新流程）：先分割PDF再转DOCX"""
    print("🚀 开始执行新流程：先分割PDF，再用WPS API转换为DOCX\n")
    
    splitter = PDFSplitter()
    
    if args.files:
        # 处理指定文件
        for pdf_file in args.files:
            print(f"处理文件: {pdf_file}")
            result = splitter.split_and_convert_pdf(pdf_file, getattr(args, 'prompt', None))
            
            if result.get('success'):
                print(f"✓ 成功处理: {pdf_file}")
                print(f"  生成PDF: {result.get('pdf_files_created', 0)} 个")
                print(f"  生成DOCX: {result.get('docx_files_created', 0)} 个")
            else:
                print(f"✗ 处理失败: {pdf_file} - {result.get('error', '未知错误')}")
    else:
        # 批量处理目录
        input_dir = args.input if args.input else PDF_DIR
        result = splitter.batch_split_and_convert_pdfs(input_dir, getattr(args, 'prompt', None))
        
        if result.get('success'):
            print(f"\n✅ 批量处理完成！")
            print(f"📊 总计: {result['total_files']} 个PDF文件")
            print(f"✓ 成功: {result['successful_count']} 个文件")
            print(f"✗ 失败: {result['failed_count']} 个文件")
            
            # 计算总生成文件数
            total_docx = sum(r.get('docx_files_created', 0) for r in result.get('results', []) if r.get('success'))
            print(f"📄 总共生成: {total_docx} 个DOCX文件")
            
            output_dir = args.output if args.output else DOCX_SPLIT_DIR
            print(f"\n输出文件保存在: {output_dir}")
        else:
            print(f"✗ 批量处理失败: {result.get('error', '未知错误')}")


def all_command(args):
    """执行完整流程：转换+分割"""
    print("🚀 开始执行完整流程：PDF转换 + 智能分割\n")
    
    # 步骤1：转换PDF到DOCX
    print("📄 步骤 1/2: PDF转DOCX...")
    converter = PDFConverter()
    
    pdf_files = None
    if args.files:
        pdf_files = [Path(f) for f in args.files]
    
    convert_result = converter.convert_batch(
        pdf_files=pdf_files,
        input_dir=Path(args.input) if args.input else PDF_DIR,
        output_dir=DOCX_RAW_DIR,
        max_workers=args.workers
    )
    
    if convert_result['success'] == 0:
        print("\n❌ 没有成功转换的文件，流程终止")
        return
    
    print(f"\n✓ 转换成功: {convert_result['success']}/{convert_result['total']}")
    
    # 步骤2：分割DOCX文档
    print("\n✂️ 步骤 2/2: 智能分割DOCX...")
    splitter = DocumentSplitter()
    
    # 使用转换成功的文件进行分割
    split_result = splitter.split_batch(
        docx_files=convert_result['success_files'],
        output_dir=Path(args.output) if args.output else DOCX_SPLIT_DIR,
        max_workers=args.workers,
        save_format=args.format
    )
    
    # 总结
    print("\n" + "="*50)
    print("📊 执行总结:")
    print(f"PDF转换: {convert_result['success']}/{convert_result['total']} 成功")
    print(f"文档分割: {split_result['success']}/{split_result['total']} 成功")
    
    if split_result['success_files']:
        print(f"\n✅ 最终结果保存在: {args.output or DOCX_SPLIT_DIR}")


def test_command(args):
    """测试API连接"""
    print("🧪 测试API连接...\n")
    
    # 测试WPS API
    print("1. 测试WPS API...")
    try:
        wps_client = WPSClient()
        if not wps_client.app_secret:
            print("❌ WPS API Key未配置")
        else:
            print("✓ WPS API Key已配置")
            # 实际测试API连接
            result = wps_client.test_connection()
            if result.get('success'):
                print("✓ WPS API连接正常")
            else:
                print(f"❌ WPS API连接失败: {result.get('error')}")
    except Exception as e:
        print(f"❌ WPS API测试失败: {e}")
    
    # 测试Gemini API
    print("\n2. 测试Gemini API...")
    try:
        gemini_client = GeminiClient()
        if not gemini_client.api_key:
            print("❌ Gemini API Key未配置")
        else:
            print("✓ Gemini API Key已配置")
            # 简单测试
            test_text = "这是一个测试文本。"
            result = gemini_client._simple_split(test_text, 100)
            print(f"✓ Gemini客户端初始化成功")
    except Exception as e:
        print(f"❌ Gemini API测试失败: {e}")
    
    print("\n✅ 测试完成")


def main():
    """主函数"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description='PDF转DOCX并智能分割工具',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  %(prog)s convert                    # 转换所有PDF文件为完整DOCX
  %(prog)s split                      # 分割所有DOCX文件
  %(prog)s all                        # 执行完整流程: PDF→完整DOCX→分割DOCX
  %(prog)s split-pdf                  # 新流程: PDF→分割PDF→多个DOCX (推荐)
  %(prog)s convert --files a.pdf b.pdf  # 转换指定文件
  %(prog)s split --format txt         # 分割并保存为TXT格式
  %(prog)s split-pdf --files doc.pdf --prompt "按章节分割"  # 拆分指定PDF
  %(prog)s test                       # 测试API连接
        """
    )
    
    subparsers = parser.add_subparsers(dest='command', help='可用命令')
    
    # convert子命令
    convert_parser = subparsers.add_parser('convert', help='转换PDF到DOCX')
    convert_parser.add_argument('--input', help='输入PDF目录')
    convert_parser.add_argument('--output', help='输出DOCX目录')
    convert_parser.add_argument('--workers', type=int, default=5, help='并发工作线程数')
    convert_parser.add_argument('--files', nargs='+', help='指定要转换的PDF文件')
    
    # split子命令
    split_parser = subparsers.add_parser('split', help='智能分割DOCX文档')
    split_parser.add_argument('--input', help='输入DOCX目录')
    split_parser.add_argument('--output', help='输出目录')
    split_parser.add_argument('--workers', type=int, default=5, help='并发工作线程数')
    split_parser.add_argument('--format', choices=['docx', 'txt'], default='docx', help='输出格式')
    split_parser.add_argument('--files', nargs='+', help='指定要分割的DOCX文件')
    
    # split-pdf子命令（新增）
    split_pdf_parser = subparsers.add_parser('split-pdf', help='新流程：先分割PDF再转换为DOCX')
    split_pdf_parser.add_argument('--input', help='输入PDF目录')
    split_pdf_parser.add_argument('--output', help='输出目录')
    split_pdf_parser.add_argument('--prompt', help='自定义分割提示词')
    split_pdf_parser.add_argument('--files', nargs='+', help='指定要处理的PDF文件')
    
    # all子命令
    all_parser = subparsers.add_parser('all', help='执行完整流程：转换+分割')
    all_parser.add_argument('--input', help='输入PDF目录')
    all_parser.add_argument('--output', help='最终输出目录')
    all_parser.add_argument('--workers', type=int, default=5, help='并发工作线程数')
    all_parser.add_argument('--format', choices=['docx', 'txt'], default='docx', help='输出格式')
    all_parser.add_argument('--files', nargs='+', help='指定要处理的PDF文件')
    
    # test子命令
    test_parser = subparsers.add_parser('test', help='测试API连接')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        sys.exit(1)
    
    # 执行对应命令
    try:
        if args.command == 'convert':
            convert_command(args)
        elif args.command == 'split':
            split_command(args)
        elif args.command == 'split-pdf':
            split_pdf_command(args)
        elif args.command == 'all':
            all_command(args)
        elif args.command == 'test':
            test_command(args)
    except KeyboardInterrupt:
        print("\n\n⚠️ 用户中断操作")
        sys.exit(1)
    except Exception as e:
        logger.error(f"执行失败: {e}", exc_info=True)
        print(f"\n❌ 执行失败: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main() 