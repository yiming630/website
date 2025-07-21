"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Mountain,
  FileIcon,
  X,
  Wand2,
  Paintbrush,
  Atom,
  Landmark,
  Briefcase,
  UploadCloud,
  ThumbsUp,
  ThumbsDown,
  Languages,
  FileText,
  FileDiff,
  Plus,
  Search,
  Settings,
  Download,
  Share2,
  RotateCcw,
  Trash2,
  Play,
  HelpCircle,
  Zap,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Crown,
  MessageCircle,
  Bell,
  TrendingUp,
  Award,
  Target,
  Lightbulb,
  Eye,
  MoreHorizontal,
  Pin,
  Edit,
  Edit3,
} from "lucide-react"
import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { useFile as useFileContext } from "@/context/file-context"
import type React from "react"

// 模拟历史翻译记录数据
const mockHistory = [
  {
    id: 1,
    title: "商业计划书_2024.pdf",
    sourceLanguage: "中文",
    targetLanguage: "英语",
    status: "completed",
    time: "5分钟前",
    pages: 15,
    size: "2.3 MB",
    category: "商业翻译",
  },
  {
    id: 2,
    title: "技术文档_API说明.docx",
    sourceLanguage: "英语",
    targetLanguage: "中文",
    status: "completed",
    time: "2小时前",
    pages: 8,
    size: "1.8 MB",
    category: "科技翻译",
  },
  {
    id: 3,
    title: "法律合同_保密协议.pdf",
    sourceLanguage: "英语",
    targetLanguage: "中文",
    status: "processing",
    time: "1天前",
    pages: 12,
    size: "0.9 MB",
    category: "法律翻译",
  },
  {
    id: 4,
    title: "学术论文_机器学习.pdf",
    sourceLanguage: "英语",
    targetLanguage: "中文",
    status: "completed",
    time: "3天前",
    pages: 25,
    size: "4.2 MB",
    category: "学术翻译",
  },
  {
    id: 5,
    title: "营销材料_产品手册.pptx",
    sourceLanguage: "中文",
    targetLanguage: "英语",
    status: "failed",
    time: "1周前",
    pages: 20,
    size: "5.1 MB",
    category: "营销翻译",
  },
]

// 翻译专业领域配置
const specializations = [
  {
    key: "tech_sci",
    title: "技术与科学领域",
    icon: Atom,
    description: "要求极高的准确性、术语统一和深厚的专业背景知识。",
    subCategories: [
      { key: "tech", title: "科技翻译", description: "IT、软件本地化、工程、电信、专利等。" },
      { key: "medical", title: "医学与生命科学翻译", description: "医药、医疗器械、学术论文、病历等。" },
    ],
  },
  {
    key: "legal_financial",
    title: "法律与金融领域",
    icon: Landmark,
    description: "对准确性的要求达到极致，任何偏差都可能导致严重后果。",
    subCategories: [
      { key: "legal", title: "法律翻译", description: "合同协议、司法文书、法规、认证公证等。" },
      { key: "financial", title: "金融翻译", description: "公司财报、投资证券、银行保险文件等。" },
    ],
  },
  {
    key: "creative_humanities",
    title: "创意与人文领域",
    icon: Paintbrush,
    description: "注重传达原文的风格、情感、文化内涵和艺术价值。",
    subCategories: [
      { key: "literary", title: "文学与影音翻译", description: "小说诗歌、戏剧、电影字幕、配音等。" },
      { key: "marketing", title: "营销与游戏本地化", description: "广告创译、品牌故事、游戏对话剧情等。" },
      { key: "humanities", title: "人文社科翻译", description: "历史、哲学、政治、新闻、教育等。" },
    ],
  },
  {
    key: "business_personal",
    title: "商业与个人领域",
    icon: Briefcase,
    description: "涵盖日常商业沟通和用于官方用途的个人文件。",
    subCategories: [
      { key: "business", title: "商业翻译", description: "内外部沟通、电子商务、市场报告等。" },
      { key: "personal", title: "个人文档翻译", description: "证件、证书、成绩单（通常需认证）。" },
    ],
  },
]

// 支持的文件格式
const supportedFormats = ["pdf", "docx", "epub", "txt", "mobi", "azw"]
const supportedMimeTypes = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/epub+zip",
  "text/plain",
  "application/x-mobipocket-ebook",
  "application/vnd.amazon.ebook",
]

// 翻译处理步骤模拟 - 更新为新的四个步骤
const translationSteps = [
  { status: "文档分割中...", duration: 2000 },
  { status: "提交给AI翻译...", duration: 3000 },
  { status: "文档整合中...", duration: 2500 },
  { status: "自动排版与优化...", duration: 2000 },
]

// 翻译风格预设
const translationStyles = [
  { key: "general", title: "通用", description: "适合大多数文档的标准翻译风格" },
  { key: "academic", title: "学术", description: "严谨的学术论文翻译风格" },
  { key: "business", title: "商务", description: "正式的商务文档翻译风格" },
]

/**
 * 工作台页面主组件
 * 包含左侧项目列表、中央工作区和右侧用户面板
 */
export default function WorkspacePage() {
  // 文件相关状态
  const { file: contextFile, setFile: setContextFile } = useFileContext()
  const [file, setFile] = useState<File | null>(contextFile)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 翻译流程状态
  const [pageState, setPageState] = useState("configuring") // configuring | translating | completed
  const [translationProgress, setTranslationProgress] = useState(0)
  const [translationStatus, setTranslationStatus] = useState("")
  const [conversionCompleted, setConversionCompleted] = useState(false) // 转换完成状态


  // 翻译配置状态
  const [selectedMajorCategory, setSelectedMajorCategory] = useState<string | null>(null)
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null)
  const [showSubCategories, setShowSubCategories] = useState(false)
  const [sourceLanguage, setSourceLanguage] = useState("auto")
  const [targetLanguage, setTargetLanguage] = useState("zh-cn")
  const [outputFormat, setOutputFormat] = useState("docx")
  const [translationStyle, setTranslationStyle] = useState("general")

  // UI 交互状态
  const [feedback, setFeedback] = useState<"good" | "bad" | null>(null)
  const [showFeedbackInput, setShowFeedbackInput] = useState(false)
  const [previewMode, setPreviewMode] = useState<"side-by-side" | "single">("side-by-side")
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [centerState, setCenterState] = useState<"welcome" | "dashboard" | "task-detail" | "new-translation">("welcome")
  const [openDropdown, setOpenDropdown] = useState<number | null>(null)
  const [isHovered, setIsHovered] = useState(false) // 控制右侧面板的悬停状态
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null) // 用于延迟隐藏面板的定时器

  // 模拟用户数据
  const [userData] = useState({
    name: "用户",
    plan: "免费体验版",
    usedQuota: 7500,
    totalQuota: 10000,
    tasksCompleted: 25,
    wordsTranslated: 80000,
    timeSaved: 12,
  })

  // 监听全局文件状态变化
  useEffect(() => {
    if (contextFile) {
      handleFileSelect(contextFile)
    }
  }, [contextFile])

  // 根据当前状态决定中央面板显示内容
  useEffect(() => {
    if (file && pageState === "configuring") {
      setCenterState("new-translation")
    } else if (selectedTask) {
      setCenterState("task-detail")
    } else if (mockHistory.length > 0) {
      setCenterState("dashboard")
    } else {
      setCenterState("welcome")
    }
  }, [file, pageState, selectedTask, mockHistory.length])

  /**
   * 处理文件选择
   * 验证文件格式并设置相关状态
   */
  const handleFileSelect = (selectedFile: File | null) => {
    if (!selectedFile) return

    // 验证文件格式
    const fileExtension = selectedFile.name.split(".").pop()?.toLowerCase()
    if (
      !fileExtension ||
      !supportedFormats.includes(fileExtension) ||
      !supportedMimeTypes.includes(selectedFile.type)
    ) {
      setError("对不起，但是我们正在努力研发，后期会更新支持上传新的格式！")
      setFile(null)
      setContextFile(null)
      return
    }

    // 重置所有状态
    setError(null)
    setFile(selectedFile)
    setContextFile(selectedFile)
    setPageState("configuring")
    setTranslationProgress(0)
    setSelectedMajorCategory(null)
    setSelectedSubCategory(null)
    setShowSubCategories(false)
    setFeedback(null)
    setShowFeedbackInput(false)
    setSelectedTask(null)
    setConversionCompleted(false)
  }

  // 文件输入事件处理
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files?.[0] || null)
  }

  // 拖拽事件处理
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault()
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    handleFileSelect(e.dataTransfer.files?.[0] || null)
  }

  /**
   * 处理主要类别选择
   * 显示子类别选项
   */
  const handleMajorCategorySelect = (key: string) => {
    setSelectedMajorCategory(key)
    setSelectedSubCategory(null)
    setShowSubCategories(true)
  }

  /**
   * 开始翻译处理
   * 验证配置并启动翻译流程
   */
  const handleStartTranslation = () => {
    if (!selectedSubCategory) {
      alert("请选择一个细分翻译领域！")
      return
    }
    setPageState("translating")
  }

  // 翻译进度模拟 - 更新为包含转换步骤
  useEffect(() => {
    if (pageState === "translating") {
      let currentStepIndex = 0
      let progress = 0
      const totalDuration = translationSteps.reduce((acc, step) => acc + step.duration, 0)

      const runStep = () => {
        if (currentStepIndex >= translationSteps.length) {
          setTranslationProgress(100)
          setTranslationStatus("翻译完成！")
          setTimeout(() => setPageState("completed"), 500)
          return
        }

        const currentStep = translationSteps[currentStepIndex]
        setTranslationStatus(currentStep.status)

        // 检查是否到达转换完成步骤
        if (currentStep.status === "转换为DOCX格式..." && !conversionCompleted) {
          setTimeout(() => {
            setConversionCompleted(true)
          }, currentStep.duration - 500)
        }

        const stepProgress = (currentStep.duration / totalDuration) * 100
        progress += stepProgress
        setTranslationProgress(Math.min(progress, 100))

        setTimeout(() => {
          currentStepIndex++
          runStep()
        }, currentStep.duration)
      }

      runStep()
    }
  }, [pageState, conversionCompleted])

  /**
   * 重置所有状态
   * 清理文件和翻译相关状态
   */
  const resetAll = () => {
    setFile(null)
    setContextFile(null)
    setPageState("configuring")
    setTranslationProgress(0)
    setSelectedMajorCategory(null)
    setSelectedSubCategory(null)
    setShowSubCategories(false)
    setFeedback(null)
    setShowFeedbackInput(false)
    setError(null)
    setSelectedTask(null)
    setConversionCompleted(false)
  }

  /**
   * 获取状态图标
   * 根据任务状态返回对应的图标组件
   */
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      case "processing":
        return <AlertCircle className="h-4 w-4 text-blue-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  /**
   * 获取状态文本
   * 根据状态返回中文描述
   */
  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "已完成"
      case "processing":
        return "处理中"
      case "failed":
        return "失败"
      default:
        return "未知"
    }
  }

  // 过滤历史记录
  const filteredHistory = mockHistory.filter((item) => item.title.toLowerCase().includes(searchTerm.toLowerCase()))

  /**
   * 渲染左侧项目面板
   * 包含项目列表、搜索和操作菜单
   */
  const renderLeftPanel = () => (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* 头部 */}
      <div className="p-4 border-b border-gray-200">
        <Link href="/" className="flex items-center gap-2 mb-4">
          <Mountain className="h-6 w-6 text-blue-600" />
          <span className="font-semibold text-gray-900">格式译专家</span>
        </Link>
        <Button
          onClick={() => {
            resetAll()
            setCenterState("new-translation")
          }}
          className="w-full justify-start gap-2 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4" />
          新建翻译
        </Button>
      </div>

      {/* 居中标题 */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900 text-center">历史项目管理</h3>
      </div>

      {/* 搜索框 */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="搜索翻译记录"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* 任务列表 */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">暂无翻译记录</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredHistory.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "p-3 rounded-lg cursor-pointer transition-all duration-200 group relative",
                    selectedTask?.id === item.id
                      ? "bg-blue-50 border border-blue-200"
                      : "hover:bg-gray-50 border border-transparent",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0" onClick={() => setSelectedTask(item)}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileIcon className="h-4 w-4 text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate group-hover:text-blue-600 transition-colors">
                            {item.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {getStatusIcon(item.status)}
                            <span className="text-xs text-gray-500">{getStatusText(item.status)}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                            <span>
                              {item.sourceLanguage} → {item.targetLanguage}
                            </span>
                            <span>•</span>
                            <span>{item.time}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 三点菜单 */}
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpenDropdown(openDropdown === item.id ? null : item.id)
                        }}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>

                      {/* 下拉菜单 */}
                      {openDropdown === item.id && (
                        <div className="absolute right-0 top-8 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1">
                          <button
                            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            onClick={(e) => {
                              e.stopPropagation()
                              setOpenDropdown(null)
                              // 处理分享操作
                            }}
                          >
                            <Share2 className="h-3 w-3" />
                            分享
                          </button>
                          <button
                            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            onClick={(e) => {
                              e.stopPropagation()
                              setOpenDropdown(null)
                              // 处理置顶操作
                            }}
                          >
                            <Pin className="h-3 w-3" />
                            置顶
                          </button>
                          <button
                            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            onClick={(e) => {
                              e.stopPropagation()
                              setOpenDropdown(null)
                              // 处理重命名操作
                            }}
                          >
                            <Edit className="h-3 w-3" />
                            重命名
                          </button>
                          <button
                            className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            onClick={(e) => {
                              e.stopPropagation()
                              setOpenDropdown(null)
                              // 处理删除操作
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                            删除
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  /**
   * 渲染右侧用户面板
   * 浮动头像和悬停显示的用户信息面板
   */
  const renderRightPanel = () => {
    // 鼠标进入头像区域，清除定时器并显示面板
    const handleAvatarMouseEnter = () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
      setIsHovered(true)
    }

    // 鼠标离开头像区域，设置定时器延迟隐藏面板
    const handleAvatarMouseLeave = () => {
      hoverTimeoutRef.current = setTimeout(() => {
        setIsHovered(false)
      }, 200) // 200ms 延迟，给鼠标移动到面板的时间
    }

    // 鼠标进入面板区域，清除定时器，保持面板显示
    const handlePanelMouseEnter = () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    }

    // 鼠标离开面板区域，立即隐藏面板
    const handlePanelMouseLeave = () => {
      setIsHovered(false)
    }

    return (
      <div className="relative">
        {/* 浮动头像和悬停面板的共同容器 */}
        <div
          className="fixed top-4 right-4 z-50"
          onMouseEnter={handleAvatarMouseEnter}
          onMouseLeave={handleAvatarMouseLeave}
        >
          <Avatar className="h-10 w-10 cursor-pointer border-2 border-white shadow-lg">
            <AvatarImage src="/placeholder.svg?height=40&width=40" />
            <AvatarFallback className="bg-blue-100 text-blue-600">用</AvatarFallback>
          </Avatar>

          {/* 悬停面板 */}
          {isHovered && (
            <div
              className="absolute top-12 right-0 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50 animate-in fade-in-0 slide-in-from-top-2 duration-200"
              onMouseEnter={handlePanelMouseEnter} // 鼠标进入面板时，保持显示
              onMouseLeave={handlePanelMouseLeave} // 鼠标离开面板时，隐藏
            >
              {/* 账户状态和使用情况 */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder.svg?height=32&width=32" />
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">用</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">欢迎，{userData.name}</p>
                    <p className="text-xs text-gray-500">{userData.plan}</p>
                  </div>
                  <Crown className="h-4 w-4 text-yellow-500" />
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-600">本月免费额度</span>
                      <span className="text-xs text-gray-900 font-medium">
                        {userData.usedQuota.toLocaleString()} / {userData.totalQuota.toLocaleString()} 字
                      </span>
                    </div>
                    <Progress value={(userData.usedQuota / userData.totalQuota) * 100} className="h-2" />
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-blue-600 border-blue-200 hover:bg-blue-50 bg-transparent"
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    升级套餐
                  </Button>
                </div>
              </div>

              {/* 帮助与支持 */}
              <div className="p-4 space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">帮助与支持</h3>
                  <div className="space-y-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-gray-600 hover:text-gray-900"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      快速入门指南
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-gray-600 hover:text-gray-900"
                    >
                      <HelpCircle className="h-4 w-4 mr-2" />
                      常见问题
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-gray-600 hover:text-gray-900"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      联系客服
                    </Button>
                  </div>
                </div>

                {/* 新功能提示 */}
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Bell className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">新功能</span>
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  </div>
                  <p className="text-xs text-blue-700">现在支持PowerPoint翻译，完美保留动画效果！</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  /**
   * 渲染中央面板
   * 根据当前状态显示不同的内容
   */
  const renderCenterPanel = () => {
    // 翻译进行中状态
    if (pageState === "translating") {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="w-full max-w-2xl p-8 bg-white rounded-lg shadow-lg">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">正在为您处理文档...</h2>

              {/* 类似 Vercel 的流式输出显示 */}
              <div className="bg-gray-900 rounded-lg p-6 mb-8 font-mono text-left text-sm text-gray-300">
                <div className="space-y-2">
                  {translationSteps
                    .slice(0, Math.floor((translationProgress / 100) * translationSteps.length))
                    .map((step, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="text-emerald-400">✓</span>
                        <span>{step.status}</span>
                      </div>
                    ))}
                  {translationProgress < 100 && (
                    <div className="flex items-center gap-2 text-blue-400">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      <span>{translationStatus}</span>
                    </div>
                  )}
                </div>
              </div>



              {/* 进度条 */}
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                <div
                  className="bg-gradient-to-r from-blue-500 to-emerald-500 h-2.5 rounded-full transition-all duration-1000 ease-linear"
                  style={{ width: `${translationProgress}%` }}
                ></div>
              </div>
              <p className="text-gray-600">{Math.round(translationProgress)}% 完成</p>
            </div>
          </div>
        </div>
      )
    }

    // 翻译完成状态 - 重新设计的界面
    if (pageState === "completed") {
      return (
        <div className="p-6 h-full overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            {/* 操作面板 - 放在页面上方 */}
            <Card className="mb-6 bg-white border-gray-200">
              <CardContent className="p-6">
                <div className="flex flex-wrap gap-4 items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileIcon className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="font-semibold text-gray-900">{file?.name}</p>
                      <p className="text-sm text-gray-500">
                        翻译完成 • {file && `${(file.size / 1024 / 1024).toFixed(2)} MB`}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">


                    {/* 预览模式切换 */}
                    <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                      <Button
                        variant={previewMode === "side-by-side" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setPreviewMode("side-by-side")}
                        className="h-8"
                      >
                        <FileDiff className="w-4 h-4 mr-1" />
                        对照
                      </Button>
                      <Button
                        variant={previewMode === "single" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setPreviewMode("single")}
                        className="h-8"
                      >
                        <FileText className="w-4 h-4 mr-1" />
                        单页
                      </Button>
                    </div>

                    {/* 翻译质量反馈 */}
                    <div className="flex gap-1">
                      <Button
                        variant={feedback === "good" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => {
                          setFeedback("good")
                          setShowFeedbackInput(false)
                        }}
                      >
                        <ThumbsUp className="w-4 h-4 mr-1" />
                        好评
                      </Button>
                      <Button
                        variant={feedback === "bad" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => {
                          setFeedback("bad")
                          setShowFeedbackInput(true)
                        }}
                      >
                        <ThumbsDown className="w-4 h-4 mr-1" />
                        差评
                      </Button>
                    </div>

                    {/* 返回并重新翻译 */}
                    <Button variant="outline" size="sm" onClick={() => setPageState("configuring")}>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      重新翻译
                    </Button>

                    {/* 对译文进行操作 */}
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/translate-editor">
                        <Edit3 className="w-4 h-4 mr-2" />
                        编辑译文
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* 反馈输入框 */}
                {showFeedbackInput && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <Textarea placeholder="请告诉我们哪里需要改进..." className="mb-3" />
                    <Button size="sm">提交反馈</Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 预览区域 - 占据页面下方全部空间 */}
            <div className="flex-1">
              <div
                className={cn(
                  "grid gap-6 h-[calc(100vh-280px)]",
                  previewMode === "side-by-side" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1",
                )}
              >
                {/* 原文预览 */}
                <div
                  className={cn(
                    "bg-gray-50 rounded-lg border border-gray-200 p-6",
                    previewMode === "single" && "hidden lg:block",
                  )}
                >
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    原文预览
                  </h4>
                  <div className="w-full h-full bg-white rounded-lg border border-gray-200 p-4 overflow-y-auto">
                    <div className="text-gray-600 leading-relaxed">
                      <p className="mb-4">这里显示原文档的内容...</p>
                      <p className="mb-4">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut
                        labore et dolore magna aliqua.
                      </p>
                      <p className="mb-4">
                        Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
                        consequat.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 译文预览 */}
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Languages className="h-5 w-5" />
                    译文预览
                  </h4>
                  <div className="w-full h-full bg-white rounded-lg border border-gray-200 p-4 overflow-y-auto">
                    <div className="text-gray-600 leading-relaxed">
                      <p className="mb-4">这里显示翻译后的内容...</p>
                      <p className="mb-4">这是一段示例文本，展示翻译后的效果。文档的格式和布局都得到了完美的保持。</p>
                      <p className="mb-4">翻译质量经过AI优化，确保准确性和流畅性。</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // 根据中央状态渲染不同内容
    switch (centerState) {
      case "welcome":
        // 欢迎页面
        return (
          <div className="flex items-center justify-center h-full p-8">
            <div className="max-w-2xl text-center">
              <div className="mb-8">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wand2 className="w-10 h-10 text-blue-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">欢迎您，{userData.name}！</h1>
                <p className="text-lg text-gray-600">准备好体验前所未有的文档翻译了吗？</p>
              </div>

              {/* 使用步骤说明 */}
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <UploadCloud className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">上传文档</h3>
                  <p className="text-sm text-gray-600">从右侧拖入您的第一个文件</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Settings className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">配置翻译</h3>
                  <p className="text-sm text-gray-600">选择目标语言和专业领域</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Download className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">下载成品</h3>
                  <p className="text-sm text-gray-600">预览并下载格式完美的译文</p>
                </div>
              </div>

              {/* 快速入门提示 */}
              <Card className="bg-blue-50 border-blue-200 p-6">
                <div className="flex items-center gap-4">
                  <Play className="w-8 h-8 text-blue-600 flex-shrink-0" />
                  <div className="text-left">
                    <h3 className="font-semibold text-blue-900 mb-1">观看2分钟视频，快速上手</h3>
                    <p className="text-sm text-blue-700">了解如何充分利用格式译专家的强大功能</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )

      case "dashboard":
        // 工作台仪表板
        return (
          <div className="p-8 h-full overflow-y-auto">
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">欢迎回来，{userData.name}！</h1>
                <p className="text-gray-600">这里是您的翻译工作中心</p>
              </div>

              {/* 快速上传区域 */}
              <Card className="mb-8 bg-blue-50 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <UploadCloud className="w-8 h-8 text-blue-600" />
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">快速上传</h2>
                      <p className="text-gray-600">拖拽文件到此处，或点击选择文件开始翻译</p>
                    </div>
                  </div>
                  <div
                    className="relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer bg-blue-50 hover:bg-blue-100 transition-colors group"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    <UploadCloud className="w-12 h-12 text-blue-400 mb-4 group-hover:text-blue-500 transition-colors" />
                    <p className="text-lg font-semibold text-blue-700 mb-2">拖拽文件到此处，或点击上传</p>
                    <p className="text-sm text-blue-500">支持 PDF, DOCX, EPUB, TXT, MOBI, AZW 格式</p>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      accept={supportedMimeTypes.join(",")}
                    />
                  </div>
                  {error && (
                    <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-lg">
                      <p className="text-red-700 text-center">{error}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 效率看板 */}
              <Card className="mb-8 bg-gradient-to-r from-blue-50 to-emerald-50 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <TrendingUp className="w-8 h-8 text-blue-600" />
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">效率看板</h2>
                      <p className="text-gray-600">您的翻译成就一览</p>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600 mb-1">{userData.tasksCompleted}</div>
                      <div className="text-sm text-gray-600">份文档已翻译</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-600 mb-1">
                        {userData.wordsTranslated.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">字符已处理</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600 mb-1">{userData.timeSaved}</div>
                      <div className="text-sm text-gray-600">小时时间节省</div>
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-white rounded-lg border border-blue-200">
                    <p className="text-sm text-gray-700">
                      <strong>上个月</strong>，我们为您翻译了 <strong>{userData.tasksCompleted} 份文档</strong>，
                      累计处理 <strong>{userData.wordsTranslated.toLocaleString()} 字符</strong>， 预估为您节省了约{" "}
                      <strong>{userData.timeSaved} 小时</strong> 的人工排版时间。
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* 专业提示 */}
              <Card className="mb-8 bg-yellow-50 border-yellow-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Lightbulb className="w-6 h-6 text-yellow-600" />
                    <h3 className="font-semibold text-yellow-900">专业提示</h3>
                  </div>
                  <p className="text-yellow-800">
                    <strong>小技巧：</strong>您知道吗？翻译PPT时，我们会完整保留您的演讲者备注和动画效果。
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )

      case "task-detail":
        // 任务详情页面
        if (!selectedTask) return null
        return (
          <div className="p-6 h-full overflow-y-auto">
            <div className="max-w-6xl mx-auto">
              {/* 任务头部 */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedTask(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ← 返回
                  </Button>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{selectedTask.title}</h1>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span>
                        {selectedTask.sourceLanguage} → {selectedTask.targetLanguage}
                      </span>
                      <span>•</span>
                      <span>{selectedTask.pages} 页</span>
                      <span>•</span>
                      <span>{selectedTask.size}</span>
                      <span>•</span>
                      <span>{selectedTask.time}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(selectedTask.status)}
                  <span className="text-sm font-medium">{getStatusText(selectedTask.status)}</span>
                </div>
              </div>

              {/* 任务操作按钮 */}
              <div className="flex flex-wrap gap-3 mb-6">

                <Button variant="outline">
                  <Share2 className="w-4 h-4 mr-2" />
                  分享
                </Button>
                <Button variant="outline">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  重新翻译
                </Button>
                <Button variant="outline">
                  <Eye className="w-4 h-4 mr-2" />
                  预览
                </Button>
                <Button variant="outline" className="text-red-600 hover:text-red-700 bg-transparent">
                  <Trash2 className="w-4 h-4 mr-2" />
                  删除
                </Button>
              </div>

              {/* 任务元数据 */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4 text-center">
                    <FileText className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                    <div className="text-sm text-gray-600">页数</div>
                    <div className="text-lg font-semibold text-gray-900">{selectedTask.pages}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Languages className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                    <div className="text-sm text-gray-600">翻译方向</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {selectedTask.sourceLanguage} → {selectedTask.targetLanguage}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Target className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                    <div className="text-sm text-gray-600">专业领域</div>
                    <div className="text-lg font-semibold text-gray-900">{selectedTask.category}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Award className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                    <div className="text-sm text-gray-600">文件大小</div>
                    <div className="text-lg font-semibold text-gray-900">{selectedTask.size}</div>
                  </CardContent>
                </Card>
              </div>

              {/* 预览区域 */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>文档预览</CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant={previewMode === "side-by-side" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setPreviewMode("side-by-side")}
                      >
                        <FileDiff className="w-4 h-4 mr-2" />
                        对照模式
                      </Button>
                      <Button
                        variant={previewMode === "single" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setPreviewMode("single")}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        单页模式
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div
                    className={cn(
                      "grid gap-4 h-96",
                      previewMode === "side-by-side" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1",
                    )}
                  >
                    <div
                      className={cn(
                        "bg-gray-50 rounded-lg border border-gray-200 p-4",
                        previewMode === "single" && "hidden lg:block",
                      )}
                    >
                      <h4 className="font-semibold text-gray-900 mb-2">原文</h4>
                      <div className="w-full h-full bg-white rounded flex items-center justify-center text-gray-400 border border-gray-200">
                        原文文档预览区
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">译文</h4>
                      <div className="w-full h-full bg-white rounded flex items-center justify-center text-gray-400 border border-gray-200">
                        译文文档预览区
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )

      case "new-translation":
        // 新翻译配置页面
        return (
          <div className="p-6 h-full overflow-y-auto">
            <div className="max-w-4xl mx-auto">
              {/* 文件信息显示 */}
              {file && (
                <div className="bg-gray-50 p-4 rounded-lg mb-8 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileIcon className="h-6 w-6 text-blue-500" />
                      <div>
                        <p className="font-semibold text-gray-900">{file.name}</p>
                        <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={resetAll}
                      className="text-gray-500 hover:text-gray-800 hover:bg-gray-200"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-8">
                {/* 语言选择 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-lg font-medium text-gray-900 flex items-center gap-2">
                      <Languages className="w-5 h-5" /> 源语言
                    </label>
                    <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
                      <SelectTrigger className="w-full bg-white text-black border-gray-300 rounded-md h-12 text-base">
                        <SelectValue placeholder="选择语言" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">自动检测</SelectItem>
                        <SelectItem value="en">英语</SelectItem>
                        <SelectItem value="zh-cn">简体中文</SelectItem>
                        <SelectItem value="zh-tw">繁体中文</SelectItem>
                        <SelectItem value="ja">日语</SelectItem>
                        <SelectItem value="ko">韩语</SelectItem>
                        <SelectItem value="fr">法语</SelectItem>
                        <SelectItem value="de">德语</SelectItem>
                        <SelectItem value="es">西班牙语</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-lg font-medium text-gray-900 flex items-center gap-2">
                      <Languages className="w-5 h-5" /> 目标语言
                    </label>
                    <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                      <SelectTrigger className="w-full bg-white text-black border-gray-300 rounded-md h-12 text-base">
                        <SelectValue placeholder="选择语言" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="zh-cn">简体中文</SelectItem>
                        <SelectItem value="en">英语</SelectItem>
                        <SelectItem value="zh-tw">繁体中文</SelectItem>
                        <SelectItem value="ja">日语</SelectItem>
                        <SelectItem value="ko">韩语</SelectItem>
                        <SelectItem value="fr">法语</SelectItem>
                        <SelectItem value="de">德语</SelectItem>
                        <SelectItem value="es">西班牙语</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* 翻译风格选择 */}
                <div className="space-y-4">
                  <label className="text-lg font-medium text-gray-900">翻译风格</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {translationStyles.map((style) => (
                      <Card
                        key={style.key}
                        className={cn(
                          "p-4 cursor-pointer transition-all duration-300 bg-white border-gray-200 hover:bg-gray-50 hover:shadow-md",
                          translationStyle === style.key ? "ring-2 ring-blue-500 shadow-md" : "",
                        )}
                        onClick={() => setTranslationStyle(style.key)}
                      >
                        <p className="font-semibold text-gray-900">{style.title}</p>
                        <p className="text-xs text-gray-500 mt-1">{style.description}</p>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* 专业领域选择 */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">选择翻译领域</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {specializations.map((major) => (
                      <Card
                        key={major.key}
                        className={cn(
                          "p-4 text-center cursor-pointer transition-all duration-300 bg-white hover:shadow-md hover:-translate-y-1 group",
                          selectedMajorCategory === major.key
                            ? "ring-2 ring-blue-500 shadow-md -translate-y-1"
                            : "ring-1 ring-gray-200",
                        )}
                        onClick={() => handleMajorCategorySelect(major.key)}
                      >
                        <major.icon
                          className={cn(
                            "h-8 w-8 mx-auto mb-3 text-gray-400 transition-colors duration-300",
                            selectedMajorCategory === major.key ? "text-blue-500" : "group-hover:text-gray-600",
                          )}
                        />
                        <p
                          className={cn(
                            "font-medium text-gray-600 transition-colors duration-300 text-sm",
                            selectedMajorCategory === major.key ? "text-gray-900" : "group-hover:text-gray-800",
                          )}
                        >
                          {major.title}
                        </p>
                      </Card>
                    ))}
                  </div>

                  {/* 子类别选择 */}
                  {showSubCategories && (
                    <div className="animate-in fade-in-50 duration-500">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">选择细分领域</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {specializations
                          .find((s) => s.key === selectedMajorCategory)
                          ?.subCategories.map((sub) => (
                            <Card
                              key={sub.key}
                              className={cn(
                                "p-4 cursor-pointer transition-all duration-300 bg-white border-gray-200 hover:bg-gray-50 hover:shadow-md",
                                selectedSubCategory === sub.key ? "ring-2 ring-blue-500 shadow-md" : "",
                              )}
                              onClick={() => setSelectedSubCategory(sub.key)}
                            >
                              <p className="font-semibold text-gray-900">{sub.title}</p>
                              <p className="text-xs text-gray-500 mt-1">{sub.description}</p>
                            </Card>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 输出格式选择 */}
                <div className="space-y-2">
                  <label className="text-lg font-medium text-gray-900">输出格式</label>
                  <Select value={outputFormat} onValueChange={setOutputFormat}>
                    <SelectTrigger className="w-full bg-white text-black border-gray-300 rounded-md h-12 text-base">
                      <SelectValue placeholder="选择格式" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="docx">Word (.docx)</SelectItem>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="epub">EPUB</SelectItem>
                      <SelectItem value="mobi">MOBI</SelectItem>
                      <SelectItem value="azw">AZW</SelectItem>
                      <SelectItem value="txt">Text (.txt)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 开始翻译按钮 */}
                <div className="text-center pt-6">
                  <Button
                    size="lg"
                    onClick={handleStartTranslation}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-transform transform hover:scale-105"
                    disabled={!selectedSubCategory}
                  >
                    <Wand2 className="mr-2 h-5 w-5" />
                    开始翻译
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  // 主布局渲染
  return (
    <div className="flex h-screen bg-gray-100">
      {renderLeftPanel()}
      <div className="flex-1 bg-white">{renderCenterPanel()}</div>
      {renderRightPanel()}
    </div>
  )
}
