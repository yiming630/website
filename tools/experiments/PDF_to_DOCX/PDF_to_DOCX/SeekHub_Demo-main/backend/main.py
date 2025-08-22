#!/usr/bin/env python3
"""
SeekHub 翻译系统 - 优化版主入口
集成了重构后的模块化架构
"""

import os
import sys
import asyncio
import argparse
from typing import Optional

# 添加src路径
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

# 导入重构后的模块
from src.common.logger import setup_logger
from src.common.config_manager import config_manager
from src.common.dependencies import setup_dependencies, dependency_manager
from src.common.health_monitor import health_monitor
from src.monitoring.system_monitor import SystemMonitor
from src.process_management.worker_manager import WorkerManager


class SeekHubTranslationSystem:
    """SeekHub翻译系统主控制器 - 优化版"""
    
    def __init__(self):
        self.logger = setup_logger(
            name="SeekHubSystem",
            log_level=config_manager.get_monitoring_config().log_level,
            log_file=config_manager.get_monitoring_config().log_file,
            enable_console=True
        )
        
        # 初始化组件
        self.system_monitor = SystemMonitor()
        self.worker_manager = WorkerManager()
        self.is_running = False
        
    def print_system_header(self):
        """打印系统标题"""
        print("\n" + "="*70)
        print("🌟 SeekHub 翻译系统 - 优化版 🌟")
        print("="*70)
        print("📚 智能图书翻译平台")
        print("🚀 高速并发处理引擎")
        print("☁️  Google Cloud 原生架构")
        print("🤖 Gemini AI 驱动")
        print("🔧 模块化重构架构")
        print("="*70)
    
    async def initialize_system(self):
        """初始化系统"""
        self.logger.info("🔧 初始化SeekHub翻译系统...")
        
        # 设置依赖
        setup_dependencies()
        
        # 显示依赖状态
        status_report = dependency_manager.get_status_report()
        self.logger.info("📊 系统依赖状态:")
        for dep_name, dep_info in status_report['dependencies'].items():
            status_icon = "✅" if dep_info['status'] == 'available' else "⚠️"
            self.logger.info(f"   {status_icon} {dep_name}: {dep_info['status']}")
        
        # 注册健康检查服务
        self._register_health_checks()
        
        self.logger.info("✅ 系统初始化完成")
    
    def _register_health_checks(self):
        """注册健康检查服务"""
        async def firestore_health_check():
            if dependency_manager.is_available('firestore'):
                firestore = dependency_manager.get_dependency('firestore')
                try:
                    await firestore.connect()
                    return {'status': 'healthy', 'latency': 0.1}
                except:
                    return {'status': 'critical', 'error': 'Connection failed'}
            return {'status': 'unavailable'}
        
        async def pubsub_health_check():
            if dependency_manager.is_available('pubsub'):
                pubsub = dependency_manager.get_dependency('pubsub')
                try:
                    await pubsub.initialize()
                    return {'status': 'healthy'}
                except:
                    return {'status': 'critical', 'error': 'Connection failed'}
            return {'status': 'unavailable'}
        
        async def workers_health_check():
            if self.worker_manager.is_workers_running():
                report = await self.worker_manager.get_worker_health_report()
                return {'status': report['overall_health'], 'details': report}
            return {'status': 'stopped'}
        
        health_monitor.register_service('firestore', firestore_health_check)
        health_monitor.register_service('pubsub', pubsub_health_check)
        health_monitor.register_service('workers', workers_health_check)
    
    async def start_system(self, num_workers: Optional[int] = None):
        """启动翻译系统"""
        if self.is_running:
            self.logger.warning("系统已在运行")
            return False
        
        try:
            self.logger.info("🚀 启动翻译系统...")
            
            # 启动系统监控
            self.logger.info("📊 启动系统监控...")
            asyncio.create_task(self.system_monitor.start_monitoring(interval=5))
            
            # 启动健康监控
            self.logger.info("🏥 启动健康监控...")
            asyncio.create_task(health_monitor.start_monitoring(interval=30))
            
            # 启动工作器
            if num_workers is None:
                num_workers = config_manager.get_worker_config().max_workers
            
            self.logger.info(f"⚙️ 启动 {num_workers} 个工作器...")
            success = await self.worker_manager.start_workers(num_workers, 2)
            
            if not success:
                raise Exception("工作器启动失败")
            
            self.is_running = True
            self.logger.info("✅ 翻译系统启动完成")
            
            return True
            
        except Exception as e:
            self.logger.error(f"❌ 系统启动失败: {e}")
            await self.stop_system()
            return False
    
    async def stop_system(self):
        """停止翻译系统"""
        if not self.is_running:
            self.logger.warning("系统未运行")
            return True
        
        try:
            self.logger.info("⏹️ 停止翻译系统...")
            
            # 停止工作器
            await self.worker_manager.stop_workers()
            
            # 停止监控
            self.system_monitor.stop_monitoring()
            health_monitor.stop_monitoring()
            
            self.is_running = False
            self.logger.info("✅ 翻译系统已停止")
            
            return True
            
        except Exception as e:
            self.logger.error(f"❌ 停止系统失败: {e}")
            return False
    
    async def show_status(self):
        """显示系统状态"""
        self.logger.info("📊 系统状态报告")
        print("\n" + "="*50)
        print("📊 SeekHub 翻译系统状态")
        print("="*50)
        
        # 系统基本状态
        print(f"🖥️  系统运行状态: {'运行中' if self.is_running else '已停止'}")
        
        # 健康状态
        try:
            health_report = await health_monitor.get_health_report()
            print(f"🏥 系统健康状态: {health_report.overall_status.value}")
            
            if health_report.alerts:
                print("\n⚠️  系统告警:")
                for alert in health_report.alerts:
                    print(f"   • {alert}")
            
            # 系统指标
            metrics = health_report.system_metrics
            print(f"\n📈 系统指标:")
            print(f"   • CPU: {metrics.cpu_percent:.1f}%")
            print(f"   • 内存: {metrics.memory_percent:.1f}%")
            print(f"   • 磁盘: {metrics.disk_usage_percent:.1f}%")
            print(f"   • 进程数: {metrics.process_count}")
            
            # 服务状态
            print(f"\n🔗 服务状态:")
            for service in health_report.services:
                status_icon = {"healthy": "✅", "warning": "⚠️", "critical": "❌", "unknown": "❓"}.get(service.status.value, "❓")
                print(f"   {status_icon} {service.name}: {service.status.value}")
                if service.response_time:
                    print(f"      响应时间: {service.response_time:.2f}s")
        
        except Exception as e:
            print(f"❌ 获取健康状态失败: {e}")
        
        # 工作器状态
        if self.is_running:
            try:
                worker_report = await self.worker_manager.get_worker_health_report()
                print(f"\n⚙️  工作器状态:")
                print(f"   • 总体健康: {worker_report['overall_health']}")
                
                stats = worker_report['statistics']
                print(f"   • 运行中: {stats['running']}")
                print(f"   • 崩溃: {stats['crashed']}")
                print(f"   • 停止: {stats['stopped']}")
                print(f"   • 总重启次数: {stats['total_restarts']}")
                
                if worker_report['health_issues']:
                    print("\n   ⚠️  工作器问题:")
                    for issue in worker_report['health_issues']:
                        print(f"      • {issue}")
            
            except Exception as e:
                print(f"❌ 获取工作器状态失败: {e}")
        
        print("="*50)
    
    async def run_interactive_mode(self):
        """运行交互模式"""
        self.logger.info("🎯 进入交互模式")
        
        while True:
            try:
                print("\n" + "="*40)
                print("🎛️  SeekHub 控制面板")
                print("="*40)
                print("1. 启动系统")
                print("2. 停止系统")
                print("3. 显示状态")
                print("4. 调整工作器数量")
                print("5. 系统监控摘要")
                print("0. 退出")
                print("="*40)
                
                choice = input("请选择操作 (0-5): ").strip()
                
                if choice == '0':
                    break
                elif choice == '1':
                    workers = input("工作器数量 (默认: auto): ").strip()
                    num_workers = int(workers) if workers.isdigit() else None
                    await self.start_system(num_workers)
                elif choice == '2':
                    await self.stop_system()
                elif choice == '3':
                    await self.show_status()
                elif choice == '4':
                    if not self.is_running:
                        print("❌ 系统未运行")
                        continue
                    new_count = input("新的工作器数量: ").strip()
                    if new_count.isdigit():
                        await self.worker_manager.scale_workers(int(new_count))
                        print(f"✅ 工作器数量已调整为 {new_count}")
                    else:
                        print("❌ 请输入有效数字")
                elif choice == '5':
                    summary = self.system_monitor.get_summary()
                    print("\n📊 系统监控摘要:")
                    print(f"   当前数据点: {summary.get('data_points', 0)}")
                    if 'current' in summary:
                        current = summary['current']
                        print(f"   CPU: {current['cpu']:.1f}%")
                        print(f"   内存: {current['memory']:.1f}%")
                        print(f"   磁盘: {current['disk']:.1f}%")
                else:
                    print("❌ 无效选择")
                
                input("\n按回车键继续...")
                
            except KeyboardInterrupt:
                break
            except Exception as e:
                self.logger.error(f"交互模式错误: {e}")
                input("按回车键继续...")
        
        self.logger.info("👋 退出交互模式")


async def main():
    """主函数"""
    parser = argparse.ArgumentParser(description="SeekHub翻译系统 - 优化版")
    parser.add_argument('--mode', choices=['start', 'stop', 'status', 'interactive'], 
                       default='interactive', help='运行模式')
    parser.add_argument('--workers', type=int, help='工作器数量')
    
    args = parser.parse_args()
    
    system = SeekHubTranslationSystem()
    system.print_system_header()
    
    try:
        # 初始化系统
        await system.initialize_system()
        
        if args.mode == 'start':
            await system.start_system(args.workers)
            
            # 保持运行
            try:
                while system.is_running:
                    await asyncio.sleep(1)
            except KeyboardInterrupt:
                await system.stop_system()
                
        elif args.mode == 'stop':
            await system.stop_system()
            
        elif args.mode == 'status':
            await system.show_status()
            
        elif args.mode == 'interactive':
            await system.run_interactive_mode()
            
    except KeyboardInterrupt:
        system.logger.info("👋 收到中断信号")
    except Exception as e:
        system.logger.error(f"❌ 系统错误: {e}")
    finally:
        if system.is_running:
            await system.stop_system()
        system.logger.info("🔚 程序结束")


if __name__ == "__main__":
    asyncio.run(main()) 