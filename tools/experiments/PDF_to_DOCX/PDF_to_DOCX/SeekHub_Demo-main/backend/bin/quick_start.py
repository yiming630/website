#!/usr/bin/env python3
"""
SeekHub 翻译系统快速启动脚本
整合优化后的所有功能，提供一键启动体验
"""

import os
import sys
import asyncio
import argparse
from pathlib import Path

# 添加src路径
sys.path.append(str(Path(__file__).parent / 'src'))

def print_banner():
    """打印启动横幅"""
    print("\n" + "="*70)
    print("🌟 SeekHub 翻译系统 - 快速启动 🌟")
    print("="*70)
    print("📚 智能图书翻译平台")
    print("🚀 优化版模块化架构") 
    print("🤖 Gemini AI 驱动")
    print("☁️  Google Cloud 原生")
    print("="*70)

def check_environment():
    """检查环境配置"""
    print("🔍 检查环境配置...")
    
    # 检查配置文件
    config_files = [
        "config.yaml",
        ".env"
    ]
    
    missing_files = []
    for file in config_files:
        if not Path(file).exists():
            missing_files.append(file)
    
    if missing_files:
        print("⚠️  缺少配置文件:")
        for file in missing_files:
            print(f"   • {file}")
        print("\n💡 请参考以下模板文件进行配置:")
        print("   • config.yaml (YAML配置)")
        print("   • .env.template (环境变量模板)")
        return False
    
    print("✅ 环境配置检查通过")
    return True

async def start_gui_mode():
    """启动GUI模式"""
    print("🖥️  启动GUI监控界面...")
    
    try:
        from src.gui import SeekHubMonitorWindow
        
        # 创建并运行GUI
        app = SeekHubMonitorWindow()
        app.run()
        
    except ImportError as e:
        print(f"❌ GUI依赖不可用: {e}")
        print("💡 请安装GUI依赖: pip install customtkinter matplotlib")
        return False
    except Exception as e:
        print(f"❌ GUI启动失败: {e}")
        return False

async def start_cli_mode():
    """启动命令行模式"""
    print("⌨️  启动命令行模式...")
    
    try:
        # 导入优化后的主程序
        from main_optimized import SeekHubTranslationSystem
        
        # 创建系统实例
        system = SeekHubTranslationSystem()
        
        # 初始化系统
        await system.initialize_system()
        
        # 运行交互模式
        await system.run_interactive_mode()
        
    except Exception as e:
        print(f"❌ 系统启动失败: {e}")
        return False

async def start_service_mode(num_workers=None):
    """启动服务模式（后台运行）"""
    print("🔧 启动服务模式...")
    
    try:
        from main_optimized import SeekHubTranslationSystem
        
        system = SeekHubTranslationSystem()
        await system.initialize_system()
        
        # 启动系统
        success = await system.start_system(num_workers)
        if success:
            print("✅ 翻译系统已启动")
            print("🔄 系统正在后台运行...")
            
            # 保持运行
            try:
                while True:
                    await asyncio.sleep(60)
                    # 可以在这里添加定期状态检查
            except KeyboardInterrupt:
                print("\n⏹️  收到停止信号...")
                await system.stop_system()
        else:
            print("❌ 系统启动失败")
            
    except Exception as e:
        print(f"❌ 服务启动失败: {e}")
        return False

def main():
    """主函数"""
    parser = argparse.ArgumentParser(
        description="SeekHub翻译系统快速启动脚本",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
启动模式:
  gui     启动图形界面监控模式（推荐）
  cli     启动命令行交互模式  
  service 启动后台服务模式
  
示例:
  python quick_start.py gui                    # 启动GUI
  python quick_start.py cli                    # 启动CLI  
  python quick_start.py service --workers 6   # 启动6个工作器的服务
        """
    )
    
    parser.add_argument(
        'mode', 
        choices=['gui', 'cli', 'service'],
        help='启动模式'
    )
    
    parser.add_argument(
        '--workers', '-w',
        type=int,
        help='工作器数量（仅服务模式）'
    )
    
    parser.add_argument(
        '--skip-check',
        action='store_true', 
        help='跳过环境检查'
    )
    
    args = parser.parse_args()
    
    # 打印横幅
    print_banner()
    
    # 环境检查
    if not args.skip_check:
        if not check_environment():
            print("\n❌ 环境检查失败，请配置后重试")
            print("💡 使用 --skip-check 跳过检查（不推荐）")
            return 1
    
    # 根据模式启动
    try:
        if args.mode == 'gui':
            asyncio.run(start_gui_mode())
        elif args.mode == 'cli':
            asyncio.run(start_cli_mode())
        elif args.mode == 'service':
            asyncio.run(start_service_mode(args.workers))
            
    except KeyboardInterrupt:
        print("\n👋 再见！")
        return 0
    except Exception as e:
        print(f"\n💥 启动失败: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main()) 