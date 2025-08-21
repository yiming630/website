"""
GUI组件基类
提供通用的组件功能和接口
"""

from typing import Any, Optional, Dict
from abc import ABC, abstractmethod

try:
    import customtkinter as ctk
    CTK_AVAILABLE = True
except ImportError:
    import tkinter as tk
    import tkinter.ttk as ttk
    CTK_AVAILABLE = False

from ..theme import COLORS, COMPONENT_STYLES
from ...common.logger import LoggerMixin


class BaseComponent(LoggerMixin):
    """GUI组件基类"""
    
    def __init__(self, parent, **kwargs):
        self.parent = parent
        self.kwargs = kwargs
        self.widget = None
        self._create_widget()
        self._configure_widget()
    
    @abstractmethod
    def _create_widget(self):
        """创建组件控件 - 子类必须实现"""
        pass
    
    def _configure_widget(self):
        """配置组件样式"""
        if self.widget and CTK_AVAILABLE:
            # 应用默认样式
            style_config = COMPONENT_STYLES.get(self.__class__.__name__.lower(), {})
            for key, value in style_config.items():
                try:
                    setattr(self.widget, key, value)
                except AttributeError:
                    # 忽略不支持的属性
                    pass
    
    def pack(self, **kwargs):
        """打包组件"""
        if self.widget:
            self.widget.pack(**kwargs)
    
    def grid(self, **kwargs):
        """网格布局"""
        if self.widget:
            self.widget.grid(**kwargs)
    
    def place(self, **kwargs):
        """位置布局"""
        if self.widget:
            self.widget.place(**kwargs)
    
    def configure(self, **kwargs):
        """配置组件"""
        if self.widget:
            self.widget.configure(**kwargs)
    
    def destroy(self):
        """销毁组件"""
        if self.widget:
            self.widget.destroy()
    
    def get_widget(self):
        """获取底层控件"""
        return self.widget


class BaseFrame(BaseComponent):
    """基础框架组件"""
    
    def _create_widget(self):
        if CTK_AVAILABLE:
            self.widget = ctk.CTkFrame(self.parent, **self.kwargs)
        else:
            self.widget = tk.Frame(self.parent, **self.kwargs)


class BaseLabel(BaseComponent):
    """基础标签组件"""
    
    def _create_widget(self):
        text = self.kwargs.pop('text', '')
        if CTK_AVAILABLE:
            self.widget = ctk.CTkLabel(self.parent, text=text, **self.kwargs)
        else:
            self.widget = tk.Label(self.parent, text=text, **self.kwargs)
    
    def set_text(self, text: str):
        """设置文本"""
        if CTK_AVAILABLE:
            self.widget.configure(text=text)
        else:
            self.widget.config(text=text)


class BaseButton(BaseComponent):
    """基础按钮组件"""
    
    def _create_widget(self):
        text = self.kwargs.pop('text', '')
        command = self.kwargs.pop('command', None)
        
        if CTK_AVAILABLE:
            self.widget = ctk.CTkButton(
                self.parent, 
                text=text, 
                command=command,
                **self.kwargs
            )
        else:
            self.widget = tk.Button(
                self.parent, 
                text=text, 
                command=command,
                **self.kwargs
            )


class BaseTextBox(BaseComponent):
    """基础文本框组件"""
    
    def _create_widget(self):
        if CTK_AVAILABLE:
            self.widget = ctk.CTkTextbox(self.parent, **self.kwargs)
        else:
            self.widget = tk.Text(self.parent, **self.kwargs)
    
    def insert_text(self, text: str):
        """插入文本"""
        if CTK_AVAILABLE:
            self.widget.insert('end', text)
        else:
            self.widget.insert(tk.END, text)
    
    def clear_text(self):
        """清空文本"""
        if CTK_AVAILABLE:
            self.widget.delete('1.0', 'end')
        else:
            self.widget.delete('1.0', tk.END)
    
    def get_text(self) -> str:
        """获取文本"""
        if CTK_AVAILABLE:
            return self.widget.get('1.0', 'end')
        else:
            return self.widget.get('1.0', tk.END) 