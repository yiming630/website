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
  ChevronRight,
  ChevronDown,
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

// AI助手功能分类选项
const aiAssistantCategories = [
  {
    title: "核心翻译优化",
    description: "专注于提升翻译文本本身的质量和准确性",
    icon: "🎯",
    options: [
      { label: "重新翻译", value: "retranslate", description: "使用不同的算法模型或措辞逻辑重新生成译文" },
      { label: "提供多种译文版本", value: "alternatives", description: "提供几个不同措辞或风格的译文版本供选择" },
      { label: "逐词/逐句对照", value: "alignment", description: "高亮显示原文和译文的对应关系" },
    ]
  },
  {
    title: "文本润色与风格调整",
    description: "改善译文的表达方式，使其更符合特定的语境和要求",
    icon: "✨",
    options: [
      { label: "更专业", value: "professional", description: "适用于商务邮件、报告等" },
      { label: "更口语化/友好", value: "casual", description: "适用于社交媒体、即时通讯等" },
      { label: "更学术", value: "academic", description: "适用于论文、研究性文章" },
      { label: "更具说服力", value: "persuasive", description: "适用于市场营销文案" },
      { label: "语法和拼写检查", value: "grammar_check", description: "自动检测并修正语法、拼写和标点问题" },
      { label: "简化内容", value: "simplify", description: "将复杂的长句或专业术语改写成更简单易懂的语言" },
      { label: "扩展内容", value: "elaborate", description: "增加更多细节、解释或示例，使内容更丰富" },
    ]
  },
  {
    title: "内容理解与信息提取",
    description: "帮助深入理解文本的内在含义",
    icon: "🧠",
    options: [
      { label: "提问", value: "ask_question", description: "向AI提问关于选中文字的任何问题" },
      { label: "总结摘要", value: "summarize", description: "快速提炼长篇译文的核心要点" },
      { label: "解释关键术语", value: "explain_terms", description: "解释专有名词、行业术语或俚语" },
      { label: "提取关键信息", value: "extract_info", description: "识别并提取人名、地名、日期、数据等关键信息" },
    ]
  },
  {
    title: "格式转换与内容再创作",
    description: "将翻译内容作为素材，进行二次创作和利用",
    icon: "🔄",
    options: [
      { label: "格式转换", value: "format_convert", description: "转换成列表、表格或大纲等格式" },
      { label: "续写或仿写", value: "continue_writing", description: "基于选中内容和风格继续创作" },
      { label: "生成回复", value: "generate_reply", description: "帮助起草邮件或消息的回复" },
    ]
  }
]

interface ChatMessage {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
  showCategories?: boolean // 是否显示功能分类选项
}

/**
 * 译文编辑器页面 - 左右分栏布局
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
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [selectedEnhancedOptions, setSelectedEnhancedOptions] = useState<string[]>([])
  const [showAttachMenu, setShowAttachMenu] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<number[]>([0, 1, 2, 3]) // 默认全部展开
  
  // 编辑历史
  const [history, setHistory] = useState<string[]>([editableContent])
  const [historyIndex, setHistoryIndex] = useState(0)
  
  // 引用
  const translatedTextRef = useRef<HTMLTextAreaElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const highlightedParagraphRef = useRef<HTMLParagraphElement>(null)
  const editorRef = useRef<EditorCanvasRef>(null)
  
  // 初始化状态
  const [isInitialized, setIsInitialized] = useState(false)
  
  // 计算字数和字符数
  const wordCount = editableContent.trim().split(/\s+/).length
  const charCount = editableContent.length

  useEffect(() => {
    setIsInitialized(true)
    // 初始化时添加欢迎消息
    if (chatMessages.length === 0) {
      setChatMessages([{
        id: Date.now().toString(),
        type: 'ai',
        content: '您好！我是您的AI助手。请问您需要什么帮助？您可以选择以下操作，或直接告诉我您的需求：',
        timestamp: new Date(),
        showCategories: true
      }])
    }
  }, [])

  useEffect(() => {
    // 自动滚动到最新消息
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])
  
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
   * 处理分类选项点击
   */
  const handleCategoryOption = (option: any, categoryTitle: string) => {
    // 构建更详细的请求消息
    const selectedText = window.getSelection()?.toString()
    const prefix = selectedText ? `针对选中的文本"${selectedText.substring(0, 50)}${selectedText.length > 50 ? '...' : ''}"，` : ''
    const message = `${prefix}请帮我进行【${categoryTitle}】中的【${option.label}】操作`
    
    sendMessage(message)
  }

  /**
   * 切换分类展开/折叠状态
   */
  const toggleCategoryExpanded = (index: number) => {
    setExpandedCategories(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    )
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

  // 所有的handler函数
  const handleNewDocument = () => console.log('New document')
  const handleOpenDocument = () => console.log('Open document')
  const handleSave = () => {
    setSaveStatus('saving')
    setTimeout(() => setSaveStatus('saved'), 1000)
  }
  const handleSaveAs = () => console.log('Save as')
  const handlePrint = () => console.log('Print')
  const handleShare = () => console.log('Share')
  const handleExport = () => console.log('Export')
  const handleFindReplace = () => console.log('Find and replace')
  const handleCut = () => document.execCommand('cut')
  const handleCopy = () => document.execCommand('copy')
  const handlePaste = () => document.execCommand('paste')
  const handleToggleRuler = () => setShowRuler(!showRuler)
  const handleToggleOriginalView = () => setShowOriginal(!showOriginal)
  const handleInsertImage = () => console.log('Insert image')
  const handleInsertTable = () => console.log('Insert table')
  const handleInsertLink = () => console.log('Insert link')
  const handleInsertSymbol = () => console.log('Insert symbol')
  const handleFormatText = () => console.log('Format text')
  const handleFormatParagraph = () => console.log('Format paragraph')
  const handleFormatStyles = () => console.log('Format styles')
  const handleBold = () => setFormatState(prev => ({ ...prev, isBold: !prev.isBold }))
  const handleItalic = () => setFormatState(prev => ({ ...prev, isItalic: !prev.isItalic }))
  const handleUnderline = () => setFormatState(prev => ({ ...prev, isUnderline: !prev.isUnderline }))
  const handleStrikethrough = () => setFormatState(prev => ({ ...prev, isStrikethrough: !prev.isStrikethrough }))
  const handleTextColor = (color: string) => setFormatState(prev => ({ ...prev, textColor: color }))
  const handleBackgroundColor = (color: string) => setFormatState(prev => ({ ...prev, backgroundColor: color }))
  const handleFontSize = (size: string) => setFormatState(prev => ({ ...prev, fontSize: size }))
  const handleFontFamily = (family: string) => setFormatState(prev => ({ ...prev, fontFamily: family }))
  const handleAlign = (align: 'left' | 'center' | 'right' | 'justify') => setFormatState(prev => ({ ...prev, alignment: align }))
  const handleBulletList = () => setFormatState(prev => ({ ...prev, isBulletList: !prev.isBulletList }))
  const handleNumberedList = () => setFormatState(prev => ({ ...prev, isNumberedList: !prev.isNumberedList }))
  const handleIndent = () => console.log('Indent')
  const handleOutdent = () => console.log('Outdent')
  const handleLineHeight = (height: string) => setFormatState(prev => ({ ...prev, lineHeight: height }))
  const togglePanelPin = () => setIsPanelPinned(!isPanelPinned)
  const handleEditorScroll = (progress: number) => setEditorScrollProgress(progress)
  const handleEditorClick = () => {}

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 顶部头部栏 */}
      <Header
        title={documentTitle}
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

      {/* 导航栏 - 简化版 */}
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

      {/* 主要内容区域 - 左右分栏布局 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧编辑器区域 - 70% */}
        <div className="flex-1 flex">
          {/* 主编辑区域容器 */}
          <div className={cn(
            "flex-1 flex",
            showOriginal && "pr-0"
          )}>
            {/* 译文编辑区域 - 使用EditorCanvas */}
            <div className="flex-1 bg-gray-100 flex flex-col overflow-y-auto">
              <div className="bg-gray-50 border-b border-gray-200" style={{ height: '73px', padding: '16px' }}>
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
        </div>

        {/* 右侧AI聊天区域 - 30% */}
        <div className="w-[30%] min-w-[400px] bg-white border-l border-gray-200 flex flex-col">
          {/* 聊天头部 - 调整高度与左侧对齐 */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white border-b border-blue-800 flex items-center justify-between" 
               style={{ height: '73px', padding: '16px' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">AI 助手</h3>
                <p className="text-xs text-blue-100 mt-1">随时为您提供帮助</p>
              </div>
            </div>
          </div>
          
          {/* 聊天消息区域 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {chatMessages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3 animate-fade-in",
                  message.type === 'user' && "justify-end"
                )}
              >
                {message.type === 'ai' && (
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="h-5 w-5 text-blue-600" />
                  </div>
                )}
                <div className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3",
                  message.type === 'user' 
                    ? "bg-blue-600 text-white" 
                    : "bg-white border border-gray-200"
                )}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  
                  {/* 显示AI助手功能分类选项 */}
                  {message.type === 'ai' && message.showCategories && (
                    <div className="mt-4 space-y-3">
                      {aiAssistantCategories.map((category, index) => {
                        const isExpanded = expandedCategories.includes(index)
                        return (
                          <div key={index} className="border border-gray-100 rounded-lg overflow-hidden bg-gray-50 hover:border-gray-200 transition-colors">
                            <button
                              onClick={() => toggleCategoryExpanded(index)}
                              className="w-full px-3 py-2.5 flex items-center gap-2 hover:bg-gray-100 transition-colors"
                            >
                              <span className="text-lg">{category.icon}</span>
                              <div className="flex-1 text-left">
                                <h4 className="font-semibold text-sm text-gray-900">{category.title}</h4>
                                {!isExpanded && (
                                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{category.description}</p>
                                )}
                              </div>
                              <ChevronDown className={cn(
                                "h-4 w-4 text-gray-400 transition-transform",
                                isExpanded && "rotate-180"
                              )} />
                            </button>
                            {isExpanded && (
                              <div className="px-3 pb-3">
                                <p className="text-xs text-gray-500 mb-2">{category.description}</p>
                                <div className="space-y-1">
                                  {category.options.map((option) => (
                                    <Button
                                      key={option.value}
                                      variant="ghost"
                                      size="sm"
                                      className="w-full justify-start text-left hover:bg-white group"
                                      onClick={() => handleCategoryOption(option, category.title)}
                                    >
                                      <ChevronRight className="h-3 w-3 mr-2 flex-shrink-0 text-gray-400 group-hover:text-gray-600" />
                                      <div className="flex-1">
                                        <div className="font-medium text-xs text-gray-700 group-hover:text-gray-900">{option.label}</div>
                                        <div className="text-xs text-gray-500 line-clamp-1">{option.description}</div>
                                      </div>
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                      
                      {/* 保留原有的快捷操作按钮 */}
                      <div className="border-t pt-3">
                        <p className="text-xs text-gray-500 mb-2">快捷操作：</p>
                        <div className="grid grid-cols-2 gap-2">
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
                      </div>
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
          
          {/* 增强选项 */}
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
          
          {/* 输入区域 */}
          <div className="p-4 border-t border-gray-200 bg-white">
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
        </div>
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
      `}</style>
    </div>
  )
}