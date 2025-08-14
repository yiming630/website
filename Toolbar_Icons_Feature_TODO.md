# Translate-Editor Toolbar – Feature Implementation Checklist

> 当前译文编辑器的工具栏 UI 已经搭建完毕，但大部分图标仍停留在占位/console.log 阶段，尚未真正联动到业务逻辑或 TipTap 编辑器实例。下面列出 **需要补全实现的功能**，按照图标分组。

---

## 1. 文件(File) 相关

| 图标 | 菜单/按钮 | 期望功能 |
|------|-----------|----------|
| `FileText` | 新建 | 新建空文档：清空编辑器内容、重置格式状态、重置标题、历史记录等 |
| `FolderOpen` | 打开 | 打开本地/云端已有文档：调起文件选择 → 读取 → 填充到编辑器 |
| `Save` | 保存 | 持久化到后端 / IndexedDB；支持自动保存、错误提示、冲突解决 |
| `FileDown` | 另存为 | 选择目标格式与文件名后导出副本 |
| `FileUp` | 导入 | 支持 Word / PDF / 纯文本等格式解析并写入编辑器 |
| `Download` | 导出 | 导出为 Word / PDF / HTML / 纯文本等 |
| `Printer` | 打印 | 生成打印视图并调用浏览器 print() |

## 2. 编辑(Edit) 相关

| 图标 | 菜单/按钮 | 期望功能 |
|------|-----------|----------|
| `Search` | 查找/替换 | 弹出对话框，支持正则、全局/区分大小写、批量替换 |
| `Scissors` | 剪切 | 与 TipTap selection 结合，剪切所选内容到剪贴板 |
| `Copy` / `Clipboard` | 复制/粘贴 | 复制所选文本 / 从剪贴板粘贴，并保持格式 |
| `Undo` / `Redo` | 撤销/重做 | 已部分接入，但需在所有格式化及插入操作完成后保持正确的历史记录栈 |

## 3. 视图(View) 相关

| 图标 | 菜单/按钮 | 期望功能 |
|------|-----------|----------|
| `Eye` (+/-) | 缩放 | 放大、缩小、实际大小等倍率切换 |
| `Layout` | 原文对照 | 已有 state，但需真正渲染双栏对照视图 |
| `Ruler` | 标尺 | state 已切换，需渲染可交互刻度尺组件 |
| `Settings` | 视图设置 | 高级视图设置弹窗 |

## 4. 插入(Insert) 相关

| 图标 | 菜单/按钮 | 期望功能 |
|------|-----------|----------|
| `Image` | 图片 | 打开文件选择/URL 输入 → 插入 `<Image>` 扩展节点 |
| `Table` | 表格 | 调整行列数后插入 `<Table>`；支持后续编辑、拖拽调宽 |
| `Link` | 链接 | 弹窗输入 URL/Text → 插入 `<Link>` |
| `AtSign` | 特殊符号 | 弹出符号面板并插入选定字符 |

## 5. 格式化(Formatting) 相关 ✅ **已完成**

> ✅ **所有格式化功能已完全实现并连接到编辑器**

| 图标 | 按钮 | 对应 TipTap 动作 | 状态 |
|------|-------|------------------|------|
| `Bold` | 加粗 | `toggleBold()` | ✅ 已实现 (Ctrl+B) |
| `Italic` | 斜体 | `toggleItalic()` | ✅ 已实现 (Ctrl+I) |
| `Underline` | 下划线 | `toggleUnderline()` | ✅ 已实现 (Ctrl+U) |
| `Strikethrough` | 删除线 | `toggleStrike()` | ✅ 已实现 |
| `Palette` | 字体颜色 | `setTextColor(color)` | ✅ 已实现 (颜色选择器) |
| `Highlighter` | 高亮 | `setHighlight(color)` | ✅ 已实现 (背景颜色选择器) |
| `AlignLeft / AlignCenter / AlignRight / AlignJustify` | 对齐 | `setTextAlign()` | ✅ 已实现 |
| `List` | 项目符号 | `toggleBulletList()` | ✅ 已实现 |
| `ListOrdered` | 编号列表 | `toggleOrderedList()` | ✅ 已实现 |
| `IndentDecrease / IndentIncrease` | 缩进 | `outdent()` / `indent()` | ✅ 已实现 |
| 字体下拉 | 字体 | `setFontFamily()` | ✅ 已实现 |
| 字号下拉 | 字号 | `setFontSize()` | ✅ 已实现 |
| 行距菜单 | 行距 | `setLineHeight()` | ✅ 已实现 (行高选择器) |

### 🎯 额外实现的高级功能：
- ✅ **颜色选择器组件** - 预设颜色、自定义颜色、最近使用记录
- ✅ **行高选择器组件** - 7档行高选择 (1.0-3.0)
- ✅ **键盘快捷键支持** - Ctrl+B/I/U 等标准快捷键
- ✅ **格式状态同步** - 编辑器状态与工具栏实时同步
- ✅ **自动保存触发** - 格式更改时自动标记为未保存

## 6. 历史 & AI 聊天

| 图标 | 按钮 | 期望功能 |
|------|-------|----------|
| `History` | 历史对话 | 打开历史聊天侧边栏 / Modal，展示对话列表，可恢复上下文 |
| `MessageSquarePlus` | 新对话 | 清空当前聊天记录，重置状态，开始新的对话 |

---

### 开发建议

1. **统一命令入口**：在 `EditorCanvas` 内已经暴露了丰富的方法，主界面事件处理函数应直接调用这些方法，避免仅修改 React state。
2. **状态同步**：利用 `EditorCanvas` 的 `onUpdate` & `onSelectionUpdate` 回调，将真实编辑器状态回流到 Toolbar，保持按钮高亮与实际格式一致。
3. **业务操作**（保存 / 打开 / 导入导出）应封装到 `services/documents.ts`，与后端 API 解耦，便于后期接入多存储后端。
4. **分步实现**：
   - a. 先完成 TipTap 格式化/插入相关动作（见第 5 节）。
   - b. 再实现文件/视图/聊天等高层功能。

> 完成以上功能后，工具栏按钮将真正驱动文档编辑体验，而非仅做 UI 演示。
