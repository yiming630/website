"""
系统监控模块
提供系统性能指标监控功能
"""

import asyncio
import psutil
import time
from typing import Dict, List, Any, Optional, Callable
from datetime import datetime
from collections import deque

from ..common.logger import LoggerMixin
from ..common.error_handler import async_error_handler, ErrorSeverity


class SystemMonitor(LoggerMixin):
    """系统监控器"""
    
    def __init__(self, history_size: int = 1000):
        self.is_running = False
        self.history_size = history_size
        self.metrics_history = deque(maxlen=history_size)
        self.network_baseline = None
        self.last_network_io = None
        
    @async_error_handler(severity=ErrorSeverity.LOW, component="SystemMonitor")
    async def get_system_metrics(self) -> Dict[str, Any]:
        """获取系统性能指标"""
        # CPU使用率
        cpu_percent = psutil.cpu_percent(interval=1)
        
        # 内存使用率
        memory = psutil.virtual_memory()
        memory_percent = memory.percent
        memory_used_gb = memory.used / (1024**3)
        memory_total_gb = memory.total / (1024**3)
        
        # 磁盘使用率
        disk = psutil.disk_usage('/')
        disk_usage_percent = (disk.used / disk.total) * 100
        disk_used_gb = disk.used / (1024**3)
        disk_total_gb = disk.total / (1024**3)
        
        # 网络I/O
        net_io = psutil.net_io_counters()
        network_io = {
            'bytes_sent': net_io.bytes_sent,
            'bytes_recv': net_io.bytes_recv,
            'packets_sent': net_io.packets_sent,
            'packets_recv': net_io.packets_recv
        }
        
        # 计算网络速度
        network_speed = self._calculate_network_speed(network_io)
        
        # 进程信息
        process_count = len(psutil.pids())
        
        # 系统负载（仅Linux/macOS）
        try:
            load_avg = psutil.getloadavg()
        except AttributeError:
            load_avg = (0, 0, 0)  # Windows不支持
        
        # 启动时间
        boot_time = psutil.boot_time()
        uptime = time.time() - boot_time
        
        metrics = {
            'timestamp': datetime.now(),
            'cpu': {
                'percent': cpu_percent,
                'count': psutil.cpu_count(),
                'frequency': psutil.cpu_freq()._asdict() if psutil.cpu_freq() else None
            },
            'memory': {
                'percent': memory_percent,
                'used_gb': memory_used_gb,
                'total_gb': memory_total_gb,
                'available_gb': memory.available / (1024**3)
            },
            'disk': {
                'percent': disk_usage_percent,
                'used_gb': disk_used_gb,
                'total_gb': disk_total_gb,
                'free_gb': disk.free / (1024**3)
            },
            'network': {
                'io': network_io,
                'speed': network_speed
            },
            'system': {
                'process_count': process_count,
                'load_avg': load_avg,
                'uptime': uptime
            }
        }
        
        # 添加到历史记录
        self.metrics_history.append(metrics)
        
        return metrics
    
    def _calculate_network_speed(self, current_io: Dict[str, int]) -> Dict[str, float]:
        """计算网络传输速度"""
        if self.last_network_io is None:
            self.last_network_io = current_io.copy()
            self.last_network_time = time.time()
            return {'sent_mbps': 0, 'recv_mbps': 0}
        
        current_time = time.time()
        time_diff = current_time - self.last_network_time
        
        if time_diff <= 0:
            return {'sent_mbps': 0, 'recv_mbps': 0}
        
        # 计算速度 (Mbps)
        sent_diff = current_io['bytes_sent'] - self.last_network_io['bytes_sent']
        recv_diff = current_io['bytes_recv'] - self.last_network_io['bytes_recv']
        
        sent_mbps = (sent_diff * 8) / (time_diff * 1024 * 1024)  # 转换为 Mbps
        recv_mbps = (recv_diff * 8) / (time_diff * 1024 * 1024)
        
        # 更新基线
        self.last_network_io = current_io.copy()
        self.last_network_time = current_time
        
        return {
            'sent_mbps': max(0, sent_mbps),
            'recv_mbps': max(0, recv_mbps)
        }
    
    @async_error_handler(severity=ErrorSeverity.MEDIUM, component="SystemMonitor")
    async def get_process_info(self) -> List[Dict[str, Any]]:
        """获取进程信息"""
        processes = []
        
        for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent', 'status', 'create_time']):
            try:
                process_info = proc.info
                process_info['uptime'] = time.time() - process_info['create_time']
                processes.append(process_info)
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue
        
        # 按CPU使用率排序
        processes.sort(key=lambda x: x.get('cpu_percent', 0), reverse=True)
        
        return processes[:20]  # 返回前20个进程
    
    def get_metrics_history(self, minutes: int = 60) -> List[Dict[str, Any]]:
        """获取指定时间范围内的指标历史"""
        cutoff_time = datetime.now().timestamp() - (minutes * 60)
        
        return [
            metrics for metrics in self.metrics_history
            if metrics['timestamp'].timestamp() >= cutoff_time
        ]
    
    def get_average_metrics(self, minutes: int = 5) -> Dict[str, float]:
        """获取指定时间范围内的平均指标"""
        history = self.get_metrics_history(minutes)
        
        if not history:
            return {
                'avg_cpu': 0,
                'avg_memory': 0,
                'avg_disk': 0,
                'avg_network_sent': 0,
                'avg_network_recv': 0
            }
        
        total_cpu = sum(m['cpu']['percent'] for m in history)
        total_memory = sum(m['memory']['percent'] for m in history)
        total_disk = sum(m['disk']['percent'] for m in history)
        total_net_sent = sum(m['network']['speed']['sent_mbps'] for m in history)
        total_net_recv = sum(m['network']['speed']['recv_mbps'] for m in history)
        
        count = len(history)
        
        return {
            'avg_cpu': total_cpu / count,
            'avg_memory': total_memory / count,
            'avg_disk': total_disk / count,
            'avg_network_sent': total_net_sent / count,
            'avg_network_recv': total_net_recv / count
        }
    
    def detect_anomalies(self, metrics: Dict[str, Any]) -> List[str]:
        """检测系统异常"""
        anomalies = []
        
        cpu_percent = metrics['cpu']['percent']
        memory_percent = metrics['memory']['percent']
        disk_percent = metrics['disk']['percent']
        
        # CPU异常检测
        if cpu_percent > 95:
            anomalies.append(f"CPU使用率过高: {cpu_percent:.1f}%")
        elif cpu_percent > 80:
            anomalies.append(f"CPU使用率偏高: {cpu_percent:.1f}%")
        
        # 内存异常检测
        if memory_percent > 95:
            anomalies.append(f"内存使用率过高: {memory_percent:.1f}%")
        elif memory_percent > 80:
            anomalies.append(f"内存使用率偏高: {memory_percent:.1f}%")
        
        # 磁盘异常检测
        if disk_percent > 95:
            anomalies.append(f"磁盘使用率过高: {disk_percent:.1f}%")
        elif disk_percent > 85:
            anomalies.append(f"磁盘使用率偏高: {disk_percent:.1f}%")
        
        # 进程数量异常检测
        process_count = metrics['system']['process_count']
        if process_count > 500:
            anomalies.append(f"进程数量过多: {process_count}")
        
        return anomalies
    
    async def start_monitoring(self, interval: int = 5, callback: Optional[Callable[[Dict[str, Any]], None]] = None):
        """开始监控"""
        if self.is_running:
            self.log_warning("系统监控已在运行")
            return
        
        self.is_running = True
        self.log_info(f"开始系统监控，间隔: {interval}秒")
        
        try:
            while self.is_running:
                # 获取系统指标
                metrics = await self.get_system_metrics()
                
                # 检测异常
                anomalies = self.detect_anomalies(metrics)
                if anomalies:
                    for anomaly in anomalies:
                        self.log_warning(f"系统异常: {anomaly}")
                
                # 执行回调
                if callback:
                    try:
                        if asyncio.iscoroutinefunction(callback):
                            await callback(metrics)
                        else:
                            callback(metrics)
                    except Exception as e:
                        self.log_error(f"监控回调执行失败: {e}")
                
                await asyncio.sleep(interval)
                
        except asyncio.CancelledError:
            self.log_info("系统监控被取消")
        except Exception as e:
            self.log_error(f"系统监控错误: {e}")
        finally:
            self.is_running = False
            self.log_info("系统监控已停止")
    
    def stop_monitoring(self):
        """停止监控"""
        self.is_running = False
        self.log_info("正在停止系统监控...")
    
    def get_summary(self) -> Dict[str, Any]:
        """获取监控摘要"""
        if not self.metrics_history:
            return {"error": "暂无监控数据"}
        
        latest = self.metrics_history[-1]
        avg_5min = self.get_average_metrics(5)
        avg_1hour = self.get_average_metrics(60)
        
        return {
            'current': {
                'cpu': latest['cpu']['percent'],
                'memory': latest['memory']['percent'],
                'disk': latest['disk']['percent'],
                'processes': latest['system']['process_count']
            },
            'averages': {
                '5min': avg_5min,
                '1hour': avg_1hour
            },
            'uptime': latest['system']['uptime'],
            'data_points': len(self.metrics_history)
        } 