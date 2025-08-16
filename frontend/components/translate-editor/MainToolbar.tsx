"use client"

import React from 'react'
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
  MenubarCheckboxItem,
} from '@/components/ui/menubar'
import { Button } from '@/components/ui/button'
import { Toggle } from '@/components/ui/toggle'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ChevronDown } from 'lucide-react'
import { ColorPicker } from './ColorPicker'
import { LineHeightPicker } from './LineHeightPicker'
import {
  FileText,
  FolderOpen,
  Save,
  Download,
  Printer,
  Undo,
  Redo,
  Search,
  Replace,
  Copy,
  Clipboard,
  Scissors,
  Eye,
  EyeOff,
  Image,
  Table,
  Link,
  AtSign,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  FileDown,
  FileUp,
  Settings,
  Layout,
  Ruler,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Highlighter,
  Palette,
  IndentDecrease,
  IndentIncrease,
  History,
  MessageSquarePlus,
} from 'lucide-react'

interface MainToolbarProps {
  onNewDocument: () => void
  onOpenDocument: () => void
  onSave: () => void
  onSaveAs: () => void
  onPrint: () => void
  onImportWord?: () => void
  onImportPDF?: () => void
  onImportText?: () => void
  onExportWord?: () => void
  onExportPDF?: () => void
  onExportHTML?: () => void
  onExportText?: () => void
  onUndo: () => void
  onRedo: () => void
  onFindReplace: () => void
  onCut: () => void
  onCopy: () => void
  onPaste: () => void
  onToggleRuler: () => void
  onToggleOriginalView: () => void
  onInsertImage: () => void
  onInsertTable: () => void
  onInsertLink: () => void
  onInsertSymbol: () => void
  onFormatText: () => void
  onFormatParagraph: () => void
  onFormatStyles: () => void
  // 视图状态
  showRuler: boolean
  showOriginal: boolean
  // 格式化状态和操作
  canUndo?: boolean
  canRedo?: boolean
  isBold?: boolean
  isItalic?: boolean
  isUnderline?: boolean
  isStrikethrough?: boolean
  textColor?: string
  backgroundColor?: string
  fontSize?: string
  fontFamily?: string
  alignment?: 'left' | 'center' | 'right' | 'justify'
  isBulletList?: boolean
  isNumberedList?: boolean
  lineHeight?: string
  onBold?: () => void
  onItalic?: () => void
  onUnderline?: () => void
  onStrikethrough?: () => void
  onTextColor?: (color: string) => void
  onBackgroundColor?: (color: string) => void
  onFontSize?: (size: string) => void
  onFontFamily?: (family: string) => void
  onAlign?: (align: 'left' | 'center' | 'right' | 'justify') => void
  onBulletList?: () => void
  onNumberedList?: () => void
  onIndent?: () => void
  onOutdent?: () => void
  onLineHeight?: (height: string) => void
  onViewHistory?: () => void
  onNewConversation?: () => void
}

/**
 * MainToolbar - 主菜单栏组件
 * 提供类似桌面软件的下拉菜单功能
 */
export const MainToolbar: React.FC<MainToolbarProps> = ({
  onNewDocument,
  onOpenDocument,
  onSave,
  onSaveAs,
  onPrint,
  onImportWord,
  onImportPDF,
  onImportText,
  onExportWord,
  onExportPDF,
  onExportHTML,
  onExportText,
  onUndo,
  onRedo,
  onFindReplace,
  onCut,
  onCopy,
  onPaste,
  onToggleRuler,
  onToggleOriginalView,
  onInsertImage,
  onInsertTable,
  onInsertLink,
  onInsertSymbol,
  onFormatText,
  onFormatParagraph,
  onFormatStyles,
  showRuler,
  showOriginal,
  // 格式化参数
  canUndo = false,
  canRedo = false,
  isBold = false,
  isItalic = false,
  isUnderline = false,
  isStrikethrough = false,
  textColor = '#000000',
  backgroundColor = '#FFFFFF',
  fontSize = '12',
  fontFamily = 'default',
  alignment = 'left',
  isBulletList = false,
  isNumberedList = false,
  lineHeight = '1.5',
  onBold,
  onItalic,
  onUnderline,
  onStrikethrough,
  onTextColor,
  onBackgroundColor,
  onFontSize,
  onFontFamily,
  onAlign,
  onBulletList,
  onNumberedList,
  onIndent,
  onOutdent,
  onLineHeight,
  onViewHistory,
  onNewConversation,
}) => {
  return (
    <div className="bg-gray-50 border-b border-gray-200 px-4" style={{paddingTop: '4px', paddingBottom: '4px', minHeight: '48px'}}>
      <div className="flex items-center gap-2">
        {/* 菜单部分 */}
        <Menubar className="border-0 bg-transparent h-auto p-0 flex-shrink-0">
          {/* 文件菜单 */}
          <MenubarMenu>
            <MenubarTrigger className="py-0.5" style={{fontSize: '12px'}}>文件</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={onNewDocument}>
                <FileText className="h-4 w-4 mr-2" />
                新建
                <MenubarShortcut>Ctrl+N</MenubarShortcut>
              </MenubarItem>
              <MenubarItem onClick={onOpenDocument}>
                <FolderOpen className="h-4 w-4 mr-2" />
                打开
                <MenubarShortcut>Ctrl+O</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem onClick={onSave}>
                <Save className="h-4 w-4 mr-2" />
                保存
                <MenubarShortcut>Ctrl+S</MenubarShortcut>
              </MenubarItem>
              <MenubarItem onClick={onSaveAs}>
                <FileDown className="h-4 w-4 mr-2" />
                另存为...
                <MenubarShortcut>Ctrl+Shift+S</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarSub>
                <MenubarSubTrigger>
                  <FileUp className="h-4 w-4 mr-2" />
                  导入
                </MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarItem onClick={onImportWord}>从 Word 导入</MenubarItem>
                  <MenubarItem onClick={onImportPDF}>从 PDF 导入</MenubarItem>
                  <MenubarItem onClick={onImportText}>从文本文件导入</MenubarItem>
                </MenubarSubContent>
              </MenubarSub>
              <MenubarSub>
                <MenubarSubTrigger>
                  <Download className="h-4 w-4 mr-2" />
                  导出
                </MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarItem onClick={onExportWord}>导出为 Word (.docx)</MenubarItem>
                  <MenubarItem onClick={onExportPDF}>导出为 PDF</MenubarItem>
                  <MenubarItem onClick={onExportText}>导出为纯文本</MenubarItem>
                  <MenubarItem onClick={onExportHTML}>导出为 HTML</MenubarItem>
                </MenubarSubContent>
              </MenubarSub>
              <MenubarSeparator />
              <MenubarItem onClick={onPrint}>
                <Printer className="h-4 w-4 mr-2" />
                打印
                <MenubarShortcut>Ctrl+P</MenubarShortcut>
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          {/* 编辑菜单 */}
          <MenubarMenu>
            <MenubarTrigger className="py-0.5" style={{fontSize: '12px'}}>编辑</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={onUndo}>
                <Undo className="h-4 w-4 mr-2" />
                撤销
                <MenubarShortcut>Ctrl+Z</MenubarShortcut>
              </MenubarItem>
              <MenubarItem onClick={onRedo}>
                <Redo className="h-4 w-4 mr-2" />
                重做
                <MenubarShortcut>Ctrl+Y</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem onClick={onCut}>
                <Scissors className="h-4 w-4 mr-2" />
                剪切
                <MenubarShortcut>Ctrl+X</MenubarShortcut>
              </MenubarItem>
              <MenubarItem onClick={onCopy}>
                <Copy className="h-4 w-4 mr-2" />
                复制
                <MenubarShortcut>Ctrl+C</MenubarShortcut>
              </MenubarItem>
              <MenubarItem onClick={onPaste}>
                <Clipboard className="h-4 w-4 mr-2" />
                粘贴
                <MenubarShortcut>Ctrl+V</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem onClick={onFindReplace}>
                <Search className="h-4 w-4 mr-2" />
                查找和替换
                <MenubarShortcut>Ctrl+H</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem onClick={() => document.execCommand('selectAll')}>
                全选 
                <MenubarShortcut>Ctrl+A</MenubarShortcut>
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          {/* 视图菜单 */}
          <MenubarMenu>
            <MenubarTrigger className="py-0.5" style={{fontSize: '12px'}}>视图</MenubarTrigger>
            <MenubarContent>
              <MenubarCheckboxItem checked={showRuler} onClick={onToggleRuler}>
                <Ruler className="h-4 w-4 mr-2" />
                显示标尺
              </MenubarCheckboxItem>
              <MenubarCheckboxItem checked={showOriginal} onClick={onToggleOriginalView}>
                <Layout className="h-4 w-4 mr-2" />
                显示原文对照
                <MenubarShortcut>Ctrl+Shift+O</MenubarShortcut>
              </MenubarCheckboxItem>
              <MenubarSeparator />
              <MenubarSub>
                <MenubarSubTrigger>
                  <Eye className="h-4 w-4 mr-2" />
                  缩放
                </MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarItem onClick={() => window.dispatchEvent(new CustomEvent('zoomIn'))}>
                    放大 <MenubarShortcut>Ctrl++</MenubarShortcut>
                  </MenubarItem>
                  <MenubarItem onClick={() => window.dispatchEvent(new CustomEvent('zoomOut'))}>
                    缩小 <MenubarShortcut>Ctrl+-</MenubarShortcut>
                  </MenubarItem>
                  <MenubarItem onClick={() => window.dispatchEvent(new CustomEvent('zoomReset'))}>
                    实际大小 <MenubarShortcut>Ctrl+0</MenubarShortcut>
                  </MenubarItem>
                  <MenubarSeparator />
                  <MenubarItem onClick={() => window.dispatchEvent(new CustomEvent('setZoom', { detail: 50 }))}>50%</MenubarItem>
                  <MenubarItem onClick={() => window.dispatchEvent(new CustomEvent('setZoom', { detail: 75 }))}>75%</MenubarItem>
                  <MenubarItem onClick={() => window.dispatchEvent(new CustomEvent('setZoom', { detail: 100 }))}>100%</MenubarItem>
                  <MenubarItem onClick={() => window.dispatchEvent(new CustomEvent('setZoom', { detail: 125 }))}>125%</MenubarItem>
                  <MenubarItem onClick={() => window.dispatchEvent(new CustomEvent('setZoom', { detail: 150 }))}>150%</MenubarItem>
                </MenubarSubContent>
              </MenubarSub>
              <MenubarSeparator />
              <MenubarItem>全屏模式 <MenubarShortcut>F11</MenubarShortcut></MenubarItem>
              <MenubarItem onClick={() => window.dispatchEvent(new CustomEvent('openViewSettings'))}>
                <Settings className="h-4 w-4 mr-2" />
                视图设置
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          {/* 插入菜单 */}
          <MenubarMenu>
            <MenubarTrigger className="py-0.5" style={{fontSize: '12px'}}>插入</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={onInsertImage}>
                <Image className="h-4 w-4 mr-2" />
                图片
              </MenubarItem>
              <MenubarItem onClick={onInsertTable}>
                <Table className="h-4 w-4 mr-2" />
                表格
              </MenubarItem>
              <MenubarItem onClick={onInsertLink}>
                <Link className="h-4 w-4 mr-2" />
                链接
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem onClick={onInsertSymbol}>
                <AtSign className="h-4 w-4 mr-2" />
                特殊符号
              </MenubarItem>
              <MenubarSub>
                <MenubarSubTrigger>插入对象</MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarItem>图表</MenubarItem>
                  <MenubarItem>公式</MenubarItem>
                  <MenubarItem>形状</MenubarItem>
                  <MenubarItem>文本框</MenubarItem>
                </MenubarSubContent>
              </MenubarSub>
              <MenubarSeparator />
              <MenubarItem>页码</MenubarItem>
              <MenubarItem>页眉/页脚</MenubarItem>
              <MenubarItem>分页符</MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          {/* 格式菜单 */}
          <MenubarMenu>
            <MenubarTrigger className="py-0.5" style={{fontSize: '12px'}}>格式</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={onFormatText}>
                <Type className="h-4 w-4 mr-2" />
                文本格式
              </MenubarItem>
              <MenubarItem onClick={onFormatParagraph}>
                <AlignLeft className="h-4 w-4 mr-2" />
                段落格式
              </MenubarItem>
              <MenubarItem onClick={onFormatStyles}>
                样式和格式
              </MenubarItem>
              <MenubarSeparator />
              <MenubarSub>
                <MenubarSubTrigger>对齐方式</MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarItem>
                    <AlignLeft className="h-4 w-4 mr-2" />
                    左对齐
                  </MenubarItem>
                  <MenubarItem>
                    <AlignCenter className="h-4 w-4 mr-2" />
                    居中对齐
                  </MenubarItem>
                  <MenubarItem>
                    <AlignRight className="h-4 w-4 mr-2" />
                    右对齐
                  </MenubarItem>
                  <MenubarItem>两端对齐</MenubarItem>
                </MenubarSubContent>
              </MenubarSub>
              <MenubarSub>
                <MenubarSubTrigger>列表</MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarItem>
                    <List className="h-4 w-4 mr-2" />
                    项目符号列表
                  </MenubarItem>
                  <MenubarItem>
                    <ListOrdered className="h-4 w-4 mr-2" />
                    编号列表
                  </MenubarItem>
                  <MenubarItem>多级列表</MenubarItem>
                </MenubarSubContent>
              </MenubarSub>
              <MenubarSeparator />
              <MenubarItem>行间距</MenubarItem>
              <MenubarItem>缩进</MenubarItem>
              <MenubarItem>边框和底纹</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
        
        {/* 分隔线 */}
        <div className="h-5 w-px bg-gray-300 mx-1" />
        
        {/* 格式化工具栏 - 在同一行 */}
        <div className="flex items-center gap-1 flex-1">
          {/* 撤销/重做 */}
          <div className="flex items-center gap-0.5 mr-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onUndo}
              disabled={!canUndo}
              className="h-8 w-8 p-0"
              title="撤销 (Ctrl+Z)"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRedo}
              disabled={!canRedo}
              className="h-8 w-8 p-0"
              title="重做 (Ctrl+Y)"
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>

          <div className="h-6 w-px bg-gray-300 mx-1" />

          {/* 字体选择 */}
          <Select value={fontFamily} onValueChange={onFontFamily}>
            <SelectTrigger className="h-9 w-32" style={{fontSize: '13px'}}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">默认字体</SelectItem>
              <SelectItem value="SimSun, serif">宋体</SelectItem>
              <SelectItem value="SimHei, sans-serif">黑体</SelectItem>
              <SelectItem value="KaiTi, serif">楷体</SelectItem>
              <SelectItem value="FangSong, serif">仿宋</SelectItem>
              <SelectItem value="Arial, sans-serif">Arial</SelectItem>
              <SelectItem value="Times New Roman, serif">Times New Roman</SelectItem>
              <SelectItem value="Courier New, monospace">Courier New</SelectItem>
            </SelectContent>
          </Select>

          {/* 字号选择 */}
          <Select value={fontSize} onValueChange={onFontSize}>
            <SelectTrigger className="h-9 w-18" style={{fontSize: '13px'}}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="9">9</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="11">11</SelectItem>
              <SelectItem value="12">12</SelectItem>
              <SelectItem value="14">14</SelectItem>
              <SelectItem value="16">16</SelectItem>
              <SelectItem value="18">18</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="24">24</SelectItem>
              <SelectItem value="28">28</SelectItem>
              <SelectItem value="36">36</SelectItem>
              <SelectItem value="48">48</SelectItem>
              <SelectItem value="72">72</SelectItem>
            </SelectContent>
          </Select>

          <div className="h-6 w-px bg-gray-300 mx-1" />

          {/* 文本格式按钮 */}
          <div className="flex items-center gap-0">
            <Toggle
              pressed={isBold}
              onPressedChange={onBold}
              className="h-8 w-8 p-0"
              title="加粗 (Ctrl+B)"
            >
              <Bold className="h-4 w-4" />
            </Toggle>
            <Toggle
              pressed={isItalic}
              onPressedChange={onItalic}
              className="h-8 w-8 p-0"
              title="斜体 (Ctrl+I)"
            >
              <Italic className="h-4 w-4" />
            </Toggle>
            <Toggle
              pressed={isUnderline}
              onPressedChange={onUnderline}
              className="h-8 w-8 p-0"
              title="下划线 (Ctrl+U)"
            >
              <Underline className="h-4 w-4" />
            </Toggle>
            <Toggle
              pressed={isStrikethrough}
              onPressedChange={onStrikethrough}
              className="h-8 w-8 p-0"
              title="删除线"
            >
              <Strikethrough className="h-4 w-4" />
            </Toggle>
            
            {/* 颜色选择器 */}
            <ColorPicker
              value={textColor}
              onChange={onTextColor}
              type="text"
            />
            <ColorPicker
              value={backgroundColor}
              onChange={onBackgroundColor}
              type="background"
            />
          </div>

          <div className="h-6 w-px bg-gray-300 mx-1" />

          {/* 对齐按钮 */}
          <div className="flex items-center gap-0">
            <Toggle
              pressed={alignment === 'left'}
              onPressedChange={() => onAlign?.('left')}
              className="h-8 w-8 p-0"
              title="左对齐"
            >
              <AlignLeft className="h-4 w-4" />
            </Toggle>
            <Toggle
              pressed={alignment === 'center'}
              onPressedChange={() => onAlign?.('center')}
              className="h-8 w-8 p-0"
              title="居中对齐"
            >
              <AlignCenter className="h-4 w-4" />
            </Toggle>
            <Toggle
              pressed={alignment === 'right'}
              onPressedChange={() => onAlign?.('right')}
              className="h-8 w-8 p-0"
              title="右对齐"
            >
              <AlignRight className="h-4 w-4" />
            </Toggle>
            <Toggle
              pressed={alignment === 'justify'}
              onPressedChange={() => onAlign?.('justify')}
              className="h-8 w-8 p-0"
              title="两端对齐"
            >
              <AlignJustify className="h-4 w-4" />
            </Toggle>
          </div>

          <div className="h-6 w-px bg-gray-300 mx-1" />

          {/* 列表和缩进 */}
          <div className="flex items-center gap-0">
            <Toggle
              pressed={isBulletList}
              onPressedChange={onBulletList}
              className="h-8 w-8 p-0"
              title="项目符号列表"
            >
              <List className="h-4 w-4" />
            </Toggle>
            <Toggle
              pressed={isNumberedList}
              onPressedChange={onNumberedList}
              className="h-8 w-8 p-0"
              title="编号列表"
            >
              <ListOrdered className="h-4 w-4" />
            </Toggle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onOutdent}
              className="h-8 w-8 p-0"
              title="减少缩进"
            >
              <IndentDecrease className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onIndent}
              className="h-8 w-8 p-0"
              title="增加缩进"
            >
              <IndentIncrease className="h-4 w-4" />
            </Button>
            
            {/* 行高选择器 */}
            <LineHeightPicker
              value={lineHeight}
              onChange={onLineHeight}
            />
          </div>
        </div>
        
        {/* AI聊天控制按钮 - 最右侧 */}
        <div className="ml-auto flex items-center gap-0">
          <div className="h-4 w-px bg-gray-300 mr-1" />
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 flex items-center gap-1"
            title="查看历史对话"
            onClick={onViewHistory}
          >
            <History className="h-4 w-4" />
            <span style={{fontSize: '12px'}}>历史对话</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 flex items-center gap-1"
            title="开始新对话"
            onClick={onNewConversation}
          >
            <MessageSquarePlus className="h-4 w-4" />
            <span style={{fontSize: '12px'}}>新对话</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default MainToolbar
