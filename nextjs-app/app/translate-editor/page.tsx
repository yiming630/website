"use client"

import { Button } from "@/components/ui/button"
import { AtSign } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { Header } from "@/components/translate-editor/Header"
import { MainToolbar } from "@/components/translate-editor/MainToolbar"
import { EditorCanvas, EditorCanvasRef } from "@/components/translate-editor/EditorCanvas"
import { StatusBar } from "@/components/translate-editor/StatusBar"
import { AIChatPanel } from "@/components/translate-editor/AIChatPanel"
import { EditorSection } from "@/components/translate-editor/EditorSection"
import { useAIChat } from "./hooks/useAIChat"
import { useTextSelection } from "./hooks/useTextSelection"
import { FormatState } from "./types"
import { translatedContent, originalSentences, defaultCollaborators } from "./constants"
import DocumentService, { Document } from "@/services/documentService"
import { useToast } from "@/hooks/use-toast"
import { ExportDialog } from "@/components/translate-editor/ExportDialog"
import { FindReplaceDialog, FindReplaceOptions } from "@/components/translate-editor/FindReplaceDialog"
import { ViewSettingsDialog, ViewSettings } from "@/components/translate-editor/ViewSettingsDialog"
import { InsertImageDialog } from "@/components/translate-editor/InsertImageDialog"
import { InsertTableDialog } from "@/components/translate-editor/InsertTableDialog"
import { InsertLinkDialog } from "@/components/translate-editor/InsertLinkDialog"
import { InsertSymbolDialog } from "@/components/translate-editor/InsertSymbolDialog"

/**
 * 译文编辑器页面 - 左右分栏布局
 */
export default function TranslateEditorPage() {
  // 编辑器内容
  const [editableContent, setEditableContent] = useState(translatedContent)
  const [showOriginal, setShowOriginal] = useState(false)
  const [highlightedSentenceIndex, setHighlightedSentenceIndex] = useState<number | null>(null)
  const [isPanelPinned, setIsPanelPinned] = useState(false)
  const [editorScrollProgress, setEditorScrollProgress] = useState(0)
  
  // 文档状态
  const [documentTitle, setDocumentTitle] = useState('AI翻译文档 - 2024年11月')
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null)
  
  // 视图状态
  const [showRuler, setShowRuler] = useState(false)
  const [viewMode, setViewMode] = useState<'edit' | 'read' | 'preview'>('edit')
  const [zoomLevel, setZoomLevel] = useState(100)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [showFindReplaceDialog, setShowFindReplaceDialog] = useState(false)
  const [showViewSettingsDialog, setShowViewSettingsDialog] = useState(false)
  const [showInsertImageDialog, setShowInsertImageDialog] = useState(false)
  const [showInsertTableDialog, setShowInsertTableDialog] = useState(false)
  const [showInsertLinkDialog, setShowInsertLinkDialog] = useState(false)
  const [showInsertSymbolDialog, setShowInsertSymbolDialog] = useState(false)
  
  // 视图设置
  const [viewSettings, setViewSettings] = useState<ViewSettings>({
    zoomLevel: 100,
    showRuler: false,
    showOriginal: false,
    showStatusBar: true,
    showLineNumbers: false,
    showWordCount: true,
    theme: 'light',
    fontSize: '14',
    lineHeight: 1.5,
    fontFamily: 'default',
    wordWrap: true,
    highlightCurrentLine: true,
    sidebarPosition: 'right',
    sidebarWidth: 40,
    editorWidth: 'fixed',
    maxEditorWidth: 816,
  })
  
  // 格式状态
  const [formatState, setFormatState] = useState<FormatState>({
    isBold: false,
    isItalic: false,
    isUnderline: false,
    isStrikethrough: false,
    textColor: '#000000',
    backgroundColor: '#FFFFFF',
    fontSize: '14',
    fontFamily: 'default',
    alignment: 'left',
    isBulletList: false,
    isNumberedList: false,
    lineHeight: '1.5',
  })

  // 使用自定义钩子
  const {
    chatMessages,
    inputValue,
    setInputValue,
    showAttachMenu,
    setShowAttachMenu,
    expandedCategories,
    mentionedItems,
    textActionGroups,
    currentTextId,
    sendMessage,
    addActionToMentions,
    addTextToMentions,
    removeMention,
    removeActionFromGroup,
    selectTextGroup,
    updateGroupCustomInstruction,
    updateActionCustomInstruction,
    toggleCategoryExpanded,
  } = useAIChat()

  const {
    selectedText,
    showFloatingButton,
    floatingButtonPosition,
    clearSelection,
    hideFloatingButton,
  } = useTextSelection()
  
  // 引用
  const editorRef = useRef<EditorCanvasRef>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const importInputRef = useRef<HTMLInputElement>(null)
  
  // 初始化状态
  const [isInitialized, setIsInitialized] = useState(false)
  
  // 使用 toast 提示
  const { toast } = useToast()

  // 计算字数和字符数
  const wordCount = editableContent.trim().split(/\s+/).length
  const charCount = editableContent.length

  // 键盘快捷键支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+F 或 Cmd+F: 查找
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault()
        setShowFindReplaceDialog(true)
      }
      // Ctrl+H 或 Cmd+H: 查找和替换
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault()
        setShowFindReplaceDialog(true)
      }
      // Ctrl+S 或 Cmd+S: 保存
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
      // Ctrl+Shift+S 或 Cmd+Shift+S: 另存为
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 's') {
        e.preventDefault()
        handleSaveAs()
      }
      // Ctrl+N 或 Cmd+N: 新建
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        handleNewDocument()
      }
      // Ctrl+O 或 Cmd+O: 打开
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault()
        handleOpenDocument()
      }
      // Ctrl+P 或 Cmd+P: 打印
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault()
        handlePrint()
      }
      // Ctrl+A 或 Cmd+A: 全选
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        // 让编辑器处理全选
        if (editorRef.current && document.activeElement?.closest('.ProseMirror')) {
          e.preventDefault()
          handleSelectAll()
        }
      }
      // Ctrl+B 或 Cmd+B: 加粗
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault()
        handleBold()
      }
      // Ctrl+I 或 Cmd+I: 斜体
      if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault()
        handleItalic()
      }
      // Ctrl+U 或 Cmd+U: 下划线
      if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
        e.preventDefault()
        handleUnderline()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
  
  // 监听缩放和视图设置事件
  useEffect(() => {
    const handleZoomIn = () => {
      setZoomLevel(prev => Math.min(prev + 10, 200))
      setViewSettings(prev => ({ ...prev, zoomLevel: Math.min(prev.zoomLevel + 10, 200) }))
    }
    
    const handleZoomOut = () => {
      setZoomLevel(prev => Math.max(prev - 10, 50))
      setViewSettings(prev => ({ ...prev, zoomLevel: Math.max(prev.zoomLevel - 10, 50) }))
    }
    
    const handleZoomReset = () => {
      setZoomLevel(100)
      setViewSettings(prev => ({ ...prev, zoomLevel: 100 }))
    }
    
    const handleSetZoom = (e: CustomEvent) => {
      const level = e.detail
      setZoomLevel(level)
      setViewSettings(prev => ({ ...prev, zoomLevel: level }))
    }
    
    const handleOpenViewSettings = () => {
      setShowViewSettingsDialog(true)
    }
    
    window.addEventListener('zoomIn', handleZoomIn)
    window.addEventListener('zoomOut', handleZoomOut)
    window.addEventListener('zoomReset', handleZoomReset)
    window.addEventListener('setZoom', handleSetZoom as EventListener)
    window.addEventListener('openViewSettings', handleOpenViewSettings)
    
    return () => {
      window.removeEventListener('zoomIn', handleZoomIn)
      window.removeEventListener('zoomOut', handleZoomOut)
      window.removeEventListener('zoomReset', handleZoomReset)
      window.removeEventListener('setZoom', handleSetZoom as EventListener)
      window.removeEventListener('openViewSettings', handleOpenViewSettings)
    }
  }, [])
  
  // 初始化时加载保存的文档或自动保存内容
  useEffect(() => {
    setIsInitialized(true)
    
    // 尝试加载视图设置
    const savedSettings = localStorage.getItem('viewSettings')
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings)
        setViewSettings(settings)
        setZoomLevel(settings.zoomLevel)
        setShowRuler(settings.showRuler)
        setShowOriginal(settings.showOriginal)
      } catch (error) {
        console.error('加载视图设置失败:', error)
      }
    }
    
    // 尝试加载当前文档
    const savedDoc = DocumentService.getCurrentDocument()
    if (savedDoc) {
      setCurrentDocument(savedDoc)
      setEditableContent(savedDoc.content)
      setDocumentTitle(savedDoc.title)
    } else {
      // 检查是否有自动保存的内容
      const autoSaved = DocumentService.getAutoSavedContent()
      if (autoSaved) {
        setEditableContent(autoSaved.content)
        if (autoSaved.title) {
          setDocumentTitle(autoSaved.title)
        }
        setSaveStatus('unsaved')
        
        toast({
          title: "恢复自动保存",
          description: "已恢复上次编辑的内容",
        })
      }
    }
  }, [])
  
  // 自动保存（每30秒）
  useEffect(() => {
    if (!editableContent) return
    
    const autoSaveTimer = setInterval(() => {
      DocumentService.autoSave(editableContent, documentTitle)
      console.log('自动保存完成')
    }, 30000) // 30秒
    
    return () => clearInterval(autoSaveTimer)
  }, [editableContent, documentTitle])
  
  // 监听内容变化，标记为未保存
  useEffect(() => {
    if (editableContent && currentDocument) {
      if (editableContent !== currentDocument.content) {
        setSaveStatus('unsaved')
      }
    }
  }, [editableContent, currentDocument])

  /**
   * 添加选中文本到@引用
   */
  const addSelectedTextToMentions = () => {
    if (selectedText) {
      addTextToMentions(selectedText)
      hideFloatingButton() // 只隐藏浮动按钮，不清除选中状态
    }
  }
  
  // 工具栏事件处理函数
  const handleUndo = () => editorRef.current?.undo()
  const handleRedo = () => editorRef.current?.redo()
  
  // 新建文档
  const handleNewDocument = () => {
    if (editableContent && saveStatus === 'unsaved') {
      // 如果有未保存的内容，提示用户
      if (!confirm('当前文档未保存，是否继续？')) {
        return
      }
    }
    
    const newDoc = DocumentService.createNewDocument()
    setCurrentDocument(newDoc)
    setEditableContent('')
    setDocumentTitle(newDoc.title)
    setSaveStatus('saved')
    
    // 清空编辑器历史
    if (editorRef.current) {
      // 重新初始化编辑器内容
      editorRef.current.getEditor()?.commands.setContent('')
    }
    
    toast({
      title: "新建成功",
      description: "已创建新文档",
    })
  }
  
  // 打开文档
  const handleOpenDocument = () => {
    fileInputRef.current?.click()
  }
  
  // 处理文件选择
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    try {
      const doc = await DocumentService.openDocument(file)
      setCurrentDocument(doc)
      setEditableContent(doc.content)
      setDocumentTitle(doc.title)
      setSaveStatus('saved')
      
      toast({
        title: "打开成功",
        description: `已打开文档: ${doc.title}`,
      })
    } catch (error) {
      toast({
        title: "打开失败",
        description: "无法打开所选文件",
        variant: "destructive",
      })
    }
    
    // 清空 input 以便下次可以选择相同文件
    event.target.value = ''
  }
  
  // 保存文档
  const handleSave = async () => {
    setSaveStatus('saving')
    
    try {
      let doc = currentDocument
      if (!doc) {
        // 如果没有当前文档，创建新文档
        doc = DocumentService.createNewDocument()
        doc.title = documentTitle
        setCurrentDocument(doc)
      }
      
      doc.content = editableContent
      doc.title = documentTitle
      
      await DocumentService.saveDocument(doc)
      setSaveStatus('saved')
      
      toast({
        title: "保存成功",
        description: "文档已保存到本地",
      })
    } catch (error) {
      setSaveStatus('unsaved')
      toast({
        title: "保存失败",
        description: "无法保存文档",
        variant: "destructive",
      })
    }
  }
  
  // 另存为
  const handleSaveAs = () => {
    setShowExportDialog(true)
  }
  
  // 处理导出
  const handleExport = async (format: string, filename: string) => {
    try {
      const fullFilename = `${filename}.${format}`
      
      switch (format) {
        case 'docx':
          await DocumentService.exportToWord(editableContent, fullFilename)
          break
        case 'pdf':
          await DocumentService.exportToPDF(editableContent, fullFilename)
          break
        case 'html':
          await DocumentService.exportToHTML(editableContent, fullFilename)
          break
        case 'txt':
          await DocumentService.exportToText(editableContent, fullFilename)
          break
        default:
          throw new Error('不支持的格式')
      }
      
      toast({
        title: "导出成功",
        description: `文档已导出为 ${fullFilename}`,
      })
    } catch (error) {
      toast({
        title: "导出失败",
        description: error instanceof Error ? error.message : "导出过程中出现错误",
        variant: "destructive",
      })
    }
  }
  
  // 打印文档
  const handlePrint = async () => {
    try {
      await DocumentService.printDocument(editableContent, documentTitle)
    } catch (error) {
      toast({
        title: "打印失败",
        description: "无法打印文档",
        variant: "destructive",
      })
    }
  }
  const handleShare = () => {
    // 分享功能可以后续实现
    toast({
      title: "功能开发中",
      description: "分享功能即将推出",
    })
  }
  const handleExportMenu = () => setShowExportDialog(true)
  
  // 导入功能
  const handleImportWord = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.docx,.doc'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        try {
          const content = await DocumentService.importFromWord(file)
          setEditableContent(content)
          setDocumentTitle(file.name.replace(/\.[^/.]+$/, ''))
          setSaveStatus('unsaved')
          toast({
            title: "导入成功",
            description: `已导入 Word 文档: ${file.name}`,
          })
        } catch (error) {
          toast({
            title: "导入失败",
            description: "无法导入 Word 文档",
            variant: "destructive",
          })
        }
      }
    }
    input.click()
  }
  
  const handleImportPDF = () => {
    toast({
      title: "功能开发中",
      description: "PDF 导入功能即将推出",
    })
  }
  
  const handleImportText = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.txt,.md'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        try {
          const content = await DocumentService.importFromText(file)
          setEditableContent(content)
          setDocumentTitle(file.name.replace(/\.[^/.]+$/, ''))
          setSaveStatus('unsaved')
          toast({
            title: "导入成功",
            description: `已导入文本文件: ${file.name}`,
          })
        } catch (error) {
          toast({
            title: "导入失败",
            description: "无法导入文本文件",
            variant: "destructive",
          })
        }
      }
    }
    input.click()
  }
  
  // 快速导出功能（从菜单直接导出）
  const handleExportWord = async () => {
    const filename = documentTitle.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')
    await handleExport('docx', filename)
  }
  
  const handleExportPDF = async () => {
    const filename = documentTitle.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')
    await handleExport('pdf', filename)
  }
  
  const handleExportHTML = async () => {
    const filename = documentTitle.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')
    await handleExport('html', filename)
  }
  
  const handleExportText = async () => {
    const filename = documentTitle.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')
    await handleExport('txt', filename)
  }
  
  // 查找和替换
  const handleFindReplace = () => {
    setShowFindReplaceDialog(true)
  }
  
  // 处理查找高亮
  const handleHighlight = (searchText: string, options: FindReplaceOptions) => {
    if (editorRef.current) {
      const count = editorRef.current.find(searchText, options)
      if (count === 0) {
        toast({
          title: "未找到匹配项",
          description: `未找到 "${searchText}"`,
        })
      }
    }
  }
  
  // 处理替换
  const handleReplace = (searchText: string, replaceText: string, options: FindReplaceOptions) => {
    if (editorRef.current) {
      editorRef.current.findAndReplace(searchText, replaceText, options.replaceAll)
      setSaveStatus('unsaved')
      
      toast({
        title: options.replaceAll ? "全部替换完成" : "替换完成",
        description: options.replaceAll 
          ? `已将所有 "${searchText}" 替换为 "${replaceText}"`
          : `已替换 "${searchText}" 为 "${replaceText}"`,
      })
    }
  }
  
  // 剪切、复制、粘贴 - 使用编辑器的方法
  const handleCut = () => {
    if (editorRef.current) {
      editorRef.current.cut()
      setSaveStatus('unsaved')
    }
  }
  
  const handleCopy = () => {
    if (editorRef.current) {
      editorRef.current.copy()
    }
  }
  
  const handlePaste = async () => {
    if (editorRef.current) {
      await editorRef.current.paste()
      setSaveStatus('unsaved')
    }
  }
  
  // 全选
  const handleSelectAll = () => {
    if (editorRef.current) {
      editorRef.current.selectAll()
    }
  }
  const handleToggleRuler = () => {
    setShowRuler(!showRuler)
    setViewSettings(prev => ({ ...prev, showRuler: !prev.showRuler }))
  }
  const handleToggleOriginalView = () => {
    setShowOriginal(!showOriginal)
    setViewSettings(prev => ({ ...prev, showOriginal: !prev.showOriginal }))
  }
  
  // 处理视图设置变化
  const handleViewSettingsChange = (newSettings: ViewSettings) => {
    setViewSettings(newSettings)
    setZoomLevel(newSettings.zoomLevel)
    setShowRuler(newSettings.showRuler)
    setShowOriginal(newSettings.showOriginal)
    
    // 保存设置到本地存储
    localStorage.setItem('viewSettings', JSON.stringify(newSettings))
    
    toast({
      title: "设置已应用",
      description: "视图设置已更新",
    })
  }
  
  // 打开视图设置
  const handleViewSettings = () => {
    setShowViewSettingsDialog(true)
  }
  
  // 插入功能
  const handleInsertImage = () => {
    setShowInsertImageDialog(true)
  }
  
  const handleInsertImageConfirm = (imageUrl: string, altText?: string) => {
    if (editorRef.current) {
      editorRef.current.insertImage(imageUrl)
      setSaveStatus('unsaved')
      toast({
        title: "图片已插入",
        description: "图片已成功插入到编辑器中",
      })
    }
  }
  
  const handleInsertTable = () => {
    setShowInsertTableDialog(true)
  }
  
  const handleInsertTableConfirm = (rows: number, cols: number, withHeader: boolean) => {
    if (editorRef.current) {
      editorRef.current.insertTable()
      setSaveStatus('unsaved')
      toast({
        title: "表格已插入",
        description: `已插入 ${rows}×${cols} 的表格`,
      })
    }
  }
  
  const handleInsertLink = () => {
    // 获取选中的文本作为默认链接文字
    const selectedText = editorRef.current?.getEditor()?.state.doc.textBetween(
      editorRef.current?.getEditor()?.state.selection.from,
      editorRef.current?.getEditor()?.state.selection.to
    )
    setShowInsertLinkDialog(true)
  }
  
  const handleInsertLinkConfirm = (url: string, text: string, openInNewTab: boolean) => {
    if (editorRef.current) {
      // 如果有选中文本，替换为链接
      const editor = editorRef.current.getEditor()
      if (editor) {
        const { from, to } = editor.state.selection
        const hasSelection = from !== to
        
        if (hasSelection) {
          // 替换选中文本为链接
          editor.chain()
            .focus()
            .setLink({ href: url, target: openInNewTab ? '_blank' : undefined })
            .run()
        } else {
          // 插入新链接
          editor.chain()
            .focus()
            .insertContent(`<a href="${url}"${openInNewTab ? ' target="_blank"' : ''}>${text}</a>`)
            .run()
        }
      }
      
      setSaveStatus('unsaved')
      toast({
        title: "链接已插入",
        description: "链接已成功插入到编辑器中",
      })
    }
  }
  
  const handleInsertSymbol = () => {
    setShowInsertSymbolDialog(true)
  }
  
  const handleInsertSymbolConfirm = (symbol: string) => {
    if (editorRef.current) {
      const editor = editorRef.current.getEditor()
      if (editor) {
        editor.chain().focus().insertContent(symbol).run()
      }
      setSaveStatus('unsaved')
    }
  }
  // 格式化功能 - 连接到编辑器
  const handleFormatText = () => {
    // 打开文本格式对话框（可以后续实现）
    toast({
      title: "功能开发中",
      description: "文本格式设置即将推出",
    })
  }
  
  const handleFormatParagraph = () => {
    // 打开段落格式对话框（可以后续实现）
    toast({
      title: "功能开发中",
      description: "段落格式设置即将推出",
    })
  }
  
  const handleFormatStyles = () => {
    // 打开样式格式对话框（可以后续实现）
    toast({
      title: "功能开发中",
      description: "样式格式设置即将推出",
    })
  }
  
  // 文本样式
  const handleBold = () => {
    if (editorRef.current) {
      editorRef.current.toggleBold()
      setSaveStatus('unsaved')
    }
  }
  
  const handleItalic = () => {
    if (editorRef.current) {
      editorRef.current.toggleItalic()
      setSaveStatus('unsaved')
    }
  }
  
  const handleUnderline = () => {
    if (editorRef.current) {
      editorRef.current.toggleUnderline()
      setSaveStatus('unsaved')
    }
  }
  
  const handleStrikethrough = () => {
    if (editorRef.current) {
      editorRef.current.toggleStrike()
      setSaveStatus('unsaved')
    }
  }
  
  // 颜色设置
  const handleTextColor = (color: string) => {
    if (editorRef.current) {
      editorRef.current.setTextColor(color)
      setFormatState(prev => ({ ...prev, textColor: color }))
      setSaveStatus('unsaved')
    }
  }
  
  const handleBackgroundColor = (color: string) => {
    if (editorRef.current) {
      editorRef.current.setHighlight(color)
      setFormatState(prev => ({ ...prev, backgroundColor: color }))
      setSaveStatus('unsaved')
    }
  }
  
  // 字体和字号
  const handleFontSize = (size: string) => {
    if (editorRef.current) {
      editorRef.current.setFontSize(size)
      setFormatState(prev => ({ ...prev, fontSize: size }))
      setSaveStatus('unsaved')
    }
  }
  
  const handleFontFamily = (family: string) => {
    if (editorRef.current) {
      editorRef.current.setFontFamily(family)
      setFormatState(prev => ({ ...prev, fontFamily: family }))
      setSaveStatus('unsaved')
    }
  }
  
  // 对齐方式
  const handleAlign = (align: 'left' | 'center' | 'right' | 'justify') => {
    if (editorRef.current) {
      editorRef.current.setTextAlign(align)
      setFormatState(prev => ({ ...prev, alignment: align }))
      setSaveStatus('unsaved')
    }
  }
  
  // 列表
  const handleBulletList = () => {
    if (editorRef.current) {
      editorRef.current.toggleBulletList()
      setSaveStatus('unsaved')
    }
  }
  
  const handleNumberedList = () => {
    if (editorRef.current) {
      editorRef.current.toggleOrderedList()
      setSaveStatus('unsaved')
    }
  }
  
  // 缩进
  const handleIndent = () => {
    if (editorRef.current) {
      editorRef.current.indent()
      setSaveStatus('unsaved')
    }
  }
  
  const handleOutdent = () => {
    if (editorRef.current) {
      editorRef.current.outdent()
      setSaveStatus('unsaved')
    }
  }
  
  // 行高
  const handleLineHeight = (height: string) => {
    if (editorRef.current) {
      editorRef.current.setLineHeight(height)
      setFormatState(prev => ({ ...prev, lineHeight: height }))
      setSaveStatus('unsaved')
    }
  }
  const togglePanelPin = () => setIsPanelPinned(!isPanelPinned)
  const handleEditorScroll = (progress: number) => setEditorScrollProgress(progress)
  const handleViewHistory = () => console.log('View chat history')
  const handleNewConversation = () => {
    // 清空聊天记录，开始新对话
    console.log('Start new conversation')
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* 顶部头部栏 */}
      <Header
        documentTitle={documentTitle}
        onTitleChange={setDocumentTitle}
        saveStatus={saveStatus}
        onSave={handleSave}
        onShare={handleShare}
        onExport={handleExportMenu}
        collaborators={defaultCollaborators}
      />

      {/* 主菜单栏和格式化工具栏 */}
      <MainToolbar
        onNewDocument={handleNewDocument}
        onOpenDocument={handleOpenDocument}
        onSave={handleSave}
        onSaveAs={handleSaveAs}
        onPrint={handlePrint}
        onImportWord={handleImportWord}
        onImportPDF={handleImportPDF}
        onImportText={handleImportText}
        onExportWord={handleExportWord}
        onExportPDF={handleExportPDF}
        onExportHTML={handleExportHTML}
        onExportText={handleExportText}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onFindReplace={handleFindReplace}
        onCut={handleCut}
        onCopy={handleCopy}
        onPaste={handlePaste}
        onToggleRuler={handleToggleRuler}
        onToggleOriginalView={handleToggleOriginalView}
        onInsertImage={handleInsertImage}
        onInsertTable={handleInsertTable}
        onInsertLink={handleInsertLink}
        onInsertSymbol={handleInsertSymbol}
        onFormatText={handleFormatText}
        onFormatParagraph={handleFormatParagraph}
        onFormatStyles={handleFormatStyles}
        showRuler={showRuler}
        showOriginal={showOriginal}
        // 格式化状态和操作
        canUndo={editorRef.current?.canUndo() || false}
        canRedo={editorRef.current?.canRedo() || false}
        isBold={formatState.isBold}
        isItalic={formatState.isItalic}
        isUnderline={formatState.isUnderline}
        isStrikethrough={formatState.isStrikethrough}
        textColor={formatState.textColor}
        backgroundColor={formatState.backgroundColor}
        fontSize={formatState.fontSize}
        fontFamily={formatState.fontFamily}
        alignment={formatState.alignment}
        isBulletList={formatState.isBulletList}
        isNumberedList={formatState.isNumberedList}
        lineHeight={formatState.lineHeight}
        onBold={handleBold}
        onItalic={handleItalic}
        onUnderline={handleUnderline}
        onStrikethrough={handleStrikethrough}
        onTextColor={handleTextColor}
        onBackgroundColor={handleBackgroundColor}
        onFontSize={handleFontSize}
        onFontFamily={handleFontFamily}
        onAlign={handleAlign}
        onBulletList={handleBulletList}
        onNumberedList={handleNumberedList}
        onIndent={handleIndent}
        onOutdent={handleOutdent}
        onLineHeight={handleLineHeight}
        onViewHistory={handleViewHistory}
        onNewConversation={handleNewConversation}
      />



      {/* 标尺 */}
      {showRuler && (
        <div className="bg-gray-100 border-b border-gray-300 h-6 flex items-center px-6">
          <div className="flex items-center w-full relative">
            <div className="absolute inset-0 flex">
              {Array.from({ length: 20 }, (_, i) => (
                <div key={i} className="flex-1 border-r border-gray-400 relative">
                  <span className="absolute top-0 left-0 text-[10px] text-gray-600 pl-0.5">{i}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 主要内容区域 - 左右分栏布局 - 最大化高度利用 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧编辑器区域 - 60% */}
        <EditorSection
          editableContent={editableContent}
          showOriginal={showOriginal}
          originalContent={originalSentences}
          highlightedSentenceIndex={highlightedSentenceIndex}
          editorScrollProgress={editorScrollProgress}
          isPanelPinned={isPanelPinned}
          formatState={formatState}
          editorRef={editorRef}
          isInitialized={isInitialized}
          saveStatus={saveStatus}
          onContentChange={setEditableContent}
          onToggleOriginal={handleToggleOriginalView}
          onTogglePanelPin={togglePanelPin}
          onEditorScroll={handleEditorScroll}
          onFormatStateChange={setFormatState}
          onSaveStatusChange={setSaveStatus}
          zoomLevel={viewSettings.zoomLevel}
          showLineNumbers={viewSettings.showLineNumbers}
          fontFamily={viewSettings.fontFamily}
          fontSize={viewSettings.fontSize}
          lineHeight={viewSettings.lineHeight}
        />

        {/* 右侧AI聊天区域 - 40% */}
        <AIChatPanel
          chatMessages={chatMessages}
          inputValue={inputValue}
          mentionedItems={mentionedItems}
          textActionGroups={textActionGroups}
          currentTextId={currentTextId}
          showAttachMenu={showAttachMenu}
          expandedCategories={expandedCategories}
          onInputChange={setInputValue}
          onSendMessage={sendMessage}
          onToggleAttachMenu={() => setShowAttachMenu(!showAttachMenu)}
          onToggleCategoryExpanded={toggleCategoryExpanded}
          onRemoveMention={removeMention}
          onRemoveActionFromGroup={removeActionFromGroup}
          onSelectTextGroup={selectTextGroup}
          onAddActionToMentions={addActionToMentions}
          onUpdateGroupCustomInstruction={updateGroupCustomInstruction}
          onUpdateActionCustomInstruction={updateActionCustomInstruction}
        />
      </div>
      
      {/* 底部状态栏 */}
      <StatusBar
        currentPage={1}
        totalPages={3}
        wordCount={wordCount}
        charCount={charCount}
        language="中文"
        viewMode={viewMode}
        zoomLevel={zoomLevel}
        onViewModeChange={setViewMode}
        onZoomChange={setZoomLevel}
        showOriginal={showOriginal}
        saveStatus={saveStatus}
      />
      
      {/* 浮动按钮 - 添加到聊天 */}
      {showFloatingButton && (
        <div
          className="fixed z-50 animate-fade-in"
          style={{
            left: `${floatingButtonPosition.x}px`,
            top: `${floatingButtonPosition.y}px`,
            transform: 'translateX(-50%)'
          }}
        >
          <Button
            size="sm"
            onClick={addSelectedTextToMentions}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
          >
            <AtSign className="h-3 w-3 mr-1" />
            添加到聊天
          </Button>
        </div>
      )}
      
      {/* 隐藏的文件输入元素 */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.md,.html,.docx,.doc"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      
      <input
        ref={importInputRef}
        type="file"
        accept=".txt,.md,.html,.docx,.doc,.pdf"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      
      {/* 导出对话框 */}
      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        onExport={handleExport}
        defaultFilename={documentTitle.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}
      />
      
      {/* 查找替换对话框 */}
      <FindReplaceDialog
        open={showFindReplaceDialog}
        onOpenChange={setShowFindReplaceDialog}
        content={editorRef.current?.getContent() || editableContent}
        onReplace={handleReplace}
        onHighlight={handleHighlight}
      />
      
      {/* 视图设置对话框 */}
      <ViewSettingsDialog
        open={showViewSettingsDialog}
        onOpenChange={setShowViewSettingsDialog}
        settings={viewSettings}
        onSettingsChange={handleViewSettingsChange}
      />
      
      {/* 插入图片对话框 */}
      <InsertImageDialog
        open={showInsertImageDialog}
        onOpenChange={setShowInsertImageDialog}
        onInsert={handleInsertImageConfirm}
      />
      
      {/* 插入表格对话框 */}
      <InsertTableDialog
        open={showInsertTableDialog}
        onOpenChange={setShowInsertTableDialog}
        onInsert={handleInsertTableConfirm}
      />
      
      {/* 插入链接对话框 */}
      <InsertLinkDialog
        open={showInsertLinkDialog}
        onOpenChange={setShowInsertLinkDialog}
        onInsert={handleInsertLinkConfirm}
        selectedText={editorRef.current?.getEditor()?.state.doc.textBetween(
          editorRef.current?.getEditor()?.state.selection.from || 0,
          editorRef.current?.getEditor()?.state.selection.to || 0
        )}
      />
      
      {/* 插入符号对话框 */}
      <InsertSymbolDialog
        open={showInsertSymbolDialog}
        onOpenChange={setShowInsertSymbolDialog}
        onInsert={handleInsertSymbolConfirm}
      />
      
      {/* 添加高亮动画样式 */}
      <style dangerouslySetInnerHTML={{ __html: `
        /* 禁止非编辑器区域的文本选择 */
        * {
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }
        
        /* 只允许编辑器内容可选择 */
        .editor-content,
        .editor-content *,
        .editor-text-area,
        .editor-text-area *,
        .ProseMirror,
        .ProseMirror * {
          -webkit-user-select: text;
          -moz-user-select: text;
          -ms-user-select: text;
          user-select: text;
        }
        
        /* 输入框和文本区域也应该可选择 */
        input,
        textarea {
          -webkit-user-select: text;
          -moz-user-select: text;
          -ms-user-select: text;
          user-select: text;
        }
        
        /* 自定义滚动条样式 */
        .scrollbar-thin {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f1f5f9;
        }
        
        .scrollbar-thin::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 6px;
          margin: 4px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 6px;
          border: 2px solid #f1f5f9;
          background-clip: padding-box;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
          border: 2px solid #f1f5f9;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb:active {
          background: #64748b;
          border: 2px solid #f1f5f9;
        }
        
        /* 为编辑器区域的滚动条添加特殊样式 */
        .editor-content::-webkit-scrollbar,
        .ProseMirror::-webkit-scrollbar {
          width: 10px;
        }
        
        .editor-content::-webkit-scrollbar-track,
        .ProseMirror::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .editor-content::-webkit-scrollbar-thumb,
        .ProseMirror::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 6px;
        }
        
        /* 淡入动画 */
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        
        /* 选中文本高亮 - 只在编辑器内有效 */
        .editor-content ::selection,
        .editor-text-area ::selection,
        .ProseMirror ::selection {
          background-color: #fef3c7;
          color: #000;
        }
        
        .editor-content ::-moz-selection,
        .editor-text-area ::-moz-selection,
        .ProseMirror ::-moz-selection {
          background-color: #fef3c7;
          color: #000;
        }
        
        /* 高亮动画 */
        @keyframes highlight {
          0% {
            background-color: transparent;
          }
          50% {
            background-color: rgb(254 240 138);
          }
          100% {
            background-color: rgb(254 240 138);
          }
        }
        
        .animate-highlight {
          animation: highlight 0.5s ease-out;
        }
      ` }} />
    </div>
  )
}