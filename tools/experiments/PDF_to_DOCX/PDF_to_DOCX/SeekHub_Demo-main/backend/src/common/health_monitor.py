"""
系统健康监控模块
提供系统资源、服务状态、性能指标的监控功能
"""

import asyncio
import psutil
import time
from typing import Dict, List, Any, Optional, Callable
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum

from .logger import LoggerMixin
from .error_handler import ErrorSeverity, async_error_handler


class HealthStatus(Enum):
    """健康状态枚举"""
    HEALTHY = "healthy"
    WARNING = "warning"
    CRITICAL = "critical"
    UNKNOWN = "unknown"


@dataclass
class SystemMetrics:
    """系统指标数据类"""
    timestamp: datetime
    cpu_percent: float
    memory_percent: float
    disk_usage_percent: float
    network_sent: int
    network_recv: int
    process_count: int


@dataclass
class ServiceStatus:
    """服务状态数据类"""
    name: str
    status: HealthStatus
    last_check: datetime
    response_time: Optional[float] = None
    error_message: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class HealthReport:
    """健康报告数据类"""
    timestamp: datetime
    overall_status: HealthStatus
    system_metrics: SystemMetrics
    services: List[ServiceStatus]
    alerts: List[str] = field(default_factory=list)


class HealthMonitor(LoggerMixin):
    """系统健康监控器"""
    
    def __init__(self):
        self.services: Dict[str, Callable] = {}
        self.thresholds = {
            'cpu_warning': 80.0,
            'cpu_critical': 95.0,
            'memory_warning': 80.0,
            'memory_critical': 95.0,
            'disk_warning': 80.0,
            'disk_critical': 95.0,
            'response_time_warning': 5.0,
            'response_time_critical': 10.0
        }
        self.metrics_history: List[SystemMetrics] = []
        self.max_history_size = 1440  # 24小时的分钟数
        self.is_monitoring = False
        self.health_callbacks: List[Callable[[HealthReport], None]] = []
    
    def register_service(self, name: str, health_check_func: Callable) -> None:
        """注册服务健康检查函数"""
        self.services[name] = health_check_func
        self.log_info(f"Registered health check for service: {name}")
    
    def register_health_callback(self, callback: Callable[[HealthReport], None]) -> None:
        """注册健康状态变化回调函数"""
        self.health_callbacks.append(callback)
    
    def set_threshold(self, metric: str, value: float) -> None:
        """设置告警阈值"""
        if f"{metric}_warning" in self.thresholds:
            self.thresholds[f"{metric}_warning"] = value
        if f"{metric}_critical" in self.thresholds:
            self.thresholds[f"{metric}_critical"] = value * 1.2  # 临界值比警告值高20%
    
    @async_error_handler(severity=ErrorSeverity.LOW, component="HealthMonitor")
    async def get_system_metrics(self) -> SystemMetrics:
        """获取系统指标"""
        # CPU使用率
        cpu_percent = psutil.cpu_percent(interval=1)
        
        # 内存使用率
        memory = psutil.virtual_memory()
        memory_percent = memory.percent
        
        # 磁盘使用率
        disk = psutil.disk_usage('/')
        disk_usage_percent = (disk.used / disk.total) * 100
        
        # 网络I/O
        net_io = psutil.net_io_counters()
        
        # 进程数量
        process_count = len(psutil.pids())
        
        return SystemMetrics(
            timestamp=datetime.now(),
            cpu_percent=cpu_percent,
            memory_percent=memory_percent,
            disk_usage_percent=disk_usage_percent,
            network_sent=net_io.bytes_sent,
            network_recv=net_io.bytes_recv,
            process_count=process_count
        )
    
    @async_error_handler(severity=ErrorSeverity.MEDIUM, component="HealthMonitor")
    async def check_service_health(self, name: str) -> ServiceStatus:
        """检查单个服务的健康状态"""
        if name not in self.services:
            return ServiceStatus(
                name=name,
                status=HealthStatus.UNKNOWN,
                last_check=datetime.now(),
                error_message="Service not registered"
            )
        
        start_time = time.time()
        try:
            health_check_func = self.services[name]
            
            # 执行健康检查
            if asyncio.iscoroutinefunction(health_check_func):
                result = await health_check_func()
            else:
                result = health_check_func()
            
            response_time = time.time() - start_time
            
            # 判断响应时间状态
            if response_time > self.thresholds['response_time_critical']:
                status = HealthStatus.CRITICAL
            elif response_time > self.thresholds['response_time_warning']:
                status = HealthStatus.WARNING
            else:
                status = HealthStatus.HEALTHY
            
            # 如果健康检查返回了具体状态
            if isinstance(result, dict) and 'status' in result:
                if result['status'] == 'critical':
                    status = HealthStatus.CRITICAL
                elif result['status'] == 'warning':
                    status = HealthStatus.WARNING
                elif result['status'] == 'healthy':
                    status = HealthStatus.HEALTHY
            
            return ServiceStatus(
                name=name,
                status=status,
                last_check=datetime.now(),
                response_time=response_time,
                metadata=result if isinstance(result, dict) else {}
            )
            
        except Exception as e:
            response_time = time.time() - start_time
            return ServiceStatus(
                name=name,
                status=HealthStatus.CRITICAL,
                last_check=datetime.now(),
                response_time=response_time,
                error_message=str(e)
            )
    
    @async_error_handler(severity=ErrorSeverity.MEDIUM, component="HealthMonitor")
    async def check_all_services(self) -> List[ServiceStatus]:
        """检查所有服务的健康状态"""
        tasks = [
            self.check_service_health(name) 
            for name in self.services.keys()
        ]
        
        if tasks:
            return await asyncio.gather(*tasks)
        return []
    
    def analyze_system_health(self, metrics: SystemMetrics) -> HealthStatus:
        """分析系统健康状态"""
        if (metrics.cpu_percent > self.thresholds['cpu_critical'] or 
            metrics.memory_percent > self.thresholds['memory_critical'] or
            metrics.disk_usage_percent > self.thresholds['disk_critical']):
            return HealthStatus.CRITICAL
        
        if (metrics.cpu_percent > self.thresholds['cpu_warning'] or 
            metrics.memory_percent > self.thresholds['memory_warning'] or
            metrics.disk_usage_percent > self.thresholds['disk_warning']):
            return HealthStatus.WARNING
        
        return HealthStatus.HEALTHY
    
    def generate_alerts(self, metrics: SystemMetrics, services: List[ServiceStatus]) -> List[str]:
        """生成告警信息"""
        alerts = []
        
        # 系统资源告警
        if metrics.cpu_percent > self.thresholds['cpu_critical']:
            alerts.append(f"CPU使用率过高: {metrics.cpu_percent:.1f}%")
        elif metrics.cpu_percent > self.thresholds['cpu_warning']:
            alerts.append(f"CPU使用率警告: {metrics.cpu_percent:.1f}%")
        
        if metrics.memory_percent > self.thresholds['memory_critical']:
            alerts.append(f"内存使用率过高: {metrics.memory_percent:.1f}%")
        elif metrics.memory_percent > self.thresholds['memory_warning']:
            alerts.append(f"内存使用率警告: {metrics.memory_percent:.1f}%")
        
        if metrics.disk_usage_percent > self.thresholds['disk_critical']:
            alerts.append(f"磁盘使用率过高: {metrics.disk_usage_percent:.1f}%")
        elif metrics.disk_usage_percent > self.thresholds['disk_warning']:
            alerts.append(f"磁盘使用率警告: {metrics.disk_usage_percent:.1f}%")
        
        # 服务状态告警
        for service in services:
            if service.status == HealthStatus.CRITICAL:
                alerts.append(f"服务 {service.name} 状态危险: {service.error_message or '未知错误'}")
            elif service.status == HealthStatus.WARNING:
                alerts.append(f"服务 {service.name} 状态警告")
            
            if (service.response_time and 
                service.response_time > self.thresholds['response_time_critical']):
                alerts.append(f"服务 {service.name} 响应时间过长: {service.response_time:.2f}s")
        
        return alerts
    
    @async_error_handler(severity=ErrorSeverity.MEDIUM, component="HealthMonitor")
    async def get_health_report(self) -> HealthReport:
        """获取完整的健康报告"""
        # 获取系统指标
        metrics = await self.get_system_metrics()
        
        # 检查所有服务
        services = await self.check_all_services()
        
        # 分析整体健康状态
        system_status = self.analyze_system_health(metrics)
        
        # 考虑服务状态
        critical_services = [s for s in services if s.status == HealthStatus.CRITICAL]
        warning_services = [s for s in services if s.status == HealthStatus.WARNING]
        
        if critical_services or system_status == HealthStatus.CRITICAL:
            overall_status = HealthStatus.CRITICAL
        elif warning_services or system_status == HealthStatus.WARNING:
            overall_status = HealthStatus.WARNING
        else:
            overall_status = HealthStatus.HEALTHY
        
        # 生成告警
        alerts = self.generate_alerts(metrics, services)
        
        # 保存指标历史
        self._add_metrics_to_history(metrics)
        
        report = HealthReport(
            timestamp=datetime.now(),
            overall_status=overall_status,
            system_metrics=metrics,
            services=services,
            alerts=alerts
        )
        
        # 执行回调函数
        for callback in self.health_callbacks:
            try:
                callback(report)
            except Exception as e:
                self.log_error(f"Health callback failed: {e}")
        
        return report
    
    def _add_metrics_to_history(self, metrics: SystemMetrics):
        """添加指标到历史记录"""
        self.metrics_history.append(metrics)
        
        # 保持历史大小
        if len(self.metrics_history) > self.max_history_size:
            self.metrics_history = self.metrics_history[-self.max_history_size:]
    
    def get_metrics_history(self, hours: int = 1) -> List[SystemMetrics]:
        """获取指定时间范围内的指标历史"""
        cutoff_time = datetime.now() - timedelta(hours=hours)
        return [
            metrics for metrics in self.metrics_history 
            if metrics.timestamp >= cutoff_time
        ]
    
    async def start_monitoring(self, interval: int = 60):
        """开始监控"""
        if self.is_monitoring:
            self.log_warning("Health monitoring is already running")
            return
        
        self.is_monitoring = True
        self.log_info(f"Starting health monitoring with interval: {interval}s")
        
        try:
            while self.is_monitoring:
                await self.get_health_report()
                await asyncio.sleep(interval)
        except asyncio.CancelledError:
            self.log_info("Health monitoring cancelled")
        except Exception as e:
            self.log_error(f"Health monitoring error: {e}")
        finally:
            self.is_monitoring = False
    
    def stop_monitoring(self):
        """停止监控"""
        self.is_monitoring = False
        self.log_info("Health monitoring stopped")


# 全局健康监控器实例
health_monitor = HealthMonitor() 