#!/usr/bin/env python3
"""
系统健康检查工具
检查SeekHub系统的各个组件状态
"""

import os
import sys
import asyncio
from pathlib import Path

# 添加src路径
sys.path.append(str(Path(__file__).parent.parent / 'src'))

from src.common.health_monitor import health_monitor
from src.common.dependencies import dependency_manager, setup_dependencies
from src.common.logger import setup_logger

def print_header():
    """打印标题"""
    print("\n" + "="*60)
    print("🏥 SeekHub 系统健康检查")
    print("="*60)

async def check_dependencies():
    """检查依赖状态"""
    print("\n📦 依赖检查:")
    print("-" * 30)
    
    setup_dependencies()
    status_report = dependency_manager.get_status_report()
    
    for dep_name, dep_info in status_report['dependencies'].items():
        status_icon = "✅" if dep_info['status'] == 'available' else "❌"
        print(f"   {status_icon} {dep_name}: {dep_info['status']}")
        if dep_info['error']:
            print(f"      错误: {dep_info['error']}")

async def check_system_health():
    """检查系统健康状态"""
    print("\n🖥️  系统健康检查:")
    print("-" * 30)
    
    try:
        health_report = await health_monitor.get_health_report()
        
        print(f"   总体状态: {health_report.overall_status.value}")
        
        # 系统指标
        metrics = health_report.system_metrics
        print(f"   CPU使用率: {metrics.cpu_percent:.1f}%")
        print(f"   内存使用率: {metrics.memory_percent:.1f}%")
        print(f"   磁盘使用率: {metrics.disk_usage_percent:.1f}%")
        print(f"   进程数量: {metrics.process_count}")
        
        # 服务状态
        if health_report.services:
            print("\n🔗 服务状态:")
            for service in health_report.services:
                status_icon = {
                    "healthy": "✅", 
                    "warning": "⚠️", 
                    "critical": "❌", 
                    "unknown": "❓"
                }.get(service.status.value, "❓")
                print(f"   {status_icon} {service.name}: {service.status.value}")
        
        # 告警信息
        if health_report.alerts:
            print("\n⚠️  系统告警:")
            for alert in health_report.alerts:
                print(f"   • {alert}")
        
    except Exception as e:
        print(f"   ❌ 健康检查失败: {e}")

def check_file_permissions():
    """检查文件权限"""
    print("\n📁 文件权限检查:")
    print("-" * 30)
    
    critical_files = [
        "main.py",
        "requirements.txt",
        ".env",
        "config/templates/config.yaml",
        "logs/"
    ]
    
    for file_path in critical_files:
        path = Path(file_path)
        if path.exists():
            if path.is_file() and os.access(path, os.R_OK):
                print(f"   ✅ {file_path}: 可读")
            elif path.is_dir() and os.access(path, os.W_OK):
                print(f"   ✅ {file_path}: 可写")
            else:
                print(f"   ⚠️  {file_path}: 权限不足")
        else:
            print(f"   ❌ {file_path}: 文件不存在")

def check_network_connectivity():
    """检查网络连接"""
    print("\n🌐 网络连接检查:")
    print("-" * 30)
    
    test_urls = [
        ("Google", "google.com"),
        ("Google Cloud", "googleapis.com"),
        ("Gemini API", "generativelanguage.googleapis.com")
    ]
    
    import socket
    
    for name, host in test_urls:
        try:
            socket.create_connection((host, 443), timeout=5)
            print(f"   ✅ {name}: 连接正常")
        except OSError:
            print(f"   ❌ {name}: 连接失败")

def generate_report():
    """生成检查报告"""
    import datetime
    
    report_path = Path("logs/health_check_report.txt")
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(f"SeekHub 系统健康检查报告\n")
        f.write(f"生成时间: {timestamp}\n")
        f.write("="*50 + "\n\n")
        f.write("详细信息请查看控制台输出\n")
    
    print(f"\n📊 检查报告已保存至: {report_path}")

async def main():
    """主函数"""
    import os
    
    print_header()
    
    # 检查运行环境
    if not Path("main.py").exists():
        print("❌ 请在backend目录中运行此脚本")
        return 1
    
    try:
        # 设置日志
        logger = setup_logger("health_check", enable_console=False)
        
        # 执行各项检查
        await check_dependencies()
        await check_system_health()
        check_file_permissions()
        check_network_connectivity()
        
        # 生成报告
        generate_report()
        
        print("\n" + "="*60)
        print("✅ 健康检查完成")
        
    except Exception as e:
        print(f"\n❌ 健康检查过程中出现错误: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(asyncio.run(main())) 