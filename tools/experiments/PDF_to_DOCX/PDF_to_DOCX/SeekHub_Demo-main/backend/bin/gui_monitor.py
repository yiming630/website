#!/usr/bin/env python3
"""
SeekHub 翻译系统增强版 GUI 监控界面 - 重构版
使用新的模块化架构
"""

import sys
import os
import asyncio

# 添加src路径
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

# 导入重构后的模块
from src.common.logger import setup_logger
from src.common.config_manager import config_manager
from src.common.dependencies import setup_dependencies, dependency_manager
from src.gui.main_window import SeekHubMonitorWindow


def main():
    """主函数"""
    print("🌟 SeekHub 翻译系统监控中心 - 重构版")
    print("=" * 60)
    
    # 设置日志
    logger = setup_logger(
        name="SeekHubGUI",
        log_level=config_manager.get_monitoring_config().log_level,
        log_file=config_manager.get_monitoring_config().log_file,
        enable_console=True,
        enable_color=True
    )
    
    try:
        # 设置依赖
        logger.info("🔧 初始化系统依赖...")
        setup_dependencies()
        
        # 显示依赖状态
        status_report = dependency_manager.get_status_report()
        logger.info("📊 依赖状态报告:")
        for dep_name, dep_info in status_report['dependencies'].items():
            status_icon = "✅" if dep_info['status'] == 'available' else "⚠️"
            logger.info(f"   {status_icon} {dep_name}: {dep_info['status']}")
        
        # 检查GUI依赖
        if not dependency_manager.is_available('customtkinter'):
            logger.warning("⚠️  CustomTkinter不可用，将使用标准Tkinter")
        
        # 创建并运行GUI
        logger.info("🚀 启动GUI界面...")
        window = SeekHubMonitorWindow()
        window.run()
        
    except KeyboardInterrupt:
        logger.info("👋 收到中断信号，正在退出...")
    except Exception as e:
        logger.error(f"❌ 系统启动失败: {e}")
        import traceback
        logger.error(f"详细错误: {traceback.format_exc()}")
    finally:
        logger.info("🔚 程序结束")


if __name__ == "__main__":
    main() 