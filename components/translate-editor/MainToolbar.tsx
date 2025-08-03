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
  List,
  ListOrdered,
  FileDown,
  FileUp,
  Settings,
  Layout,
  Ruler,
} from 'lucide-react'

interface MainToolbarProps {
  onNewDocument: () => void
  onOpenDocument: () => void
  onSave: () => void
  onSaveAs: () => void
  onPrint: () => void
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
}) => {
  return (
    <div className="bg-gray-50 border-b border-gray-200 px-4 py-1">
      <Menubar className="border-0 bg-transparent h-auto">
        {/* 文件菜单 */}
        <MenubarMenu>
          <MenubarTrigger className="text-sm">文件</MenubarTrigger>
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
                <MenubarItem>从 Word 导入</MenubarItem>
                <MenubarItem>从 PDF 导入</MenubarItem>
                <MenubarItem>从文本文件导入</MenubarItem>
              </MenubarSubContent>
            </MenubarSub>
            <MenubarSub>
              <MenubarSubTrigger>
                <Download className="h-4 w-4 mr-2" />
                导出
              </MenubarSubTrigger>
              <MenubarSubContent>
                <MenubarItem>导出为 Word (.docx)</MenubarItem>
                <MenubarItem>导出为 PDF</MenubarItem>
                <MenubarItem>导出为纯文本</MenubarItem>
                <MenubarItem>导出为 HTML</MenubarItem>
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
          <MenubarTrigger className="text-sm">编辑</MenubarTrigger>
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
            <MenubarItem>全选 <MenubarShortcut>Ctrl+A</MenubarShortcut></MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        {/* 视图菜单 */}
        <MenubarMenu>
          <MenubarTrigger className="text-sm">视图</MenubarTrigger>
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
                <MenubarItem>放大 <MenubarShortcut>Ctrl++</MenubarShortcut></MenubarItem>
                <MenubarItem>缩小 <MenubarShortcut>Ctrl+-</MenubarShortcut></MenubarItem>
                <MenubarItem>实际大小 <MenubarShortcut>Ctrl+0</MenubarShortcut></MenubarItem>
                <MenubarSeparator />
                <MenubarItem>50%</MenubarItem>
                <MenubarItem>75%</MenubarItem>
                <MenubarItem>100%</MenubarItem>
                <MenubarItem>125%</MenubarItem>
                <MenubarItem>150%</MenubarItem>
              </MenubarSubContent>
            </MenubarSub>
            <MenubarSeparator />
            <MenubarItem>全屏模式 <MenubarShortcut>F11</MenubarShortcut></MenubarItem>
            <MenubarItem>
              <Settings className="h-4 w-4 mr-2" />
              视图设置
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        {/* 插入菜单 */}
        <MenubarMenu>
          <MenubarTrigger className="text-sm">插入</MenubarTrigger>
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
          <MenubarTrigger className="text-sm">格式</MenubarTrigger>
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
              <MenubarSubTrigger>
                <AlignLeft className="h-4 w-4 mr-2" />
                对齐方式
              </MenubarSubTrigger>
              <MenubarSubContent>
                <MenubarItem>
                  <AlignLeft className="h-4 w-4 mr-2" />
                  左对齐
                  <MenubarShortcut>Ctrl+L</MenubarShortcut>
                </MenubarItem>
                <MenubarItem>
                  <AlignCenter className="h-4 w-4 mr-2" />
                  居中对齐
                  <MenubarShortcut>Ctrl+E</MenubarShortcut>
                </MenubarItem>
                <MenubarItem>
                  <AlignRight className="h-4 w-4 mr-2" />
                  右对齐
                  <MenubarShortcut>Ctrl+R</MenubarShortcut>
                </MenubarItem>
                <MenubarItem>两端对齐 <MenubarShortcut>Ctrl+J</MenubarShortcut></MenubarItem>
              </MenubarSubContent>
            </MenubarSub>
            <MenubarSub>
              <MenubarSubTrigger>
                <List className="h-4 w-4 mr-2" />
                列表
              </MenubarSubTrigger>
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
    </div>
  )
}

export default MainToolbar 