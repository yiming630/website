"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Mountain,
  Languages,
  Copy,
  RotateCcw,
  Volume2,
  FileText,
  Sparkles,
  ArrowRight,
  Globe,
  Zap,
  CheckCircle2,
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"

/**
 * 在线翻译页面组件
 * 提供实时文本翻译功能
 */
export default function TranslatePage() {
  // 翻译状态
  const [sourceText, setSourceText] = useState("")
  const [translatedText, setTranslatedText] = useState("")
  const [sourceLanguage, setSourceLanguage] = useState("auto")
  const [targetLanguage, setTargetLanguage] = useState("zh-cn")
  const [isTranslating, setIsTranslating] = useState(false)
  const [translationProgress, setTranslationProgress] = useState(0)

  // 支持的语言
  const languages = [
    { code: "auto", name: "自动检测" },
    { code: "zh-cn", name: "简体中文" },
    { code: "zh-tw", name: "繁体中文" },
    { code: "en", name: "英语" },
    { code: "ja", name: "日语" },
    { code: "ko", name: "韩语" },
    { code: "fr", name: "法语" },
    { code: "de", name: "德语" },
    { code: "es", name: "西班牙语" },
    { code: "ru", name: "俄语" },
    { code: "it", name: "意大利语" },
    { code: "pt", name: "葡萄牙语" },
  ]

  /**
   * 执行翻译
   */
  const handleTranslate = async () => {
    if (!sourceText.trim()) return

    setIsTranslating(true)
    setTranslationProgress(0)

    // 模拟翻译进度
    const progressInterval = setInterval(() => {
      setTranslationProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 200)

    // 模拟翻译请求
    setTimeout(() => {
      clearInterval(progressInterval)
      setTranslationProgress(100)

      // 模拟翻译结果
      const mockTranslation = sourceText.includes("hello")
        ? "你好，这是一个翻译示例。"
        : "这是翻译后的文本内容，展示了AI翻译的效果。"

      setTranslatedText(mockTranslation)
      setIsTranslating(false)

      setTimeout(() => setTranslationProgress(0), 1000)
    }, 2000)
  }

  /**
   * 复制文本到剪贴板
   */
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // 这里可以添加成功提示
    } catch (err) {
      console.error("复制失败:", err)
    }
  }

  /**
   * 交换源语言和目标语言
   */
  const swapLanguages = () => {
    if (sourceLanguage === "auto") return

    const tempLang = sourceLanguage
    setSourceLanguage(targetLanguage)
    setTargetLanguage(tempLang)

    // 交换文本内容
    const tempText = sourceText
    setSourceText(translatedText)
    setTranslatedText(tempText)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 导航栏 */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Mountain className="h-6 w-6 text-blue-600" />
            <span className="font-semibold text-gray-900">格式译专家</span>
          </Link>

          <nav className="flex items-center gap-6">
            <Link href="/workspace" className="text-gray-600 hover:text-gray-900">
              文档翻译
            </Link>
            <Link href="/translate" className="text-blue-600 font-medium">
              在线翻译
            </Link>
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
              仪表板
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="outline" asChild>
              <Link href="/login">登录</Link>
            </Button>
            <Button asChild>
              <Link href="/workspace">文档翻译</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">在线文本翻译</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            快速翻译文本内容，支持多种语言互译，基于AI技术提供准确流畅的翻译结果
          </p>
        </div>

        {/* 翻译界面 */}
        <Card className="mb-8">
          <CardContent className="p-6">
            {/* 语言选择栏 */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1">
                <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={swapLanguages}
                disabled={sourceLanguage === "auto"}
                className="flex-shrink-0"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>

              <div className="flex-1">
                <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages
                      .filter((lang) => lang.code !== "auto")
                      .map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 翻译输入输出区域 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 源文本输入 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">原文</label>
                  <span className="text-xs text-gray-500">{sourceText.length} / 5000 字符</span>
                </div>
                <Textarea
                  value={sourceText}
                  onChange={(e) => setSourceText(e.target.value)}
                  placeholder="请输入要翻译的文本..."
                  className="h-48 resize-none"
                  maxLength={5000}
                />
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleTranslate}
                    disabled={!sourceText.trim() || isTranslating}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isTranslating ? (
                      <>
                        <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                        翻译中...
                      </>
                    ) : (
                      <>
                        <Languages className="h-4 w-4 mr-2" />
                        翻译
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => setSourceText("")} disabled={!sourceText}>
                    清空
                  </Button>
                </div>
              </div>

              {/* 译文输出 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">译文</label>
                  {translatedText && (
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(translatedText)}>
                        <Copy className="h-4 w-4 mr-1" />
                        复制
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Volume2 className="h-4 w-4 mr-1" />
                        朗读
                      </Button>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <Textarea
                    value={translatedText}
                    readOnly
                    placeholder="翻译结果将显示在这里..."
                    className="h-48 resize-none bg-gray-50"
                  />
                  {isTranslating && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <p className="text-sm text-gray-600">AI正在翻译中...</p>
                        {translationProgress > 0 && (
                          <div className="w-32 mx-auto mt-2">
                            <Progress value={translationProgress} className="h-1" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 功能特色 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">实时翻译</h3>
              <p className="text-sm text-gray-600">基于最新AI技术，提供快速准确的实时翻译服务</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Globe className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">多语言支持</h3>
              <p className="text-sm text-gray-600">支持12种主流语言互译，满足不同场景需求</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">高质量输出</h3>
              <p className="text-sm text-gray-600">智能语境理解，确保翻译结果准确自然</p>
            </CardContent>
          </Card>
        </div>

        {/* 升级提示 */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">需要翻译完整文档？</h3>
                  <p className="text-sm text-blue-700">使用我们的文档翻译功能，完美保持原文档格式和布局</p>
                </div>
              </div>
              <Button asChild className="bg-blue-600 hover:bg-blue-700">
                <Link href="/workspace">
                  文档翻译
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
