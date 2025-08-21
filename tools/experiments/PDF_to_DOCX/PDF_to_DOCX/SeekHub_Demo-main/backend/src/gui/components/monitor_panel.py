"""
监控面板组件
显示系统监控信息和统计数据
"""

try:
    import customtkinter as ctk
    CTK_AVAILABLE = True
except ImportError:
    import tkinter as tk
    import tkinter.ttk as ttk
    CTK_AVAILABLE = False

from .base import BaseFrame, BaseLabel, BaseTextBox
from ..theme import COLORS


class MonitorPanel(BaseFrame):
    """监控面板组件"""
    
    def __init__(self, parent):
        super().__init__(parent, fg_color=COLORS['surface'])
        self._create_monitor_elements()
    
    def _create_monitor_elements(self):
        """创建监控元素"""
        # 创建标签页容器
        if CTK_AVAILABLE:
            self.tabview = ctk.CTkTabview(self.widget)
        else:
            self.tabview = ttk.Notebook(self.widget)
        
        self.tabview.pack(fill="both", expand=True, padx=10, pady=10)
        
        # 创建各个标签页
        self._create_stats_tab()
        self._create_process_tab()
        self._create_log_tab()
        self._create_error_tab()
    
    def _create_stats_tab(self):
        """创建统计标签页"""
        if CTK_AVAILABLE:
            stats_tab = self.tabview.add("📊 统计")
        else:
            stats_tab = BaseFrame(self.tabview.widget).widget
            self.tabview.add(stats_tab, text="📊 统计")
        
        # 系统指标框架
        metrics_frame = BaseFrame(stats_tab, fg_color="transparent")
        metrics_frame.pack(fill="x", padx=10, pady=10)
        
        # CPU使用率
        self.cpu_label = BaseLabel(
            metrics_frame.widget,
            text="🖥️ CPU: 0%",
            font=('Helvetica', 12),
            text_color=COLORS['text']
        )
        self.cpu_label.pack(anchor="w", pady=2)
        
        # 内存使用率
        self.memory_label = BaseLabel(
            metrics_frame.widget,
            text="🧠 内存: 0%",
            font=('Helvetica', 12),
            text_color=COLORS['text']
        )
        self.memory_label.pack(anchor="w", pady=2)
        
        # 磁盘使用率
        self.disk_label = BaseLabel(
            metrics_frame.widget,
            text="💾 磁盘: 0%",
            font=('Helvetica', 12),
            text_color=COLORS['text']
        )
        self.disk_label.pack(anchor="w", pady=2)
        
        # 翻译统计框架
        translation_frame = BaseFrame(stats_tab, fg_color="transparent")
        translation_frame.pack(fill="x", padx=10, pady=10)
        
        BaseLabel(
            translation_frame.widget,
            text="📚 翻译统计",
            font=('Helvetica', 14, 'bold'),
            text_color=COLORS['accent']
        ).pack(anchor="w", pady=(0, 10))
        
        # 书籍统计
        self.books_label = BaseLabel(
            translation_frame.widget,
            text="📖 总书籍: 0",
            font=('Helvetica', 12),
            text_color=COLORS['text']
        )
        self.books_label.pack(anchor="w", pady=2)
        
        # 章节统计
        self.chapters_label = BaseLabel(
            translation_frame.widget,
            text="📄 总章节: 0",
            font=('Helvetica', 12),
            text_color=COLORS['text']
        )
        self.chapters_label.pack(anchor="w", pady=2)
        
        # 翻译速度
        self.speed_label = BaseLabel(
            translation_frame.widget,
            text="⚡ 翻译速度: 0 章节/分钟",
            font=('Helvetica', 12),
            text_color=COLORS['text']
        )
        self.speed_label.pack(anchor="w", pady=2)
    
    def _create_process_tab(self):
        """创建进程标签页"""
        if CTK_AVAILABLE:
            process_tab = self.tabview.add("⚙️ 进程")
        else:
            process_tab = BaseFrame(self.tabview.widget).widget
            self.tabview.add(process_tab, text="⚙️ 进程")
        
        # 进程列表
        self.process_text = BaseTextBox(
            process_tab,
            width=400,
            height=300
        )
        self.process_text.pack(fill="both", expand=True, padx=10, pady=10)
    
    def _create_log_tab(self):
        """创建日志标签页"""
        if CTK_AVAILABLE:
            log_tab = self.tabview.add("📋 日志")
        else:
            log_tab = BaseFrame(self.tabview.widget).widget
            self.tabview.add(log_tab, text="📋 日志")
        
        # 日志控制框架
        log_control_frame = BaseFrame(log_tab, fg_color="transparent")
        log_control_frame.pack(fill="x", padx=10, pady=5)
        
        # 清空日志按钮
        from .base import BaseButton
        clear_log_btn = BaseButton(
            log_control_frame.widget,
            text="🗑️ 清空日志",
            command=self.clear_log,
            fg_color=COLORS['warning'],
            width=100
        )
        clear_log_btn.pack(side="right")
        
        # 日志显示区域
        self.log_text = BaseTextBox(
            log_tab,
            width=400,
            height=300
        )
        self.log_text.pack(fill="both", expand=True, padx=10, pady=(0, 10))
    
    def _create_error_tab(self):
        """创建错误标签页"""
        if CTK_AVAILABLE:
            error_tab = self.tabview.add("❌ 错误")
        else:
            error_tab = BaseFrame(self.tabview.widget).widget
            self.tabview.add(error_tab, text="❌ 错误")
        
        # 错误控制框架
        error_control_frame = BaseFrame(error_tab, fg_color="transparent")
        error_control_frame.pack(fill="x", padx=10, pady=5)
        
        # 清空错误按钮
        from .base import BaseButton
        clear_error_btn = BaseButton(
            error_control_frame.widget,
            text="🗑️ 清空错误",
            command=self.clear_error_log,
            fg_color=COLORS['error'],
            width=100
        )
        clear_error_btn.pack(side="right")
        
        # 错误显示区域
        self.error_text = BaseTextBox(
            error_tab,
            width=400,
            height=300
        )
        self.error_text.pack(fill="both", expand=True, padx=10, pady=(0, 10))
    
    def update_system_metrics(self, cpu_percent: float, memory_percent: float, disk_percent: float):
        """更新系统指标"""
        # 根据使用率设置颜色
        cpu_color = self._get_metric_color(cpu_percent)
        memory_color = self._get_metric_color(memory_percent)
        disk_color = self._get_metric_color(disk_percent)
        
        self.cpu_label.set_text(f"🖥️ CPU: {cpu_percent:.1f}%")
        self.cpu_label.configure(text_color=cpu_color)
        
        self.memory_label.set_text(f"🧠 内存: {memory_percent:.1f}%")
        self.memory_label.configure(text_color=memory_color)
        
        self.disk_label.set_text(f"💾 磁盘: {disk_percent:.1f}%")
        self.disk_label.configure(text_color=disk_color)
    
    def update_translation_stats(self, total_books: int, total_chapters: int, speed: float):
        """更新翻译统计"""
        self.books_label.set_text(f"📖 总书籍: {total_books}")
        self.chapters_label.set_text(f"📄 总章节: {total_chapters}")
        self.speed_label.set_text(f"⚡ 翻译速度: {speed:.1f} 章节/分钟")
    
    def update_process_list(self, processes: list):
        """更新进程列表"""
        self.process_text.clear_text()
        
        process_info = "进程名称\t\tPID\t状态\tCPU%\t内存%\n"
        process_info += "-" * 60 + "\n"
        
        for process in processes:
            info = f"{process.get('name', 'N/A'):<20}\t"
            info += f"{process.get('pid', 'N/A'):<8}\t"
            info += f"{process.get('status', 'N/A'):<8}\t"
            info += f"{process.get('cpu_percent', 0):<6.1f}\t"
            info += f"{process.get('memory_percent', 0):<6.1f}\n"
            process_info += info
        
        self.process_text.insert_text(process_info)
    
    def add_log_message(self, message: str):
        """添加日志消息"""
        from datetime import datetime
        timestamp = datetime.now().strftime("%H:%M:%S")
        log_entry = f"[{timestamp}] {message}\n"
        self.log_text.insert_text(log_entry)
        
        # 自动滚动到底部
        if CTK_AVAILABLE:
            self.log_text.widget.see("end")
        else:
            self.log_text.widget.see(tk.END)
    
    def add_error_message(self, error: dict):
        """添加错误消息"""
        timestamp = error.get('timestamp', 'Unknown')
        error_type = error.get('type', 'Error')
        message = error.get('error', 'Unknown error')
        
        error_entry = f"[{timestamp}] {error_type}: {message}\n"
        self.error_text.insert_text(error_entry)
        
        # 自动滚动到底部
        if CTK_AVAILABLE:
            self.error_text.widget.see("end")
        else:
            self.error_text.widget.see(tk.END)
    
    def clear_log(self):
        """清空日志"""
        self.log_text.clear_text()
    
    def clear_error_log(self):
        """清空错误日志"""
        self.error_text.clear_text()
    
    def _get_metric_color(self, percent: float) -> str:
        """根据百分比获取颜色"""
        if percent >= 90:
            return COLORS['error']
        elif percent >= 75:
            return COLORS['warning']
        elif percent >= 50:
            return COLORS['accent']
        else:
            return COLORS['secondary'] 