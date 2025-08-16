"use client"

import { Mountain } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

// 翻译处理步骤
const translationSteps = [
  { status: "正在解析文档...", duration: 1500 },
  { status: "正在调用Gemini API进行翻译...", duration: 3000 },
  { status: "翻译完毕，正在排版...", duration: 2000 },
  { status: "文档生成完毕！", duration: 1500 },
]

export default function ReaderTranslatingPage() {
  const router = useRouter()
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
        // 完成后跳转到下载页面
        setTimeout(() => {
          router.push('/reader-download')
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* 简洁的头部 */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Mountain className="h-6 w-6 text-blue-600" />
            <span className="font-semibold text-gray-900">格式译专家</span>
          </Link>
          <span className="text-sm text-gray-500">正在翻译</span>
        </div>
      </header>

      {/* 翻译进度内容 */}
      <div className="flex-1 flex items-center justify-center p-8 min-h-[calc(100vh-73px)]">
        <div className="w-full max-w-xl">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-8">正在为您翻译文档</h2>

              {/* 步骤显示 */}
              <div className="space-y-4 mb-8">
                {translationSteps.map((step, index) => (
                  <div
                    key={index}
                    className={`
                      flex items-center gap-3 p-3 rounded-lg transition-all duration-300
                      ${index < currentStepIndex 
                        ? 'bg-green-50 text-green-700' 
                        : index === currentStepIndex 
                          ? 'bg-blue-50 text-blue-700 scale-105' 
                          : 'bg-gray-50 text-gray-400'
                      }
                    `}
                  >
                    <div className="flex-shrink-0">
                      {index < currentStepIndex ? (
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      ) : index === currentStepIndex ? (
                        <div className="w-6 h-6 bg-blue-500 rounded-full animate-pulse" />
                      ) : (
                        <div className="w-6 h-6 bg-gray-300 rounded-full" />
                      )}
                    </div>
                    <span className={`text-sm font-medium ${index <= currentStepIndex ? '' : 'opacity-50'}`}>
                      {step.status}
                    </span>
                  </div>
                ))}
              </div>

              {/* 进度条 */}
              <div className="relative">
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${translationProgress}%` }}
                  />
                </div>
                <p className="text-center text-sm text-gray-600 mt-2">
                  {Math.round(translationProgress)}% 完成
                </p>
              </div>

              {/* 提示信息 */}
              <p className="text-sm text-gray-500 mt-6">
                请稍候，AI正在努力为您翻译...
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 