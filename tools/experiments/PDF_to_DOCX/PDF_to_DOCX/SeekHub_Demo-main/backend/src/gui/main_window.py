"""
SeekHub监控系统主窗口
"""

import asyncio
import threading
from typing import Optional

try:
    import customtkinter as ctk
    CTK_AVAILABLE = True
except ImportError:
    import tkinter as tk
    CTK_AVAILABLE = False

from .theme import COLORS, GUI_CONFIG, apply_theme
from .components import HeaderPanel, StatusBar, ControlPanel, MonitorPanel
from ..common.logger import LoggerMixin
from ..common.health_monitor import health_monitor


class SeekHubMonitorWindow(LoggerMixin):
    """SeekHub监控系统主窗口"""
    
    def __init__(self):
        # 应用主题
        apply_theme()
        
        # 创建主窗口
        if CTK_AVAILABLE:
            self.root = ctk.CTk()
        else:
            self.root = tk.Tk()
        
        self.root.title("SeekHub 翻译系统监控中心")
        self.root.geometry(GUI_CONFIG['window_size'])
        self.root.minsize(*GUI_CONFIG['min_window_size'])
        
        # 设置窗口图标和样式
        self._configure_window()
        
        # 初始化组件 - 创建布局会设置这些组件
        self.header = None
        self.status_bar = None
        self.control_panel = None
        self.monitor_panel = None
        
        # 监控状态
        self.is_monitoring = False
        self.monitor_thread = None
        
        # 创建界面
        self._create_layout()
        
        # 设置关闭处理
        self.root.protocol("WM_DELETE_WINDOW", self._on_closing)
        
        self.log_info("GUI主窗口初始化完成")
    
    def _safe_call(self, component, method_name, *args, **kwargs):
        """安全调用组件方法，避免None错误"""
        if component and hasattr(component, method_name):
            getattr(component, method_name)(*args, **kwargs)
    
    def _configure_window(self):
        """配置窗口属性"""
        if CTK_AVAILABLE:
            # customtkinter使用不同的方法设置背景色
            pass  # 主题已在apply_theme()中设置
        else:
            self.root.configure(bg=COLORS['background'])
    
    def _create_layout(self):
        """创建布局"""
        # 头部面板
        self.header = HeaderPanel(self.root)
        self.header.pack(fill="x", pady=(0, 10))
        
        # 主内容区域
        main_frame = ctk.CTkFrame(self.root) if CTK_AVAILABLE else tk.Frame(self.root)
        main_frame.pack(fill="both", expand=True, padx=10, pady=(0, 10))
        
        # 左侧控制面板
        self.control_panel = ControlPanel(main_frame)
        self.control_panel.pack(side="left", fill="y", padx=(0, 10))
        
        # 右侧监控面板
        self.monitor_panel = MonitorPanel(main_frame)
        self.monitor_panel.pack(side="right", fill="both", expand=True)
        
        # 底部状态栏
        self.status_bar = StatusBar(self.root)
        self.status_bar.pack(fill="x", side="bottom")
        
        # 注册控制面板回调
        self._register_callbacks()
        
        # 启动状态栏时间更新
        self.status_bar.update_time()
    
    def _register_callbacks(self):
        """注册控制面板回调函数"""
        if self.control_panel:
            self.control_panel.register_callback('start_monitoring', self.start_monitoring)
            self.control_panel.register_callback('stop_monitoring', self.stop_monitoring)
    
    def start_monitoring(self):
        """开始监控"""
        if self.is_monitoring:
            self.log_warning("监控已在运行中")
            return
        
        self.log_info("开始系统监控")
        if self.status_bar:
            self.status_bar.update_status("开始监控系统...", "processing")
            self.status_bar.animate_processing()
        
        self.is_monitoring = True
        
        # 在新线程中运行监控
        self.monitor_thread = threading.Thread(target=self._run_monitoring, daemon=True)
        self.monitor_thread.start()
        
        # 更新按钮状态
        if self.control_panel:
            self.control_panel.update_button_states(
                monitoring=True,
                workers_running=False,
                system_running=False
            )
    
    def stop_monitoring(self):
        """停止监控"""
        if not self.is_monitoring:
            self.log_warning("监控未在运行")
            return
        
        self.log_info("停止系统监控")
        if self.status_bar:
            self.status_bar.update_status("停止监控...", "warning")
            self.status_bar.stop_animation()
        
        self.is_monitoring = False
        
        if self.monitor_thread and self.monitor_thread.is_alive():
            self.monitor_thread.join(timeout=2)
        
        if self.status_bar:
            self.status_bar.update_status("监控已停止", "info")
        
        # 更新按钮状态
        if self.control_panel:
            self.control_panel.update_button_states(
                monitoring=False,
                workers_running=False,
                system_running=False
            )
    

    

    
    def _run_monitoring(self):
        """运行监控循环"""
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            loop.run_until_complete(self._monitoring_loop())
        except Exception as e:
            self.log_error(f"监控循环错误: {e}")
        finally:
            loop.close()
    
    async def _monitoring_loop(self):
        """监控循环"""
        while self.is_monitoring:
            try:
                # 获取健康报告
                health_report = await health_monitor.get_health_report()
                
                # 更新GUI（在主线程中）
                self.root.after(0, lambda: self._update_gui_with_health_report(health_report))
                
                # 等待一段时间
                await asyncio.sleep(5)
                
            except Exception as e:
                self.log_error(f"监控更新错误: {e}")
                await asyncio.sleep(1)
    
    def _update_gui_with_health_report(self, health_report):
        """使用健康报告更新GUI"""
        try:
            # 简化版本 - 仅记录日志，不更新GUI组件
            metrics = health_report.system_metrics
            self.log_info(f"系统状态: CPU {metrics.cpu_percent:.1f}%, 内存 {metrics.memory_percent:.1f}%")
            
            if health_report.alerts:
                for alert in health_report.alerts:
                    self.log_warning(f"系统告警: {alert}")
            
        except Exception as e:
            self.log_error(f"处理健康报告失败: {e}")
    
    def _on_closing(self):
        """窗口关闭处理"""
        self.log_info("正在关闭监控窗口...")
        
        # 停止监控
        if self.is_monitoring:
            self.stop_monitoring()
        
        # 销毁窗口
        self.root.destroy()
    
    def run(self):
        """运行主窗口"""
        self.log_info("启动SeekHub监控界面")
        self._safe_call(self.status_bar, "update_status", "系统就绪", "info")
        
        try:
            self.root.mainloop()
        except KeyboardInterrupt:
            self.log_info("收到中断信号，正在关闭...")
        except Exception as e:
            self.log_error(f"GUI运行错误: {e}")
        finally:
            self.log_info("GUI已关闭") 