"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  Mountain,
  ArrowLeft,
  FileText,
  Languages,
  FileIcon,
  Sparkles,
  Save,
  Undo,
  Redo,
  MessageCircle,
  X,
  Minimize2,
  Maximize2,
  Plus,
  Mic,
  Image,
  Paperclip,
  Search,
  Brain,
  Globe,
  Send,
  Bot,
  User,
  CheckCircle,
  HelpCircle,
  Edit3,
} from "lucide-react"
import Link from "next/link"
import { useState, useRef, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Header } from "@/components/translate-editor/Header"
import { MainToolbar } from "@/components/translate-editor/MainToolbar"
import { FormattingToolbar } from "@/components/translate-editor/FormattingToolbar"
import { EditorCanvas, EditorCanvasRef } from "@/components/translate-editor/EditorCanvas"
import { SideBySideReviewPanel } from "@/components/translate-editor/SideBySideReviewPanel"
import { StatusBar } from "@/components/translate-editor/StatusBar"

// 模拟原文内容 - 分成句子数组
const originalSentences = [
  "人工智能的浪潮：重塑未来与我们的角色",
  "人工智能（AI）正以前所未有的力量，化身为一场深刻的科技革命浪潮，席卷全球。",
  "它不再是科幻小说的遥远构想，而是已经渗透到我们日常生活与工作的方方面面，从智能推荐系统到复杂的医疗诊断。",
  "面对这场变革，理解其内在的机遇、挑战以及我们在其中的位置，显得至关重要。",
  "机遇的黎明：效率与创新的双重奏",
  "AI 最直观的贡献在于对生产效率的巨大提升。",
  "它能将人类从重复、繁琐的劳动中解放出来，自动化处理海量数据，让专业人士能更专注于需要创造力和战略思维的核心任务。",
  "同时，AI 也正成为创新的强大催化剂。",
  "在科研领域，它加速了新材料的发现和药物的研发；在艺术领域，它成为画家、音乐家和设计师的灵感伙伴，共同探索表达的全新疆域。",
  "这曲由效率与创新共同谱写的双重奏，正在为社会发展注入澎湃的动力。",
  "挑战的深水区：责任与适应的必修课",
  "然而，技术的飞跃也伴随着严峻的挑战。",
  "算法的偏见、数据的隐私安全、决策的透明度与问责制，都是亟待解决的伦理难题。",
  "此外，AI 对传统就业市场的冲击不容忽视，这要求我们的教育体系和社会结构做出深刻调整，推行终身学习的理念，帮助劳动者适应新的人机协作模式。",
  "如何制定合理的规则，确保AI朝着对人类有益的方向发展，是我们共同的必修课。",
  "人的角色：驾驭而非替代的智慧",
  "在这场变革中，一个核心问题是：人的价值何在？",
  "答案并非悲观的\"被替代\"，而是充满希望的\"再定位\"。",
  "AI 擅长计算和模式识别，但人类独有的情感智能、批判性思维、复杂道德判断以及真正的创造力，是机器难以企及的。",
  "我们未来的角色，将从任务的执行者，转变为AI工具的驾驭者、价值的判断者和方向的引领者。",
  "智慧地使用AI这把\"利器\"，让它成为增强人类能力的伙伴，而非竞争对手，这考验着我们的远见与智慧。"
]

// 模拟译文内容
const translatedContent = `The Tide of Artificial Intelligence: Reshaping the Future and Our Role

Artificial Intelligence (AI) is surging across the globe as a profound technological revolution with unprecedented power. It is no longer a distant concept from science fiction but has permeated every aspect of our daily lives and work, from intelligent recommendation systems to complex medical diagnostics. In the face of this transformation, it is crucial to understand its inherent opportunities, challenges, and our place within it.

The Dawn of Opportunity: A Duet of Efficiency and Innovation

The most immediate contribution of AI lies in its immense enhancement of productivity. It can liberate humans from repetitive and tedious labor, automating the processing of massive amounts of data and allowing professionals to focus more on core tasks that require creativity and strategic thinking. Simultaneously, AI is becoming a powerful catalyst for innovation. In scientific research, it accelerates the discovery of new materials and the development of pharmaceuticals; in the arts, it serves as an inspirational partner for painters, musicians, and designers, jointly exploring new frontiers of expression. This duet, composed of efficiency and innovation, is injecting powerful momentum into social development.

The Deep Waters of Challenge: A Required Course in Responsibility and Adaptation

However, this technological leap is accompanied by stern challenges. Algorithmic bias, data privacy and security, and the transparency and accountability of decision-making are all pressing ethical dilemmas that need to be resolved. Furthermore, the impact of AI on the traditional job market cannot be ignored. This demands that our educational systems and social structures undergo profound adjustments, promoting the concept of lifelong learning and helping the workforce adapt to new models of human-machine collaboration. How to establish reasonable regulations to ensure AI develops in a direction beneficial to humanity is a required course for us all.

The Human Role: The Wisdom of Steering, Not Replacing

A central question in this transformation is: what is the value of human beings? The answer is not a pessimistic 'replacement,' but a hopeful 'repositioning.' AI excels at computation and pattern recognition, but uniquely human attributes such as emotional intelligence, critical thinking, complex ethical judgment, and true creativity are difficult for machines to attain. Our future role will shift from being executors of tasks to being the drivers of AI tools, the arbiters of value, and the navigators of direction. Wisely using AI as a powerful tool—making it a partner that augments human capabilities rather than a competitor—tests our foresight and wisdom.`

// AI操作选项
const aiOptions = [
  { icon: Sparkles, label: "润色", value: "polish" },
  { icon: Maximize2, label: "扩写/缩写", value: "expand" },
  { icon: MessageCircle, label: "改变语气", value: "tone" },
  { icon: CheckCircle, label: "检查语法", value: "grammar" },
  { icon: HelpCircle, label: "提问", value: "ask" },
  { icon: Edit3, label: "其他指令", value: "other" },
]

// 增强功能选项
const enhancedOptions = [
  { icon: Search, label: "数据库检索", value: "database" },
  { icon: Brain, label: "深度思考", value: "deep" },
  { icon: Globe, label: "联网搜索", value: "web" },
]



interface ChatMessage {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
}

/**
 * 译文编辑器页面 - 单页预览模式 + AI聊天界面
 */
export default function TranslateEditorPage() {
  // 状态管理
  const [editableContent, setEditableContent] = useState(translatedContent)
  const [showOriginal, setShowOriginal] = useState(false)
  const [highlightedSentenceIndex, setHighlightedSentenceIndex] = useState<number | null>(null)
  const [isPanelPinned, setIsPanelPinned] = useState(false)
  const [editorScrollProgress, setEditorScrollProgress] = useState(0)
  
  // 文档状态
  const [documentTitle, setDocumentTitle] = useState('AI翻译文档 - 2024年11月')
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  const [collaborators] = useState([
    { id: '1', name: '张三', email: 'zhangsan@example.com' },
    { id: '2', name: '李四', email: 'lisi@example.com' },
    { id: '3', name: '王五', email: 'wangwu@example.com' },
    { id: '4', name: '赵六', email: 'zhaoliu@example.com' },
  ])
  
  // 视图状态
  const [showRuler, setShowRuler] = useState(false)
  const [viewMode, setViewMode] = useState<'edit' | 'read' | 'preview'>('edit')
  const [zoomLevel, setZoomLevel] = useState(100)
  
  // 格式状态
  const [formatState, setFormatState] = useState({
    isBold: false,
    isItalic: false,
    isUnderline: false,
    isStrikethrough: false,
    textColor: '#000000',
    backgroundColor: '#FFFFFF',
    fontSize: '12',
    fontFamily: 'default',
    alignment: 'left' as 'left' | 'center' | 'right' | 'justify',
    isBulletList: false,
    isNumberedList: false,
    lineHeight: '1.5',
  })

  // AI聊天状态
  const [showAIChat, setShowAIChat] = useState(false)
  const [aiChatSize, setAIChatSize] = useState<'normal' | 'minimized' | 'maximized'>('normal')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [selectedEnhancedOptions, setSelectedEnhancedOptions] = useState<string[]>([])
  const [showAttachMenu, setShowAttachMenu] = useState(false)
  
  // AI聊天框位置和大小
  const [aiChatPosition, setAIChatPosition] = useState({ x: 20, y: 20 })
  const [aiChatWidth, setAIChatWidth] = useState(500)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  
  // 编辑历史
  const [history, setHistory] = useState<string[]>([editableContent])
  const [historyIndex, setHistoryIndex] = useState(0)
  
  // 引用
  const translatedTextRef = useRef<HTMLTextAreaElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const aiChatRef = useRef<HTMLDivElement>(null)
  const highlightedParagraphRef = useRef<HTMLParagraphElement>(null)
  const editorRef = useRef<EditorCanvasRef>(null)
  

  
  /**
   * 打开AI聊天
   */
  const openAIChat = () => {
    // 如果聊天未打开，先打开聊天
    if (!showAIChat) {
      setShowAIChat(true)
    }
    
    // 如果没有消息，添加默认欢迎消息
    if (chatMessages.length === 0) {
      setChatMessages([{
        id: Date.now().toString(),
        type: 'ai',
        content: '您好！我是您的AI助手。请问您需要什么帮助？您可以选择以下操作，或直接告诉我您的需求：',
        timestamp: new Date()
      }])
    }
  }
  
  /**
   * 发送消息
   */
  const sendMessage = (content?: string) => {
    const messageContent = content || inputValue.trim()
    if (!messageContent) return
    
    // 添加用户消息
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: messageContent,
      timestamp: new Date()
    }
    
    setChatMessages(prev => [...prev, userMessage])
    setInputValue('')
    
    // 模拟AI响应
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: `我已收到您的请求："${messageContent}"。正在为您处理...`,
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, aiMessage])
    }, 1000)
  }
  
  /**
   * 处理AI选项点击
   */
  const handleAIOption = (option: typeof aiOptions[0]) => {
    sendMessage(`我想要${option.label}当前编辑的内容`)
  }
  
  /**
   * 切换增强选项
   */
  const toggleEnhancedOption = (value: string) => {
    setSelectedEnhancedOptions(prev => 
      prev.includes(value) 
        ? prev.filter(v => v !== value)
        : [...prev, value]
    )
  }
  
  /**
   * 撤销/重做 - 使用编辑器的内置功能
   */
  const handleUndo = () => {
    editorRef.current?.undo()
  }

  const handleRedo = () => {
    editorRef.current?.redo()
  }
  
  /**
   * 处理拖动开始
   */
  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true)
    const rect = aiChatRef.current?.getBoundingClientRect()
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      })
    }
  }
  
  /**
   * 处理调整大小开始
   */
  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsResizing(true)
  }

  /**
   * 处理保存
   */
  const handleSave = useCallback(() => {
    setSaveStatus('saving')
    // 模拟保存过程
    setTimeout(() => {
      setSaveStatus('saved')
    }, 2000)
  }, [])

  /**
   * 处理分享
   */
  const handleShare = useCallback(() => {
    console.log('分享文档')
    // 实际实现中会打开分享对话框
  }, [])

  /**
   * 处理导出
   */
  const handleExport = useCallback((format: 'docx' | 'pdf') => {
    console.log(`导出为 ${format} 格式`)
    // 实际实现中会触发文件下载
  }, [])

  /**
   * 菜单栏处理函数
   */
  const handleNewDocument = () => {
    if (confirm('是否要创建新文档？未保存的更改将会丢失。')) {
      setEditableContent('')
      setDocumentTitle('未命名文档')
      setSaveStatus('saved')
    }
  }

  const handleOpenDocument = () => {
    console.log('打开文档')
    // 实际实现中会打开文件选择对话框
  }

  const handleSaveAs = () => {
    console.log('另存为')
    // 实际实现中会打开另存为对话框
  }

  const handlePrint = () => {
    window.print()
  }

  const handleFindReplace = () => {
    console.log('查找替换')
    // 实际实现中会打开查找替换对话框
  }

  const handleCut = () => {
    document.execCommand('cut')
  }

  const handleCopy = () => {
    document.execCommand('copy')
  }

  const handlePaste = () => {
    document.execCommand('paste')
  }

  const handleToggleRuler = () => {
    setShowRuler(!showRuler)
  }

  const handleToggleOriginalView = () => {
    setShowOriginal(!showOriginal)
  }

  const handleInsertImage = () => {
    // 实际实现中会打开图片选择对话框
    const imageUrl = prompt('请输入图片URL:')
    if (imageUrl) {
      editorRef.current?.insertImage(imageUrl)
    }
  }

  const handleInsertTable = () => {
    editorRef.current?.insertTable()
  }

  const handleInsertLink = () => {
    // 实际实现中会打开链接插入对话框
    const url = prompt('请输入链接URL:')
    if (url) {
      editorRef.current?.insertLink(url)
    }
  }

  const handleInsertSymbol = () => {
    console.log('插入符号')
    // 实际实现中会打开符号选择对话框
  }

  const handleFormatText = () => {
    console.log('文本格式')
    // 实际实现中会打开文本格式对话框
  }

  const handleFormatParagraph = () => {
    console.log('段落格式')
    // 实际实现中会打开段落格式对话框
  }

  const handleFormatStyles = () => {
    console.log('样式和格式')
    // 实际实现中会打开样式管理对话框
  }

  /**
   * 格式化操作处理函数
   */
  const handleBold = () => {
    editorRef.current?.toggleBold()
  }

  const handleItalic = () => {
    editorRef.current?.toggleItalic()
  }

  const handleUnderline = () => {
    editorRef.current?.toggleUnderline()
  }

  const handleStrikethrough = () => {
    editorRef.current?.toggleStrike()
  }

  const handleTextColor = (color: string) => {
    editorRef.current?.setTextColor(color)
  }

  const handleBackgroundColor = (color: string) => {
    editorRef.current?.setHighlight(color)
  }

  const handleFontSize = (size: string) => {
    editorRef.current?.setFontSize(size)
  }

  const handleFontFamily = (family: string) => {
    editorRef.current?.setFontFamily(family)
  }

  const handleAlign = (alignment: 'left' | 'center' | 'right' | 'justify') => {
    editorRef.current?.setTextAlign(alignment)
  }

  const handleBulletList = () => {
    editorRef.current?.toggleBulletList()
  }

  const handleNumberedList = () => {
    editorRef.current?.toggleOrderedList()
  }

  const handleIndent = () => {
    editorRef.current?.indent()
  }

  const handleOutdent = () => {
    editorRef.current?.outdent()
  }

  const handleLineHeight = (height: string) => {
    editorRef.current?.setLineHeight(height)
  }

  // 处理编辑器滚动事件
  const handleEditorScroll = useCallback((progress: number) => {
    setEditorScrollProgress(progress)
  }, [])

  /**
   * 处理编辑器点击事件 - 根据点击位置高亮对应的原文
   */
  const handleEditorClick = useCallback(() => {
    // 简单的演示：随机高亮一个句子
    // 实际应用中应该根据光标位置计算对应的原文句子
    if (showOriginal) {
      const randomIndex = Math.floor(Math.random() * originalSentences.length)
      setHighlightedSentenceIndex(randomIndex)
      
      // 3秒后清除高亮
      setTimeout(() => {
        setHighlightedSentenceIndex(null)
      }, 3000)
    }
  }, [showOriginal, originalSentences.length])

  // 切换原文面板固定状态
  const togglePanelPin = useCallback(() => {
    setIsPanelPinned(prev => !prev)
  }, [])

  // 计算字数和字符数
  const [wordStats, setWordStats] = useState({ wordCount: 0, charCount: 0 })
  
  useEffect(() => {
    // 只在客户端执行
    if (typeof window !== 'undefined' && editableContent) {
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = editableContent
      const text = tempDiv.textContent || ''
      const wordCount = text.trim().length > 0 ? text.trim().split(/\s+/).length : 0
      const charCount = text.length
      setWordStats({ wordCount, charCount })
    }
  }, [editableContent])
  
  const { wordCount, charCount } = wordStats

  // 自动滚动到聊天底部
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])
  
  // 自动滚动到高亮的段落
  useEffect(() => {
    if (highlightedSentenceIndex !== null && highlightedParagraphRef.current) {
      setTimeout(() => {
        highlightedParagraphRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        })
      }, 100)
    }
  }, [highlightedSentenceIndex])
  


  // 处理拖动和调整大小
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && aiChatRef.current) {
        const newX = e.clientX - dragOffset.x
        const newY = e.clientY - dragOffset.y
        
        // 限制在视窗内
        const maxX = window.innerWidth - aiChatWidth
        const maxY = window.innerHeight - 100
        
        setAIChatPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY))
        })
      } else if (isResizing) {
        const newWidth = e.clientX - aiChatPosition.x
        // 限制最小和最大宽度
        setAIChatWidth(Math.max(320, Math.min(newWidth, window.innerWidth - aiChatPosition.x - 20)))
      }
    }
    
    const handleMouseUp = () => {
      setIsDragging(false)
      setIsResizing(false)
      document.body.classList.remove('dragging', 'resizing')
    }
    
    if (isDragging || isResizing) {
      // 添加body类来改变鼠标样式
      if (isDragging) {
        document.body.classList.add('dragging')
      } else {
        document.body.classList.add('resizing')
      }
      
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.classList.remove('dragging', 'resizing')
      }
    }
  }, [isDragging, isResizing, dragOffset, aiChatPosition.x, aiChatWidth])
  
  // 监听内容变化，更新保存状态
  const [isInitialized, setIsInitialized] = useState(false)
  useEffect(() => {
    if (isInitialized && saveStatus === 'saved') {
      setSaveStatus('unsaved')
    }
  }, [editableContent])
  
  // 标记初始化完成
  useEffect(() => {
    setIsInitialized(true)
  }, [])

  // 键盘快捷键处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+O 切换原文显示
      if (e.ctrlKey && e.shiftKey && e.key === 'O') {
        e.preventDefault()
        setShowOriginal(prev => !prev)
      }
      
      // Ctrl+S 保存
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSave])

  // 保存用户偏好设置
  useEffect(() => {
    // 保存面板固定状态到 localStorage
    localStorage.setItem('translate-editor-panel-pinned', JSON.stringify(isPanelPinned))
  }, [isPanelPinned])
  
  // 恢复用户偏好设置
  useEffect(() => {
    const savedPinState = localStorage.getItem('translate-editor-panel-pinned')
    if (savedPinState) {
      setIsPanelPinned(JSON.parse(savedPinState))
    }
  }, [])

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* 使用新的Header组件 */}
      <Header
        documentTitle={documentTitle}
        onTitleChange={setDocumentTitle}
        saveStatus={saveStatus}
        onSave={handleSave}
        onShare={handleShare}
        onExport={handleExport}
        collaborators={collaborators}
      />

      {/* 主菜单栏 */}
      <MainToolbar
        onNewDocument={handleNewDocument}
        onOpenDocument={handleOpenDocument}
        onSave={handleSave}
        onSaveAs={handleSaveAs}
        onPrint={handlePrint}
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
      />

      {/* 格式化工具栏 */}
      <FormattingToolbar
        onUndo={handleUndo}
        onRedo={handleRedo}
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
        onInsertTable={handleInsertTable}
        onInsertImage={handleInsertImage}
        onInsertLink={handleInsertLink}
      />

      {/* 导航栏 - 简化版，移除重复功能 */}
      <div className="bg-white border-b border-gray-200 px-6 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/preview" className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回预览
            </Link>
          </Button>
          <div className="h-6 w-px bg-gray-300"></div>
          <Link href="/" className="flex items-center gap-2">
            <Mountain className="h-6 w-6 text-blue-600" />
            <span className="font-semibold text-gray-900">格式译专家</span>
          </Link>
        </div>

                  <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={openAIChat}
              className="text-blue-600 hover:text-blue-700"
            >
              <Bot className="h-4 w-4 mr-2" />
              AI助手
            </Button>
            
            <Button variant="outline" size="sm" asChild>
              <Link href="/workspace" className="text-gray-600">
                <FileIcon className="h-4 w-4 mr-2" />
                返回工作台
              </Link>
            </Button>
            
            <span className="text-sm text-gray-600">AI驱动译文编辑器</span>
          </div>
      </div>

      {/* 标尺 - 当showRuler为true时显示 */}
      {showRuler && (
        <div className="bg-gray-100 border-b border-gray-300 h-8 flex items-center px-6">
          <div className="flex items-center w-full relative">
            {/* 标尺刻度 */}
            <div className="absolute inset-0 flex">
              {Array.from({ length: 20 }, (_, i) => (
                <div key={i} className="flex-1 border-r border-gray-400 relative">
                  <span className="absolute top-0 left-0 text-xs text-gray-600 pl-1">{i}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 主要内容区域 */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* AI聊天面板 - 可拖动和调整大小 */}
        {showAIChat && (
          <div
            ref={aiChatRef}
            className={cn(
              "fixed bg-white border border-gray-300 rounded-lg flex flex-col transition-all duration-300 z-20",
              isDragging && "shadow-2xl",
              aiChatSize === 'minimized' && "h-auto",
              aiChatSize === 'normal' && "h-[600px]",
              aiChatSize === 'maximized' && "h-[80vh]"
            )}
            style={{
              left: `${aiChatPosition.x}px`,
              top: `${aiChatPosition.y}px`,
              width: `${aiChatWidth}px`,
            }}
          >
            {/* 聊天头部 - 可拖动 */}
            <div 
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between rounded-t-lg cursor-move select-none"
              onMouseDown={handleDragStart}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">AI 助手</h3>
                  <p className="text-xs text-blue-100">随时为您提供帮助</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-white hover:bg-white/20"
                  onClick={() => setAIChatSize('minimized')}
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-white hover:bg-white/20"
                  onClick={() => setAIChatSize(aiChatSize === 'maximized' ? 'normal' : 'maximized')}
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-white hover:bg-white/20"
                  onClick={() => setShowAIChat(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* 聊天消息区域 */}
            {aiChatSize !== 'minimized' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    message.type === 'user' && "justify-end"
                  )}
                >
                  {message.type === 'ai' && (
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="h-5 w-5 text-blue-600" />
                    </div>
                  )}
                  <div className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-3",
                    message.type === 'user' 
                      ? "bg-blue-600 text-white" 
                      : "bg-white border border-gray-200"
                  )}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    {message.type === 'ai' && 
                     message.content.includes('请问您需要执行什么操作？') && 
                     chatMessages.findIndex(m => m.id === message.id) === chatMessages.findLastIndex(m => m.type === 'ai' && m.content.includes('请问您需要执行什么操作？')) && (
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        {aiOptions.map((option) => (
                          <Button
                            key={option.value}
                            variant="outline"
                            size="sm"
                            className="justify-start"
                            onClick={() => handleAIOption(option)}
                          >
                            <option.icon className="h-4 w-4 mr-2" />
                            {option.label}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                  {message.type === 'user' && (
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="h-5 w-5 text-gray-600" />
                    </div>
                  )}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            )}
            
            {/* 增强选项 */}
            {aiChatSize !== 'minimized' && (
            <div className="px-4 py-3 border-t border-gray-200 bg-white">
              <div className="flex gap-2">
                {enhancedOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={selectedEnhancedOptions.includes(option.value) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleEnhancedOption(option.value)}
                    className="flex-1"
                  >
                    <option.icon className="h-4 w-4 mr-1" />
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
            )}
            
            {/* 输入区域 */}
            {aiChatSize !== 'minimized' && (
            <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
              <div className="flex gap-2">
                <div className="relative">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-9 w-9 p-0"
                    onClick={() => setShowAttachMenu(!showAttachMenu)}
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                  {showAttachMenu && (
                    <div className="absolute bottom-12 left-0 bg-white rounded-lg shadow-lg border border-gray-200 p-2">
                      <Button variant="ghost" size="sm" className="w-full justify-start">
                        <Image className="h-4 w-4 mr-2" />
                        图片
                      </Button>
                      <Button variant="ghost" size="sm" className="w-full justify-start">
                        <Paperclip className="h-4 w-4 mr-2" />
                        文件
                      </Button>
                      <Button variant="ghost" size="sm" className="w-full justify-start">
                        <Mic className="h-4 w-4 mr-2" />
                        语音
                      </Button>
                    </div>
                  )}
                </div>
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                  placeholder="输入您的需求..."
                  className="flex-1"
                />
                <Button
                  size="sm"
                  onClick={() => sendMessage()}
                  disabled={!inputValue.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
            )}
            
            {/* 调整大小手柄 */}
            {aiChatSize !== 'minimized' && (
              <div
                className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize group"
                onMouseDown={handleResizeStart}
              >
                <div className="absolute right-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-blue-500/20 transition-colors" />
                <div className="absolute right-1 top-1/2 -translate-y-1/2 space-y-1">
                  <div className="w-1 h-1 bg-gray-400 rounded-full group-hover:bg-blue-500" />
                  <div className="w-1 h-1 bg-gray-400 rounded-full group-hover:bg-blue-500" />
                  <div className="w-1 h-1 bg-gray-400 rounded-full group-hover:bg-blue-500" />
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* 主编辑区域容器 */}
        <div className={cn(
          "flex-1 flex",
          showOriginal && "pr-0"
        )}>
          {/* 译文编辑区域 - 使用EditorCanvas替代textarea */}
          <div className="flex-1 bg-gray-100 flex flex-col overflow-y-auto">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Languages className="h-5 w-5" />
                译文编辑
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                使用上方工具栏进行格式化编辑
              </p>
            </div>
            
            <div className="flex-1 p-8 overflow-y-auto" onScroll={(e) => {
              const target = e.currentTarget
              const scrollProgress = target.scrollTop / (target.scrollHeight - target.clientHeight)
              handleEditorScroll(scrollProgress)
            }}>
              <EditorCanvas
                ref={editorRef}
                content={editableContent}
                onChange={(content) => {
                  setEditableContent(content)
                  if (isInitialized && saveStatus === 'saved') {
                    setSaveStatus('unsaved')
                  }
                }}
                onFormatStateChange={setFormatState}
                formatState={formatState}
                onClick={handleEditorClick}
              />
            </div>
          </div>
          
          {/* 原文对照侧边栏 */}
          <SideBySideReviewPanel
            originalContent={originalSentences}
            isOpen={showOriginal}
            onClose={() => setShowOriginal(false)}
            highlightedIndex={highlightedSentenceIndex}
            editorScrollProgress={editorScrollProgress}
            width={450}
            isPinned={isPanelPinned}
            onTogglePin={togglePanelPin}
          />
        </div>
        
        {/* 浮动工具栏 - 暂时隐藏，因为现在使用专业的格式化工具栏 */}
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
      
      {/* 添加高亮动画样式 */}
      <style jsx global>{`
        /* 自定义滚动条样式 */
        .scrollbar-thin {
          scrollbar-width: thin;
        }
        
        .scrollbar-thin::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-track {
          background: #f3f4f6;
          border-radius: 4px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 4px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
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
        
        /* 拖动时的鼠标样式 */
        body.dragging {
          cursor: move !important;
          user-select: none !important;
        }
        
        body.resizing {
          cursor: ew-resize !important;
          user-select: none !important;
        }
        
        /* 防止拖动时选中文本 */
        .no-select {
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
        }
        
        /* 选中但未确认的文本样式 */
        textarea::selection {
          background-color: rgba(59, 130, 246, 0.3);
        }
        
        /* 高亮效果的阴影 */
        .highlight-shadow {
          box-shadow: 0 0 0 2px rgba(251, 191, 36, 0.5);
        }
      `}</style>
    </div>
  )
}
