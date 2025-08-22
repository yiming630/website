"""
状态栏组件
显示系统状态和连接信息
"""

from datetime import datetime
from .base import BaseFrame, BaseLabel
from ..theme import COLORS


class StatusBar(BaseFrame):
    """状态栏组件"""
    
    def __init__(self, parent):
        super().__init__(parent, fg_color=COLORS['surface'], height=40)
        self._create_status_elements()
        self._is_animating = False
    
    def _create_status_elements(self):
        """创建状态元素"""
        # 主状态标签
        self.status_label = BaseLabel(
            self.widget,
            text="🟢 系统就绪",
            text_color=COLORS['text']
        )
        self.status_label.pack(side="left", padx=10, pady=5)
        
        # 连接状态指示器
        self.connection_frame = BaseFrame(self.widget, fg_color="transparent")
        self.connection_frame.pack(side="left", padx=20)
        
        # Firestore状态
        self.firestore_indicator = BaseLabel(
            self.connection_frame.widget,
            text="🔥 Firestore: 未连接",
            text_color=COLORS['error']
        )
        self.firestore_indicator.pack(side="left", padx=5)
        
        # PubSub状态
        self.pubsub_indicator = BaseLabel(
            self.connection_frame.widget,
            text="📨 PubSub: 未连接",
            text_color=COLORS['error']
        )
        self.pubsub_indicator.pack(side="left", padx=5)
        
        # Worker状态
        self.worker_indicator = BaseLabel(
            self.connection_frame.widget,
            text="⚙️ Workers: 0/0",
            text_color=COLORS['warning']
        )
        self.worker_indicator.pack(side="left", padx=5)
        
        # 时间标签
        self.time_label = BaseLabel(
            self.widget,
            text=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            text_color=COLORS['text_secondary']
        )
        self.time_label.pack(side="right", padx=10, pady=5)
    
    def update_status(self, message: str, status_type: str = "info"):
        """更新主状态"""
        status_icons = {
            "info": "🟢",
            "warning": "🟡",
            "error": "🔴",
            "processing": "🔄"
        }
        
        icon = status_icons.get(status_type, "🟢")
        self.status_label.set_text(f"{icon} {message}")
        
        # 根据状态类型设置颜色
        colors = {
            "info": COLORS['text'],
            "warning": COLORS['warning'],
            "error": COLORS['error'],
            "processing": COLORS['accent']
        }
        
        color = colors.get(status_type, COLORS['text'])
        self.status_label.configure(text_color=color)
    
    def update_firestore_status(self, connected: bool):
        """更新Firestore连接状态"""
        if connected:
            self.firestore_indicator.set_text("🔥 Firestore: 已连接")
            self.firestore_indicator.configure(text_color=COLORS['secondary'])
        else:
            self.firestore_indicator.set_text("🔥 Firestore: 未连接")
            self.firestore_indicator.configure(text_color=COLORS['error'])
    
    def update_pubsub_status(self, connected: bool):
        """更新PubSub连接状态"""
        if connected:
            self.pubsub_indicator.set_text("📨 PubSub: 已连接")
            self.pubsub_indicator.configure(text_color=COLORS['secondary'])
        else:
            self.pubsub_indicator.set_text("📨 PubSub: 未连接")
            self.pubsub_indicator.configure(text_color=COLORS['error'])
    
    def update_worker_status(self, active_workers: int, total_workers: int):
        """更新Worker状态"""
        self.worker_indicator.set_text(f"⚙️ Workers: {active_workers}/{total_workers}")
        
        if active_workers == 0:
            color = COLORS['error']
        elif active_workers < total_workers:
            color = COLORS['warning']
        else:
            color = COLORS['secondary']
        
        self.worker_indicator.configure(text_color=color)
    
    def update_time(self):
        """更新时间显示"""
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        self.time_label.set_text(current_time)
        
        # 每秒更新时间
        if self.widget:
            self.widget.after(1000, self.update_time)
    
    def animate_processing(self):
        """处理中动画效果"""
        if self._is_animating:
            return
        
        self._is_animating = True
        self._animate_step = 0
        self._animate_processing_step()
    
    def _animate_processing_step(self):
        """处理动画步骤"""
        if not self._is_animating:
            return
        
        animations = ["🔄", "⚙️", "📊", "🔍"]
        icon = animations[self._animate_step % len(animations)]
        
        # 获取当前状态文本，替换图标
        current_text = self.status_label.widget.cget("text")
        if current_text and len(current_text) > 2:
            new_text = icon + current_text[1:]
            self.status_label.set_text(new_text)
        
        self._animate_step += 1
        
        if self.widget:
            self.widget.after(500, self._animate_processing_step)
    
    def stop_animation(self):
        """停止动画"""
        self._is_animating = False 