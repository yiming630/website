"""
进程监控模块
监控和管理系统进程
"""

import asyncio
import subprocess
import psutil
import signal
import os
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum

from ..common.logger import LoggerMixin
from ..common.error_handler import async_error_handler, ErrorSeverity
from ..common.config_manager import config_manager


class ProcessStatus(Enum):
    """进程状态枚举"""
    RUNNING = "running"
    STOPPED = "stopped"
    CRASHED = "crashed"
    RESTARTING = "restarting"
    UNKNOWN = "unknown"


@dataclass
class ManagedProcess:
    """管理的进程信息"""
    name: str
    command: List[str]
    pid: Optional[int] = None
    status: ProcessStatus = ProcessStatus.STOPPED
    start_time: Optional[datetime] = None
    restart_count: int = 0
    last_restart: Optional[datetime] = None
    cpu_percent: float = 0.0
    memory_percent: float = 0.0
    errors: List[str] = field(default_factory=list)


class ProcessMonitor(LoggerMixin):
    """进程监控器"""
    
    def __init__(self):
        self.managed_processes: Dict[str, ManagedProcess] = {}
        self.is_monitoring = False
        self.max_restart_count = config_manager.get_process_config().max_worker_restarts
        self.restart_delay = config_manager.get_process_config().worker_restart_delay
        
    def add_process(self, name: str, command: List[str]) -> None:
        """添加要管理的进程"""
        self.managed_processes[name] = ManagedProcess(
            name=name,
            command=command
        )
        self.log_info(f"添加管理进程: {name}")
    
    def remove_process(self, name: str) -> bool:
        """移除管理的进程"""
        if name in self.managed_processes:
            # 先停止进程
            asyncio.create_task(self.stop_process(name))
            del self.managed_processes[name]
            self.log_info(f"移除管理进程: {name}")
            return True
        return False
    
    @async_error_handler(severity=ErrorSeverity.MEDIUM, component="ProcessMonitor")
    async def start_process(self, name: str) -> bool:
        """启动进程"""
        if name not in self.managed_processes:
            self.log_error(f"未找到进程配置: {name}")
            return False
        
        process = self.managed_processes[name]
        
        if process.status == ProcessStatus.RUNNING:
            self.log_warning(f"进程 {name} 已在运行")
            return True
        
        try:
            self.log_info(f"启动进程: {name}")
            
            # 启动子进程
            proc = await asyncio.create_subprocess_exec(
                *process.command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            process.pid = proc.pid
            process.status = ProcessStatus.RUNNING
            process.start_time = datetime.now()
            
            self.log_info(f"进程 {name} 启动成功，PID: {proc.pid}")
            return True
            
        except Exception as e:
            error_msg = f"启动进程 {name} 失败: {e}"
            process.errors.append(error_msg)
            process.status = ProcessStatus.CRASHED
            self.log_error(error_msg)
            return False
    
    @async_error_handler(severity=ErrorSeverity.MEDIUM, component="ProcessMonitor")
    async def stop_process(self, name: str, force: bool = False) -> bool:
        """停止进程"""
        if name not in self.managed_processes:
            self.log_error(f"未找到进程: {name}")
            return False
        
        process = self.managed_processes[name]
        
        if process.status != ProcessStatus.RUNNING or not process.pid:
            self.log_warning(f"进程 {name} 未运行")
            return True
        
        try:
            self.log_info(f"停止进程: {name} (PID: {process.pid})")
            
            # 获取进程对象
            try:
                proc = psutil.Process(process.pid)
                
                if force:
                    # 强制终止
                    proc.kill()
                else:
                    # 优雅停止
                    proc.terminate()
                    
                    # 等待进程结束
                    try:
                        proc.wait(timeout=10)
                    except psutil.TimeoutExpired:
                        self.log_warning(f"进程 {name} 未响应终止信号，强制结束")
                        proc.kill()
                
                process.status = ProcessStatus.STOPPED
                process.pid = None
                self.log_info(f"进程 {name} 已停止")
                return True
                
            except psutil.NoSuchProcess:
                # 进程已不存在
                process.status = ProcessStatus.STOPPED
                process.pid = None
                return True
                
        except Exception as e:
            error_msg = f"停止进程 {name} 失败: {e}"
            process.errors.append(error_msg)
            self.log_error(error_msg)
            return False
    
    @async_error_handler(severity=ErrorSeverity.LOW, component="ProcessMonitor")
    async def restart_process(self, name: str) -> bool:
        """重启进程"""
        if name not in self.managed_processes:
            return False
        
        process = self.managed_processes[name]
        
        # 检查重启次数限制
        if process.restart_count >= self.max_restart_count:
            self.log_error(f"进程 {name} 重启次数超限，停止自动重启")
            return False
        
        self.log_info(f"重启进程: {name}")
        
        # 停止进程
        await self.stop_process(name)
        
        # 等待重启延迟
        await asyncio.sleep(self.restart_delay)
        
        # 启动进程
        success = await self.start_process(name)
        
        if success:
            process.restart_count += 1
            process.last_restart = datetime.now()
            self.log_info(f"进程 {name} 重启成功 (第 {process.restart_count} 次)")
        
        return success
    
    @async_error_handler(severity=ErrorSeverity.LOW, component="ProcessMonitor")
    async def check_process_health(self, name: str) -> bool:
        """检查进程健康状态"""
        if name not in self.managed_processes:
            return False
        
        process = self.managed_processes[name]
        
        if not process.pid:
            return False
        
        try:
            proc = psutil.Process(process.pid)
            
            # 检查进程是否存在且运行中
            if not proc.is_running():
                process.status = ProcessStatus.CRASHED
                return False
            
            # 更新进程信息
            process.cpu_percent = proc.cpu_percent()
            process.memory_percent = proc.memory_percent()
            
            # 检查资源使用异常
            if process.cpu_percent > 90:
                self.log_warning(f"进程 {name} CPU使用率过高: {process.cpu_percent:.1f}%")
            
            if process.memory_percent > 90:
                self.log_warning(f"进程 {name} 内存使用率过高: {process.memory_percent:.1f}%")
            
            return True
            
        except psutil.NoSuchProcess:
            process.status = ProcessStatus.CRASHED
            process.pid = None
            return False
        except Exception as e:
            self.log_error(f"检查进程 {name} 健康状态失败: {e}")
            return False
    
    async def start_monitoring(self, interval: int = 30):
        """开始进程监控"""
        if self.is_monitoring:
            self.log_warning("进程监控已在运行")
            return
        
        self.is_monitoring = True
        self.log_info(f"开始进程监控，检查间隔: {interval}秒")
        
        try:
            while self.is_monitoring:
                # 检查所有管理的进程
                for name, process in self.managed_processes.items():
                    if process.status == ProcessStatus.RUNNING:
                        is_healthy = await self.check_process_health(name)
                        
                        if not is_healthy:
                            self.log_warning(f"检测到进程 {name} 异常，准备重启")
                            await self.restart_process(name)
                
                await asyncio.sleep(interval)
                
        except asyncio.CancelledError:
            self.log_info("进程监控被取消")
        except Exception as e:
            self.log_error(f"进程监控错误: {e}")
        finally:
            self.is_monitoring = False
            self.log_info("进程监控已停止")
    
    def stop_monitoring(self):
        """停止进程监控"""
        self.is_monitoring = False
        self.log_info("正在停止进程监控...")
    
    async def stop_all_processes(self):
        """停止所有管理的进程"""
        self.log_info("停止所有管理的进程...")
        
        tasks = []
        for name in self.managed_processes.keys():
            task = asyncio.create_task(self.stop_process(name))
            tasks.append(task)
        
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)
    
    def get_process_status(self, name: str) -> Optional[Dict[str, Any]]:
        """获取进程状态"""
        if name not in self.managed_processes:
            return None
        
        process = self.managed_processes[name]
        
        return {
            'name': process.name,
            'pid': process.pid,
            'status': process.status.value,
            'start_time': process.start_time.isoformat() if process.start_time else None,
            'restart_count': process.restart_count,
            'last_restart': process.last_restart.isoformat() if process.last_restart else None,
            'cpu_percent': process.cpu_percent,
            'memory_percent': process.memory_percent,
            'errors': process.errors[-5:] if process.errors else []  # 最近5个错误
        }
    
    def get_all_status(self) -> Dict[str, Any]:
        """获取所有进程状态"""
        return {
            name: self.get_process_status(name)
            for name in self.managed_processes.keys()
        }
    
    def get_statistics(self) -> Dict[str, Any]:
        """获取进程统计信息"""
        total = len(self.managed_processes)
        running = sum(1 for p in self.managed_processes.values() if p.status == ProcessStatus.RUNNING)
        crashed = sum(1 for p in self.managed_processes.values() if p.status == ProcessStatus.CRASHED)
        stopped = sum(1 for p in self.managed_processes.values() if p.status == ProcessStatus.STOPPED)
        
        total_restarts = sum(p.restart_count for p in self.managed_processes.values())
        total_errors = sum(len(p.errors) for p in self.managed_processes.values())
        
        return {
            'total_processes': total,
            'running': running,
            'crashed': crashed,
            'stopped': stopped,
            'total_restarts': total_restarts,
            'total_errors': total_errors,
            'monitoring': self.is_monitoring
        } 