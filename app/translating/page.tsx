"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Mountain,
  FileIcon,
  ArrowLeft,
  Languages,
  FileText,
  FileDiff,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Edit3,
} from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"

// 翻译处理步骤
const translationSteps = [
  { status: "文档分割中...", duration: 2000 },
  { status: "提交给AI翻译...", duration: 3000 },
  { status: "文档整合中...", duration: 2500 },
  { status: "自动排版与优化...", duration: 2000 },
]

export default function TranslatingPage() {
  const router = useRouter()
  const [pageState, setPageState] = useState("translating") // translating | completed
  const [translationProgress, setTranslationProgress] = useState(0)
  const [translationStatus, setTranslationStatus] = useState("")
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [previewMode, setPreviewMode] = useState<"side-by-side" | "single">("side-by-side")
  const [feedback, setFeedback] = useState<"good" | "bad" | null>(null)
  const [showFeedbackInput, setShowFeedbackInput] = useState(false)

  // 翻译进度模拟
  useEffect(() => {
    if (pageState === "translating") {
      let currentStepIdx = 0
      let progress = 0
      const totalDuration = translationSteps.reduce((acc, step) => acc + step.duration, 0)

      const runStep = () => {
        if (currentStepIdx >= translationSteps.length) {
          setTranslationProgress(100)
          setTranslationStatus("翻译完成！")
          setTimeout(() => setPageState("completed"), 500)
          return
        }

        const currentStep = translationSteps[currentStepIdx]
        setTranslationStatus(currentStep.status)
        setCurrentStepIndex(currentStepIdx)

        const stepProgress = (currentStep.duration / totalDuration) * 100
        progress += stepProgress
        setTranslationProgress(Math.min(progress, 100))

        setTimeout(() => {
          currentStepIdx++
          runStep()
        }, currentStep.duration)
      }

      runStep()
    }
  }, [pageState])

  if (pageState === "translating") {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        {/* 头部 */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/workspace" className="flex items-center gap-2">
              <Mountain className="h-6 w-6 text-blue-600" />
              <span className="font-semibold text-gray-900">格式译专家</span>
            </Link>
          </div>
        </header>

        {/* 翻译进度内容 */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-2xl p-8 bg-white rounded-lg shadow-lg">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">正在为您处理文档...</h2>

              {/* 流式输出显示 */}
              <div className="bg-gray-900 rounded-lg p-6 mb-8 font-mono text-left text-sm text-gray-300">
                <div className="space-y-2">
                  {translationSteps.map((step, index) => (
                    <div key={index} className="flex items-center gap-2">
                      {index < currentStepIndex ? (
                        <span className="text-emerald-400">✓</span>
                      ) : index === currentStepIndex && translationProgress < 100 ? (
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      ) : (
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      )}
                      <span className={index < currentStepIndex ? "text-gray-300" : index === currentStepIndex ? "text-blue-400" : "text-gray-500"}>
                        {step.status}
                      </span>
                    </div>
                  ))}
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
      </div>
    )
  }

  // 翻译完成状态
  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-y-auto">
      {/* 头部 */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/workspace" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回工作台
              </Link>
            </Button>
            <div className="h-6 w-px bg-gray-300"></div>
            <Link href="/" className="flex items-center gap-2">
              <Mountain className="h-6 w-6 text-blue-600" />
              <span className="font-semibold text-gray-900">格式译专家</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 主要内容 */}
      <div className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          {/* 操作面板 */}
          <Card className="mb-6 bg-white border-gray-200">
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileIcon className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="font-semibold text-gray-900">文档名称.pdf</p>
                    <p className="text-sm text-gray-500">翻译完成 • 2.5 MB</p>
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

                  <Button variant="outline" size="sm" onClick={() => router.push("/workspace")}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    重新翻译
                  </Button>

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

          {/* 预览区域 */}
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            {/* 原文预览 */}
            <div
              className={cn(
                "bg-gray-50 rounded-lg border border-gray-200 p-6 h-[600px] flex flex-col",
                previewMode === "single" && "hidden lg:flex"
              )}
            >
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                原文预览
              </h4>
              <div className="flex-1 bg-white rounded-lg border border-gray-200 p-4 overflow-y-auto">
                <div className="text-gray-600 leading-relaxed">
                  <p className="mb-4">这里显示原文档的内容...</p>
                  <p className="mb-4">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut
                    labore et dolore magna aliqua.
                  </p>
                </div>
              </div>
            </div>

            {/* 译文预览 */}
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 h-[600px] flex flex-col">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Languages className="h-5 w-5" />
                译文预览
              </h4>
              <div className="flex-1 bg-white rounded-lg border border-gray-200 p-4 overflow-y-auto">
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