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
  Download,
  CheckCircle,
} from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
  const searchParams = useSearchParams()
  const isReaderMode = searchParams.get('mode') === 'reader'
  
  const [translationProgress, setTranslationProgress] = useState(0)
  const [translationStatus, setTranslationStatus] = useState("")
  const [currentStepIndex, setCurrentStepIndex] = useState(0)

  // 翻译进度模拟
  useEffect(() => {
    let currentStepIdx = 0
    let progress = 0
    const totalDuration = translationSteps.reduce((acc, step) => acc + step.duration, 0)

    const runStep = () => {
      if (currentStepIdx >= translationSteps.length) {
        setTranslationProgress(100)
        setTranslationStatus("翻译完成！")
        setTimeout(() => {
          // 翻译完成后跳转到预览页面
          router.push('/preview')
        }, 1000)
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
  }, [router])

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