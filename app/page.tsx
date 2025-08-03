"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Mountain, FileText, ArrowRight, ChevronDown, FileIcon, Sparkles, Brain, Database } from "lucide-react"
import Link from "next/link"
import { useState, useRef } from "react"
import { useFile as useFileContext } from "@/context/file-context"
import { useRouter } from "next/navigation"

/**
 * PDF 上传系统组件
 * 处理文件上传、处理进度显示和结果展示的完整流程
 */
function PDFUploadSystem() {
  // 上传状态：idle(空闲) -> uploading(上传中) -> processing(处理中) -> completed(完成)
  const [uploadState, setUploadState] = useState("idle")
  const [file, setFile] = useState(null) // 当前文件
  const [progress, setProgress] = useState(0) // 上传进度
  const [pdfInfo, setPdfInfo] = useState(null) // PDF 信息
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null) // 预览 URL
  const fileInputRef = useRef(null) // 文件输入引用
  const { setFile: setGlobalFile } = useFileContext() // 全局文件状态
  const router = useRouter()

  /**
   * 处理文件选择
   * 模拟文件上传和处理过程
   */
  const handleFileSelect = async (selectedFile) => {
    // 只处理 PDF 文件
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile)
      setGlobalFile(selectedFile)
      setUploadState("uploading")

      // 模拟上传进度
      for (let i = 0; i <= 100; i += 10) {
        setProgress(i)
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      setUploadState("processing")

      // 模拟文档解析时间
      await new Promise((resolve) => setTimeout(resolve, 2500))

      // 跳转到工作区
      router.push('/workspace')
    }
  }

  // 拖拽事件处理
  const handleDrop = (e) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) handleFileSelect(droppedFile)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  /**
   * 重置上传状态
   * 清理所有相关状态和 URL
   */
  const resetUpload = () => {
    setUploadState("idle")
    setFile(null)
    setGlobalFile(null)
    setProgress(0)
    setPdfInfo(null)
    if (pdfPreviewUrl) {
      URL.revokeObjectURL(pdfPreviewUrl) // 释放内存
      setPdfPreviewUrl(null)
    }
  }

  // 根据不同状态渲染不同的界面
  if (uploadState === "idle") {
    // 初始状态：显示开始按钮
    return (
      <div className="w-full max-w-4xl mx-auto text-center">
        <Button
          size="lg"
          className="bg-white text-slate-900 hover:bg-slate-100 font-bold py-3 px-8 rounded-lg text-lg transition-transform transform hover:scale-105 shadow-lg"
          asChild
        >
          <Link href="/workspace">立即免费试用</Link>
        </Button>
      </div>
    )
  }

  if (uploadState === "uploading") {
    // 上传状态：显示进度条和动画
    return (
      <div className="w-full max-w-4xl mx-auto bg-slate-800/20 rounded-2xl p-8 border border-slate-700 backdrop-blur-sm">
        <div className="text-center">
          {/* 旋转加载动画 */}
          <div className="w-20 h-20 mx-auto mb-6 relative">
            <div className="w-20 h-20 border-4 border-slate-700/30 rounded-full"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-emerald-500 rounded-full animate-spin"></div>
            <div className="absolute inset-2 w-16 h-16 border-2 border-transparent border-t-emerald-400/60 rounded-full animate-spin animation-delay-150"></div>
          </div>
          <h3 className="text-2xl font-semibold text-white mb-2">正在上传文档</h3>
          <p className="text-slate-400 mb-6">请稍候，正在安全传输您的文件...</p>

          {/* 进度条 */}
          <div className="w-full max-w-md mx-auto bg-slate-700/50 rounded-full h-3 mb-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-3 rounded-full transition-all duration-500 ease-out relative overflow-hidden"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
            </div>
          </div>
          <p className="text-emerald-400 font-medium">{progress}% 完成</p>
        </div>
      </div>
    )
  }

  if (uploadState === "processing") {
    // 处理状态：显示 AI 分析步骤
    return (
      <div className="w-full max-w-4xl mx-auto bg-slate-800/20 rounded-2xl p-8 border border-slate-700 backdrop-blur-sm">
        <div className="text-center">
          {/* 处理动画 */}
          <div className="w-20 h-20 mx-auto mb-6 relative">
            <div className="w-20 h-20 border-4 border-slate-700/30 rounded-full"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
            <div className="absolute inset-3 w-14 h-14 border-2 border-transparent border-t-blue-400/60 rounded-full animate-spin animation-delay-300"></div>
          </div>
          <h3 className="text-2xl font-semibold text-white mb-2">AI 正在分析文档</h3>
          <p className="text-slate-400 mb-8">智能解析文档结构，为您提供最佳翻译方案</p>

          {/* 处理步骤列表 */}
          <div className="space-y-4 text-left max-w-md mx-auto">
            <div className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-lg border border-slate-700/30">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-slate-300">解析 PDF 页面和布局</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-lg border border-slate-700/30">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse animation-delay-150"></div>
              <span className="text-slate-300">识别文本和图像元素</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-lg border border-slate-700/30">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse animation-delay-300"></div>
              <span className="text-slate-300">分析文档复杂度</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-lg border border-slate-700/30">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse animation-delay-450"></div>
              <span className="text-slate-300">预估翻译成本</span>
            </div>
          </div>
        </div>
      </div>
    )
  }



  return null
}

/**
 * 主页组件
 * 包含完整的产品介绍、功能展示和定价信息
 */
export default function HomePage() {
  // FAQ展开状态管理
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  // 支持的文件类型配置
  const fileTypes = [
    { name: "PDF", icon: FileIcon, description: "便携式文档格式" },
    { name: "DOCX", icon: FileText, description: "Word文档" },
    { name: "EPUB", icon: FileIcon, description: "电子书格式" },
    { name: "TXT", icon: FileText, description: "纯文本文件" },
    { name: "MOBI", icon: FileIcon, description: "Kindle格式" },
    { name: "AZW", icon: FileIcon, description: "Amazon格式" },
  ]

  // 应用场景配置
  const scenarios = [
    {
      title: "学术研究",
      description: "精准翻译学术论文，保持专业术语一致性",
      example: "将英文研究论文翻译为中文，保持引用格式和专业术语的准确性",
    },
    {
      title: "商业报告",
      description: "商务文档翻译，维持正式语调和格式",
      example: "财务报表、市场分析报告的多语言转换，保持图表和数据完整性",
    },
    {
      title: "法律合同",
      description: "法律文件翻译，确保条款准确无误",
      example: "合同协议、法律条文的精确翻译，保持法律术语的严谨性",
    },
  ]

  // FAQ数据
  const faqs = [
    {
      question: "我的文档数据安全吗？",
      answer:
        "我们采用企业级加密技术保护您的文档，所有文件在处理完成后24小时内自动删除。我们不会存储或分享您的任何文档内容。",
    },
    {
      question: "支持哪些文件格式？",
      answer: "目前支持PDF、DOCX、EPUB、TXT、MOBI、AZW等主流格式。我们正在不断扩展支持的格式类型。",
    },
    {
      question: "翻译质量如何保证？",
      answer: "我们使用最新的Gemini AI模型，结合专业领域训练，确保翻译质量。同时提供人工校对服务以达到更高标准。",
    },
    {
      question: "如何收费？",
      answer: "我们提供免费体验额度，按字符数收费。企业用户可享受批量折扣和专属服务。",
    },
  ]

  // 定义主题色彩
  const accentColor = "bg-emerald-500 hover:bg-emerald-600"
  const accentColorText = "text-emerald-400"

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* 全局 CSS 动画定义 */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }

        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(-180deg); }
        }

        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-15px) scale(1.1); }
        }

        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        @keyframes particle {
          0% { transform: translateY(100vh) translateX(0px) opacity(0); }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100vh) translateX(100px) opacity(0); }
        }

        @keyframes flow {
          0% { transform: translateX(-100%); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateX(100%); opacity: 0; }
        }

        @keyframes flow-delayed {
          0% { transform: translateX(-100%); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateX(100%); opacity: 0; }
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.5); }
        }

        @keyframes pulse-dot-delayed {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.5); }
        }

        /* 应用动画类 */
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 8s ease-in-out infinite; }
        .animate-float-slow { animation: float-slow 10s ease-in-out infinite; }
        .animate-gradient-shift { animation: gradient-shift 8s ease infinite; background-size: 200% 200%; }
        .animate-particle { animation: particle linear infinite; }
        .animate-flow { animation: flow 2s ease-in-out infinite; }
        .animate-flow-delayed { animation: flow-delayed 2s ease-in-out infinite 1s; }
        .animate-pulse-dot { animation: pulse-dot 2s ease-in-out infinite; }
        .animate-pulse-dot-delayed { animation: pulse-dot-delayed 2s ease-in-out infinite 0.5s; }
      `}</style>

      {/* 导航栏 */}
      <header className="px-4 lg:px-6 h-16 flex items-center border-b border-gray-200 bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <Link className="flex items-center justify-center gap-2" href="/">
          <Mountain className="h-6 w-6 text-blue-600" />
          <span className="font-bold text-xl text-gray-900">格式译专家</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors" href="#features">
            功能特性
          </Link>
          <Link className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors" href="#scenarios">
            应用场景
          </Link>
          <Link className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors" href="#faq">
            常见问题
          </Link>
        </nav>
        <div className="ml-6 flex gap-2">
          <Button variant="ghost" asChild>
            <Link href="/login">登录</Link>
          </Button>
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link href="/workspace">免费体验</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        {/* 英雄区域 */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl text-gray-900">
                  专业文档翻译
                  <span className="text-blue-600">保持格式完美</span>
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-600 md:text-xl">
                  基于最新AI技术，为您提供高质量的文档翻译服务。支持多种格式，完美保持原文档布局和样式。
                </p>
              </div>
              <div className="space-x-4">
                <Button size="lg" asChild className="bg-blue-600 hover:bg-blue-700">
                  <Link href="/user-type">
                    立即开始翻译
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg">
                  观看演示
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* 支持的文件类型 */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-white">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl text-gray-900 mb-4">支持多种文件格式</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                无论是PDF、Word文档还是电子书格式，我们都能完美处理并保持原有格式
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {fileTypes.map((type, index) => (
                <Card key={index} className="text-center p-6 hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    <type.icon className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                    <h3 className="font-semibold text-gray-900 mb-2">{type.name}</h3>
                    <p className="text-sm text-gray-600">{type.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* 应用场景 */}
        <section id="scenarios" className="w-full py-12 md:py-24 lg:py-32 bg-gray-50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl text-gray-900 mb-4">专业应用场景</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">针对不同行业和用途，提供专业化的翻译解决方案</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {scenarios.map((scenario, index) => (
                <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">{scenario.title}</h3>
                    <p className="text-gray-600 mb-4">{scenario.description}</p>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>示例：</strong>
                        {scenario.example}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* 技术支持 */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-white">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl text-gray-900 mb-4">技术驱动，品质保证</h2>
              <p className="text-gray-600 max-w-2xl mx-auto mb-8">采用业界领先的AI技术，确保翻译质量和效率</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="text-center p-6">
                <CardContent className="p-0">
                  <Brain className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">最新Gemini模型</h3>
                  <p className="text-gray-600">基于Google最新的Gemini AI模型，提供更准确、更自然的翻译结果</p>
                </CardContent>
              </Card>
              <Card className="text-center p-6">
                <CardContent className="p-0">
                  <Database className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">专业术语库</h3>
                  <p className="text-gray-600">内置各行业专业术语库，确保专业词汇翻译的准确性和一致性</p>
                </CardContent>
              </Card>
              <Card className="text-center p-6">
                <CardContent className="p-0">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">智能格式保持</h3>
                  <p className="text-gray-600">先进的格式识别技术，完美保持原文档的布局、字体和样式</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ部分 */}
        <section id="faq" className="w-full py-12 md:py-24 lg:py-32 bg-gray-50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl text-gray-900 mb-4">常见问题</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">关于数据安全、使用方法和服务质量的常见问题解答</p>
            </div>
            <div className="max-w-3xl mx-auto space-y-4">
              {faqs.map((faq, index) => (
                <Card key={index} className="overflow-hidden">
                  <button
                    className="w-full p-6 text-left hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">{faq.question}</h3>
                      <ChevronDown
                        className={`h-5 w-5 text-gray-500 transition-transform ${
                          expandedFaq === index ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </button>
                  {expandedFaq === index && (
                    <div className="px-6 pb-6">
                      <p className="text-gray-600">{faq.answer}</p>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA部分 */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-blue-600">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl text-white">准备开始您的翻译之旅？</h2>
                <p className="mx-auto max-w-[600px] text-blue-100 md:text-xl">
                  立即体验专业的文档翻译服务，让语言不再成为沟通的障碍
                </p>
              </div>
              <div className="space-x-4">
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/workspace">
                    免费开始翻译
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 页脚 */}
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t border-gray-200 bg-white">
        <p className="text-xs text-gray-600">© 2024 格式译专家. 保留所有权利.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs text-gray-600 hover:text-gray-900 transition-colors" href="#">
            服务条款
          </Link>
          <Link className="text-xs text-gray-600 hover:text-gray-900 transition-colors" href="#">
            隐私政策
          </Link>
          <Link className="text-xs text-gray-600 hover:text-gray-900 transition-colors" href="#">
            联系我们
          </Link>
        </nav>
      </footer>
    </div>
  )
}
