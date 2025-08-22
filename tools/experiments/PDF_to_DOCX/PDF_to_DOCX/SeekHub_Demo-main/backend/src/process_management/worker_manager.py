"""
工作器管理器
负责启动、停止和管理翻译工作器进程
"""

import asyncio
import subprocess
import os
from typing import List, Dict, Any, Optional
from datetime import datetime

from ..common.logger import LoggerMixin
from ..common.error_handler import async_error_handler, ErrorSeverity
from ..common.config_manager import config_manager
from ..monitoring.process_monitor import ProcessMonitor


class WorkerManager(LoggerMixin):
    """工作器管理器"""
    
    def __init__(self):
        self.process_monitor = ProcessMonitor()
        self.worker_processes = []
        self.is_running = False
        
        # 获取配置
        self.worker_config = config_manager.get_worker_config()
        
    @async_error_handler(severity=ErrorSeverity.MEDIUM, component="WorkerManager")
    async def start_workers(self, num_chapter_workers: Optional[int] = None, num_combo_workers: int = 2):
        """启动工作器进程"""
        if self.is_running:
            self.log_warning("工作器已在运行")
            return False
        
        if num_chapter_workers is None:
            num_chapter_workers = self.worker_config.max_workers
        
        self.log_info(f"启动工作器: {num_chapter_workers} 章节工作器, {num_combo_workers} 组合工作器")
        
        try:
            # 启动章节翻译工作器
            await self._start_chapter_workers(num_chapter_workers)
            
            # 启动组合工作器
            await self._start_combination_workers(num_combo_workers)
            
            # 开始进程监控
            asyncio.create_task(self.process_monitor.start_monitoring())
            
            self.is_running = True
            self.log_info("所有工作器启动完成")
            return True
            
        except Exception as e:
            self.log_error(f"启动工作器失败: {e}")
            await self.stop_workers()
            return False
    
    async def _start_chapter_workers(self, count: int):
        """启动章节翻译工作器"""
        for i in range(count):
            worker_name = f"chapter_worker_{i}"
            command = [
                "python", "-m", "src.workers.chapter_worker",
                "--worker-id", str(i),
                "--batch-size", str(self.worker_config.batch_size)
            ]
            
            self.process_monitor.add_process(worker_name, command)
            await self.process_monitor.start_process(worker_name)
    
    async def _start_combination_workers(self, count: int):
        """启动组合工作器"""
        for i in range(count):
            worker_name = f"combo_worker_{i}"
            command = [
                "python", "-m", "src.workers.combination_worker",
                "--worker-id", str(i)
            ]
            
            self.process_monitor.add_process(worker_name, command)
            await self.process_monitor.start_process(worker_name)
    
    @async_error_handler(severity=ErrorSeverity.MEDIUM, component="WorkerManager")
    async def stop_workers(self):
        """停止所有工作器"""
        if not self.is_running:
            self.log_warning("工作器未运行")
            return True
        
        self.log_info("停止所有工作器...")
        
        try:
            # 停止进程监控
            self.process_monitor.stop_monitoring()
            
            # 停止所有管理的进程
            await self.process_monitor.stop_all_processes()
            
            self.is_running = False
            self.worker_processes.clear()
            
            self.log_info("所有工作器已停止")
            return True
            
        except Exception as e:
            self.log_error(f"停止工作器失败: {e}")
            return False
    
    @async_error_handler(severity=ErrorSeverity.LOW, component="WorkerManager")
    async def restart_worker(self, worker_name: str):
        """重启指定工作器"""
        self.log_info(f"重启工作器: {worker_name}")
        return await self.process_monitor.restart_process(worker_name)
    
    def get_worker_status(self) -> Dict[str, Any]:
        """获取工作器状态"""
        return self.process_monitor.get_all_status()
    
    def get_worker_statistics(self) -> Dict[str, Any]:
        """获取工作器统计信息"""
        return self.process_monitor.get_statistics()
    
    def is_workers_running(self) -> bool:
        """检查工作器是否运行中"""
        return self.is_running
    
    async def scale_workers(self, new_chapter_count: int, new_combo_count: Optional[int] = None):
        """动态调整工作器数量"""
        current_stats = self.get_worker_statistics()
        current_chapter_workers = sum(1 for name in self.process_monitor.managed_processes.keys() 
                                    if name.startswith('chapter_worker_'))
        current_combo_workers = sum(1 for name in self.process_monitor.managed_processes.keys() 
                                  if name.startswith('combo_worker_'))
        
        self.log_info(f"调整工作器数量: 章节 {current_chapter_workers} -> {new_chapter_count}")
        
        # 调整章节工作器
        if new_chapter_count > current_chapter_workers:
            # 增加工作器
            for i in range(current_chapter_workers, new_chapter_count):
                worker_name = f"chapter_worker_{i}"
                command = [
                    "python", "-m", "src.workers.chapter_worker",
                    "--worker-id", str(i),
                    "--batch-size", str(self.worker_config.batch_size)
                ]
                self.process_monitor.add_process(worker_name, command)
                await self.process_monitor.start_process(worker_name)
        
        elif new_chapter_count < current_chapter_workers:
            # 减少工作器
            for i in range(new_chapter_count, current_chapter_workers):
                worker_name = f"chapter_worker_{i}"
                await self.process_monitor.stop_process(worker_name)
                self.process_monitor.remove_process(worker_name)
        
        # 调整组合工作器（如果指定）
        if new_combo_count is not None and new_combo_count != current_combo_workers:
            self.log_info(f"调整组合工作器数量: {current_combo_workers} -> {new_combo_count}")
            
            if new_combo_count > current_combo_workers:
                for i in range(current_combo_workers, new_combo_count):
                    worker_name = f"combo_worker_{i}"
                    command = [
                        "python", "-m", "src.workers.combination_worker",
                        "--worker-id", str(i)
                    ]
                    self.process_monitor.add_process(worker_name, command)
                    await self.process_monitor.start_process(worker_name)
            else:
                for i in range(new_combo_count, current_combo_workers):
                    worker_name = f"combo_worker_{i}"
                    await self.process_monitor.stop_process(worker_name)
                    self.process_monitor.remove_process(worker_name)
    
    async def get_worker_health_report(self) -> Dict[str, Any]:
        """获取工作器健康报告"""
        all_status = self.get_worker_status()
        statistics = self.get_worker_statistics()
        
        # 分析健康状态
        health_issues = []
        
        # 检查崩溃的工作器
        crashed_workers = [name for name, status in all_status.items() 
                          if status and status['status'] == 'crashed']
        if crashed_workers:
            health_issues.append(f"发现 {len(crashed_workers)} 个崩溃的工作器")
        
        # 检查重启频率
        high_restart_workers = [name for name, status in all_status.items() 
                               if status and status['restart_count'] > 5]
        if high_restart_workers:
            health_issues.append(f"发现 {len(high_restart_workers)} 个频繁重启的工作器")
        
        # 检查资源使用
        high_cpu_workers = [name for name, status in all_status.items() 
                           if status and status['cpu_percent'] > 80]
        if high_cpu_workers:
            health_issues.append(f"发现 {len(high_cpu_workers)} 个高CPU使用率的工作器")
        
        overall_health = "healthy" if not health_issues else "warning" if len(health_issues) < 3 else "critical"
        
        return {
            'overall_health': overall_health,
            'statistics': statistics,
            'health_issues': health_issues,
            'worker_details': all_status,
            'timestamp': datetime.now().isoformat()
        } 