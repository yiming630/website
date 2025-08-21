"""
控制面板组件
提供系统控制功能
"""

from typing import Callable, Optional
from .base import BaseFrame, BaseButton, BaseLabel
from ..theme import COLORS


class ControlPanel(BaseFrame):
    """控制面板组件"""
    
    def __init__(self, parent):
        super().__init__(parent, fg_color=COLORS['surface'])
        self.callbacks = {}
        self._create_control_elements()
    
    def _create_control_elements(self):
        """创建控制元素"""
        # 标题
        title_label = BaseLabel(
            self.widget,
            text="🎛️ 系统控制",
            font=('Helvetica', 14, 'bold'),
            text_color=COLORS['text']
        )
        title_label.pack(pady=(10, 20))
        
        # 按钮容器
        button_frame = BaseFrame(self.widget, fg_color="transparent")
        button_frame.pack(pady=10, padx=20, fill="x")
        
        # 监控控制
        self._create_monitoring_controls(button_frame.widget)
        
        # 工作器控制
        self._create_worker_controls(button_frame.widget)
        
        # 系统控制
        self._create_system_controls(button_frame.widget)
    
    def _create_monitoring_controls(self, parent):
        """创建监控控制按钮"""
        monitor_frame = BaseFrame(parent, fg_color="transparent")
        monitor_frame.pack(pady=10, fill="x")
        
        BaseLabel(
            monitor_frame.widget,
            text="📊 监控控制",
            font=('Helvetica', 12, 'bold'),
            text_color=COLORS['accent']
        ).pack(pady=(0, 10))
        
        # 开始监控按钮
        self.start_monitor_btn = BaseButton(
            monitor_frame.widget,
            text="🚀 开始监控",
            command=lambda: self._execute_callback('start_monitoring'),
            fg_color=COLORS['secondary'],
            hover_color=COLORS['primary']
        )
        self.start_monitor_btn.pack(side="left", padx=5, fill="x", expand=True)
        
        # 停止监控按钮
        self.stop_monitor_btn = BaseButton(
            monitor_frame.widget,
            text="⏹️ 停止监控",
            command=lambda: self._execute_callback('stop_monitoring'),
            fg_color=COLORS['warning'],
            hover_color=COLORS['error']
        )
        self.stop_monitor_btn.pack(side="left", padx=5, fill="x", expand=True)
    
    def _create_worker_controls(self, parent):
        """创建工作器控制按钮"""
        worker_frame = BaseFrame(parent, fg_color="transparent")
        worker_frame.pack(pady=10, fill="x")
        
        BaseLabel(
            worker_frame.widget,
            text="⚙️ 工作器控制",
            font=('Helvetica', 12, 'bold'),
            text_color=COLORS['accent']
        ).pack(pady=(0, 10))
        
        # 启动工作器按钮
        self.start_workers_btn = BaseButton(
            worker_frame.widget,
            text="🔧 启动Workers",
            command=lambda: self._execute_callback('start_workers'),
            fg_color=COLORS['secondary'],
            hover_color=COLORS['primary']
        )
        self.start_workers_btn.pack(side="left", padx=5, fill="x", expand=True)
        
        # 停止工作器按钮
        self.stop_workers_btn = BaseButton(
            worker_frame.widget,
            text="⏸️ 停止Workers",
            command=lambda: self._execute_callback('stop_workers'),
            fg_color=COLORS['warning'],
            hover_color=COLORS['error']
        )
        self.stop_workers_btn.pack(side="left", padx=5, fill="x", expand=True)
    
    def _create_system_controls(self, parent):
        """创建系统控制按钮"""
        system_frame = BaseFrame(parent, fg_color="transparent")
        system_frame.pack(pady=10, fill="x")
        
        BaseLabel(
            system_frame.widget,
            text="🖥️ 系统控制",
            font=('Helvetica', 12, 'bold'),
            text_color=COLORS['accent']
        ).pack(pady=(0, 10))
        
        # 启动翻译系统按钮
        self.start_system_btn = BaseButton(
            system_frame.widget,
            text="🌟 启动翻译系统",
            command=lambda: self._execute_callback('start_translation_system'),
            fg_color=COLORS['secondary'],
            hover_color=COLORS['primary']
        )
        self.start_system_btn.pack(side="left", padx=5, fill="x", expand=True)
        
        # 停止翻译系统按钮
        self.stop_system_btn = BaseButton(
            system_frame.widget,
            text="🛑 停止翻译系统",
            command=lambda: self._execute_callback('stop_translation_system'),
            fg_color=COLORS['error'],
            hover_color=('#8B0000')  # 深红色
        )
        self.stop_system_btn.pack(side="left", padx=5, fill="x", expand=True)
    
    def register_callback(self, action: str, callback: Callable):
        """注册回调函数"""
        self.callbacks[action] = callback
    
    def _execute_callback(self, action: str):
        """执行回调函数"""
        if action in self.callbacks:
            try:
                self.callbacks[action]()
            except Exception as e:
                self.log_error(f"执行回调失败 {action}: {e}")
    
    def set_button_state(self, button_name: str, enabled: bool):
        """设置按钮状态"""
        buttons = {
            'start_monitor': self.start_monitor_btn,
            'stop_monitor': self.stop_monitor_btn,
            'start_workers': self.start_workers_btn,
            'stop_workers': self.stop_workers_btn,
            'start_system': self.start_system_btn,
            'stop_system': self.stop_system_btn
        }
        
        if button_name in buttons:
            button = buttons[button_name]
            if enabled:
                button.configure(state="normal")
            else:
                button.configure(state="disabled")
    
    def update_button_states(self, monitoring: bool, workers_running: bool, system_running: bool):
        """批量更新按钮状态"""
        # 监控按钮状态
        self.set_button_state('start_monitor', not monitoring)
        self.set_button_state('stop_monitor', monitoring)
        
        # 工作器按钮状态
        self.set_button_state('start_workers', not workers_running)
        self.set_button_state('stop_workers', workers_running)
        
        # 系统按钮状态
        self.set_button_state('start_system', not system_running)
        self.set_button_state('stop_system', system_running) 