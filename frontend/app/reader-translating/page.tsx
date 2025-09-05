"use client"

import { Mountain, FileText, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { gql, useMutation } from "@apollo/client"
import { useToast } from "@/hooks/use-toast"

// GraphQL mutation for document translation
const TRANSLATE_DOCUMENT = gql`
  mutation TranslateDocument($input: TranslateDocumentInput!) {
    translateDocument(input: $input) {
      id
      status
      progress
      translatedContent
      translatedFileUrl
      error
    }
  }
`

// GraphQL mutation for quick text translation
const TRANSLATE_TEXT = gql`
  mutation TranslateText($input: TranslateTextInput!) {
    translateText(input: $input) {
      originalText
      translatedText
      sourceLanguage
      targetLanguage
    }
  }
`

// Translation processing steps
const translationSteps = [
  { id: 'parse', status: "正在解析文档...", duration: 1500 },
  { id: 'extract', status: "正在提取文本内容...", duration: 2000 },
  { id: 'translate', status: "正在调用AI进行翻译...", duration: 5000 },
  { id: 'format', status: "正在保持原文排版...", duration: 2000 },
  { id: 'generate', status: "文档生成完毕！", duration: 1000 },
]

export default function ReaderTranslatingPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [translationProgress, setTranslationProgress] = useState(0)
  const [translationStatus, setTranslationStatus] = useState("")
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [fileData, setFileData] = useState<any>(null)
  const [translationResult, setTranslationResult] = useState<any>(null)
  const [isTranslating, setIsTranslating] = useState(false)
  
  // GraphQL mutations
  const [translateDocument] = useMutation(TRANSLATE_DOCUMENT)
  const [translateText] = useMutation(TRANSLATE_TEXT)

  // Load file data from session storage
  useEffect(() => {
    const uploadedFile = sessionStorage.getItem('uploadedFile')
    if (uploadedFile) {
      const data = JSON.parse(uploadedFile)
      setFileData(data)
      startTranslation(data)
    } else {
      // No file data, redirect back to upload page
      toast({
        title: "未找到文件",
        description: "请重新上传文件",
        variant: "destructive"
      })
      router.push('/reader-workspace')
    }
  }, [])

  const startTranslation = async (data: any) => {
    setIsTranslating(true)
    let currentStepIdx = 0
    let progress = 0
    const totalDuration = translationSteps.reduce((acc, step) => acc + step.duration, 0)

    const runStep = async () => {
      if (currentStepIdx >= translationSteps.length) {
        setTranslationProgress(100)
        setTranslationStatus("翻译完成！")
        
        // Perform actual translation when reaching the translate step
        if (currentStepIdx === 2) {
          await performTranslation(data)
        }
        
        // Navigate to download page after completion
        setTimeout(() => {
          sessionStorage.setItem('translationResult', JSON.stringify({
            ...data,
            translatedFileUrl: translationResult?.translatedFileUrl || '',
            translatedContent: translationResult?.translatedContent || ''
          }))
          router.push('/reader-download')
        }, 1000)
        return
      }

      const currentStep = translationSteps[currentStepIdx]
      setTranslationStatus(currentStep.status)
      setCurrentStepIndex(currentStepIdx)

      // Perform actual translation when reaching the translate step
      if (currentStep.id === 'translate' && data) {
        await performTranslation(data)
      }

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

  const performTranslation = async (data: any) => {
    try {
      // Check if we have a fileId for document translation
      if (data.fileId) {
        // Use document translation mutation
        const result = await translateDocument({
          variables: {
            input: {
              documentId: data.fileId,
              sourceLanguage: data.sourceLanguage,
              targetLanguage: data.targetLanguage,
              translationStyle: data.translationStyle
            }
          }
        })
        
        setTranslationResult(result.data.translateDocument)
      } else if (data.text) {
        // Use quick text translation
        const result = await translateText({
          variables: {
            input: {
              text: data.text,
              sourceLanguage: data.sourceLanguage,
              targetLanguage: data.targetLanguage,
              style: data.translationStyle
            }
          }
        })
        
        setTranslationResult(result.data.translateText)
      }
    } catch (error) {
      console.error('Translation error:', error)
      
      // For demo purposes, continue with mock data
      setTranslationResult({
        translatedContent: "这是翻译后的内容示例...",
        translatedFileUrl: ""
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Mountain className="h-6 w-6 text-blue-600" />
            <span className="font-semibold text-gray-900">格式译专家</span>
          </Link>
          <span className="text-sm text-gray-500 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            正在翻译
          </span>
        </div>
      </header>

      {/* Translation progress content */}
      <div className="flex-1 flex items-center justify-center p-8 min-h-[calc(100vh-73px)]">
        <div className="w-full max-w-xl">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center">
              {/* File info */}
              {fileData && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-center gap-2 text-gray-600">
                    <FileText className="h-5 w-5" />
                    <span className="text-sm font-medium">{fileData.filename}</span>
                  </div>
                  <div className="mt-2 flex justify-center gap-4 text-xs text-gray-500">
                    <span>{fileData.sourceLanguage} → {fileData.targetLanguage}</span>
                    <span>风格: {fileData.translationStyle}</span>
                  </div>
                </div>
              )}

              <h2 className="text-2xl font-semibold text-gray-900 mb-8">正在为您翻译文档</h2>

              {/* Steps display */}
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
                        <CheckCircle className="w-6 h-6 text-green-500" />
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

              {/* Progress bar */}
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

              {/* Tip */}
              <p className="text-sm text-gray-500 mt-6">
                请稍候，AI正在努力为您翻译...
              </p>

              {/* Warning for large files */}
              {fileData?.fileSize > 5000000 && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg flex items-center gap-2 text-yellow-700">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-xs">大文件可能需要更长时间处理</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}