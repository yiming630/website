"""
GUI主题配置
定义颜色、字体和样式常量
"""

# Color Theme - SeekHub专用配色
COLORS = {
    'primary': '#264653',      # 深绿蓝
    'secondary': '#2A9D8F',    # 青绿色
    'accent': '#E9C46A',       # 黄色
    'warning': '#F4A261',      # 橙色
    'error': '#E76F51',        # 红橙色
    'background': '#1e1e1e',   # 深色背景
    'surface': '#2d2d2d',      # 卡片背景
    'text': '#ffffff',         # 白色文本
    'text_secondary': '#cccccc' # 浅灰色文本
}

# GUI配置
GUI_CONFIG = {
    'window_size': '1400x900',
    'min_window_size': (1000, 600),
    'theme_mode': 'dark',
    'color_theme': 'blue',
    'font_family': ('Helvetica', 12),
    'header_font': ('Helvetica', 16, 'bold'),
    'title_font': ('Helvetica', 20, 'bold')
}

# 组件样式
COMPONENT_STYLES = {
    'button': {
        'height': 32,
        'corner_radius': 6,
        'border_width': 1
    },
    'entry': {
        'height': 32,
        'corner_radius': 6,
        'border_width': 1
    },
    'frame': {
        'corner_radius': 8,
        'border_width': 1
    },
    'scrollbar': {
        'button_color': COLORS['secondary'],
        'progress_color': COLORS['accent']
    }
}

def apply_theme():
    """应用自定义主题"""
    try:
        import customtkinter as ctk
        
        # 设置外观模式
        ctk.set_appearance_mode(GUI_CONFIG['theme_mode'])
        ctk.set_default_color_theme(GUI_CONFIG['color_theme'])
        
        return True
    except ImportError:
        print("⚠️  CustomTkinter未安装，使用默认主题")
        return False 