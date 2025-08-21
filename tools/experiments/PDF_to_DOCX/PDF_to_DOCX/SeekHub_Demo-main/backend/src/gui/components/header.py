"""
头部组件
显示应用标题和基本信息
"""

from .base import BaseFrame, BaseLabel
from ..theme import COLORS, GUI_CONFIG


class HeaderPanel(BaseFrame):
    """头部面板组件"""
    
    def __init__(self, parent):
        super().__init__(parent, fg_color=COLORS['primary'], height=80)
        self._create_header_content()
    
    def _create_header_content(self):
        """创建头部内容"""
        # 主标题
        self.title_label = BaseLabel(
            self.widget,
            text="🌟 SeekHub 翻译系统监控中心",
            font=GUI_CONFIG['title_font'],
            text_color=COLORS['text']
        )
        self.title_label.pack(pady=20)
        
        # 副标题
        self.subtitle_label = BaseLabel(
            self.widget,
            text="实时监控 • 智能管理 • 高效翻译",
            font=GUI_CONFIG['font_family'],
            text_color=COLORS['text_secondary']
        )
        self.subtitle_label.pack()
    
    def update_title(self, title: str):
        """更新标题"""
        self.title_label.set_text(title)
    
    def update_subtitle(self, subtitle: str):
        """更新副标题"""
        self.subtitle_label.set_text(subtitle) 